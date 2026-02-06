// このスタックでは Annotune 全体の AWS リソースをまとめて定義する。
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { Annotations, Duration, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
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
  ManagedLoginVersion,
  OAuthScope,
  AccountRecovery
} from 'aws-cdk-lib/aws-cognito';
import { Bucket, BlockPublicAccess } from 'aws-cdk-lib/aws-s3';
import {
  Distribution,
  ViewerProtocolPolicy,
  AllowedMethods,
  CachePolicy,
  OriginAccessIdentity
} from 'aws-cdk-lib/aws-cloudfront';
import { S3BucketOrigin } from 'aws-cdk-lib/aws-cloudfront-origins';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const infraDir = currentDir.includes(`${path.sep}dist${path.sep}`)
  ? path.resolve(currentDir, '..', '..')
  : path.resolve(currentDir, '..');
const repoRoot = path.resolve(infraDir, '..');
const backendDir = path.join(repoRoot, 'backend');
const frontendDistDir = path.join(repoRoot, 'frontend/dist');
const frontendAssetDir = fs.existsSync(frontendDistDir)
  ? frontendDistDir
  : (() => {
      const placeholderDir = path.join(infraDir, '.tmp', 'frontend-empty');
      fs.mkdirSync(placeholderDir, { recursive: true });
      return placeholderDir;
    })();

export class AnnotuneStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const webDomainEnv = process.env.ANNOTUNE_WEB_DOMAIN;
    const webDomainNames = (webDomainEnv ? webDomainEnv.split(',') : [])
      .map((name) => name.trim())
      .filter(Boolean);
    const effectiveDomainNames =
      webDomainNames.length > 0 ? webDomainNames : ['www.annotune.net'];
    const oauthCallbackUrlsEnv = process.env.ANNOTUNE_OAUTH_CALLBACK_URLS;
    const oauthLogoutUrlsEnv = process.env.ANNOTUNE_OAUTH_LOGOUT_URLS;
    const oauthCallbackUrls =
      oauthCallbackUrlsEnv && oauthCallbackUrlsEnv.trim().length > 0
        ? oauthCallbackUrlsEnv.split(',').map((url) => url.trim()).filter(Boolean)
        : effectiveDomainNames.map((domain) => `https://${domain}/auth/callback`);
    const oauthLogoutUrls =
      oauthLogoutUrlsEnv && oauthLogoutUrlsEnv.trim().length > 0
        ? oauthLogoutUrlsEnv.split(',').map((url) => url.trim()).filter(Boolean)
        : effectiveDomainNames.map((domain) => `https://${domain}/`);

    // ---- DynamoDB テーブル定義 ----
    const lyricsTable = new Table(this, 'LyricsTable', {
      tableName: 'AnnotuneLyrics',
      partitionKey: { name: 'docId', type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
      pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: true } // 誤削除に備えてポイントインタイム復旧を有効化
    });

    lyricsTable.addGlobalSecondaryIndex({
      indexName: 'ownerId-index',
      partitionKey: { name: 'ownerId', type: AttributeType.STRING },
      projectionType: ProjectionType.ALL
    });

    lyricsTable.addGlobalSecondaryIndex({
      indexName: 'publicStatus-index',
      partitionKey: { name: 'publicStatus', type: AttributeType.STRING },
      projectionType: ProjectionType.ALL
    });

    const annotationsTable = new Table(this, 'AnnotationsTable', {
      tableName: 'AnnotuneAnnotations',
      partitionKey: { name: 'docId', type: AttributeType.STRING },
      sortKey: { name: 'annotationId', type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY // 開発用途のため削除時にテーブルも削除
    });

    const versionsTable = new Table(this, 'VersionsTable', {
      tableName: 'AnnotuneDocVersions',
      partitionKey: { name: 'docId', type: AttributeType.STRING },
      sortKey: { name: 'version', type: AttributeType.NUMBER },
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY
    });

    // ---- 認証（Cognito）リソース ----
    const userPool = new UserPool(this, 'AnnotuneUserPool', {
      selfSignUpEnabled: true,
      signInAliases: { email: true },
      removalPolicy: RemovalPolicy.DESTROY,
      accountRecovery: AccountRecovery.EMAIL_ONLY
    });

    const cognitoDomainPrefix = process.env.ANNOTUNE_COGNITO_DOMAIN_PREFIX;
    if (cognitoDomainPrefix) {
      userPool.addDomain('AnnotuneCognitoDomain', {
        cognitoDomain: { domainPrefix: cognitoDomainPrefix },
        managedLoginVersion: ManagedLoginVersion.NEWER_MANAGED_LOGIN
      });
    } else {
      Annotations.of(this).addWarning(
        'Cognito Hosted UI domain is not set. ' +
          'Set ANNOTUNE_COGNITO_DOMAIN_PREFIX to enable the managed login UI.'
      );
    }

    const userPoolClient = new UserPoolClient(this, 'AnnotuneUserPoolClient', {
      userPool,
      generateSecret: false,
      preventUserExistenceErrors: true,
      oAuth: {
        scopes: [OAuthScope.OPENID, OAuthScope.EMAIL, OAuthScope.PROFILE],
        callbackUrls: oauthCallbackUrls,
        logoutUrls: oauthLogoutUrls,
        flows: {
          implicitCodeGrant: true
        }
      }
    });

    // ---- Lambda（バックエンド） ----
    const handler = new NodejsFunction(this, 'AnnotuneApiHandler', {
      entry: path.join(backendDir, 'src/handlers/router.ts'),
      runtime: Runtime.NODEJS_20_X,
      memorySize: 512,
      timeout: Duration.seconds(10),
      handler: 'handler',
      projectRoot: repoRoot,
      depsLockFilePath: path.join(repoRoot, 'package-lock.json'),
      bundling: {
        externalModules: ['aws-sdk'], // ランタイムに同梱されている aws-sdk をバンドル対象から除外
        nodeModules: ['@aws-sdk/client-dynamodb', '@aws-sdk/lib-dynamodb', 'zod'],
        tsconfig: path.join(backendDir, 'tsconfig.json')
      },
      environment: {
        LYRICS_TABLE_NAME: lyricsTable.tableName,
        LYRICS_OWNER_INDEX_NAME: 'ownerId-index',
        LYRICS_PUBLIC_STATUS_INDEX_NAME: 'publicStatus-index',
        ANNOTATIONS_TABLE_NAME: annotationsTable.tableName,
        VERSIONS_TABLE_NAME: versionsTable.tableName,
        ALLOWED_ORIGIN: `https://${effectiveDomainNames[0]}`
      }
    });

    lyricsTable.grantReadWriteData(handler);
    annotationsTable.grantReadWriteData(handler);
    versionsTable.grantReadWriteData(handler);

    const authorizer = new HttpUserPoolAuthorizer('AnnotuneAuthorizer', userPool, {
      userPoolClients: [userPoolClient]
    });
    const authorizationScopes = ['openid', 'email', 'profile'];

    // ---- API Gateway ----
    const httpApi = new HttpApi(this, 'AnnotuneHttpApi', {
      corsPreflight: {
        allowHeaders: ['Authorization', 'Content-Type', 'X-Doc-Version'],
        allowMethods: [
          CorsHttpMethod.GET,
          CorsHttpMethod.POST,
          CorsHttpMethod.PUT,
          CorsHttpMethod.DELETE,
          CorsHttpMethod.OPTIONS
        ],
        allowOrigins: ['*'],
        maxAge: Duration.days(1)
      },
      // ルート単位で認証を付与するため、デフォルトの authorizer は設定しない
    });

    const integration = new HttpLambdaIntegration('AnnotuneIntegration', handler);

    // 認証が必要なルートの一覧
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
        authorizationScopes
      });
    });

    httpApi.addRoutes({
      path: '/v1/public/lyrics',
      methods: [HttpMethod.GET],
      integration
    });
    httpApi.addRoutes({
      path: '/v1/public/lyrics/{docId}',
      methods: [HttpMethod.GET],
      integration
    });

    // ---- フロントエンド配信（S3 + CloudFront）----
    const frontendBucket = new Bucket(this, 'AnnotuneWebBucket', {
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true
    });

    const webCertArn = process.env.ANNOTUNE_WEB_CERT_ARN;
    const webCertificate = webCertArn
      ? acm.Certificate.fromCertificateArn(this, 'AnnotuneWebCertificate', webCertArn)
      : undefined;
    if (!webCertificate) {
      Annotations.of(this).addWarning(
        'ANNOTUNE_WEB_CERT_ARN is not set. CloudFront will use the default domain.'
      );
    }
    const frontendOrigin = S3BucketOrigin.withOriginAccessControl(frontendBucket);

    const distribution = new Distribution(this, 'AnnotuneDistribution', {
      defaultBehavior: {
        origin: frontendOrigin,
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        cachePolicy: CachePolicy.CACHING_OPTIMIZED // 静的アセットを CloudFront のキャッシュに乗せる
      },
      defaultRootObject: 'index.html',

      domainNames: webCertificate ? effectiveDomainNames : undefined,
      certificate: webCertificate,
      errorResponses: [
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html'
        },
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html'
        }
      ]
    });

    // ビルド済みフロントエンドを S3 に配置し、CloudFront を更新
    new BucketDeployment(this, 'AnnotuneBucketDeployment', {
      sources: [Source.asset(frontendAssetDir)],
      destinationBucket: frontendBucket,
      distribution,
      distributionPaths: ['/*']
    });

    // 主要リソースの識別子を CloudFormation Output として出力
    this.exportValue(httpApi.url ?? '', { name: 'AnnotuneHttpApiUrl' });
    this.exportValue(distribution.domainName, { name: 'AnnotuneWebDistributionDomain' });
    this.exportValue(userPool.userPoolId, { name: 'AnnotuneUserPoolId' });
    this.exportValue(userPoolClient.userPoolClientId, { name: 'AnnotuneUserPoolClientId' });
  }
}
