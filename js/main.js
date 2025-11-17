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

const applyAssistantActions = (prompt, notes, setNotes, analysis) => {
  const lower = prompt.toLowerCase();
  const responses = [];
  let updatedNotes = [...notes];
  let changed = false;

  const matches = (keywords) => keywords.some((keyword) => lower.includes(keyword));

  if (matches(['create', 'generate', 'structure note', 'разпиши', 'нова бележк', 'add structure'])) {
    if (analysis.count) {
      const structuredNote = {
        id: generateId(),
        content: `Структура ${new Date().toLocaleString()}:\n\n${analysis.summary}`,
        createdAt: new Date().toISOString(),
      };
      updatedNotes = [...updatedNotes, structuredNote];
      changed = true;
      responses.push('Добавих нова бележка с предложената структура.');
    }
  }

  if (matches(['edit', 'rewrite', 'update', 'section', 'пренапиши', 'редакт', 'раздел'])) {
    if (updatedNotes.length) {
      const sections = Object.entries(analysis.groups)
        .filter(([, items]) => items.length)
        .map(([label, items]) => `${label}:\n${items.map((item) => `• ${item.snippet}`).join('\n')}`)
        .join('\n\n');
      updatedNotes[0] = {
        ...updatedNotes[0],
        content: `🏗️ Организирана версия:\n\n${sections}`,
      };
      changed = true;
      responses.push('Преподредих първата ти бележка с отделни секции.');
    }
  }

  if (matches(['checklist', 'tasks', 'todo', 'step', 'steps', 'стъпк', 'списък'])) {
    if (analysis.count) {
      const taskSource = analysis.groups.Action.length ? analysis.groups.Action : analysis.groups.General;
      const finalSource = taskSource.length ? taskSource : analysis.groups.Ideas;
      const items = finalSource.map((item, index) => `☐ Стъпка ${index + 1}: ${item.snippet}`);
      const checklistNote = {
        id: generateId(),
        content: `Checklist ${new Date().toLocaleDateString()}:\n${items.join('\n')}`,
        createdAt: new Date().toISOString(),
      };
      updatedNotes = [...updatedNotes, checklistNote];
      changed = true;
      responses.push('Добавих нова бележка тип checklist със стъпки.');
    }
  }

  if (matches(['sort', 'order', 'arrange', 'подреди', 'сортирай'])) {
    updatedNotes = [...updatedNotes].sort((a, b) =>
      (a.content || '').localeCompare(b.content || '', 'bg-BG')
    );
    changed = true;
    responses.push('Подредих бележките ти по азбучен ред.');
  }

  if (changed) {
    setNotes(updatedNotes);
  }

  return responses;
};

const initAssistantPanel = ({ getNotes, setNotes }) => {
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
    const notes = getNotes();
    addChatMessage(prompt, 'user');
    const analysis = analyzeNotes(notes);
    const response = generateStructureResponse(prompt, analysis);
    setTimeout(() => {
      const actionResponses = applyAssistantActions(prompt, notes, setNotes, analysis);
      const finalResponse = actionResponses.length ? `${response}\n\n${actionResponses.join('\n')}` : response;
      addChatMessage(finalResponse, 'bot');
    }, 200);
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

const parseChecklist = (content) => {
  const lines = content.split('\n');
  const items = [];
  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('☐') || trimmed.startsWith('☑')) {
      items.push({
        index,
        checked: trimmed.startsWith('☑'),
        text: trimmed.slice(1).trim(),
      });
    }
  });
  return { lines, items };
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
    card.dataset.noteId = note.id;

    const { items } = parseChecklist(note.content);
    if (items.length) {
      const itemsMarkup = items
        .map(
          (item) => `
          <label class="checklist-item ${item.checked ? 'checklist-item--done' : ''}">
            <input type="checkbox" data-line-index="${item.index}" ${item.checked ? 'checked' : ''}>
            <span>${item.text}</span>
          </label>`
        )
        .join('');
      card.innerHTML = `
        <div class="checklist">
          ${itemsMarkup}
        </div>
        <div class="note-card__actions">
          <button class="btn btn--secondary" data-id="${note.id}" data-action="delete">Delete</button>
        </div>
      `;
    } else {
      card.innerHTML = `
        <textarea readonly>${note.content}</textarea>
        <div class="note-card__actions">
          <button class="btn btn--secondary" data-id="${note.id}" data-action="delete">Delete</button>
        </div>
      `;
    }
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

  initAssistantPanel({
    getNotes: () => getUserNotes(user.id),
    setNotes: (newNotes) => {
      saveUserNotes(user.id, newNotes);
      loadNotes();
    },
  });
};

document.addEventListener('DOMContentLoaded', () => {
  initHelloPage();
  initDashboardPage();
});

