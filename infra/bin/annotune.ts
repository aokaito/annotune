#!/usr/bin/env node
// このファイルは CDK アプリケーションのエントリーポイントでタックをデプロイする。
import 'source-map-support/register.js';
import * as cdk from 'aws-cdk-lib';
import { AnnotuneStack } from '../lib/annotune-stack.js';

const app = new cdk.App();

new AnnotuneStack(app, 'AnnotuneStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION ?? 'ap-northeast-1'
  },
  crossRegionReferences: true // Lambda@Edge (us-east-1) のクロスリージョン参照を有効化
});
