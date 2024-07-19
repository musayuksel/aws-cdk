import { Capture, Template } from "aws-cdk-lib/assertions";
import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { HitCounter } from "../lib/hitCounter";

describe("HitCounter Construct Test -Fine-Grained Assertion:", () => {
  const stack = new cdk.Stack();
  test("DynamoDB created", () => {
    // WHEN
    new HitCounter(stack, "MyTestConstruct", {
      downstream: new lambda.Function(stack, "TestFunction", {
        runtime: lambda.Runtime.NODEJS_16_X,
        handler: "hello.handler",
        code: lambda.Code.fromAsset("lambda"),
      }),
    });

    // THEN
    const template = Template.fromStack(stack);
    template.resourceCountIs("AWS::DynamoDB::Table", 1);
  });

  test("Lambda variables", () => {
    // WHEN
    new HitCounter(stack, "MyTestConstruct2", {
      downstream: new lambda.Function(stack, "TestFunction2", {
        runtime: lambda.Runtime.NODEJS_16_X,
        handler: "hello.handler",
        code: lambda.Code.fromAsset("lambda"),
      }),
    });

    // THEN
    const template = Template.fromStack(stack);
    const envCapture = new Capture();

    template.hasResourceProperties("AWS::Lambda::Function", {
      Environment: envCapture,
    });

    expect(envCapture.asObject()).toEqual({
      Variables: {
        DOWNSTREAM_FUNCTION_NAME: {
          Ref: "TestFunction22AD90FC",
        },
        HITS_TABLE_NAME: {
          Ref: "MyTestConstructHitCounterTable7E2AA81E",
        },
      },
    });
  });
});

describe("", () => {});
