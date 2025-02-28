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
    const codeBucket = 'musa-yxl-lambda-apigateway-code'
    const codeKey = 'lambda-functions.zip'

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
      // code: lambda.Code.fromBucket(
      //   new cdk.aws_s3.Bucket(this, 'CodeBucket', {
      //     bucketName: codeBucket,
      //   }),
      //   codeKey
      // ),
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
      // code: lambda.Code.fromBucket(
      //   new cdk.aws_s3.Bucket(this, 'CodeBucketForGetPromos', {
      //     bucketName: codeBucket,
      //   }),
      //   codeKey
      // ),
    })

    // API Gateway
    const api = new apigateway.RestApi(this, 'ApiGateway', {
      restApiName: 'MockTVPromotionAPI',
      endpointTypes: [apigateway.EndpointType.REGIONAL],
      defaultCorsPreflightOptions: {
        allowOrigins: ['http://localhost:5173'],
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

// export class SendNotificationStack extends cdk.Stack {
//   readonly cosmosEnvironment: string
//   readonly name: string
//   readonly component: string
//   readonly project: string
//   readonly owner: string
//   readonly runbook: string

//   constructor(scope: Construct, id: string, props?: cdk.StackProps) {
//     super(scope, id, props)
//     const environmentParameter = new CfnParameter(this, 'Environment', {
//       type: 'String',
//       description: 'Environment this stack belongs to',
//       allowedValues: ['int', 'test', 'live']
//     })
//     const componentParameter = new CfnParameter(this, 'Component', {
//       type: 'String',
//       description: 'The name of the component'
//     })
//     const projectParameter = new CfnParameter(this, 'Project', {
//       type: 'String',
//       description: 'The name of the project'
//     })
//     const ownerParameter = new CfnParameter(this, 'Owner', {
//       type: 'String',
//       description: 'The owner of the project'
//     })

//     const runbookParameter = new CfnParameter(this, 'Runbook', {
//       description: 'The runbook url',
//       type: 'String',
//       default: 'undefined'
//     })

//     this.cosmosEnvironment = environmentParameter.valueAsString
//     this.component = componentParameter.valueAsString
//     this.project = projectParameter.valueAsString
//     this.owner = ownerParameter.valueAsString
//     this.name = Fn.join('-', [this.cosmosEnvironment, this.component])
//     this.runbook = runbookParameter.valueAsString

//     Tags.of(this).add('BBCEnvironment', this.cosmosEnvironment)
//     Tags.of(this).add('bbc:environment', this.cosmosEnvironment)
//     Tags.of(this).add('Component', this.component)
//     Tags.of(this).add('BBCComponent', this.component)
//     Tags.of(this).add('bbc:component', this.component)
//     Tags.of(this).add('bbc:project', this.project)
//     Tags.of(this).add('BBCProject', this.project)
//     Tags.of(this).add('Name', this.name)
//     Tags.of(this).add('RunBook', this.runbook)
//     // Import DynamoDB Stream ARN
//     const dynamoDbStreamArn = Fn.importValue(`${this.cosmosEnvironment}-rb-event-audit-db-stream-arn`)
//     // // IAM Role for Lambda
//     // Lambda Function
//     const logDynamoDBStreamLambda = new lambda.Function(this, 'LogDynamoDBStreamLambda', {
//       // eslint-disable-next-line no-template-curly-in-string
//       functionName: Fn.sub('${Environment}-rb-tools-notification-audit-updates'),
//       runtime: lambda.Runtime.NODEJS_20_X,
//       handler: 'index.handler',
//       code: lambda.Code.fromAsset('src/'),
//       // role: lambdaExecutionRole,
//       timeout: cdk.Duration.seconds(30)
//     })
//     logDynamoDBStreamLambda.role?.attachInlinePolicy(
//       new iam.Policy(this, 'DynamoDBPolicy', {
//         // eslint-disable-next-line no-template-curly-in-string
//         policyName: Fn.sub('${Environment}-rb-tools-notification-ddb-policy'),
//         statements: [
//           new iam.PolicyStatement({
//             actions: ['dynamodb:*'],
//             resources: [dynamoDbStreamArn]
//           })

//         ]
//       })
//     )

//     // DynamoDB Stream Event Source Mapping
//     // eslint-disable-next-line no-new
//     new lambda.EventSourceMapping(this, 'AuditEventSourceMapping', {
//       target: logDynamoDBStreamLambda,
//       eventSourceArn: dynamoDbStreamArn,
//       startingPosition: lambda.StartingPosition.LATEST,
//       batchSize: 1,
//       filters: [
//         {
//           pattern: JSON.stringify({
//             eventName: ['INSERT'],
//             dynamodb: {
//               NewImage: {
//                 status: {
//                   S: ['CLEARED', 'PUBLISHED']
//                 }
//               }
//             }
//           })
//         }
//       ]
//     })
//   }

//   protected allocateLogicalId(cfnElement: CfnElement): string {
//     const scopes = cfnElement.node.scopes
//     const stackIndex: number = scopes.indexOf(cfnElement.stack)
//     const pathComponents = scopes.slice(stackIndex + 1).map((x: IConstruct) => {
//       return x.node.id
//         .split('-')
//         .map((s: string) => this.capitalise(s))
//         .join('')
//     })
//     if (pathComponents.lastIndexOf('Resource') === pathComponents.length - 1) {
//       pathComponents.pop()
//     }
//     return pathComponents.map(this.capitalise).map(this.removeNonAlphanumeric).join('')
//   }

//   private removeNonAlphanumeric(s: string): string {
//     return s.replace(/[^A-Za-z0-9]/g, '')
//   }

//   private capitalise(s: string): string {
//     return s.charAt(0).toUpperCase() + s.substr(1)
//   }
// }
