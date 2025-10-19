// Admin Dashboard Logic
let currentUser = null;
let currentPage = 'overview';

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
            if (userData.role !== 'admin') {
                console.log('User is not an admin, redirecting...');
                alert('Access denied. This page is for administrators only.');
                await auth.signOut();
                window.location.href = 'index.html';
                return;
            }
            
            currentUser = userData;
            console.log('Dashboard initialized for admin:', currentUser.name);
            
            // Update UI
            document.getElementById('userName').textContent = currentUser.name.split(' ')[0];
            const avatarImg = document.querySelector('#userProfileBtn img');
            if (avatarImg) {
                avatarImg.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name)}&background=ef4444&color=fff`;
            }
            
            loadOverviewData();
            setupEventListeners();
            
            resolve();
        });
    });
}

function setupEventListeners() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const page = item.getAttribute('data-page');
            if (page) navigateToPage(page);
        });
    });
    
    document.getElementById('logoutBtn').addEventListener('click', async (e) => {
        e.preventDefault();
        await auth.signOut();
        window.location.href = 'index.html';
    });
    
    const addUserBtn = document.getElementById('addUserBtn');
    if (addUserBtn) {
        addUserBtn.addEventListener('click', () => {
            document.getElementById('addUserModal').classList.remove('hidden');
        });
    }
    
    const addUserForm = document.getElementById('addUserForm');
    if (addUserForm) {
        addUserForm.addEventListener('submit', addUser);
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

function navigateToPage(page) {
    currentPage = page;
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-page') === page) item.classList.add('active');
    });
    
    document.querySelectorAll('.content-page').forEach(p => p.classList.remove('active'));
    document.getElementById(page + 'Page').classList.add('active');
    
    switch(page) {
        case 'overview': loadOverviewData(); break;
        case 'users': loadUsers(); break;
        case 'students': loadStudents(); break;
        case 'facilitators': loadFacilitators(); break;
        case 'modules': loadModules(); break;
        case 'tests': loadTests(); break;
        case 'analytics': loadAnalytics(); break;
    }
}

async function loadOverviewData() {
    try {
        const [studentsSnap, facilitatorsSnap, modulesSnap] = await Promise.all([
            db.collection('users').where('role', '==', 'student').get(),
            db.collection('users').where('role', '==', 'facilitator').get(),
            db.collection('modules').get()
        ]);
        
        document.getElementById('totalStudents').textContent = studentsSnap.size;
        document.getElementById('totalFacilitators').textContent = facilitatorsSnap.size;
        document.getElementById('totalModules').textContent = modulesSnap.size;
        document.getElementById('systemActivity').textContent = '0';
        
        loadUserGrowthChart();
        loadActivityChart();
        loadRecentActivities();
    } catch (error) {
        console.error('Error loading overview:', error);
    }
}

async function loadUserGrowthChart() {
    const ctx = document.getElementById('userGrowthChart');
    if (!ctx) return;
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [{
                label: 'Students',
                data: [10, 15, 25, 35, 45, 60],
                borderColor: '#6366f1',
                tension: 0.4
            }, {
                label: 'Facilitators',
                data: [2, 3, 5, 6, 8, 10],
                borderColor: '#f59e0b',
                tension: 0.4
            }]
        },
        options: { responsive: true, maintainAspectRatio: true }
    });
}

async function loadActivityChart() {
    const ctx = document.getElementById('activityChart');
    if (!ctx) return;
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
                label: 'Activity',
                data: [65, 75, 85, 70, 90, 45, 30],
                backgroundColor: 'rgba(99, 102, 241, 0.8)'
            }]
        },
        options: { responsive: true, maintainAspectRatio: true }
    });
}

async function loadRecentActivities() {
    const container = document.getElementById('recentActivities');
    container.innerHTML = `
        <div class="list-item">
            <div class="list-item-header">
                <div class="list-item-title">New student registration</div>
                <div class="list-item-meta">2 hours ago</div>
            </div>
        </div>
    `;
}

async function loadUsers() {
    const tbody = document.getElementById('usersTableBody');
    showLoading(tbody);
    
    try {
        const snapshot = await db.collection('users').get();
        
        if (snapshot.empty) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:3rem;">No users found</td></tr>';
            return;
        }
        
        let html = '';
        snapshot.forEach(doc => {
            const user = doc.data();
            html += `
                <tr>
                    <td>
                        <div class="user-cell">
                            <img class="user-avatar" src="https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random" alt="${user.name}">
                            <div class="user-info"><h4>${user.name}</h4></div>
                        </div>
                    </td>
                    <td>${user.email}</td>
                    <td><span class="status-badge">${user.role}</span></td>
                    <td>${user.userId || 'N/A'}</td>
                    <td>${formatDate(user.createdAt)}</td>
                    <td><span class="status-badge ${user.status}">${user.status}</span></td>
                    <td>
                        <button class="action-btn edit" onclick="editUser('${doc.id}')"><i class="fas fa-edit"></i></button>
                        <button class="action-btn delete" onclick="deleteUser('${doc.id}')"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>
            `;
        });
        
        tbody.innerHTML = html;
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

async function loadStudents() {
    const tbody = document.getElementById('studentsTableBody');
    showLoading(tbody);
    
    try {
        const snapshot = await db.collection('users').where('role', '==', 'student').get();
        
        if (snapshot.empty) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:3rem;">No students found</td></tr>';
            return;
        }
        
        let html = '';
        snapshot.forEach(doc => {
            const student = doc.data();
            html += `
                <tr>
                    <td>
                        <div class="user-cell">
                            <img class="user-avatar" src="https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=6366f1&color=fff" alt="${student.name}">
                            <div class="user-info"><h4>${student.name}</h4></div>
                        </div>
                    </td>
                    <td>${student.userId}</td>
                    <td>${student.email}</td>
                    <td>0</td>
                    <td>0%</td>
                    <td><span class="status-badge ${student.status}">${student.status}</span></td>
                    <td>
                        <button class="action-btn edit" onclick="viewStudent('${doc.id}')"><i class="fas fa-eye"></i></button>
                    </td>
                </tr>
            `;
        });
        
        tbody.innerHTML = html;
    } catch (error) {
        console.error('Error loading students:', error);
    }
}

async function loadFacilitators() {
    const tbody = document.getElementById('facilitatorsTableBody');
    showLoading(tbody);
    
    try {
        const snapshot = await db.collection('users').where('role', '==', 'facilitator').get();
        
        if (snapshot.empty) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:3rem;">No facilitators found</td></tr>';
            return;
        }
        
        let html = '';
        snapshot.forEach(doc => {
            const facilitator = doc.data();
            html += `
                <tr>
                    <td>
                        <div class="user-cell">
                            <img class="user-avatar" src="https://ui-avatars.com/api/?name=${encodeURIComponent(facilitator.name)}&background=f59e0b&color=fff" alt="${facilitator.name}">
                            <div class="user-info"><h4>${facilitator.name}</h4></div>
                        </div>
                    </td>
                    <td>${facilitator.userId}</td>
                    <td>${facilitator.email}</td>
                    <td>${facilitator.department || 'N/A'}</td>
                    <td>0</td>
                    <td>0</td>
                    <td>
                        <button class="action-btn edit" onclick="viewFacilitator('${doc.id}')"><i class="fas fa-eye"></i></button>
                    </td>
                </tr>
            `;
        });
        
        tbody.innerHTML = html;
    } catch (error) {
        console.error('Error loading facilitators:', error);
    }
}

async function loadModules() {
    const container = document.getElementById('modulesGrid');
    showLoading(container);
    
    try {
        const snapshot = await db.collection('modules').get();
        
        if (snapshot.empty) {
            showEmptyState(container, 'No modules found', 'book');
            return;
        }
        
        let html = '';
        snapshot.forEach(doc => {
            const module = doc.data();
            html += `
                <div class="module-card">
                    <div class="module-header">
                        <h3>${module.name}</h3>
                        <div class="module-code">${module.code}</div>
                    </div>
                    <div class="module-body">
                        <div class="module-description">${module.description || 'No description'}</div>
                        <div class="module-footer">
                            <span class="module-stat"><i class="fas fa-user"></i> ${module.createdByName}</span>
                        </div>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    } catch (error) {
        console.error('Error loading modules:', error);
    }
}

async function loadTests() {
    const tbody = document.getElementById('testsTableBody');
    showLoading(tbody);
    
    try {
        const snapshot = await db.collection('tests').get();
        
        if (snapshot.empty) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:3rem;">No tests found</td></tr>';
            return;
        }
        
        let html = '';
        snapshot.forEach(doc => {
            const test = doc.data();
            html += `
                <tr>
                    <td>${test.title}</td>
                    <td>${test.moduleName || 'General'}</td>
                    <td>${test.createdByName}</td>
                    <td>${test.submissionCount || 0}</td>
                    <td>0%</td>
                    <td><span class="status-badge ${test.visible ? 'active' : 'inactive'}">${test.visible ? 'Active' : 'Hidden'}</span></td>
                    <td>
                        <button class="action-btn edit" onclick="viewTest('${doc.id}')"><i class="fas fa-eye"></i></button>
                    </td>
                </tr>
            `;
        });
        
        tbody.innerHTML = html;
    } catch (error) {
        console.error('Error loading tests:', error);
    }
}

function loadAnalytics() {
    loadPerformanceTrendsChart();
    loadEngagementChart();
    loadModuleComparisonChart();
}

function loadPerformanceTrendsChart() {
    const ctx = document.getElementById('performanceTrendsChart');
    if (!ctx) return;
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
            datasets: [{
                label: 'Average Score',
                data: [70, 75, 78, 82],
                borderColor: '#6366f1',
                tension: 0.4
            }]
        },
        options: { responsive: true, maintainAspectRatio: true }
    });
}

function loadEngagementChart() {
    const ctx = document.getElementById('engagementChart');
    if (!ctx) return;
    
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Active', 'Inactive'],
            datasets: [{
                data: [75, 25],
                backgroundColor: ['#10b981', '#ef4444']
            }]
        },
        options: { responsive: true, maintainAspectRatio: true }
    });
}

function loadModuleComparisonChart() {
    const ctx = document.getElementById('moduleComparisonChart');
    if (!ctx) return;
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Module 1', 'Module 2', 'Module 3', 'Module 4'],
            datasets: [{
                label: 'Average Score',
                data: [85, 78, 92, 70],
                backgroundColor: 'rgba(99, 102, 241, 0.8)'
            }]
        },
        options: { responsive: true, maintainAspectRatio: true }
    });
}

async function addUser(e) {
    e.preventDefault();
    
    const name = document.getElementById('newUserName').value.trim();
    const email = document.getElementById('newUserEmail').value.trim();
    const password = document.getElementById('newUserPassword').value;
    const role = document.getElementById('newUserRole').value;
    
    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        const idPrefix = role === 'student' ? 'STU' : role === 'facilitator' ? 'FAC' : 'ADM';
        const userId = idPrefix + Date.now().toString().slice(-6);
        
        await db.collection('users').doc(user.uid).set({
            name, email, role, userId,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            status: 'active'
        });
        
        showNotification('User added successfully!', 'success');
        document.getElementById('addUserModal').classList.add('hidden');
        document.getElementById('addUserForm').reset();
        
        if (currentPage === 'users') loadUsers();
    } catch (error) {
        console.error('Error adding user:', error);
        showNotification('Error adding user', 'error');
    }
}

function editUser(userId) {
    showNotification('Edit user feature coming soon', 'success');
}

function deleteUser(userId) {
    if (confirm('Are you sure you want to delete this user?')) {
        showNotification('Delete user feature coming soon', 'success');
    }
}

function viewStudent(studentId) {
    showNotification('Loading student details...', 'success');
}

function viewFacilitator(facilitatorId) {
    showNotification('Loading facilitator details...', 'success');
}

function viewTest(testId) {
    showNotification('Loading test details...', 'success');
}

document.addEventListener('DOMContentLoaded', initDashboard);