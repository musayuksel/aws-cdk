import { type APIGatewayProxyEvent } from 'aws-lambda'
import { Logger } from '@aws-lambda-powertools/logger'

const logger = new Logger()

export const handler = async (event: APIGatewayProxyEvent) => {
  // Your implementation logic
  console.log(event, `>>>>>>>>>>>event`)
  logger.info('Processing getUsers request', { event })
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': 'http://localhost:5173',
      'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
      'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
    },
    body: JSON.stringify({ promos: ['eeeeeeexample data'] })
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

// export class GetUsers implements LambdaInterface {
//   @logger.injectLambdaContext({ logEvent: true })
//   @metrics.logMetrics({ captureColdStartMetric: true })
//   @tracer.captureLambdaHandler()
//   async handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
//     try {
//       // Your implementation logic
//       logger.info('Processing getUsers request', { event })

//       const response = {
//         statusCode: 200,
//         headers: {
//           'Access-Control-Allow-Origin': 'http://localhost:5173',
//           'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
//           'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
//         },
//         body: JSON.stringify({ promos: ['eeeeeeexample data'] })
//       }

//       metrics.addMetric('GetUsersSuccess', MetricUnit.Count, 1)
//       return response
//     } catch (error) {
//       logger.error('Error processing getUsers request', { error })
//       metrics.addMetric('GetUsersError', MetricUnit.Count, 1)
//       return {
//         statusCode: 500,
//         body: JSON.stringify({ message: 'Internal Server Error' })
//       }
//     }
//   }
// }
