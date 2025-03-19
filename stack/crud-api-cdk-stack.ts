import {
  AuthorizationType,
  CognitoUserPoolsAuthorizer,
  Cors,
  IResource,
  LambdaIntegration,
  MockIntegration,
  PassthroughBehavior,
  RestApi
} from 'aws-cdk-lib/aws-apigateway'
import { AttributeType, Table, BillingMode } from 'aws-cdk-lib/aws-dynamodb'
import { Runtime } from 'aws-cdk-lib/aws-lambda'
import { App, Stack, RemovalPolicy, CfnElement, CfnOutput } from 'aws-cdk-lib'
import { NodejsFunction, NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs'
import { join } from 'path'
import { IConstruct } from 'constructs'
import { AccountRecovery, UserPool, UserPoolClient } from 'aws-cdk-lib/aws-cognito'

export class MusaApiLambdaCrudDynamoDBStack extends Stack {
  constructor(app: App, id: string) {
    super(app, id)

    const dynamoTable = new Table(this, 'MusaTestItems', {
      tableName: 'MusaTestItemsTable',
      partitionKey: {
        name: 'PK', // Changed to PK
        type: AttributeType.STRING
      },
      sortKey: {
        name: 'SK', // Added Sort Key
        type: AttributeType.STRING
      },
      billingMode: BillingMode.PROVISIONED,
      readCapacity: 1,
      writeCapacity: 1,

      /**
       *  The default removal policy is RETAIN, which means that cdk destroy will not attempt to delete
       * the new table, and it will remain in your account until manually deleted. By setting the policy to
       * DESTROY, cdk destroy will delete the table (even if it has data in it)
       */
      removalPolicy: RemovalPolicy.DESTROY // NOT recommended for production code
    })

    // Cognito User Pool
    const userPool = new UserPool(this, 'MusaUserPool', {
      userPoolName: 'MusaUserPool',
      signInCaseSensitive: false, // Do not differentiate email case
      selfSignUpEnabled: true, // Allow users to sign up themselves
      signInAliases: { email: true }, // Set email as an alias
      autoVerify: { email: true }, // Automatically verify email addresses
      standardAttributes: {
        email: {
          required: true,
          mutable: false
        }
      },
      userVerification: {
        emailSubject: 'Verify your email for our awesome app!',
        emailBody: 'Hi there, Thanks for signing up to our awesome app! Your verification code is {####}'
      },
      accountRecovery: AccountRecovery.EMAIL_ONLY,
      removalPolicy: RemovalPolicy.DESTROY // NOT recommended for production code
    })

    // Cognito Client
    const userPoolClient = new UserPoolClient(this, 'MusaUserPoolClient', {
      userPool,
      authFlows: {
        userPassword: true,
        userSrp: true
      }
    })

    // Create the Cognito Authorizer
    const authorizer = new CognitoUserPoolsAuthorizer(this, 'MusaApiAuthorizer', {
      cognitoUserPools: [userPool],
      authorizerName: 'musa-user-pool-authorizer',
      identitySource: 'method.request.header.Authorization'
    })

    const nodeJsFunctionProps: NodejsFunctionProps = {
      bundling: {
        externalModules: [
          'aws-sdk' // Use the 'aws-sdk' available in the Lambda runtime

        ]
      },
      depsLockFilePath: join(__dirname, '../', 'package-lock.json'),
      environment: {
        PRIMARY_KEY: 'itemId',
        TABLE_NAME: dynamoTable.tableName,
        USER_POOL_ID: userPool.userPoolId, // Pass User Pool ID to Lambda
        USER_POOL_CLIENT_ID: userPoolClient.userPoolClientId // Pass Client ID to Lambda
      },
      runtime: Runtime.NODEJS_20_X
    }

    // Create a Lambda function for each of the CRUD operations
    const getAllCategoriesLambda = new NodejsFunction(this, 'getAllItemsFunction', {
      entry: join(__dirname, '../src', 'index.ts'),
      handler: 'getCategoriesHandler',
      ...nodeJsFunctionProps
    })
    const getExamQuestionsLambda = new NodejsFunction(this, 'getExamQuestionsFunction', {
      entry: join(__dirname, '../src', 'index.ts'),
      handler: 'getExamQuestionsHandler',
      ...nodeJsFunctionProps
    })

    const postCategoryLambda = new NodejsFunction(this, 'postCategoryFunction', {
      entry: join(__dirname, '../src', 'index.ts'),
      handler: 'postCategoryHandler',
      ...nodeJsFunctionProps
    })
    // Grant the Lambda function read access to the DynamoDB table
    dynamoTable.grantReadWriteData(getAllCategoriesLambda)
    dynamoTable.grantReadWriteData(getExamQuestionsLambda)
    dynamoTable.grantReadWriteData(postCategoryLambda)

    // Integrate the Lambda functions with the API Gateway resource
    const getAllItemsIntegration = new LambdaIntegration(getAllCategoriesLambda)
    const getExamQuestionsIntegration = new LambdaIntegration(getExamQuestionsLambda)
    const postCategoryIntegration = new LambdaIntegration(postCategoryLambda)

    // Create an API Gateway resource for each of the CRUD operations
    const api = new RestApi(this, 'itemsApi', {
      restApiName: 'MusaTest Items Service',
      defaultCorsPreflightOptions: {
        allowOrigins: Cors.ALL_ORIGINS, // Allow all origins
        allowMethods: Cors.ALL_METHODS, // Allow all methods (GET, POST, etc.)
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
          'X-Amz-Security-Token',
          'X-Amz-User-Agent'
        ]
        // allowHeaders: Cors.DEFAULT_HEADERS // Allow default headers (Authorization, Content-Type, etc.)
      }
      // In case you want to manage binary types, uncomment the following
      // binaryMediaTypes: ["*/*"],
    })

    const categories = api.root.addResource('categories') // GET /categories

    categories.addMethod('GET', getAllItemsIntegration, {
      authorizer: authorizer,
      authorizationType: AuthorizationType.COGNITO
    })
    // addCorsOptions(categories)
    categories.addMethod('POST', postCategoryIntegration, {
      authorizer: authorizer,
      authorizationType: AuthorizationType.COGNITO
    })

    const singleCategory = categories.addResource('{id}') // GET /categories/{id}
    singleCategory.addMethod('GET', getExamQuestionsIntegration, {
      authorizer: authorizer,
      authorizationType: AuthorizationType.COGNITO
    })
    // addCorsOptions(singleCategory)

    // Output the important values
    new CfnOutput(this, 'UserPoolId', {
      value: userPool.userPoolId,
      description: 'The ID of the Cognito User Pool'
    })

    new CfnOutput(this, 'UserPoolClientId', {
      value: userPoolClient.userPoolClientId,
      description: 'The ID of the Cognito User Pool Client'
    })

    new CfnOutput(this, 'Region', {
      value: this.region,
      description: 'The region the stack is deployed to'
    })

    new CfnOutput(this, 'ApiUrl', {
      value: api.url,
      description: 'The URL of the API Gateway'
    })
  }
  protected allocateLogicalId(cfnElement: CfnElement): string {
    const scopes = cfnElement.node.scopes
    const stackIndex: number = scopes.indexOf(cfnElement.stack)
    const pathComponents = scopes.slice(stackIndex + 1).map((x: IConstruct) => {
      return x.node.id
        .split('-')
        .map((s: string) => this.capitalise(s))
        .join('')
    })
    if (pathComponents.lastIndexOf('Resource') === pathComponents.length - 1) {
      pathComponents.pop()
    }
    return pathComponents.map(this.capitalise).map(this.removeNonAlphanumeric).join('')
  }

  private removeNonAlphanumeric(s: string): string {
    return s.replace(/[^A-Za-z0-9]/g, '')
  }

  private capitalise(s: string): string {
    return s.charAt(0).toUpperCase() + s.substr(1)
  }
}

export function addCorsOptions(apiResource: IResource) {
  apiResource.addMethod(
    'OPTIONS',
    new MockIntegration({
      // In case you want to use binary media types, uncomment the following line
      // contentHandling: ContentHandling.CONVERT_TO_TEXT,
      integrationResponses: [
        {
          statusCode: '200',
          responseParameters: {
            'method.response.header.Access-Control-Allow-Headers':
              "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent'",
            'method.response.header.Access-Control-Allow-Origin': "'*'",
            'method.response.header.Access-Control-Allow-Credentials': "'false'",
            'method.response.header.Access-Control-Allow-Methods': "'OPTIONS,GET,PUT,POST,DELETE'"
          }
        }
      ],
      // In case you want to use binary media types, comment out the following line
      passthroughBehavior: PassthroughBehavior.NEVER,
      requestTemplates: {
        'application/json': '{"statusCode": 200}'
      }
    }),
    {
      authorizationType: AuthorizationType.NONE,
      methodResponses: [
        {
          statusCode: '200',
          responseParameters: {
            'method.response.header.Access-Control-Allow-Headers': true,
            'method.response.header.Access-Control-Allow-Methods': true,
            'method.response.header.Access-Control-Allow-Credentials': true,
            'method.response.header.Access-Control-Allow-Origin': true
          }
        }
      ]
    }
  )
}
