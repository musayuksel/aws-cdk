import * as cdk from 'aws-cdk-lib'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as lambda from 'aws-cdk-lib/aws-lambda'
// import { CfnParameter, Fn, Tags } from 'aws-cdk-lib'

import type { Construct } from 'constructs'
// import type { CfnElement } from 'aws-cdk-lib'

import * as apigateway from 'aws-cdk-lib/aws-apigateway'
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'
import path from 'path'

export class PromoApiCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    // Parameters (defined as properties in CDK)
    const tableName = 'musa-test-lambda-promos-table'
    const allowOrigins = ['http://localhost:5173']

    // DynamoDB Table
    const dynamoTable = new dynamodb.Table(this, 'DynamoDBTable', {
      tableName: tableName,
      partitionKey: {
        name: 'channel',
        type: dynamodb.AttributeType.STRING
      },
      billingMode: dynamodb.BillingMode.PROVISIONED,
      readCapacity: 1,
      writeCapacity: 1,
      removalPolicy: cdk.RemovalPolicy.DESTROY // Change to RETAIN for production
    })

    // Lambda Execution Role
    const lambdaRole = new iam.Role(this, 'LambdaExecutionRole', {
      roleName: 'lambda-apigateway-role',
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com')
    })

    // Add policies to the role
    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          'dynamodb:DeleteItem',
          'dynamodb:GetItem',
          'dynamodb:PutItem',
          'dynamodb:Query',
          'dynamodb:Scan',
          'dynamodb:UpdateItem'
        ],
        resources: [dynamoTable.tableArn]
      })
    )

    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          'logs:CreateLogGroup',
          'logs:CreateLogStream',
          'logs:PutLogEvents'
        ],
        resources: ['arn:aws:logs:*:*:*']
      })
    )

    // Lambda Functions
    const createUserLambda = new lambda.Function(this, 'CreateUserLambda', {
      functionName: 'LambdaFunctionCreateUser',
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'createUser.handler',
      role: lambdaRole,
      environment: {
        TABLE_NAME: tableName
      },
      code: lambda.Code.fromAsset(path.join(__dirname, '../dist'))
    })

    const getUsersLambda = new lambda.Function(this, 'GetUsersLambda', {
      functionName: 'LambdaFunctionGetUsers',
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'getUsers.handler',
      role: lambdaRole,
      environment: {
        TABLE_NAME: tableName
      },
      code: lambda.Code.fromAsset(path.join(__dirname, '../dist'))
    })

    // API Gateway
    const api = new apigateway.RestApi(this, 'ApiGateway', {
      restApiName: 'MockTVPromotionAPI',
      endpointTypes: [apigateway.EndpointType.REGIONAL],
      defaultCorsPreflightOptions: {
        allowOrigins: allowOrigins,
        allowMethods: ['GET', 'POST', 'OPTIONS'],
        allowHeaders: ['Content-Type', 'X-Amz-Date', 'Authorization', 'X-Api-Key', 'X-Amz-Security-Token']
      }
    })

    // API Resources
    const userResource = api.root.addResource('user') //POST /user
    const usersResource = api.root.addResource('users') //GET /users

    // POST /user endpoint
    userResource.addMethod('POST', new apigateway.LambdaIntegration(createUserLambda), {
      methodResponses: [
        {
          statusCode: '200',
          responseParameters: {
            'method.response.header.Access-Control-Allow-Origin': true,
            'method.response.header.Access-Control-Allow-Headers': true,
            'method.response.header.Access-Control-Allow-Methods': true
          }
        }
      ]
    })

    // GET /promos endpoint
    usersResource.addMethod('GET', new apigateway.LambdaIntegration(getUsersLambda), {
      methodResponses: [
        {
          statusCode: '200',
          responseParameters: {
            'method.response.header.Access-Control-Allow-Origin': true,
            'method.response.header.Access-Control-Allow-Headers': true,
            'method.response.header.Access-Control-Allow-Methods': true
          }
        }
      ]
    })

    // API Gateway roles and permissions are handled automatically by CDK

    // Output
    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: `https://${api.restApiId}.execute-api.${this.region}.amazonaws.com/prod/users`,
      description: 'Endpoint URL of the deployed API'
    })
  }
}
