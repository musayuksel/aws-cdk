import type { APIGatewayProxyEvent, Context } from 'aws-lambda'

// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
const mockedContext = jest.mocked({} as Context)

// const tracer = {
//   captureAWSv3Client: (client: any) => {
//     return client
//   },
//   captureLambdaHandler: jest.fn()
// }
export const mockAddMetric = jest.fn()
export const mockLogMetrics = jest.fn()
const metrics = {
  addMetric: mockAddMetric,
  logMetrics: mockLogMetrics
}
export const mockLoggerDebug = jest.fn()
export const mockLoggerInfo = jest.fn()
export const mockLoggerWarn = jest.fn()
export const mockLoggerError = jest.fn()
export const mockInjectLambdaContext = jest.fn()
export const mockLoggerAppendKeys = jest.fn()
const logger = {
  debug: mockLoggerDebug,
  info: mockLoggerInfo,
  warn: mockLoggerWarn,
  error: mockLoggerError,
  injectLambdaContext: mockInjectLambdaContext,
  appendKeys: mockLoggerAppendKeys
}
jest.mock('@aws-lambda-powertools/metrics', () => {
  return {
    Metrics: jest.fn().mockImplementation(() => {
      return metrics
    }),
    MetricUnit: {
      Count: 'count'
    }
  }
})
jest.mock('@aws-lambda-powertools/logger', () => {
  return {
    Logger: jest.fn().mockImplementation(() => {
      return logger
    })
  }
})

// Mock DynamoDB
const mockSend = jest.fn()
jest.mock('@aws-sdk/lib-dynamodb', () => ({
  DynamoDBDocument: {
    from: jest.fn().mockReturnValue({
      send: mockSend
    })
  },
  ScanCommand: jest.fn().mockImplementation((params) => params)
}))

jest.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDB: jest.fn()
}))

const mockInsertEvent: APIGatewayProxyEvent = {
  body: null,
  headers: {},
  multiValueHeaders: {},
  httpMethod: 'GET',
  isBase64Encoded: false,
  path: '/categories',
  pathParameters: null,
  queryStringParameters: null,
  multiValueQueryStringParameters: null,
  stageVariables: null,
  requestContext: {} as any,
  resource: '/categories'
}

// eslint-disable-next-line import/first
import { getCategoriesHandler } from '../src'

describe('TriggerStateNotifier handler', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.resetAllMocks()
  })

  test('should return categories successfully', async () => {
    // Mock DynamoDB response
    mockSend.mockResolvedValueOnce({
      Items: [
        { id: '1', name: 'Category 1' },
        { id: '2', name: 'Category 2' }
      ]
    })

    const response = await getCategoriesHandler(mockInsertEvent, mockedContext)

    expect(response.statusCode).toBe(200)
    expect(JSON.parse(response.body)).toEqual({
      data: [
        { id: '1', name: 'Category 1' },
        { id: '2', name: 'Category 2' }
      ],
      message: 'Categories retrieved successfully',
      success: true
    })
    expect(mockLoggerInfo).toHaveBeenCalledWith('Processing getCategories request', expect.any(Object))
    expect(mockAddMetric).toHaveBeenCalledWith('GetCategoriesSuccess', 'count', 1)
  })

  // test('should return success message when processing an empty DynamoDB event', async () => {
  //   const emptyEvent: DynamoDBStreamEvent = {
  //     Records: []
  //   }

  //   const response = await handler(emptyEvent, mockedContext)

  //   expect(response).toEqual({ message: 'Processing completed successfully' })
  //   expect(mockLoggerInfo).not.toHaveBeenCalled()
  //   expect(mockAddMetric).not.toHaveBeenCalled()
  // })

  // test('should return success message when processing a DynamoDB event with multiple records', async () => {
  //   const multipleRecordsEvent: DynamoDBStreamEvent = {
  //     Records: [
  //       mockInsertEvent.Records[0],
  //       mockInsertEvent.Records[0]
  //     ]
  //   }

  //   const response = await handler(multipleRecordsEvent, mockedContext)

  //   expect(response).toEqual({ message: 'Processing completed successfully' })
  //   expect(mockLoggerInfo).toHaveBeenCalledTimes(4) // 2 records * 2 log calls each
  //   expect(mockAddMetric).toHaveBeenCalledTimes(2)
  // })

  // test('should return error message when processing an invalid DynamoDB event', async () => {
  //   const response = await handler(mockRemoveEvent, mockedContext)

  //   expect(response).toEqual({ message: 'Processing completed successfully' })
  //   expect(mockLoggerInfo).toHaveBeenCalledWith('DynamoDB Record:', expect.any(Object))
  //   expect(mockLoggerInfo).not.toHaveBeenCalledWith('New item added:', expect.any(Object))
  //   expect(mockAddMetric).toHaveBeenCalledWith('Error - Record is not an INSERT', 'count', 1)
  // })

  // test('should return error message when processing an error', async () => {
  //   const error = new Error('mocked error')
  //   mockLoggerInfo.mockImplementation(() => {
  //     throw error
  //   })

  //   const response = await handler(mockInsertEvent, mockedContext)

  //   expect(response).toEqual({ message: 'Error processing DynamoDB stream event' })
  //   expect(mockLoggerInfo).toHaveBeenCalledWith('DynamoDB Record:', expect.any(Object))
  //   expect(mockLoggerError).toHaveBeenCalledWith('Error processing DynamoDB stream event:', { error })
  //   expect(mockAddMetric).toHaveBeenCalledWith('ProcessingError', 'count', 1)
  // })

  // test('should remove PII before logging the event', async () => {
  //   const response = await handler(mockInsertEvent, mockedContext)

  //   expect(response).toEqual({ message: 'Processing completed successfully' })

  //   expect(mockLoggerInfo).toHaveBeenCalledWith('DynamoDB Record:', {
  //     record: {
  //       eventName: 'INSERT',
  //       dynamodb: {
  //         NewImage: {
  //           id: { S: 'mockId' }
  //           // PII removed
  //         }
  //       }
  //     }
  //   })

  //   expect(mockLoggerInfo).toHaveBeenCalledWith('New item added:', expect.any(Object))
  // })
})
