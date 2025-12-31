# AWS\_DEPLOY\_ROLE policy hardening (example)

GitHub Actions で `aws-actions/configure-aws-credentials` が Assume するロールは、以下のように最小権限へ絞ることを推奨します。値は自分のアカウント情報・バケット名・ディストリビューション ID に置き換えてください。

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AssumeCdkBootstrapRoles",
      "Effect": "Allow",
      "Action": "sts:AssumeRole",
      "Resource": [
        "arn:aws:iam::*:role/cdk-hnb659fds-cfn-execution-role-*",
        "arn:aws:iam::*:role/cdk-hnb659fds-file-publishing-role-*",
        "arn:aws:iam::*:role/cdk-hnb659fds-image-publishing-role-*"
      ]
    },
    {
      "Sid": "AccessCdkAssetBuckets",
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket",
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": [
        "arn:aws:s3:::cdk-hnb659fds-assets-*",
        "arn:aws:s3:::cdk-hnb659fds-assets-*/*"
      ]
    },
    {
      "Sid": "FrontendDeploy",
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket",
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": [
        "arn:aws:s3:::<frontend-bucket-name>",
        "arn:aws:s3:::<frontend-bucket-name>/*"
      ]
    },
    {
      "Sid": "InvalidateCloudFront",
      "Effect": "Allow",
      "Action": "cloudfront:CreateInvalidation",
      "Resource": "arn:aws:cloudfront::<account-id>:distribution/<distribution-id>"
    }
  ]
}
```

CDK が CloudFormation 経由で各リソースを作成・更新するため、基本的には上記で十分です。CloudFormation スタック操作を直接許可したい場合は `cloudformation:Describe*` / `List*` 程度のリード系を追加してください。
