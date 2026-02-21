
/* ====== CREATION.JS ===== */

// === GLOBAL STATE ===
let currentPostType = 'text';
let selectedBackgroundColor = '#ffffff';
let selectedMediaFile = null;
let currentDraftId = null; // For editing existing draft

// === INITIALIZATION ===
function initializeCreation() {
    console.log('Initializing creation...');
    
    // Post type buttons
    const postTypeButtons = document.querySelectorAll('.post-type-btn');
    postTypeButtons.forEach(button => {
        button.addEventListener('click', function() {
            const type = this.getAttribute('data-type');
            switchPostType(type);
        });
    });
    
    // Background color selector
    const colorOptions = document.querySelectorAll('.color-option');
    colorOptions.forEach(option => {
        option.addEventListener('click', function() {
            const color = this.getAttribute('data-color');
            selectBackgroundColor(color, this);
        });
    });
    
    // Media upload
    const uploadArea = document.querySelector('.upload-area');
    const mediaUpload = document.getElementById('mediaUpload');
    
    if (uploadArea && mediaUpload) {
        uploadArea.addEventListener('click', () => {
            mediaUpload.click();
        });
        
        mediaUpload.addEventListener('change', handleMediaUpload);
    }
    
    // Save Draft button
    const saveDraftBtn = document.getElementById('saveDraftBtn');
    if (saveDraftBtn) {
        saveDraftBtn.addEventListener('click', handleSaveDraft);
    }
    
    // View Drafts button
    const viewDraftsBtn = document.getElementById('viewDraftsBtn');
    if (viewDraftsBtn) {
        viewDraftsBtn.addEventListener('click', toggleDraftList);
    }
    
    // Publish button
    const publishBtn = document.getElementById('publishPostBtn');
    if (publishBtn) {
        publishBtn.addEventListener('click', handlePublishPost);
    }
    
    // Auto-save on modal close
    const modal = document.getElementById('createPostModal');
    if (modal) {
        modal.addEventListener('hidden.bs.modal', handleModalClose);
    }
    
    console.log('Creation initialized successfully');
}

// === POST TYPE SWITCHING ===
function switchPostType(type) {
    currentPostType = type;
    
    // Update buttons
    const postTypeButtons = document.querySelectorAll('.post-type-btn');
    postTypeButtons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-type') === type) {
            btn.classList.add('active');
        }
    });
    
    // Hide all forms
    const forms = document.querySelectorAll('.post-form');
    forms.forEach(form => form.classList.remove('active'));
    
    // Show selected form
    const formMap = {
        'text': 'textPostForm',
        'quiz': 'quizPostForm',
        'poll': 'pollPostForm',
        'card': 'cardPostForm',
        'media': 'mediaPostForm'
    };
    
    const formId = formMap[type];
    const form = document.getElementById(formId);
    if (form) {
        form.classList.add('active');
    }
}

// === BACKGROUND COLOR ===
function selectBackgroundColor(color, element) {
    selectedBackgroundColor = color;
    
    const colorOptions = document.querySelectorAll('.color-option');
    colorOptions.forEach(opt => opt.classList.remove('active'));
    element.classList.add('active');
}

// === MEDIA UPLOAD (FIXED) ===
function handleMediaUpload(event) {
    const file = event.target.files[0];
    
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        alert('File size should be less than 5MB');
        return;
    }
    
    selectedMediaFile = file;
    
    // Show preview
    const reader = new FileReader();
    reader.onload = function(e) {
        showMediaPreview(e.target.result);
    };
    reader.readAsDataURL(file);
}

function showMediaPreview(imageSrc) {
    const uploadArea = document.querySelector('.upload-area');
    
    if (uploadArea) {
        uploadArea.innerHTML = `
            <div class="image-preview show">
                <img src="${imageSrc}" alt="Preview">
                <button class="remove-image-btn" onclick="removeMediaPreview()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        uploadArea.classList.add('active');
    }
}

window.removeMediaPreview = function() {
    selectedMediaFile = null;
    const uploadArea = document.querySelector('.upload-area');
    
    if (uploadArea) {
        uploadArea.innerHTML = `
            <i class="fas fa-cloud-upload-alt fa-3x text-muted mb-3"></i>
            <p>Tap to Upload Photo</p>
            <input type="file" class="d-none" id="mediaUpload" accept="image/*">
        `;
        uploadArea.classList.remove('active');
    }
    
    // Re-attach event listener
    const newMediaUpload = document.getElementById('mediaUpload');
    if (newMediaUpload) {
        newMediaUpload.addEventListener('change', handleMediaUpload);
    }
    
    // Re-attach click listener to upload area
    const newUploadArea = document.querySelector('.upload-area');
    if (newUploadArea) {
        newUploadArea.addEventListener('click', () => {
            newMediaUpload.click();
        });
    }
};

// === PUBLISH POST (WITH PHOTO FIX) ===
async function handlePublishPost() {
    const publishBtn = document.getElementById('publishPostBtn');
    
    try {
        // Validate and get post data
        const postData = await validateAndGetPostData();
        
        if (!postData) return;
        
        // Show loading state
        setPublishButtonLoading(publishBtn, true);
        
        // Save to Firebase
        if (window.firebaseConfig && window.firebaseConfig.postsCollection) {
            const userId = window.firebaseConfig.getCurrentUserId();
            const userData = window.currentUserData;
            
            // Upload media if exists (FIXED LOGIC)
            let imageUrl = null;
            if (selectedMediaFile) {
                try {
                    const path = `posts/${userId}/${Date.now()}_${selectedMediaFile.name}`;
                    imageUrl = await window.firebaseConfig.uploadFile(selectedMediaFile, path);
                    console.log('Image uploaded successfully:', imageUrl);
                } catch (uploadError) {
                    console.error('Image upload failed:', uploadError);
                    alert('Failed to upload image. Please try again.');
                    setPublishButtonLoading(publishBtn, false);
                    return;
                }
            }
            
            // Create post document
            const post = {
                ...postData,
                userId: userId,
                authorName: userData?.displayName || 'User',
                authorUsername: userData?.username || '@user',
                authorPic: userData?.photoURL || null,
                imageUrl: imageUrl,
                likes: 0,
                comments: 0,
                shares: 0,
                views: 0,
                save: 0,
                createdAt: window.firebaseConfig.getTimestamp(),
                updatedAt: window.firebaseConfig.getTimestamp()
            };
            
            await window.firebaseConfig.postsCollection.add(post);
            
            // Show success message
            showToast('Post published successfully!');
            
            // Delete draft if editing
            if (currentDraftId) {
                deleteDraft(currentDraftId);
                currentDraftId = null;
            }
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('createPostModal'));
            if (modal) {
                modal.hide();
            }
            
            // Reload feed
            if (window.loadFeed) {
                window.loadFeed();
            }
            
            // Reset form
            resetCreationForm();
        } else {
            throw new Error('Firebase not initialized');
        }
    } catch (error) {
        console.error('Error publishing post:', error);
        showToast('Error publishing post. Please try again.');
    } finally {
        setPublishButtonLoading(publishBtn, false);
    }
}

// === VALIDATE AND GET POST DATA ===
async function validateAndGetPostData() {
    let postData = {
        type: currentPostType
    };
    
    switch(currentPostType) {
        case 'text':
            const textContent = document.getElementById('textPostContent')?.value.trim();
            
            if (!textContent) {
                alert('Please enter some text');
                return null;
            }
            
            postData.content = textContent;
            postData.backgroundColor = selectedBackgroundColor;
            break;
            
        case 'quiz':
            const quizQuestion = document.getElementById('quizQuestion')?.value.trim();
            const optionA = document.getElementById('quizOptionA')?.value.trim();
            const optionB = document.getElementById('quizOptionB')?.value.trim();
            const optionC = document.getElementById('quizOptionC')?.value.trim();
            const optionD = document.getElementById('quizOptionD')?.value.trim();
            const quizExplanation = document.getElementById('quizExplanation')?.value.trim();
            const correctOption = document.querySelector('input[name="correctOption"]:checked');
            
            if (!quizQuestion) {
                alert('Please enter a question');
                return null;
            }
            
            if (!optionA || !optionB || !optionC || !optionD) {
                alert('Please fill in all options');
                return null;
            }
            
            if (!correctOption) {
                alert('Please select the correct option');
                return null;
            }
            
            postData.question = quizQuestion;
            postData.options = [optionA, optionB, optionC, optionD];
            postData.correctOption = parseInt(correctOption.value);
            postData.explanation = quizExplanation || 'No explanation provided.';
            break;
            
        case 'poll':
            const pollQuestion = document.getElementById('pollQuestion')?.value.trim();
            const pollExplanation = document.getElementById('pollExplanation')?.value.trim();
            const pollCorrect = document.querySelector('input[name="pollCorrect"]:checked');
            
            if (!pollQuestion) {
                alert('Please enter a poll question');
                return null;
            }
            
            if (!pollCorrect) {
                alert('Please select the correct answer');
                return null;
            }
            
            postData.question = pollQuestion;
            postData.correctAnswer = pollCorrect.value;
            postData.explanation = pollExplanation || 'No explanation provided.';
            break;
            
        case 'card':
            const cardFront = document.getElementById('cardFront')?.value.trim();
            const cardBack = document.getElementById('cardBack')?.value.trim();
            
            if (!cardFront) {
                alert('Please enter the front side content');
                return null;
            }
            
            if (!cardBack) {
                alert('Please enter the back side content');
                return null;
            }
            
            postData.front = cardFront;
            postData.back = cardBack;
            break;
            
        case 'media':
            const mediaCaption = document.getElementById('mediaCaption')?.value.trim();
            
            if (!selectedMediaFile) {
                alert('Please select an image');
                return null;
            }
            
            postData.caption = mediaCaption || '';
            break;
            
        default:
            alert('Invalid post type');
            return null;
    }
    
    return postData;
}

// === DRAFT SYSTEM ===

// Save Draft
async function handleSaveDraft() {
    try {
        const postData = await getPostDataWithoutValidation();
        
        if (!postData || isPostEmpty(postData)) {
            showToast('Nothing to save');
            return;
        }
        
        const drafts = JSON.parse(localStorage.getItem('postDrafts') || '[]');
        
        const draft = {
            id: currentDraftId || Date.now().toString(),
            ...postData,
            savedAt: new Date().toISOString()
        };
        
        if (currentDraftId) {
            // Update existing draft
            const index = drafts.findIndex(d => d.id === currentDraftId);
            if (index !== -1) {
                drafts[index] = draft;
            }
        } else {
            // Add new draft
            drafts.push(draft);
        }
        
        localStorage.setItem('postDrafts', JSON.stringify(drafts));
        currentDraftId = draft.id;
        
        showToast('Draft saved!');
    } catch (error) {
        console.error('Error saving draft:', error);
        showToast('Failed to save draft');
    }
}

// Get post data without validation (for drafts)
async function getPostDataWithoutValidation() {
    let postData = {
        type: currentPostType
    };
    
    switch(currentPostType) {
        case 'text':
            const textContent = document.getElementById('textPostContent')?.value.trim();
            if (textContent) {
                postData.content = textContent;
                postData.backgroundColor = selectedBackgroundColor;
            }
            break;
            
        case 'quiz':
            const quizQuestion = document.getElementById('quizQuestion')?.value.trim();
            const optionA = document.getElementById('quizOptionA')?.value.trim();
            const optionB = document.getElementById('quizOptionB')?.value.trim();
            const optionC = document.getElementById('quizOptionC')?.value.trim();
            const optionD = document.getElementById('quizOptionD')?.value.trim();
            const quizExplanation = document.getElementById('quizExplanation')?.value.trim();
            const correctOption = document.querySelector('input[name="correctOption"]:checked');
            
            if (quizQuestion) {
                postData.question = quizQuestion;
                postData.options = [optionA, optionB, optionC, optionD].filter(Boolean);
                postData.correctOption = correctOption ? parseInt(correctOption.value) : null;
                postData.explanation = quizExplanation || '';
            }
            break;
            
        case 'poll':
            const pollQuestion = document.getElementById('pollQuestion')?.value.trim();
            const pollExplanation = document.getElementById('pollExplanation')?.value.trim();
            const pollCorrect = document.querySelector('input[name="pollCorrect"]:checked');
            
            if (pollQuestion) {
                postData.question = pollQuestion;
                postData.correctAnswer = pollCorrect ? pollCorrect.value : null;
                postData.explanation = pollExplanation || '';
            }
            break;
            
        case 'card':
            const cardFront = document.getElementById('cardFront')?.value.trim();
            const cardBack = document.getElementById('cardBack')?.value.trim();
            
            if (cardFront || cardBack) {
                postData.front = cardFront || '';
                postData.back = cardBack || '';
            }
            break;
            
        case 'media':
            const mediaCaption = document.getElementById('mediaCaption')?.value.trim();
            if (mediaCaption || selectedMediaFile) {
                postData.caption = mediaCaption || '';
                postData.hasImage = !!selectedMediaFile;
            }
            break;
    }
    
    return postData;
}

// Check if post is empty
function isPostEmpty(postData) {
    switch(postData.type) {
        case 'text':
            return !postData.content;
        case 'quiz':
            return !postData.question;
        case 'poll':
            return !postData.question;
        case 'card':
            return !postData.front && !postData.back;
        case 'media':
            return !postData.caption && !postData.hasImage;
        default:
            return true;
    }
}

// Toggle Draft List
function toggleDraftList() {
    const draftSection = document.getElementById('draftListSection');
    const formSection = document.getElementById('postCreationForm');
    
    if (draftSection.style.display === 'none') {
        // Show drafts
        draftSection.style.display = 'block';
        formSection.style.display = 'none';
        loadDraftsList();
    } else {
        // Hide drafts
        draftSection.style.display = 'none';
        formSection.style.display = 'block';
    }
}

window.closeDraftList = function() {
    const draftSection = document.getElementById('draftListSection');
    const formSection = document.getElementById('postCreationForm');
    
    draftSection.style.display = 'none';
    formSection.style.display = 'block';
};

// Load Drafts List
function loadDraftsList() {
    const container = document.getElementById('draftListContainer');
    const drafts = JSON.parse(localStorage.getItem('postDrafts') || '[]');
    
    if (drafts.length === 0) {
        container.innerHTML = `
            <div class="empty-drafts">
                <i class="fas fa-inbox"></i>
                <p>No drafts saved yet</p>
            </div>
        `;
        return;
    }
    
    // Sort by newest first
    drafts.sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt));
    
    container.innerHTML = drafts.map(draft => createDraftCard(draft)).join('');
}

// Create Draft Card HTML
function createDraftCard(draft) {
    const typeIcons = {
        'text': 'fa-pencil-alt',
        'quiz': 'fa-list',
        'poll': 'fa-poll',
        'card': 'fa-id-card',
        'media': 'fa-image'
    };
    
    const typeLabels = {
        'text': 'Text',
        'quiz': 'Quiz',
        'poll': 'Poll',
        'card': 'Card',
        'media': 'Media'
    };
    
    const icon = typeIcons[draft.type] || 'fa-file';
    const label = typeLabels[draft.type] || 'Draft';
    
    // Get preview text
    let previewText = '';
    switch(draft.type) {
        case 'text':
            previewText = draft.content || 'No content';
            break;
        case 'quiz':
        case 'poll':
            previewText = draft.question || 'No question';
            break;
        case 'card':
            previewText = draft.front || 'No content';
            break;
        case 'media':
            previewText = draft.caption || 'No caption';
            break;
    }
    
    const timeAgo = getTimeAgo(draft.savedAt);
    
    return `
        <div class="draft-card" onclick="loadDraft('${draft.id}')">
            <div class="draft-card-header">
                <span class="draft-type-badge">
                    <i class="fas ${icon}"></i>
                    ${label}
                </span>
                <span class="draft-time">${timeAgo}</span>
            </div>
            <div class="draft-content">
                <div class="draft-preview">${previewText}</div>
            </div>
            <div class="draft-actions" onclick="event.stopPropagation()">
                <button class="draft-action-btn" onclick="loadDraft('${draft.id}')">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="draft-action-btn delete-btn" onclick="deleteDraftConfirm('${draft.id}')">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
    `;
}

// Load Draft
window.loadDraft = function(draftId) {
    const drafts = JSON.parse(localStorage.getItem('postDrafts') || '[]');
    const draft = drafts.find(d => d.id === draftId);
    
    if (!draft) {
        showToast('Draft not found');
        return;
    }
    
    // Set current draft ID
    currentDraftId = draftId;
    
    // Switch to correct post type
    switchPostType(draft.type);
    
    // Fill in form fields
    switch(draft.type) {
        case 'text':
            document.getElementById('textPostContent').value = draft.content || '';
            if (draft.backgroundColor) {
                selectedBackgroundColor = draft.backgroundColor;
                const colorOption = document.querySelector(`.color-option[data-color="${draft.backgroundColor}"]`);
                if (colorOption) {
                    document.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('active'));
                    colorOption.classList.add('active');
                }
            }
            break;
            
        case 'quiz':
            document.getElementById('quizQuestion').value = draft.question || '';
            document.getElementById('quizOptionA').value = draft.options?.[0] || '';
            document.getElementById('quizOptionB').value = draft.options?.[1] || '';
            document.getElementById('quizOptionC').value = draft.options?.[2] || '';
            document.getElementById('quizOptionD').value = draft.options?.[3] || '';
            document.getElementById('quizExplanation').value = draft.explanation || '';
            if (draft.correctOption !== null) {
                const radio = document.querySelector(`input[name="correctOption"][value="${draft.correctOption}"]`);
                if (radio) radio.checked = true;
            }
            break;
            
        case 'poll':
            document.getElementById('pollQuestion').value = draft.question || '';
            document.getElementById('pollExplanation').value = draft.explanation || '';
            if (draft.correctAnswer) {
                const radio = document.getElementById(draft.correctAnswer === 'yes' ? 'pollYes' : 'pollNo');
                if (radio) radio.checked = true;
            }
            break;
            
        case 'card':
            document.getElementById('cardFront').value = draft.front || '';
            document.getElementById('cardBack').value = draft.back || '';
            break;
            
        case 'media':
            document.getElementById('mediaCaption').value = draft.caption || '';
            break;
    }
    
    // Close draft list
    closeDraftList();
    
    showToast('Draft loaded');
};

// Delete Draft with Confirmation
window.deleteDraftConfirm = function(draftId) {
    if (confirm('Are you sure you want to delete this draft?')) {
        deleteDraft(draftId);
        loadDraftsList();
        showToast('Draft deleted');
    }
};

// Delete Draft
function deleteDraft(draftId) {
    const drafts = JSON.parse(localStorage.getItem('postDrafts') || '[]');
    const filtered = drafts.filter(d => d.id !== draftId);
    localStorage.setItem('postDrafts', JSON.stringify(filtered));
}

// Auto-save on modal close
function handleModalClose() {
    // Don't auto-save if form is empty or if we just published
    const postData = getPostDataWithoutValidation();
    
    if (postData && !isPostEmpty(postData)) {
        // Auto-save without showing toast
        const drafts = JSON.parse(localStorage.getItem('postDrafts') || '[]');
        const draft = {
            id: currentDraftId || Date.now().toString(),
            ...postData,
            savedAt: new Date().toISOString()
        };
        
        if (currentDraftId) {
            const index = drafts.findIndex(d => d.id === currentDraftId);
            if (index !== -1) {
                drafts[index] = draft;
            }
        } else {
            drafts.push(draft);
        }
        
        localStorage.setItem('postDrafts', JSON.stringify(drafts));
    }
    
    // Reset form after a delay
    setTimeout(resetCreationForm, 300);
}

// === UTILITY FUNCTIONS ===

// Get Time Ago
function getTimeAgo(timestamp) {
    const now = new Date();
    const past = new Date(timestamp);
    const diff = Math.floor((now - past) / 1000); // seconds
    
    if (diff < 60) return 'Just now';
    if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
    if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
    if (diff < 604800) return Math.floor(diff / 86400) + 'd ago';
    return past.toLocaleDateString();
}

// Show Toast
function showToast(message) {
    const toastBody = document.getElementById('toastMessage');
    const toastEl = document.getElementById('actionToast');
    
    if (toastBody) toastBody.innerText = message;
    
    if (toastEl) {
        const toast = new bootstrap.Toast(toastEl, { delay: 2500 });
        toast.show();
    }
}

// Reset Creation Form
function resetCreationForm() {
    // Reset all input fields
    const textInputs = document.querySelectorAll('#createPostModal input[type="text"], #createPostModal textarea');
    textInputs.forEach(input => input.value = '');
    
    // Reset radio buttons
    const radioButtons = document.querySelectorAll('#createPostModal input[type="radio"]');
    radioButtons.forEach(radio => radio.checked = false);
    
    // Reset post type
    currentPostType = 'text';
    switchPostType('text');
    
    // Reset background color
    selectedBackgroundColor = '#ffffff';
    const colorOptions = document.querySelectorAll('.color-option');
    colorOptions.forEach(opt => opt.classList.remove('active'));
    const defaultColor = document.querySelector('.color-option[data-color="white"]');
    if (defaultColor) {
        defaultColor.classList.add('active');
    }
    
    // Reset media
    selectedMediaFile = null;
    removeMediaPreview();
    
    // Reset draft ID
    currentDraftId = null;
}

// Set Publish Button Loading
function setPublishButtonLoading(button, isLoading) {
    if (!button) return;
    
    if (isLoading) {
        button.disabled = true;
        button.classList.add('loading');
        button.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Publishing...';
    } else {
        button.disabled = false;
        button.classList.remove('loading');
        button.innerHTML = '<i class="fas fa-paper-plane me-2"></i>Post';
    }
}

// === EXPORTS ===
window.creationFunctions = {
    initializeCreation,
    switchPostType,
    handlePublishPost,
    handleSaveDraft,
    resetCreationForm,
    selectBackgroundColor,
    handleMediaUpload,
    removeMediaPreview,
    toggleDraftList,
    loadDraft,
    deleteDraft
};

// === AUTO INITIALIZE ===
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeCreation);
} else {
    initializeCreation();
}

console.log('Creation.js loaded successfully with draft system');
