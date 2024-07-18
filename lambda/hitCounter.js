const { DynamoDB, Lambda } = require("aws-sdk");

exports.handler = async function (event) {
  //create SDK clients
  const dynomoDB = new DynamoDB();
  const lambda = new Lambda();

  //update dynomoDB entry for "path" with hits++
  await dynomoDB
    .updateItem({
      TableName: process.env.HITS_TABLE_NAME,
      Key: { path: { S: event.path } },
      UpdateExpression: "ADD hits :incr",
      ExpressionAttributeValues: { incr: { N: "1" } },
    })
    .promise();

  //call downstream fun and capture response
  const response = await lambda
    .invoke({
      FunctionName: process.env.DOWNSTREAM_FUNCTION_NAME,
      Payload: JSON.stringify(event),
    })
    .promise();

  console.log("downstream response:", JSON.stringify(resp, undefined, 2));

  //return response back to upstream caller
  return JSON.parse(resp.Payload);
};
