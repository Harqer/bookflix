#!/bin/bash

# 🐰 CodeRabbit Pre-flight Review Script
# Purpose: Audits the current feature branch before pushing to the cloud.

echo "🔍 Starting CodeRabbit Pre-flight Review..."

# 1. Check if CodeRabbit CLI is installed
if ! command -v coderabbit &> /dev/null
then
    echo "❌ CodeRabbit CLI not found. Please install it: npm install -g @coderabbitai/cli"
    exit 1
fi

# 2. Identify the base branch (defaulting to main)
BASE_BRANCH=${1:-main}
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)

echo "🌿 Reviewing changes: $BASE_BRANCH -> $CURRENT_BRANCH"

# 3. Trigger CodeRabbit Review
# We use the --local flag to review uncommitted/local changes if needed,
# or we compare against the base branch.
coderabbit review \
  --base "$BASE_BRANCH" \
  --head "$CURRENT_BRANCH" \
  --include-summary \
  --detailed

if [ $? -eq 0 ]; then
    echo "✅ Review Completed! Please check the output for suggestions."
else
    echo "⚠️ CodeRabbit identified potential issues. Review them before pushing."
fi
