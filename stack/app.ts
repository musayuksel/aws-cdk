#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib'
import { MusaApiLambdaCrudDynamoDBStack } from './crud-api-cdk-stack'

const app = new cdk.App()
// eslint-disable-next-line no-new
new MusaApiLambdaCrudDynamoDBStack(app, 'musaApiLambdaCrudDynamoDBStack')
