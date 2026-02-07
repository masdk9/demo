
/* ========================================
   NOTIFICATION.JS - Notification Section Logic
   ======================================== */

// Notification state
let notifications = [];
let unreadCount = 0;
let lastVisible = null;
let isLoadingNotifications = false;

// Initialize Notifications
function initializeNotifications() {
    // Load notifications
    loadNotifications();
    
    // Mark all read button
    const markAllReadBtn = document.querySelector('.mark-all-read-btn');
    if (markAllReadBtn) {
        markAllReadBtn.addEventListener('click', markAllAsRead);
    }
    
    console.log('Notifications initialized');
}

// Load Notifications
async function loadNotifications(loadMore = false) {
    if (isLoadingNotifications) return;
    
    const notificationList = document.querySelector('.notification-list');
    if (!notificationList) return;
    
    try {
        isLoadingNotifications = true;
        
        // Show loading state
        if (!loadMore) {
            notificationList.innerHTML = createNotificationSkeleton(5);
        }
        
        // Load from Firebase
        if (window.firebaseConfig && window.firebaseConfig.notificationsCollection) {
            const userId = window.firebaseConfig.getCurrentUserId();
            
            let query = window.firebaseConfig.notificationsCollection
                .where('userId', '==', userId)
                .orderBy('createdAt', 'desc')
                .limit(20);
            
            if (loadMore && lastVisible) {
                query = query.startAfter(lastVisible);
            }
            
            const snapshot = await query.get();
            
            if (!snapshot.empty) {
                lastVisible = snapshot.docs[snapshot.docs.length - 1];
                
                const newNotifications = [];
                snapshot.forEach(doc => {
                    newNotifications.push({
                        id: doc.id,
                        ...doc.data()
                    });
                });
                
                if (!loadMore) {
                    notifications = newNotifications;
                    notificationList.innerHTML = '';
                } else {
                    notifications = [...notifications, ...newNotifications];
                }
                
                // Render notifications
                renderNotifications(newNotifications, notificationList);
                
                // Update unread count
                updateUnreadCount();
            } else {
                if (!loadMore) {
                    notificationList.innerHTML = createEmptyNotificationState();
                }
            }
        } else {
            // Show dummy notifications
            notificationList.innerHTML = '';
            renderDummyNotifications(notificationList);
        }
    } catch (error) {
        console.error('Error loading notifications:', error);
        notificationList.innerHTML = `
            <p class="text-center text-danger">Error loading notifications. Please try again.</p>
        `;
    } finally {
        isLoadingNotifications = false;
    }
}

// Render Notifications
function renderNotifications(notifs, container) {
    notifs.forEach(notification => {
        const notifElement = createNotificationElement(notification);
        container.appendChild(notifElement);
    });
}

// Create Notification Element
function createNotificationElement(notification) {
    const notifDiv = document.createElement('div');
    notifDiv.className = `notification-item ${notification.read ? '' : 'unread'}`;
    notifDiv.setAttribute('data-notification-id', notification.id);
    
    const iconClass = getNotificationIcon(notification.type);
    const iconColor = getNotificationIconColor(notification.type);
    
    notifDiv.innerHTML = `
        <div class="notification-icon" style="background: ${iconColor};">
            <i class="${iconClass}"></i>
        </div>
        <div class="notification-content">
            <p>${notification.message || 'New notification'}</p>
            <span class="notification-time">
                <i class="far fa-clock"></i>
                ${formatTime(notification.createdAt)}
            </span>
        </div>
    `;
    
    // Add click listener
    notifDiv.addEventListener('click', function() {
        handleNotificationClick(notification);
    });
    
    return notifDiv;
}

// Get Notification Icon
function getNotificationIcon(type) {
    const icons = {
        'like': 'fas fa-heart',
        'comment': 'fas fa-comment',
        'follow': 'fas fa-user-plus',
        'mention': 'fas fa-at',
        'share': 'fas fa-share',
        'quiz': 'fas fa-question-circle',
        'achievement': 'fas fa-trophy',
        'reminder': 'fas fa-bell',
        'system': 'fas fa-info-circle'
    };
    
    return icons[type] || 'fas fa-bell';
}

// Get Notification Icon Color
function getNotificationIconColor(type) {
    const colors = {
        'like': 'linear-gradient(135deg, #E91E63 0%, #C2185B 100%)',
        'comment': 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)',
        'follow': 'linear-gradient(135deg, #4CAF50 0%, #388E3C 100%)',
        'mention': 'linear-gradient(135deg, #FF9800 0%, #F57C00 100%)',
        'share': 'linear-gradient(135deg, #9C27B0 0%, #7B1FA2 100%)',
        'quiz': 'linear-gradient(135deg, #00BCD4 0%, #0097A7 100%)',
        'achievement': 'linear-gradient(135deg, #FFC107 0%, #FFA000 100%)',
        'reminder': 'linear-gradient(135deg, #FF5722 0%, #E64A19 100%)',
        'system': 'linear-gradient(135deg, #607D8B 0%, #455A64 100%)'
    };
    
    return colors[type] || 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)';
}

// Handle Notification Click
async function handleNotificationClick(notification) {
    // Mark as read
    if (!notification.read) {
        await markNotificationAsRead(notification.id);
    }
    
    // Navigate based on notification type
    switch(notification.type) {
        case 'like':
        case 'comment':
        case 'share':
            if (notification.postId) {
                viewPost(notification.postId);
            }
            break;
        case 'follow':
            if (notification.userId) {
                viewUserProfile(notification.userId);
            }
            break;
        case 'mention':
            if (notification.postId) {
                viewPost(notification.postId);
            }
            break;
        default:
            console.log('Notification clicked:', notification);
    }
}

// Mark Notification as Read
async function markNotificationAsRead(notificationId) {
    try {
        // Update in Firebase
        if (window.firebaseConfig && window.firebaseConfig.notificationsCollection) {
            await window.firebaseConfig.notificationsCollection.doc(notificationId).update({
                read: true
            });
        }
        
        // Update in local state
        const notification = notifications.find(n => n.id === notificationId);
        if (notification) {
            notification.read = true;
        }
        
        // Update UI
        const notifElement = document.querySelector(`[data-notification-id="${notificationId}"]`);
        if (notifElement) {
            notifElement.classList.remove('unread');
        }
        
        // Update unread count
        updateUnreadCount();
        
    } catch (error) {
        console.error('Error marking notification as read:', error);
    }
}

// Mark All as Read
async function markAllAsRead() {
    try {
        const unreadNotifications = notifications.filter(n => !n.read);
        
        if (unreadNotifications.length === 0) {
            if (window.mainApp && window.mainApp.showToast) {
                window.mainApp.showToast('No unread notifications', 'info');
            }
            return;
        }
        
        // Update in Firebase
        if (window.firebaseConfig && window.firebaseConfig.notificationsCollection) {
            const batch = window.firebaseConfig.db.batch();
            
            unreadNotifications.forEach(notification => {
                const ref = window.firebaseConfig.notificationsCollection.doc(notification.id);
                batch.update(ref, { read: true });
            });
            
            await batch.commit();
        }
        
        // Update local state
        notifications.forEach(n => n.read = true);
        
        // Update UI
        const notifElements = document.querySelectorAll('.notification-item.unread');
        notifElements.forEach(el => el.classList.remove('unread'));
        
        // Update unread count
        updateUnreadCount();
        
        if (window.mainApp && window.mainApp.showToast) {
            window.mainApp.showToast('All notifications marked as read', 'success');
        }
        
    } catch (error) {
        console.error('Error marking all as read:', error);
        
        if (window.mainApp && window.mainApp.showToast) {
            window.mainApp.showToast('Error updating notifications', 'error');
        }
    }
}

// Update Unread Count
function updateUnreadCount() {
    unreadCount = notifications.filter(n => !n.read).length;
    
    // Update badge
    const badge = document.querySelector('.notification-badge');
    if (badge) {
        if (unreadCount > 0) {
            badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
            badge.style.display = 'inline-block';
        } else {
            badge.style.display = 'none';
        }
    }
}

// Create Notification
async function createNotification(userId, type, message, data = {}) {
    try {
        if (window.firebaseConfig && window.firebaseConfig.notificationsCollection) {
            await window.firebaseConfig.notificationsCollection.add({
                userId: userId,
                type: type,
                message: message,
                read: false,
                ...data,
                createdAt: window.firebaseConfig.getTimestamp()
            });
        }
    } catch (error) {
        console.error('Error creating notification:', error);
    }
}

// Delete Notification
async function deleteNotification(notificationId) {
    try {
        // Delete from Firebase
        if (window.firebaseConfig && window.firebaseConfig.notificationsCollection) {
            await window.firebaseConfig.notificationsCollection.doc(notificationId).delete();
        }
        
        // Remove from local state
        notifications = notifications.filter(n => n.id !== notificationId);
        
        // Remove from UI
        const notifElement = document.querySelector(`[data-notification-id="${notificationId}"]`);
        if (notifElement) {
            notifElement.style.transition = 'all 0.3s ease';
            notifElement.style.opacity = '0';
            notifElement.style.transform = 'translateX(-100%)';
            
            setTimeout(() => {
                notifElement.remove();
            }, 300);
        }
        
        // Update unread count
        updateUnreadCount();
        
    } catch (error) {
        console.error('Error deleting notification:', error);
    }
}

// Clear All Notifications
async function clearAllNotifications() {
    const confirm = window.confirm('Are you sure you want to clear all notifications?');
    
    if (!confirm) return;
    
    try {
        // Delete from Firebase
        if (window.firebaseConfig && window.firebaseConfig.notificationsCollection) {
            const userId = window.firebaseConfig.getCurrentUserId();
            const snapshot = await window.firebaseConfig.notificationsCollection
                .where('userId', '==', userId)
                .get();
            
            const batch = window.firebaseConfig.db.batch();
            snapshot.docs.forEach(doc => {
                batch.delete(doc.ref);
            });
            
            await batch.commit();
        }
        
        // Clear local state
        notifications = [];
        unreadCount = 0;
        
        // Clear UI
        const notificationList = document.querySelector('.notification-list');
        if (notificationList) {
            notificationList.innerHTML = createEmptyNotificationState();
        }
        
        // Update badge
        updateUnreadCount();
        
        if (window.mainApp && window.mainApp.showToast) {
            window.mainApp.showToast('All notifications cleared', 'success');
        }
        
    } catch (error) {
        console.error('Error clearing notifications:', error);
        
        if (window.mainApp && window.mainApp.showToast) {
            window.mainApp.showToast('Error clearing notifications', 'error');
        }
    }
}

// Render Dummy Notifications
function renderDummyNotifications(container) {
    const dummyNotifications = [
        {
            id: '1',
            type: 'like',
            message: '<strong>Rahul Verma</strong> liked your post',
            read: false,
            createdAt: new Date(Date.now() - 7200000)
        },
        {
            id: '2',
            type: 'comment',
            message: '<strong>Amit Kumar</strong> commented on your post',
            read: false,
            createdAt: new Date(Date.now() - 18000000)
        },
        {
            id: '3',
            type: 'follow',
            message: '<strong>Priya Sharma</strong> started following you',
            read: true,
            createdAt: new Date(Date.now() - 86400000)
        }
    ];
    
    dummyNotifications.forEach(notification => {
        const notifElement = createNotificationElement(notification);
        container.appendChild(notifElement);
    });
    
    notifications = dummyNotifications;
    updateUnreadCount();
}

// Create Notification Skeleton
function createNotificationSkeleton(count = 5) {
    let skeletons = '';
    for (let i = 0; i < count; i++) {
        skeletons += `
            <div class="notification-skeleton">
                <div class="skeleton skeleton-circle"></div>
                <div class="skeleton-content">
                    <div class="skeleton skeleton-text medium"></div>
                    <div class="skeleton skeleton-text short"></div>
                </div>
            </div>
        `;
    }
    return skeletons;
}

// Create Empty Notification State
function createEmptyNotificationState() {
    return `
        <div class="notification-empty-state">
            <i class="fas fa-bell-slash"></i>
            <h5>No Notifications</h5>
            <p>You're all caught up!</p>
        </div>
    `;
}

// Format Time
function formatTime(timestamp) {
    if (!timestamp) return 'Just now';
    
    if (window.firebaseConfig && window.firebaseConfig.formatTimestamp) {
        return window.firebaseConfig.formatTimestamp(timestamp);
    }
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    
    if (diff < 60) return 'Just now';
    if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
    if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
    if (diff < 604800) return Math.floor(diff / 86400) + 'd ago';
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// View Post
function viewPost(postId) {
    console.log('View post:', postId);
    
    if (window.mainApp && window.mainApp.showToast) {
        window.mainApp.showToast('Post details coming soon!', 'info');
    }
}

// View User Profile
function viewUserProfile(userId) {
    console.log('View user profile:', userId);
    
    if (window.mainApp && window.mainApp.showToast) {
        window.mainApp.showToast('User profile coming soon!', 'info');
    }
}

// Get Unread Count
function getUnreadCount() {
    return unreadCount;
}

// Subscribe to Notifications (Real-time)
function subscribeToNotifications(userId) {
    if (window.firebaseConfig && window.firebaseConfig.notificationsCollection) {
        const unsubscribe = window.firebaseConfig.notificationsCollection
            .where('userId', '==', userId)
            .where('read', '==', false)
            .onSnapshot(snapshot => {
                snapshot.docChanges().forEach(change => {
                    if (change.type === 'added') {
                        // New notification received
                        const notification = {
                            id: change.doc.id,
                            ...change.doc.data()
                        };
                        
                        // Show toast
                        if (window.mainApp && window.mainApp.showToast) {
                            window.mainApp.showToast('New notification!', 'info');
                        }
                        
                        // Reload notifications
                        loadNotifications();
                    }
                });
            });
        
        return unsubscribe;
    }
}

// Export functions
window.notificationFunctions = {
    initializeNotifications,
    loadNotifications,
    markNotificationAsRead,
    markAllAsRead,
    createNotification,
    deleteNotification,
    clearAllNotifications,
    getUnreadCount,
    subscribeToNotifications
};

// Auto initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeNotifications);
} else {
    initializeNotifications();
}

console.log('Notification.js loaded successfully');