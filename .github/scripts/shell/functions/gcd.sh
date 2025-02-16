#!/bin/bash

# gcd.sh

gcd() {
  # Switch to the 'development' branch
  git checkout development

  # Pull the latest changes from the remote repository
  git pull
}