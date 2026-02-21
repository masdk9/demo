
/* ========================================
   PROFILE.JS - Profile Section Logic
   ======================================== */

// Profile state
let userProfileData = null;
let userPosts = [];

// Initialize Profile
function initializeProfile() {
    // Load profile data
    loadProfile();
    
    console.log('Profile initialized');
}

// Load Profile
async function loadProfile() {
    try {
        // Get current user data
        if (window.currentUserData) {
            userProfileData = window.currentUserData;
            renderProfileData(userProfileData);
        }
        
        // Load user posts
        await loadUserPosts();
        
    } catch (error) {
        console.error('Error loading profile:', error);
    }
}

// Render Profile Data
function renderProfileData(userData) {
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
    
    // Update profile stats
    const statsItems = document.querySelectorAll('.profile-stats .stat-item h5');
    if (statsItems.length >= 3) {
        statsItems[0].textContent = userData.posts || 0;
        statsItems[1].textContent = formatNumber(userData.followers || 0);
        statsItems[2].textContent = formatNumber(userData.following || 0);
    }
    
    // Update profile avatar if image exists
    if (userData.photoURL) {
        const profileAvatar = document.querySelector('.profile-avatar i');
        if (profileAvatar) {
            profileAvatar.outerHTML = `<img src="${userData.photoURL}" alt="Profile">`;
        }
    }
    
    // Update bio if exists
    if (userData.bio) {
        const bioSection = document.querySelector('.profile-bio p');
        if (bioSection) {
            bioSection.textContent = userData.bio;
        }
    }
}

// Load User Posts
async function loadUserPosts() {
    try {
        if (window.firebaseConfig && window.firebaseConfig.postsCollection) {
            const userId = window.firebaseConfig.getCurrentUserId();
            
            const snapshot = await window.firebaseConfig.postsCollection
                .where('authorId', '==', userId)
                .orderBy('createdAt', 'desc')
                .limit(20)
                .get();
            
            userPosts = [];
            snapshot.forEach(doc => {
                userPosts.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            renderUserPosts(userPosts);
        }
    } catch (error) {
        console.error('Error loading user posts:', error);
    }
}

// Render User Posts
function renderUserPosts(posts) {
    // TODO: Render user posts in profile grid
    console.log('User posts:', posts);
}

// Edit Profile
function editProfile() {
    // Navigate to account center
    if (window.mainApp && window.mainApp.showSection) {
        window.mainApp.showSection('accountCenterSection');
    }
}

// Update Profile Avatar
async function updateProfileAvatar(file) {
    try {
        if (!file) return;
        
        // Validate file
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }
        
        if (file.size > 2 * 1024 * 1024) {
            alert('Image size should be less than 2MB');
            return;
        }
        
        // Show loading
        if (window.mainApp && window.mainApp.showToast) {
            window.mainApp.showToast('Uploading profile picture...', 'info');
        }
        
        // Upload to Firebase Storage
        if (window.firebaseConfig && window.firebaseConfig.uploadFile) {
            const userId = window.firebaseConfig.getCurrentUserId();
            const path = `avatars/${userId}/profile.jpg`;
            const photoURL = await window.firebaseConfig.uploadFile(file, path);
            
            // Update user profile
            await window.firebaseConfig.usersCollection.doc(userId).update({
                photoURL: photoURL,
                updatedAt: window.firebaseConfig.getTimestamp()
            });
            
            // Update auth profile
            const user = window.firebaseConfig.auth.currentUser;
            await user.updateProfile({
                photoURL: photoURL
            });
            
            // Update current user data
            window.currentUserData.photoURL = photoURL;
            
            // Update UI
            renderProfileData(window.currentUserData);
            
            if (window.mainApp && window.mainApp.showToast) {
                window.mainApp.showToast('Profile picture updated!', 'success');
            }
        }
    } catch (error) {
        console.error('Error updating profile avatar:', error);
        
        if (window.mainApp && window.mainApp.showToast) {
            window.mainApp.showToast('Error updating profile picture', 'error');
        }
    }
}

// Update Profile Data
async function updateProfileData(data) {
    try {
        if (window.firebaseConfig && window.firebaseConfig.usersCollection) {
            const userId = window.firebaseConfig.getCurrentUserId();
            
            await window.firebaseConfig.usersCollection.doc(userId).update({
                ...data,
                updatedAt: window.firebaseConfig.getTimestamp()
            });
            
            // Update local data
            window.currentUserData = {
                ...window.currentUserData,
                ...data
            };
            
            // Update UI
            renderProfileData(window.currentUserData);
            
            if (window.mainApp && window.mainApp.showToast) {
                window.mainApp.showToast('Profile updated successfully!', 'success');
            }
        }
    } catch (error) {
        console.error('Error updating profile:', error);
        
        if (window.mainApp && window.mainApp.showToast) {
            window.mainApp.showToast('Error updating profile', 'error');
        }
    }
}

// Follow User
async function followUser(userId) {
    try {
        if (window.firebaseConfig && window.firebaseConfig.usersCollection) {
            const currentUserId = window.firebaseConfig.getCurrentUserId();
            
            // Add to following list
            await window.firebaseConfig.usersCollection.doc(currentUserId).update({
                following: firebase.firestore.FieldValue.increment(1)
            });
            
            // Add to followers list
            await window.firebaseConfig.usersCollection.doc(userId).update({
                followers: firebase.firestore.FieldValue.increment(1)
            });
            
            if (window.mainApp && window.mainApp.showToast) {
                window.mainApp.showToast('User followed!', 'success');
            }
        }
    } catch (error) {
        console.error('Error following user:', error);
        
        if (window.mainApp && window.mainApp.showToast) {
            window.mainApp.showToast('Error following user', 'error');
        }
    }
}

// Unfollow User
async function unfollowUser(userId) {
    try {
        if (window.firebaseConfig && window.firebaseConfig.usersCollection) {
            const currentUserId = window.firebaseConfig.getCurrentUserId();
            
            // Remove from following list
            await window.firebaseConfig.usersCollection.doc(currentUserId).update({
                following: firebase.firestore.FieldValue.increment(-1)
            });
            
            // Remove from followers list
            await window.firebaseConfig.usersCollection.doc(userId).update({
                followers: firebase.firestore.FieldValue.increment(-1)
            });
            
            if (window.mainApp && window.mainApp.showToast) {
                window.mainApp.showToast('User unfollowed', 'info');
            }
        }
    } catch (error) {
        console.error('Error unfollowing user:', error);
        
        if (window.mainApp && window.mainApp.showToast) {
            window.mainApp.showToast('Error unfollowing user', 'error');
        }
    }
}

// View Followers
async function viewFollowers() {
    console.log('View followers');
    
    // TODO: Show followers modal/page
    
    if (window.mainApp && window.mainApp.showToast) {
        window.mainApp.showToast('Followers list coming soon!', 'info');
    }
}

// View Following
async function viewFollowing() {
    console.log('View following');
    
    // TODO: Show following modal/page
    
    if (window.mainApp && window.mainApp.showToast) {
        window.mainApp.showToast('Following list coming soon!', 'info');
    }
}

// Change Password
async function changePassword(currentPassword, newPassword) {
    try {
        const user = window.firebaseConfig.auth.currentUser;
        
        // Re-authenticate user
        const credential = firebase.auth.EmailAuthProvider.credential(
            user.email,
            currentPassword
        );
        
        await user.reauthenticateWithCredential(credential);
        
        // Update password
        await user.updatePassword(newPassword);
        
        if (window.mainApp && window.mainApp.showToast) {
            window.mainApp.showToast('Password changed successfully!', 'success');
        }
    } catch (error) {
        console.error('Error changing password:', error);
        
        let errorMessage = 'Error changing password';
        
        if (error.code === 'auth/wrong-password') {
            errorMessage = 'Current password is incorrect';
        }
        
        if (window.mainApp && window.mainApp.showToast) {
            window.mainApp.showToast(errorMessage, 'error');
        }
    }
}

// Delete Account
async function deleteAccount() {
    const confirmDelete = confirm(
        'Are you sure you want to delete your account? This action cannot be undone.'
    );
    
    if (!confirmDelete) return;
    
    const password = prompt('Please enter your password to confirm:');
    
    if (!password) return;
    
    try {
        const user = window.firebaseConfig.auth.currentUser;
        
        // Re-authenticate user
        const credential = firebase.auth.EmailAuthProvider.credential(
            user.email,
            password
        );
        
        await user.reauthenticateWithCredential(credential);
        
        // Delete user data from Firestore
        const userId = window.firebaseConfig.getCurrentUserId();
        await window.firebaseConfig.usersCollection.doc(userId).delete();
        
        // Delete user account
        await user.delete();
        
        if (window.mainApp && window.mainApp.showToast) {
            window.mainApp.showToast('Account deleted', 'info');
        }
        
        // Reload page
        window.location.reload();
    } catch (error) {
        console.error('Error deleting account:', error);
        
        let errorMessage = 'Error deleting account';
        
        if (error.code === 'auth/wrong-password') {
            errorMessage = 'Incorrect password';
        }
        
        alert(errorMessage);
    }
}

// Export Profile Data (download as JSON)
function exportProfileData() {
    const dataStr = JSON.stringify(window.currentUserData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'profile_data.json';
    link.click();
    
    URL.revokeObjectURL(url);
    
    if (window.mainApp && window.mainApp.showToast) {
        window.mainApp.showToast('Profile data exported!', 'success');
    }
}

// Get User Badge (verified, premium, etc.)
function getUserBadge(userData) {
    // TODO: Implement badge logic
    if (userData.verified) {
        return '<i class="fas fa-check-circle verified-badge"></i>';
    }
    return '';
}

// Calculate Profile Completion
function calculateProfileCompletion(userData) {
    let completion = 0;
    const fields = ['displayName', 'username', 'email', 'bio', 'photoURL'];
    
    fields.forEach(field => {
        if (userData[field]) {
            completion += 20;
        }
    });
    
    return completion;
}

// Show Profile Completion Tip
function showProfileCompletionTip() {
    const completion = calculateProfileCompletion(window.currentUserData);
    
    if (completion < 100) {
        const missingFields = [];
        
        if (!window.currentUserData.displayName) missingFields.push('Name');
        if (!window.currentUserData.username) missingFields.push('Username');
        if (!window.currentUserData.bio) missingFields.push('Bio');
        if (!window.currentUserData.photoURL) missingFields.push('Profile Picture');
        
        const message = `Your profile is ${completion}% complete. Add: ${missingFields.join(', ')}`;
        
        if (window.mainApp && window.mainApp.showToast) {
            window.mainApp.showToast(message, 'info');
        }
    }
}

// Format Number
function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'k';
    }
    return num;
}

// View Other User Profile (future feature)
async function viewUserProfile(userId) {
    try {
        if (window.firebaseConfig && window.firebaseConfig.usersCollection) {
            const userDoc = await window.firebaseConfig.usersCollection.doc(userId).get();
            
            if (userDoc.exists) {
                const userData = userDoc.data();
                
                // TODO: Show user profile modal/page
                console.log('User profile:', userData);
            }
        }
    } catch (error) {
        console.error('Error viewing user profile:', error);
    }
}

// Block User (future feature)
async function blockUser(userId) {
    const confirmBlock = confirm('Are you sure you want to block this user?');
    
    if (!confirmBlock) return;
    
    try {
        // TODO: Implement block functionality
        console.log('Block user:', userId);
        
        if (window.mainApp && window.mainApp.showToast) {
            window.mainApp.showToast('User blocked', 'success');
        }
    } catch (error) {
        console.error('Error blocking user:', error);
    }
}

// Report User (future feature)
async function reportUser(userId, reason) {
    try {
        // TODO: Implement report functionality
        console.log('Report user:', userId, 'Reason:', reason);
        
        if (window.mainApp && window.mainApp.showToast) {
            window.mainApp.showToast('User reported. Thank you!', 'success');
        }
    } catch (error) {
        console.error('Error reporting user:', error);
    }
}

// Export functions
window.profileFunctions = {
    initializeProfile,
    loadProfile,
    editProfile,
    updateProfileAvatar,
    updateProfileData,
    followUser,
    unfollowUser,
    viewFollowers,
    viewFollowing,
    changePassword,
    deleteAccount,
    exportProfileData,
    showProfileCompletionTip,
    viewUserProfile,
    blockUser,
    reportUser
};

// Auto initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeProfile);
} else {
    initializeProfile();
}

console.log('Profile.js loaded successfully');
