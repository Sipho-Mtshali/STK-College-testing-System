# Firebase Setup Guide for Your OnlineTrack Project

## ✅ Firebase Configuration - DONE!

Your Firebase credentials have been configured:
- **Project ID**: edutech-system
- **App ID**: 1:1072073327476:web:5fdd0c76218a3a772ca221

## 🔐 Enable Google Sign-In

To enable Google authentication, follow these steps:

### Step 1: Enable Google Sign-In in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **edutech-system**
3. Click on **Authentication** in the left sidebar
4. Click on **Sign-in method** tab
5. Click on **Google** in the providers list
6. Toggle the **Enable** switch to ON
7. Add your project support email
8. Click **Save**

### Step 2: Add Authorized Domains

1. In the Firebase Authentication page
2. Go to **Settings** tab
3. Scroll to **Authorized domains**
4. Make sure these are added:
   - `localhost` (for local testing)
   - Your production domain (when you deploy)

### Step 3: Enable Firestore Database

1. Go to **Firestore Database** in the left sidebar
2. Click **Create database**
3. Choose **Start in production mode**
4. Select your preferred location (closest to your users)
5. Click **Enable**

### Step 4: Deploy Security Rules

1. In Firestore Database, go to **Rules** tab
2. Copy the content from `firestore.rules` file in your project
3. Paste it into the rules editor
4. Click **Publish**

**Important**: The security rules ensure:
- Students can only see visible tests
- Facilitators can manage their own content
- Admins have full access
- Users can only edit their own profiles

## 🎯 How Google Sign-In Works Now

### For New Users (Sign Up with Google)
1. Click "Continue with Google"
2. Select your Google account
3. **Automatic account creation**:
   - Creates user profile with role "student" by default
   - Generates a unique Student ID
   - Sets up student data collection
   - Redirects to student dashboard

### For Existing Users (Sign In with Google)
1. Click "Continue with Google"
2. Select your Google account
3. System recognizes existing account
4. Updates last login timestamp
5. Redirects to appropriate dashboard based on role

## 🔄 Changing User Roles

Users who sign up with Google are automatically assigned the "student" role. To promote users:

### Method 1: Using Firebase Console
1. Go to **Firestore Database**
2. Navigate to `users` collection
3. Find the user document
4. Edit the `role` field
5. Change to: `"student"`, `"facilitator"`, or `"admin"`
6. Save changes

### Method 2: Using Admin Dashboard (Once you have an admin account)
1. Login as admin
2. Go to User Management
3. Edit the user
4. Change their role
5. Save changes

## 👨‍💼 Creating Your First Admin Account

Since Google Sign-In creates students by default:

1. **Sign up with Google** (you'll be a student)
2. Go to Firebase Console → Firestore Database
3. Find your user in the `users` collection
4. Edit the document
5. Change `role` from `"student"` to `"admin"`
6. Save and refresh your browser
7. You're now an admin!

## 📱 Testing the System

### Test Email/Password Authentication
1. Open `index.html` in your browser
2. Click "Sign up"
3. Enter details and select role
4. Create account
5. Login with credentials

### Test Google Authentication
1. Open `index.html`
2. Click "Continue with Google"
3. Select your Google account
4. Should create account and login automatically

## 🚀 Deployment Options

### Option 1: Firebase Hosting (Recommended)
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

Your site will be at: `https://edutech-system.web.app`

### Option 2: Local Testing
```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx serve

# Or just open index.html in your browser
```

## ⚙️ Optional: Analytics Setup

Your project has Google Analytics enabled. To view analytics:

1. Go to Firebase Console
2. Click on **Analytics** in the left sidebar
3. View user engagement, retention, and behavior

## 🔒 Security Checklist

- ✅ Firebase configuration updated
- ⬜ Google Sign-In enabled in Firebase Console
- ⬜ Firestore Database created
- ⬜ Security rules deployed
- ⬜ Authorized domains configured
- ⬜ First admin account created
- ⬜ Test accounts created

## 🆘 Troubleshooting

### "This domain is not authorized"
- Add your domain to Authorized domains in Firebase Console
- For local testing, make sure `localhost` is in the list

### "Permission denied" errors
- Ensure security rules are deployed
- Check that user has the correct role in Firestore

### Google Sign-In popup blocked
- Allow popups in your browser for this site
- Try using redirect instead of popup (see documentation)

### User created but can't login
- Clear browser cache
- Check Firestore to ensure user document was created
- Verify the user's role is set correctly

## 📞 Support

If you encounter any issues:
1. Check the browser console for errors
2. Verify Firebase Console for service status
3. Review Firestore security rules
4. Check Authentication settings

## 🎉 You're All Set!

Your OnlineTrack platform is now configured with:
- ✅ Your Firebase project credentials
- ✅ Enhanced Google Sign-In (with automatic account creation)
- ✅ Email/Password authentication
- ✅ Role-based access control
- ✅ Security rules for data protection

**Next Steps:**
1. Enable Google Sign-In in Firebase Console (Step 1 above)
2. Create Firestore Database (Step 3 above)
3. Deploy security rules (Step 4 above)
4. Create your first admin account
5. Start using the platform!

Happy teaching and learning! 🎓

