# Lambda API with CI/CD Pipeline

This project implements a serverless API using AWS Lambda, API Gateway, DynamoDB, and Cognito with an automated CI/CD pipeline for deployments.

## Architecture Diagram

<img src="docs/architecture_diagram.svg" alt="Architecture Diagram" width="1000" />

This project consists of two main stacks:

1. **PipelineStack**: Sets up the CI/CD pipeline with source integration, build/test, approval, and deployment stages
2. **LambdaApiStack**: Defines the Lambda functions, API Gateway, DynamoDB table, and Cognito user pool

The Lambda API stack provides REST endpoints secured with Cognito authentication. Data is stored in a DynamoDB.

## Prerequisites

- Node.js 18 or later
- AWS CLI configured with appropriate credentials
- AWS CDK v2 installed globally (`npm install -g aws-cdk`)
- GitHub repository setup with AWS CodeStar connection

## Installation

Clone the repository and install dependencies:

```bash
git clone <repository-url>
cd <repository-directory>
npm install
```

## Local Development and Testing

### Building the Project

```bash
npm run build
```

This command removes the `dist` directory and compiles TypeScript using the configuration in `tsconfig.build.json`.

### Running Tests

```bash
npm run test
```

This runs Jest tests with coverage reporting.

### Synthesizing CDK Templates

```bash
npm run synth
```

This command synthesizes CloudFormation templates from your CDK code and runs a clean-up script.

## Deployment

### Initial Pipeline Deployment

The CI/CD pipeline **must be deployed manually once**:

```bash
cdk deploy MusaApiPipelineStack
```

After this initial deployment, any changes pushed to the _main_ branch will automatically trigger the pipeline to deploy the Lambda API stack.

### Manual Deployment (without pipeline)

If you want to deploy the Lambda API stack directly:

```bash
npm run deploy
```

This command builds the project, synthesizes CloudFormation templates, and deploys the stack.

## Pipeline Workflow

The CI/CD pipeline consists of the following stages:

1. **Source**: Pulls code from the GitHub repository
2. **Build and Test**: Builds the code and runs tests
3. **Approval**: Requires manual approval before proceeding
4. **Deploy**: Deploys the Lambda API stack to AWS

### Manual Approval in the Pipeline

When the pipeline reaches the approval stage, you will need to:

1. Navigate to the AWS CodePipeline console
2. Find your pipeline (LambdaApiPipeline)
3. Click "Review" on the approval stage
4. Add comments (optional) and click "Approve" to continue the deployment

### Local Approval (for Development)

For development purposes, you can approve pipelines locally using:

```bash
npm run approve-pipelines
```

This uses the script at `./stack/scripts/local-approve-pipelines.sh` to approve pipeline executions.

## Notes

- The pipeline only deploys the Lambda API stack automatically
- Changes to the pipeline itself require manual redeployment
- Resources are set to `RemovalPolicy.DESTROY` for development purposes.
