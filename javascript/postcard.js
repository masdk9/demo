
/* ========================================
   POSTCARD.JS - Post Card Component Logic
   ======================================== */

// Post interactions state
let likedPosts = new Set();
let savedPosts = new Set();

// Initialize Post Card
function initializePostCard() {
    // Load saved interactions from localStorage
    loadSavedInteractions();
    
    console.log('PostCard initialized');
}

// Load Saved Interactions
function loadSavedInteractions() {
    const savedLikes = localStorage.getItem('likedPosts');
    const savedBookmarks = localStorage.getItem('savedPosts');
    
    if (savedLikes) {
        likedPosts = new Set(JSON.parse(savedLikes));
    }
    
    if (savedBookmarks) {
        savedPosts = new Set(JSON.parse(savedBookmarks));
    }
}

// Save Interactions
function saveInteractions() {
    localStorage.setItem('likedPosts', JSON.stringify([...likedPosts]));
    localStorage.setItem('savedPosts', JSON.stringify([...savedPosts]));
}

// Like Post
async function likePost(postId, button) {
    try {
        const isLiked = likedPosts.has(postId);
        const icon = button.querySelector('i');
        const countSpan = button.querySelector('.action-count');
        
        if (isLiked) {
            // Unlike
            likedPosts.delete(postId);
            button.classList.remove('liked');
            icon.classList.replace('fas', 'far');
            
            // Update count
            if (countSpan) {
                let count = parseInt(countSpan.textContent) || 0;
                count = Math.max(0, count - 1);
                countSpan.textContent = formatNumber(count);
            }
            
            // Update in Firebase
            if (window.firebaseConfig && window.firebaseConfig.postsCollection) {
                await window.firebaseConfig.postsCollection.doc(postId).update({
                    likes: firebase.firestore.FieldValue.increment(-1)
                });
            }
        } else {
            // Like
            likedPosts.add(postId);
            button.classList.add('liked');
            icon.classList.replace('far', 'fas');
            
            // Update count
            if (countSpan) {
                let count = parseInt(countSpan.textContent) || 0;
                count++;
                countSpan.textContent = formatNumber(count);
            }
            
            // Update in Firebase
            if (window.firebaseConfig && window.firebaseConfig.postsCollection) {
                await window.firebaseConfig.postsCollection.doc(postId).update({
                    likes: firebase.firestore.FieldValue.increment(1)
                });
            }
        }
        
        // Save to localStorage
        saveInteractions();
        
    } catch (error) {
        console.error('Error liking post:', error);
    }
}

// Save/Bookmark Post
async function savePost(postId, button) {
    try {
        const isSaved = savedPosts.has(postId);
        const icon = button.querySelector('i');
        
        if (isSaved) {
            // Unsave
            savedPosts.delete(postId);
            button.classList.remove('saved');
            icon.classList.replace('fas', 'far');
            
            if (window.mainApp && window.mainApp.showToast) {
                window.mainApp.showToast('Post removed from saved', 'info');
            }
        } else {
            // Save
            savedPosts.add(postId);
            button.classList.add('saved');
            icon.classList.replace('far', 'fas');
            
            if (window.mainApp && window.mainApp.showToast) {
                window.mainApp.showToast('Post saved!', 'success');
            }
        }
        
        // Save to localStorage
        saveInteractions();
        
    } catch (error) {
        console.error('Error saving post:', error);
    }
}

// Comment on Post
function commentOnPost(postId) {
    console.log('Comment on post:', postId);
    
    if (window.mainApp && window.mainApp.showToast) {
        window.mainApp.showToast('Comment feature coming soon!', 'info');
    }
    
    // TODO: Open comment modal
}

// Share Post
function sharePost(postId, postData) {
    console.log('Share post:', postId);
    
    // Check if Web Share API is available
    if (navigator.share) {
        navigator.share({
            title: 'Study Social Post',
            text: postData.content || 'Check out this post on Study Social!',
            url: window.location.href
        })
        .then(() => {
            console.log('Shared successfully');
            if (window.mainApp && window.mainApp.showToast) {
                window.mainApp.showToast('Post shared!', 'success');
            }
        })
        .catch((error) => {
            console.log('Error sharing:', error);
        });
    } else {
        // Fallback: Copy link to clipboard
        const link = window.location.href;
        navigator.clipboard.writeText(link).then(() => {
            if (window.mainApp && window.mainApp.showToast) {
                window.mainApp.showToast('Link copied to clipboard!', 'success');
            }
        }).catch(() => {
            if (window.mainApp && window.mainApp.showToast) {
                window.mainApp.showToast('Share feature not available', 'error');
            }
        });
    }
}

// Delete Post
async function deletePost(postId) {
    const confirmDelete = confirm('Are you sure you want to delete this post?');
    
    if (!confirmDelete) return;
    
    try {
        // Delete from Firebase
        if (window.firebaseConfig && window.firebaseConfig.postsCollection) {
            await window.firebaseConfig.postsCollection.doc(postId).delete();
            
            // Remove from DOM
            const postElement = document.querySelector(`[data-post-id="${postId}"]`);
            if (postElement) {
                postElement.style.transition = 'all 0.3s ease';
                postElement.style.opacity = '0';
                postElement.style.transform = 'translateX(-100%)';
                
                setTimeout(() => {
                    postElement.remove();
                }, 300);
            }
            
            if (window.mainApp && window.mainApp.showToast) {
                window.mainApp.showToast('Post deleted successfully', 'success');
            }
        }
    } catch (error) {
        console.error('Error deleting post:', error);
        if (window.mainApp && window.mainApp.showToast) {
            window.mainApp.showToast('Error deleting post', 'error');
        }
    }
}

// Report Post
function reportPost(postId) {
    const reason = prompt('Please enter the reason for reporting this post:');
    
    if (reason && reason.trim()) {
        console.log('Report post:', postId, 'Reason:', reason);
        
        // TODO: Send report to Firebase
        
        if (window.mainApp && window.mainApp.showToast) {
            window.mainApp.showToast('Post reported. Thank you!', 'success');
        }
    }
}

// Handle Quiz Answer Selection
function handleQuizSelection(optionElement, postElement) {
    // Get all options
    const allOptions = postElement.querySelectorAll('.quiz-option');
    const isCorrect = optionElement.getAttribute('data-correct') === 'true';
    const explanation = postElement.querySelector('.quiz-explanation');
    
    // Disable all options after selection
    allOptions.forEach(opt => {
        opt.classList.add('disabled');
        opt.style.pointerEvents = 'none';
        
        // Highlight correct answer
        if (opt.getAttribute('data-correct') === 'true') {
            opt.classList.add('correct');
        }
    });
    
    // Mark selected option
    optionElement.classList.add('selected');
    
    // Mark incorrect if wrong
    if (!isCorrect) {
        optionElement.classList.add('incorrect');
    }
    
    // Show explanation
    if (explanation) {
        explanation.classList.add('show');
    }
    
    // Animate feedback
    if (isCorrect) {
        optionElement.style.animation = 'pulse 0.5s ease';
    } else {
        optionElement.style.animation = 'shake 0.5s ease';
    }
}

// Handle Poll Answer Selection
function handlePollSelection(optionElement, postElement) {
    // Get all options
    const allOptions = postElement.querySelectorAll('.poll-option');
    const isCorrect = optionElement.getAttribute('data-correct') === 'true';
    const pollResult = postElement.querySelector('.poll-result');
    
    // Disable all options
    allOptions.forEach(opt => {
        opt.style.pointerEvents = 'none';
    });
    
    // Mark selected
    optionElement.classList.add('selected');
    
    // Show result
    if (pollResult) {
        const resultIcon = pollResult.querySelector('.poll-result-icon i');
        const resultText = pollResult.querySelector('.poll-result-text');
        
        if (isCorrect) {
            pollResult.classList.add('show', 'correct');
            if (resultIcon) {
                resultIcon.className = 'fas fa-check-circle correct';
            }
            if (resultText) {
                resultText.textContent = 'Correct! 🎉';
            }
        } else {
            pollResult.classList.add('show', 'incorrect');
            if (resultIcon) {
                resultIcon.className = 'fas fa-times-circle incorrect';
            }
            if (resultText) {
                resultText.textContent = 'Wrong! 😞';
            }
        }
    }
}

// Handle Flashcard Flip
function handleFlashcardFlip(flashcardElement) {
    flashcardElement.classList.toggle('flipped');
}

// View Post Details
function viewPostDetails(postId) {
    console.log('View post details:', postId);
    
    // TODO: Open post detail modal or page
    
    if (window.mainApp && window.mainApp.showToast) {
        window.mainApp.showToast('Post details coming soon!', 'info');
    }
}

// Load Comments
async function loadComments(postId) {
    try {
        if (window.firebaseConfig && window.firebaseConfig.commentsCollection) {
            const snapshot = await window.firebaseConfig.commentsCollection
                .where('postId', '==', postId)
                .orderBy('createdAt', 'desc')
                .limit(3)
                .get();
            
            const comments = [];
            snapshot.forEach(doc => {
                comments.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            return comments;
        }
        
        return [];
    } catch (error) {
        console.error('Error loading comments:', error);
        return [];
    }
}

// Add Comment
async function addComment(postId, commentText) {
    try {
        if (!commentText || !commentText.trim()) {
            return;
        }
        
        if (window.firebaseConfig && window.firebaseConfig.commentsCollection) {
            const userId = window.firebaseConfig.getCurrentUserId();
            const userData = window.currentUserData;
            
            await window.firebaseConfig.commentsCollection.add({
                postId: postId,
                userId: userId,
                authorName: userData?.displayName || 'User',
                authorUsername: userData?.username || '@user',
                text: commentText.trim(),
                likes: 0,
                createdAt: window.firebaseConfig.getTimestamp()
            });
            
            // Update post comment count
            await window.firebaseConfig.postsCollection.doc(postId).update({
                comments: firebase.firestore.FieldValue.increment(1)
            });
            
            if (window.mainApp && window.mainApp.showToast) {
                window.mainApp.showToast('Comment added!', 'success');
            }
        }
    } catch (error) {
        console.error('Error adding comment:', error);
        if (window.mainApp && window.mainApp.showToast) {
            window.mainApp.showToast('Error adding comment', 'error');
        }
    }
}

// Toggle Post Menu
function togglePostMenu(postId, buttonElement) {
    // Create menu if doesn't exist
    let menu = document.getElementById(`post-menu-${postId}`);
    
    if (!menu) {
        menu = createPostMenu(postId);
        buttonElement.parentElement.appendChild(menu);
    }
    
    // Toggle visibility
    menu.classList.toggle('show');
    
    // Close menu when clicking outside
    document.addEventListener('click', function closeMenu(e) {
        if (!menu.contains(e.target) && e.target !== buttonElement) {
            menu.classList.remove('show');
            document.removeEventListener('click', closeMenu);
        }
    });
}

// Create Post Menu
function createPostMenu(postId) {
    const menu = document.createElement('div');
    menu.id = `post-menu-${postId}`;
    menu.className = 'post-menu-dropdown';
    menu.innerHTML = `
        <div class="menu-item" onclick="window.postCardFunctions.savePost('${postId}', this)">
            <i class="fas fa-bookmark"></i>
            <span>Save Post</span>
        </div>
        <div class="menu-item" onclick="window.postCardFunctions.sharePost('${postId}')">
            <i class="fas fa-share"></i>
            <span>Share</span>
        </div>
        <div class="menu-item" onclick="window.postCardFunctions.reportPost('${postId}')">
            <i class="fas fa-flag"></i>
            <span>Report</span>
        </div>
        <div class="menu-item menu-item-danger" onclick="window.postCardFunctions.deletePost('${postId}')">
            <i class="fas fa-trash"></i>
            <span>Delete</span>
        </div>
    `;
    
    return menu;
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

// Check if Post is Liked
function isPostLiked(postId) {
    return likedPosts.has(postId);
}

// Check if Post is Saved
function isPostSaved(postId) {
    return savedPosts.has(postId);
}

// Update Post Stats
function updatePostStats(postId, stats) {
    const postElement = document.querySelector(`[data-post-id="${postId}"]`);
    if (!postElement) return;
    
    // Update likes
    if (stats.likes !== undefined) {
        const likeCount = postElement.querySelector('.like-btn .action-count');
        if (likeCount) {
            likeCount.textContent = formatNumber(stats.likes);
        }
    }
    
    // Update comments
    if (stats.comments !== undefined) {
        const commentCount = postElement.querySelector('.comment-btn .action-count');
        if (commentCount) {
            commentCount.textContent = formatNumber(stats.comments);
        }
    }
    
    // Update shares
    if (stats.shares !== undefined) {
        const shareCount = postElement.querySelector('.share-btn .action-count');
        if (shareCount) {
            shareCount.textContent = formatNumber(stats.shares);
        }
    }
}

// Animate Post Action
function animatePostAction(button, animationType) {
    button.style.animation = 'none';
    
    setTimeout(() => {
        button.style.animation = `${animationType} 0.3s ease`;
    }, 10);
    
    setTimeout(() => {
        button.style.animation = '';
    }, 300);
}

// Export functions
window.postCardFunctions = {
    initializePostCard,
    likePost,
    savePost,
    commentOnPost,
    sharePost,
    deletePost,
    reportPost,
    handleQuizSelection,
    handlePollSelection,
    handleFlashcardFlip,
    viewPostDetails,
    loadComments,
    addComment,
    togglePostMenu,
    isPostLiked,
    isPostSaved,
    updatePostStats,
    animatePostAction
};

// Auto initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePostCard);
} else {
    initializePostCard();
}

console.log('PostCard.js loaded successfully');