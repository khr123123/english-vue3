# English Reading Studio

A minimal, fully client-side English-article reading & annotation app built with **Vue 3 + TypeScript + Tailwind CSS**.

No login required — open the app and start reading. Everything you create is stored in your browser's `localStorage`.

## Features

- **Article library** — create, edit and delete your own articles.
- **Rich editor** — bold, italic, underline, headings, lists, quotes, and custom multi-color highlights.
- **Inline annotation** — select any text to pop up a floating toolbar:
  - Bold / underline
  - Yellow / blue / pink / green highlight
  - Clear formatting
  - **Add a margin note** – the selection is wrapped in a dashed-underline mark, and the note appears in the side panel. Click any note in the sidebar to jump back to the exact position.
  - **Send selection to vocabulary** – quickly build a word list per article.
- **Vocabulary panel** — manage per-article word list with part-of-speech and meaning.
- **Keywords & theme meta** — each article has its own metadata.
- **Local persistence** — all data saved to `localStorage`. No backend, no account.

## Stack

- Vue 3 (Composition API, `<script setup>`)
- TypeScript
- Vite
- Tailwind CSS 3
- Vue Router 4 (hash mode)

## Getting Started

```bash
npm install
npm run dev       # dev server on :5173
npm run build     # production build → dist/
npm run preview   # preview built output
```

## Project Structure

```
src/
├── App.vue                    # layout shell
├── main.ts
├── router.ts
├── store.ts                   # reactive state + localStorage
├── types.ts
├── style.css                  # Tailwind + custom highlight styles
├── components/
│   └── AppHeader.vue
└── views/
    ├── HomeView.vue           # article library
    ├── ArticleView.vue        # reading + annotation
    └── ArticleEditView.vue    # meta + rich content editor
```

## Notes

- The annotation engine uses `document.execCommand` plus custom `<span>` wrapping around the current `Selection` range. It is intentionally simple and keeps the saved HTML portable.
- All state lives in `src/store.ts` under key `english-reading:v1`.
