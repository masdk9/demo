
/* ========================================
   SEARCH.JS - Search Section Logic
   ======================================== */

// Search state
let searchQuery = '';
let searchResults = {
    users: [],
    posts: [],
    topics: []
};
let recentSearches = [];
let isSearching = false;

// Initialize Search
function initializeSearch() {
    // Load recent searches
    loadRecentSearches();
    
    // Initialize search input
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        // Debounce search input
        let searchTimeout;
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            const query = this.value.trim();
            
            if (query.length > 0) {
                searchTimeout = setTimeout(() => {
                    performSearch(query);
                }, 500);
            } else {
                clearSearchResults();
                showRecentSearches();
            }
        });
        
        // Handle Enter key
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const query = this.value.trim();
                if (query.length > 0) {
                    performSearch(query);
                }
            }
        });
    }
    
    // Initialize clear recent button
    const clearRecentBtn = document.querySelector('.clear-recent-btn');
    if (clearRecentBtn) {
        clearRecentBtn.addEventListener('click', clearRecentSearches);
    }
    
    // Show recent searches by default
    showRecentSearches();
    
    console.log('Search initialized');
}

// Load Recent Searches
function loadRecentSearches() {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
        recentSearches = JSON.parse(saved);
    }
}

// Save Recent Searches
function saveRecentSearches() {
    // Keep only last 10 searches
    if (recentSearches.length > 10) {
        recentSearches = recentSearches.slice(0, 10);
    }
    localStorage.setItem('recentSearches', JSON.stringify(recentSearches));
}

// Add to Recent Searches
function addToRecentSearches(query) {
    // Remove if already exists
    recentSearches = recentSearches.filter(q => q !== query);
    
    // Add to beginning
    recentSearches.unshift(query);
    
    // Save
    saveRecentSearches();
}

// Show Recent Searches
function showRecentSearches() {
    const searchResults = document.querySelector('.search-results');
    if (!searchResults) return;
    
    if (recentSearches.length === 0) {
        searchResults.innerHTML = `
            <div class="search-empty-state">
                <i class="fas fa-search"></i>
                <h5>Start Searching</h5>
                <p>Search for users, posts, and topics</p>
            </div>
        `;
        return;
    }
    
    let html = `
        <div class="recent-searches">
            <h6>
                Recent Searches
                <button class="clear-recent-btn">Clear All</button>
            </h6>
    `;
    
    recentSearches.forEach(query => {
        html += `
            <div class="recent-search-item" data-query="${query}">
                <div class="recent-search-content">
                    <i class="fas fa-history"></i>
                    <span>${query}</span>
                </div>
                <button class="remove-recent-btn" data-query="${query}">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
    });
    
    html += '</div>';
    searchResults.innerHTML = html;
    
    // Attach event listeners
    attachRecentSearchListeners();
}

// Attach Recent Search Listeners
function attachRecentSearchListeners() {
    // Recent search item click
    const recentItems = document.querySelectorAll('.recent-search-item');
    recentItems.forEach(item => {
        item.addEventListener('click', function(e) {
            if (!e.target.closest('.remove-recent-btn')) {
                const query = this.getAttribute('data-query');
                const searchInput = document.getElementById('searchInput');
                if (searchInput) {
                    searchInput.value = query;
                    performSearch(query);
                }
            }
        });
    });
    
    // Remove buttons
    const removeButtons = document.querySelectorAll('.remove-recent-btn');
    removeButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const query = this.getAttribute('data-query');
            removeRecentSearch(query);
        });
    });
    
    // Clear all button
    const clearBtn = document.querySelector('.clear-recent-btn');
    if (clearBtn) {
        clearBtn.addEventListener('click', clearRecentSearches);
    }
}

// Remove Recent Search
function removeRecentSearch(query) {
    recentSearches = recentSearches.filter(q => q !== query);
    saveRecentSearches();
    showRecentSearches();
}

// Clear Recent Searches
function clearRecentSearches() {
    const confirm = window.confirm('Clear all recent searches?');
    if (confirm) {
        recentSearches = [];
        saveRecentSearches();
        showRecentSearches();
    }
}

// Perform Search
async function performSearch(query) {
    if (isSearching) return;
    
    searchQuery = query;
    isSearching = true;
    
    const searchResults = document.querySelector('.search-results');
    if (!searchResults) return;
    
    // Show loading state
    searchResults.innerHTML = `
        <div class="search-loading">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Searching...</span>
            </div>
            <p class="mt-2">Searching...</p>
        </div>
    `;
    
    try {
        // Add to recent searches
        addToRecentSearches(query);
        
        // Search in Firebase
        const results = await searchFirebase(query);
        
        // Display results
        displaySearchResults(results);
        
    } catch (error) {
        console.error('Search error:', error);
        searchResults.innerHTML = `
            <div class="search-empty-state">
                <i class="fas fa-exclamation-circle"></i>
                <h5>Search Error</h5>
                <p>Something went wrong. Please try again.</p>
            </div>
        `;
    } finally {
        isSearching = false;
    }
}

// Search Firebase
async function searchFirebase(query) {
    const results = {
        users: [],
        posts: [],
        topics: []
    };
    
    try {
        if (window.firebaseConfig) {
            // Search users
            const usersSnapshot = await window.firebaseConfig.usersCollection
                .where('displayName', '>=', query)
                .where('displayName', '<=', query + '\uf8ff')
                .limit(5)
                .get();
            
            usersSnapshot.forEach(doc => {
                results.users.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            // Search posts (by content)
            const postsSnapshot = await window.firebaseConfig.postsCollection
                .where('content', '>=', query)
                .where('content', '<=', query + '\uf8ff')
                .limit(5)
                .get();
            
            postsSnapshot.forEach(doc => {
                results.posts.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
        }
    } catch (error) {
        console.error('Firebase search error:', error);
    }
    
    // If no results from Firebase, show dummy data
    if (results.users.length === 0 && results.posts.length === 0) {
        results.users = [
            {
                id: '1',
                displayName: 'Rahul Verma',
                username: '@rahul_ssc',
                followers: 1200
            },
            {
                id: '2',
                displayName: 'Amit Kumar',
                username: '@amit_webdev',
                followers: 300
            }
        ];
        
        results.topics = [
            {
                id: '1',
                name: 'Modern History',
                posts: 245
            },
            {
                id: '2',
                name: 'Physics',
                posts: 892
            }
        ];
    }
    
    return results;
}

// Display Search Results
function displaySearchResults(results) {
    const searchResultsDiv = document.querySelector('.search-results');
    if (!searchResultsDiv) return;
    
    let html = '';
    
    // Check if no results
    if (results.users.length === 0 && results.posts.length === 0 && results.topics.length === 0) {
        html = `
            <div class="search-empty-state">
                <i class="fas fa-search"></i>
                <h5>No Results Found</h5>
                <p>Try searching with different keywords</p>
            </div>
        `;
        searchResultsDiv.innerHTML = html;
        return;
    }
    
    // Users
    if (results.users.length > 0) {
        html += `
            <div class="search-category">
                <h6>Users</h6>
        `;
        
        results.users.forEach(user => {
            html += createUserResultItem(user);
        });
        
        html += '</div>';
    }
    
    // Topics
    if (results.topics.length > 0) {
        html += `
            <div class="search-category">
                <h6>Topics</h6>
        `;
        
        results.topics.forEach(topic => {
            html += createTopicResultItem(topic);
        });
        
        html += '</div>';
    }
    
    // Posts
    if (results.posts.length > 0) {
        html += `
            <div class="search-category">
                <h6>Posts</h6>
        `;
        
        results.posts.forEach(post => {
            html += createPostResultItem(post);
        });
        
        html += '</div>';
    }
    
    searchResultsDiv.innerHTML = html;
    
    // Attach event listeners
    attachSearchResultListeners();
}

// Create User Result Item
function createUserResultItem(user) {
    return `
        <div class="search-item" data-user-id="${user.id}">
            <div class="search-item-icon">
                <i class="fas fa-user-circle"></i>
            </div>
            <div class="search-item-content">
                <p class="search-item-title">${user.displayName || 'User'}</p>
                <p class="search-item-subtitle">${user.username || '@user'}</p>
            </div>
            <div class="search-item-action">
                <button class="follow-btn" data-user-id="${user.id}">Follow</button>
            </div>
        </div>
    `;
}

// Create Topic Result Item
function createTopicResultItem(topic) {
    return `
        <div class="search-item" data-topic-id="${topic.id}">
            <div class="search-item-icon">
                <i class="fas fa-hashtag"></i>
            </div>
            <div class="search-item-content">
                <p class="search-item-title">${topic.name}</p>
                <p class="search-item-subtitle">${topic.posts || 0} posts</p>
            </div>
        </div>
    `;
}

// Create Post Result Item
function createPostResultItem(post) {
    return `
        <div class="search-item" data-post-id="${post.id}">
            <div class="search-item-icon">
                <i class="fas fa-file-alt"></i>
            </div>
            <div class="search-item-content">
                <p class="search-item-title">${truncateText(post.content || post.question || 'Post', 50)}</p>
                <p class="search-item-subtitle">by ${post.authorName || 'User'}</p>
            </div>
        </div>
    `;
}

// Attach Search Result Listeners
function attachSearchResultListeners() {
    // User items
    const userItems = document.querySelectorAll('.search-item[data-user-id]');
    userItems.forEach(item => {
        item.addEventListener('click', function(e) {
            if (!e.target.closest('.follow-btn')) {
                const userId = this.getAttribute('data-user-id');
                viewUserProfile(userId);
            }
        });
    });
    
    // Follow buttons
    const followButtons = document.querySelectorAll('.follow-btn');
    followButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const userId = this.getAttribute('data-user-id');
            toggleFollow(userId, this);
        });
    });
    
    // Topic items
    const topicItems = document.querySelectorAll('.search-item[data-topic-id]');
    topicItems.forEach(item => {
        item.addEventListener('click', function() {
            const topicId = this.getAttribute('data-topic-id');
            viewTopic(topicId);
        });
    });
    
    // Post items
    const postItems = document.querySelectorAll('.search-item[data-post-id]');
    postItems.forEach(item => {
        item.addEventListener('click', function() {
            const postId = this.getAttribute('data-post-id');
            viewPost(postId);
        });
    });
}

// Toggle Follow
async function toggleFollow(userId, button) {
    const isFollowing = button.classList.contains('following');
    
    try {
        if (isFollowing) {
            // Unfollow
            if (window.profileFunctions && window.profileFunctions.unfollowUser) {
                await window.profileFunctions.unfollowUser(userId);
            }
            button.classList.remove('following');
            button.textContent = 'Follow';
        } else {
            // Follow
            if (window.profileFunctions && window.profileFunctions.followUser) {
                await window.profileFunctions.followUser(userId);
            }
            button.classList.add('following');
            button.textContent = 'Following';
        }
    } catch (error) {
        console.error('Error toggling follow:', error);
    }
}

// View User Profile
function viewUserProfile(userId) {
    console.log('View user profile:', userId);
    
    if (window.mainApp && window.mainApp.showToast) {
        window.mainApp.showToast('User profile coming soon!', 'info');
    }
    
    // TODO: Navigate to user profile
}

// View Topic
function viewTopic(topicId) {
    console.log('View topic:', topicId);
    
    if (window.mainApp && window.mainApp.showToast) {
        window.mainApp.showToast('Topic page coming soon!', 'info');
    }
    
    // TODO: Navigate to topic feed
}

// View Post
function viewPost(postId) {
    console.log('View post:', postId);
    
    if (window.mainApp && window.mainApp.showToast) {
        window.mainApp.showToast('Post details coming soon!', 'info');
    }
    
    // TODO: Navigate to post details
}

// Clear Search Results
function clearSearchResults() {
    const searchResultsDiv = document.querySelector('.search-results');
    if (searchResultsDiv) {
        searchResultsDiv.innerHTML = '';
    }
}

// Truncate Text
function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

// Search Filters (for future use)
function applySearchFilter(filterType) {
    console.log('Apply filter:', filterType);
    
    // TODO: Implement filtering
}

// Search Suggestions (for future use)
function getSearchSuggestions(query) {
    // TODO: Implement autocomplete suggestions
    return [];
}

// Trending Searches (for future use)
function getTrendingSearches() {
    // TODO: Get trending searches from Firebase
    return [
        { query: 'Modern History', count: 1234 },
        { query: 'Physics', count: 892 },
        { query: 'SSC Preparation', count: 756 }
    ];
}

// Export functions
window.searchFunctions = {
    initializeSearch,
    performSearch,
    clearSearchResults,
    clearRecentSearches,
    viewUserProfile,
    viewTopic,
    viewPost,
    getTrendingSearches
};

// Auto initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSearch);
} else {
    initializeSearch();
}

console.log('Search.js loaded successfully');
