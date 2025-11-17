# Memoa

Prototype of the Memoa UI. The current demo is 100% front-end: registrations,
logins, and notes are stored in `localStorage`, so you only need a static file
server to run it.

## Getting started

### Serve the HTML files

Pick one of the options below to serve `/Users/gabriela/Documents/Memoa/html`
through `http://localhost` (the pages must not be opened via `file://`).

#### Option A – VS Code Live Server
1. Open the folder in VS Code.
2. Install the “Live Server” extension (Ritwick Dey).
3. Right-click `html/index.html` → “Open with Live Server”.

#### Option B – Python http.server
```bash
cd /Users/gabriela/Documents/Memoa/html
python3 -m http.server 5500
```
Open `http://127.0.0.1:5500/index.html` in your browser.

### Data location
- Registered users are stored in `localStorage` under the `memoaUsers` key.
- The active session is `memoaUser`.
- Notes are stored per user under `memoaNotes`.

> The previous Flask + SQLite backend is kept under `/server`, but it is no
> longer required for the default flow.

## Assistant & checklists

- On `dashboard.html` the Memoa assistant can summarize notes, create structure
  drafts, turn items into checklists, or sort notes when you ask (e.g. “sort
  notes”, “create checklist”).
- Checklist notes contain lines starting with `☐` or `☑`. Ticking them in the UI
  updates the stored content immediately, so the state persists on refresh.
- Collapse the assistant panel with the round `+` / `–` button to focus on the
  notes grid.

## Kanban to-do board

- Open `html/todo.html` (sidebar → To-do) to access a three-column board:
  `To do`, `In process`, `Done`.
- Add sticky notes from the textarea above the board; drag them between columns
  or delete when finished.
- Board data is saved per user in `localStorage` under `memoaBoard-<userId>`.

## Favourites hub

- `html/favourites.html` lets you store highlighted snippets/links with title,
  tag and colour theme (sky, lavender, peach, mint).
- Items render as “sticky” gradient cards; click Remove to delete.
- Data is stored in `localStorage` (`memoaFavourites-<userId>`), so every user
  has their own collection.