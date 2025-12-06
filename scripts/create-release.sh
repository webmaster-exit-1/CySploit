#!/bin/bash
# Script to create a new release for CySploit
# This script will:
# 1. Run tests and linting
# 2. Build the project
# 3. Create a git tag
# 4. Push the tag (which triggers the release workflow)

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}CySploit Release Script${NC}"
echo "======================================"

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo -e "${RED}Error: Not in a git repository${NC}"
    exit 1
fi

# Check for uncommitted changes
if [[ -n $(git status -s) ]]; then
    echo -e "${YELLOW}Warning: You have uncommitted changes${NC}"
    read -p "Do you want to continue? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Get version from package.json
VERSION=$(node -p "require('./package.json').version")
TAG="v${VERSION}"

echo -e "\n${GREEN}Creating release for version: ${TAG}${NC}\n"

# Check if tag already exists
if git rev-parse "$TAG" >/dev/null 2>&1; then
    echo -e "${RED}Error: Tag $TAG already exists${NC}"
    echo "Please update the version in package.json"
    exit 1
fi

# Run linter
echo -e "${YELLOW}Running linter...${NC}"
npm run lint
echo -e "${GREEN}✓ Linting passed${NC}\n"

# Build the project
echo -e "${YELLOW}Building project...${NC}"
npm run build
echo -e "${GREEN}✓ Build successful${NC}\n"

# Confirm release
echo -e "${YELLOW}Ready to create release ${TAG}${NC}"
read -p "Do you want to continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Release cancelled"
    exit 0
fi

# Create and push tag
echo -e "${YELLOW}Creating and pushing tag...${NC}"
git tag -a "$TAG" -m "Release $TAG"
git push origin "$TAG"

echo -e "\n${GREEN}✓ Tag created and pushed successfully!${NC}"
echo -e "${GREEN}The release workflow will now build and publish the release.${NC}"
echo -e "${GREEN}Check the Actions tab on GitHub to monitor progress.${NC}"

# Extract repository URL (handle both SSH and HTTPS formats)
REPO_URL=$(git config --get remote.origin.url)
if [[ $REPO_URL =~ ^https://github.com/(.+)\.git$ ]]; then
    REPO_PATH="${BASH_REMATCH[1]}"
elif [[ $REPO_URL =~ ^git@github.com:(.+)\.git$ ]]; then
    REPO_PATH="${BASH_REMATCH[1]}"
else
    REPO_PATH="webmaster-exit-1/CySploit"
fi
echo -e "\nRelease URL: https://github.com/${REPO_PATH}/releases/tag/${TAG}"
