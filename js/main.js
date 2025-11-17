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

const addChatMessage = (text, role = 'bot') => {
  const container = document.getElementById('assistantMessages');
  if (!container) return;
  const message = document.createElement('div');
  message.className = `assistant-message assistant-message--${role}`;
  message.textContent = text;
  container.appendChild(message);
  container.scrollTop = container.scrollHeight;
};

const analyzeNotes = (notes) => {
  const keywords = {
    action: ['todo', 'task', 'follow', 'deadline', 'fix', 'домашна', 'домашно', 'assignment', 'разпиши'],
    idea: ['idea', 'concept', 'brainstorm', 'dream', 'plan', 'идея', 'план'],
    reference: ['link', 'resource', 'note', 'info', 'read', 'article', 'прегледай', 'прочети', 'reference'],
  };

  const groups = {
    Action: [],
    Ideas: [],
    Reference: [],
    General: [],
  };

  notes.forEach((note, index) => {
    const snippet = note.content.trim().slice(0, 120);
    const lower = snippet.toLowerCase();

    if (keywords.action.some((word) => lower.includes(word))) {
      groups.Action.push({ index: index + 1, snippet });
    } else if (keywords.idea.some((word) => lower.includes(word))) {
      groups.Ideas.push({ index: index + 1, snippet });
    } else if (keywords.reference.some((word) => lower.includes(word))) {
      groups.Reference.push({ index: index + 1, snippet });
    } else {
      groups.General.push({ index: index + 1, snippet });
    }
  });

  const summary = Object.entries(groups)
    .filter(([, items]) => items.length)
    .map(([label, items]) => {
      const entries = items
        .map((item) => `• Note ${item.index}: ${item.snippet}${item.snippet.length === 120 ? '…' : ''}`)
        .join('\n');
      return `${label} (${items.length})\n${entries}`;
    })
    .join('\n\n');

  return { count: notes.length, groups, summary };
};

const randomFrom = (list) => list[Math.floor(Math.random() * list.length)];

const generateStructureResponse = (prompt, analysis) => {
  if (!analysis.count) {
    return randomFrom([
      'Все още нямаш бележки. Добави първата и ще ти помогна да я организирам.',
      'Нищо за подреждане засега — напиши идея или задача и веднага ще я структурираме.',
    ]);
  }

  const introVariants = [
    `Имаш ${analysis.count} бележки. Нека ги подредим така:`,
    `Разгледах ${analysis.count} записа и ето структурата, която виждам:`,
    `Базирам се на текущите ${analysis.count} бележки и предлагам следното:`,
  ];

  const summaryVariants = [
    'Ако искаш ще подготвя и списък със следващи стъпки.',
    'Мога да помогна и с разписване на приоритети, ако кажеш.',
    'Кажи ми ако искаш да ги пренапиша като план или чеклист.',
  ];

  const focusVariants = [
    'Виждам, че питаш за резюме – добавих акцент върху важните теми.',
    'Спомена “задачи”, затова оставих Action секцията първа.',
    'Звучи като търсиш структура за идеи; добавих я отделно.',
  ];

  const promptLower = prompt.toLowerCase();
  const extra =
    promptLower.includes('summary') || promptLower.includes('резюме')
      ? randomFrom(focusVariants)
      : randomFrom(summaryVariants);

  return `${randomFrom(introVariants)}\n\n${analysis.summary}\n\n${extra}`;
};

const initAssistantPanel = (notesProvider) => {
  const assistantForm = document.getElementById('assistantForm');
  const assistantInput = document.getElementById('assistantInput');
  const organizeBtn = document.getElementById('assistantOrganizeBtn');
  const toggleBtn = document.getElementById('assistantToggleBtn');
  const panel = document.getElementById('assistantPanel');

  if (!assistantForm || !assistantInput || !organizeBtn || !toggleBtn || !panel) return;

  toggleBtn.addEventListener('click', () => {
    const collapsed = panel.classList.toggle('assistant-panel--collapsed');
    toggleBtn.textContent = collapsed ? '+' : '–';
    toggleBtn.setAttribute('aria-label', collapsed ? 'Expand assistant' : 'Collapse assistant');
  });

  const handlePrompt = (prompt) => {
    const notes = typeof notesProvider === 'function' ? notesProvider() : [];
    addChatMessage(prompt, 'user');
    const analysis = analyzeNotes(notes);
    const response = generateStructureResponse(prompt, analysis);
    setTimeout(() => addChatMessage(response, 'bot'), 200);
  };

  assistantForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const prompt = assistantInput.value.trim();
    if (!prompt) return;
    assistantInput.value = '';
    handlePrompt(prompt);
  });

  organizeBtn.addEventListener('click', () => handlePrompt('Organize my notes'));
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

  initAssistantPanel(() => getUserNotes(user.id));
};

document.addEventListener('DOMContentLoaded', () => {
  initHelloPage();
  initDashboardPage();
});

