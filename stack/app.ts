#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib'
import { MusaApiLambdaCrudDynamoDBStack } from './api/crud-api-cdk-stack'
import { MusaCrudApiPipelineStack } from './pipeline/pipeline-stack'

const app = new cdk.App()

// Repository and connection details
const repositoryOwner = 'musayuksel'
const repositoryName = 'aws'
const branchName = 'pipeline-setup'
const connectionArn = 'arn:aws:codeconnections:eu-west-1:749144762306:connection/eb9218a5-7ef1-4bde-b7d2-15c98a33ec2d'
const apiStackName = 'MusaApiLambdaCrudDynamoDBStack'

// eslint-disable-next-line no-new
new MusaApiLambdaCrudDynamoDBStack(app, apiStackName)

new MusaCrudApiPipelineStack(app, 'MusaCrudApiPipelineStack', {
  repositoryOwner,
  repositoryName,
  branchName,
  connectionArn,
  apiStackName
})

app.synth()
