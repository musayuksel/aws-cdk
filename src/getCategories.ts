import { Logger } from '@aws-lambda-powertools/logger'
import { Metrics, MetricUnit } from '@aws-lambda-powertools/metrics'
import { Tracer } from '@aws-lambda-powertools/tracer'
import { type APIGatewayProxyEvent, type Context, type APIGatewayProxyResult } from 'aws-lambda'
import { type LambdaInterface } from './LambdaInterface'
import { DynamoDBDocument, ScanCommand } from '@aws-sdk/lib-dynamodb'
import { DynamoDB } from '@aws-sdk/client-dynamodb'

const logger = new Logger()
const metrics = new Metrics()
const tracer = new Tracer()

const TABLE_NAME = process.env.TABLE_NAME
const db = DynamoDBDocument.from(new DynamoDB())

export class GetCategories implements LambdaInterface {
  @logger.injectLambdaContext({ logEvent: true })
  @metrics.logMetrics({ captureColdStartMetric: true })
  @tracer.captureLambdaHandler()
  async handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
    try {
      logger.info('Processing getCategories request', { event })

      if (TABLE_NAME === undefined) {
        logger.error('TABLE_NAME environment variable is not set.')
        return {
          statusCode: 500,
          body: JSON.stringify({ message: 'Internal Server Error: TABLE_NAME not configured.' })
        }
      }

      const scanCommand = new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: 'SK = :sk AND begins_with(PK, :pkPrefix)',
        ExpressionAttributeValues: {
          ':sk': 'CATEGORY',
          ':pkPrefix': 'CATEGORY#'
        }
      })

      const categories = await db.send(scanCommand)

      const response = {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': 'http://localhost:5173',
          'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
          'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
        },
        body: JSON.stringify({ categories: categories.Items })
      }

      metrics.addMetric('GetCategoriesSuccess', MetricUnit.Count, 1)
      return response
    } catch (error) {
      logger.error('Error processing getCategories request', { error })
      metrics.addMetric('GetCategoriesError', MetricUnit.Count, 1)
      return {
        statusCode: 500,
        body: JSON.stringify({ message: 'Internal Server Error' })
      }
    }
  }
}
