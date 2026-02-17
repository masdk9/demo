
/* ===  POSTS.JS - Feed & feed ====== */

// === GLOBAL STATE ===
let feedPosts = [];
let lastVisible = null;
let isLoadingFeed = false;
let likedPosts = new Set();
let savedPosts = new Set();
let currentPostId = null;
let currentPostUserId = null;
let currentPostUsername = null;

// === INITIALIZATION ===
function initializePosts() {
    console.log('Initializing posts...');
    
    // Load saved interactions
    loadSavedInteractions();
    
    // Initialize kebab menu
    initializeKebabMenu();
    
    // Load feed
    loadFeed();
    
    // Setup scroll handler
    const mainContent = document.getElementById('mainContent');
    if (mainContent) {
        mainContent.addEventListener('scroll', handleFeedScroll);
    }
}

// === SAVED INTERACTIONS ===
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

function saveInteractions() {
    localStorage.setItem('likedPosts', JSON.stringify([...likedPosts]));
    localStorage.setItem('savedPosts', JSON.stringify([...savedPosts]));
}

// === FEED LOADING ===
async function loadFeed(loadMore = false) {
    if (isLoadingFeed) return;
    
    const feedContainer = document.getElementById('feedPosts');
    if (!feedContainer) return;
    
    try {
        isLoadingFeed = true;
        
        // Show loading skeleton
        if (!loadMore) {
            feedContainer.innerHTML = createFeedSkeleton(3);
        } else {
            feedContainer.innerHTML += createFeedSkeleton(2);
        }
        
        // Firebase Logic
        if (window.firebaseConfig && window.firebaseConfig.postsCollection) {
            let query = window.firebaseConfig.postsCollection
                .orderBy('createdAt', 'desc')
                .limit(10);
            
            if (loadMore && lastVisible) {
                query = query.startAfter(lastVisible);
            }
            
            const snapshot = await query.get();
            
            if (!snapshot.empty) {
                lastVisible = snapshot.docs[snapshot.docs.length - 1];
                
                const posts = [];
                snapshot.forEach(doc => {
                    posts.push({ id: doc.id, ...doc.data() });
                });
                
                // Clear skeleton if first load
                if (!loadMore) {
                    feedPosts = posts;
                    feedContainer.innerHTML = '';
                } else {
  feedPosts = [...feedPosts, ...posts];
const skeletons = feedContainer.querySelectorAll('.post-card-skeleton');
  skeletons.forEach(sk => sk.remove());
                }
                
        renderFeed(posts, feedContainer);
            } else {
                if (!loadMore) {
      feedContainer.innerHTML = createEmptyFeedState();
                }
            }
        } else {
            console.log("Firebase not found, showing empty state");
            feedContainer.innerHTML = createEmptyFeedState(); 
        }
    } catch (error) {
        console.error('Error loading feed:', error);
        feedContainer.innerHTML = '<p class="text-center text-danger">Error loading feed. Please try again.</p>';
    } finally {
        isLoadingFeed = false;
    }
}

// === RENDER FEED ===
function renderFeed(posts, container) {
    posts.forEach(post => {
        const postElement = createPostElement(post);
  container.appendChild(postElement);
    });
}

// === CREATE POST ELEMENT ===
function createPostElement(post) {
 const div = document.createElement('div');
    div.innerHTML = createMasterPost(post, getPostContent(post));
    return div.firstElementChild;
}

// === POST HTML GENERATOR ===
function createMasterPost(post, contentHTML) {
let avatarHTML = `<i class="fas fa-user-circle"></i>`;
    if (post.authorPic) {
avatarHTML = `<img src="${post.authorPic}" alt="user">`;
    }
    
    return `
<div class="post-card" data-post-id="${post.id}" data-user-id="${post.userId || ''}">
<div class="post-card-header">
<div class="post-author-info">
<div class="post-author-avatar">${avatarHTML}</div>
<div class="post-author-details">
<h6 class="post-author-name">
${post.authorName || 'Anonymous'}
<i class="fas fa-check-circle verified-icon"></i>
</h6>
<p class="post-author-username">
${post.authorUsername || '@user'}
<span class="post-timestamp">• ${formatTime(post.createdAt)}</span></p>
</div></div>
<button class="post-menu-button" onclick="openMenu('${post.id}', '${post.userId || ''}', '${post.authorUsername || '@user'}')">
<i class="bi bi-three-dots"></i>
</button>
</div>

<div class="post-card-content">${contentHTML}</div>

<div class="post-card-footer">
<div class="post-actions-row">
<button class="post-action-button like-btn" data-action="like" data-post-id="${post.id}">
<i class="far fa-heart"></i>
<span class="action-count">${formatCount(post.likes || 0)}</span>
            </button>
<button class="post-action-button comment-btn" data-action="comment">
<i class="bi bi-chat-square-quote"></i>
<span class="action-count">${formatCount(post.comments || 0)}</span>
</button>
<button class="post-action-button share-btn" data-action="share" data-post-id="${post.id}">
<i class="bi bi-send"></i>
<span class="action-count">${formatCount(post.shares || 0)}</span>
</button>

<button class="post-action-button views-btn">
<i class="bi bi-bar-chart"></i>

<span class="action-count">${formatCount(post.views || 0)}</span>
</button>

<button class="post-action-button save-btn" data-action="save" data-post-id="${post.id}">
<i class="far fa-bookmark"></i>


</button>
</div></div> </div>`;
}

// === POST CONTENT GENERATOR ===
function getPostContent(post) {
    const type = post.type || 'text';
    
switch(type) {
  case 'quiz':
  const options = post.options || [];
  const correctOption = post.correctOption || 0;
  return `
  <p class="quiz-question">${post.question || 'Question?'}</p>
<div class="quiz-options">
${options.map((option, index) => `
<div class="quiz-option" data-option="${index}" data-correct="${index === correctOption}" onclick="handleQuizClick(this)">
      (${String.fromCharCode(65 + index)}) ${option}
</div>`).join('')} </div>

<div class="quiz-explanation">
<div class="quiz-explanation-header">
<i class="fas fa-lightbulb"></i> <strong>Explanation</strong>
</div>
<p class="quiz-explanation-text">${post.explanation || 'No explanation.'}</p>
</div> `;
            
        case 'poll':
const correctAnswer = post.correctAnswer || 'yes';
            return `
<p class="poll-question">${post.question || 'True or False?'}</p>
<div class="poll-options">
<div class="poll-option true-option" data-answer="yes" data-correct="${correctAnswer === 'yes'}" onclick="handlePollClick(this)">TRUE</div>
<div class="poll-option false-option" data-answer="no" data-correct="${correctAnswer === 'no'}" onclick="handlePollClick(this)">FALSE</div>
                </div>

<div class="poll-result">
<div class="poll-result-icon"><i class="fas fa-times-circle"></i></div>
  <p class="poll-result-text">Result</p>
</div> `;

        case 'card':
return `
<div class="flashcard-container">
<div class="flashcard" onclick="this.classList.toggle('flipped')">
<div class="flashcard-front">
<span class="flashcard-label">Front</span>
<div class="flashcard-content">${post.front || 'Term'}</div>
</div>
<div class="flashcard-back">
<span class="flashcard-label">Back</span>
<div class="flashcard-content">${post.back || 'Definition'}</div>
</div>
</div>
<p class="flip-hint"><i class="fas fa-sync-alt"></i> Tap to flip</p>
                </div>
            `;
            
        case 'media':
            return `
${post.caption ? `<p class="post-text-content">${post.caption}</p>` : ''}
<div class="post-image-container">
<img src="${post.imageUrl || 'https://via.placeholder.com/600x400'}" alt="Post image" class="post-image">
                </div>
            `;
            
case 'text':
        default:
const bgColor = post.backgroundColor || '#ffffff';
if (bgColor !== '#ffffff' && bgColor !== 'white') {
                return `
<div class="post-content colored-bg" style="background: ${bgColor};">
<p class="post-text">${post.content || 'Post content'}</p>
</div>`; } 
else {
return `<p class="post-text-content">${post.content || 'Post content'}</p>`;  } } }

// === POST INTERACTIONS ===

// Handle Quiz Click
window.handleQuizClick = function(optionElement) {
    const postCard = optionElement.closest('.post-card');
    const allOptions = postCard.querySelectorAll('.quiz-option');
    const isCorrect = optionElement.getAttribute('data-correct') === 'true';
    const explanation = postCard.querySelector('.quiz-explanation');
    
    // Disable all options
    allOptions.forEach(opt => {
        opt.style.pointerEvents = 'none';
        opt.classList.add('disabled');
        
        if (opt.getAttribute('data-correct') === 'true') {
            opt.classList.add('correct');
        }
    });
    
    optionElement.classList.add('selected');
    if (!isCorrect) {
        optionElement.classList.add('incorrect');
    }
    
    if (explanation) {
        explanation.classList.add('show');
    }
};

// Handle Poll Click
window.handlePollClick = function(optionElement) {
    const postCard = optionElement.closest('.post-card');
    const allOptions = postCard.querySelectorAll('.poll-option');
    const isCorrect = optionElement.getAttribute('data-correct') === 'true';
    const pollResult = postCard.querySelector('.poll-result');
    
    allOptions.forEach(opt => opt.style.pointerEvents = 'none');
    optionElement.classList.add('selected');
    
    if (pollResult) {
        const resultIcon = pollResult.querySelector('.poll-result-icon i');
        const resultText = pollResult.querySelector('.poll-result-text');
        
        pollResult.classList.add('show', isCorrect ? 'correct' : 'incorrect');
        
        if (resultIcon) {
            resultIcon.className = isCorrect ? 'fas fa-check-circle correct' : 'fas fa-times-circle incorrect';
        }
        
        if (resultText) {
            resultText.textContent = isCorrect ? 'Correct! 🎉' : 'Wrong! 😞';
        }
    }
};

// Like Post
async function likePost(postId, button) {
    try {
        const isLiked = likedPosts.has(postId);
        const icon = button.querySelector('i');
        const countSpan = button.querySelector('.action-count');
        let count = parseInt(countSpan.textContent.replace('k', '').replace('M', '')) || 0;
        
        if (isLiked) {
            likedPosts.delete(postId);
            button.classList.remove('liked');
            icon.classList.replace('fas', 'far');
            count = Math.max(0, count - 1);
        } else {
            likedPosts.add(postId);
            button.classList.add('liked');
            icon.classList.replace('far', 'fas');
            count++;
        }
        
        countSpan.textContent = formatCount(count);
        saveInteractions();
        
        // Update Firebase
        if (window.firebaseConfig && window.firebaseConfig.postsCollection) {
            await window.firebaseConfig.postsCollection.doc(postId).update({
                likes: firebase.firestore.FieldValue.increment(isLiked ? -1 : 1)
            });
        }
    } catch (error) {
        console.error('Error liking post:', error);
    }
}

// Save Post
function savePost(postId, button) {
    try {
        const isSaved = savedPosts.has(postId);
        const icon = button.querySelector('i');
        
        if (isSaved) {
            savedPosts.delete(postId);
            button.classList.remove('saved');
            icon.classList.replace('fas', 'far');
            showToast('Removed from saved');
        } else {
            savedPosts.add(postId);
            button.classList.add('saved');
            icon.classList.replace('far', 'fas');
            showToast('Post saved');
        }
        
        saveInteractions();
    } catch (error) {
        console.error('Error saving post:', error);
    }
}

// === KEBAB MENU ===
let menuSheet;
let toast;

function initializeKebabMenu() {
    const menuEl = document.getElementById('kebabMenu');
    const toastEl = document.getElementById('actionToast');
    
    if (menuEl) {
        menuSheet = new bootstrap.Offcanvas(menuEl);
    }
    
    if (toastEl) {
        toast = new bootstrap.Toast(toastEl, { delay: 2500 });
    }
}

function getCurrentUserId() {
    return firebase.auth && firebase.auth().currentUser ? firebase.auth().currentUser.uid : null;
}

window.openMenu = function(postId, userId, username) {
    currentPostId = postId;
    currentPostUserId = userId;
    currentPostUsername = username;
    
    const isOwn = getCurrentUserId() === userId;
    
    // Show/Hide menu items
    const followItem = document.getElementById('menuFollowItem');
    const muteItem = document.getElementById('menuMuteItem');
    const reportItem = document.getElementById('menuReportItem');
    const blockItem = document.getElementById('menuBlockItem');
    const deleteItem = document.getElementById('menuDeleteItem');
    
    if (followItem) followItem.style.display = isOwn ? 'none' : 'flex';
    if (muteItem) muteItem.style.display = isOwn ? 'none' : 'flex';
    if (reportItem) reportItem.style.display = isOwn ? 'none' : 'flex';
    if (blockItem) blockItem.style.display = isOwn ? 'none' : 'flex';
    if (deleteItem) deleteItem.style.display = isOwn ? 'flex' : 'none';
    
    if (!isOwn) {
        document.getElementById('menuFollowText').innerText = 'Follow ' + username;
        document.getElementById('menuMuteText').innerText = 'Mute ' + username;
    }
    
    if (menuSheet) menuSheet.show();
};

window.handleMenuAction = function(action) {
    if (menuSheet) menuSheet.hide();
    
    switch(action) {
        case 'copyLink':
            navigator.clipboard.writeText(window.location.origin + '/post/' + currentPostId)
                .then(() => showToast('Link Copied'))
                .catch(() => showToast('Failed'));
            break;
            
        case 'share':
            if (navigator.share) {
navigator.share({ url: window.location.origin + '/post/' + currentPostId });
            } else {
handleMenuAction('copyLink');
            }
            break;
            
        case 'notInterested':
  showToast('We\'ll show less of this');
const post = document.querySelector(`[data-post-id="${currentPostId}"]`);
            if (post) {
                post.style.opacity = '0';
setTimeout(() => post.remove(), 300);
            }
            break;
            
        case 'follow':
            showToast('Following ' + currentPostUsername);
            break;
            
        case 'mute':
            showToast(currentPostUsername + ' muted');
            break;
            
        case 'report':
            if (confirm('Report this post?')) {
                showToast('Post Reported');
            }
            break;
            
        case 'block':
            if (confirm('Block ' + currentPostUsername + '?')) {
        showToast(currentPostUsername + ' blocked');
  document.querySelectorAll(`[data-user-id="${currentPostUserId}"]`).forEach(p => {
          p.style.opacity = '0';
setTimeout(() => p.remove(), 300);
                }); }
            break;
            
        case 'delete':
      if (confirm('Delete this post?')) {
  firebase.firestore().collection('posts').doc(currentPostId).delete()
              .then(() => {
showToast('Post Deleted');
const post = document.querySelector(`[data-post-id="${currentPostId}"]`);
                        if (post) {
 post.style.opacity = '0';
setTimeout(() => post.remove(), 300); } })
.catch(() => showToast('Failed to delete'));  }
  break; } };

// === ACTION BUTTON HANDLERS ===
document.addEventListener('click', function(e) {
    const btn = e.target.closest('.post-action-button');
    if (!btn) return;
    
    const action = btn.getAttribute('data-action');
    const postId = btn.getAttribute('data-post-id');
    
if (action === 'like') {
    likePost(postId, btn);
    } else if (action === 'save') {
        savePost(postId, btn);
    } else if (action === 'comment') {
        showToast('Comments coming soon');
    } else if (action === 'share') {
        if (navigator.share) {
navigator.share({
title: 'Study Social Post',
url: window.location.origin + '/post/' + postId }); } 
else {
navigator.clipboard.writeText(window.location.origin + '/post/' + postId)
    .then(() => showToast('Link copied')); } } });

// === SCROLL HANDLER ===
function handleFeedScroll() {
    const mainContent = document.getElementById('mainContent');
    if (mainContent && mainContent.scrollTop + mainContent.clientHeight >= mainContent.scrollHeight * 0.8) {
        loadFeed(true);  } }

// === UTILITY FUNCTIONS ===
function showToast(message) {
    const toastBody = document.getElementById('toastMessage');
    if (toastBody) toastBody.innerText = message;
    if (toast) toast.show(); }

function formatTime(timestamp) {
    if (!timestamp) return 'Just now';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    
    if (diff < 60) return 'Just now';
    if (diff < 3600) return Math.floor(diff / 60) + 'm';
    if (diff < 86400) return Math.floor(diff / 3600) + 'h';
    if (diff < 604800) return Math.floor(diff / 86400) + 'd';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatCount(count) {
    if (count >= 1000000) return (count / 1000000).toFixed(1) + 'M';
    if (count >= 1000) return (count / 1000).toFixed(1) + 'k';
    return count;
}

function createFeedSkeleton(count = 3) {
    let skeletons = '';
  for (let i = 0; i < count; i++) {
    skeletons += `
<div class="post-card-skeleton">
<div style="display: flex; gap: 1rem; margin-bottom: 1rem;">
<div class="skeleton skeleton-avatar"></div>
<div style="flex: 1;">
<div class="skeleton skeleton-text short"></div>
<div class="skeleton skeleton-text" style="width: 30%;"></div>
</div>
</div>
<div class="skeleton skeleton-image"></div>
</div>`; }

return skeletons;
}

function createEmptyFeedState() {
    return `
<div class="empty-feed">
<i class="fas fa-stream"></i>
<h4>No posts yet</h4>
<p>Be the first to create a post!</p>
</div>`;
}

// === EXPORTS ===
window.loadFeed = loadFeed;
window.postsFunctions = {
    initializePosts,
    loadFeed,
    renderFeed,
    createPostElement,
    likePost,
    savePost
};

// === AUTO INITIALIZE ===
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePosts);
} else {
    initializePosts();
}

console.log('Posts.js loaded successfully');