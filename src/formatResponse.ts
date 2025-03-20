export const formatResponse = (
  statusCode: number,
  data: any = null,
  message: string = '',
  success: boolean = true
): any => {
  return {
    statusCode,
    headers: {
      'Access-Control-Allow-Origin': '*', // Update to match frontend URL if needed
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      success,
      message,
      data
    })
  }
}
