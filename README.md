# Lambda API with CI/CD Pipeline

This project implements a serverless API using AWS Lambda, API Gateway, DynamoDB, and Cognito with an automated CI/CD pipeline for deployments.

## Architecture Diagram

<img src="docs/architecture_diagram.svg" alt="Architecture Diagram" width="1000" />

This project consists of two main stacks:

1. **PipelineStack**: Sets up the CI/CD pipeline with source integration, build/test, approval, and deployment stages
2. **LambdaApiStack**: Defines the Lambda functions, API Gateway, DynamoDB table, and Cognito user pool

The Lambda API stack provides REST endpoints secured with Cognito authentication.

## Installation

Clone the repository and install dependencies:

```bash
npm install
```

## Local Development and Testing

### Building the Project

```bash
npm run build
```

### Running Tests

```bash
npm run test
```

## Deployment

### Initial Pipeline Deployment

The CI/CD pipeline **must be deployed manually once**:

```bash
cdk deploy MusaApiPipelineStack
```

After this, any changes pushed to the `main` branch will trigger the pipeline to deploy the Lambda API stack.

## Pipeline Workflow

The CI/CD pipeline consists of the following stages:

1. **Source**: Pulls code from the GitHub repository
2. **Build and Test**: Builds the code and runs tests
3. **Approval**: Requires manual approval before proceeding
4. **Deploy**: Deploys the Lambda API stack to AWS

### Local Approval (for Development)

For development purposes, you can approve pipelines locally using:

```bash
npm run approve-pipelines
```

This uses the script at **[local-approve-pipelines.sh](./stack/scripts/local-approve-pipelines.sh)** to approve pipeline executions.

> **Note**: On the first run, you may need to make the script executable by running:

```bash
chmod +x stack/scripts/local-approve-pipelines.sh
```

## Notes

- The pipeline only deploys the Lambda API stack automatically
- Changes to the pipeline itself require manual redeployment
- Resources are set to `RemovalPolicy.DESTROY` for development purposes.
