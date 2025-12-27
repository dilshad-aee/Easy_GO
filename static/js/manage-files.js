/**
 * Manage Files Page JavaScript
 */

let currentEditingFileId = null;

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    setupThemeToggle();
    loadFiles();
});

// Theme Management
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

function setupThemeToggle() {
    const toggleBtn = document.getElementById('themeToggle');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', toggleTheme);
    }
}

function toggleTheme() {
    const currentTheme = document.body.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';

    document.body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
    const themeToggle = document.getElementById('themeToggle');
    if (!themeToggle) return;

    const icon = themeToggle.querySelector('i');
    if (!icon) return;

    if (theme === 'dark') {
        icon.className = 'fas fa-sun';
    } else {
        icon.className = 'fas fa-moon';
    }
}

// Load and Display Files
function loadFiles() {
    const customFiles = JSON.parse(localStorage.getItem('customQuestionFiles') || '[]');
    const filesList = document.getElementById('filesList');
    const emptyState = document.getElementById('emptyState');

    if (customFiles.length === 0) {
        filesList.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }

    emptyState.style.display = 'none';

    filesList.innerHTML = customFiles.map(file => {
        const topics = getUniqueTopics(file.questions);
        const uploadDate = new Date(file.uploadedAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });

        return `
            <div class="card card-lg mb-3">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 16px;">
                    <div style="flex: 1;">
                        <h3 style="margin: 0 0 8px 0;">
                            <i class="fas fa-file-alt" style="color: var(--accent); margin-right: 8px;"></i>
                            ${file.name}
                        </h3>
                        ${file.description ? `<p class="text-secondary" style="margin: 0 0 12px 0;">${file.description}</p>` : ''}
                        <div style="display: flex; gap: 16px; flex-wrap: wrap;">
                            <span class="badge badge-primary">
                                <i class="fas fa-question-circle"></i> ${file.questions.length} Questions
                            </span>
                            <span class="badge badge-secondary">
                                <i class="fas fa-book"></i> ${topics.length} Topics
                            </span>
                            <span class="text-secondary" style="font-size: 14px;">
                                <i class="fas fa-calendar"></i> Uploaded ${uploadDate}
                            </span>
                        </div>
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <button type="button" class="btn btn-outline btn-sm" data-action="view" data-file-id="${file.id}" title="View Details">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button type="button" class="btn btn-outline btn-sm" data-action="edit" data-file-id="${file.id}" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button type="button" class="btn btn-outline btn-sm" data-action="download" data-file-id="${file.id}" title="Download">
                            <i class="fas fa-download"></i>
                        </button>
                        <button type="button" class="btn btn-outline btn-sm" data-action="delete" data-file-id="${file.id}" title="Delete" style="color: var(--danger);">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                
                <!-- Topics List -->
                <div id="topics-${file.id}" style="display: none; margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--border-light);">
                    <h4 style="margin: 0 0 12px 0; font-size: 16px;">Topics Covered:</h4>
                    <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                        ${topics.map(topic => {
            const topicCount = file.questions.filter(q => q.topic === topic).length;
            return `<span class="badge badge-info">${topic} (${topicCount})</span>`;
        }).join('')}
                    </div>
                </div>
            </div>
        `;
    }).join('');

    // Add event listeners for buttons
    setupFileActionListeners();
}

function setupFileActionListeners() {
    document.querySelectorAll('[data-action]').forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();

            const action = e.currentTarget.dataset.action;
            const fileId = e.currentTarget.dataset.fileId;

            console.log('Button clicked:', action, fileId);

            switch (action) {
                case 'view':
                    viewFileDetails(fileId);
                    break;
                case 'edit':
                    editFile(fileId);
                    break;
                case 'download':
                    downloadFile(fileId);
                    break;
                case 'delete':
                    deleteFile(fileId);
                    break;
            }
        });
    });
}

function getUniqueTopics(questions) {
    const topics = new Set();
    questions.forEach(q => {
        if (q.topic) topics.add(q.topic);
    });
    return Array.from(topics);
}

// View File Details
function viewFileDetails(fileId) {
    const topicsDiv = document.getElementById(`topics-${fileId}`);
    if (topicsDiv) {
        topicsDiv.style.display = topicsDiv.style.display === 'none' ? 'block' : 'none';
    }
}

// Edit File
function editFile(fileId) {
    const customFiles = JSON.parse(localStorage.getItem('customQuestionFiles') || '[]');
    const file = customFiles.find(f => f.id === fileId);

    if (!file) {
        alert('File not found!');
        return;
    }

    currentEditingFileId = fileId;
    document.getElementById('editFileName').value = file.name;
    document.getElementById('editFileDescription').value = file.description || '';
    document.getElementById('editModal').style.display = 'flex';
}

function closeEditModal() {
    document.getElementById('editModal').style.display = 'none';
    currentEditingFileId = null;
}

function saveFileEdit() {
    if (!currentEditingFileId) return;

    const newName = document.getElementById('editFileName').value.trim();
    const newDescription = document.getElementById('editFileDescription').value.trim();

    if (!newName) {
        alert('Please enter a file name');
        return;
    }

    const customFiles = JSON.parse(localStorage.getItem('customQuestionFiles') || '[]');
    const fileIndex = customFiles.findIndex(f => f.id === currentEditingFileId);

    if (fileIndex !== -1) {
        customFiles[fileIndex].name = newName;
        customFiles[fileIndex].description = newDescription;
        localStorage.setItem('customQuestionFiles', JSON.stringify(customFiles));

        closeEditModal();
        loadFiles();

        alert('File updated successfully!');
    }
}

// Download File
function downloadFile(fileId) {
    const customFiles = JSON.parse(localStorage.getItem('customQuestionFiles') || '[]');
    const file = customFiles.find(f => f.id === fileId);

    if (!file) {
        alert('File not found!');
        return;
    }

    const blob = new Blob([JSON.stringify(file.questions, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${file.name}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

// Delete File
let fileToDeleteId = null;

function deleteFile(fileId) {
    const customFiles = JSON.parse(localStorage.getItem('customQuestionFiles') || '[]');
    const file = customFiles.find(f => f.id === fileId);

    if (!file) {
        alert('File not found!');
        return;
    }

    // Set file to delete
    fileToDeleteId = fileId;

    // Update modal text
    const modalText = document.getElementById('deleteModalText');
    if (modalText) {
        modalText.textContent = `Are you sure you want to delete "${file.name}"? This cannot be undone.`;
    }

    // Show modal
    document.getElementById('deleteConfirmationModal').style.display = 'flex';

    // Setup confirm button
    const confirmBtn = document.getElementById('confirmDeleteBtn');
    // Clone to remove old listeners
    const newBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newBtn, confirmBtn);

    newBtn.addEventListener('click', performDelete);
}

function closeDeleteModal() {
    document.getElementById('deleteConfirmationModal').style.display = 'none';
    fileToDeleteId = null;
}

function performDelete() {
    if (!fileToDeleteId) return;

    const customFiles = JSON.parse(localStorage.getItem('customQuestionFiles') || '[]');
    const updatedFiles = customFiles.filter(f => f.id !== fileToDeleteId);

    localStorage.setItem('customQuestionFiles', JSON.stringify(updatedFiles));

    closeDeleteModal();
    loadFiles();

    // Show success toast or alert (using alert for now)
    setTimeout(() => alert('File deleted successfully!'), 50);
}

// Close modal on outside click
document.addEventListener('click', (e) => {
    const editModal = document.getElementById('editModal');
    const deleteModal = document.getElementById('deleteConfirmationModal');

    if (e.target === editModal) {
        closeEditModal();
    }
    if (e.target === deleteModal) {
        closeDeleteModal();
    }
});

// Make functions global
window.viewFileDetails = viewFileDetails;
window.editFile = editFile;
window.downloadFile = downloadFile;
window.deleteFile = deleteFile;
window.closeEditModal = closeEditModal;
window.saveFileEdit = saveFileEdit;
window.closeDeleteModal = closeDeleteModal;
// window.performDelete is internal, doesn't need to be global usually but can be if needed for onclick
window.performDelete = performDelete;
