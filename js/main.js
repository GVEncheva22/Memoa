const API_BASE = 'http://127.0.0.1:5000/api';
const USER_STORAGE_KEY = 'memoaUser';

function getStoredUser() {
  const raw = localStorage.getItem(USER_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (error) {
    console.error('Failed to parse user from storage', error);
    return null;
  }
}

function requireAuth() {
  const user = getStoredUser();
  if (!user) {
    window.location.href = './login.html';
    return null;
  }
  return user;
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Something went wrong');
  }

  return response.json();
}

function initHelloPage() {
  const helloTitle = document.getElementById('helloTitle');
  const proceedButton = document.getElementById('proceedToNotes');
  if (!helloTitle || !proceedButton) return;

  const user = requireAuth();
  if (!user) return;

  helloTitle.textContent = `Hello ${user.name}!`;
  proceedButton.addEventListener('click', () => {
    window.location.href = './dashboard.html';
  });
}

function renderNotes(notes) {
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
}

async function fetchNotes(userId) {
  const result = await request(`/notes?userId=${encodeURIComponent(userId)}`);
  return result.notes;
}

async function handleDeleteNote(event) {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  if (target.dataset.action !== 'delete') return;
  const noteId = target.dataset.id;
  if (!noteId) return;

  if (!confirm('Delete this note?')) return;

  await request(`/notes/${noteId}`, { method: 'DELETE' });
  initDashboardPage(true);
}

async function initDashboardPage(forceRefresh = false) {
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

  const loadNotes = async () => {
    const notes = await fetchNotes(user.id);
    renderNotes(notes);
  };

  if (forceRefresh) {
    await loadNotes();
    return;
  }

  await loadNotes();

  notesGrid.removeEventListener('click', handleDeleteNote);
  notesGrid.addEventListener('click', handleDeleteNote);

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

  noteForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const content = noteContent.value.trim();
    if (!content) {
      alert('Please write something first.');
      return;
    }

    await request('/notes', {
      method: 'POST',
      body: JSON.stringify({
        userId: user.id,
        content,
      }),
    });

    toggleForm(false);
    await loadNotes();
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initHelloPage();
  initDashboardPage();
});

