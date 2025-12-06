# Creating Your First Release

This guide will walk you through creating the first release of CySploit v2.0.1.

## ✅ What Has Been Set Up

Your project now has a complete CI/CD automation system:

### 1. **Dependabot Configuration** (`.github/dependabot.yml`)
   - Automatically checks for npm package updates weekly
   - Automatically checks for GitHub Actions updates weekly
   - Creates pull requests for dependency updates
   - ✅ Ready to use!

### 2. **GitHub Actions Workflows**
   
   - **`ci.yml`**: Runs linting and builds on every push/PR
   - **`lint.yml`**: Runs ESLint checks
   - **`release.yml`**: Creates releases when tags are pushed
   - **`auto-release.yml`**: Automatically creates releases when version in package.json changes
   - **`check-updates.yml`**: Weekly health checks for dependencies
   - **`ethicalcheck.yml`**: Security testing (already existed)
   - ✅ All workflows validated and ready!

### 3. **Release Script** (`scripts/create-release.sh`)
   - Manual script to create releases
   - Runs tests before releasing
   - Creates and pushes git tags
   - ✅ Executable and ready!

### 4. **Documentation**
   - **`RELEASE.md`**: Complete release process documentation
   - **`CHANGELOG.md`**: Tracks all changes
   - **README.md**: Updated with release information
   - ✅ All documented!

## 🚀 Creating Your First Release (v2.0.1)

You have **three options** to create the first release:

### Option 1: Automatic Release (Recommended)

This is the easiest method. Simply merge this PR to main:

1. **Merge this Pull Request to main/master branch**
   ```bash
   # The PR already updates package.json with version 2.0.1
   # When merged, auto-release.yml will detect the version
   ```

2. **The automation will:**
   - Detect that version 2.0.1 is in package.json
   - Create a git tag `v2.0.1`
   - Trigger the release workflow
   - Build the project
   - Create Electron applications
   - Publish the release to GitHub with all artifacts

3. **Monitor progress:**
   - Go to Actions tab in GitHub
   - Watch the `Auto Release` workflow
   - Then watch the `Release` workflow
   - Your release will appear in the Releases tab!

### Option 2: Manual Release Using Script

If you prefer manual control:

1. **Clone/pull the latest code**
   ```bash
   git checkout main
   git pull
   ```

2. **Run the release script**
   ```bash
   ./scripts/create-release.sh
   ```

3. **Follow the prompts**
   - The script will verify everything is ready
   - It will create and push the tag
   - The release workflow will trigger automatically

### Option 3: Manual Release via GitHub Actions

Use the GitHub web interface:

1. **Go to your repository on GitHub**
2. **Click the "Actions" tab**
3. **Select "Release" workflow from the left**
4. **Click "Run workflow" button**
5. **Enter version: `v2.0.1`**
6. **Click "Run workflow"**
7. **Watch the workflow build and release!**

## 📦 What Will Be Created

Your release will include:

### Artifacts:
- **cysploit-dist.tar.gz** - Compressed build output
- **cysploit-dist.zip** - Compressed build output
- **CySploit-2.0.1.AppImage** - Linux AppImage (universal)
- **cysploit_2.0.1_amd64.deb** - Debian/Ubuntu package

### Release Notes:
- Automatically generated changelog from git commits
- Installation instructions
- Links to documentation

## 🔄 Future Releases

After the first release, creating new releases is simple:

1. **Update version in package.json**
   ```bash
   npm version patch  # 2.0.1 -> 2.0.2
   npm version minor  # 2.0.1 -> 2.1.0
   npm version major  # 2.0.1 -> 3.0.0
   ```

2. **Commit and push to main**
   ```bash
   git add package.json package-lock.json
   git commit -m "chore: bump version to v2.0.2"
   git push origin main
   ```

3. **Automation handles the rest!**
   - Tag is created automatically
   - Release is built and published
   - Artifacts are uploaded

## 🤖 What Happens Automatically

### Weekly (Every Monday):
- **Dependabot checks** for dependency updates
- **Health checks** run to verify build status
- **Security audits** check for vulnerabilities

### On Every Push/PR:
- **Linting** ensures code quality
- **Building** verifies compilation works
- **Tests** run (when test infrastructure exists)

### On Version Change:
- **Auto-release** creates and pushes tags
- **Release workflow** builds and publishes

## 📝 Best Practices Going Forward

1. **Keep dependencies updated**
   - Review Dependabot PRs promptly
   - Test updates before merging

2. **Write clear commit messages**
   - They become part of your changelog
   - Use conventional commits: `feat:`, `fix:`, `chore:`

3. **Update CHANGELOG.md**
   - Document notable changes
   - Keep users informed

4. **Test before releasing**
   - Run `npm run lint`
   - Run `npm run build`
   - Test the application

5. **Monitor releases**
   - Check Actions tab for workflow status
   - Verify releases in the Releases tab
   - Test downloaded artifacts

## 🐛 Troubleshooting

### If a workflow fails:
1. Check the Actions tab for error messages
2. Fix the issue in code
3. Push the fix
4. The workflow will run again

### If a release has issues:
1. Create a new patch version with fixes
2. Follow the normal release process
3. The new version will supersede the old one

### If you need to test workflows:
1. Workflows have `workflow_dispatch` trigger
2. You can run them manually from Actions tab
3. Test in a fork first if you're unsure

## 📚 Additional Resources

- **Release Process**: See [RELEASE.md](RELEASE.md) for detailed documentation
- **Contributing**: See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines
- **Changelog**: See [CHANGELOG.md](CHANGELOG.md) for version history

## ✅ Verification Checklist

Before creating the first release, verify:

- [x] Project builds successfully (`npm run build`)
- [x] Linter passes (`npm run lint`)
- [x] Dependabot is configured
- [x] All workflows are in place
- [x] Documentation is complete
- [x] Version in package.json is correct (2.0.1)
- [ ] PR is merged to main (or ready to merge)
- [ ] Ready to create first release!

## 🎉 Next Steps

1. **Choose your release method** (Option 1, 2, or 3 above)
2. **Create the release**
3. **Monitor the Actions tab**
4. **Celebrate your first release!** 🎊
5. **Share it with users**

---

**Need Help?**
- Open an issue in the repository
- Contact: echohellosuperuser@member.fsf.org

**Ready to launch?** Choose your release method above and let's go! 🚀
