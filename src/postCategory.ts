import { Logger } from '@aws-lambda-powertools/logger'
import { Metrics, MetricUnit } from '@aws-lambda-powertools/metrics'
import { Tracer } from '@aws-lambda-powertools/tracer'
import { type APIGatewayProxyEvent, type Context, type APIGatewayProxyResult } from 'aws-lambda'
import { type LambdaInterface } from './LambdaInterface'
// import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb'
// import { DynamoDB } from '@aws-sdk/client-dynamodb'
import { formatResponse } from './formatResponse'

const logger = new Logger()
const metrics = new Metrics()
const tracer = new Tracer()

const TABLE_NAME = process.env.TABLE_NAME
// const db = DynamoDBDocument.from(new DynamoDB())

export class CreateCategory implements LambdaInterface {
  @logger.injectLambdaContext({ logEvent: true })
  @metrics.logMetrics({ captureColdStartMetric: true })
  @tracer.captureLambdaHandler()
  async handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
    try {
      logger.info('Processing createCategory request', { event })

      if (TABLE_NAME === undefined) {
        logger.error('TABLE_NAME environment variable is not set.')
        return formatResponse(500, { message: 'Internal Server Error: TABLE_NAME not configured.' })
      }

      // Parse the incoming POST data
      const requestBody = event.body ? JSON.parse(event.body) : {}
      logger.info('Received category data', { requestBody })

      // For testing purposes, we're just returning the received data
      // No actual database operations are performed

      metrics.addMetric('CreateCategorySuccess', MetricUnit.Count, 1)

      return formatResponse(201, requestBody, 'Category created successfully')
    } catch (error) {
      logger.error('Error processing createCategory request', { error })
      metrics.addMetric('CreateCategoryError', MetricUnit.Count, 1)
      return formatResponse(500, null, 'Internal Server Error', false)
    }
  }
}
