import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apiGateway from "aws-cdk-lib/aws-apigateway";

import { Construct } from "constructs";
import { HitCounter } from "./hitCounter";

export class AwsCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    //AWS Lambda resource
    const helloFunction = new lambda.Function(this, "HelloHandler", {
      runtime: lambda.Runtime.NODEJS_16_X,
      code: lambda.Code.fromAsset("lambda"), // Load code from the "lambda" directory
      handler: "hello.handler", // The file is "hello" and the function is "handler"
    });

    // Use the HitCounter construct to add a counting layer to the original Lambda function.
    // This is similar to adding middleware in Express.js.
    // The HitCounter adds functionality to count the number of times the Lambda function is invoked.
    const helloWithCounter = new HitCounter(this, "HelloHitCounter", {
      downstream: helloFunction, // The original Lambda function to be wrapped
    });

    // Create an API Gateway REST API resource linked to the Lambda function with the hit counter
    new apiGateway.LambdaRestApi(this, "EndPoint", {
      handler: helloWithCounter.handler, // The handler is the function with hit counting
    });
  }
}
