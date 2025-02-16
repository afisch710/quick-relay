#!/bin/bash

# Script to increment the BUILD number in a VERSION file, commit the change, and create a pull request

# Exit script if any command fails
set -e

# Get the path to the VERSION file from the environment variable
VERSION_FILE=${VERSION_FILE}
NEW_BRANCH="automation/increment-build-version-$(date +%s)" # Create a unique branch name
SERVICE_NAME=${SERVICE_NAME}

# Read the current version
CURRENT_VERSION=$(cat "$VERSION_FILE")
echo "Current version: $CURRENT_VERSION"

# Increment the BUILD number
IFS='.' read -ra VER <<< "$CURRENT_VERSION"
BUILD_NUMBER=$((${VER[3]} + 1))

# Construct the new version
NEW_VERSION="${VER[0]}.${VER[1]}.${VER[2]}.$BUILD_NUMBER"
echo "New version: $NEW_VERSION"

# Write the new version back to the VERSION file
echo "$NEW_VERSION" > "$VERSION_FILE"

# Set up Git with the quickrelay account
git config --local user.email "quickrelay.dev@gmail.com"
git config --local user.name "quickrelay"

# Checkout a new branch
git checkout -b "$NEW_BRANCH"

ORIGINAL_PR_NUMBER=${PR_NUMBER}
# Commit the change
git add "$VERSION_FILE"
COMMIT_MESSAGE="chore(version): increment version to $NEW_VERSION [Triggered by PR #${ORIGINAL_PR_NUMBER}]"
git commit -m "$COMMIT_MESSAGE"

# Push the new branch using the PAT for authentication
git push https://${GITHUB_ACTOR}:${QUICKRELAY_PAT}@${GITHUB_SERVER_URL#https://}/$GITHUB_REPOSITORY.git "$NEW_BRANCH"

# Create a pull request using GitHub API
PR_DESCRIPTION="This version increment is automatically generated in response to changes merged in PR #${ORIGINAL_PR_NUMBER}."
PR_RESPONSE=$(curl -s -X POST -H "Authorization: token $QUICKRELAY_PAT" \
    -H "Content-Type: application/json" \
    -d "{\"title\":\"[$NEW_VERSION] Automatic Version Increment\",\"head\":\"$NEW_BRANCH\",\"base\":\"development\",\"body\":\"$PR_DESCRIPTION\"}" \
    "https://api.github.com/repos/$GITHUB_REPOSITORY/pulls")

# Extract the issue number from the pull request response
ISSUE_NUMBER=$(echo $PR_RESPONSE | jq -r .number)

# Add labels to the created pull request (issue)
curl -s -X PATCH -H "Authorization: token $QUICKRELAY_PAT" \
    -H "Content-Type: application/json" \
    -d "{\"labels\": [\"$SERVICE_NAME-change\"]}" \
    "https://api.github.com/repos/$GITHUB_REPOSITORY/issues/$ISSUE_NUMBER"
