// Initialize app
let notes = [];
let currentNoteId = null;

// Load animation
window.onload = function() {
    setTimeout(() => {
        document.getElementById('loading').style.display = 'none';
        document.querySelector('.app-container').style.display = 'block';
        loadNotes();
    }, 1500);
};

// Notes management
function createNewNote() {
    const note = {
        id: Date.now(),
        title: 'New Note',
        content: '',
        created: new Date().toISOString()
    };
    notes.unshift(note); // Add to beginning of array
    saveNotes();
    renderNotesList();
    selectNote(note.id);
}

function selectNote(id) {
    currentNoteId = id;
    const note = notes.find(n => n.id === id);
    document.getElementById('note-content').innerHTML = note.content;
    document.querySelectorAll('.note-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`[data-note-id="${id}"]`).classList.add('active');
    showEditor();
}

function saveNotes() {
    localStorage.setItem('notes', JSON.stringify(notes));
}

function loadNotes() {
    const savedNotes = localStorage.getItem('notes');
    notes = savedNotes ? JSON.parse(savedNotes) : [];
    renderNotesList();
    if (notes.length > 0) {
        selectNote(notes[0].id);
    } else {
        hideEditor();
    }
}

// Auto-save functionality
let autoSaveTimeout;
document.getElementById('note-content').addEventListener('input', () => {
    clearTimeout(autoSaveTimeout);
    autoSaveTimeout = setTimeout(() => {
        if (currentNoteId) {
            const note = notes.find(n => n.id === currentNoteId);
            note.content = document.getElementById('note-content').innerHTML;
            saveNotes();
        }
    }, 500);
});

// Search functionality
function searchNotes(query) {
    const filteredNotes = notes.filter(note => 
        note.title.toLowerCase().includes(query.toLowerCase()) ||
        note.content.toLowerCase().includes(query.toLowerCase())
    );
    renderNotesList(filteredNotes);
    if (filteredNotes.length === 0) {
        document.getElementById('note-content').innerHTML = '';
        document.querySelectorAll('.note-item').forEach(item => {
            item.classList.remove('active');
        });
        document.getElementById('toolbar').style.display = 'none';
        document.getElementById('editor-container').style.display = 'none';
        document.getElementById('no-notes-wrapper').style.display = 'flex';
    } else if (!filteredNotes.some(note => note.id === currentNoteId)) {
        selectNote(filteredNotes[0].id);
    }
}

// Render notes list
function renderNotesList(notesToRender = notes) {
    const notesList = document.getElementById('notesList');
    notesList.innerHTML = '';
    notesToRender.forEach(note => {
        const li = document.createElement('li');
        li.className = 'note-item';
        li.setAttribute('data-note-id', note.id);
        li.innerHTML = `
            <div class="note-item-content">
                <input type="text" class="note-title-edit" value="${note.title}">
                <div class="note-date">${new Date(note.created).toLocaleDateString()}</div>
            </div>
            <button class="delete-btn" onclick="deleteNote(${note.id})">
                <i class="fas fa-trash-alt"></i>
            </button>
        `;
        
        // Handle title editing
        const titleInput = li.querySelector('.note-title-edit');
        titleInput.addEventListener('blur', () => {
            const newTitle = titleInput.value.trim();
            if (newTitle && newTitle !== note.title) {
                note.title = newTitle;
                saveNotes();
            }
        });
        
        titleInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                titleInput.blur();
            }
        });

        li.addEventListener('click', (e) => {
            if (!e.target.classList.contains('note-title-edit') && 
                !e.target.classList.contains('delete-btn')) {
                selectNote(note.id);
            }
        });

        notesList.appendChild(li);
    });
    if (notesToRender.length === 0) {
        hideEditor();
    } else {
        showEditor();
    }
}

// Add delete note function
function deleteNote(id) {
    const noteElement = document.querySelector(`[data-note-id="${id}"]`);
    noteElement.classList.add('slide-out');
    
    setTimeout(() => {
        notes = notes.filter(note => note.id !== id);
        saveNotes();
        renderNotesList();
        
        if (notes.length > 0) {
            selectNote(notes[0].id);
        } else {
            hideEditor();
        }
    }, 300);
}

// Show editor and toolbar
function showEditor() {
    document.getElementById('toolbar').style.display = 'flex';
    document.getElementById('editor-container').style.display = 'block';
    document.getElementById('no-notes-wrapper').style.display = 'none';
}

// Hide editor and toolbar
function hideEditor() {
    document.getElementById('toolbar').style.display = 'none';
    document.getElementById('editor-container').style.display = 'none';
    document.getElementById('no-notes-wrapper').style.display = 'flex';
}

// Formatting functions
function toggleBold() {
    document.execCommand('bold', false, null);
    updateToolbarStates();
}

function toggleItalic() {
    document.execCommand('italic', false, null);
    updateToolbarStates();
}

function toggleUnderline() {
    document.execCommand('underline', false, null);
    updateToolbarStates();
}

function toggleList(type) {
    const command = type === 'bullet' ? 'insertUnorderedList' : 'insertOrderedList';
    document.execCommand(command, false, null);
}

// Enhanced checkbox creation
function addCheckbox() {
    const div = document.createElement('div');
    div.className = 'task-container';
    
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'task-checkbox';
    
    const span = document.createElement('span');
    span.className = 'task-text';
    span.contentEditable = true;
    span.textContent = 'Task item';
    
    div.appendChild(checkbox);
    div.appendChild(span);

    // Add nesting container
    const nestContainer = document.createElement('div');
    nestContainer.className = 'nested-content';
    div.appendChild(nestContainer);
    
    const selection = window.getSelection();
    const range = selection.getRangeAt(0);
    range.insertNode(div);
    
    // Focus and select the text
    const newRange = document.createRange();
    newRange.selectNodeContents(span);
    selection.removeAllRanges();
    selection.addRange(newRange);
}

// Theme toggle with persistence
function toggleTheme() {
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    document.body.setAttribute('data-theme', isDark ? 'light' : 'dark');
    localStorage.setItem('theme', isDark ? 'light' : 'dark');
}

// Load saved theme
if (localStorage.getItem('theme') === 'dark') {
    document.body.setAttribute('data-theme', 'dark');
}

// Download note
function downloadNote() {
    if (!currentNoteId) return;
    const note = notes.find(n => n.id === currentNoteId);
    const blob = new Blob([note.content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${note.title}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

// Update changeFont function to handle selected text
function changeFont() {
    const fontSelect = document.getElementById('font-select');
    const selectedFont = fontSelect.value;
    const fontFamily = {
        'Inter': "'Inter', sans-serif",
        'Source': "'Source Sans Pro', sans-serif",
        'Merriweather': "'Merriweather', serif",
        'Playfair': "'Playfair Display', serif",
        'FiraCode': "'Fira Code', monospace",
        'RobotoMono': "'Roboto Mono', monospace"
    }[selectedFont];

    const selection = window.getSelection();
    
    if (selection.rangeCount > 0 && !selection.isCollapsed) {
        // Apply font to selected text
        document.execCommand('styleWithCSS', false, true);
        const span = document.createElement('span');
        span.style.setProperty('font-family', fontFamily, 'important');
        
        const range = selection.getRangeAt(0);
        const content = range.extractContents();
        span.appendChild(content);
        range.insertNode(span);
    } else {
        // Apply font to entire note if no selection
        const noteContent = document.getElementById('note-content');
        noteContent.style.setProperty('font-family', fontFamily, 'important');
    }

    // Save note content with font information
    if (currentNoteId) {
        const note = notes.find(n => n.id === currentNoteId);
        note.content = document.getElementById('note-content').innerHTML;
        saveNotes();
    }
}

// Update selectNote to preserve font styles
const originalSelectNote = selectNote;
selectNote = function(id) {
    originalSelectNote(id);
    const note = notes.find(n => n.id === id);
    const noteContent = document.getElementById('note-content');
    
    // Set default font if specified
    if (note.fontFamily) {
        noteContent.style.setProperty('font-family', note.fontFamily, 'important');
    }

    // The HTML content already contains font information in spans
    noteContent.innerHTML = note.content;
    
    // Update font selector to show default font
    const fontSelect = document.getElementById('font-select');
    if (note.fontFamily) {
        for (let option of fontSelect.options) {
            if (note.fontFamily.includes(option.value)) {
                fontSelect.value = option.value;
                break;
            }
        }
    }
}

// Add sidebar collapse functionality
function toggleCollapse() {
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');
    
    if (sidebar.style.width === '0px') {
        sidebar.style.width = 'var(--sidebar-width)';
        mainContent.style.marginLeft = 'var(--sidebar-width)';
    } else {
        sidebar.style.width = '0px';
        mainContent.style.marginLeft = '0px';
    }
}

// Replace existing toggleCollapse function with improved toggleSidebar
function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');
    const toggleButton = document.querySelector('.sidebar-toggle');
    
    sidebar.classList.toggle('collapsed');
    
    if (sidebar.classList.contains('collapsed')) {
        sidebar.style.transform = 'translateX(-100%)';
        mainContent.style.marginLeft = '0';
        toggleButton.classList.add('visible');
    } else {
        sidebar.style.transform = 'translateX(0)';
        mainContent.style.marginLeft = 'var(--sidebar-width)';
        toggleButton.classList.remove('visible');
    }
}

// Update toggleCollapse function to use toggleSidebar
function toggleCollapse() {
    toggleSidebar();
}

// Add event listener for page load to check sidebar state
document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.querySelector('.sidebar');
    const toggleButton = document.querySelector('.sidebar-toggle');
    
    if (sidebar.classList.contains('collapsed')) {
        toggleButton.classList.add('visible');
    }
});

// Indentation control
function indentContent(action) {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    const container = range.commonAncestorContainer.parentElement;

    if (action === 'increase') {
        if (container.tagName === 'LI' || container.classList.contains('task-container')) {
            const listItem = container.closest('li, .task-container');
            const parentList = listItem.parentElement;

            // Create a new nested list
            let nestedList;
            if (parentList.tagName === 'UL') {
                nestedList = document.createElement('ul');
            } else if (parentList.tagName === 'OL') {
                nestedList = document.createElement('ol');
            } else {
                nestedList = document.createElement('ul'); // Default to unordered list
            }

            // Move the list item to the nested list
            if (listItem.previousElementSibling) {
                if (!listItem.previousElementSibling.querySelector('ul, ol')) {
                    listItem.previousElementSibling.appendChild(nestedList);
                } else {
                    nestedList = listItem.previousElementSibling.querySelector('ul, ol');
                }
                nestedList.appendChild(listItem);
            }
        }
    } else {
        const listItem = container.closest('li, .task-container');
        const parentList = listItem.parentElement;

        if (parentList.tagName === 'UL' || parentList.tagName === 'OL') {
            const grandParentList = parentList.parentElement.closest('ul, ol');
            if (grandParentList) {
                grandParentList.insertBefore(listItem, parentList.parentElement.nextSibling);
                if (!parentList.children.length) {
                    parentList.parentElement.removeChild(parentList);
                }
            } else if (parentList.parentElement.tagName !== 'BODY') {
                parentList.insertBefore(listItem, parentList.firstChild);
            }
        }
    }

    // Save changes
    if (currentNoteId) {
        const note = notes.find(n => n.id === currentNoteId);
        note.content = document.getElementById('note-content').innerHTML;
        saveNotes();
    }
}

// Update task checkbox event listeners
document.getElementById('note-content').addEventListener('change', function(e) {
    if (e.target.classList.contains('task-checkbox')) {
        const taskText = e.target.nextElementSibling;
        if (e.target.checked) {
            taskText.style.textDecoration = 'line-through';
            taskText.style.opacity = '0.6';
        } else {
            taskText.style.textDecoration = 'none';
            taskText.style.opacity = '1';
        }
        
        // Save changes
        if (currentNoteId) {
            const note = notes.find(n => n.id === currentNoteId);
            note.content = document.getElementById('note-content').innerHTML;
            saveNotes();
        }
    }
});

// Function to update toolbar button states
function updateToolbarStates() {
    const isBold = document.queryCommandState('bold');
    const isItalic = document.queryCommandState('italic');
    const isUnderline = document.queryCommandState('underline');

    document.querySelector('[onclick="toggleBold()"]').classList.toggle('active', isBold);
    document.querySelector('[onclick="toggleItalic()"]').classList.toggle('active', isItalic);
    document.querySelector('[onclick="toggleUnderline()"]').classList.toggle('active', isUnderline);

    // Update font selector based on the current selection or cursor position
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const container = range.commonAncestorContainer.nodeType === 3 ? range.commonAncestorContainer.parentElement : range.commonAncestorContainer;
        const computedStyle = window.getComputedStyle(container);
        const fontFamily = computedStyle.fontFamily.replace(/['"]/g, '');

        const fontSelect = document.getElementById('font-select');
        for (let option of fontSelect.options) {
            if (fontFamily.includes(option.value)) {
                fontSelect.value = option.value;
                break;
            }
        }
    }
}

// Add event listener to update toolbar states on selection change
document.addEventListener('selectionchange', updateToolbarStates);

// Add event listener to update toolbar states on keyup (for arrow keys)
document.getElementById('note-content').addEventListener('keyup', function(event) {
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
        updateToolbarStates();
    }
});

// Formatting functions with toolbar state update
function toggleBold() {
    document.execCommand('bold', false, null);
    updateToolbarStates();
}

function toggleItalic() {
    document.execCommand('italic', false, null);
    updateToolbarStates();
}

function toggleUnderline() {
    document.execCommand('underline', false, null);
    updateToolbarStates();
}

function toggleList(type) {
    const command = type === 'bullet' ? 'insertUnorderedList' : 'insertOrderedList';
    document.execCommand(command, false, null);
}

// Add keyboard shortcuts for formatting
document.addEventListener('keydown', function(event) {
    if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
            case 'b':
                event.preventDefault();
                toggleBold();
                break;
            case 'i':
                event.preventDefault();
                toggleItalic();
                break;
            case 'u':
                event.preventDefault();
                toggleUnderline();
                break;
        }
    }
});

// Initialize AI suggestions using puter.js v2
let aiModel;

async function initializeAI() {
    aiModel = await puter.loadModel('gpt-3.5', { version: '2.0' }); // Load the AI model with v2
    console.log('AI model (v2) loaded successfully');
}

// Provide AI suggestions while typing
document.getElementById('note-content').addEventListener('input', async (event) => {
    const content = event.target.innerText;
    if (content.trim().length > 0 && aiModel) {
        const suggestions = await aiModel.predict(content, { maxTokens: 20, temperature: 0.7 });
        showAISuggestions(suggestions.text); // Adjusted for v2 response format
    } else {
        hideAISuggestions();
    }
});

// Show AI suggestions
function showAISuggestions(suggestions) {
    let suggestionBox = document.getElementById('ai-suggestions');
    if (!suggestionBox) {
        suggestionBox = document.createElement('div');
        suggestionBox.id = 'ai-suggestions';
        suggestionBox.className = 'ai-suggestions';
        document.getElementById('editor-container').appendChild(suggestionBox);
    }
    suggestionBox.innerText = suggestions;
    suggestionBox.style.display = 'block';
}

// Hide AI suggestions
function hideAISuggestions() {
    const suggestionBox = document.getElementById('ai-suggestions');
    if (suggestionBox) {
        suggestionBox.style.display = 'none';
    }
}

// Accept AI suggestion
document.getElementById('editor-container').addEventListener('click', (event) => {
    if (event.target.id === 'ai-suggestions') {
        const suggestion = event.target.innerText;
        const noteContent = document.getElementById('note-content');
        noteContent.innerText += ` ${suggestion}`;
        hideAISuggestions();
    }
});

// Initialize AI on page load
document.addEventListener('DOMContentLoaded', () => {
    initializeAI();
});
