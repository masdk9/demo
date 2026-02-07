
/* ========================================
   CREATION.JS - Post Creation Logic
   ======================================== */

// Creation state
let currentPostType = 'text';
let selectedBackgroundColor = '#ffffff';
let selectedMediaFile = null;

// Initialize Creation
function initializeCreation() {
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
    
    // Publish button
    const publishBtn = document.getElementById('publishPostBtn');
    if (publishBtn) {
        publishBtn.addEventListener('click', handlePublishPost);
    }
    
    console.log('Creation initialized');
}

// Switch Post Type
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

// Select Background Color
function selectBackgroundColor(color, element) {
    selectedBackgroundColor = color;
    
    // Update color options
    const colorOptions = document.querySelectorAll('.color-option');
    colorOptions.forEach(opt => opt.classList.remove('active'));
    element.classList.add('active');
}

// Handle Media Upload
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

// Show Media Preview
function showMediaPreview(imageSrc) {
    const uploadArea = document.querySelector('.upload-area');
    
    if (uploadArea) {
        uploadArea.innerHTML = `
            <div class="image-preview">
                <img src="${imageSrc}" alt="Preview">
                <button class="remove-image-btn" onclick="removeMediaPreview()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        uploadArea.classList.add('active');
    }
}

// Remove Media Preview
function removeMediaPreview() {
    selectedMediaFile = null;
    const uploadArea = document.querySelector('.upload-area');
    const mediaUpload = document.getElementById('mediaUpload');
    
    if (uploadArea) {
        uploadArea.innerHTML = `
            <i class="fas fa-cloud-upload-alt fa-3x text-muted mb-3"></i>
            <p>Tap to Upload Photo</p>
            <input type="file" class="d-none" id="mediaUpload" accept="image/*">
        `;
        uploadArea.classList.remove('active');
    }
    
    if (mediaUpload) {
        mediaUpload.value = '';
    }
    
    // Re-attach event listener
    const newUploadArea = document.querySelector('.upload-area');
    const newMediaUpload = document.getElementById('mediaUpload');
    
    if (newUploadArea && newMediaUpload) {
        newUploadArea.addEventListener('click', () => {
            newMediaUpload.click();
        });
        
        newMediaUpload.addEventListener('change', handleMediaUpload);
    }
}

// Handle Publish Post
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
            
            // Upload media if exists
            let imageUrl = null;
            if (selectedMediaFile) {
                const path = `posts/${userId}/${Date.now()}_${selectedMediaFile.name}`;
                imageUrl = await window.firebaseConfig.uploadFile(selectedMediaFile, path);
            }
            
            // Create post document
            const post = {
                ...postData,
                authorId: userId,
                authorName: userData?.displayName || 'User',
                authorUsername: userData?.username || '@user',
                authorPhotoURL: userData?.photoURL || null,
                imageUrl: imageUrl,
                likes: 0,
                comments: 0,
                shares: 0,
                createdAt: window.firebaseConfig.getTimestamp(),
                updatedAt: window.firebaseConfig.getTimestamp()
            };
            
            await window.firebaseConfig.postsCollection.add(post);
            
            // Update user post count
            await window.firebaseConfig.usersCollection.doc(userId).update({
                posts: firebase.firestore.FieldValue.increment(1)
            });
            
            // Show success message
            if (window.mainApp && window.mainApp.showToast) {
                window.mainApp.showToast('Post published successfully!', 'success');
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
        
        if (window.mainApp && window.mainApp.showToast) {
            window.mainApp.showToast('Error publishing post. Please try again.', 'error');
        }
    } finally {
        setPublishButtonLoading(publishBtn, false);
    }
}

// Validate and Get Post Data
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
    const defaultColor = document.querySelector('.color-option[data-color="#ffffff"]');
    if (defaultColor) {
        defaultColor.classList.add('active');
    }
    
    // Reset media
    selectedMediaFile = null;
    removeMediaPreview();
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

// Character Counter (optional feature)
function updateCharacterCounter(inputElement, counterElement, maxLength) {
    const currentLength = inputElement.value.length;
    counterElement.textContent = `${currentLength}/${maxLength}`;
    
    if (currentLength > maxLength * 0.9) {
        counterElement.classList.add('warning');
    } else {
        counterElement.classList.remove('warning');
    }
    
    if (currentLength > maxLength) {
        counterElement.classList.add('error');
    } else {
        counterElement.classList.remove('error');
    }
}

// Add Option to Quiz (for dynamic options - future feature)
function addQuizOption() {
    // TODO: Add more than 4 options
    console.log('Add quiz option');
}

// Remove Quiz Option (for dynamic options - future feature)
function removeQuizOption(optionIndex) {
    // TODO: Remove option
    console.log('Remove quiz option:', optionIndex);
}

// Preview Post (optional feature)
function previewPost() {
    const postData = validateAndGetPostData();
    
    if (!postData) return;
    
    console.log('Preview post:', postData);
    
    // TODO: Show preview modal
}

// Save as Draft (future feature)
async function saveAsDraft() {
    const postData = await validateAndGetPostData();
    
    if (!postData) return;
    
    // Save to localStorage or Firebase
    const drafts = JSON.parse(localStorage.getItem('postDrafts') || '[]');
    drafts.push({
        ...postData,
        savedAt: new Date().toISOString()
    });
    localStorage.setItem('postDrafts', JSON.stringify(drafts));
    
    if (window.mainApp && window.mainApp.showToast) {
        window.mainApp.showToast('Draft saved!', 'success');
    }
}

// Load Draft (future feature)
function loadDraft(draftIndex) {
    const drafts = JSON.parse(localStorage.getItem('postDrafts') || '[]');
    
    if (drafts[draftIndex]) {
        const draft = drafts[draftIndex];
        
        // Populate form with draft data
        switchPostType(draft.type);
        
        // TODO: Fill in all fields based on draft data
        
        if (window.mainApp && window.mainApp.showToast) {
            window.mainApp.showToast('Draft loaded!', 'info');
        }
    }
}

// Export functions
window.creationFunctions = {
    initializeCreation,
    switchPostType,
    handlePublishPost,
    resetCreationForm,
    selectBackgroundColor,
    handleMediaUpload,
    removeMediaPreview,
    saveAsDraft,
    loadDraft,
    previewPost
};

// Auto initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeCreation);
} else {
    initializeCreation();
}

console.log('Creation.js loaded successfully');