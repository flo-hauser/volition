# Git Hooks & Version Management

This directory contains git hooks to ensure version alignment between git tags and `package.json`.

## Setup

The git hooks path is configured to use this directory:

```bash
git config core.hooksPath .githooks
```

This configuration is local to your repository and is set up automatically when you clone.

## Hooks

### `pre-push`

Runs before pushing to the remote repository. Validates that any git tags being pushed match the version in `package.json`.

**Behavior:**

- ✓ Allows push if tag version matches `package.json`
- ✗ Blocks push if tag version doesn't match
- ℹ️ Skips check if no tags are being pushed

**Example:**

```bash
# This will be blocked if package.json is 1.1.0 but tag is 2.0.0
git push origin v2.0.0
```

## Version Check Script

The `check-version.js` script is used by the pre-push hook and CI pipeline:

```bash
# Check a specific tag
node .githooks/check-version.js "1.1.0"

# Exit code 0 = version match
# Exit code 1 = version mismatch
```

**Validates:**

- ✓ `package.json` version matches git tag
- ✓ `src-capacitor/package.json` version matches git tag
- ✓ Both `package.json` files have the same version

## CI Integration

The GitHub Actions CI pipeline also runs the version check when pushing tags to prevent any misalignment from reaching the main branch.

**CI Step:**

```yaml
- name: Check version alignment
  if: startsWith(github.ref, 'refs/tags/')
  run: node .githooks/check-version.js "${GITHUB_REF#refs/tags/}"
```

## Workflow

### Quick Way (Recommended)

Use `npm version` to automatically update both `package.json` files, create a commit, and tag:

```bash
npm version patch   # or minor, major
# This automatically:
# 1. Updates package.json version
# 2. Updates src-capacitor/package.json version (via postversion hook)
# 3. Creates a git commit with both updates
# 4. Creates a git tag matching the new version
```

Then push:

```bash
git push origin main && git push origin vX.X.X
# Pre-push hook validates version alignment
# CI runs the same check
```

### Manual Way

If you prefer to do it manually:

1. Update versions in both:
   - `package.json`
   - `src-capacitor/package.json`

2. Create a commit:

   ```bash
   git commit -am "chore: bump version to X.X.X"
   ```

3. Create and push tag:

   ```bash
   git tag vX.X.X
   git push origin main && git push origin vX.X.X
   ```

## Notes

- Version tags can optionally include a `v` prefix (`v1.1.0` or `1.1.0`)
- The comparison is case-insensitive and normalizes the `v` prefix
- Bypassing hooks: `git push --no-verify` (not recommended)
