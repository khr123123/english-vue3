# English Reading Studio

A beautiful, feature-rich reading app for English articles, organized by **books on a bookshelf**.

Connected to a **Supabase** cloud database for persistent storage.

## Features

- **Bookshelf**: Organize articles into books with beautiful 3D book covers
- **Book Management**: Create, edit, delete books with custom colors and icons
- **Article Reading**: Read articles with rich formatting
- **Text Annotation**: Highlight (4 colors), bold, underline, toggle on/off
- **Notes**: Attach notes to any selected passage in the article
- **Vocabulary**: Save vocabulary words with part-of-speech and meaning
- **Cloud Sync**: All data automatically syncs to Supabase

## Tech Stack

- **Vue 3** + Composition API + TypeScript
- **Vue Router** (hash mode for static hosting)
- **Tailwind CSS** for styling
- **Supabase** for cloud database
- **Vite** for build tooling

## Setup

1. Create a [Supabase](https://supabase.com) project.
2. Run the SQL script from `supabase/schema.sql` in the SQL Editor.
3. Copy `.env.example` to `.env.local` and fill in your Supabase credentials.

```bash
npm install
npm run dev
```

## Production Build

```bash
npm run build
```

## Project Structure

```
src/
├── App.vue                    # Root component (layout)
├── main.ts                    # Entry point
├── router.ts                  # Vue Router config
├── store.ts                   # Global state management
├── db.ts                      # Supabase database layer
├── types.ts                   # TypeScript type definitions
├── style.css                  # Global CSS styles
├── components/
│   └── AppHeader.vue          # Top navigation bar
├── views/
│   ├── BookshelfView.vue      # Home page - 3D bookshelf
│   ├── BookDetailView.vue     # Book detail - article list
│   ├── ArticleView.vue        # Article reading view
│   └── ArticleEditView.vue    # Article editor view
└── utils/
    ├── uid.ts                 # Unique ID generator
    └── html.ts                # HTML utility functions
```
