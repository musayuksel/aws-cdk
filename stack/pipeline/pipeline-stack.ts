import * as cdk from 'aws-cdk-lib'
import { Bucket } from 'aws-cdk-lib/aws-s3'
import { Construct } from 'constructs'
import { PolicyStatement, Role, CompositePrincipal, ServicePrincipal } from 'aws-cdk-lib/aws-iam'
import { BuildSpec, ComputeType, LinuxBuildImage, PipelineProject } from 'aws-cdk-lib/aws-codebuild'
import { Artifact, Pipeline } from 'aws-cdk-lib/aws-codepipeline'
import {
  CodeBuildAction,
  CodeStarConnectionsSourceAction,
  ManualApprovalAction
} from 'aws-cdk-lib/aws-codepipeline-actions'

export interface PipelineStackProps extends cdk.StackProps {
  readonly repositoryOwner: string
  readonly repositoryName: string
  readonly branchName: string
  readonly connectionArn: string
  readonly apiStackName: string
}

export class MusaCrudApiPipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: PipelineStackProps) {
    super(scope, id, props)

    const { repositoryOwner, repositoryName, branchName, connectionArn, apiStackName } = props

    // S3 Bucket for pipeline artifacts
    const mockS3Bucket = new Bucket(this, 'MockS3Bucket', {
      bucketName: 'musa-cdk-levelling-1b-test-bucket-123123',
      removalPolicy: cdk.RemovalPolicy.DESTROY, // NOT for production
      autoDeleteObjects: true
    })

    // IAM Role for CodePipeline and CodeBuild
    const pipelineRole = new Role(this, 'PipelineRole', {
      assumedBy: new CompositePrincipal(
        new ServicePrincipal('codepipeline.amazonaws.com'),
        new ServicePrincipal('codebuild.amazonaws.com')
      )
    })

    // Add policy to the role
    pipelineRole.addToPolicy(
      new PolicyStatement({
        actions: [
          's3:*',
          'codebuild:*',
          'codepipeline:*',
          'iam:PassRole',
          'logs:*',
          'codestar-connections:UseConnection',
          'cloudformation:*',
          'lambda:*',
          'apigateway:*',
          'cognito-idp:*',
          'dynamodb:*',
          'ssm:GetParameter'
        ],
        resources: ['*']
      })
    )

    // CodeBuild Projects for Device
    const codeBuildDevice = new PipelineProject(this, 'CodeBuildDevice', {
      environment: {
        buildImage: LinuxBuildImage.STANDARD_6_0,
        computeType: ComputeType.SMALL
      },
      role: pipelineRole,
      timeout: cdk.Duration.minutes(5),
      description: 'Builds the device code',
      buildSpec: BuildSpec.fromSourceFilename('stack/scripts/buildspec-device.yml')
    })

    // CodeBuild Project for Deploy
    const codeBuildDeploy = new PipelineProject(this, 'CodeBuildDeploy', {
      environment: {
        buildImage: LinuxBuildImage.STANDARD_6_0,
        computeType: ComputeType.SMALL
      },
      role: pipelineRole,
      timeout: cdk.Duration.minutes(5),
      buildSpec: BuildSpec.fromSourceFilename('stack/scripts/buildspec-deploy.yml')
    })

    // Artifacts for the pipeline
    const sourceOutput = new Artifact('GitHubSource')
    const buildOutput = new Artifact('BuildOutput')

    // CodePipeline Actions
    const sourceAction = new CodeStarConnectionsSourceAction({
      actionName: 'SourceFromGitHub',
      owner: repositoryOwner,
      repo: repositoryName,
      branch: branchName,
      connectionArn: connectionArn,
      output: sourceOutput
    })

    const buildAction = new CodeBuildAction({
      actionName: 'BuildAndTest',
      project: codeBuildDevice,
      input: sourceOutput,
      outputs: [buildOutput],
      environmentVariables: {
        DEVICE: { value: 'TEST' }
      }
    })

    const approveDeployAction = new ManualApprovalAction({
      actionName: 'ApproveDeploy'
    })

    const deployToTestAction = new CodeBuildAction({
      actionName: 'DeployToTest',
      project: codeBuildDeploy,
      input: sourceOutput,
      //   outputs: [testBuildOutput],
      environmentVariables: {
        API_STACK_NAME: { value: apiStackName }
      }
    })

    // CodePipeline
    new Pipeline(this, 'MusaCrudApiPipeline', {
      pipelineName: 'MusaCrudApiPipeline',
      artifactBucket: mockS3Bucket,
      role: pipelineRole,
      restartExecutionOnUpdate: true,
      stages: [
        {
          stageName: 'Source',
          actions: [sourceAction]
        },
        {
          stageName: 'Build',
          actions: [buildAction]
        },
        {
          stageName: 'Approve',
          actions: [approveDeployAction]
        },
        {
          stageName: 'Deploy',
          actions: [deployToTestAction]
        }
      ]
    })
  }
}
