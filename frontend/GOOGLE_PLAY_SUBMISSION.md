# Google Play Store Submission Guide

## App Information

| Field | Value |
|-------|-------|
| **App Name** | Quiniela - Liga MX |
| **Package Name** | com.quiniela.ligamx |
| **Category** | Sports |
| **Content Rating** | Everyone |

---

## 1. Prerequisites

### Google Play Developer Account
- Sign up at [Google Play Console](https://play.google.com/console)
- One-time $25 registration fee
- Verify your identity

### Signing Key
You need a signing key to publish. Create one in Android Studio:
1. Build → Generate Signed Bundle/APK
2. Create new keystore (SAVE THIS SECURELY - you need it for all updates!)

---

## 2. Required Store Assets

### App Icon
- ✅ Already generated in `android/app/src/main/res/mipmap-*/`
- For Play Store listing: **512x512 PNG** (no alpha)

### Feature Graphic
- **Size:** 1024 x 500 px
- **Format:** PNG or JPEG
- Used at top of store listing

### Screenshots (Required)
| Device Type | Required | Size |
|-------------|----------|------|
| Phone | 2-8 screenshots | 320-3840px, 16:9 or 9:16 |
| 7" Tablet | Optional | 320-3840px |
| 10" Tablet | Optional | 320-3840px |

### Video (Optional)
- YouTube URL
- 30 seconds to 2 minutes

---

## 3. Build Release Bundle

### Step 1: Build the web app
```bash
cd /Users/sonamjsherpa/Quiniela/frontend
npm run build
npx cap sync android
```

### Step 2: Open Android Studio
```bash
npx cap open android
```

### Step 3: Generate Signed Bundle
1. In Android Studio: **Build → Generate Signed Bundle / APK**
2. Select **Android App Bundle**
3. Click **Next**

### Step 4: Create/Select Keystore
**First time (Create new):**
- Key store path: Choose a secure location (NOT in your project!)
- Password: Create strong password
- Key alias: `quiniela-release`
- Key password: Create strong password
- Validity: 25+ years
- Fill in certificate info

**⚠️ IMPORTANT:** Back up your keystore file and passwords! You cannot update your app without them.

### Step 5: Build
- Select **release** build variant
- Click **Finish**
- Bundle will be at: `android/app/release/app-release.aab`

---

## 4. Store Listing Content

### Short Description (80 chars max)
```
Predict Liga MX match results and compete with friends! ⚽🏆
```

### Full Description (4000 chars max)
```
🏆 QUINIELA - LIGA MX PREDICTION GAME

Compete with friends and family by predicting Liga MX match results! Test your football knowledge and climb the leaderboard.

⚽ HOW IT WORKS
• View upcoming Liga MX matches
• Predict the score for each game
• Earn points for correct predictions
• Compete on the weekly leaderboard

🎯 FEATURES
• Real-time match schedules and results
• Easy-to-use prediction system
• Live leaderboards
• Weekly competitions
• Beautiful dark and light themes
• Works offline

📱 PERFECT FOR
• Liga MX fans
• Football enthusiasts  
• Friend groups and families
• Office pools and competitions

🌟 WHY QUINIELA?
• Free to play
• No ads
• Simple and intuitive interface
• Regular updates with new features

Download now and start predicting! Who will be the ultimate Quiniela champion?

#LigaMX #Football #Soccer #Predictions #Mexico
```

### Keywords/Tags
```
liga mx, mexican football, soccer predictions, quiniela, football game, 
sports betting, prediction game, liga mx schedule, mexican soccer, 
futbol mexicano, pronosticos, apuestas deportivas
```

---

## 5. Privacy Policy

You need a privacy policy URL. Create one at:
- [FreePrivacyPolicy.com](https://www.freeprivacypolicy.com/)
- [TermsFeed](https://www.termsfeed.com/)

### Required Disclosures:
- What data you collect (email, name, predictions)
- How you use the data
- Third-party services (if any)
- Data retention policy
- Contact information

---

## 6. Content Rating Questionnaire

In Play Console, answer the IARC questionnaire:

| Question | Suggested Answer |
|----------|------------------|
| Violence | None |
| Sexual Content | None |
| Language | None |
| Controlled Substances | None |
| Gambling | **Simulated Gambling** (predictions without real money) |
| User Interaction | Users can interact (leaderboards) |

**Expected Rating:** Everyone / PEGI 3

---

## 7. App Content Declarations

### Data Safety
Declare what your app collects:
- ✅ Email address (Account creation)
- ✅ Name (Profile display)
- ✅ User predictions (App functionality)
- ❌ Location - Not collected
- ❌ Financial info - Not collected

### Ads
- ❌ App does not contain ads

### Target Audience
- 13+ years old (due to account creation)

---

## 8. Release Checklist

Before submitting:

- [ ] App Bundle (.aab) built and signed
- [ ] App icon (512x512) uploaded
- [ ] Feature graphic (1024x500) created
- [ ] At least 2 phone screenshots
- [ ] Short description written
- [ ] Full description written
- [ ] Privacy policy URL added
- [ ] Content rating questionnaire completed
- [ ] Data safety form completed
- [ ] Target audience declared
- [ ] App category selected (Sports)
- [ ] Contact email provided

---

## 9. Testing Tracks

### Internal Testing (Recommended First)
- Up to 100 testers
- Instant availability
- Good for initial testing

### Closed Testing (Alpha/Beta)
- Invite-only testers
- Collect feedback before public release

### Open Testing
- Anyone can join
- Good for wider beta testing

### Production
- Public release to all users

---

## 10. Submission Timeline

| Step | Time |
|------|------|
| Account setup | 1-2 days (identity verification) |
| App review | 1-7 days (usually 1-3 days) |
| First rejection fix | If rejected, fix and resubmit |
| Live on store | After approval |

---

## 11. Post-Launch

### Monitor
- Crash reports in Play Console
- User reviews and ratings
- Download statistics

### Update Process
```bash
# Make changes to your React app
npm run build
npx cap sync android

# In Android Studio:
# 1. Increment versionCode in android/app/build.gradle
# 2. Build → Generate Signed Bundle
# 3. Upload new bundle to Play Console
```

### Version Numbering
Edit `android/app/build.gradle`:
```gradle
versionCode 2  // Increment for each upload
versionName "1.1.0"  // User-visible version
```

---

## Quick Commands Reference

```bash
# Build everything
npm run build && npx cap sync android

# Open in Android Studio
npx cap open android

# Clean build (if issues)
cd android && ./gradlew clean && cd ..
```

Good luck with your launch! 🚀
