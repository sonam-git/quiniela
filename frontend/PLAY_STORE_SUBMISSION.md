# 🚀 Quiniela Liga MX - Google Play Store Submission Guide

## ✅ Pre-Submission Checklist

### Files Ready
- [x] **Release AAB:** `android/app/build/outputs/bundle/release/app-release.aab` (19MB)
- [x] **App Icon (512x512):** `playstore-assets/app-icon-512.png`
- [x] **Feature Graphic (1024x500):** `playstore-assets/feature-graphic-1024x500.png`
- [x] **Screenshot:** `playstore-assets/screenshots/phone-screenshot-1.png`
- [x] **Privacy Policy:** `public/privacy-policy.html` (host this online)

---

## 📱 Step-by-Step Play Store Submission

### Step 1: Create a Google Play Developer Account
1. Go to [Google Play Console](https://play.google.com/console)
2. Pay the one-time $25 registration fee
3. Complete identity verification (may take 24-48 hours)

### Step 2: Create Your App
1. Click **"Create app"**
2. Fill in:
   - **App name:** Quiniela Liga MX
   - **Default language:** Spanish (Mexico) or English
   - **App or game:** App
   - **Free or paid:** Free
3. Accept the declarations and click **"Create app"**

### Step 3: Set Up Your Store Listing

#### Main Store Listing
- **App name:** Quiniela Liga MX
- **Short description (80 chars max):**
  ```
  Predict Liga MX match results and compete with friends in weekly Quinielas!
  ```
- **Full description (4000 chars max):**
  ```
  🎯 Quiniela Liga MX - The Ultimate Soccer Prediction Game!

  Join thousands of Liga MX fans in the most exciting prediction game! Make your picks for every match and compete to be the champion.

  ⚽ FEATURES:
  • Predict match results for all Liga MX games
  • Real-time score updates and live standings
  • Compete with friends and family
  • Track your prediction history
  • Weekly and season-long leaderboards
  • Push notifications for match reminders
  • Works offline - never miss a prediction!

  🏆 HOW IT WORKS:
  1. Sign up for free
  2. Make your predictions before each match
  3. Earn points for correct predictions
  4. Climb the leaderboard and become the champion!

  📊 SCORING:
  • Exact score prediction: 3 points
  • Correct result (win/draw/loss): 1 point
  • Track your performance over time

  🌟 WHY QUINIELA LIGA MX?
  • Beautiful, easy-to-use interface
  • Works on any Android device
  • No ads, no spam
  • Your data stays private
  • Regular updates with new features

  Download now and start predicting! ¡Vamos!

  Questions? Contact us at support@quiniela-ligamx.com
  ```

#### Graphics (Upload these files)
| Asset | Size | File |
|-------|------|------|
| App Icon | 512x512 | `playstore-assets/app-icon-512.png` |
| Feature Graphic | 1024x500 | `playstore-assets/feature-graphic-1024x500.png` |
| Phone Screenshots | 1080x1920 | `playstore-assets/screenshots/phone-screenshot-1.png` |

**Note:** You need 2-8 screenshots. Take more screenshots of different app screens!

### Step 4: App Content (Content Rating)

1. Go to **Policy > App content**
2. Complete the **Content rating questionnaire**:
   - Violence: None
   - Sexual content: None
   - Language: None
   - Controlled substances: None
   - Gambling: **No** (this is skill-based prediction, not gambling)
3. Your rating should be: **Everyone (E)**

### Step 5: Configure App Access (if needed)
- If your app requires login, provide test credentials:
  - **Email:** test@quiniela.com
  - **Password:** TestUser123!

### Step 6: Data Safety Declaration

1. Go to **Policy > App content > Data safety**
2. Complete the form:

| Data Type | Collected | Shared | Purpose |
|-----------|-----------|--------|---------|
| Email | Yes | No | Account management |
| Name | Yes | No | Personalization |
| App activity | Yes | No | Analytics |
| Device info | Yes | No | Analytics |

3. Declare:
   - Data is encrypted in transit: **Yes**
   - Users can request data deletion: **Yes**
   - Link to privacy policy: `https://your-domain.com/privacy-policy.html`

### Step 7: Target Audience

1. Go to **Policy > App content > Target audience**
2. Select: **18 and over** (safest option to avoid COPPA requirements)
3. Confirm your app is not designed for children

### Step 8: Upload Your App

1. Go to **Release > Production**
2. Click **"Create new release"**
3. Upload: `android/app/build/outputs/bundle/release/app-release.aab`
4. Add release notes:
   ```
   🎉 Initial Release - Quiniela Liga MX v1.0.0

   • Make predictions for Liga MX matches
   • Real-time leaderboard
   • Track your prediction history
   • Beautiful dark/light mode
   • Works offline!
   ```
5. Click **"Save"** then **"Review release"**

### Step 9: Review and Publish

1. Review all sections in the dashboard
2. Fix any warnings or errors
3. Click **"Start rollout to Production"**
4. Wait for Google's review (typically 1-3 days for new apps)

---

## 🔒 Privacy Policy Hosting

You need to host your privacy policy online. Options:
1. **GitHub Pages** (free) - Create a repo with the HTML file
2. **Your website** - Upload `public/privacy-policy.html`
3. **Firebase Hosting** (free tier)

The privacy policy is at: `frontend/public/privacy-policy.html`

---

## 📝 App Information Summary

| Field | Value |
|-------|-------|
| Package Name | `com.quiniela.ligamx` |
| App Name | Quiniela Liga MX |
| Version | 1.0.0 |
| Version Code | 1 |
| Min SDK | 22 (Android 5.1) |
| Target SDK | 36 (Android 16) |
| Category | Sports |
| Content Rating | Everyone |

---

## 🔄 Updating Your App

For future releases:

1. Update version in `android/app/build.gradle`:
   ```groovy
   versionCode 2  // Increment this
   versionName "1.1.0"  // Update version name
   ```

2. Rebuild:
   ```bash
   cd frontend
   npm run build
   npx cap sync android
   cd android
   ./gradlew bundleRelease
   ```

3. Upload new AAB to Play Console

---

## ⚠️ Important Notes

1. **Keep your keystore safe!** Store `keystore/quiniela-release.jks` in a secure backup
2. **Never lose your keystore** - you cannot update the app without it
3. **Google Play App Signing** - Consider enrolling for extra security
4. **Review time** - First submission takes 1-7 days; updates are faster

---

## 📞 Support

If you have questions about the submission process:
- [Google Play Console Help](https://support.google.com/googleplay/android-developer)
- [Android Developers Blog](https://android-developers.googleblog.com/)

Good luck with your launch! 🎉
