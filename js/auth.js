// Authentication Logic for OnlineTrack

// Helper function to get current user data
async function getCurrentUserData() {
    const user = auth.currentUser;
    if (!user) return null;
    
    try {
        const userDoc = await db.collection('users').doc(user.uid).get();
        if (userDoc.exists) {
            return userDoc.data();
        }
        return null;
    } catch (error) {
        console.error('Error getting user data:', error);
        return null;
    }
}

// Check if user is already logged in - but only on the login page
// Prevent auto-redirect during registration/login process
let isProcessingAuth = false;

auth.onAuthStateChanged(async (user) => {
    // Don't auto-redirect if we're in the middle of registration/login
    if (isProcessingAuth) {
        console.log('Skipping auto-redirect - auth process in progress');
        return;
    }
    
    if (user) {
        // Only auto-redirect if we're on the login page (index.html)
        const currentPage = window.location.pathname;
        const isLoginPage = currentPage.endsWith('index.html') || currentPage === '/' || currentPage.endsWith('/');
        
        if (isLoginPage) {
            console.log('User already logged in, checking profile...');
            try {
                const userData = await getCurrentUserData();
                if (userData && userData.role) {
                    console.log('Auto-redirecting to dashboard for role:', userData.role);
                    redirectToDashboard(userData.role);
                }
            } catch (error) {
                console.error('Auth state error:', error);
            }
        }
    }
});

// Toggle password visibility
const togglePassword = document.getElementById('togglePassword');
if (togglePassword) {
    togglePassword.addEventListener('click', function() {
        const passwordInput = document.getElementById('password');
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        this.classList.toggle('fa-eye');
        this.classList.toggle('fa-eye-slash');
    });
}

// Login Form Handler
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Set flag to prevent auto-redirect
        isProcessingAuth = true;
        
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const errorMsg = document.getElementById('error-message');
        const successMsg = document.getElementById('success-message');
        const submitBtn = loginForm.querySelector('.btn-primary');
        
        // Clear previous messages
        errorMsg.classList.add('hidden');
        successMsg.classList.add('hidden');
        
        // Disable button
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>Signing in...</span><i class="fas fa-spinner fa-spin"></i>';
        
        try {
            // Sign in with email and password
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            console.log('User signed in:', user.uid);
            
            // Get user data from Firestore with retry
            let userDoc = null;
            let retries = 5;
            
            while (retries > 0 && !userDoc) {
                try {
                    userDoc = await db.collection('users').doc(user.uid).get();
                    if (userDoc.exists) {
                        console.log('User document found');
                        break;
                    } else {
                        console.log('User document does not exist yet, retrying...');
                    }
                } catch (err) {
                    console.log('Error fetching user doc:', err);
                }
                retries--;
                if (retries > 0) await new Promise(resolve => setTimeout(resolve, 1500));
            }
            
            if (!userDoc || !userDoc.exists) {
                throw new Error('User data not found in database. Please contact administrator or try registering again.');
            }
            
            const userData = userDoc.data();
            console.log('User data retrieved:', userData);
            
            // Update last login
            try {
                await db.collection('users').doc(user.uid).update({
                    lastLogin: firebase.firestore.FieldValue.serverTimestamp()
                });
            } catch (err) {
                console.log('Could not update last login:', err);
            }
            
            // Show success message
            successMsg.textContent = 'Login successful! Redirecting...';
            successMsg.classList.remove('hidden');
            
            // Redirect based on role
            setTimeout(() => {
                isProcessingAuth = false;
                redirectToDashboard(userData.role);
            }, 1000);
            
        } catch (error) {
            console.error('Login error:', error);
            console.error('Error code:', error.code);
            console.error('Error message:', error.message);
            
            isProcessingAuth = false;
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<span>Sign In</span><i class="fas fa-arrow-right"></i>';
            
            let errorMessage = getErrorMessage(error.code);
            if (error.message && error.message.includes('User data not found')) {
                errorMessage = error.message;
            }
            
            errorMsg.textContent = errorMessage;
            errorMsg.classList.remove('hidden');
        }
    });
}

// Google Sign In Handler
const googleSignInBtn = document.getElementById('googleSignIn');
if (googleSignInBtn) {
    googleSignInBtn.addEventListener('click', async () => {
        // Set flag to prevent auto-redirect
        isProcessingAuth = true;
        
        const provider = new firebase.auth.GoogleAuthProvider();
        const errorMsg = document.getElementById('error-message');
        const successMsg = document.getElementById('success-message');
        
        // Clear messages
        errorMsg.classList.add('hidden');
        successMsg.classList.add('hidden');
        
        // Disable button
        googleSignInBtn.disabled = true;
        const originalText = googleSignInBtn.innerHTML;
        googleSignInBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Signing in...</span>';
        
        try {
            const result = await auth.signInWithPopup(provider);
            const user = result.user;
            
            console.log('Google sign-in successful, user:', user.uid);
            
            // Check if user exists in database with retry
            let userDoc = null;
            let retries = 3;
            
            while (retries > 0 && !userDoc) {
                try {
                    userDoc = await db.collection('users').doc(user.uid).get();
                    if (userDoc && userDoc.exists) {
                        console.log('User document found:', userDoc.data());
                        break;
                    }
                } catch (err) {
                    console.log('Retry fetching user doc:', err);
                }
                retries--;
                if (retries > 0) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
            
            if (userDoc && userDoc.exists) {
                // Existing user - Update last login
                try {
                    await db.collection('users').doc(user.uid).update({
                        lastLogin: firebase.firestore.FieldValue.serverTimestamp()
                    });
                } catch (updateErr) {
                    console.log('Could not update last login:', updateErr);
                }
                
                successMsg.textContent = 'Login successful! Redirecting...';
                successMsg.classList.remove('hidden');
                errorMsg.classList.add('hidden');
                
                console.log('Redirecting to dashboard for role:', userDoc.data().role);
                
                setTimeout(() => {
                    isProcessingAuth = false;
                    redirectToDashboard(userDoc.data().role);
                }, 1500);
            } else {
                // New user - Create account automatically as student
                console.log('Creating new user account...');
                const displayName = user.displayName || user.email.split('@')[0];
                const userId = 'STU' + Date.now().toString().slice(-6);
                
                try {
                    // Create user document in Firestore
                    await db.collection('users').doc(user.uid).set({
                        name: displayName,
                        email: user.email,
                        role: 'student',
                        userId: userId,
                        photoURL: user.photoURL || '',
                        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                        lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
                        status: 'active',
                        phone: '',
                        bio: ''
                    });
                    
                    console.log('User document created successfully');
                    
                    // Create student-specific data
                    try {
                        await db.collection('students').doc(user.uid).set({
                            enrolledModules: [],
                            completedTests: [],
                            grades: []
                        });
                        console.log('Student data created successfully');
                    } catch (studentErr) {
                        console.error('Error creating student data:', studentErr);
                    }
                    
                    successMsg.textContent = 'Account created successfully! Redirecting...';
                    successMsg.classList.remove('hidden');
                    errorMsg.classList.add('hidden');
                    
                    console.log('Redirecting to student dashboard...');
                    
                    setTimeout(() => {
                        isProcessingAuth = false;
                        redirectToDashboard('student');
                    }, 1500);
                } catch (createErr) {
                    console.error('Error creating user document:', createErr);
                    throw createErr;
                }
            }
        } catch (error) {
            console.error('Google sign in error:', error);
            console.error('Error details:', error.code, error.message);
            
            isProcessingAuth = false;
            googleSignInBtn.disabled = false;
            googleSignInBtn.innerHTML = originalText;
            
            let errorMessage = 'Google sign-in failed. ';
            if (error.code) {
                errorMessage = getErrorMessage(error.code);
            } else if (error.message) {
                errorMessage += error.message;
            } else {
                errorMessage += 'Please check the browser console for details.';
            }
            
            errorMsg.textContent = errorMessage;
            errorMsg.classList.remove('hidden');
        }
    });
}

// Forgot Password Handler
const forgotPasswordLink = document.querySelector('.forgot-password');
if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener('click', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value.trim();
        const errorMsg = document.getElementById('error-message');
        const successMsg = document.getElementById('success-message');
        
        if (!email) {
            errorMsg.textContent = 'Please enter your email address first';
            errorMsg.classList.remove('hidden');
            successMsg.classList.add('hidden');
            document.getElementById('email').focus();
            return;
        }
        
        if (!confirm(`Send password reset email to ${email}?`)) {
            return;
        }
        
        try {
            await auth.sendPasswordResetEmail(email);
            successMsg.textContent = 'Password reset email sent! Check your inbox.';
            successMsg.classList.remove('hidden');
            errorMsg.classList.add('hidden');
        } catch (error) {
            console.error('Password reset error:', error);
            errorMsg.textContent = getErrorMessage(error.code) || 'Failed to send reset email. Please check your email address.';
            errorMsg.classList.remove('hidden');
            successMsg.classList.add('hidden');
        }
    });
}

// Show Register Modal
const showRegisterBtn = document.getElementById('showRegister');
const registerModal = document.getElementById('registerModal');
const closeModalBtns = document.querySelectorAll('.close-modal');

if (showRegisterBtn && registerModal) {
    showRegisterBtn.addEventListener('click', (e) => {
        e.preventDefault();
        registerModal.classList.remove('hidden');
    });
}

// Close modal functionality
closeModalBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        btn.closest('.modal').classList.add('hidden');
    });
});

// Close modal on outside click
window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.classList.add('hidden');
    }
});

// Register Form Handler - FIXED VERSION
const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Set flag to prevent auto-redirect
        isProcessingAuth = true;
        
        const name = document.getElementById('regName').value.trim();
        const email = document.getElementById('regEmail').value.trim();
        const password = document.getElementById('regPassword').value;
        const role = document.getElementById('regRole').value;
        const submitBtn = registerForm.querySelector('.btn-primary');
        
        // Validation
        if (!name || !email || !password || !role) {
            alert('Please fill in all fields');
            isProcessingAuth = false;
            return;
        }
        
        if (password.length < 6) {
            alert('Password must be at least 6 characters');
            isProcessingAuth = false;
            return;
        }
        
        // Disable button
        submitBtn.disabled = true;
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<span>Creating Account...</span><i class="fas fa-spinner fa-spin"></i>';
        
        let userCredential = null;
        
        try {
            // Create user account
            userCredential = await auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            console.log('Auth user created:', user.uid);
            
            // Update profile
            try {
                await user.updateProfile({
                    displayName: name
                });
                console.log('Profile updated');
            } catch (profileErr) {
                console.log('Profile update error (non-critical):', profileErr);
            }
            
            // Generate ID based on role
            const idPrefix = role === 'student' ? 'STU' : 'FAC';
            const userId = idPrefix + Date.now().toString().slice(-6);
            
            // Add a small delay to ensure auth state is fully propagated
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Create user document in Firestore
            console.log('Creating Firestore document...');
            await db.collection('users').doc(user.uid).set({
                name: name,
                email: email,
                role: role,
                userId: userId,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
                status: 'active',
                phone: '',
                bio: '',
                photoURL: ''
            });
            
            console.log('Firestore user document created successfully');
            
            // Verify the document was created
            const verifyDoc = await db.collection('users').doc(user.uid).get();
            if (!verifyDoc.exists) {
                throw new Error('Failed to verify user document creation');
            }
            console.log('Document verified:', verifyDoc.data());
            
            // Create role-specific data
            if (role === 'student') {
                await db.collection('students').doc(user.uid).set({
                    enrolledModules: [],
                    completedTests: [],
                    grades: []
                });
                console.log('Student data created');
            } else if (role === 'facilitator') {
                await db.collection('facilitators').doc(user.uid).set({
                    assignedStudents: [],
                    createdModules: [],
                    createdTests: []
                });
                console.log('Facilitator data created');
            }
            
            // Close modal
            registerModal.classList.add('hidden');
            
            // Show success and redirect
            const successMsg = document.getElementById('success-message');
            successMsg.textContent = 'Account created successfully! Redirecting...';
            successMsg.classList.remove('hidden');
            
            // Wait for Firestore to fully sync before redirecting
            setTimeout(() => {
                console.log('Redirecting to dashboard...');
                isProcessingAuth = false;
                redirectToDashboard(role);
            }, 2000);
            
        } catch (error) {
            console.error('Registration error:', error);
            console.error('Error details:', error.code, error.message);
            
            isProcessingAuth = false;
            
            // If user was created but Firestore failed, try to delete the user
            if (userCredential && userCredential.user && error.message.includes('Firestore')) {
                try {
                    await userCredential.user.delete();
                    console.log('Cleaned up auth user after Firestore failure');
                } catch (deleteErr) {
                    console.error('Could not delete auth user:', deleteErr);
                }
            }
            
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
            
            let errorMessage = getErrorMessage(error.code) || 'Registration failed. Please try again.';
            
            // More specific error messages
            if (error.code === 'auth/email-already-in-use') {
                errorMessage = 'This email is already registered. Please use a different email or sign in.';
            } else if (error.code === 'auth/weak-password') {
                errorMessage = 'Password is too weak. Please use at least 6 characters.';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = 'Invalid email address. Please check your email format.';
            } else if (error.code === 'permission-denied' || error.message.includes('permission')) {
                errorMessage = 'Database permission error. Please check Firestore security rules.';
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            alert(errorMessage);
        }
    });
}

// Redirect to appropriate dashboard
function redirectToDashboard(role) {
    console.log('Redirecting to dashboard for role:', role);
    switch(role) {
        case 'student':
            window.location.href = 'student-dashboard.html';
            break;
        case 'facilitator':
            window.location.href = 'facilitator-dashboard.html';
            break;
        case 'admin':
            window.location.href = 'admin-dashboard.html';
            break;
        default:
            console.error('Unknown role:', role);
            window.location.href = 'index.html';
    }
}

// Get user-friendly error messages
function getErrorMessage(errorCode) {
    const errorMessages = {
        'auth/user-not-found': 'No account found with this email',
        'auth/wrong-password': 'Incorrect password',
        'auth/email-already-in-use': 'Email already registered',
        'auth/weak-password': 'Password should be at least 6 characters',
        'auth/invalid-email': 'Invalid email address',
        'auth/user-disabled': 'This account has been disabled',
        'auth/too-many-requests': 'Too many failed attempts. Please try again later',
        'auth/network-request-failed': 'Network error. Please check your connection',
        'auth/popup-closed-by-user': 'Sign-in cancelled',
        'auth/cancelled-popup-request': 'Sign-in cancelled',
        'auth/popup-blocked': 'Popup was blocked. Please allow popups for this site',
        'auth/invalid-credential': 'Invalid credentials. Please check your email and password',
        'auth/operation-not-allowed': 'This sign-in method is not enabled',
        'auth/requires-recent-login': 'Please sign in again to complete this action',
        'permission-denied': 'Permission denied. Please check database rules.'
    };
    
    return errorMessages[errorCode] || 'An error occurred. Please try again';
}