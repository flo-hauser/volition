# Google Play Fastlane Deployment - Precise Roadmap

## Status

- ✅ Local keystore available
- ✅ Can build signed APKs/bundles locally
- 🔄 Need to automate via Fastlane + CI

---

## Phase 1: Keystore & Gradle Setup (30 mins)

### Step 1.1: Extract Keystore Details

```bash
# From your local keystore, get the password and key info
keytool -list -v -keystore /path/to/your/keystore.jks

# You'll need:
# - Keystore password
# - Key alias
# - Key password
```

### Step 1.2: Encode Keystore for GitHub Secrets

```bash
# Base64 encode your keystore file
base64 < /path/to/your/keystore.jks > keystore_base64.txt

# Copy the output - this goes in GitHub Secret: KEYSTORE_BASE64
cat keystore_base64.txt | pbcopy  # macOS
# or use Windows/Linux equivalent
```

### Step 1.3: Add Signing Config to Gradle

**File:** `src-capacitor/android/app/build.gradle`

Add after line 24 (after `buildTypes` closing brace):

```gradle
signingConfigs {
    release {
        storeFile file("keystore.jks")
        storePassword System.getenv("KEYSTORE_PASSWORD")
        keyAlias System.getenv("KEY_ALIAS")
        keyPassword System.getenv("KEY_PASSWORD")
    }
}

buildTypes {
    release {
        signingConfig signingConfigs.release
        minifyEnabled true
        shrinkResources true
        proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
    }
}
```

### Step 1.4: Update Version Code Handling

**File:** `src-capacitor/android/app/build.gradle`

Line 10, change from static:

```gradle
versionCode 2
versionName "1.1.0"
```

To auto-increment:

```gradle
versionCode System.getenv("VERSION_CODE")?.toInteger() ?: 2
versionName System.getenv("VERSION_NAME") ?: "1.1.0"
```

---

## Phase 2: Fastlane Setup (20 mins)

### Step 2.1: Initialize Fastlane

```bash
cd src-capacitor/android

# Install fastlane
sudo gem install fastlane -NV
# or: brew install fastlane

# Initialize (will create fastlane/ directory)
fastlane init
# Select: "2. Get started with a supply file"
# Package name: eu.florianhauser.voiltion.app
```

### Step 2.2: Create Fastlane Gradle Plugin

**File:** `src-capacitor/android/fastlane/Fastfile`

```ruby
default_platform(:android)

platform :android do
  desc "Build and upload release bundle to Google Play (internal track)"
  lane :deploy_internal do
    # Build the release bundle
    gradle(
      task: "clean bundleRelease",
      project_dir: "app/",
      properties: {
        "android.injected.signing.store.file" => ENV["KEYSTORE_PATH"],
        "android.injected.signing.store.password" => ENV["KEYSTORE_PASSWORD"],
        "android.injected.signing.key.alias" => ENV["KEY_ALIAS"],
        "android.injected.signing.key.password" => ENV["KEY_PASSWORD"]
      }
    )

    # Upload to Play Store
    upload_to_play_store(
      track: 'internal',
      release_status: 'draft',
      aab: 'app/build/outputs/bundle/release/app-release.aab',
      json_key_data: ENV["PLAYSTORE_JSON_KEY_DATA"]
    )

    UI.success("✅ Successfully uploaded to Google Play (internal track)")
  end

  desc "Build and upload release bundle to Google Play (beta track)"
  lane :deploy_beta do
    gradle(
      task: "clean bundleRelease",
      project_dir: "app/",
      properties: {
        "android.injected.signing.store.file" => ENV["KEYSTORE_PATH"],
        "android.injected.signing.store.password" => ENV["KEYSTORE_PASSWORD"],
        "android.injected.signing.key.alias" => ENV["KEY_ALIAS"],
        "android.injected.signing.key.password" => ENV["KEY_PASSWORD"]
      }
    )

    upload_to_play_store(
      track: 'beta',
      release_status: 'completed',
      aab: 'app/build/outputs/bundle/release/app-release.aab',
      json_key_data: ENV["PLAYSTORE_JSON_KEY_DATA"]
    )

    UI.success("✅ Successfully uploaded to Google Play (beta track)")
  end
end
```

### Step 2.3: Create Fastlane Config

**File:** `src-capacitor/android/fastlane/.env.default`

```env
SUPPLY_PACKAGE_NAME=eu.florianhauser.voiltion.app
SUPPLY_JSON_KEY_DATA=<will be injected by CI>
```

---

## Phase 3: Google Play Service Account (20 mins)

### Step 3.1: Create Service Account in Google Cloud

```txt
1. Go to Google Cloud Console
   https://console.cloud.google.com

2. Create new project or select existing

3. Enable Google Play Android Developer API
   - Search "Google Play Android Developer API"
   - Click Enable

4. Create Service Account
   - Go to "Service Accounts"
   - Click "Create Service Account"
   - Name: "fastlane-ci"
   - Description: "CI/CD deployment to Google Play"
   - Create and Continue

5. Grant Permissions
   - Add role: "Basic" → "Editor" (or more restrictive: "Release Manager")
   - Continue

6. Create Key
   - Click on created service account
   - Go to "Keys" tab
   - "Add Key" → "Create new key"
   - Choose JSON format
   - Download JSON file
```

### Step 3.2: Grant Play Store Access

```txt
1. Go to Google Play Console
   https://play.google.com/console

2. Settings → Users and Permissions

3. Invite User
   - Email: service account email from JSON (xyz@yyy.iam.gserviceaccount.com)
   - Give role: "Release Manager" (minimum needed)
   - Accept invitation

4. In Play Console, ensure account has access to your app
```

### Step 3.3: Prepare Service Account JSON

```bash
# Encode the JSON for GitHub Secret
base64 < /path/to/service-account.json | pbcopy

# This goes in GitHub Secret: PLAYSTORE_JSON_KEY_DATA
```

---

## Phase 4: GitHub Secrets Setup (10 mins)

### Step 4.1: Add Required Secrets

Go to: **Settings → Secrets and variables → Actions → New repository secret**

Add these secrets:

| Secret Name | Value |
| --- | --- |
| `KEYSTORE_BASE64` | Base64 encoded keystore file |
| `KEYSTORE_PASSWORD` | Your keystore password |
| `KEY_ALIAS` | Your key alias (from keytool output) |
| `KEY_PASSWORD` | Your key password |
| `PLAYSTORE_JSON_KEY_DATA` | Base64 encoded service account JSON |

---

## Phase 5: CI Workflow Creation (30 mins)

### Step 5.1: Create Workflow File

**File:** `.github/workflows/deploy-playstore.yml`

```yaml
name: Deploy to Google Play

on:
  push:
    tags:
      - 'v*'

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm

      - name: Set up Java
        uses: actions/setup-java@v3
        with:
          distribution: 'temurin'
          java-version: '17'
          cache: gradle

      - name: Install dependencies
        run: npm ci

      - name: Extract version from tag
        id: version
        run: |
          TAG=${{ github.ref_name }}
          VERSION=${TAG#v}
          echo "version=$VERSION" >> $GITHUB_OUTPUT
          echo "version_code=$(($(date +%s) / 3600))" >> $GITHUB_OUTPUT

      - name: Build Android app
        run: npm run build:android
        env:
          VERSION_NAME: ${{ steps.version.outputs.version }}
          VERSION_CODE: ${{ steps.version.outputs.version_code }}

      - name: Set up Fastlane
        uses: actions/setup-ruby@v1
        with:
          ruby-version: 3.0
          bundler-cache: true

      - name: Decode keystore
        run: |
          echo "${{ secrets.KEYSTORE_BASE64 }}" | base64 -d > src-capacitor/android/app/keystore.jks

      - name: Deploy to Google Play (internal track)
        run: |
          cd src-capacitor/android
          fastlane deploy_internal
        env:
          KEYSTORE_PATH: ${{ github.workspace }}/src-capacitor/android/app/keystore.jks
          KEYSTORE_PASSWORD: ${{ secrets.KEYSTORE_PASSWORD }}
          KEY_ALIAS: ${{ secrets.KEY_ALIAS }}
          KEY_PASSWORD: ${{ secrets.KEY_PASSWORD }}
          PLAYSTORE_JSON_KEY_DATA: ${{ secrets.PLAYSTORE_JSON_KEY_DATA }}

      - name: Clean up keystore
        if: always()
        run: rm -f src-capacitor/android/app/keystore.jks

      - name: Create GitHub Release
        uses: softprops/action-gh-release@v1
        with:
          body: |
            ## Release ${{ steps.version.outputs.version }}
            
            Uploaded to Google Play internal track (draft).
            
            Review in [Google Play Console](https://play.google.com/console) and promote to beta/production when ready.
          draft: false
          prerelease: false
```

---

## Phase 6: Testing & Validation (1-2 hours)

### Step 6.1: Dry Run - Build Locally First

```bash
cd src-capacitor/android

# Test that Fastlane is configured
fastlane actions upload_to_play_store

# Test gradle build with signing
./gradlew clean bundleRelease \
  -Pandroid.injected.signing.store.file=path/to/keystore.jks \
  -Pandroid.injected.signing.store.password=YOUR_PASSWORD \
  -Pandroid.injected.signing.key.alias=YOUR_ALIAS \
  -Pandroid.injected.signing.key.password=YOUR_KEY_PASSWORD
```

### Step 6.2: Test CI Workflow

```bash
# Create a test tag (don't push yet)
git tag v1.2.0-test

# Or push to a test branch with workflow_dispatch trigger
```

### Step 6.3: Verify Google Play Upload

```txt
1. Check GitHub Actions logs for success
2. Go to Google Play Console
3. Verify new version appears in internal track (should be draft)
4. Download and test the AAB
```

### Step 6.4: Production Dry Run

```bash
# Create actual release tag
npm version patch
# This triggers the workflow
git push origin main
git push origin v1.2.1
```

---

## Phase 7: Documentation & Maintenance (15 mins)

### Step 7.1: Create Deployment Guide

**File:** `docs/DEPLOYMENT.md`

```markdown
# Deployment Guide

## Deploying to Google Play

### Automated Deployment via CI/CD

Simply tag a release:

\`\`\`bash
npm version patch  # or minor/major
git push origin main
git push origin v1.2.0
\`\`\`

This automatically:
1. Builds the release bundle
2. Signs with production keystore
3. Uploads to Google Play (internal/draft track)
4. Creates GitHub release

### Manual Review & Promotion

1. Go to [Google Play Console](https://play.google.com/console)
2. Navigate to "Release" → "Internal testing"
3. Review the new version
4. Test on devices
5. When satisfied, promote to "Beta" or "Production"

### Emergency Rollback

In Google Play Console:
1. Go to "Release" → "Production"
2. Click the problematic version
3. Select "Manage release"
4. Click "Roll out update"
5. Choose previous working version

### Local Signing (if needed)

\`\`\`bash
cd src-capacitor/android
fastlane deploy_internal  # or deploy_beta
\`\`\`

Requires local environment variables set:
- KEYSTORE_PATH
- KEYSTORE_PASSWORD
- KEY_ALIAS
- KEY_PASSWORD
- PLAYSTORE_JSON_KEY_DATA
```

### Step 7.2: Add to Main README

Add deployment info to root `README.md`:

```markdown
## Deployment

### Automated Google Play Deployment

Releases to Google Play are automated via GitHub Actions:

1. Update version: `npm version patch`
2. Push: `git push origin main && git push origin vX.X.X`
3. CI builds, signs, and uploads to Google Play (internal track)
4. Review in Google Play Console and promote

See [DEPLOYMENT.md](docs/DEPLOYMENT.md) for detailed guide.
```

---

## Checklist Summary

### Pre-Implementation ✅

- [ ] Extract keystore details locally
- [ ] Base64 encode keystore
- [ ] Base64 encode service account JSON
- [ ] Verify local signed build works

### Phase 1: Gradle

- [ ] Update `app/build.gradle` with signing config
- [ ] Update versionCode/versionName handling

### Phase 2: Fastlane

- [ ] Install fastlane locally
- [ ] Create `Fastfile` with deploy lanes
- [ ] Create `.env.default`

### Phase 3: Service Account

- [ ] Create Google Cloud service account
- [ ] Enable Google Play API
- [ ] Download service account JSON
- [ ] Add service account to Play Console

### Phase 4: GitHub Secrets

- [ ] Add all 5 secrets (keystore, passwords, service account)

### Phase 5: CI Workflow

- [ ] Create `.github/workflows/deploy-playstore.yml`
- [ ] Validate workflow syntax

### Phase 6: Testing

- [ ] Test local Fastlane build
- [ ] Create test tag and verify CI runs
- [ ] Check Google Play Console for upload
- [ ] Download and test APK/bundle

### Phase 7: Documentation

- [ ] Create/update `docs/DEPLOYMENT.md`
- [ ] Update root `README.md`
- [ ] Document emergency procedures

---

## Estimated Total Time: 3-4 hours

- Phase 1: 30 mins
- Phase 2: 20 mins
- Phase 3: 20 mins
- Phase 4: 10 mins
- Phase 5: 30 mins
- Phase 6: 1-2 hours (testing can take time)
- Phase 7: 15 mins

## Next Steps

Ready to proceed? Let's start with Phase 1 - I'll help you extract keystore details and prepare the secrets.
