# Version Management Guide

This project uses automated version management with GitHub Actions. Versions follow [Semantic Versioning](https://semver.org/) (MAJOR.MINOR.PATCH).

## How It Works

### Automatic Version Bumping

When you push to `main` branch, the workflow will:
1. ✅ Build the project
2. ✅ Automatically detect version bump type from commit messages
3. ✅ Bump the version in `package.json`
4. ✅ Update `CHANGELOG.md`
5. ✅ Create a git tag (e.g., `v1.0.1`)
6. ✅ Commit and push the version changes

### Version Bump Types

The workflow detects version type from commit messages:

- **Patch** (1.0.0 → 1.0.1): Bug fixes, small changes
  - Default if no keywords found
  - Example: `fix: resolve login issue`

- **Minor** (1.0.0 → 1.1.0): New features, non-breaking changes
  - Keywords: `[minor]`, `feat:`, `feature:`
  - Example: `feat: add dark mode support`

- **Major** (1.0.0 → 2.0.0): Breaking changes
  - Keywords: `[major]`, `breaking`, `BREAKING`
  - Example: `[major] refactor authentication system`

## Manual Version Bump

### Via GitHub Actions UI

1. Go to **Actions** tab in GitHub
2. Select **Build and Version Bump** workflow
3. Click **Run workflow**
4. Choose version type (patch/minor/major)
5. Click **Run workflow**

### Via Command Line

```bash
# Patch version (1.0.0 → 1.0.1)
npm run version:patch

# Minor version (1.0.0 → 1.1.0)
npm run version:minor

# Major version (1.0.0 → 2.0.0)
npm run version:major
```

Then commit and push:
```bash
git add package.json package-lock.json CHANGELOG.md
git commit -m "chore: bump version"
git push origin main
```

## Publishing to npm

To publish to npm, you need to:

1. Set up npm token in GitHub Secrets:
   - Go to repository **Settings** → **Secrets and variables** → **Actions**
   - Add secret: `NPM_TOKEN` with your npm access token

2. Publish manually via workflow:
   - Run the workflow manually and it will publish if `NPM_TOKEN` is set

3. Or publish locally:
   ```bash
   npm login
   npm publish --access restricted
   ```

## Workflow Triggers

The workflow runs automatically on:
- ✅ Push to `main` or `master` branch
- ✅ Manual trigger via GitHub Actions UI

The workflow **skips** if:
- ❌ Commit message contains `"chore: bump version"` (prevents loops)
- ❌ Only markdown files changed
- ❌ Only `.gitignore` changed

## Best Practices

1. **Use meaningful commit messages** with keywords for auto-detection
2. **Review CHANGELOG.md** after each release
3. **Tag releases** are created automatically
4. **Build artifacts** are uploaded to GitHub Actions for 30 days

## Example Workflow

```bash
# 1. Make your changes
git add .
git commit -m "feat: add user profile photo upload"

# 2. Push to main
git push origin main

# 3. GitHub Actions will:
#    - Build the project
#    - Detect "feat:" → minor version bump
#    - Bump version (1.0.0 → 1.1.0)
#    - Update CHANGELOG.md
#    - Create tag v1.1.0
#    - Commit and push changes
```

## Troubleshooting

### Workflow not triggering?
- Check if commit message contains `[skip ci]`
- Verify you're pushing to `main` or `master`
- Check GitHub Actions tab for errors

### Version not bumping?
- Ensure commit message has proper keywords
- Check workflow logs in GitHub Actions
- Verify `package.json` is not ignored in `.gitignore`

### Want to skip version bump?
Add `[skip version]` to your commit message.

