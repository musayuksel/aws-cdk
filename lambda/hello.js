exports.handler = async function (event) {
  console.log(`Request>>>: ${JSON.stringify(event, undefined, 2)}`);

  return {
    statusCode: 200,
    header: { "Content-Type": "text/plain" },
    body: `Hello, CDK! You've hit ${event.path}\n`,
  };
};
