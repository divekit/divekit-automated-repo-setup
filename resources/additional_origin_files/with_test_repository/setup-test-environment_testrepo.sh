#!/usr/bin/env bash

# Define Code Repo URLs
# Delete the protocol at the start (e.g. https://)
REPO_URL=$(echo $CODE_REPO_URL | grep -Eo '\/\/.*$' | grep -Eo '[^\/].*$')
echo "Setting up test environment with Repo URL: $REPO_URL"

# Clone Repo which contains code
git clone "https://gitlab-ci-token:${CI_JOB_TOKEN}@$REPO_URL" student_repo

# Copy code files with override from cloned repo
cp -R "student_repo/src/main" "./src"
#cp -R "student_repo/src/test/java/thkoeln/archilab/ecommerce/test/domainprimitives/owntests" "./src/test/java/thkoeln/archilab/ecommerce/test/domainprimitives"

echo "The following files exist within the src folder:"
find "./src" -print
