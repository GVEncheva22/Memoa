const USER_STORAGE_KEY = 'memoaUser';
const FAV_STORAGE_PREFIX = 'memoaFavourites';

const generateId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `fav-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

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

const getFavKey = (userId) => `${FAV_STORAGE_PREFIX}-${userId}`;

const loadFavourites = (userId) => {
  try {
    return JSON.parse(localStorage.getItem(getFavKey(userId))) || [];
  } catch (error) {
    console.error('Failed to parse favourites', error);
    return [];
  }
};

const saveFavourites = (userId, list) => {
  localStorage.setItem(getFavKey(userId), JSON.stringify(list));
};

const createFavCard = (fav) => `
  <article class="favourite-card ${fav.color}">
    <div class="favourite-card__tag">${fav.tag}</div>
    <h4>${fav.title}</h4>
    <p>${fav.content}</p>
    ${fav.attachment ? `<img class="favourite-card__image" src="${fav.attachment}" alt="${fav.title} attachment">` : ''}
    <div class="favourite-card__actions">
      <button type="button" data-action="delete" data-id="${fav.id}">Remove</button>
    </div>
  </article>
`;

const initFavourites = () => {
  const user = requireAuth();
  if (!user) return;

  const sidebarAccount = document.getElementById('sidebarAccount');
  if (sidebarAccount) sidebarAccount.textContent = user.name;

  let favourites = loadFavourites(user.id);
  const grid = document.getElementById('favouritesGrid');

  const render = () => {
    if (!grid) return;
    if (!favourites.length) {
      grid.innerHTML = '<p>No favourites yet. Save a snippet to see it here.</p>';
      return;
    }
    grid.innerHTML = favourites.map(createFavCard).join('');
  };

  render();

  const form = document.getElementById('favouriteForm');
  const title = document.getElementById('favouriteTitle');
  const tag = document.getElementById('favouriteTag');
  const content = document.getElementById('favouriteContent');
  const color = document.getElementById('favouriteColor');
  const attachmentInput = document.getElementById('favouriteAttachment');

  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!content.value.trim()) return;

    const file = attachmentInput?.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        persistFavourite(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      persistFavourite('');
    }

    function persistFavourite(attachment) {
      const fav = {
        id: generateId(),
        title: (title.value.trim() || 'Untitled snippet'),
        tag: (tag.value.trim() || 'Note').toUpperCase(),
        content: content.value.trim(),
        color: color.value,
        attachment,
        createdAt: new Date().toISOString(),
      };

      favourites = [fav, ...favourites];
      saveFavourites(user.id, favourites);
      form.reset();
      color.value = 'sky';
      if (attachmentInput) attachmentInput.value = '';
      render();
    }
  });

  grid?.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (target.dataset.action !== 'delete') return;
    const favId = target.dataset.id;
    favourites = favourites.filter((fav) => fav.id !== favId);
    saveFavourites(user.id, favourites);
    render();
  });
};

document.addEventListener('DOMContentLoaded', initFavourites);
