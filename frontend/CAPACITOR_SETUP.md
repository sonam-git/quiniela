# Capacitor Mobile App Setup

This document explains how to build and deploy the Quiniela app to iOS and Android app stores.

## Prerequisites

### For iOS Development
- macOS (required)
- Xcode 15+ (install from Mac App Store)
- Apple Developer Account ($99/year for App Store distribution)
- CocoaPods: `sudo gem install cocoapods`

### For Android Development  
- Android Studio (latest version)
- JDK 17+
- Google Play Developer Account ($25 one-time fee)

---

## Project Structure

```
frontend/
├── src/                    # React source code
├── dist/                   # Built web app (copied to native apps)
├── ios/                    # iOS native project (created by cap add ios)
├── android/                # Android native project (created by cap add android)
├── resources/              # Source images for asset generation
│   ├── icon.png            # App icon source (1024x1024 recommended)
│   └── splash.png          # Splash screen source (2732x2732 recommended)
├── capacitor.config.json   # Capacitor configuration
└── package.json            # npm scripts for Capacitor
```

---

## Quick Start

### 1. Add Native Platforms

```bash
cd frontend

# Add iOS platform
npx cap add ios

# Add Android platform  
npx cap add android
```

### 2. Generate App Icons & Splash Screens

First, replace the source images with your high-resolution assets:

- `resources/icon.png` - **1024x1024px** (square, no transparency for iOS)
- `resources/splash.png` - **2732x2732px** (centered logo on solid background)

Then generate all required sizes:

```bash
# Generate all icon and splash screen sizes for both platforms
npm run cap:assets

# Or manually:
npx capacitor-assets generate
```

This creates all required sizes:
- iOS: 20px to 1024px icons, various splash screens
- Android: mdpi to xxxhdpi icons, various splash screens

### 3. Build & Open in IDE

```bash
# Build web app + sync + open Xcode
npm run cap:ios

# Build web app + sync + open Android Studio
npm run cap:android
```

---

## Development Workflow

### Making Changes

1. Edit your React code in `src/`
2. Run `npm run build` to build the web app
3. Run `npx cap sync` to copy build to native projects
4. Test in Xcode/Android Studio

### Live Reload (Development)

For faster development with live reload:

```bash
# Terminal 1: Start Vite dev server
npm run dev

# Update capacitor.config.json temporarily:
{
  "server": {
    "url": "http://YOUR_LOCAL_IP:3000",
    "cleartext": true
  }
}

# Terminal 2: Run on device/simulator
npx cap run ios
npx cap run android
```

---

## Platform-Specific Setup

### iOS (Xcode)

1. Open `ios/App/App.xcworkspace` in Xcode
2. Select your team in Signing & Capabilities
3. Update Bundle Identifier if needed
4. Configure capabilities (Push Notifications, etc.)
5. Build and run on simulator or device

### Android (Android Studio)

1. Open `android/` folder in Android Studio
2. Wait for Gradle sync
3. Update `applicationId` in `android/app/build.gradle`
4. Configure signing for release builds
5. Build and run on emulator or device

---

## Utilities Included

### Platform Detection
```javascript
import { isIOS, isAndroid, isNative, isWeb } from './utils/platform'

if (isNative()) {
  // Running in iOS/Android app
}
```

### Haptic Feedback
```javascript
import { hapticLight, hapticSuccess, hapticError } from './utils/haptics'

// On button press
<button onClick={() => { hapticLight(); doSomething(); }}>
  Click Me
</button>

// Or use the NativeButton component
import NativeButton from './components/NativeButton'

<NativeButton haptic="medium" variant="primary" onClick={handleSubmit}>
  Submit Bet
</NativeButton>
```

### Safe Area Insets (CSS)
```html
<!-- Already included in Navbar/Footer -->
<nav class="safe-top">...</nav>
<footer class="safe-bottom">...</footer>

<!-- Available utility classes -->
.safe-top      /* padding-top for notch */
.safe-bottom   /* padding-bottom for home indicator */
.safe-left     /* padding-left for landscape */
.safe-right    /* padding-right for landscape */
.safe-x        /* horizontal safe areas */
.safe-y        /* vertical safe areas */
.safe-all      /* all safe areas */
```

### Android Back Button
The app automatically handles the Android hardware back button to:
- Navigate through React Router history
- Exit app on home/login/signup screens

---

## Building for App Stores

### iOS App Store

1. **Create App Store Connect listing**
   - Log in to [App Store Connect](https://appstoreconnect.apple.com)
   - Create new app with your Bundle ID

2. **Build Archive in Xcode**
   ```bash
   npm run cap:build:ios
   ```
   - Open Xcode
   - Select "Any iOS Device" as target
   - Product → Archive
   - Distribute App → App Store Connect

3. **Submit for Review**
   - Add screenshots (6.5" and 5.5" iPhone required)
   - Fill in app description, keywords, etc.
   - Submit for review

### Google Play Store

1. **Create Play Console listing**
   - Log in to [Google Play Console](https://play.google.com/console)
   - Create new app

2. **Build Signed APK/Bundle**
   ```bash
   npm run cap:build:android
   ```
   - Open Android Studio
   - Build → Generate Signed Bundle/APK
   - Choose Android App Bundle (.aab) for Play Store

3. **Upload & Submit**
   - Upload .aab file
   - Add screenshots and graphics
   - Fill in store listing
   - Submit for review

---

## Troubleshooting

### iOS Issues

**Pod install fails:**
```bash
cd ios/App
pod install --repo-update
```

**Signing issues:**
- Ensure you have a valid Apple Developer account
- Check team selection in Xcode signing settings

### Android Issues

**Gradle sync fails:**
- File → Invalidate Caches → Restart
- Check Android Studio SDK Manager for updates

**Build fails:**
```bash
cd android
./gradlew clean
```

### General Issues

**Changes not showing:**
```bash
npm run build
npx cap sync
```

**Plugin not working:**
```bash
npx cap sync
# Restart IDE
```

---

## NPM Scripts Reference

| Script | Description |
|--------|-------------|
| `npm run cap:assets` | Generate icons and splash screens |
| `npm run cap:sync` | Sync web build to native projects |
| `npm run cap:ios` | Build + sync + open Xcode |
| `npm run cap:android` | Build + sync + open Android Studio |
| `npm run cap:build:ios` | Build + sync for iOS (no open) |
| `npm run cap:build:android` | Build + sync for Android (no open) |

---

## Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [iOS App Store Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Google Play Guidelines](https://play.google.com/about/developer-content-policy/)
- [App Store Screenshot Sizes](https://help.apple.com/app-store-connect/#/devd274dd925)
