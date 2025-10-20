import * as path from 'path';
import { Duration, RemovalPolicy, Stack, StackProps, aws_iam as iam } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {
  AttributeType,
  BillingMode,
  Table,
  ProjectionType
} from 'aws-cdk-lib/aws-dynamodb';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import {
  HttpApi,
  HttpMethod,
  CorsHttpMethod
} from 'aws-cdk-lib/aws-apigatewayv2';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import { HttpUserPoolAuthorizer } from 'aws-cdk-lib/aws-apigatewayv2-authorizers';
import {
  UserPool,
  UserPoolClient,
  OAuthScope,
  AccountRecovery
} from 'aws-cdk-lib/aws-cognito';
import { Bucket, BlockPublicAccess } from 'aws-cdk-lib/aws-s3';
import {
  Distribution,
  ViewerProtocolPolicy,
  AllowedMethods,
  CachePolicy
} from 'aws-cdk-lib/aws-cloudfront';
import { S3Origin } from 'aws-cdk-lib/aws-cloudfront-origins';
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment';

export class AnnotuneStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const lyricsTable = new Table(this, 'LyricsTable', {
      tableName: 'AnnotuneLyrics',
      partitionKey: { name: 'docId', type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
      pointInTimeRecovery: true
    });

    lyricsTable.addGlobalSecondaryIndex({
      indexName: 'ownerId-index',
      partitionKey: { name: 'ownerId', type: AttributeType.STRING },
      projectionType: ProjectionType.ALL
    });

    const annotationsTable = new Table(this, 'AnnotationsTable', {
      tableName: 'AnnotuneAnnotations',
      partitionKey: { name: 'docId', type: AttributeType.STRING },
      sortKey: { name: 'annotationId', type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY
    });

    const versionsTable = new Table(this, 'VersionsTable', {
      tableName: 'AnnotuneDocVersions',
      partitionKey: { name: 'docId', type: AttributeType.STRING },
      sortKey: { name: 'version', type: AttributeType.NUMBER },
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY
    });

    const userPool = new UserPool(this, 'AnnotuneUserPool', {
      selfSignUpEnabled: true,
      signInAliases: { email: true },
      removalPolicy: RemovalPolicy.DESTROY,
      accountRecovery: AccountRecovery.EMAIL_ONLY
    });

    const userPoolClient = new UserPoolClient(this, 'AnnotuneUserPoolClient', {
      userPool,
      generateSecret: false,
      preventUserExistenceErrors: true,
      oAuth: {
        scopes: [OAuthScope.OPENID, OAuthScope.EMAIL, OAuthScope.PROFILE]
      }
    });

    const handler = new NodejsFunction(this, 'AnnotuneApiHandler', {
      entry: path.join(__dirname, '../../backend/src/handlers/router.ts'),
      runtime: Runtime.NODEJS_20_X,
      memorySize: 512,
      timeout: Duration.seconds(10),
      handler: 'handler',
      projectRoot: path.join(__dirname, '../../backend'),
      tsconfig: path.join(__dirname, '../../backend/tsconfig.json'),
      bundling: {
        externalModules: ['aws-sdk']
      },
      environment: {
        LYRICS_TABLE_NAME: lyricsTable.tableName,
        LYRICS_OWNER_INDEX_NAME: 'ownerId-index',
        ANNOTATIONS_TABLE_NAME: annotationsTable.tableName,
        VERSIONS_TABLE_NAME: versionsTable.tableName,
        ALLOWED_ORIGIN: '*'
      }
    });

    handler.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['dynamodb:*'],
        resources: [
          lyricsTable.tableArn,
          annotationsTable.tableArn,
          versionsTable.tableArn,
          `${lyricsTable.tableArn}/index/*`
        ]
      })
    );

    const authorizer = new HttpUserPoolAuthorizer('AnnotuneAuthorizer', userPool, {
      userPoolClients: [userPoolClient]
    });

    const httpApi = new HttpApi(this, 'AnnotuneHttpApi', {
      corsPreflight: {
        allowHeaders: ['Authorization', 'Content-Type', 'X-Doc-Version'],
        allowMethods: [
          HttpMethod.GET,
          HttpMethod.POST,
          HttpMethod.PUT,
          HttpMethod.DELETE,
          HttpMethod.OPTIONS
        ],
        allowOrigins: ['*'],
        maxAge: Duration.days(1)
      }
    });

    const integration = new HttpLambdaIntegration('AnnotuneIntegration', handler);

    const protectedRoutes: { path: string; method: HttpMethod; handler: string }[] = [
      { path: '/v1/lyrics', method: HttpMethod.POST, handler: 'createLyricHandler' },
      { path: '/v1/lyrics', method: HttpMethod.GET, handler: 'listLyricsHandler' },
      { path: '/v1/lyrics/{docId}', method: HttpMethod.GET, handler: 'getLyricHandler' },
      { path: '/v1/lyrics/{docId}', method: HttpMethod.PUT, handler: 'updateLyricHandler' },
      { path: '/v1/lyrics/{docId}', method: HttpMethod.DELETE, handler: 'deleteLyricHandler' },
      { path: '/v1/lyrics/{docId}/share', method: HttpMethod.POST, handler: 'shareLyricHandler' },
      {
        path: '/v1/lyrics/{docId}/annotations',
        method: HttpMethod.POST,
        handler: 'createAnnotationHandler'
      },
      {
        path: '/v1/lyrics/{docId}/annotations/{annotationId}',
        method: HttpMethod.PUT,
        handler: 'updateAnnotationHandler'
      },
      {
        path: '/v1/lyrics/{docId}/annotations/{annotationId}',
        method: HttpMethod.DELETE,
        handler: 'deleteAnnotationHandler'
      },
      {
        path: '/v1/lyrics/{docId}/versions',
        method: HttpMethod.GET,
        handler: 'listVersionsHandler'
      },
      {
        path: '/v1/lyrics/{docId}/versions/{version}',
        method: HttpMethod.GET,
        handler: 'getVersionHandler'
      }
    ];

    protectedRoutes.forEach((route) => {
      httpApi.addRoutes({
        path: route.path,
        methods: [route.method],
        integration,
        authorizer,
        authorizerOptions: {
          authorizerName: 'AnnotuneUserAuthorizer'
        }
      });
    });

    httpApi.addRoutes({
      path: '/v1/public/lyrics/{docId}',
      methods: [HttpMethod.GET],
      integration,
      authorizer: undefined
    });

    const frontendBucket = new Bucket(this, 'AnnotuneWebBucket', {
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true
    });

    const distribution = new Distribution(this, 'AnnotuneDistribution', {
      defaultBehavior: {
        origin: new S3Origin(frontendBucket),
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        cachePolicy: CachePolicy.CACHING_OPTIMIZED
      },
      defaultRootObject: 'index.html'
    });

    new BucketDeployment(this, 'AnnotuneBucketDeployment', {
      sources: [Source.asset(path.join(__dirname, '../../frontend/dist'))],
      destinationBucket: frontendBucket,
      distribution,
      distributionPaths: ['/*']
    });

    this.exportValue(httpApi.url ?? '', { name: 'AnnotuneHttpApiUrl' });
    this.exportValue(distribution.domainName, { name: 'AnnotuneWebDistributionDomain' });
    this.exportValue(userPool.userPoolId, { name: 'AnnotuneUserPoolId' });
    this.exportValue(userPoolClient.userPoolClientId, { name: 'AnnotuneUserPoolClientId' });
  }
}
