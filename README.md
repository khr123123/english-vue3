# English Reading App

A beautiful, minimal reading app for English articles, connected to a Supabase database.

## Features
- Read articles with annotations
- Save vocabularies and notes
- Auto-syncs to Supabase Cloud Database

## Setup
1. Create a [Supabase](https://supabase.com) project.
2. Run the SQL script from `supabase/schema.sql` in the SQL Editor.
3. Rename `.env.example` to `.env` and fill in your Supabase credentials.

```bash
npm install
npm run dev
```

## Production Build
```bash
npm run build
```
