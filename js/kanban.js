const USER_STORAGE_KEY = 'memoaUser';
const BOARD_KEY_PREFIX = 'memoaBoard';

const generateId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `todo-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

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

const getBoardKey = (userId) => `${BOARD_KEY_PREFIX}-${userId}`;

const loadBoard = (userId) => {
  try {
    return JSON.parse(localStorage.getItem(getBoardKey(userId))) || [];
  } catch (error) {
    console.error('Failed to parse board data', error);
    return [];
  }
};

const saveBoard = (userId, notes) => {
  localStorage.setItem(getBoardKey(userId), JSON.stringify(notes));
};

const createStickyTemplate = (note) => `
  <article class="sticky-note" draggable="true" data-id="${note.id}" data-stage="${note.stage}">
    <textarea readonly>${note.content}</textarea>
    <div class="sticky-note__actions">
      <span>${note.stage.replace('-', ' ')}</span>
      <button class="btn btn--secondary" data-action="delete" data-id="${note.id}" type="button">Delete</button>
    </div>
  </article>
`;

const renderBoard = (user, notes) => {
  const zones = document.querySelectorAll('.kanban-dropzone');
  zones.forEach((zone) => {
    const stage = zone.dataset.stage;
    const stageNotes = notes.filter((note) => note.stage === stage);
    zone.innerHTML = stageNotes.map(createStickyTemplate).join('');
  });

  document.querySelectorAll('.sticky-note').forEach((note) => {
    note.addEventListener('dragstart', (event) => {
      event.dataTransfer.setData('text/plain', note.dataset.id);
      event.dataTransfer.setData('application/stage', note.dataset.stage);
    });
  });
};

const initKanban = () => {
  const user = requireAuth();
  if (!user) return;

  const sidebarAccount = document.getElementById('sidebarAccount');
  if (sidebarAccount) sidebarAccount.textContent = user.name;

  let notes = loadBoard(user.id);

  const refresh = () => {
    renderBoard(user, notes);
  };

  refresh();

  const form = document.getElementById('kanbanAddForm');
  const contentField = document.getElementById('kanbanNewContent');

  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    const content = contentField.value.trim();
    if (!content) return;

    const newNote = {
      id: generateId(),
      content,
      stage: 'todo',
      createdAt: new Date().toISOString(),
    };

    notes = [...notes, newNote];
    saveBoard(user.id, notes);
    contentField.value = '';
    refresh();
  });

  const board = document.getElementById('kanbanBoard');
  board?.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (target.dataset.action !== 'delete') return;
    const noteId = target.dataset.id;
    notes = notes.filter((note) => note.id !== noteId);
    saveBoard(user.id, notes);
    refresh();
  });

  document.querySelectorAll('.kanban-dropzone').forEach((zone) => {
    zone.addEventListener('dragover', (event) => {
      event.preventDefault();
      zone.classList.add('drag-over');
    });

    zone.addEventListener('dragleave', () => {
      zone.classList.remove('drag-over');
    });

    zone.addEventListener('drop', (event) => {
      event.preventDefault();
      zone.classList.remove('drag-over');
      const noteId = event.dataTransfer.getData('text/plain');
      const nextStage = zone.dataset.stage;
      notes = notes.map((note) =>
        note.id === noteId
          ? {
              ...note,
              stage: nextStage,
            }
          : note
      );
      saveBoard(user.id, notes);
      refresh();
    });
  });
};

document.addEventListener('DOMContentLoaded', initKanban);

