import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apiGateway from "aws-cdk-lib/aws-apigateway";

import { Construct } from "constructs";

export class AwsCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    //AWS Lambda resource
    const helloFunction = new lambda.Function(this, "HelloHandler", {
      runtime: lambda.Runtime.NODEJS_16_X,
      code: lambda.Code.fromAsset("lambda"), // code loaded from lambda dir
      handler: "hello.handler", // file is "hello", function is "handler"
    });

    //API Gateway REST API resource
    new apiGateway.LambdaRestApi(this, "EndPoint", {
      handler: helloFunction,
    });
  }
}
