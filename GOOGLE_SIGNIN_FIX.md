# 🔍 Google Sign-In Troubleshooting Guide

## Issue: "An error occurred. Please try again"

You're getting this error when trying to login with Google after the account was created.

## ✅ I've Just Fixed It!

I've updated `js/auth.js` with:
- Better error messages (now shows actual error instead of generic message)
- Retry logic for reading user data
- Detailed console logging to help diagnose issues
- Better error handling

## 🔎 Next Step: Find The Real Error

### Step 1: Open Browser Console

1. Press **F12** on your keyboard (or Right-click → Inspect)
2. Click on the **Console** tab
3. Clear any existing messages (trash can icon)
4. Try Google Sign-In again
5. **Look for RED error messages**

### Step 2: Check What The Console Says

Look for messages like:

**If you see:**
```
Google sign-in successful, user: abc123
User document found: {name: "...", role: "student"}
Redirecting to dashboard for role: student
```
✅ **Good!** The sign-in is working. Issue is likely with the dashboard file.

**If you see:**
```
Missing or insufficient permissions
```
❌ **Firestore Rules Issue** - Rules weren't deployed properly

**If you see:**
```
Error creating user document
```
❌ **Firestore Rules Issue** - Can't create user documents

**If you see:**
```
user.uid is undefined
```
❌ **Authentication Issue** - Google sign-in didn't complete

**If you see:**
```
Cannot read property 'role' of undefined
```
❌ **User Document Issue** - Document wasn't created or can't be read

## 🛠️ Common Solutions

### Solution 1: Firestore Rules Not Deployed ⚠️ MOST COMMON

**Problem**: Rules still blocking user creation/login

**Fix**:
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select **edutech-system** project
3. Click **Firestore Database** → **Rules** tab
4. Make sure it shows "Last updated: Today" or "Just now"
5. If not, re-deploy the rules from `firestore.rules` file
6. Click **Publish**

### Solution 2: Google Sign-In Not Enabled

**Problem**: Google authentication not activated

**Fix**:
1. Firebase Console → **Authentication**
2. **Sign-in method** tab
3. Find **Google** in the list
4. Make sure it shows **Enabled** in green
5. If not, click on it → Toggle Enable → Save

### Solution 3: Dashboard File Doesn't Exist

**Problem**: Trying to redirect to non-existent file

**Fix**:
Check if these files exist in your project:
- `student-dashboard.html`
- `facilitator-dashboard.html`
- `admin-dashboard.html`

If they don't exist, run:
```
ls *.html
```

Or check your project folder.

### Solution 4: Clear Browser Cache

**Problem**: Old cached JavaScript causing issues

**Fix**:
1. Press **Ctrl + Shift + Delete**
2. Select "Cached images and files"
3. Select "All time"
4. Click "Clear data"
5. Close browser completely
6. Reopen and try again

### Solution 5: Try Incognito Mode

**Problem**: Browser extensions interfering

**Fix**:
1. Open Chrome Incognito (Ctrl + Shift + N)
2. Go to your site
3. Try Google Sign-In
4. If it works → Browser extension issue
5. If it doesn't → Check console for errors

## 📝 Detailed Debugging Steps

### Check 1: Is The User Created in Firebase?

1. Go to Firebase Console
2. Click **Authentication**
3. Look in the **Users** tab
4. Do you see your Google account?
   - ✅ Yes → User exists, issue is with login
   - ❌ No → User creation failed

### Check 2: Is The User Document Created in Firestore?

1. Go to Firebase Console
2. Click **Firestore Database**
3. Look for `users` collection
4. Find a document with your UID
5. Check if it has:
   - `name` field
   - `email` field
   - `role` field (should be "student")
   - ✅ Yes → Document exists, issue is with reading it
   - ❌ No → Document wasn't created (rules issue)

### Check 3: Test With Console Commands

In browser console (F12), paste this:

```javascript
// Test Firebase connection
firebase.auth().currentUser
// Should show your user object if logged in

// Test Firestore read
firebase.firestore().collection('users').doc(firebase.auth().currentUser.uid).get()
  .then(doc => console.log('User data:', doc.data()))
  .catch(err => console.error('Read error:', err))
```

## 🔧 Manual Fix (If Nothing Else Works)

If Google Sign-In created your account but you can't login:

### Option 1: Use Email/Password Instead

1. Go to Firebase Console → Authentication → Users
2. Find your Google account
3. Click the three dots → "Reset password"
4. Check your email
5. Set a password
6. Login with email/password instead of Google

### Option 2: Manually Create User Document

1. Go to Firebase Console → Firestore
2. Create collection: `users`
3. Add document with ID = your UID from Authentication
4. Add fields:
   ```
   name: "Your Name"
   email: "your@email.com"
   role: "student"
   userId: "STU123456"
   status: "active"
   createdAt: (current timestamp)
   ```
5. Try Google Sign-In again

## 📊 What To Tell Me

After checking the console, please share:

1. **Exact error message from console** (copy-paste the red text)
2. **Screenshot of console** (if possible)
3. **Which step succeeded**:
   - [ ] Google popup appeared
   - [ ] Google account selected
   - [ ] User created in Authentication
   - [ ] User document in Firestore
   - [ ] Redirect attempted
4. **Firestore Rules last updated**: Check timestamp in Rules tab

## 🚀 Quick Test Script

Run this in browser console (F12) while on your login page:

```javascript
// Test Google Sign-In
const provider = new firebase.auth.GoogleAuthProvider();
firebase.auth().signInWithPopup(provider)
  .then(result => {
    console.log('✅ Sign-in successful!');
    console.log('User:', result.user.uid);
    console.log('Email:', result.user.email);
    
    // Check if user document exists
    return firebase.firestore().collection('users').doc(result.user.uid).get();
  })
  .then(doc => {
    if (doc.exists) {
      console.log('✅ User document found!');
      console.log('Role:', doc.data().role);
    } else {
      console.log('❌ User document NOT found!');
    }
  })
  .catch(error => {
    console.error('❌ Error:', error.code, error.message);
  });
```

This will show exactly where the process is failing.

## 💡 Most Likely Cause

Based on your description:
- ✅ Google Sign-In works (account created)
- ❌ Login fails with generic error

**90% chance it's one of these:**

1. **Firestore Rules** - Not deployed or blocking reads
2. **User Document** - Created but can't be read
3. **Dashboard File** - Redirect failing because file doesn't exist

**Try this first:**
1. Check console (F12)
2. Re-deploy Firestore rules
3. Clear browser cache
4. Try again

## 📞 Still Stuck?

Share with me:
1. Console error messages (copy-paste)
2. Screenshot of Firebase Console → Firestore → users collection
3. Screenshot of Firebase Console → Authentication → Users tab
4. Last updated timestamp of Firestore Rules

I'll help you fix it! 🚀

