# Chat, Care Messages, and Daily Drop

## Primary Prompt

Implement a `ChatPage` for the family pet companion app. The page should let family members send messages through the pet, receive care reminders, collect daily drop items, manage simple pet inventory, and display playful scene feedback. Support unread state, local demo mode, and backend integration for posts, care messages, pet messages, and reward-related interactions. Prioritize a lively interface with clear state transitions and user-friendly error handling.

## Expected Output

- Pet message relay flow
- Care message notifications and unread handling
- Daily drop claiming and inventory logic
- Demo-mode storage plus backend connectivity

## Related Areas

- `src/app/pages/chat-page.tsx`
- `src/app/data/daily-drops.ts`
- `src/app/data/weekly-rewards.ts`
- `backend/routes/care-messages.js`
- `backend/routes/pet-messages.js`
- `backend/routes/daily-drop.js`
- `backend/routes/items.js`
- `backend/routes/weekly-echo.js`
