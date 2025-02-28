import { type APIGatewayProxyEvent } from 'aws-lambda'

export const handler = async (event: APIGatewayProxyEvent) => {
  // Your implementation logic
  console.log(event, `>>>>>>>>>>>event`)
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': 'http://localhost:5173',
      'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
      'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
    },
    body: JSON.stringify({ message: 'User created successfully' })
  }
}

// import { Logger } from '@aws-lambda-powertools/logger'
// import { Metrics, MetricUnit } from '@aws-lambda-powertools/metrics'
// import { Tracer } from '@aws-lambda-powertools/tracer'
// import { type APIGatewayProxyEvent, type Context, type APIGatewayProxyResult } from 'aws-lambda'
// import { type LambdaInterface } from './LambdaInterface'

// const logger = new Logger()
// const metrics = new Metrics()
// const tracer = new Tracer()

// export class CreateUser implements LambdaInterface {
//   @logger.injectLambdaContext({ logEvent: true })
//   @metrics.logMetrics({ captureColdStartMetric: true })
//   @tracer.captureLambdaHandler()
//   async handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
//     try {
//       // Your implementation logic
//       logger.info('Processing createUser request', { event })

//       const response = {
//         statusCode: 200,
//         headers: {
//           'Access-Control-Allow-Origin': 'http://localhost:5173',
//           'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
//           'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
//         },
//         body: JSON.stringify({ message: 'User created successfully' })
//       }

//       metrics.addMetric('CreateUserSuccess', MetricUnit.Count, 1)
//       return response
//     } catch (error) {
//       logger.error('Error processing createUser request', { error })
//       metrics.addMetric('CreateUserError', MetricUnit.Count, 1)
//       return {
//         statusCode: 500,
//         body: JSON.stringify({ message: 'Internal Server Error' })
//       }
//     }
//   }
// }
