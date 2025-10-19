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
const rtdb = firebase.database();

// Format date helper
function formatDate(timestamp) {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

// Format timestamp
function formatTimestamp(timestamp) {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Show notification
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Calculate grade letter
function calculateGradeLetter(score) {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
}

// Generate unique ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Loading spinner
function showLoading(element) {
    element.innerHTML = `
        <div class="loading-spinner">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Loading...</p>
        </div>
    `;
}

// Empty state
function showEmptyState(element, message, icon = 'inbox') {
    element.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-${icon}"></i>
            <p>${message}</p>
        </div>
    `;
}

// Add notification styles
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    .notification {
        position: fixed;
        top: 2rem;
        right: 2rem;
        padding: 1rem 1.5rem;
        border-radius: var(--radius);
        box-shadow: var(--shadow-lg);
        display: flex;
        align-items: center;
        gap: 0.75rem;
        z-index: 9999;
        animation: slideIn 0.3s ease;
        font-weight: 500;
    }
    
    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateX(100px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    @keyframes slideOut {
        to {
            opacity: 0;
            transform: translateX(100px);
        }
    }
    
    .notification-success {
        background: #d1fae5;
        color: #065f46;
    }
    
    .notification-error {
        background: #fee2e2;
        color: #991b1b;
    }
    
    .loading-spinner {
        text-align: center;
        padding: 3rem;
        color: var(--gray-500);
    }
    
    .loading-spinner i {
        font-size: 3rem;
        margin-bottom: 1rem;
    }
    
    .empty-state {
        text-align: center;
        padding: 3rem;
        color: var(--gray-500);
    }
    
    .empty-state i {
        font-size: 4rem;
        margin-bottom: 1rem;
        opacity: 0.5;
    }
`;
document.head.appendChild(notificationStyles);