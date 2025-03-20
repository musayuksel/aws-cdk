import { Logger } from '@aws-lambda-powertools/logger'
import { Metrics, MetricUnit } from '@aws-lambda-powertools/metrics'
import { Tracer } from '@aws-lambda-powertools/tracer'
import { DynamoDB } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocument, ScanCommand } from '@aws-sdk/lib-dynamodb'
import { type LambdaInterface } from './LambdaInterface'
import { type APIGatewayProxyEvent, type Context, type APIGatewayProxyResult } from 'aws-lambda'
import { formatResponse } from './formatResponse'

const logger = new Logger()
const metrics = new Metrics()
const tracer = new Tracer()

const TABLE_NAME = process.env.TABLE_NAME
const db = DynamoDBDocument.from(new DynamoDB())

export class GetExamQuestions implements LambdaInterface {
  @logger.injectLambdaContext({ logEvent: true })
  @metrics.logMetrics({ captureColdStartMetric: true })
  @tracer.captureLambdaHandler()
  async handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
    try {
      logger.info('Processing getExamQuestions request', { event })

      if (TABLE_NAME === undefined) {
        logger.error('TABLE_NAME environment variable is not set.')
        return {
          statusCode: 500,
          body: JSON.stringify({ message: 'Internal Server Error: TABLE_NAME not configured.' })
        }
      }

      const examId = event.pathParameters?.id
      if (!examId) {
        logger.error('examId is not provided')
        return {
          statusCode: 400,
          body: JSON.stringify({ message: 'Bad Request: examId is not provided.' })
        }
      }

      const scanCommand = new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: 'PK = :pkValue',
        ExpressionAttributeValues: {
          ':pkValue': `QUESTION#${examId}`
        }
      })

      const questions = await db.send(scanCommand)

      metrics.addMetric('GetExamQuestionsSuccess', MetricUnit.Count, 1)
      return formatResponse(200, questions.Items, 'Questions retrieved successfully')
    } catch (error) {
      logger.error('Error processing getExamQuestions request', { error })
      metrics.addMetric('GetExamQuestionsError', MetricUnit.Count, 1)
      return formatResponse(500, null, 'Internal Server Error', false)
    }
  }
}
