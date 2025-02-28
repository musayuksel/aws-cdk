import { type Context, type APIGatewayProxyEvent, type APIGatewayProxyResult } from 'aws-lambda'

export interface LambdaInterface {
  handler: (event: APIGatewayProxyEvent, context: Context) => Promise<APIGatewayProxyResult>
}
