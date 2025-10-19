// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyC8m_iv91L2EUEc6Xsg5DJHGWTdfUcxGZY",
    authDomain: "edutech-system.firebaseapp.com",
    projectId: "edutech-system",
    storageBucket: "edutech-system.firebasestorage.app",
    messagingSenderId: "1072073327476",
    appId: "1:1072073327476:web:5fdd0c76218a3a772ca221",
    measurementId: "G-6M9540ZEPE"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize services
const auth = firebase.auth();
const db = firebase.firestore();
const rt = null;// Student Dashboard Logic

let currentUser = null;
let currentPage = 'overview';

// Initialize dashboard
async function initDashboard() {
    // Wait for auth state to be ready
    return new Promise((resolve) => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            unsubscribe(); // Unsubscribe after first call
            
            if (!user) {
                console.log('No user logged in, redirecting...');
                window.location.href = 'index.html';
                return;
            }
            
            console.log('Auth user found:', user.uid);
            
            // Get user data with retry
            let userData = null;
            let retries = 5;
            
            while (retries > 0 && !userData) {
                try {
                    const userDoc = await db.collection('users').doc(user.uid).get();
                    if (userDoc.exists) {
                        userData = { uid: user.uid, ...userDoc.data() };
                        console.log('User data loaded:', userData);
                        break;
                    }
                } catch (error) {
                    console.error('Error fetching user data:', error);
                }
                retries--;
                if (retries > 0) await new Promise(resolve => setTimeout(resolve, 1000));
            }
            
            if (!userData) {
                console.error('Could not load user data');
                alert('Error loading user data. Please try logging in again.');
                await auth.signOut();
                window.location.href = 'index.html';
                return;
            }
            
            // Check if user has correct role
            if (userData.role !== 'student') {
                console.log('User is not a student, redirecting...');
                alert('Access denied. This page is for students only.');
                await auth.signOut();
                window.location.href = 'index.html';
                return;
            }
            
            currentUser = userData;
            console.log('Dashboard initialized for student:', currentUser.name);
            
            // Update user info
            document.getElementById('userName').textContent = currentUser.name.split(' ')[0];
            document.getElementById('welcomeName').textContent = currentUser.name.split(' ')[0];
            document.getElementById('profileAvatar').src = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name)}&background=6366f1&color=fff&size=150`;
            
            // Load initial data
            loadOverviewData();
            loadProfileData();
            
            // Set up event listeners
            setupEventListeners();
            
            resolve();
        });
    });
}

// Set up event listeners
function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const page = item.getAttribute('data-page');
            if (page) navigateToPage(page);
        });
    });
    
    // Logout
    document.getElementById('logoutBtn').addEventListener('click', async (e) => {
        e.preventDefault();
        await auth.signOut();
        window.location.href = 'index.html';
    });
    
    // Create Test Modal
    const createTestBtn = document.getElementById('createTestBtn');
    const createTestModal = document.getElementById('createTestModal');
    
    if (createTestBtn) {
        createTestBtn.addEventListener('click', () => {
            loadModulesForTest();
            createTestModal.classList.remove('hidden');
        });
    }
    
    // Add Question
    const addQuestionBtn = document.getElementById('addQuestionBtn');
    if (addQuestionBtn) {
        addQuestionBtn.addEventListener('click', addQuestionToTest);
    }
    
    // Submit Test Creation
    const createTestForm = document.getElementById('createTestForm');
    if (createTestForm) {
        createTestForm.addEventListener('submit', createTest);
    }
    
    // Profile Form
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', saveProfile);
    }
    
    // Close modals
    document.querySelectorAll('.close-modal, .cancel-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const modal = btn.closest('.modal');
            if (modal) modal.classList.add('hidden');
        });
    });
}

// Navigate to page
function navigateToPage(page) {
    currentPage = page;
    
    // Update nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-page') === page) {
            item.classList.add('active');
        }
    });
    
    // Show page
    document.querySelectorAll('.content-page').forEach(p => {
        p.classList.remove('active');
    });
    document.getElementById(page + 'Page').classList.add('active');
    
    // Load page data
    switch(page) {
        case 'overview':
            loadOverviewData();
            break;
        case 'modules':
            loadModules();
            break;
        case 'tests':
            loadTests();
            break;
        case 'grades':
            loadGrades();
            break;
        case 'analytics':
            loadAnalytics();
            break;
        case 'calendar':
            loadCalendar();
            break;
    }
}

// Load overview data
async function loadOverviewData() {
    try {
        // Load modules count
        const modulesSnapshot = await db.collection('modules').get();
        document.getElementById('totalModules').textContent = modulesSnapshot.size;
        
        // Load tests count
        const testsSnapshot = await db.collection('tests')
            .where('visible', '==', true)
            .get();
        document.getElementById('totalTests').textContent = testsSnapshot.size;
        
        // Load student grades
        const gradesSnapshot = await db.collection('grades')
            .where('studentId', '==', currentUser.uid)
            .get();
        
        let totalScore = 0;
        let completedCount = 0;
        
        gradesSnapshot.forEach(doc => {
            const grade = doc.data();
            if (grade.score) {
                totalScore += grade.score;
                completedCount++;
            }
        });
        
        const avgGrade = completedCount > 0 ? Math.round(totalScore / completedCount) : 0;
        document.getElementById('averageGrade').textContent = avgGrade + '%';
        document.getElementById('completedTests').textContent = completedCount;
        
        // Load recent modules
        loadRecentModules();
        
        // Load upcoming tests
        loadUpcomingTests();
        
        // Load performance chart
        loadPerformanceChart();
        
    } catch (error) {
        console.error('Error loading overview:', error);
    }
}

// Load recent modules
async function loadRecentModules() {
    const container = document.getElementById('recentModules');
    showLoading(container);
    
    try {
        const snapshot = await db.collection('modules')
            .orderBy('createdAt', 'desc')
            .limit(5)
            .get();
        
        if (snapshot.empty) {
            showEmptyState(container, 'No modules available yet', 'book');
            return;
        }
        
        let html = '';
        snapshot.forEach(doc => {
            const module = doc.data();
            html += `
                <div class="list-item">
                    <div class="list-item-header">
                        <div>
                            <div class="list-item-title">${module.name}</div>
                            <div class="list-item-meta">${module.code}</div>
                        </div>
                    </div>
                    <p style="font-size: 0.875rem; color: var(--gray-600); margin-top: 0.5rem;">
                        ${module.description || 'No description'}
                    </p>
                </div>
            `;
        });
        
        container.innerHTML = html;
    } catch (error) {
        console.error('Error loading modules:', error);
        showEmptyState(container, 'Error loading modules', 'exclamation-circle');
    }
}

// Load upcoming tests
async function loadUpcomingTests() {
    const container = document.getElementById('upcomingTests');
    showLoading(container);
    
    try {
        const snapshot = await db.collection('tests')
            .where('visible', '==', true)
            .limit(5)
            .get();
        
        if (snapshot.empty) {
            showEmptyState(container, 'No tests available', 'file-alt');
            return;
        }
        
        let html = '';
        snapshot.forEach(doc => {
            const test = doc.data();
            html += `
                <div class="list-item">
                    <div class="list-item-header">
                        <div>
                            <div class="list-item-title">${test.title}</div>
                            <div class="list-item-meta">${test.duration} minutes • ${test.questions?.length || 0} questions</div>
                        </div>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    } catch (error) {
        console.error('Error loading tests:', error);
        showEmptyState(container, 'Error loading tests', 'exclamation-circle');
    }
}

// Load modules
async function loadModules() {
    const container = document.getElementById('modulesGrid');
    showLoading(container);
    
    try {
        const snapshot = await db.collection('modules').get();
        
        if (snapshot.empty) {
            showEmptyState(container, 'No modules available yet', 'book');
            return;
        }
        
        let html = '';
        snapshot.forEach(doc => {
            const module = { id: doc.id, ...doc.data() };
            html += `
                <div class="module-card" onclick="viewModule('${module.id}')">
                    <div class="module-header">
                        <h3>${module.name}</h3>
                        <div class="module-code">${module.code}</div>
                    </div>
                    <div class="module-body">
                        <div class="module-description">
                            ${module.description || 'No description available'}
                        </div>
                        <div class="module-footer">
                            <span class="module-stat">
                                <i class="fas fa-book"></i>
                                ${module.content ? 'Content Available' : 'No content'}
                            </span>
                            <span class="module-stat">
                                <i class="fas fa-clock"></i>
                                ${formatDate(module.createdAt)}
                            </span>
                        </div>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    } catch (error) {
        console.error('Error loading modules:', error);
        showEmptyState(container, 'Error loading modules', 'exclamation-circle');
    }
}

// View module
function viewModule(moduleId) {
    showNotification('Opening module...', 'success');
}

// Load tests
async function loadTests() {
    const container = document.getElementById('testsGrid');
    showLoading(container);
    
    try {
        const snapshot = await db.collection('tests').get();
        
        if (snapshot.empty) {
            showEmptyState(container, 'No tests available', 'file-alt');
            return;
        }
        
        let html = '';
        snapshot.forEach(doc => {
            const test = { id: doc.id, ...doc.data() };
            const isVisible = test.visible;
            const canTake = isVisible;
            
            html += `
                <div class="test-card ${!isVisible ? 'test-disabled' : ''}">
                    <div class="test-header">
                        <div>
                            <div class="test-title">${test.title}</div>
                            <div class="test-module">${test.moduleName || 'General'}</div>
                        </div>
                        <span class="test-status ${isVisible ? 'available' : 'hidden'}">
                            ${isVisible ? 'Available' : 'Hidden'}
                        </span>
                    </div>
                    <p style="color: var(--gray-600); font-size: 0.875rem; margin-bottom: 1rem;">
                        ${test.description || 'No description'}
                    </p>
                    <div class="test-info">
                        <div class="test-info-item">
                            <i class="fas fa-clock"></i>
                            <span>${test.duration} min</span>
                        </div>
                        <div class="test-info-item">
                            <i class="fas fa-question-circle"></i>
                            <span>${test.questions?.length || 0} questions</span>
                        </div>
                    </div>
                    <div class="test-actions">
                        ${canTake ? `<button class="btn-take" onclick="takeTest('${test.id}')">Take Test</button>` : 
                                     `<button class="btn-view" disabled>Not Available</button>`}
                        <button class="btn-view" onclick="viewTestDetails('${test.id}')">View Details</button>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    } catch (error) {
        console.error('Error loading tests:', error);
        showEmptyState(container, 'Error loading tests', 'exclamation-circle');
    }
}

// Load modules for test creation
async function loadModulesForTest() {
    const select = document.getElementById('testModule');
    
    try {
        const snapshot = await db.collection('modules').get();
        let html = '<option value="">Select Module</option>';
        
        snapshot.forEach(doc => {
            const module = doc.data();
            html += `<option value="${doc.id}">${module.name} (${module.code})</option>`;
        });
        
        select.innerHTML = html;
    } catch (error) {
        console.error('Error loading modules:', error);
    }
}

// Add question to test
function addQuestionToTest() {
    const questionsList = document.getElementById('questionsList');
    const questionNum = questionsList.children.length + 1;
    
    const questionHtml = `
        <div class="question-item">
            <div class="input-group">
                <label>Question ${questionNum}</label>
                <textarea class="question-text" rows="3" placeholder="Enter question text" required></textarea>
            </div>
            <div class="input-group">
                <label>Question Type</label>
                <select class="question-type">
                    <option value="multiple-choice">Multiple Choice</option>
                    <option value="true-false">True/False</option>
                    <option value="short-answer">Short Answer</option>
                </select>
            </div>
            <div class="options-container">
                <label>Options (for multiple choice)</label>
                <div class="input-group">
                    <input type="text" class="option-input" placeholder="Option 1">
                </div>
                <div class="input-group">
                    <input type="text" class="option-input" placeholder="Option 2">
                </div>
                <div class="input-group">
                    <input type="text" class="option-input" placeholder="Option 3">
                </div>
                <div class="input-group">
                    <input type="text" class="option-input" placeholder="Option 4">
                </div>
            </div>
            <div class="input-group">
                <label>Correct Answer</label>
                <input type="text" class="correct-answer" placeholder="Enter correct answer" required>
            </div>
            <button type="button" class="btn-secondary" onclick="removeQuestion(this)" style="width: auto; margin-top: 1rem;">
                <i class="fas fa-trash"></i> Remove
            </button>
        </div>
    `;
    
    questionsList.insertAdjacentHTML('beforeend', questionHtml);
}

// Remove question
function removeQuestion(btn) {
    btn.closest('.question-item').remove();
}

// Create test
async function createTest(e) {
    e.preventDefault();
    
    const title = document.getElementById('testTitle').value.trim();
    const moduleId = document.getElementById('testModule').value;
    const duration = parseInt(document.getElementById('testDuration').value);
    const description = document.getElementById('testDescription').value.trim();
    const visible = document.getElementById('testVisible').checked;
    
    const questionItems = document.querySelectorAll('.question-item');
    const questions = [];
    
    questionItems.forEach(item => {
        const questionText = item.querySelector('.question-text').value.trim();
        const questionType = item.querySelector('.question-type').value;
        const correctAnswer = item.querySelector('.correct-answer').value.trim();
        const options = Array.from(item.querySelectorAll('.option-input'))
            .map(input => input.value.trim())
            .filter(val => val);
        
        questions.push({
            text: questionText,
            type: questionType,
            options: options,
            correctAnswer: correctAnswer
        });
    });
    
    if (questions.length === 0) {
        alert('Please add at least one question');
        return;
    }
    
    try {
        const moduleDoc = await db.collection('modules').doc(moduleId).get();
        const moduleName = moduleDoc.exists ? moduleDoc.data().name : 'General';
        
        await db.collection('tests').add({
            title, moduleId, moduleName, duration, description, visible, questions,
            createdBy: currentUser.uid,
            createdByName: currentUser.name,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            submissionCount: 0
        });
        
        showNotification('Test created successfully!', 'success');
        document.getElementById('createTestModal').classList.add('hidden');
        document.getElementById('createTestForm').reset();
        document.getElementById('questionsList').innerHTML = '';
        
        if (currentPage === 'tests') loadTests();
    } catch (error) {
        console.error('Error creating test:', error);
        showNotification('Error creating test', 'error');
    }
}

// Take test
function takeTest(testId) {
    showNotification('Loading test...', 'success');
}

// View test details
function viewTestDetails(testId) {
    showNotification('Loading test details...', 'success');
}

// Load grades
async function loadGrades() {
    const tbody = document.getElementById('gradesTableBody');
    showLoading(tbody);
    
    try {
        const snapshot = await db.collection('grades')
            .where('studentId', '==', currentUser.uid)
            .get();
        
        if (snapshot.empty) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 3rem;">
                        <i class="fas fa-inbox" style="font-size: 3rem; color: var(--gray-400); margin-bottom: 1rem;"></i>
                        <p style="color: var(--gray-500);">No grades yet</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        let html = '';
        let totalScore = 0;
        let passedCount = 0;
        
        snapshot.forEach(doc => {
            const grade = doc.data();
            const gradeLetter = calculateGradeLetter(grade.score);
            const passed = grade.score >= 60;
            
            if (passed) passedCount++;
            totalScore += grade.score;
            
            html += `
                <tr>
                    <td>${grade.testTitle}</td>
                    <td>${grade.moduleName || 'General'}</td>
                    <td>${formatDate(grade.submittedAt)}</td>
                    <td>${grade.score}%</td>
                    <td><span class="grade-badge ${gradeLetter.toLowerCase()}">${gradeLetter}</span></td>
                    <td><span class="status-badge ${passed ? 'active' : 'inactive'}">${passed ? 'Passed' : 'Failed'}</span></td>
                    <td>
                        <button class="action-btn edit" onclick="viewGradeDetails('${doc.id}')">
                            <i class="fas fa-eye"></i> View
                        </button>
                    </td>
                </tr>
            `;
        });
        
        tbody.innerHTML = html;
        
        const avgGpa = snapshot.size > 0 ? (totalScore / snapshot.size / 100 * 4).toFixed(2) : '0.0';
        document.getElementById('overallGpa').textContent = avgGpa;
        document.getElementById('testsPassed').textContent = `${passedCount}/${snapshot.size}`;
        
    } catch (error) {
        console.error('Error loading grades:', error);
    }
}

// View grade details
function viewGradeDetails(gradeId) {
    showNotification('Loading grade details...', 'success');
}

// Load analytics
async function loadAnalytics() {
    loadQuestionChart();
    loadGradeDistributionChart();
    loadProgressChart();
}

// Load question performance chart
async function loadQuestionChart() {
    const ctx = document.getElementById('questionChart');
    if (!ctx) return;
    
    try {
        const snapshot = await db.collection('grades')
            .where('studentId', '==', currentUser.uid)
            .get();
        
        let passed = 0, failed = 0;
        
        snapshot.forEach(doc => {
            const grade = doc.data();
            if (grade.score >= 60) passed++;
            else failed++;
        });
        
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Passed', 'Failed'],
                datasets: [{
                    data: [passed, failed],
                    backgroundColor: ['#10b981', '#ef4444'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: { legend: { position: 'bottom' } }
            }
        });
    } catch (error) {
        console.error('Error loading question chart:', error);
    }
}

// Load grade distribution chart
async function loadGradeDistributionChart() {
    const ctx = document.getElementById('gradeDistributionChart');
    if (!ctx) return;
    
    try {
        const snapshot = await db.collection('grades')
            .where('studentId', '==', currentUser.uid)
            .get();
        
        const distribution = { A: 0, B: 0, C: 0, D: 0, F: 0 };
        
        snapshot.forEach(doc => {
            const grade = doc.data();
            const letter = calculateGradeLetter(grade.score);
            distribution[letter]++;
        });
        
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['A', 'B', 'C', 'D', 'F'],
                datasets: [{
                    label: 'Number of Tests',
                    data: [distribution.A, distribution.B, distribution.C, distribution.D, distribution.F],
                    backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#f97316', '#ef4444']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
            }
        });
    } catch (error) {
        console.error('Error loading grade distribution:', error);
    }
}

// Load progress chart
async function loadProgressChart() {
    const ctx = document.getElementById('progressChart');
    if (!ctx) return;
    
    try {
        const snapshot = await db.collection('grades')
            .where('studentId', '==', currentUser.uid)
            .orderBy('submittedAt', 'asc')
            .get();
        
        const labels = [], scores = [];
        
        snapshot.forEach(doc => {
            const grade = doc.data();
            labels.push(formatDate(grade.submittedAt));
            scores.push(grade.score);
        });
        
        new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: 'Test Scores',
                    data: scores,
                    borderColor: '#6366f1',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: { y: { beginAtZero: true, max: 100 } }
            }
        });
    } catch (error) {
        console.error('Error loading progress chart:', error);
    }
}

// Load performance chart (for overview)
async function loadPerformanceChart() {
    const ctx = document.getElementById('performanceChart');
    if (!ctx) return;
    
    try {
        const snapshot = await db.collection('grades')
            .where('studentId', '==', currentUser.uid)
            .orderBy('submittedAt', 'desc')
            .limit(5)
            .get();
        
        const labels = [], scores = [];
        
        snapshot.forEach(doc => {
            const grade = doc.data();
            labels.unshift(grade.testTitle.substring(0, 20));
            scores.unshift(grade.score);
        });
        
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: 'Score (%)',
                    data: scores,
                    backgroundColor: 'rgba(99, 102, 241, 0.8)',
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: { y: { beginAtZero: true, max: 100 } }
            }
        });
    } catch (error) {
        console.error('Error loading performance chart:', error);
    }
}

// Load calendar
function loadCalendar() {
    const calendar = document.getElementById('calendar');
    const currentMonthElement = document.getElementById('currentMonth');
    
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    currentMonthElement.textContent = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    
    let html = '';
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    dayNames.forEach(day => {
        html += `<div class="calendar-day" style="font-weight: 600; color: var(--gray-600);">${day}</div>`;
    });
    
    for (let i = 0; i < firstDay; i++) {
        html += '<div class="calendar-day"></div>';
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
        const isToday = day === now.getDate();
        html += `<div class="calendar-day ${isToday ? 'today' : ''}">${day}</div>`;
    }
    
    calendar.innerHTML = html;
}

// Load profile data
function loadProfileData() {
    document.getElementById('profileName').value = currentUser.name || '';
    document.getElementById('profileEmail').value = currentUser.email || '';
    document.getElementById('profileStudentId').value = currentUser.userId || '';
    document.getElementById('profilePhone').value = currentUser.phone || '';
    document.getElementById('profileDob').value = currentUser.dob || '';
    document.getElementById('profileGender').value = currentUser.gender || '';
    document.getElementById('profileBio').value = currentUser.bio || '';
}

// Save profile
async function saveProfile(e) {
    e.preventDefault();
    
    try {
        await db.collection('users').doc(currentUser.uid).update({
            name: document.getElementById('profileName').value.trim(),
            phone: document.getElementById('profilePhone').value.trim(),
            dob: document.getElementById('profileDob').value,
            gender: document.getElementById('profileGender').value,
            bio: document.getElementById('profileBio').value.trim()
        });
        
        currentUser.name = document.getElementById('profileName').value.trim();
        document.getElementById('userName').textContent = currentUser.name.split(' ')[0];
        document.getElementById('welcomeName').textContent = currentUser.name.split(' ')[0];
        
        showNotification('Profile updated successfully!', 'success');
    } catch (error) {
        console.error('Error saving profile:', error);
        showNotification('Error updating profile', 'error');
    }
}

// Add CSS for disabled tests
const style = document.createElement('style');
style.textContent = `.test-disabled { opacity: 0.6; }`;
document.head.appendChild(style);

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initDashboard);