# Release Process

This document describes how to create releases for CySploit.

## Overview

CySploit uses automated GitHub Actions workflows to create releases. There are two main ways to create a release:

1. **Automatic Release** - Triggered when the version in `package.json` is updated on the main branch
2. **Manual Release** - Using the release script or GitHub Actions manual trigger

## Automated Release Process

### How It Works

1. When you update the version in `package.json` and push to the `main` or `master` branch
2. The `auto-release.yml` workflow detects the version change
3. It creates a git tag (e.g., `v2.0.1`)
4. The tag push triggers the `release.yml` workflow
5. The release workflow:
   - Runs linting and builds the project
   - Creates distribution archives
   - Builds Electron applications (AppImage, .deb)
   - Creates a GitHub Release with all artifacts
   - Generates a changelog from git commits

### Steps to Create a Release

1. Update the version in `package.json`:
   ```bash
   npm version patch  # for 2.0.1 -> 2.0.2
   npm version minor  # for 2.0.1 -> 2.1.0
   npm version major  # for 2.0.1 -> 3.0.0
   ```

2. Commit the change:
   ```bash
   git add package.json
   git commit -m "chore: bump version to v2.0.2"
   ```

3. Push to the main branch:
   ```bash
   git push origin main
   ```

4. The automated workflow will handle the rest!

## Manual Release Using Script

You can also use the provided script to create a release manually:

```bash
# Update version in package.json first
nano package.json

# Run the release script
./scripts/create-release.sh
```

The script will:
- Check for uncommitted changes
- Verify the version doesn't already exist
- Run linting
- Build the project
- Create and push the tag
- Trigger the release workflow

## Manual Release Using GitHub Actions

You can also trigger a release manually from GitHub:

1. Go to the "Actions" tab in the repository
2. Select "Release" workflow
3. Click "Run workflow"
4. Enter the version tag (e.g., `v2.0.1`)
5. Click "Run workflow"

## Release Artifacts

Each release includes:

- **Source Archives**:
  - `cysploit-dist.tar.gz` - Compressed build output
  - `cysploit-dist.zip` - Compressed build output

- **Electron Applications**:
  - `CySploit-*.AppImage` - Linux AppImage (universal)
  - `cysploit_*.deb` - Debian/Ubuntu package

## Dependabot Integration

Dependabot is configured to:
- Check for npm dependency updates weekly (Mondays at 9:00 AM)
- Check for GitHub Actions updates weekly
- Create PRs automatically for updates
- Label PRs with `dependencies` and ecosystem tags

## CI/CD Pipeline

### Continuous Integration (CI)

The CI pipeline runs on every push and pull request:

1. **Lint**: Checks code quality with ESLint
2. **Build**: Compiles client and server code
3. **Artifacts**: Uploads build artifacts for verification

### Continuous Deployment (CD)

The CD pipeline runs on tag pushes:

1. **Build**: Creates production builds
2. **Package**: Creates Electron applications
3. **Release**: Publishes to GitHub Releases

## Workflows

### `ci.yml` - Continuous Integration
- **Triggers**: Push to main/master, Pull requests
- **Jobs**: Lint, Build
- **Artifacts**: Build output (7 days retention)

### `lint.yml` - Code Quality
- **Triggers**: Push to main/master, Pull requests
- **Jobs**: ESLint checks

### `release.yml` - Release Creation
- **Triggers**: Tag push (v*.*.*), Manual dispatch
- **Jobs**: Build, Build Electron, Create Release
- **Artifacts**: Source archives, Electron apps (30 days retention)

### `auto-release.yml` - Automated Release
- **Triggers**: Push to main/master (package.json changes), Manual dispatch
- **Jobs**: Check version, Create tag, Trigger release

### `check-updates.yml` - Dependency Monitoring
- **Triggers**: Weekly schedule, Manual dispatch
- **Jobs**: Check outdated packages, Security audit, Verify build

### `ethicalcheck.yml` - Security Testing
- **Triggers**: Push to main/master, Pull requests, Schedule
- **Jobs**: API security testing with EthicalCheck

## Versioning

CySploit follows [Semantic Versioning](https://semver.org/):

- **MAJOR** version for incompatible API changes
- **MINOR** version for new functionality (backwards-compatible)
- **PATCH** version for backwards-compatible bug fixes

Format: `MAJOR.MINOR.PATCH` (e.g., `2.0.1`)

## Best Practices

1. **Always test locally before releasing**:
   ```bash
   npm run lint
   npm run build
   ```

2. **Write clear commit messages** - they become part of the changelog

3. **Update documentation** when adding features

4. **Review Dependabot PRs promptly** to keep dependencies up-to-date

5. **Monitor security advisories** and apply patches quickly

6. **Test releases** before announcing them to users

## Pre-release Checklist

Before creating a tag or running a manual release:

- [ ] `npm ci`
- [ ] `npm run lint`
- [ ] `npm run build`
- [ ] `npm run build:electron`
- [ ] Verify `release/*.AppImage` and `release/*.deb` are present
- [ ] Smoke-test the desktop artifact on a clean Linux environment
- [ ] Confirm README/BUILD/RELEASE docs and `package.json` version are in sync

## Rollback Procedure

If a release has issues:

1. Create a new patch version with fixes
2. Follow the normal release process
3. Mark the problematic release as "pre-release" in GitHub if needed

## Support

For questions or issues with the release process:
- Open an issue in the repository
- Contact: echohellosuperuser@member.fsf.org
