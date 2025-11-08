# Copilot Instructions: Photography Portfolio + Chatbot Integration

## Project Overview

This project is a **Photography Studio Website** with an **AI-powered chatbot assistant**. It consists of:

1. **Portfolio Website** (`/portfolio`) - A modern, elegant photography portfolio built with React, React Router, Framer Motion, and Tailwind CSS v4
2. **Chatbot System** (`/chatBot`) - An AI-powered conversational assistant with voice capabilities, built with Express.js (backend) and React (frontend)

## Current Architecture

### Portfolio Website (`/portfolio`)
- **Tech Stack**: React 19, React Router v7 (Data Router), Framer Motion, Tailwind CSS v4, Vite
- **Structure**:
  - `src/pages/` - Home, About, Portfolio, Contact pages
  - `src/layout.jsx` - Main layout with navigation bar and footer
  - `src/context/` - NavContext for controlling navigation visibility
  - React Router Data Mode with nested routes
- **Key Features**:
  - Smooth scroll animations with Framer Motion
  - Dynamic navigation that hides when portfolio filter bar becomes sticky
  - Responsive design with mobile menu
  - Gallery with category filtering (portraits, nature, events)

### Chatbot System (`/chatBot`)

#### Backend (`/chatBot/backend`)
- **Tech Stack**: Express.js, MongoDB, Google Gemini AI, Node.js
- **Key Features**:
  - AI-powered chat using Google Gemini (`@google/genai`)
  - Lead capture system (extracts name, email/phone, shoot type from conversations)
  - Session management with MongoDB
  - RESTful API endpoints:
    - `POST /api/chat` - Send messages and receive AI responses
    - `GET /api/messages/:session_id` - Retrieve chat history
    - `GET /api/portfolio` - Get portfolio items
    - `GET /api/packages` - Get photography packages
    - `POST /api/leads` - Save lead information
- **Database Collections**:
  - `conversations` - Chat history with session IDs
  - `leads` - Captured customer information
  - `portfolio` - Photography work samples
  - `packages` - Service packages and pricing

#### Frontend (`/chatBot/frontend`)
- **Tech Stack**: React 19, Shadcn UI, Axios, Sonner (toast notifications), Vite
- **Key Features**:
  - Real-time chat interface with message history
  - Voice input using Web Speech API (speech recognition)
  - Text-to-speech for bot responses
  - Session persistence using localStorage
  - Responsive design with Shadcn UI components

## Integration Task

### Goal
Integrate the chatbot system into the portfolio website as a **floating chat widget** that:
1. Appears as a small button/icon in the bottom-right corner of the portfolio website
2. Expands into a chat interface when clicked
3. Minimizes back to the button when closed
4. Persists session across page navigation
5. Maintains all existing chatbot features (AI conversation, voice input/output, lead capture)

### Technical Requirements

#### 1. **Component Structure**
- Create a new `ChatWidget` component in `/portfolio/src/components/`
- Make it a globally available component that floats above all pages
- Should not interfere with existing navigation or page content

#### 2. **State Management**
- Use React Context or state management to control widget visibility
- Persist chat state (open/closed, messages) across route changes
- Keep session ID in localStorage for continuity

#### 3. **UI/UX Design**
- **Closed State**: Floating button (bottom-right, ~60x60px) with a chat icon
- **Open State**: Chat panel (~350x500px on desktop, full-screen on mobile)
- Smooth animations using Framer Motion (consistent with portfolio animations)
- Match portfolio's design aesthetic (colors, fonts, spacing)
- Ensure z-index hierarchy doesn't conflict with navigation or modals

#### 4. **API Integration**
- Install necessary dependencies in portfolio project:
  - `axios` for API calls
  - `sonner` for toast notifications
  - Shadcn UI components (button, input, scroll-area)
- Create `/portfolio/src/services/chatApi.js` to handle backend communication
- Environment variable for backend URL: `VITE_CHATBOT_API_URL`

#### 5. **Backend Modifications**
- Update CORS settings in `/chatBot/backend/server.js` to allow portfolio website origin
- Ensure all necessary API endpoints are accessible
- No major backend changes needed (APIs are already built)

#### 6. **Feature Parity**
Ensure the integrated chatbot maintains:
- ✅ AI conversation with Google Gemini
- ✅ Message history (load previous messages on reopen)
- ✅ Voice input (microphone button, Web Speech API)
- ✅ Text-to-speech (toggle for bot voice responses)
- ✅ Lead capture (name, email/phone, shoot type)
- ✅ Session persistence across page loads
- ✅ Loading states and error handling
- ✅ Toast notifications for feedback

#### 7. **Mobile Responsiveness**
- On mobile: Full-screen overlay when chat is open
- On desktop: Fixed-position panel (bottom-right)
- Accessible close button
- Smooth transitions between states

### File Changes Needed

#### New Files to Create:
1. `/portfolio/src/components/ChatWidget.jsx` - Main chat widget component
2. `/portfolio/src/components/ChatButton.jsx` - Floating button (closed state)
3. `/portfolio/src/components/ChatPanel.jsx` - Expanded chat interface
4. `/portfolio/src/services/chatApi.js` - API communication layer
5. `/portfolio/src/context/ChatContext.jsx` - Chat state management
6. `/portfolio/.env` - Environment variables (add `VITE_CHATBOT_API_URL`)

#### Files to Modify:
1. `/portfolio/src/App.jsx` - Add ChatWidget to the app
2. `/portfolio/package.json` - Add dependencies (axios, sonner, etc.)
3. `/chatBot/backend/server.js` - Update CORS origins
4. `/chatBot/backend/.env` - Add portfolio URL to CORS_ORIGINS

### Design Guidelines

#### Color Scheme (match portfolio)
- Background: `#FAFAF9` (light gray)
- Primary: `#1a1a1a` or `#111827` (gray-900)
- Text: `#374151` (gray-700)
- Accent: Use existing portfolio accent colors

#### Typography
- Font: System font stack (same as portfolio)
- Match existing heading and body text sizes

#### Animation
- Use Framer Motion variants for smooth transitions
- Match animation duration and easing with portfolio (e.g., `duration: 0.3`)
- Button hover effects similar to portfolio CTA buttons

### Testing Checklist
- [ ] Chat widget appears on all pages
- [ ] Widget doesn't block important content
- [ ] Open/close animations are smooth
- [ ] Chat session persists across page navigation
- [ ] Messages load correctly from previous sessions
- [ ] Voice input works (with proper error handling)
- [ ] Text-to-speech works with toggle
- [ ] Lead capture extracts information correctly
- [ ] Mobile responsive (full-screen on small devices)
- [ ] No console errors or warnings
- [ ] Backend CORS allows portfolio origin
- [ ] All API calls succeed with proper error handling

## Important Context

### Portfolio Navigation Behavior
- The main navigation bar hides when the portfolio page's filter bar becomes sticky
- This is controlled by `NavContext` in `/portfolio/src/context/`
- Ensure chat widget has a higher z-index than navigation (z-50) but lower than modals

### Chatbot Session Management
- Session ID format: `session_{browserInfo}_{timestamp}_{randomId}`
- Stored in localStorage: key `photography_chat_session_id`
- Backend tracks conversations by session_id in MongoDB

### Lead Capture Logic
- Backend uses `<LEAD_INFO>` tags in AI responses to extract structured data
- Format: `{"name": "...", "email": "...", "phone": "...", "shoot_type": "...", "preferred_date": "...", "message": "..."}`
- Frontend should handle this gracefully (strip tags, save lead via API)

### Voice Features
- Speech Recognition: `webkitSpeechRecognition` or `SpeechRecognition`
- Requires HTTPS in production (or localhost)
- Graceful fallback if not supported (show error message, hide mic button)

## Development Commands

### Portfolio
```bash
cd /portfolio
npm install
npm run dev  # Runs on http://localhost:5173
```

### Chatbot Backend
```bash
cd /chatBot/backend
npm install
npm run dev  # Runs on http://localhost:5000
```

### Chatbot Frontend (for reference)
```bash
cd /chatBot/frontend
npm install
npm run dev  # Runs on http://localhost:5174
```

## Environment Variables

### Portfolio `.env`
```env
VITE_CHATBOT_API_URL=http://localhost:5000/api
```

### Backend `.env`
```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=photography_chatbot
GOOGLE_API_KEY=your_google_gemini_api_key
PORT=5000
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

## Additional Notes

- The portfolio website uses **React Router v7 Data Router** (not the older Routes/Route pattern)
- Tailwind CSS v4 is used (new `@import` syntax, no need for `tailwind.config.js`)
- Framer Motion is already installed and heavily used (leverage existing patterns)
- The chatbot UI in `/chatBot/frontend` can be used as a reference, but needs to be adapted to a widget format
- Prioritize UX: the chat widget should feel like a natural extension of the portfolio website, not a separate app

## Success Criteria

The integration is successful when:
1. A user can click the chat button and have a natural conversation with the AI
2. The chat widget feels native to the portfolio website (design consistency)
3. All chatbot features work seamlessly (AI, voice, lead capture)
4. The widget doesn't interfere with portfolio navigation or content
5. Mobile experience is smooth and intuitive
6. Session persistence works across page reloads and navigation

---

**Priority**: High  
**Complexity**: Medium  
**Estimated Effort**: 4-6 hours

Use this document as the source of truth for the integration. If you encounter ambiguities, refer to the existing code in `/portfolio` and `/chatBot` for patterns and conventions.
