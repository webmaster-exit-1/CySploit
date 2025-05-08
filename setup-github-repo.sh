#!/bin/bash

# CySploit GitHub Repository Setup Script
# Run this script to initialize a new GitHub repository for CySploit

set -e  # Exit on error

REPO_NAME="CySploit"
GITHUB_USERNAME="webmaster-exit-1"
REPO_DESCRIPTION="A cutting-edge cybersecurity web and desktop application that transforms network security assessment into an immersive, interactive experience with advanced scanning and cross-platform capabilities."

echo "=== CySploit GitHub Repository Setup ==="
echo ""
echo "This script will help you initialize a new GitHub repository for CySploit."
echo "It will:"
echo "  1. Initialize a git repository locally"
echo "  2. Create a GitHub repository (if you provide a token)"
echo "  3. Configure git and add all files"
echo "  4. Create an initial commit"
echo "  5. Push to GitHub"
echo ""
echo "WARNING: Make sure your .env file doesn't contain sensitive API keys!"
echo ""

read -p "Continue? (y/n): " CONFIRM
if [[ "$CONFIRM" != "y" && "$CONFIRM" != "Y" ]]; then
  echo "Aborting..."
  exit 1
fi

# Ask for GitHub personal access token
echo ""
echo "To create a repository on GitHub, we need a personal access token."
echo "If you don't provide one, you'll need to create the repository manually."
echo "The token needs permissions: repo, workflow, admin:org"
echo ""
read -p "GitHub Personal Access Token (press Enter to skip): " GITHUB_TOKEN

# Initialize git repository
echo ""
echo "Initializing git repository..."
git init

# Configure git
echo "Configuring git..."
read -p "Your Name: " GIT_NAME
read -p "Your Email: " GIT_EMAIL

git config user.name "$GIT_NAME"
git config user.email "$GIT_EMAIL"

# Create GitHub repository if token is provided
if [[ -n "$GITHUB_TOKEN" ]]; then
  echo ""
  echo "Creating GitHub repository..."
  
  # Check if repository exists
  REPO_EXISTS=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: token $GITHUB_TOKEN" \
    "https://api.github.com/repos/$GITHUB_USERNAME/$REPO_NAME")
  
  if [[ "$REPO_EXISTS" == "200" ]]; then
    echo "Repository $GITHUB_USERNAME/$REPO_NAME already exists."
  else
    # Create repository
    curl -H "Authorization: token $GITHUB_TOKEN" \
      -d "{\"name\":\"$REPO_NAME\",\"description\":\"$REPO_DESCRIPTION\",\"homepage\":\"\",\"private\":false,\"has_issues\":true,\"has_projects\":true,\"has_wiki\":true,\"license_template\":\"mit\"}" \
      https://api.github.com/user/repos
    
    echo "Repository created successfully!"
  fi
else
  echo ""
  echo "Skipping GitHub repository creation. Please create it manually:"
  echo "1. Go to https://github.com/new"
  echo "2. Set repository name to: $REPO_NAME"
  echo "3. Set description to: $REPO_DESCRIPTION"
  echo "4. Choose public visibility"
  echo "5. Create repository"
  echo ""
  read -p "Press Enter once you've created the repository..."
fi

# Make sure .env file is ignored
echo ""
echo "Ensuring .env file is ignored..."
if [[ -f .env ]]; then
  echo ".env file exists, backing up to .env.backup"
  cp .env .env.backup
  rm .env
fi

# Add all files
echo ""
echo "Adding all files to git..."
git add .

# Create initial commit
echo ""
echo "Creating initial commit..."
git commit -m "Initial commit of CySploit"

# Set remote origin
echo ""
echo "Setting remote origin..."
git remote add origin "https://github.com/$GITHUB_USERNAME/$REPO_NAME.git"

# Push to GitHub
echo ""
echo "Pushing to GitHub..."
git push -u origin main || git push -u origin master

echo ""
echo "Setup complete! Your repository should now be available at:"
echo "https://github.com/$GITHUB_USERNAME/$REPO_NAME"
echo ""
echo "If you backed up your .env file, restore it with:"
echo "cp .env.backup .env"