# 🔑 Test Accounts - Ready to Use!

## 🚀 Quick Start (2 Steps)

### Step 1: Create Test Accounts
1. Open `setup-test-accounts.html` in your browser
2. Click the big green button "CREATE TEST ACCOUNTS NOW"
3. Wait 10 seconds
4. Done! ✅

### Step 2: Login
1. Open `index.html`
2. Use any credentials below
3. You'll be redirected to the dashboard!

---

## 👥 Test Account Credentials

### 👨‍💼 ADMIN ACCOUNT
```
Email:    admin@test.com
Password: admin123
Dashboard: admin-dashboard.html
```
**Can do:** Everything! Manage users, view all data, system settings

---

### 👨‍🏫 FACILITATOR ACCOUNT
```
Email:    facilitator@test.com
Password: facilitator123
Dashboard: facilitator-dashboard.html
```
**Can do:** Create modules, create tests, view students, grade submissions

---

### 👨‍🎓 STUDENT ACCOUNT
```
Email:    student@test.com
Password: student123
Dashboard: student-dashboard.html
```
**Can do:** View modules, take tests, see grades, view analytics

---

## 📝 How To Login

1. Go to `index.html` (your login page)
2. Enter email and password from above
3. Click "Sign In"
4. You'll be redirected to the appropriate dashboard!

---

## 🎯 Testing Each Dashboard

### Test Admin Dashboard:
1. Login with: `admin@test.com` / `admin123`
2. You'll see admin-dashboard.html
3. Can manage users, view system analytics

### Test Facilitator Dashboard:
1. Login with: `facilitator@test.com` / `facilitator123`
2. You'll see facilitator-dashboard.html
3. Can create modules and tests

### Test Student Dashboard:
1. Login with: `student@test.com` / `student123`
2. You'll see student-dashboard.html
3. Can view modules and take tests

---

## ⚠️ If Login Still Doesn't Work

### Option 1: Check Console (F12)
1. Press F12 to open browser console
2. Try logging in
3. Look for error messages (red text)
4. Share the error with me

### Option 2: Make Sure Files Exist
Check if these files are in your project:
- `student-dashboard.html` ✓
- `facilitator-dashboard.html` ✓
- `admin-dashboard.html` ✓
- `js/firebase-config.js` ✓
- `js/auth.js` ✓

### Option 3: Verify Firestore Rules
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select **edutech-system**
3. Click **Firestore Database** → **Rules**
4. Make sure rules are published (check "Last updated" timestamp)

---

## 🔧 Troubleshooting

### Problem: "User data not found"
**Solution:** The account exists in Authentication but not in Firestore.
- Run `setup-test-accounts.html` again
- It will create the missing Firestore documents

### Problem: "Permission denied"
**Solution:** Firestore rules need to be updated.
1. Go to Firebase Console → Firestore → Rules
2. Copy content from `firestore.rules`
3. Paste and Publish

### Problem: "Invalid email or password"
**Solution:** Account doesn't exist yet.
- Run `setup-test-accounts.html` first
- Then try logging in

### Problem: Page redirects but shows blank/error
**Solution:** Dashboard HTML file is missing or has errors.
- Make sure all 3 dashboard files exist
- Check browser console (F12) for JavaScript errors

---

## 📊 What Each Dashboard Has

### Student Dashboard Features:
- ✅ View modules and content
- ✅ Take tests
- ✅ View grades
- ✅ Performance analytics with charts
- ✅ Academic calendar
- ✅ Profile management

### Facilitator Dashboard Features:
- ✅ Create and manage modules
- ✅ Create tests with questions
- ✅ Assign tests to students
- ✅ Grade submissions
- ✅ View class analytics
- ✅ Manage students
- ✅ Profile management

### Admin Dashboard Features:
- ✅ User management (add/edit/delete)
- ✅ View all students and facilitators
- ✅ System-wide analytics
- ✅ Monitor modules and tests
- ✅ Generate reports
- ✅ System settings

---

## 💡 Pro Tips

1. **Testing Multiple Roles:** Use different browser profiles or incognito windows to login as different users simultaneously

2. **Reset Password:** If you forget the password, you can reset it:
   - Go to Firebase Console → Authentication → Users
   - Click the 3 dots next to the user → Reset password

3. **Change Role:** To change a user's role:
   - Firebase Console → Firestore → users collection
   - Find the user document
   - Edit the `role` field

4. **Add More Test Users:** Run `setup-test-accounts.html` again or create them through the admin dashboard

---

## 🎉 You're All Set!

You now have 3 working test accounts to explore all features of your educational platform!

**Next Steps:**
1. Run `setup-test-accounts.html`
2. Login with any account above
3. Explore the dashboards
4. Test all features

**Enjoy your OnlineTrack platform!** 🚀

