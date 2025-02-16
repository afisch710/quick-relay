#!/bin/bash

# gp.sh

gp() {
  # Ensure we're in a Git repository
  if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "Not inside a Git repository."
    return 1
  fi

  # Push the current branch to the remote
  git push

  # Get the current branch name
  current_branch=$(git symbolic-ref --short HEAD)

  # Define the expected branch prefix
  prefix="issue/"

  # Check if the branch starts with the expected prefix and extract the issue number
  if [[ "$current_branch" == "$prefix"* ]]; then
    issue_number="${current_branch#$prefix}"
  else
    echo "Branch name does not follow the 'issue/<issue_number>' format."
    return 1
  fi

  # Retrieve the issue title using GitHub CLI
  issue_title=$(gh issue view "$issue_number" --json title -q .title)

  if [ -z "$issue_title" ]; then
    echo "Could not retrieve title for issue #$issue_number."
    return 1
  fi

  # Get the latest commit message for the PR description
  commit_description=$(git log -1 --pretty=%B)

  # Construct the PR title and body
  pr_title="${issue_number}: ${issue_title}"
  pr_body="${commit_description}"$'\n\n'"closes #${issue_number}"

  # Create the PR using GitHub CLI
  pr_create_output=$(gh pr create \
    --title "$pr_title" \
    --body "$pr_body" \
    --base development \
    --head "$current_branch" \
  )

  if [ $? -ne 0 ]; then
    echo "Failed to create PR."
    return 1
  fi

  # Extract PR URL from the output
  pr_url=$(echo "$pr_create_output" | grep -Eo 'https://github\.com/[^ ]+')

  if [ -z "$pr_url" ]; then
    echo "Failed to extract PR URL."
    return 1
  fi

  # Extract PR number from the URL
  pr_number=$(echo "$pr_url" | grep -Eo '[0-9]+$')

  # Enable auto-merge using gh pr merge
  gh pr merge "$pr_number" --auto --squash

  if [ $? -ne 0 ]; then
    echo "Failed to enable auto-merge for PR #$pr_number."
    return 1
  fi

  # Open the PR in the default browser
  open "$pr_url"
}