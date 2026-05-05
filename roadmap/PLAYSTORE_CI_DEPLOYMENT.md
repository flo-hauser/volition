# Google Play Store CI/CD Deployment - Exploration

## Is It Possible? Yes ✅

Auto-deploying Android builds to Google Play from CI is definitely achievable. Here's what would be involved:

## Current State

- ✅ Android project structure in place (`src-capacitor/android/`)
- ✅ Gradle build system configured
- ✅ Version control in place (versionCode, versionName)
- ✅ Build script ready (`npm run build:android`)
- ❌ No signing configuration yet
- ❌ No Play Store credentials setup

## What Would Be Needed

### 1. **Android App Signing** 🔑

Currently missing from `src-capacitor/android/app/build.gradle`:

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
        proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
    }
}
```

**Setup required:**

- Generate keystore: `keytool -genkey -v -keystore volition.jks -keyalg RSA -keysize 2048 -validity 10000 -alias volition`
- Store securely (GitHub Secrets)
- Keep password safe

### 2. **Google Play API Access** 🔐

Need to set up:

```txt
1. Google Play Console (https://play.google.com/console)
   - Create app (already done)
   - Set up signing key
   - Create internal testing track for CI deploys

2. Service Account
   - Create in Google Cloud Console
   - Grant "Release Manager" role
   - Generate JSON key file
   - Store in GitHub Secrets as base64-encoded

3. GitHub Secrets needed:
   - KEYSTORE_PASSWORD
   - KEY_ALIAS
   - KEY_PASSWORD
   - PLAYSTORE_SERVICE_ACCOUNT (base64 encoded JSON)
```

### 3. **CI/CD Workflow Options**

#### Option A: Fastlane (Recommended) 🚀

Most popular, simplest approach:

```yaml
# .github/workflows/deploy-playstore.yml
name: Deploy to Google Play

on:
  push:
    tags:
      - 'v*'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - uses: actions/setup-java@v3
        with:
          distribution: 'temurin'
          java-version: '17'
      
      - run: npm ci
      - run: npm run build:android
      
      - uses: maierj/fastlane-action@v3.1.0
        with:
          lane: android deploy
          subdirectory: src-capacitor/android
        env:
          PLAYSTORE_JSON_KEY_DATA: ${{ secrets.PLAYSTORE_SERVICE_ACCOUNT }}
```

Requires `Fastfile` in `src-capacitor/android/fastlane/`:

```ruby
default_platform(:android)

platform :android do
  desc "Build and upload to Google Play"
  lane :deploy do
    gradle(
      task: "clean bundleRelease",
      project_dir: "app/",
      properties: { "android.injected.signing.store.file" => ENV["KEYSTORE_PATH"] }
    )
    upload_to_play_store(
      track: 'internal',
      release_status: 'draft',
      aab: 'app/build/outputs/bundle/release/app-release.aab'
    )
  end
end
```

#### Option B: Manual with gradle-play-publisher

More direct control, fewer dependencies:

```gradle
// In app/build.gradle
plugins {
    id 'com.gradle.plugin.publish' version '3.0.1'
}

play {
    serviceAccountCredentials = file(System.getenv('PLAYSTORE_JSON_KEY'))
    track = 'internal'
    releaseStatus = 'draft'
}
```

### 4. **Deployment Strategy** 📱

Recommended flow:

```txt
On tag push (e.g., git tag v1.2.0):
  1. CI builds APK/AAB
  2. Signs with production keystore
  3. Uploads to Play Store internal track (draft)
  4. You review in Play Console
  5. Manually promote to beta/production when ready

Benefits:
  ✓ Automated builds
  ✓ Human review before public release
  ✓ Safe rollback if issues found
```

### 5. **Version Synchronization** 🔗

Already in place:

- Root `package.json` version
- `src-capacitor/package.json` synced via postversion
- Android `versionCode` needs updating

Currently in `src-capacitor/android/app/build.gradle`:

```gradle
versionCode 2
versionName "1.1.0"
```

Would need script to auto-increment `versionCode`:

```bash
# Could auto-increment versionCode on each build
CURRENT=$(grep 'versionCode' app/build.gradle | grep -o '[0-9]*')
NEW=$((CURRENT + 1))
sed -i "s/versionCode .*/versionCode $NEW/" app/build.gradle
```

### 6. **Security Considerations** 🔒

**Critical:**

- ✅ Never commit keystore to git (add to `.gitignore`)
- ✅ Store credentials in GitHub Secrets, not in code
- ✅ Use service account, not personal credentials
- ✅ Limit service account permissions (Release Manager only)
- ✅ Rotate credentials periodically

## Implementation Effort

**Estimation:**

- Setting up signing: 30 mins
- Creating service account: 20 mins
- Writing CI workflow: 45 mins
- Testing & debugging: 1-2 hours
- **Total: 2-3 hours**

## Recommended Next Steps

1. **Decision:** Internal track only (draft) vs. automatic promotion?
2. **Setup:** Generate signing keystore
3. **Google Cloud:** Create service account with appropriate permissions
4. **GitHub:** Add secrets
5. **Workflow:** Create CI deployment job
6. **Testing:** Deploy to internal track and verify
7. **Documentation:** Document the process for future maintenance

## References

- [Fastlane Android Docs](https://docs.fastlane.tools/actions/upload_to_play_store/)
- [Gradle Play Publisher](https://github.com/Triple-T/gradle-play-publisher)
- [Google Play Console Docs](https://support.google.com/googleplay/android-developer)
- [Android App Signing](https://developer.android.com/studio/publish/app-signing)
