
/* ========================================
   STUDY.JS - Study Section Logic
   ======================================== */

// Study state
let studyProgress = {
    totalStudyTime: 0,
    streak: 0,
    completedTopics: 0
};

// Initialize Study Section
function initializeStudy() {
    // Load study progress
    loadStudyProgress();
    
    // Initialize resource cards
    initializeResourceCards();
    
    // Initialize quiz cards
    initializeQuizCards();
    
    // Initialize exam cards
    initializeExamCards();
    
    console.log('Study section initialized');
}

// Load Study Progress
function loadStudyProgress() {
    // Load from localStorage
    const savedProgress = localStorage.getItem('studyProgress');
    
    if (savedProgress) {
        studyProgress = JSON.parse(savedProgress);
        renderStudyProgress();
    }
}

// Save Study Progress
function saveStudyProgress() {
    localStorage.setItem('studyProgress', JSON.stringify(studyProgress));
}

// Render Study Progress
function renderStudyProgress() {
    // Update streak display if exists
    const streakElement = document.querySelector('.streak-number');
    if (streakElement) {
        streakElement.textContent = studyProgress.streak;
    }
    
    // Update progress bar if exists
    const progressBar = document.querySelector('.progress-bar-fill');
    if (progressBar) {
        const progress = Math.min(100, (studyProgress.completedTopics / 50) * 100);
        progressBar.style.width = progress + '%';
    }
}

// Initialize Resource Cards
function initializeResourceCards() {
    const notesCard = document.getElementById('notesCard');
    const booksCard = document.getElementById('booksCard');
    const videosCard = document.getElementById('videosCard');
    const pyqCard = document.getElementById('pyqCard');
    
    if (notesCard) {
        notesCard.addEventListener('click', () => openNotes());
    }
    
    if (booksCard) {
        booksCard.addEventListener('click', () => openBooks());
    }
    
    if (videosCard) {
        videosCard.addEventListener('click', () => openVideos());
    }
    
    if (pyqCard) {
        pyqCard.addEventListener('click', () => openPYQ());
    }
}

// Open Notes
function openNotes() {
    if (window.mainApp && window.mainApp.showSection) {
        window.mainApp.showSection('notesSubPage');
    }
}

// Open Books
function openBooks() {
    console.log('Open Books');
    
    if (window.mainApp && window.mainApp.showToast) {
        window.mainApp.showToast('Books section coming soon!', 'info');
    }
}

// Open Videos
function openVideos() {
    console.log('Open Videos');
    
    if (window.mainApp && window.mainApp.showToast) {
        window.mainApp.showToast('Videos section coming soon!', 'info');
    }
}

// Open PYQ (Previous Year Questions)
function openPYQ() {
    console.log('Open PYQ');
    
    if (window.mainApp && window.mainApp.showToast) {
        window.mainApp.showToast('PYQ section coming soon!', 'info');
    }
}

// Initialize Quiz Cards
function initializeQuizCards() {
    const quizCards = document.querySelectorAll('.quiz-card');
    
    quizCards.forEach(card => {
        card.addEventListener('click', function() {
            const quizType = this.querySelector('h6')?.textContent.toLowerCase();
            openQuiz(quizType);
        });
    });
}

// Open Quiz
function openQuiz(quizType) {
    console.log('Open Quiz:', quizType);
    
    if (window.mainApp && window.mainApp.showToast) {
        window.mainApp.showToast(`${quizType} quiz coming soon!`, 'info');
    }
    
    // TODO: Navigate to quiz page/modal
}

// Initialize Exam Cards
function initializeExamCards() {
    const examCards = document.querySelectorAll('.exam-card');
    
    examCards.forEach(card => {
        card.addEventListener('click', function() {
            const examType = this.querySelector('h6')?.textContent;
            openExam(examType);
        });
    });
}

// Open Exam
function openExam(examType) {
    console.log('Open Exam:', examType);
    
    if (window.mainApp && window.mainApp.showToast) {
        window.mainApp.showToast(`${examType} section coming soon!`, 'info');
    }
    
    // TODO: Navigate to exam-specific page
}

// Download Note
async function downloadNote(noteId, noteUrl, noteName) {
    try {
        if (window.mainApp && window.mainApp.showToast) {
            window.mainApp.showToast('Downloading...', 'info');
        }
        
        // Open in new tab (browser will handle download)
        window.open(noteUrl, '_blank');
        
        // Track download
        trackNoteDownload(noteId);
        
        if (window.mainApp && window.mainApp.showToast) {
            setTimeout(() => {
                window.mainApp.showToast('Download started!', 'success');
            }, 500);
        }
    } catch (error) {
        console.error('Error downloading note:', error);
        
        if (window.mainApp && window.mainApp.showToast) {
            window.mainApp.showToast('Error downloading note', 'error');
        }
    }
}

// Track Note Download
function trackNoteDownload(noteId) {
    // Track in localStorage
    const downloads = JSON.parse(localStorage.getItem('noteDownloads') || '[]');
    downloads.push({
        noteId: noteId,
        downloadedAt: new Date().toISOString()
    });
    localStorage.setItem('noteDownloads', JSON.stringify(downloads));
    
    // TODO: Track in Firebase
}

// Start Study Session
function startStudySession(topic) {
    const startTime = Date.now();
    
    // Save session start
    sessionStorage.setItem('studySessionStart', startTime);
    sessionStorage.setItem('studySessionTopic', topic);
    
    if (window.mainApp && window.mainApp.showToast) {
        window.mainApp.showToast(`Study session started: ${topic}`, 'success');
    }
}

// End Study Session
function endStudySession() {
    const startTime = sessionStorage.getItem('studySessionStart');
    const topic = sessionStorage.getItem('studySessionTopic');
    
    if (!startTime) return;
    
    const endTime = Date.now();
    const duration = Math.floor((endTime - startTime) / 1000 / 60); // in minutes
    
    // Update total study time
    studyProgress.totalStudyTime += duration;
    saveStudyProgress();
    
    // Clear session
    sessionStorage.removeItem('studySessionStart');
    sessionStorage.removeItem('studySessionTopic');
    
    if (window.mainApp && window.mainApp.showToast) {
        window.mainApp.showToast(`Study session ended. Duration: ${duration} minutes`, 'success');
    }
    
    // TODO: Save session to Firebase
}

// Update Study Streak
function updateStudyStreak() {
    const lastStudyDate = localStorage.getItem('lastStudyDate');
    const today = new Date().toDateString();
    
    if (lastStudyDate === today) {
        // Already studied today
        return;
    }
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (lastStudyDate === yesterday.toDateString()) {
        // Consecutive day - increase streak
        studyProgress.streak++;
    } else {
        // Streak broken - reset to 1
        studyProgress.streak = 1;
    }
    
    localStorage.setItem('lastStudyDate', today);
    saveStudyProgress();
    renderStudyProgress();
}

// Mark Topic as Completed
function markTopicCompleted(topicId, topicName) {
    studyProgress.completedTopics++;
    saveStudyProgress();
    renderStudyProgress();
    
    if (window.mainApp && window.mainApp.showToast) {
        window.mainApp.showToast(`Topic completed: ${topicName}`, 'success');
    }
    
    // Update streak
    updateStudyStreak();
}

// Get Study Statistics
function getStudyStatistics() {
    return {
        totalTime: studyProgress.totalStudyTime,
        streak: studyProgress.streak,
        completedTopics: studyProgress.completedTopics,
        averagePerDay: Math.floor(studyProgress.totalStudyTime / Math.max(1, studyProgress.streak))
    };
}

// Load Notes from Firebase
async function loadNotes() {
    try {
        // TODO: Load notes from Firebase Storage or Firestore
        
        // For now, return dummy data
        return [
            {
                id: '1',
                name: 'SSC NOTES FEBRUARY',
                size: '25 MB',
                url: '#',
                category: 'SSC',
                uploadedAt: new Date()
            },
            {
                id: '2',
                name: 'SSC NOTES JANUARY',
                size: '25 MB',
                url: '#',
                category: 'SSC',
                uploadedAt: new Date()
            }
        ];
    } catch (error) {
        console.error('Error loading notes:', error);
        return [];
    }
}

// Upload Note (Admin/Teacher feature)
async function uploadNote(file, metadata) {
    try {
        if (!file) return;
        
        // Validate file
        if (file.type !== 'application/pdf') {
            alert('Only PDF files are allowed');
            return;
        }
        
        if (file.size > 50 * 1024 * 1024) {
            alert('File size should be less than 50MB');
            return;
        }
        
        // Upload to Firebase Storage
        if (window.firebaseConfig && window.firebaseConfig.uploadFile) {
            const path = `notes/${metadata.category}/${Date.now()}_${file.name}`;
            const url = await window.firebaseConfig.uploadFile(file, path);
            
            // Save metadata to Firestore
            await window.firebaseConfig.db.collection('notes').add({
                name: metadata.name,
                category: metadata.category,
                size: file.size,
                url: url,
                uploadedBy: window.firebaseConfig.getCurrentUserId(),
                uploadedAt: window.firebaseConfig.getTimestamp()
            });
            
            if (window.mainApp && window.mainApp.showToast) {
                window.mainApp.showToast('Note uploaded successfully!', 'success');
            }
        }
    } catch (error) {
        console.error('Error uploading note:', error);
        
        if (window.mainApp && window.mainApp.showToast) {
            window.mainApp.showToast('Error uploading note', 'error');
        }
    }
}

// Search Notes
function searchNotes(query) {
    // TODO: Implement note search
    console.log('Search notes:', query);
}

// Filter Notes by Category
function filterNotesByCategory(category) {
    // TODO: Implement category filter
    console.log('Filter by category:', category);
}

// Create Study Plan
function createStudyPlan(subjects, duration, targetDate) {
    // TODO: Create personalized study plan
    console.log('Create study plan:', { subjects, duration, targetDate });
    
    if (window.mainApp && window.mainApp.showToast) {
        window.mainApp.showToast('Study plan feature coming soon!', 'info');
    }
}

// Set Study Goal
function setStudyGoal(goal) {
    localStorage.setItem('studyGoal', JSON.stringify(goal));
    
    if (window.mainApp && window.mainApp.showToast) {
        window.mainApp.showToast('Study goal set!', 'success');
    }
}

// Get Study Reminder
function getStudyReminder() {
    const lastStudy = localStorage.getItem('lastStudyDate');
    const today = new Date().toDateString();
    
    if (lastStudy !== today) {
        return 'Time to study! Keep your streak going.';
    }
    
    return null;
}

// Export Study Data
function exportStudyData() {
    const data = {
        progress: studyProgress,
        statistics: getStudyStatistics(),
        downloads: JSON.parse(localStorage.getItem('noteDownloads') || '[]'),
        goal: JSON.parse(localStorage.getItem('studyGoal') || 'null')
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'study_data.json';
    link.click();
    
    URL.revokeObjectURL(url);
    
    if (window.mainApp && window.mainApp.showToast) {
        window.mainApp.showToast('Study data exported!', 'success');
    }
}

// Get Recommended Resources
function getRecommendedResources(userInterests) {
    // TODO: Implement recommendation algorithm
    console.log('Get recommendations for:', userInterests);
    
    return [];
}

// Track Study Activity
function trackStudyActivity(activityType, details) {
    const activity = {
        type: activityType,
        details: details,
        timestamp: new Date().toISOString()
    };
    
    const activities = JSON.parse(localStorage.getItem('studyActivities') || '[]');
    activities.push(activity);
    
    // Keep only last 100 activities
    if (activities.length > 100) {
        activities.shift();
    }
    
    localStorage.setItem('studyActivities', JSON.stringify(activities));
}

// Get Study Insights
function getStudyInsights() {
    const activities = JSON.parse(localStorage.getItem('studyActivities') || '[]');
    const stats = getStudyStatistics();
    
    return {
        totalActivities: activities.length,
        mostStudiedTime: getMostStudiedTime(activities),
        favoriteCategory: getFavoriteCategory(activities),
        statistics: stats
    };
}

// Get Most Studied Time
function getMostStudiedTime(activities) {
    // TODO: Analyze activities to find peak study hours
    return '9:00 AM - 11:00 AM';
}

// Get Favorite Category
function getFavoriteCategory(activities) {
    // TODO: Analyze activities to find most accessed category
    return 'SSC';
}

// Export functions
window.studyFunctions = {
    initializeStudy,
    loadStudyProgress,
    saveStudyProgress,
    openNotes,
    openBooks,
    openVideos,
    openPYQ,
    openQuiz,
    openExam,
    downloadNote,
    startStudySession,
    endStudySession,
    updateStudyStreak,
    markTopicCompleted,
    getStudyStatistics,
    loadNotes,
    uploadNote,
    searchNotes,
    createStudyPlan,
    setStudyGoal,
    exportStudyData,
    getStudyInsights
};

// Auto initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeStudy);
} else {
    initializeStudy();
}

console.log('Study.js loaded successfully');
