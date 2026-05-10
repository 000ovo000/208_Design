# Connect Feed and Upload

## Primary Prompt

Create a `ConnectPage` for a family sharing app where users can upload pet-related photos, write short captions, browse family updates, react with emoji feedback, and filter entries by time range. Support both demo-mode local data and backend API data. Keep the layout optimized for mobile screens, and include upload preview, deletion, grouped entries, and clear timestamps.

## Expected Output

- Feed page for family updates
- Image upload flow with preview
- Post deletion and reaction interactions
- Demo-mode fallback plus API-backed data loading

## Related Areas

- `src/app/pages/connect-page.tsx`
- `src/app/lib/demo-store.ts`
- `backend/routes/posts.js`
- `backend/routes/uploads.js`
