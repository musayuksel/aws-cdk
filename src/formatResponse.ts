export const formatResponse = (statusCode: number, body: any): any => {
  return {
    statusCode,
    headers: {
      'Access-Control-Allow-Origin': '*', // Update to match frontend URL if needed
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type'
    },
    body: JSON.stringify(body)
  }
}
