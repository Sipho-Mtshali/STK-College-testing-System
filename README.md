# OnlineTrack - Educational Platform

A comprehensive web-based educational system built with HTML, CSS, JavaScript, and Firebase. The platform supports role-based access for Students, Facilitators, and Admins with dedicated dashboards and features.

## 🌟 Features

### Student Features
- **Secure Authentication** - Login with email/password or Google
- **Interactive Dashboard** - View modules, tests, grades, and analytics
- **Test Creation** - Create tests for facilitators with visibility control
- **Module Access** - Browse and access learning materials
- **Grade Tracking** - View detailed grades and performance metrics
- **Analytics Dashboard** - Visual charts showing performance trends
- **Academic Calendar** - Track important dates and deadlines
- **Profile Management** - Update personal information

### Facilitator Features
- **Student Management** - View and manage assigned students
- **Module Creation** - Create and manage learning modules with content
- **Test Management** - Create tests with multiple question types
- **Test Visibility Control** - Show/hide tests from students
- **Grade Overview** - Review student submissions and grades
- **Analytics Dashboard** - Track class performance and trends
- **Assignment System** - Assign tests to students
- **Profile Management** - Update professional information

### Admin Features
- **User Management** - Add, edit, and delete users (students, facilitators, admins)
- **System Overview** - Monitor platform-wide statistics
- **User Analytics** - Track user growth and engagement
- **Module Oversight** - View all modules across the platform
- **Test Monitoring** - Monitor all tests and submissions
- **Comprehensive Reports** - Generate system reports
- **System Settings** - Configure platform settings
- **Activity Logs** - Monitor system-wide activity

## 🚀 Getting Started

### Prerequisites
- A modern web browser
- Firebase account
- Node.js (optional, for Firebase CLI)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd OnlineTrack
   ```

2. **Set up Firebase**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project
   - Enable Authentication (Email/Password and Google Sign-In)
   - Create a Firestore database
   - Create a Realtime Database
   - Copy your Firebase configuration

3. **Configure Firebase**
   - Open `js/firebase-config.js`
   - Replace the placeholder values with your Firebase configuration:
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

4. **Create an admin account**
   - First, register a user through the web interface
   - Then, manually update the user's role in Firebase Console:
     - Go to Firestore Database
     - Find the user in the `users` collection
     - Change the `role` field to `"admin"`

5. **Deploy to Firebase Hosting (Optional)**
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase init
   firebase deploy
   ```

## 📁 Project Structure

```
OnlineTrack/
├── index.html                      # Login page
├── student-dashboard.html          # Student dashboard
├── facilitator-dashboard.html      # Facilitator dashboard
├── admin-dashboard.html            # Admin dashboard
├── styles/
│   ├── main.css                   # Main styles and login page
│   └── dashboard.css              # Dashboard-specific styles
├── js/
│   ├── firebase-config.js         # Firebase configuration
│   ├── auth.js                    # Authentication logic
│   ├── student-dashboard.js       # Student dashboard logic
│   ├── facilitator-dashboard.js   # Facilitator dashboard logic
│   └── admin-dashboard.js         # Admin dashboard logic
├── firestore.rules                # Firestore security rules
├── database.rules.json            # Realtime Database security rules
├── firebase.json                  # Firebase hosting configuration
├── package.json                   # Project dependencies
└── README.md                      # This file
```

## 🎨 UI/UX Design

The platform features a modern, professional design with:
- **Responsive Layout** - Works on desktop, tablet, and mobile
- **Beautiful Gradients** - Eye-catching color schemes
- **Smooth Animations** - Polished user interactions
- **Intuitive Navigation** - Easy-to-use sidebar menus
- **Data Visualization** - Interactive charts and graphs
- **Clean Typography** - Easy-to-read content
- **Accessibility** - Designed with best practices

## 🔒 Security

- **Role-Based Access Control** - Users only access features permitted for their role
- **Firebase Authentication** - Secure user authentication
- **Firestore Security Rules** - Database-level security
- **Input Validation** - Client and server-side validation
- **Password Protection** - Secure password handling

## 🛠️ Technologies Used

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Firebase (Authentication, Firestore, Realtime Database)
- **Charts**: Chart.js
- **Icons**: Font Awesome
- **Hosting**: Firebase Hosting

## 📊 Database Structure

### Firestore Collections

**users**
- uid, name, email, role, userId, status, createdAt, lastLogin, phone, bio

**modules**
- name, code, description, content, createdBy, createdByName, createdAt

**tests**
- title, moduleId, moduleName, duration, description, visible, questions, createdBy, createdByName, createdAt

**grades**
- studentId, studentName, testId, testTitle, score, submittedAt, reviewed

## 🎯 Key Features

### Advanced Analytics
- Performance tracking with visual charts
- Question-level analysis
- Progress over time
- Grade distribution
- Class-wide statistics

### Test Management
- Multiple question types (Multiple Choice, True/False, Short Answer)
- Visibility controls
- Time limits
- Automatic grading (for objective questions)

### Module System
- Rich content support
- Module organization
- Progress tracking

### Calendar Integration
- Track important dates
- Test deadlines
- Event management

## 🤝 User Roles & Permissions

| Feature | Student | Facilitator | Admin |
|---------|---------|-------------|-------|
| View Modules | ✅ | ✅ | ✅ |
| Create Modules | ❌ | ✅ | ✅ |
| View Tests | ✅ (visible only) | ✅ | ✅ |
| Create Tests | ✅ | ✅ | ✅ |
| Take Tests | ✅ | ❌ | ❌ |
| View Own Grades | ✅ | ❌ | ❌ |
| View All Grades | ❌ | ✅ | ✅ |
| Manage Users | ❌ | ❌ | ✅ |
| System Analytics | ❌ | ✅ (limited) | ✅ |

## 📝 Usage

### For Students
1. Login with your credentials
2. Browse available modules
3. Take visible tests
4. View your grades and analytics
5. Create test proposals for facilitators

### For Facilitators
1. Login with your credentials
2. Create modules and add content
3. Create and manage tests
4. Control test visibility
5. Review student submissions
6. Track class performance

### For Admins
1. Login with admin credentials
2. Manage all users
3. Monitor system-wide activity
4. Generate reports
5. Configure system settings

## 🐛 Troubleshooting

**Can't login?**
- Verify your email and password
- Check if your account is active
- Clear browser cache and try again

**Firebase errors?**
- Ensure Firebase configuration is correct
- Check Firebase Console for service status
- Verify security rules are deployed

**Charts not showing?**
- Check browser console for errors
- Ensure Chart.js is loaded
- Verify data exists in database

## 📧 Support

For support, please contact: support@onlinetrack.edu

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Firebase for backend services
- Chart.js for data visualization
- Font Awesome for icons
- The open-source community

---

**Built with ❤️ for better education**

"# STK-College-testing-System" 
