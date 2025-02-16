#!/bin/bash

# gci.sh

gci() {
  # Check if an issue number was provided
  if [ -z "$1" ]; then
    echo "Usage: gci <issue_number>"
    return 1
  fi

  # Call gcd to checkout and pull development branch
  gcd

  # Check for an error in gcd
  if [ $? -ne 0 ]; then
    echo "Failed to prepare development branch."
    return 1
  fi

  # Create and switch to the new branch named 'issue<issue_number>'
  git checkout -b "issue/$1"
}