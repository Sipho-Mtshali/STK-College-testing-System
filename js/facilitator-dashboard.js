// Facilitator Dashboard Logic

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
            if (userData.role !== 'facilitator') {
                console.log('User is not a facilitator, redirecting...');
                alert('Access denied. This page is for facilitators only.');
                await auth.signOut();
                window.location.href = 'index.html';
                return;
            }
            
            currentUser = userData;
            console.log('Dashboard initialized for facilitator:', currentUser.name);
            
            // Update user info
            document.getElementById('userName').textContent = currentUser.name.split(' ')[0];
            document.getElementById('welcomeName').textContent = currentUser.name.split(' ')[0];
            document.getElementById('profileAvatar').src = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name)}&background=f59e0b&color=fff&size=150`;
            
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
    
    // Create Module
    const createModuleBtn = document.getElementById('createModuleBtn');
    const createModuleModal = document.getElementById('createModuleModal');
    
    if (createModuleBtn && createModuleModal) {
        createModuleBtn.addEventListener('click', () => {
            createModuleModal.classList.remove('hidden');
        });
        
        document.getElementById('createModuleForm').addEventListener('submit', createModule);
    }
    
    // Create Test
    const createTestBtn = document.getElementById('createTestBtn');
    const createTestModal = document.getElementById('createTestModal');
    
    if (createTestBtn && createTestModal) {
        createTestBtn.addEventListener('click', () => {
            loadModulesForTest();
            createTestModal.classList.remove('hidden');
        });
        
        document.getElementById('addQuestionBtn').addEventListener('click', addQuestionToTest);
        document.getElementById('createTestForm').addEventListener('submit', createTest);
    }
    
    // Assign Student
    const assignStudentBtn = document.getElementById('assignStudentBtn');
    if (assignStudentBtn) {
        assignStudentBtn.addEventListener('click', () => {
            showNotification('Student assignment feature coming soon', 'success');
        });
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
        case 'students':
            loadStudents();
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
        case 'assignments':
            loadAssignments();
            break;
    }
}

// Load overview data
async function loadOverviewData() {
    try {
        // Load total students
        const studentsSnapshot = await db.collection('users')
            .where('role', '==', 'student')
            .get();
        document.getElementById('totalStudents').textContent = studentsSnapshot.size;
        
        // Load modules created by facilitator
        const modulesSnapshot = await db.collection('modules')
            .where('createdBy', '==', currentUser.uid)
            .get();
        document.getElementById('totalModules').textContent = modulesSnapshot.size;
        
        // Load tests created by facilitator
        const testsSnapshot = await db.collection('tests')
            .where('createdBy', '==', currentUser.uid)
            .get();
        document.getElementById('totalTests').textContent = testsSnapshot.size;
        
        // Load pending grades
        const pendingSnapshot = await db.collection('grades')
            .where('reviewed', '==', false)
            .get();
        document.getElementById('pendingGrades').textContent = pendingSnapshot.size;
        
        // Load recent submissions
        loadRecentSubmissions();
        
        // Load class performance chart
        loadClassPerformanceChart();
        
        // Load recent activity
        loadRecentActivity();
        
    } catch (error) {
        console.error('Error loading overview:', error);
    }
}

// Load recent submissions
async function loadRecentSubmissions() {
    const container = document.getElementById('recentSubmissions');
    showLoading(container);
    
    try {
        const snapshot = await db.collection('grades')
            .orderBy('submittedAt', 'desc')
            .limit(5)
            .get();
        
        if (snapshot.empty) {
            showEmptyState(container, 'No submissions yet', 'inbox');
            return;
        }
        
        let html = '';
        snapshot.forEach(doc => {
            const submission = doc.data();
            html += `
                <div class="list-item">
                    <div class="list-item-header">
                        <div>
                            <div class="list-item-title">${submission.studentName}</div>
                            <div class="list-item-meta">${submission.testTitle}</div>
                        </div>
                        <span class="status-badge ${submission.score >= 60 ? 'active' : 'inactive'}">
                            ${submission.score}%
                        </span>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    } catch (error) {
        console.error('Error loading submissions:', error);
        showEmptyState(container, 'Error loading submissions', 'exclamation-circle');
    }
}

// Load class performance chart
async function loadClassPerformanceChart() {
    const ctx = document.getElementById('classPerformanceChart');
    if (!ctx) return;
    
    try {
        const snapshot = await db.collection('grades').get();
        
        let passed = 0;
        let failed = 0;
        
        snapshot.forEach(doc => {
            const grade = doc.data();
            if (grade.score >= 60) {
                passed++;
            } else {
                failed++;
            }
        });
        
        new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['Passed', 'Failed'],
                datasets: [{
                    data: [passed, failed],
                    backgroundColor: ['#10b981', '#ef4444']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error loading chart:', error);
    }
}

// Load recent activity
async function loadRecentActivity() {
    const container = document.getElementById('recentActivity');
    showLoading(container);
    
    try {
        const html = `
            <div class="list-item">
                <div class="list-item-header">
                    <div>
                        <div class="list-item-title">New test submission</div>
                        <div class="list-item-meta">2 hours ago</div>
                    </div>
                </div>
            </div>
        `;
        
        container.innerHTML = html || showEmptyState(container, 'No recent activity', 'clock');
    } catch (error) {
        console.error('Error loading activity:', error);
    }
}

// Load students
async function loadStudents() {
    const tbody = document.getElementById('studentsTableBody');
    showLoading(tbody);
    
    try {
        const snapshot = await db.collection('users')
            .where('role', '==', 'student')
            .get();
        
        if (snapshot.empty) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 3rem;">
                        <i class="fas fa-users" style="font-size: 3rem; color: var(--gray-400); margin-bottom: 1rem;"></i>
                        <p style="color: var(--gray-500);">No students found</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        let html = '';
        for (const doc of snapshot.docs) {
            const student = doc.data();
            
            // Get grade average
            const gradesSnapshot = await db.collection('grades')
                .where('studentId', '==', doc.id)
                .get();
            
            let avgGrade = 0;
            if (!gradesSnapshot.empty) {
                let total = 0;
                gradesSnapshot.forEach(gradeDoc => {
                    total += gradeDoc.data().score;
                });
                avgGrade = Math.round(total / gradesSnapshot.size);
            }
            
            html += `
                <tr>
                    <td>
                        <div class="user-cell">
                            <img class="user-avatar" src="https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=6366f1&color=fff" alt="${student.name}">
                            <div class="user-info">
                                <h4>${student.name}</h4>
                            </div>
                        </div>
                    </td>
                    <td>${student.userId}</td>
                    <td>${student.email}</td>
                    <td>0</td>
                    <td>${avgGrade}%</td>
                    <td><span class="status-badge ${student.status}">${student.status}</span></td>
                    <td>
                        <button class="action-btn edit" onclick="viewStudent('${doc.id}')">
                            <i class="fas fa-eye"></i> View
                        </button>
                    </td>
                </tr>
            `;
        }
        
        tbody.innerHTML = html;
    } catch (error) {
        console.error('Error loading students:', error);
    }
}

// View student details
function viewStudent(studentId) {
    showNotification('Loading student details...', 'success');
}

// Load modules
async function loadModules() {
    const container = document.getElementById('modulesGrid');
    showLoading(container);
    
    try {
        const snapshot = await db.collection('modules').get();
        
        if (snapshot.empty) {
            showEmptyState(container, 'No modules yet. Create your first module!', 'book');
            return;
        }
        
        let html = '';
        snapshot.forEach(doc => {
            const module = { id: doc.id, ...doc.data() };
            const isOwner = module.createdBy === currentUser.uid;
            
            html += `
                <div class="module-card">
                    <div class="module-header">
                        <h3>${module.name}</h3>
                        <div class="module-code">${module.code}</div>
                    </div>
                    <div class="module-body">
                        <div class="module-description">
                            ${module.description || 'No description'}
                        </div>
                        <div class="module-footer">
                            <span class="module-stat">
                                <i class="fas fa-user"></i>
                                ${module.createdByName || 'Unknown'}
                            </span>
                            ${isOwner ? `
                                <button class="action-btn edit" onclick="editModule('${module.id}')">
                                    <i class="fas fa-edit"></i>
                                </button>
                            ` : ''}
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

// Create module
async function createModule(e) {
    e.preventDefault();
    
    const name = document.getElementById('moduleName').value.trim();
    const code = document.getElementById('moduleCode').value.trim();
    const description = document.getElementById('moduleDescription').value.trim();
    const content = document.getElementById('moduleContent').value.trim();
    
    try {
        await db.collection('modules').add({
            name: name,
            code: code,
            description: description,
            content: content,
            createdBy: currentUser.uid,
            createdByName: currentUser.name,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        showNotification('Module created successfully!', 'success');
        document.getElementById('createModuleModal').classList.add('hidden');
        document.getElementById('createModuleForm').reset();
        
        if (currentPage === 'modules') {
            loadModules();
        }
    } catch (error) {
        console.error('Error creating module:', error);
        showNotification('Error creating module', 'error');
    }
}

// Edit module
function editModule(moduleId) {
    showNotification('Module editing feature coming soon', 'success');
}

// Load tests
async function loadTests() {
    const container = document.getElementById('testsGrid');
    showLoading(container);
    
    try {
        const snapshot = await db.collection('tests').get();
        
        if (snapshot.empty) {
            showEmptyState(container, 'No tests yet. Create your first test!', 'file-alt');
            return;
        }
        
        let html = '';
        snapshot.forEach(doc => {
            const test = { id: doc.id, ...doc.data() };
            const isOwner = test.createdBy === currentUser.uid;
            
            html += `
                <div class="test-card">
                    <div class="test-header">
                        <div>
                            <div class="test-title">${test.title}</div>
                            <div class="test-module">${test.moduleName || 'General'}</div>
                        </div>
                        <span class="test-status ${test.visible ? 'available' : 'hidden'}">
                            ${test.visible ? 'Visible' : 'Hidden'}
                        </span>
                    </div>
                    <p style="color: var(--gray-600); font-size: 0.875rem; margin: 1rem 0;">
                        ${test.description || 'No description'}
                    </p>
                    <div class="test-info">
                        <div class="test-info-item">
                            <i class="fas fa-clock"></i>
                            <span>${test.duration} min</span>
                        </div>
                        <div class="test-info-item">
                            <i class="fas fa-question"></i>
                            <span>${test.questions?.length || 0} questions</span>
                        </div>
                        <div class="test-info-item">
                            <i class="fas fa-users"></i>
                            <span>${test.submissionCount || 0} submissions</span>
                        </div>
                    </div>
                    <div class="test-actions">
                        ${isOwner ? `
                            <button class="btn-view" onclick="toggleTestVisibility('${test.id}', ${!test.visible})">
                                <i class="fas fa-eye${test.visible ? '-slash' : ''}"></i> 
                                ${test.visible ? 'Hide' : 'Show'}
                            </button>
                            <button class="btn-view" onclick="editTest('${test.id}')">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                        ` : `
                            <button class="btn-view" onclick="viewTest('${test.id}')">
                                <i class="fas fa-eye"></i> View
                            </button>
                        `}
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

// Toggle test visibility
async function toggleTestVisibility(testId, newVisibility) {
    try {
        await db.collection('tests').doc(testId).update({
            visible: newVisibility
        });
        
        showNotification(`Test ${newVisibility ? 'shown' : 'hidden'} successfully`, 'success');
        loadTests();
    } catch (error) {
        console.error('Error toggling visibility:', error);
        showNotification('Error updating test', 'error');
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
                <label>Options</label>
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
            <div class="input-group">
                <label>Points</label>
                <input type="number" class="question-points" value="1" min="1" required>
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
        const points = parseInt(item.querySelector('.question-points').value);
        const options = Array.from(item.querySelectorAll('.option-input'))
            .map(input => input.value.trim())
            .filter(val => val);
        
        questions.push({
            text: questionText,
            type: questionType,
            options: options,
            correctAnswer: correctAnswer,
            points: points
        });
    });
    
    if (questions.length === 0) {
        alert('Please add at least one question');
        return;
    }
    
    try {
        let moduleName = 'General';
        if (moduleId) {
            const moduleDoc = await db.collection('modules').doc(moduleId).get();
            moduleName = moduleDoc.exists ? moduleDoc.data().name : 'General';
        }
        
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
        
        if (currentPage === 'tests') {
            loadTests();
        }
    } catch (error) {
        console.error('Error creating test:', error);
        showNotification('Error creating test', 'error');
    }
}

// Edit test
function editTest(testId) {
    showNotification('Test editing feature coming soon', 'success');
}

// View test
function viewTest(testId) {
    showNotification('Loading test...', 'success');
}

// Load grades
async function loadGrades() {
    const tbody = document.getElementById('gradesTableBody');
    showLoading(tbody);
    
    try {
        const snapshot = await db.collection('grades').get();
        
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
        snapshot.forEach(doc => {
            const grade = doc.data();
            const gradeLetter = calculateGradeLetter(grade.score);
            
            html += `
                <tr>
                    <td>${grade.studentName}</td>
                    <td>${grade.testTitle}</td>
                    <td>${formatDate(grade.submittedAt)}</td>
                    <td>${grade.score}%</td>
                    <td>
                        <span class="grade-badge ${gradeLetter.toLowerCase()}">${gradeLetter}</span>
                    </td>
                    <td>
                        <span class="status-badge ${grade.reviewed ? 'active' : 'pending'}">
                            ${grade.reviewed ? 'Reviewed' : 'Pending'}
                        </span>
                    </td>
                    <td>
                        <button class="action-btn edit" onclick="reviewGrade('${doc.id}')">
                            <i class="fas fa-eye"></i> Review
                        </button>
                    </td>
                </tr>
            `;
        });
        
        tbody.innerHTML = html;
    } catch (error) {
        console.error('Error loading grades:', error);
    }
}

// Review grade
function reviewGrade(gradeId) {
    showNotification('Loading grade details...', 'success');
}

// Load analytics
function loadAnalytics() {
    loadPerformanceChart();
    loadQuestionAnalysisChart();
    loadProgressTrackingChart();
}

// Load performance chart
async function loadPerformanceChart() {
    const ctx = document.getElementById('performanceChart');
    if (!ctx) return;
    
    try {
        const snapshot = await db.collection('grades').get();
        
        let passed = 0;
        let failed = 0;
        
        snapshot.forEach(doc => {
            const grade = doc.data();
            if (grade.score >= 60) {
                passed++;
            } else {
                failed++;
            }
        });
        
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Passed', 'Failed'],
                datasets: [{
                    data: [passed, failed],
                    backgroundColor: ['#10b981', '#ef4444']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error loading chart:', error);
    }
}

// Load question analysis chart
async function loadQuestionAnalysisChart() {
    const ctx = document.getElementById('questionAnalysisChart');
    if (!ctx) return;
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Q1', 'Q2', 'Q3', 'Q4', 'Q5'],
            datasets: [{
                label: 'Correct Answers',
                data: [85, 70, 60, 90, 75],
                backgroundColor: '#10b981'
            }, {
                label: 'Incorrect Answers',
                data: [15, 30, 40, 10, 25],
                backgroundColor: '#ef4444'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                x: {
                    stacked: true
                },
                y: {
                    stacked: true,
                    max: 100
                }
            }
        }
    });
}

// Load progress tracking chart
async function loadProgressTrackingChart() {
    const ctx = document.getElementById('progressTrackingChart');
    if (!ctx) return;
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
            datasets: [{
                label: 'Average Score',
                data: [65, 72, 78, 85],
                borderColor: '#6366f1',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100
                }
            }
        }
    });
}

// Load assignments
async function loadAssignments() {
    const container = document.getElementById('assignmentsGrid');
    showLoading(container);
    
    try {
        showEmptyState(container, 'No assignments yet', 'tasks');
    } catch (error) {
        console.error('Error loading assignments:', error);
    }
}

// Load profile data
function loadProfileData() {
    document.getElementById('profileName').value = currentUser.name || '';
    document.getElementById('profileEmail').value = currentUser.email || '';
    document.getElementById('profileStaffId').value = currentUser.userId || '';
    document.getElementById('profilePhone').value = currentUser.phone || '';
    document.getElementById('profileDepartment').value = currentUser.department || '';
    document.getElementById('profileSpecialization').value = currentUser.specialization || '';
    document.getElementById('profileBio').value = currentUser.bio || '';
}

// Save profile
async function saveProfile(e) {
    e.preventDefault();
    
    try {
        await db.collection('users').doc(currentUser.uid).update({
            name: document.getElementById('profileName').value.trim(),
            phone: document.getElementById('profilePhone').value.trim(),
            department: document.getElementById('profileDepartment').value.trim(),
            specialization: document.getElementById('profileSpecialization').value.trim(),
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

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initDashboard);