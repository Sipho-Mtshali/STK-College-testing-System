# OnlineTrack Setup Instructions

## Quick Setup Guide

Follow these steps to get your OnlineTrack educational platform up and running.

### Step 1: Firebase Project Setup

1. **Go to Firebase Console**
   - Visit [https://console.firebase.google.com/](https://console.firebase.google.com/)
   - Click "Add project" or select an existing project

2. **Enable Authentication**
   - Go to "Authentication" in the left sidebar
   - Click "Get started"
   - Enable "Email/Password" sign-in method
   - Enable "Google" sign-in method (optional)

3. **Create Firestore Database**
   - Go to "Firestore Database" in the left sidebar
   - Click "Create database"
   - Choose "Start in test mode" (we'll add security rules later)
   - Select your preferred location

4. **Create Realtime Database** (optional for real-time features)
   - Go to "Realtime Database" in the left sidebar
   - Click "Create database"
   - Start in test mode

5. **Get Firebase Configuration**
   - Go to Project Settings (gear icon)
   - Scroll down to "Your apps"
   - Click the web icon (</>)
   - Register your app
   - Copy the firebaseConfig object

### Step 2: Configure the Application

1. **Update Firebase Configuration**
   - Open `js/firebase-config.js`
   - Replace the placeholder values with your Firebase config:

   ```javascript
   const firebaseConfig = {
       apiKey: "YOUR_API_KEY",
       authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
       databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com",
       projectId: "YOUR_PROJECT_ID",
       storageBucket: "YOUR_PROJECT_ID.appspot.com",
       messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
       appId: "YOUR_APP_ID"
   };
   ```

### Step 3: Deploy Security Rules

1. **Deploy Firestore Rules**
   - In Firebase Console, go to "Firestore Database"
   - Click on "Rules" tab
   - Copy the content from `firestore.rules` file
   - Paste and publish

2. **Deploy Realtime Database Rules** (if using)
   - Go to "Realtime Database"
   - Click on "Rules" tab
   - Copy content from `database.rules.json`
   - Paste and publish

### Step 4: Create Initial Admin Account

Since users can only register as Students or Facilitators, you need to manually create an admin:

1. **Register through the web interface**
   - Open `index.html` in your browser
   - Click "Sign up"
   - Register with your email

2. **Promote to Admin**
   - Go to Firebase Console
   - Navigate to Firestore Database
   - Find your user in the `users` collection
   - Edit the document
   - Change `role` field from "student" to "admin"
   - Save

### Step 5: Test the Application

1. **Open index.html**
   - Double-click `index.html` or
   - Use a local server (recommended):
     ```bash
     # Using Python
     python -m http.server 8000
     
     # Using Node.js
     npx serve
     
     # Using VS Code Live Server extension
     ```

2. **Login with your admin account**
   - You should be redirected to the admin dashboard

3. **Create test users**
   - Use the admin dashboard to create student and facilitator accounts
   - Or register new accounts and assign roles manually

### Step 6: Deploy to Firebase Hosting (Optional)

1. **Install Firebase CLI**
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**
   ```bash
   firebase login
   ```

3. **Initialize Firebase Hosting**
   ```bash
   firebase init hosting
   ```
   - Select your Firebase project
   - Use current directory as public directory
   - Configure as single-page app: No
   - Don't overwrite index.html

4. **Deploy**
   ```bash
   firebase deploy
   ```

5. **Access your live site**
   - Your site will be available at `https://YOUR_PROJECT_ID.web.app`

## 🎓 Creating Your First Content

### As Admin

1. **Create Facilitator Accounts**
   - Go to "User Management"
   - Click "Add User"
   - Create facilitator accounts

2. **Create Student Accounts**
   - Same process, select "Student" role

### As Facilitator

1. **Create a Module**
   - Go to "Modules"
   - Click "Create Module"
   - Fill in module details and content

2. **Create a Test**
   - Go to "Tests"
   - Click "Create Test"
   - Add questions and set visibility

3. **Assign Tests**
   - Go to "Assignments"
   - Create new assignment
   - Select students and tests

### As Student

1. **Browse Modules**
   - Access learning materials
   - Study module content

2. **Take Tests**
   - View available tests
   - Complete within time limit

3. **View Results**
   - Check grades
   - Review analytics

## 🔧 Customization

### Changing Colors
Edit the CSS variables in `styles/main.css`:
```css
:root {
    --primary: #6366f1;
    --secondary: #f59e0b;
    /* ... more variables */
}
```

### Adding Features
- Student features: Edit `js/student-dashboard.js`
- Facilitator features: Edit `js/facilitator-dashboard.js`
- Admin features: Edit `js/admin-dashboard.js`

### Modifying UI
- Login page: `index.html` + `styles/main.css`
- Dashboards: `*-dashboard.html` + `styles/dashboard.css`

## 📱 Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge
- Opera

## ⚠️ Important Notes

1. **Security Rules**: Always keep security rules updated and restrictive
2. **Backup Data**: Regularly backup your Firestore data
3. **HTTPS**: Always use HTTPS in production
4. **API Keys**: Keep your Firebase config secure
5. **Testing**: Test role permissions thoroughly

## 🆘 Common Issues

**Issue**: "Permission denied" errors
- **Solution**: Check Firestore security rules and user roles

**Issue**: Charts not displaying
- **Solution**: Ensure Chart.js CDN is accessible and data exists

**Issue**: Can't create admin
- **Solution**: Manually set role in Firebase Console

**Issue**: Google Sign-In not working
- **Solution**: Enable in Firebase Console and add authorized domains

## 📈 Next Steps

1. Customize the platform to your needs
2. Add more features (file uploads, video content, etc.)
3. Implement email notifications
4. Add advanced analytics
5. Create mobile apps using the same Firebase backend

## 💡 Tips

- Start with a few test users to understand the workflow
- Use the admin dashboard to monitor initial usage
- Regularly check Firebase usage quotas
- Keep the README updated with your customizations

---

**Happy Teaching and Learning! 🎓**

