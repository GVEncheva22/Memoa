const USER_STORAGE_KEY = 'memoaUser';
const NOTES_KEY = 'memoaNotes';

const generateId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `note-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const getStoredUser = () => {
  const raw = localStorage.getItem(USER_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (error) {
    console.error('Failed to parse user from storage', error);
    return null;
  }
};

const requireAuth = () => {
  const user = getStoredUser();
  if (!user) {
    window.location.href = './login.html';
    return null;
  }
  return user;
};

const getNotesStore = () => {
  try {
    return JSON.parse(localStorage.getItem(NOTES_KEY)) || {};
  } catch (error) {
    console.error('Failed to parse notes', error);
    return {};
  }
};

const saveNotesStore = (store) => {
  localStorage.setItem(NOTES_KEY, JSON.stringify(store));
};

const getUserNotes = (userId) => {
  const store = getNotesStore();
  return store[userId] || [];
};

const saveUserNotes = (userId, notes) => {
  const store = getNotesStore();
  store[userId] = notes;
  saveNotesStore(store);
};

const initHelloPage = () => {
  const helloTitle = document.getElementById('helloTitle');
  const proceedButton = document.getElementById('proceedToNotes');
  if (!helloTitle || !proceedButton) return;

  const user = requireAuth();
  if (!user) return;

  helloTitle.textContent = `Hello ${user.name}!`;
  proceedButton.addEventListener('click', () => {
    window.location.href = './dashboard.html';
  });
};

const renderNotes = (notes) => {
  const notesGrid = document.getElementById('notesGrid');
  if (!notesGrid) return;
  notesGrid.innerHTML = '';

  if (!notes.length) {
    notesGrid.innerHTML = '<p>No notes yet. Click “+ New note” to start.</p>';
    return;
  }

  notes.forEach((note) => {
    const card = document.createElement('article');
    card.className = 'note-card';
    card.innerHTML = `
      <textarea readonly>${note.content}</textarea>
      <div class="note-card__actions">
        <button class="btn btn--secondary" data-id="${note.id}" data-action="delete">Delete</button>
      </div>
    `;
    notesGrid.appendChild(card);
  });
};

const initDashboardPage = () => {
  const notesGrid = document.getElementById('notesGrid');
  const noteForm = document.getElementById('noteForm');
  const noteContent = document.getElementById('noteContent');
  const newNoteBtn = document.getElementById('newNoteBtn');
  const cancelNoteBtn = document.getElementById('cancelNoteBtn');
  const sidebarAccount = document.getElementById('sidebarAccount');

  if (!notesGrid || !noteForm || !noteContent || !newNoteBtn || !cancelNoteBtn) return;

  const user = requireAuth();
  if (!user) return;

  sidebarAccount.textContent = user.name;

  const loadNotes = () => {
    const notes = getUserNotes(user.id);
    renderNotes(notes);
  };

  loadNotes();

  notesGrid.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (target.dataset.action !== 'delete') return;
    const noteId = target.dataset.id;
    if (!noteId) return;

    if (!confirm('Delete this note?')) return;

    const notes = getUserNotes(user.id).filter((note) => note.id !== noteId);
    saveUserNotes(user.id, notes);
    loadNotes();
  });

  const toggleForm = (show) => {
    noteForm.classList.toggle('hidden', !show);
    if (show) {
      noteContent.focus();
    } else {
      noteContent.value = '';
    }
  };

  newNoteBtn.addEventListener('click', () => toggleForm(true));
  cancelNoteBtn.addEventListener('click', () => toggleForm(false));

  noteForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const content = noteContent.value.trim();
    if (!content) {
      alert('Please write something first.');
      return;
    }

    const notes = getUserNotes(user.id);
    const note = {
      id: generateId(),
      content,
      createdAt: new Date().toISOString(),
    };

    notes.unshift(note);
    saveUserNotes(user.id, notes);
    toggleForm(false);
    loadNotes();
  });
};

document.addEventListener('DOMContentLoaded', () => {
  initHelloPage();
  initDashboardPage();
});

