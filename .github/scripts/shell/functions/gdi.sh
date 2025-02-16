#!/bin/bash

# gdi.sh - unsets local branch upstream, deletes remote
# NOTE - call only on branch

gdi() {
  # Check if an issue number was provided
  if [ -z "$1" ]; then
    echo "Usage: gci <issue_number>"
    return 1
  fi

  gci "$1"

  git branch --unset-upstream

  # Delete branch named 'issue<issue_number>'
  git push origin --delete "issue/$1"
}