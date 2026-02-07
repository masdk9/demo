
/* ========================================
   FEED.JS - Feed Section Logic
   ======================================== */

// Feed state
let feedPosts = [];
let lastVisible = null;
let isLoadingFeed = false;

// Initialize Feed
function initializeFeed() {
    console.log('Initializing feed...');
    
    // Load initial feed
    loadFeed();
    
    // Scroll to load more (infinite scroll)
    const mainContent = document.getElementById('mainContent');
    if (mainContent) {
        mainContent.addEventListener('scroll', handleFeedScroll);
    }
}

// Load Feed
async function loadFeed(loadMore = false) {
    if (isLoadingFeed) return;
    
    const feedContainer = document.getElementById('feedPosts');
    if (!feedContainer) return;
    
    try {
        isLoadingFeed = true;
        
        // Show loading state
        if (!loadMore) {
            feedContainer.innerHTML = createFeedSkeleton(3);
        } else {
            feedContainer.innerHTML += createFeedSkeleton(2);
        }
        
        // Get posts from Firebase
        if (window.firebaseConfig && window.firebaseConfig.postsCollection) {
            let query = window.firebaseConfig.postsCollection
                .orderBy('createdAt', 'desc')
                .limit(10);
            
            // Load more posts
            if (loadMore && lastVisible) {
                query = query.startAfter(lastVisible);
            }
            
            const snapshot = await query.get();
            
            if (!snapshot.empty) {
                lastVisible = snapshot.docs[snapshot.docs.length - 1];
                
                const posts = [];
                snapshot.forEach(doc => {
                    posts.push({
                        id: doc.id,
                        ...doc.data()
                    });
                });
                
                // Clear skeleton if first load
                if (!loadMore) {
                    feedPosts = posts;
                    feedContainer.innerHTML = '';
                } else {
                    feedPosts = [...feedPosts, ...posts];
                }
                
                // Render posts
                renderFeed(posts, feedContainer, loadMore);
            } else {
                // No posts found
                if (!loadMore) {
                    feedContainer.innerHTML = createEmptyFeedState();
                }
            }
        } else {
            // Show dummy posts if Firebase not available
            feedContainer.innerHTML = '';
            renderDummyPosts(feedContainer);
        }
    } catch (error) {
        console.error('Error loading feed:', error);
        feedContainer.innerHTML = '<p class="text-center text-danger">Error loading feed. Please try again.</p>';
    } finally {
        isLoadingFeed = false;
    }
}

// Render Feed
function renderFeed(posts, container, append = false) {
    posts.forEach(post => {
        const postElement = createPostElement(post);
        container.appendChild(postElement);
    });
}

// Create Post Element
function createPostElement(post) {
    const postDiv = document.createElement('div');
    postDiv.className = 'post-card';
    postDiv.setAttribute('data-post-id', post.id);
    
    const postType = post.type || 'text';
    
    switch(postType) {
        case 'quiz':
            postDiv.innerHTML = createQuizPost(post);
            break;
        case 'poll':
            postDiv.innerHTML = createPollPost(post);
            break;
        case 'card':
            postDiv.innerHTML = createFlashcardPost(post);
            break;
        case 'media':
            postDiv.innerHTML = createMediaPost(post);
            break;
        default:
            postDiv.innerHTML = createTextPost(post);
    }
    
    // Attach event listeners
    attachPostEventListeners(postDiv, post);
    
    return postDiv;
}

// Create Text Post
function createTextPost(post) {
    const bgColor = post.backgroundColor || '#ffffff';
    const hasBg = bgColor !== '#ffffff';
    
    return `
        <div class="post-card-inner">
            <div class="post-card-header">
                <div class="post-author-info">
                    <div class="post-author-avatar">
                        <i class="fas fa-user-circle"></i>
                    </div>
                    <div class="post-author-details">
                        <h6 class="post-author-name">
                            ${post.authorName || 'Anonymous'}
                            <i class="fas fa-check-circle verified-icon"></i>
                        </h6>
                        <p class="post-author-username">
                            ${post.authorUsername || '@user'}
                            <span class="post-timestamp">• ${formatTime(post.createdAt)}</span>
                        </p>
                    </div>
                </div>
                <button class="post-menu-button">
                    <i class="fas fa-ellipsis-v"></i>
                </button>
            </div>
            
            <div class="post-card-content">
                ${hasBg ? 
                    `<div class="post-content colored-bg" style="background: ${bgColor};">
                        <p class="post-text">${post.content || ''}</p>
                    </div>` :
                    `<p class="post-text-content">${post.content || ''}</p>`
                }
            </div>
            
            <div class="post-card-footer">
                <div class="post-stats-row">
                    <div class="post-stats-left">
                        <span class="post-stat">${post.likes || 0} likes</span>
                        <span class="post-stat">${post.comments || 0} comments</span>
                    </div>
                </div>
                <div class="post-actions-row">
                    <button class="post-action-button like-btn" data-action="like">
                        <i class="far fa-heart"></i>
                        <span class="action-count">${formatCount(post.likes || 0)}</span>
                    </button>
                    <button class="post-action-button comment-btn" data-action="comment">
                        <i class="far fa-comment"></i>
                        <span class="action-count">${formatCount(post.comments || 0)}</span>
                    </button>
                    <button class="post-action-button share-btn" data-action="share">
                        <i class="fas fa-share"></i>
                        <span class="action-count">${formatCount(post.shares || 0)}</span>
                    </button>
                    <button class="post-action-button save-btn" data-action="save">
                        <i class="far fa-bookmark"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Create Quiz Post
function createQuizPost(post) {
    const options = post.options || [];
    const correctOption = post.correctOption || 0;
    
    return `
        <div class="post-card-inner">
            <div class="post-card-header">
                <div class="post-author-info">
                    <div class="post-author-avatar">
                        <i class="fas fa-user-circle"></i>
                    </div>
                    <div class="post-author-details">
                        <h6 class="post-author-name">
                            ${post.authorName || 'Anonymous'}
                            <i class="fas fa-check-circle verified-icon"></i>
                        </h6>
                        <p class="post-author-username">
                            ${post.authorUsername || '@user'}
                            <span class="post-timestamp">• ${formatTime(post.createdAt)}</span>
                        </p>
                    </div>
                </div>
                <button class="post-menu-button">
                    <i class="fas fa-ellipsis-v"></i>
                </button>
            </div>
            
            <div class="post-card-content">
                <p class="quiz-question">${post.question || 'Question?'}</p>
                
                <div class="quiz-options">
                    ${options.map((option, index) => `
                        <div class="quiz-option" data-option="${index}" data-correct="${index === correctOption}">
                            (${String.fromCharCode(65 + index)}) ${option}
                        </div>
                    `).join('')}
                </div>
                
                <div class="quiz-explanation">
                    <div class="quiz-explanation-header">
                        <i class="fas fa-lightbulb"></i>
                        <strong>Explanation</strong>
                    </div>
                    <p class="quiz-explanation-text">${post.explanation || 'No explanation provided.'}</p>
                </div>
            </div>
            
            <div class="post-card-footer">
                <div class="post-actions-row">
                    <button class="post-action-button like-btn" data-action="like">
                        <i class="far fa-heart"></i>
                        <span class="action-count">${formatCount(post.likes || 0)}</span>
                    </button>
                    <button class="post-action-button comment-btn" data-action="comment">
                        <i class="far fa-comment"></i>
                        <span class="action-count">${formatCount(post.comments || 0)}</span>
                    </button>
                    <button class="post-action-button share-btn" data-action="share">
                        <i class="fas fa-share"></i>
                        <span class="action-count">${formatCount(post.shares || 0)}</span>
                    </button>
                    <button class="post-action-button save-btn" data-action="save">
                        <i class="far fa-bookmark"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Create Poll Post
function createPollPost(post) {
    const correctAnswer = post.correctAnswer || 'yes';
    
    return `
        <div class="post-card-inner">
            <div class="post-card-header">
                <div class="post-author-info">
                    <div class="post-author-avatar">
                        <i class="fas fa-user-circle"></i>
                    </div>
                    <div class="post-author-details">
                        <h6 class="post-author-name">
                            ${post.authorName || 'Anonymous'}
                            <i class="fas fa-check-circle verified-icon"></i>
                        </h6>
                        <p class="post-author-username">
                            ${post.authorUsername || '@user'}
                            <span class="post-timestamp">• ${formatTime(post.createdAt)}</span>
                        </p>
                    </div>
                </div>
                <button class="post-menu-button">
                    <i class="fas fa-ellipsis-v"></i>
                </button>
            </div>
            
            <div class="post-card-content">
                <p class="poll-question">${post.question || 'True or False?'}</p>
                
                <div class="poll-options">
                    <div class="poll-option true-option" data-answer="yes" data-correct="${correctAnswer === 'yes'}">
                        TRUE
                    </div>
                    <div class="poll-option false-option" data-answer="no" data-correct="${correctAnswer === 'no'}">
                        FALSE
                    </div>
                </div>
                
                <div class="poll-result">
                    <div class="poll-result-icon">
                        <i class="fas fa-times-circle"></i>
                    </div>
                    <p class="poll-result-text">Wrong!</p>
                    <p class="quiz-explanation-text">${post.explanation || 'No explanation provided.'}</p>
                </div>
            </div>
            
            <div class="post-card-footer">
                <div class="post-actions-row">
                    <button class="post-action-button like-btn" data-action="like">
                        <i class="far fa-heart"></i>
                        <span class="action-count">${formatCount(post.likes || 0)}</span>
                    </button>
                    <button class="post-action-button comment-btn" data-action="comment">
                        <i class="far fa-comment"></i>
                        <span class="action-count">${formatCount(post.comments || 0)}</span>
                    </button>
                    <button class="post-action-button share-btn" data-action="share">
                        <i class="fas fa-share"></i>
                        <span class="action-count">${formatCount(post.shares || 0)}</span>
                    </button>
                    <button class="post-action-button save-btn" data-action="save">
                        <i class="far fa-bookmark"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Create Flashcard Post
function createFlashcardPost(post) {
    return `
        <div class="post-card-inner">
            <div class="post-card-header">
                <div class="post-author-info">
                    <div class="post-author-avatar">
                        <i class="fas fa-user-circle"></i>
                    </div>
                    <div class="post-author-details">
                        <h6 class="post-author-name">
                            ${post.authorName || 'Anonymous'}
                            <i class="fas fa-check-circle verified-icon"></i>
                        </h6>
                        <p class="post-author-username">
                            ${post.authorUsername || '@user'}
                            <span class="post-timestamp">• ${formatTime(post.createdAt)}</span>
                        </p>
                    </div>
                </div>
                <button class="post-menu-button">
                    <i class="fas fa-ellipsis-v"></i>
                </button>
            </div>
            
            <div class="post-card-content">
                <div class="flashcard-container">
                    <div class="flashcard">
                        <div class="flashcard-front">
                            <span class="flashcard-label">Front</span>
                            <div class="flashcard-content">${post.front || 'Term'}</div>
                        </div>
                        <div class="flashcard-back">
                            <span class="flashcard-label">Back</span>
                            <div class="flashcard-content">${post.back || 'Definition'}</div>
                        </div>
                    </div>
                </div>
                <p class="flip-hint">
                    <i class="fas fa-sync-alt"></i>
                    Tap to flip
                </p>
            </div>
            
            <div class="post-card-footer">
                <div class="post-actions-row">
                    <button class="post-action-button like-btn" data-action="like">
                        <i class="far fa-heart"></i>
                        <span class="action-count">${formatCount(post.likes || 0)}</span>
                    </button>
                    <button class="post-action-button comment-btn" data-action="comment">
                        <i class="far fa-comment"></i>
                        <span class="action-count">${formatCount(post.comments || 0)}</span>
                    </button>
                    <button class="post-action-button share-btn" data-action="share">
                        <i class="fas fa-share"></i>
                        <span class="action-count">${formatCount(post.shares || 0)}</span>
                    </button>
                    <button class="post-action-button save-btn" data-action="save">
                        <i class="far fa-bookmark"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Create Media Post
function createMediaPost(post) {
    return `
        <div class="post-card-inner">
            <div class="post-card-header">
                <div class="post-author-info">
                    <div class="post-author-avatar">
                        <i class="fas fa-user-circle"></i>
                    </div>
                    <div class="post-author-details">
                        <h6 class="post-author-name">
                            ${post.authorName || 'Anonymous'}
                            <i class="fas fa-check-circle verified-icon"></i>
                        </h6>
                        <p class="post-author-username">
                            ${post.authorUsername || '@user'}
                            <span class="post-timestamp">• ${formatTime(post.createdAt)}</span>
                        </p>
                    </div>
                </div>
                <button class="post-menu-button">
                    <i class="fas fa-ellipsis-v"></i>
                </button>
            </div>
            
            <div class="post-card-content">
                ${post.caption ? `<p class="post-text-content">${post.caption}</p>` : ''}
                
                <div class="post-image-container">
                    <img src="${post.imageUrl || 'https://via.placeholder.com/600x400'}" alt="Post image" class="post-image">
                </div>
            </div>
            
            <div class="post-card-footer">
                <div class="post-stats-row">
                    <div class="post-stats-left">
                        <span class="post-stat">${post.likes || 0} likes</span>
                        <span class="post-stat">${post.comments || 0} comments</span>
                    </div>
                </div>
                <div class="post-actions-row">
                    <button class="post-action-button like-btn" data-action="like">
                        <i class="far fa-heart"></i>
                        <span class="action-count">${formatCount(post.likes || 0)}</span>
                    </button>
                    <button class="post-action-button comment-btn" data-action="comment">
                        <i class="far fa-comment"></i>
                        <span class="action-count">${formatCount(post.comments || 0)}</span>
                    </button>
                    <button class="post-action-button share-btn" data-action="share">
                        <i class="fas fa-share"></i>
                        <span class="action-count">${formatCount(post.shares || 0)}</span>
                    </button>
                    <button class="post-action-button save-btn" data-action="save">
                        <i class="far fa-bookmark"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Attach Post Event Listeners
function attachPostEventListeners(postElement, post) {
    // Quiz option click
    const quizOptions = postElement.querySelectorAll('.quiz-option');
    quizOptions.forEach(option => {
        option.addEventListener('click', function() {
            handleQuizAnswer(this, postElement);
        });
    });
    
    // Poll option click
    const pollOptions = postElement.querySelectorAll('.poll-option');
    pollOptions.forEach(option => {
        option.addEventListener('click', function() {
            handlePollAnswer(this, postElement);
        });
    });
    
    // Flashcard flip
    const flashcard = postElement.querySelector('.flashcard');
    if (flashcard) {
        flashcard.addEventListener('click', function() {
            this.classList.toggle('flipped');
        });
    }
    
    // Action buttons
    const actionButtons = postElement.querySelectorAll('.post-action-button');
    actionButtons.forEach(button => {
        button.addEventListener('click', function() {
            handlePostAction(this, post);
        });
    });
}

// Handle Quiz Answer
function handleQuizAnswer(option, postElement) {
    const allOptions = postElement.querySelectorAll('.quiz-option');
    const isCorrect = option.getAttribute('data-correct') === 'true';
    const explanation = postElement.querySelector('.quiz-explanation');
    
    // Disable all options
    allOptions.forEach(opt => {
        opt.classList.add('disabled');
        const optCorrect = opt.getAttribute('data-correct') === 'true';
        if (optCorrect) {
            opt.classList.add('correct');
        }
    });
    
    // Mark selected option
    option.classList.add('selected');
    if (!isCorrect) {
        option.classList.add('incorrect');
    }
    
    // Show explanation
    if (explanation) {
        explanation.classList.add('show');
    }
}

// Handle Poll Answer
function handlePollAnswer(option, postElement) {
    const allOptions = postElement.querySelectorAll('.poll-option');
    const isCorrect = option.getAttribute('data-correct') === 'true';
    const pollResult = postElement.querySelector('.poll-result');
    
    // Disable all options
    allOptions.forEach(opt => opt.style.pointerEvents = 'none');
    
    // Mark selected
    option.classList.add('selected');
    
    // Show result
    if (pollResult) {
        const resultIcon = pollResult.querySelector('.poll-result-icon i');
        const resultText = pollResult.querySelector('.poll-result-text');
        
        if (isCorrect) {
            pollResult.classList.add('show', 'correct');
            resultIcon.className = 'fas fa-check-circle correct';
            resultText.textContent = 'Correct!';
        } else {
            pollResult.classList.add('show', 'incorrect');
            resultIcon.className = 'fas fa-times-circle incorrect';
            resultText.textContent = 'Wrong!';
        }
    }
}

// Handle Post Actions
function handlePostAction(button, post) {
    const action = button.getAttribute('data-action');
    
    switch(action) {
        case 'like':
            handleLike(button, post);
            break;
        case 'comment':
            handleComment(button, post);
            break;
        case 'share':
            handleShare(button, post);
            break;
        case 'save':
            handleSave(button, post);
            break;
    }
}

// Handle Like
function handleLike(button, post) {
    button.classList.toggle('liked');
    const icon = button.querySelector('i');
    
    if (button.classList.contains('liked')) {
        icon.classList.replace('far', 'fas');
    } else {
        icon.classList.replace('fas', 'far');
    }
    
    // Update count (would update in Firebase in real app)
    console.log('Liked post:', post.id);
}

// Handle Comment
function handleComment(button, post) {
    console.log('Comment on post:', post.id);
    if (window.mainApp && window.mainApp.showToast) {
        window.mainApp.showToast('Comment feature coming soon!', 'info');
    }
}

// Handle Share
function handleShare(button, post) {
    console.log('Share post:', post.id);
    if (window.mainApp && window.mainApp.showToast) {
        window.mainApp.showToast('Share feature coming soon!', 'info');
    }
}

// Handle Save
function handleSave(button, post) {
    button.classList.toggle('saved');
    const icon = button.querySelector('i');
    
    if (button.classList.contains('saved')) {
        icon.classList.replace('far', 'fas');
        if (window.mainApp && window.mainApp.showToast) {
            window.mainApp.showToast('Post saved!', 'success');
        }
    } else {
        icon.classList.replace('fas', 'far');
        if (window.mainApp && window.mainApp.showToast) {
            window.mainApp.showToast('Post removed from saved', 'info');
        }
    }
    
    console.log('Saved post:', post.id);
}

// Handle Feed Scroll (Infinite Scroll)
function handleFeedScroll() {
    const mainContent = document.getElementById('mainContent');
    const feedContainer = document.getElementById('feedPosts');
    
    if (!mainContent || !feedContainer) return;
    
    const scrollTop = mainContent.scrollTop;
    const scrollHeight = mainContent.scrollHeight;
    const clientHeight = mainContent.clientHeight;
    
    // Load more when 80% scrolled
    if (scrollTop + clientHeight >= scrollHeight * 0.8) {
        if (!isLoadingFeed) {
            loadFeed(true);
        }
    }
}

// Create Feed Skeleton
function createFeedSkeleton(count = 3) {
    let skeletons = '';
    for (let i = 0; i < count; i++) {
        skeletons += `
            <div class="post-card-skeleton">
                <div style="display: flex; gap: 1rem; margin-bottom: 1rem;">
                    <div class="skeleton skeleton-avatar"></div>
                    <div style="flex: 1;">
                        <div class="skeleton skeleton-text" style="width: 40%; margin-bottom: 0.5rem;"></div>
                        <div class="skeleton skeleton-text short"></div>
                    </div>
                </div>
                <div class="skeleton skeleton-text"></div>
                <div class="skeleton skeleton-text medium"></div>
                <div class="skeleton skeleton-image"></div>
            </div>
        `;
    }
    return skeletons;
}

// Create Empty Feed State
function createEmptyFeedState() {
    return `
        <div class="empty-feed">
            <i class="fas fa-newspaper"></i>
            <h4>No posts yet</h4>
            <p>Start creating content to see it in your feed!</p>
        </div>
    `;
}

// Render Dummy Posts (for testing)
function renderDummyPosts(container) {
    const dummyPosts = [
        {
            id: '1',
            type: 'text',
            authorName: 'Rahul Verma',
            authorUsername: '@rahul_ssc',
            content: 'Kal subah 10 baje "Modern History" ka special live session hoga. Notes ready rakhna! 📚✍️',
            createdAt: new Date(),
            likes: 120,
            comments: 45,
            shares: 12
        },
        {
            id: '2',
            type: 'quiz',
            authorName: 'Amit Physics',
            authorUsername: '@amit_phy',
            question: 'Rate of change of momentum kis physical quantity ke barabar hota hai?',
            options: ['Force', 'Impulse', 'Pressure', 'Velocity'],
            correctOption: 0,
            explanation: 'F = dp/dt (Newton\'s 2nd Law).',
            createdAt: new Date(Date.now() - 3600000),
            likes: 89,
            comments: 12,
            shares: 5
        },
        {
            id: '3',
            type: 'poll',
            authorName: 'Science Hub',
            authorUsername: '@science_hub',
            question: 'Sound travels faster in vacuum than in air.',
            correctAnswer: 'no',
            explanation: 'Vacuum has no medium.',
            createdAt: new Date(Date.now() - 7200000),
            likes: 890,
            comments: 145,
            shares: 50
        }
    ];
    
    dummyPosts.forEach(post => {
        const postElement = createPostElement(post);
        container.appendChild(postElement);
    });
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

// Format Count
function formatCount(count) {
    if (count >= 1000000) {
        return (count / 1000000).toFixed(1) + 'M';
    }
    if (count >= 1000) {
        return (count / 1000).toFixed(1) + 'k';
    }
    return count;
}

// Export functions
window.loadFeed = loadFeed;
window.feedFunctions = {
    initializeFeed,
    loadFeed,
    renderFeed,
    createPostElement
};

// Auto initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeFeed);
} else {
    initializeFeed();
}

console.log('Feed.js loaded successfully');