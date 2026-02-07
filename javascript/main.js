
/* ========================================
   MAIN.JS - Main Application Logic
   ======================================== */

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM fully loaded');
    
    // Initialize app
    initializeApp();
});

// Initialize Application
function initializeApp() {
    // Hide initial loader after a delay
    setTimeout(() => {
        const initialLoader = document.getElementById('initialLoader');
        if (initialLoader) {
            initialLoader.classList.add('hide');
        }
    }, 2000);
    
    // Initialize theme
    initializeTheme();
    
    // Initialize navigation
    initializeNavigation();
    
    // Initialize create post button
    initializeCreatePost();
    
    // Initialize back buttons
    initializeBackButtons();
    
    // Initialize profile menu
    initializeProfileMenu();
    
    // Initialize settings
    initializeSettings();
    
    // Initialize study section
    initializeStudySection();
    
    console.log('App initialized successfully');
}

// Initialize Theme (Dark/Light Mode)
function initializeTheme() {
    const themeToggle = document.getElementById('themeToggle');
    const darkModeToggle = document.getElementById('darkModeToggle');
    
    // Check saved theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        if (themeToggle) {
            themeToggle.querySelector('i').classList.replace('fa-moon', 'fa-sun');
        }
        if (darkModeToggle) {
            darkModeToggle.checked = true;
        }
    }
    
    // Theme toggle in header
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
    
    // Theme toggle in settings
    if (darkModeToggle) {
        darkModeToggle.addEventListener('change', toggleTheme);
    }
}

// Toggle Theme Function
function toggleTheme() {
    const body = document.body;
    const themeToggle = document.getElementById('themeToggle');
    const darkModeToggle = document.getElementById('darkModeToggle');
    
    body.classList.toggle('dark-mode');
    
    // Update icon
    if (themeToggle) {
        const icon = themeToggle.querySelector('i');
        if (body.classList.contains('dark-mode')) {
            icon.classList.replace('fa-moon', 'fa-sun');
        } else {
            icon.classList.replace('fa-sun', 'fa-moon');
        }
    }
    
    // Update toggle state
    if (darkModeToggle) {
        darkModeToggle.checked = body.classList.contains('dark-mode');
    }
    
    // Save theme preference
    const theme = body.classList.contains('dark-mode') ? 'dark' : 'light';
    localStorage.setItem('theme', theme);
    
    console.log('Theme changed to:', theme);
}

// Initialize Navigation
function initializeNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            const sectionId = this.getAttribute('data-section');
            
            // Remove active class from all nav items
            navItems.forEach(nav => nav.classList.remove('active'));
            
            // Add active class to clicked nav item
            this.classList.add('active');
            
            // Show corresponding section
            showSection(sectionId);
        });
    });
}

// Show Section Function
function showSection(sectionId) {
    // Hide all sections
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => {
        section.classList.remove('active');
    });
    
    // Show selected section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
        
        // Load section-specific content
        loadSectionContent(sectionId);
    }
}

// Load Section Content
function loadSectionContent(sectionId) {
    switch(sectionId) {
        case 'homeFeed':
            if (window.loadFeed) {
                window.loadFeed();
            }
            break;
        case 'notificationSection':
            if (window.loadNotifications) {
                window.loadNotifications();
            }
            break;
        case 'studySection':
            // Study section content is static
            break;
        case 'searchSection':
            // Focus on search input
            const searchInput = document.getElementById('searchInput');
            if (searchInput) {
                searchInput.focus();
            }
            break;
        case 'profileSection':
            if (window.loadProfile) {
                window.loadProfile();
            }
            break;
    }
}

// Initialize Create Post Button
function initializeCreatePost() {
    const createPostBtn = document.getElementById('createPostBtn');
    const createPostModal = document.getElementById('createPostModal');
    
    if (createPostBtn && createPostModal) {
        const modal = new bootstrap.Modal(createPostModal);
        
        createPostBtn.addEventListener('click', () => {
            modal.show();
        });
        
        // Reset modal on close
        createPostModal.addEventListener('hidden.bs.modal', function() {
            resetCreatePostModal();
        });
    }
}

// Reset Create Post Modal
function resetCreatePostModal() {
    // Reset all forms
    const forms = document.querySelectorAll('.post-form');
    forms.forEach(form => {
        form.classList.remove('active');
        const inputs = form.querySelectorAll('input, textarea');
        inputs.forEach(input => input.value = '');
    });
    
    // Show text post form by default
    const textForm = document.getElementById('textPostForm');
    if (textForm) {
        textForm.classList.add('active');
    }
    
    // Reset type buttons
    const typeButtons = document.querySelectorAll('.post-type-btn');
    typeButtons.forEach(btn => btn.classList.remove('active'));
    const textBtn = document.querySelector('.post-type-btn[data-type="text"]');
    if (textBtn) {
        textBtn.classList.add('active');
    }
    
    // Reset color selection
    const colorOptions = document.querySelectorAll('.color-option');
    colorOptions.forEach(opt => opt.classList.remove('active'));
    const defaultColor = document.querySelector('.color-option[data-color="#ffffff"]');
    if (defaultColor) {
        defaultColor.classList.add('active');
    }
}

// Initialize Back Buttons
function initializeBackButtons() {
    const backButtons = document.querySelectorAll('.back-btn');
    
    backButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const currentSection = this.closest('.content-section');
            
            if (currentSection) {
                const sectionId = currentSection.id;
                
                // Navigate back based on section
                if (sectionId === 'settingsSection' || sectionId === 'accountCenterSection') {
                    showSection('profileSection');
                    updateBottomNav('profileSection');
                } else if (sectionId === 'notesSubPage') {
                    showSection('studySection');
                    updateBottomNav('studySection');
                }
            }
        });
    });
}

// Update Bottom Navigation Active State
function updateBottomNav(sectionId) {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-section') === sectionId) {
            item.classList.add('active');
        }
    });
}

// Initialize Profile Menu
function initializeProfileMenu() {
    // Account Center Button
    const accountCenterBtn = document.getElementById('accountCenterBtn');
    if (accountCenterBtn) {
        accountCenterBtn.addEventListener('click', () => {
            showSection('accountCenterSection');
        });
    }
    
    // Settings Button
    const settingsBtn = document.getElementById('settingsBtn');
    if (settingsBtn) {
        settingsBtn.addEventListener('click', () => {
            showSection('settingsSection');
        });
    }
    
    // Logout Button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
}

// Handle Logout
async function handleLogout() {
    const confirmLogout = confirm('Are you sure you want to log out?');
    
    if (confirmLogout) {
        try {
            // Show loading state
            const logoutBtn = document.getElementById('logoutBtn');
            if (logoutBtn) {
                logoutBtn.disabled = true;
                logoutBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Logging out...';
            }
            
            // Sign out from Firebase
            if (window.firebaseConfig && window.firebaseConfig.signOut) {
                await window.firebaseConfig.signOut();
            } else {
                // Fallback if Firebase not loaded
                window.location.reload();
            }
        } catch (error) {
            console.error('Logout error:', error);
            alert('Error logging out. Please try again.');
            
            // Reset button
            const logoutBtn = document.getElementById('logoutBtn');
            if (logoutBtn) {
                logoutBtn.disabled = false;
                logoutBtn.innerHTML = '<i class="fas fa-sign-out-alt me-2"></i>Log Out';
            }
        }
    }
}

// Initialize Settings
function initializeSettings() {
    // Save Account Button
    const saveAccountBtn = document.getElementById('saveAccountBtn');
    if (saveAccountBtn) {
        saveAccountBtn.addEventListener('click', handleSaveAccount);
    }
    
    // Push Notifications Toggle
    const pushNotifications = document.getElementById('pushNotifications');
    if (pushNotifications) {
        pushNotifications.addEventListener('change', function() {
            const isEnabled = this.checked;
            localStorage.setItem('pushNotifications', isEnabled);
            console.log('Push notifications:', isEnabled ? 'enabled' : 'disabled');
        });
        
        // Load saved preference
        const savedPref = localStorage.getItem('pushNotifications');
        if (savedPref !== null) {
            pushNotifications.checked = savedPref === 'true';
        }
    }
    
    // Biometric Login Toggle
    const biometricLogin = document.getElementById('biometricLogin');
    if (biometricLogin) {
        biometricLogin.addEventListener('change', function() {
            const isEnabled = this.checked;
            localStorage.setItem('biometricLogin', isEnabled);
            console.log('Biometric login:', isEnabled ? 'enabled' : 'disabled');
        });
        
        // Load saved preference
        const savedPref = localStorage.getItem('biometricLogin');
        if (savedPref !== null) {
            biometricLogin.checked = savedPref === 'true';
        }
    }
}

// Handle Save Account
async function handleSaveAccount() {
    const saveBtn = document.getElementById('saveAccountBtn');
    
    try {
        // Show loading state
        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Saving...';
        }
        
        // Get form values
        const name = document.getElementById('editName')?.value;
        const username = document.getElementById('editUsername')?.value;
        const email = document.getElementById('editEmail')?.value;
        const bio = document.getElementById('editBio')?.value;
        
        // Validate
        if (!name || !username || !email) {
            alert('Please fill in all required fields');
            return;
        }
        
        // Update user data in Firestore
        if (window.firebaseConfig && window.firebaseConfig.getCurrentUserId) {
            const userId = window.firebaseConfig.getCurrentUserId();
            
            await window.firebaseConfig.usersCollection.doc(userId).update({
                displayName: name,
                username: username,
                email: email,
                bio: bio,
                updatedAt: window.firebaseConfig.getTimestamp()
            });
            
            // Update profile display
            window.currentUserData = {
                ...window.currentUserData,
                displayName: name,
                username: username,
                email: email,
                bio: bio
            };
            
            window.firebaseConfig.updateProfileDisplay(window.currentUserData);
            
            alert('Profile updated successfully!');
            showSection('profileSection');
            updateBottomNav('profileSection');
        }
    } catch (error) {
        console.error('Error saving account:', error);
        alert('Error saving changes. Please try again.');
    } finally {
        // Reset button
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = '<i class="fas fa-save me-2"></i>Save Changes';
        }
    }
}

// Initialize Study Section
function initializeStudySection() {
    // Notes Card
    const notesCard = document.getElementById('notesCard');
    if (notesCard) {
        notesCard.addEventListener('click', () => {
            showSection('notesSubPage');
        });
    }
    
    // Back button from notes
    const notesBackBtn = document.getElementById('notesBackBtn');
    if (notesBackBtn) {
        notesBackBtn.addEventListener('click', () => {
            showSection('studySection');
            updateBottomNav('studySection');
        });
    }
}

// Utility: Show Toast Notification
function showToast(message, type = 'info') {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${type}`;
    toast.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'} me-2"></i>
        <span>${message}</span>
    `;
    
    // Add to body
    document.body.appendChild(toast);
    
    // Show toast
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);
    
    // Hide and remove toast
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}

// Utility: Debounce Function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Utility: Throttle Function
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Handle Online/Offline Status
window.addEventListener('online', () => {
    showToast('Connection restored', 'success');
});

window.addEventListener('offline', () => {
    showToast('No internet connection', 'error');
});

// Export functions
window.mainApp = {
    showSection,
    showToast,
    toggleTheme,
    debounce,
    throttle
};

console.log('Main.js loaded successfully');