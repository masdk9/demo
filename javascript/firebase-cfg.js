
/* ========================================
   FIREBASE-CFG.JS - Firebase Configuration
   ======================================== */

// Firebase Configuration
// Note: Replace these with your actual Firebase project credentials
const firebaseConfig = {
  apiKey: "AIzaSyA_suE-En5oIv3z04gJV5TPhlDwYyx-QFI",
  authDomain: "masd-repo-git.firebaseapp.com",
  projectId: "masd-repo-git",
  storageBucket: "masd-repo-git.firebasestorage.app",
  messagingSenderId: "317994984658",
  appId: "1:317994984658:web:c55231ca09e70341c8f90b"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firebase Services
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Firestore Collections References
const usersCollection = db.collection('users');
const postsCollection = db.collection('posts');
const commentsCollection = db.collection('comments');
const notificationsCollection = db.collection('notifications');
const messagesCollection = db.collection('messages');

// Auth State Observer
let currentUser = null;

auth.onAuthStateChanged((user) => {
    if (user) {
        currentUser = user;
        console.log('User logged in:', user.email);
        
        // Load user data from Firestore
        loadUserData(user.uid);
        
        // Show main app, hide auth section
        showMainApp();
    } else {
        currentUser = null;
        console.log('User logged out');
        
        // Show auth section, hide main app
        showAuthSection();
    }
});

// Load User Data from Firestore
async function loadUserData(userId) {
    try {
        const userDoc = await usersCollection.doc(userId).get();
        
        if (userDoc.exists) {
            const userData = userDoc.data();
            
            // Update profile display
            updateProfileDisplay(userData);
            
            // Store user data globally
            window.currentUserData = userData;
        } else {
            // Create new user document if doesn't exist
            await createUserDocument(userId);
        }
    } catch (error) {
        console.error('Error loading user data:', error);
    }
}

// Create User Document in Firestore
async function createUserDocument(userId) {
    try {
        const user = auth.currentUser;
        
        const userData = {
            uid: userId,
            email: user.email,
            displayName: user.displayName || 'User',
            username: '@' + (user.email.split('@')[0]),
            photoURL: user.photoURL || null,
            bio: 'Learning Enthusiast',
            followers: 0,
            following: 0,
            posts: 0,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        await usersCollection.doc(userId).set(userData);
        
        // Store user data globally
        window.currentUserData = userData;
        
        // Update profile display
        updateProfileDisplay(userData);
        
        console.log('User document created successfully');
    } catch (error) {
        console.error('Error creating user document:', error);
    }
}

// Update Profile Display
function updateProfileDisplay(userData) {
    // Update profile name
    const profileName = document.getElementById('profileName');
    if (profileName) {
        profileName.textContent = userData.displayName || 'User';
    }
    
    // Update profile username
    const profileUsername = document.getElementById('profileUsername');
    if (profileUsername) {
        profileUsername.textContent = userData.username || '@user';
    }
    
    // Update stats
    const statsItems = document.querySelectorAll('.stat-item h5');
    if (statsItems.length >= 3) {
        statsItems[0].textContent = userData.posts || 0;
        statsItems[1].textContent = formatNumber(userData.followers || 0);
        statsItems[2].textContent = formatNumber(userData.following || 0);
    }
}

// Format Number (1000 -> 1k)
function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'k';
    }
    return num;
}

// Show Main App
function showMainApp() {
    const authSection = document.getElementById('authSection');
    const mainApp = document.getElementById('mainApp');
    const contentLoader = document.getElementById('contentLoader');
    const mainHeader = document.getElementById('mainHeader');
    const mainContent = document.getElementById('mainContent');
    const bottomNav = document.getElementById('bottomNav');
    
    if (authSection) authSection.classList.add('d-none');
    if (mainApp) mainApp.classList.remove('d-none');
    
    // Show content loader
    if (contentLoader) contentLoader.classList.remove('hide');
    
    // Simulate loading content
    setTimeout(() => {
        if (contentLoader) contentLoader.classList.add('hide');
        if (mainHeader) mainHeader.classList.remove('d-none');
        if (mainContent) mainContent.classList.remove('d-none');
        if (bottomNav) bottomNav.classList.remove('d-none');
        
        // Load initial feed
        if (window.loadFeed) {
            window.loadFeed();
        }
    }, 1500);
}

// Show Auth Section
function showAuthSection() {
    const authSection = document.getElementById('authSection');
    const mainApp = document.getElementById('mainApp');
    const initialLoader = document.getElementById('initialLoader');
    
    // Hide initial loader
    if (initialLoader) {
        initialLoader.classList.add('hide');
        setTimeout(() => {
            initialLoader.style.display = 'none';
        }, 500);
    }
    
    if (authSection) authSection.classList.remove('d-none');
    if (mainApp) mainApp.classList.add('d-none');
}

// Sign Out Function
async function signOut() {
    try {
        await auth.signOut();
        console.log('User signed out successfully');
        
        // Clear local data
        window.currentUserData = null;
        
        // Reload page to reset state
        window.location.reload();
    } catch (error) {
        console.error('Error signing out:', error);
        alert('Error signing out. Please try again.');
    }
}

// Get Current User ID
function getCurrentUserId() {
    return currentUser ? currentUser.uid : null;
}

// Get Current User Email
function getCurrentUserEmail() {
    return currentUser ? currentUser.email : null;
}

// Check if User is Logged In
function isUserLoggedIn() {
    return currentUser !== null;
}

// Upload File to Firebase Storage
async function uploadFile(file, path) {
    try {
        const storageRef = storage.ref();
        const fileRef = storageRef.child(path);
        
        // Upload file
        const snapshot = await fileRef.put(file);
        
        // Get download URL
        const downloadURL = await snapshot.ref.getDownloadURL();
        
        return downloadURL;
    } catch (error) {
        console.error('Error uploading file:', error);
        throw error;
    }
}

// Delete File from Firebase Storage
async function deleteFile(fileURL) {
    try {
        const storageRef = storage.refFromURL(fileURL);
        await storageRef.delete();
        console.log('File deleted successfully');
    } catch (error) {
        console.error('Error deleting file:', error);
        throw error;
    }
}

// Generate Unique ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Get Timestamp
function getTimestamp() {
    return firebase.firestore.FieldValue.serverTimestamp();
}

// Format Timestamp to Readable Date
function formatTimestamp(timestamp) {
    if (!timestamp) return 'Just now';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000); // difference in seconds
    
    if (diff < 60) return 'Just now';
    if (diff < 3600) return Math.floor(diff / 60) + 'm';
    if (diff < 86400) return Math.floor(diff / 3600) + 'h';
    if (diff < 604800) return Math.floor(diff / 86400) + 'd';
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Error Handler
function handleFirebaseError(error) {
    console.error('Firebase Error:', error);
    
    let errorMessage = 'An error occurred. Please try again.';
    
    switch (error.code) {
        case 'auth/email-already-in-use':
            errorMessage = 'This email is already registered.';
            break;
        case 'auth/invalid-email':
            errorMessage = 'Invalid email address.';
            break;
        case 'auth/user-not-found':
            errorMessage = 'No account found with this email.';
            break;
        case 'auth/wrong-password':
            errorMessage = 'Incorrect password.';
            break;
        case 'auth/weak-password':
            errorMessage = 'Password should be at least 6 characters.';
            break;
        case 'auth/network-request-failed':
            errorMessage = 'Network error. Please check your connection.';
            break;
        case 'permission-denied':
            errorMessage = 'Permission denied. Please try again.';
            break;
        default:
            errorMessage = error.message || errorMessage;
    }
    
    return errorMessage;
}

// Export functions for global use
window.firebaseConfig = {
    auth,
    db,
    storage,
    usersCollection,
    postsCollection,
    commentsCollection,
    notificationsCollection,
    messagesCollection,
    signOut,
    getCurrentUserId,
    getCurrentUserEmail,
    isUserLoggedIn,
    uploadFile,
    deleteFile,
    generateId,
    getTimestamp,
    formatTimestamp,
    handleFirebaseError,
    loadUserData,
    updateProfileDisplay
};

console.log('Firebase initialized successfully');