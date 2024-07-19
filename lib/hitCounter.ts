import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";

export interface HitCounterProps {
  downstream: lambda.IFunction; //function interface for the counter

  /**
   * The read capacity units for the table
   *
   * Must be greater than 2 and lower than 20
   *
   * WE can see this text when we HOVER
   * @default 2
   */
  readCapacity?: number;
}

export class HitCounter extends Construct {
  public readonly handler: lambda.Function; // allows accessing the counter function

  /**
   * Constructs a **new HitCounter** instance.
   *
   * @param scope The scope in which to define this construct.
   * @param id The ID of the construct.
   * @param props The properties to configure the HitCounter.
   *
   * @throws Error if `readCapacity` is less than 2 or greater than 20.
   */
  constructor(scope: Construct, id: string, props: HitCounterProps) {
    if (
      props.readCapacity !== undefined &&
      (props.readCapacity < 2 || props.readCapacity > 20)
    ) {
      throw new Error("readCapacity must be greater than 2 and less than 20");
    }

    super(scope, id);

    const table = new dynamodb.Table(this, "HitCounterTable", {
      partitionKey: { name: "path", type: dynamodb.AttributeType.STRING },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      readCapacity: props.readCapacity ?? 2,
    });

    this.handler = new lambda.Function(this, "HitCounterHandlerLambda", {
      runtime: lambda.Runtime.NODEJS_16_X,
      code: lambda.Code.fromAsset("lambda"),
      handler: "hitCounter.handler",
      environment: {
        DOWNSTREAM_FUNCTION_NAME: props.downstream.functionName,
        HITS_TABLE_NAME: table.tableName,
      },
    });

    // grant the lambda role read/write permissions to our table
    table.grantReadWriteData(this.handler);

    // grant the lambda role invoke permissions to the downstream function
    props.downstream.grantInvoke(this.handler);
  }
}
