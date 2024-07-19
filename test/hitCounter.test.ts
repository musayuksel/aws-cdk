import { Capture, Template } from "aws-cdk-lib/assertions";
import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { HitCounter } from "../lib/hitCounter";

describe("HitCounter Construct Test -Fine-Grained Assertion:", () => {
  let stack: cdk.Stack;
  // Initialize a new stack before each test to ensure isolation
  beforeEach(() => {
    stack = new cdk.Stack();
  });

  test("DDynamoDB Table is created", () => {
    // WHEN
    // Instantiate the HitCounter construct and a Lambda function
    new HitCounter(stack, "MyTestConstruct", {
      downstream: new lambda.Function(stack, "TestFunction", {
        runtime: lambda.Runtime.NODEJS_16_X,
        handler: "hello.handler",
        code: lambda.Code.fromAsset("lambda"),
      }),
    });

    // THEN
    // Create a Template object from the stack
    const template = Template.fromStack(stack);

    // Assert that a DynamoDB table was created
    template.resourceCountIs("AWS::DynamoDB::Table", 1);
  });

  test("Lambda Environment Variables are set correctly", () => {
    // WHEN
    // Instantiate the HitCounter construct with a different Lambda function
    new HitCounter(stack, "MyTestConstruct2", {
      downstream: new lambda.Function(stack, "TestFunction2", {
        runtime: lambda.Runtime.NODEJS_16_X,
        handler: "hello.handler",
        code: lambda.Code.fromAsset("lambda"),
      }),
    });

    // THEN
    // Create a Template object from the stack
    const template = Template.fromStack(stack);

    // Capture the environment variables
    const envCapture = new Capture();
    const tableCapture = new Capture();

    template.hasResourceProperties("AWS::Lambda::Function", {
      Environment: {
        Variables: {
          DOWNSTREAM_FUNCTION_NAME: envCapture,
          HITS_TABLE_NAME: tableCapture,
        },
      },
    });
    // Extract and process the captured values
    const functionRefObject = envCapture.asObject();
    const tableRefObject = tableCapture.asObject();

    // Extract the Ref properties from the captured objects
    const functionRef = functionRefObject?.Ref;
    const tableRef = tableRefObject?.Ref;

    // Assert Lambda function reference
    expect(functionRef).toMatch(/^TestFunction2[A-Za-z0-9]{8}$/); // Adjust based on actual ID format

    // Assert DynamoDB table reference
    expect(tableRef).toMatch(/^MyTestConstruct2HitCounterTable[A-Za-z0-9]{8}$/); // Adjust based on actual ID format
  });

  //   OR WITHOUT USING REGEX: hard coded way
  test("Lambda Environment Variables are set correctly -hard coded way:", () => {
    new HitCounter(stack, "MyTestConstruct3", {
      downstream: new lambda.Function(stack, "TestFunction3", {
        runtime: lambda.Runtime.NODEJS_16_X,
        handler: "hello.handler",
        code: lambda.Code.fromAsset("lambda"),
      }),
    });

    // THEN
    // Create a Template object from the stack
    const template = Template.fromStack(stack);

    // Use Capture to capture the Lambda function's environment variables
    const envCapture = new Capture();

    // Assert that the Lambda function has environment variables defined
    template.hasResourceProperties("AWS::Lambda::Function", {
      Environment: envCapture,
    });

    // Check the captured environment variables for correctness
    expect(envCapture.asObject()).toEqual({
      Variables: {
        DOWNSTREAM_FUNCTION_NAME: {
          Ref: "TestFunction30F782C8B", // Reference to the downstream function
        },
        HITS_TABLE_NAME: {
          Ref: "MyTestConstruct3HitCounterTable1281DA4E", // Reference to the DynamoDB table
        },
      },
    });
  });
});
