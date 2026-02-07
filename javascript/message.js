
/* ========================================
   MESSAGE.JS - Message Section Logic
   ======================================== */

// Message state
let conversations = [];
let activeConversation = null;
let isLoadingMessages = false;

// Initialize Messages
function initializeMessages() {
    // Load conversations
    loadConversations();
    
    // Initialize search
    initializeMessageSearch();
    
    // Initialize new message button
    const newMessageBtn = document.querySelector('.new-message-btn');
    if (newMessageBtn) {
        newMessageBtn.addEventListener('click', createNewMessage);
    }
    
    console.log('Messages initialized');
}

// Load Conversations
async function loadConversations() {
    if (isLoadingMessages) return;
    
    const messageList = document.querySelector('.message-list');
    if (!messageList) return;
    
    try {
        isLoadingMessages = true;
        
        // Show loading state
        messageList.innerHTML = createMessageSkeleton(5);
        
        // Load from Firebase
        if (window.firebaseConfig && window.firebaseConfig.messagesCollection) {
            const userId = window.firebaseConfig.getCurrentUserId();
            
            const snapshot = await window.firebaseConfig.messagesCollection
                .where('participants', 'array-contains', userId)
                .orderBy('lastMessageAt', 'desc')
                .limit(20)
                .get();
            
            if (!snapshot.empty) {
                conversations = [];
                snapshot.forEach(doc => {
                    conversations.push({
                        id: doc.id,
                        ...doc.data()
                    });
                });
                
                // Render conversations
                messageList.innerHTML = '';
                renderConversations(conversations, messageList);
            } else {
                messageList.innerHTML = createEmptyMessageState();
            }
        } else {
            // Show dummy conversations
            messageList.innerHTML = '';
            renderDummyConversations(messageList);
        }
    } catch (error) {
        console.error('Error loading conversations:', error);
        messageList.innerHTML = `
            <p class="text-center text-danger">Error loading messages. Please try again.</p>
        `;
    } finally {
        isLoadingMessages = false;
    }
}

// Render Conversations
function renderConversations(convos, container) {
    convos.forEach(conversation => {
        const convoElement = createConversationElement(conversation);
        container.appendChild(convoElement);
    });
}

// Create Conversation Element
function createConversationElement(conversation) {
    const convoDiv = document.createElement('div');
    convoDiv.className = `message-item ${conversation.unread ? 'unread' : ''}`;
    convoDiv.setAttribute('data-conversation-id', conversation.id);
    
    // Get other user info
    const currentUserId = window.firebaseConfig?.getCurrentUserId();
    const otherUser = conversation.participants?.find(p => p !== currentUserId);
    
    convoDiv.innerHTML = `
        <div class="message-avatar">
            <i class="fas fa-user-circle"></i>
            ${conversation.online ? '<div class="online-indicator"></div>' : ''}
        </div>
        <div class="message-content">
            <div class="message-header-info">
                <h6>${conversation.userName || 'User'}</h6>
                <span class="message-time">${formatTime(conversation.lastMessageAt)}</span>
            </div>
            <p class="message-preview">${conversation.lastMessage || 'No messages yet'}</p>
        </div>
        ${conversation.unreadCount ? `<div class="unread-badge">${conversation.unreadCount}</div>` : ''}
    `;
    
    // Add click listener
    convoDiv.addEventListener('click', function() {
        openConversation(conversation);
    });
    
    return convoDiv;
}

// Open Conversation
function openConversation(conversation) {
    activeConversation = conversation;
    
    console.log('Open conversation:', conversation);
    
    if (window.mainApp && window.mainApp.showToast) {
        window.mainApp.showToast('Chat interface coming soon!', 'info');
    }
    
    // Mark as read
    if (conversation.unread) {
        markConversationAsRead(conversation.id);
    }
    
    // TODO: Navigate to chat interface
}

// Mark Conversation as Read
async function markConversationAsRead(conversationId) {
    try {
        // Update in Firebase
        if (window.firebaseConfig && window.firebaseConfig.messagesCollection) {
            await window.firebaseConfig.messagesCollection.doc(conversationId).update({
                unread: false,
                unreadCount: 0
            });
        }
        
        // Update in local state
        const conversation = conversations.find(c => c.id === conversationId);
        if (conversation) {
            conversation.unread = false;
            conversation.unreadCount = 0;
        }
        
        // Update UI
        const convoElement = document.querySelector(`[data-conversation-id="${conversationId}"]`);
        if (convoElement) {
            convoElement.classList.remove('unread');
            const badge = convoElement.querySelector('.unread-badge');
            if (badge) {
                badge.remove();
            }
        }
        
    } catch (error) {
        console.error('Error marking conversation as read:', error);
    }
}

// Create New Message
function createNewMessage() {
    console.log('Create new message');
    
    if (window.mainApp && window.mainApp.showToast) {
        window.mainApp.showToast('New message feature coming soon!', 'info');
    }
    
    // TODO: Open new message modal with user search
}

// Send Message
async function sendMessage(conversationId, messageText) {
    try {
        if (!messageText || !messageText.trim()) {
            return;
        }
        
        if (window.firebaseConfig && window.firebaseConfig.messagesCollection) {
            const userId = window.firebaseConfig.getCurrentUserId();
            const userData = window.currentUserData;
            
            // Add message to conversation
            await window.firebaseConfig.messagesCollection.doc(conversationId).collection('messages').add({
                senderId: userId,
                senderName: userData?.displayName || 'User',
                text: messageText.trim(),
                createdAt: window.firebaseConfig.getTimestamp()
            });
            
            // Update conversation
            await window.firebaseConfig.messagesCollection.doc(conversationId).update({
                lastMessage: messageText.trim(),
                lastMessageAt: window.firebaseConfig.getTimestamp(),
                unread: true,
                unreadCount: firebase.firestore.FieldValue.increment(1)
            });
            
            console.log('Message sent successfully');
        }
    } catch (error) {
        console.error('Error sending message:', error);
        
        if (window.mainApp && window.mainApp.showToast) {
            window.mainApp.showToast('Error sending message', 'error');
        }
    }
}

// Delete Conversation
async function deleteConversation(conversationId) {
    const confirm = window.confirm('Are you sure you want to delete this conversation?');
    
    if (!confirm) return;
    
    try {
        // Delete from Firebase
        if (window.firebaseConfig && window.firebaseConfig.messagesCollection) {
            await window.firebaseConfig.messagesCollection.doc(conversationId).delete();
        }
        
        // Remove from local state
        conversations = conversations.filter(c => c.id !== conversationId);
        
        // Remove from UI
        const convoElement = document.querySelector(`[data-conversation-id="${conversationId}"]`);
        if (convoElement) {
            convoElement.style.transition = 'all 0.3s ease';
            convoElement.style.opacity = '0';
            convoElement.style.transform = 'translateX(-100%)';
            
            setTimeout(() => {
                convoElement.remove();
            }, 300);
        }
        
        if (window.mainApp && window.mainApp.showToast) {
            window.mainApp.showToast('Conversation deleted', 'success');
        }
        
    } catch (error) {
        console.error('Error deleting conversation:', error);
        
        if (window.mainApp && window.mainApp.showToast) {
            window.mainApp.showToast('Error deleting conversation', 'error');
        }
    }
}

// Mute Conversation
async function muteConversation(conversationId, mute = true) {
    try {
        // Update in Firebase
        if (window.firebaseConfig && window.firebaseConfig.messagesCollection) {
            await window.firebaseConfig.messagesCollection.doc(conversationId).update({
                muted: mute
            });
        }
        
        // Update in local state
        const conversation = conversations.find(c => c.id === conversationId);
        if (conversation) {
            conversation.muted = mute;
        }
        
        const message = mute ? 'Conversation muted' : 'Conversation unmuted';
        
        if (window.mainApp && window.mainApp.showToast) {
            window.mainApp.showToast(message, 'success');
        }
        
    } catch (error) {
        console.error('Error muting conversation:', error);
    }
}

// Block User
async function blockUser(userId) {
    const confirm = window.confirm('Are you sure you want to block this user?');
    
    if (!confirm) return;
    
    try {
        // TODO: Implement block functionality in Firebase
        console.log('Block user:', userId);
        
        if (window.mainApp && window.mainApp.showToast) {
            window.mainApp.showToast('User blocked', 'success');
        }
    } catch (error) {
        console.error('Error blocking user:', error);
    }
}

// Initialize Message Search
function initializeMessageSearch() {
    const searchInput = document.querySelector('.message-search input');
    
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            const query = this.value.trim().toLowerCase();
            
            searchTimeout = setTimeout(() => {
                filterConversations(query);
            }, 300);
        });
    }
}

// Filter Conversations
function filterConversations(query) {
    const messageItems = document.querySelectorAll('.message-item');
    
    messageItems.forEach(item => {
        const userName = item.querySelector('h6')?.textContent.toLowerCase();
        const messagePreview = item.querySelector('.message-preview')?.textContent.toLowerCase();
        
        if (userName?.includes(query) || messagePreview?.includes(query)) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
}

// Get Unread Messages Count
function getUnreadMessagesCount() {
    return conversations.reduce((total, convo) => {
        return total + (convo.unreadCount || 0);
    }, 0);
}

// Load Messages for Conversation
async function loadMessages(conversationId) {
    try {
        if (window.firebaseConfig && window.firebaseConfig.messagesCollection) {
            const snapshot = await window.firebaseConfig.messagesCollection
                .doc(conversationId)
                .collection('messages')
                .orderBy('createdAt', 'asc')
                .limit(50)
                .get();
            
            const messages = [];
            snapshot.forEach(doc => {
                messages.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            return messages;
        }
        
        return [];
    } catch (error) {
        console.error('Error loading messages:', error);
        return [];
    }
}

// Subscribe to Messages (Real-time)
function subscribeToMessages(conversationId, callback) {
    if (window.firebaseConfig && window.firebaseConfig.messagesCollection) {
        const unsubscribe = window.firebaseConfig.messagesCollection
            .doc(conversationId)
            .collection('messages')
            .orderBy('createdAt', 'asc')
            .onSnapshot(snapshot => {
                snapshot.docChanges().forEach(change => {
                    if (change.type === 'added') {
                        const message = {
                            id: change.doc.id,
                            ...change.doc.data()
                        };
                        
                        if (callback) {
                            callback(message);
                        }
                    }
                });
            });
        
        return unsubscribe;
    }
}

// Render Dummy Conversations
function renderDummyConversations(container) {
    const dummyConversations = [
        {
            id: '1',
            userName: 'Rahul Verma',
            lastMessage: 'Thanks for sharing those notes!',
            lastMessageAt: new Date(Date.now() - 600000),
            unread: true,
            unreadCount: 2,
            online: true
        },
        {
            id: '2',
            userName: 'Amit Kumar',
            lastMessage: 'Can you help me with this problem?',
            lastMessageAt: new Date(Date.now() - 7200000),
            unread: false,
            online: false
        },
        {
            id: '3',
            userName: 'Priya Sharma',
            lastMessage: 'Great explanation on the quiz!',
            lastMessageAt: new Date(Date.now() - 86400000),
            unread: false,
            online: false
        }
    ];
    
    dummyConversations.forEach(conversation => {
        const convoElement = createConversationElement(conversation);
        container.appendChild(convoElement);
    });
    
    conversations = dummyConversations;
}

// Create Message Skeleton
function createMessageSkeleton(count = 5) {
    let skeletons = '';
    for (let i = 0; i < count; i++) {
        skeletons += `
            <div class="message-skeleton">
                <div class="skeleton skeleton-avatar"></div>
                <div class="skeleton-message-content">
                    <div class="skeleton skeleton-text medium"></div>
                    <div class="skeleton skeleton-text short"></div>
                </div>
            </div>
        `;
    }
    return skeletons;
}

// Create Empty Message State
function createEmptyMessageState() {
    return `
        <div class="message-empty-state">
            <i class="fas fa-comments"></i>
            <h5>No Messages Yet</h5>
            <p>Start a conversation with your study partners!</p>
            <button class="btn btn-primary mt-3" onclick="window.messageFunctions.createNewMessage()">
                <i class="fas fa-plus me-2"></i>New Message
            </button>
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
    if (diff < 3600) return Math.floor(diff / 60) + 'm';
    if (diff < 86400) return Math.floor(diff / 3600) + 'h';
    if (diff < 604800) return Math.floor(diff / 86400) + 'd';
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Archive Conversation
async function archiveConversation(conversationId) {
    try {
        // Update in Firebase
        if (window.firebaseConfig && window.firebaseConfig.messagesCollection) {
            await window.firebaseConfig.messagesCollection.doc(conversationId).update({
                archived: true
            });
        }
        
        // Remove from UI
        const convoElement = document.querySelector(`[data-conversation-id="${conversationId}"]`);
        if (convoElement) {
            convoElement.style.transition = 'all 0.3s ease';
            convoElement.style.opacity = '0';
            
            setTimeout(() => {
                convoElement.remove();
            }, 300);
        }
        
        if (window.mainApp && window.mainApp.showToast) {
            window.mainApp.showToast('Conversation archived', 'success');
        }
        
    } catch (error) {
        console.error('Error archiving conversation:', error);
    }
}

// Pin Conversation
async function pinConversation(conversationId, pin = true) {
    try {
        // Update in Firebase
        if (window.firebaseConfig && window.firebaseConfig.messagesCollection) {
            await window.firebaseConfig.messagesCollection.doc(conversationId).update({
                pinned: pin
            });
        }
        
        // Reload conversations to show pinned at top
        loadConversations();
        
        const message = pin ? 'Conversation pinned' : 'Conversation unpinned';
        
        if (window.mainApp && window.mainApp.showToast) {
            window.mainApp.showToast(message, 'success');
        }
        
    } catch (error) {
        console.error('Error pinning conversation:', error);
    }
}

// Export functions
window.messageFunctions = {
    initializeMessages,
    loadConversations,
    openConversation,
    createNewMessage,
    sendMessage,
    deleteConversation,
    muteConversation,
    blockUser,
    archiveConversation,
    pinConversation,
    getUnreadMessagesCount,
    loadMessages,
    subscribeToMessages
};

// Auto initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeMessages);
} else {
    initializeMessages();
}

console.log('Message.js loaded successfully');