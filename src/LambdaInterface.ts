import { type DynamoDBStreamEvent, type Context } from 'aws-lambda'

export interface LambdaInterface {
  handler: (event: DynamoDBStreamEvent, context: Context) => Promise<{ message: string }>
}
