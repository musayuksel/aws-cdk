import { type DynamoDBRecord, type Context, type DynamoDBStreamEvent } from 'aws-lambda'
import { Logger } from '@aws-lambda-powertools/logger'
import { Metrics, MetricUnit } from '@aws-lambda-powertools/metrics'
import { type LambdaInterface } from './LambdaInterface'
import { Tracer } from '@aws-lambda-powertools/tracer'

const logger = new Logger()
const metrics = new Metrics()

const tracer = new Tracer()

export class TriggerStateNotifier implements LambdaInterface {
  @logger.injectLambdaContext({ logEvent: false })
  @metrics.logMetrics({ captureColdStartMetric: true })
  @tracer.captureLambdaHandler()
  async handler(event: DynamoDBStreamEvent, context: Context): Promise<{ message: string }> {
    try {
      for (const record of event.Records) {
        sanitiseRecord(record)
        logger.info('DynamoDB Record:', { record })

        if (record.eventName === 'INSERT') {
          const newItem = record.dynamodb?.NewImage
          logger.info('New item added:', { newItem })
          metrics.addMetric('NewItemAdded', MetricUnit.Count, 1)
        } else {
          metrics.addMetric('Error - Record is not an INSERT', MetricUnit.Count, 1)
        }
      }
      return { message: 'Processing completed successfully' }
    } catch (error) {
      logger.error('Error processing DynamoDB stream event:', { error })
      metrics.addMetric('ProcessingError', MetricUnit.Count, 1)
      return { message: 'Error processing DynamoDB stream event' }
    }
  }
}

const sanitiseRecord = (record: DynamoDBRecord): void => {
  delete record.dynamodb?.NewImage?.name
}
