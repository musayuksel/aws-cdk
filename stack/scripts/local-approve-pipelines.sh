

#!/bin/bash

# Array of pipelines to approve
PIPELINES=("MusaCrudApiPipeline" "wrongPipeline" "wrongPipeline2")
STAGE_NAME="Approve"
ACTION_NAME="ApproveDeploy"

# Check if we have valid AWS credentials
echo "Checking AWS credentials..."
aws sts get-caller-identity > /dev/null 2>&1
if [ $? -ne 0 ]; then
  echo "ERROR: Not authenticated with AWS. Please authenticate manually first."
  exit 1
fi

echo "AWS credentials verified successfully."

# Loop through each pipeline
for PIPELINE_NAME in "${PIPELINES[@]}"; do
  echo "---------------------------------------"
  echo "Processing pipeline: $PIPELINE_NAME"
  
  # Get the most recent execution ID
  echo "Fetching the most recent pipeline execution ID..."
  EXECUTION_ID=$(aws codepipeline list-pipeline-executions --pipeline-name $PIPELINE_NAME --max-items 1 --query "pipelineExecutionSummaries[0].pipelineExecutionId" --output text)

  if [ -z "$EXECUTION_ID" ] || [ "$EXECUTION_ID" == "None" ]; then
    echo "No executions found for $PIPELINE_NAME. Skipping."
    continue
  fi

  echo "Found execution ID: $EXECUTION_ID"

  # Extract token using a direct method
  echo "Extracting approval token..."
  TOKEN=$(aws codepipeline get-pipeline-state --name $PIPELINE_NAME --output json | 
          grep -o '"token": "[^"]*"' | head -1 | cut -d'"' -f4)

  if [ -z "$TOKEN" ]; then
    echo "Could not retrieve approval token for $PIPELINE_NAME. Skipping."
    continue
  fi

  echo "Found approval token: $TOKEN"

  # Approve the action
  echo "Approving pipeline action..."
  aws codepipeline put-approval-result \
    --pipeline-name $PIPELINE_NAME \
    --stage-name $STAGE_NAME \
    --action-name $ACTION_NAME \
    --token $TOKEN \
    --result '{"summary":"Automatically approved via script","status":"Approved"}'

  if [ $? -ne 0 ]; then
    echo "Failed to approve the action for $PIPELINE_NAME."
  else
    echo "Success! The pipeline $PIPELINE_NAME has been approved."
  fi
done

echo "---------------------------------------"
echo "Pipeline approval process completed."