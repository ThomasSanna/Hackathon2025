# Zeendoc - Accessible Document Library

A modern document management system with advanced accessibility features built with Astro, React, and FastAPI.

## 📋 Table of Contents

- [Architecture Overview](#architecture-overview)
- [Project Structure](#project-structure)
- [Setup Instructions](#setup-instructions)
- [API Endpoints](#api-endpoints)
- [JSON Data Formats](#json-data-formats)
- [Features](#features)
- [Component Architecture](#component-architecture)

---

## 🏗️ Architecture Overview

### Technology Stack

**Frontend:**
- **Framework:** Astro (Static Site Generator with Islands Architecture)
- **UI Library:** React 18+ (for interactive components)
- **Styling:** CSS Modules with modern features (Grid, Flexbox, CSS Variables)
- **Carousel:** Swiper.js with Coverflow effect
- **Accessibility:** Handsfree.js for hands-free navigation

**Backend:**
- **Framework:** FastAPI (Python)
- **Authentication:** JWT Bearer tokens
- **Validation:** Pydantic models
- **CORS:** Enabled for localhost development

### System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (Astro)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Header     │  │   Carousel   │  │ ViewSwitcher │         │
│  │  (Auth UI)   │  │  (Preview)   │  │  (Filters)   │         │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘         │
│         │                  │                  │                  │
│         └──────────────────┴──────────────────┘                  │
│                            │                                     │
│         ┌──────────────────┴──────────────────┐                 │
│         │                                      │                 │
│  ┌──────▼──────────┐              ┌──────────▼─────────┐       │
│  │ DocumentExplorer│◄────────────►│     SplitView      │       │
│  │  (Grid/List)    │              │ (Detail + Config)  │       │
│  └─────────────────┘              └────────────────────┘       │
└─────────────────────────────────────────────────────────────────┘
                            │
                    HTTP/JSON (REST API)
                            │
┌─────────────────────────────────────────────────────────────────┐
│                      Backend (FastAPI)                          │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   /auth/     │  │   /config    │  │   /export    │         │
│  │   login      │  │   GET/POST   │  │   document   │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                  │
│  Authentication Layer (JWT)                                     │
│  Pydantic Validation Layer                                      │
│  Database Layer (User configs, favorites)                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
frontend/
├── react/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.astro           # Navigation + Auth UI
│   │   │   ├── Carousel.jsx           # Document carousel with favorites
│   │   │   ├── Carousel.css
│   │   │   ├── ViewSwitcher.jsx       # Grid/List view + Filters
│   │   │   ├── ViewSwitcher.css
│   │   │   ├── DocumentExplorer.jsx   # Main library component
│   │   │   ├── DocumentExplorer.css
│   │   │   ├── SplitView.jsx          # Detail view + accessibility
│   │   │   └── SplitView.css
│   │   ├── layouts/
│   │   │   └── Layout.astro           # Base layout with meta
│   │   ├── pages/
│   │   │   ├── index.astro            # Main page (SSG)
│   │   │   └── _output_2/             # Document storage
│   │   │       └── [document]/
│   │   │           ├── page_1.md
│   │   │           ├── *_metadata.json
│   │   │           └── images/
│   │   └── utils/
│   ├── public/
│   │   └── output_2/                  # Public document access
│   ├── astro.config.mjs
│   ├── package.json
│   └── README.md
├── BACKEND_ENDPOINT_EXAMPLE.py        # FastAPI reference implementation
└── requirements.txt                    # Python dependencies
```

---

## 🚀 Setup Instructions

### Frontend Setup

```bash
# Navigate to react directory
cd react

# Install dependencies
npm install

# Start development server
npm run dev
# Server runs at http://localhost:4321

# Build for production
npm run build

# Preview production build
npm run preview
```

### Backend Setup

```bash
# Navigate to frontend directory (where BACKEND_ENDPOINT_EXAMPLE.py is)
cd frontend

# Create virtual environment
python3 -m venv .venv

# Activate virtual environment
# Windows:
.venv\Scripts\activate
# Unix/MacOS:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run backend server
python BACKEND_ENDPOINT_EXAMPLE.py
# OR
uvicorn BACKEND_ENDPOINT_EXAMPLE:app --reload --host 0.0.0.0 --port 8000
# Server runs at http://localhost:8000
```

---

## 🌐 API Endpoints

### Base URL
```
http://localhost:8000
```

### 1. **Authentication**

#### `POST /api/auth/login`
User login with username.

**Request:**
```json
{
  "username": "john_doe"
}
```

**Response (Success - 200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "username": "john_doe"
}
```

**Response (Error - 401):**
```json
{
  "detail": "Invalid credentials"
}
```

**Frontend Usage:**
```javascript
const response = await fetch('http://localhost:8000/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ username: 'john_doe' })
});

const data = await response.json();
// Store token
localStorage.setItem('zeendoc_token', data.access_token);
localStorage.setItem('zeendoc_username', data.username);
```

---

### 2. **Configuration Management**

#### `GET /api/config`
Retrieve user's saved configuration and favorites.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (Success - 200):**
```json
{
  "status": "success",
  "config": {
    "espace_mot": 2,
    "espace_lettre": 1,
    "font": "OpenDyslexic",
    "interligne": 1.5,
    "alignement_texte": "gauche",
    "longueur_liseuse": 80,
    "theme": {
      "couleur_fond": "#FFF8DC",
      "couleur_texte": "#2C3E50",
      "couleur_surlignage": "#FFFF99"
    },
    "dyslexie": {
      "alternement_typo": true,
      "soulignement_syllabes": false,
      "phonemes": {
        "an": { "couleur": "#FF0000", "actif": true },
        "on": { "couleur": "#00CC00", "actif": true },
        "in": { "couleur": "#0066FF", "actif": false },
        "ou": { "couleur": "#FF6600", "actif": false },
        "oi": { "couleur": "#CC00FF", "actif": false },
        "eu": { "couleur": "#00CCCC", "actif": false },
        "ai": { "couleur": "#FFB300", "actif": false },
        "ui": { "couleur": "#FF0099", "actif": false },
        "gn": { "couleur": "#006633", "actif": false },
        "ill": { "couleur": "#9933FF", "actif": false },
        "eau": { "couleur": "#FF3333", "actif": false },
        "au": { "couleur": "#3399FF", "actif": false },
        "en": { "couleur": "#FFCC00", "actif": false }
      },
      "lettres_muettes": true
    },
    "semantique": {
      "nom_propre": true,
      "date_chiffre": true,
      "mot_long": false
    },
    "mode_p_p": false,
    "barre_progression": true,
    "focus_paragraphe": true,
    "regle_lecture": true,
    "ligne_focus": false,
    "daltonien": "Protanopie",
    "handsfree_mode": false
  },
  "favorites": ["doc_123", "doc_456", "doc_789"]
}
```

**Response (No config - 404):**
```json
{
  "status": "no_config",
  "message": "No configuration found for user"
}
```

**Response (Unauthorized - 401):**
```json
{
  "detail": "Could not validate credentials"
}
```

---

#### `POST /api/config`
Save/update user configuration and favorites.

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body (Full Config):**
```json
{
  "config": {
    "espace_mot": 2,
    "espace_lettre": 1,
    "font": "OpenDyslexic",
    "interligne": 1.5,
    "alignement_texte": "gauche",
    "longueur_liseuse": 80,
    "theme": {
      "couleur_fond": "#FFFFFF",
      "couleur_texte": "#000000",
      "couleur_surlignage": "#FFFF00"
    },
    "dyslexie": {
      "alternement_typo": false,
      "soulignement_syllabes": false,
      "phonemes": {
        "an": { "couleur": "#FF0000", "actif": false },
        "on": { "couleur": "#00CC00", "actif": false },
        "in": { "couleur": "#0066FF", "actif": false },
        "ou": { "couleur": "#FF6600", "actif": false },
        "oi": { "couleur": "#CC00FF", "actif": false },
        "eu": { "couleur": "#00CCCC", "actif": false },
        "ai": { "couleur": "#FFB300", "actif": false },
        "ui": { "couleur": "#FF0099", "actif": false },
        "gn": { "couleur": "#006633", "actif": false },
        "ill": { "couleur": "#9933FF", "actif": false },
        "eau": { "couleur": "#FF3333", "actif": false },
        "au": { "couleur": "#3399FF", "actif": false },
        "en": { "couleur": "#FFCC00", "actif": false }
      },
      "lettres_muettes": false
    },
    "semantique": {
      "nom_propre": false,
      "date_chiffre": false,
      "mot_long": false
    },
    "mode_p_p": false,
    "barre_progression": false,
    "focus_paragraphe": false,
    "regle_lecture": false,
    "ligne_focus": false,
    "daltonien": "Aucun",
    "handsfree_mode": false
  },
  "favorites": ["doc_123", "doc_456"]
}
```

**Request Body (Favorites Only):**
```json
{
  "favorites": ["doc_123", "doc_456", "doc_789"]
}
```

**Response (Success - 200):**
```json
{
  "status": "success",
  "message": "Configuration saved successfully"
}
```

**Response (Validation Error - 422):**
```json
{
  "detail": [
    {
      "loc": ["body", "config", "daltonien"],
      "msg": "Value must be one of: Aucun, Protanopie, Deutéranopie, Tritanopie, Monochromatisme",
      "type": "value_error"
    }
  ]
}
```

---

### 3. **Document Export**

#### `POST /api/export`
Export document with applied accessibility settings.

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request:**
```json
{
  "document_id": "doc_123",
  "format": "pdf",
  "apply_config": true
}
```

**Response (Success - 200):**
```json
{
  "status": "success",
  "download_url": "/downloads/doc_123_accessible.pdf",
  "expires_at": "2025-12-12T15:30:00Z"
}
```

---

## 📊 JSON Data Formats

### Document Metadata Format

**File:** `[document_name]_metadata.json`

```json
{
  "document_id": "pv_1995-09-29",
  "document_annotation": "Procès-verbal de réunion du conseil d'administration",
  "document_type": "administrative",
  "created_at": "1995-09-29",
  "pages": 12,
  "language": "fr",
  "images": [
    {
      "filename": "page_1_img_0.jpg",
      "page": 1,
      "alt_text": "Logo de l'organisation"
    },
    {
      "filename": "page_3_img_0.png",
      "page": 3,
      "alt_text": "Graphique des résultats trimestriels"
    }
  ],
  "tags": ["administration", "reunion", "1995"],
  "summary": "Compte rendu de la réunion du conseil d'administration du 29 septembre 1995 portant sur les résultats du trimestre et les projets en cours."
}
```

---

### Accessibility Configuration Schema

**Complete Configuration Object:**

```typescript
interface AccessibilityConfig {
  // Spacing Configuration
  espace_mot: number;              // Word spacing in pixels (0-20)
  espace_lettre: number;           // Letter spacing in pixels (0-10)
  interligne: number;              // Line height multiplier (1.0-3.0)
  
  // Typography
  font: "Arial" | "OpenDyslexic" | "Comic Sans MS" | "Verdana";
  alignement_texte: "gauche" | "centre" | "droite" | "justifie";
  longueur_liseuse: number;        // Reader width percentage (50-100)
  
  // Theme Colors
  theme: {
    couleur_fond: string;          // Background color (hex)
    couleur_texte: string;         // Text color (hex)
    couleur_surlignage: string;    // Highlight color (hex)
  };
  
  // Dyslexia Support
  dyslexie: {
    alternement_typo: boolean;     // Alternate letter colors
    soulignement_syllabes: boolean; // Underline syllables
    lettres_muettes: boolean;       // Highlight silent letters
    phonemes: {
      [key: string]: {             // 13 phoneme types
        couleur: string;           // Color for this phoneme
        actif: boolean;            // Enable/disable highlighting
      }
    }
  };
  
  // Semantic Highlighting
  semantique: {
    nom_propre: boolean;           // Highlight proper nouns
    date_chiffre: boolean;         // Highlight dates and numbers
    mot_long: boolean;             // Highlight long words
  };
  
  // Reading Aids
  mode_p_p: boolean;               // Paragraph-by-paragraph mode
  barre_progression: boolean;      // Progress bar
  focus_paragraphe: boolean;       // Focus on current paragraph
  regle_lecture: boolean;          // Reading ruler overlay
  ligne_focus: boolean;            // Focus on current line
  
  // Colorblindness Correction
  daltonien: "Aucun" | "Protanopie" | "Deutéranopie" | "Tritanopie" | "Monochromatisme";
  
  // Hands-free Mode
  handsfree_mode: boolean;         // Enable hands-free navigation
}
```

---

### Favorites Array Format

**Stored with user profile:**

```json
{
  "favorites": [
    "pv_1995-09-29",
    "compte-rendu-50-2003",
    "exportIr",
    "commission_bruxelles_96"
  ]
}
```

---

## 🎨 Features

### 1. **Authentication System**
- JWT-based authentication
- LocalStorage token persistence
- Auto-logout on token expiry
- Username-only login (demo mode)

### 2. **Document Library**
- Grid and List views
- Search functionality
- Sort by: Name, Date, Size, Type
- Filter by: All, Favorites, Recent, Archived
- Favorite/unfavorite documents
- Real-time synchronization across components

### 3. **Accessibility Configuration**

#### Daltonism Support
5 color blindness correction modes:
- Protanopia (Red-blind)
- Deuteranopia (Green-blind)
- Tritanopia (Blue-blind)
- Monochromatisme (Color-blind)
- None

Implementation using SVG filters applied to `<body>` element.

#### Dyslexia Features
- 13 phoneme highlighting with custom colors
- Syllable underlining
- Silent letter highlighting
- Typography alternation
- OpenDyslexic font support

#### Reading Aids
- Adjustable word/letter spacing
- Line height control
- Reading ruler overlay
- Line focus mode
- Paragraph focus mode
- Progress bar
- Paragraph-by-paragraph reading

### 4. **Hands-free Navigation**
- Handsfree.js integration
- Voice command support
- Gesture-based controls
- Enables: next/previous, zoom, scroll

### 5. **Document Export**
- Export with applied accessibility settings
- Multiple formats: PDF, DOCX, HTML
- Preserves custom styling and colors

---

## 🧩 Component Architecture

### Header Component
**File:** `Header.astro`

**Responsibilities:**
- Authentication UI (login modal)
- User profile display
- Search interface
- Voice control toggle
- Hands-free mode toggle

**Key Functions:**
```javascript
// Login handler
async function handleLogin(username) {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username })
  });
  
  const data = await response.json();
  localStorage.setItem('zeendoc_token', data.access_token);
  window.dispatchEvent(new CustomEvent('user-logged-in'));
}
```

---

### Carousel Component
**File:** `Carousel.jsx`

**Responsibilities:**
- 3D carousel preview using Swiper.js
- Favorite/unfavorite functionality
- Document export trigger
- Hover state management

**Props:**
```typescript
interface CarouselProps {
  documents: Array<{
    id: string;
    title: string;
    subtitle: string;
    preview: string;        // HTML content
    tag: string;
    summary: string;
  }>;
}
```

**State Management:**
```javascript
const [favorites, setFavorites] = useState([]);
const [hoveredSlide, setHoveredSlide] = useState(null);

// Auto-sync favorites with backend
useEffect(() => {
  if (!favoritesLoaded) return;
  saveFavoritesToBackend(favorites);
}, [favorites]);
```

---

### DocumentExplorer Component
**File:** `DocumentExplorer.jsx`

**Responsibilities:**
- Grid/List document display
- Configuration panel (8 sections)
- Accessibility settings management
- Real-time config application

**Configuration Sections:**
1. **Daltonisme** - Dropdown selector
2. **Police** - Font family selector
3. **Espacement** - 3 sliders (word, letter, line)
4. **Thème** - 3 color pickers
5. **Dyslexie** - 3 toggles + phoneme colors
6. **Sémantique** - 3 toggles
7. **Aides lecture** - 4 toggles
8. **Validation** - Send button

**Key Functions:**
```javascript
// Configuration change handler
const handleConfigChange = (path, value) => {
  setConfig(prev => {
    const newConfig = { ...prev };
    const keys = path.split('.');
    let current = newConfig;
    
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    return newConfig;
  });
};

// Save to backend
const validateConfiguration = async () => {
  const token = localStorage.getItem('zeendoc_token');
  const response = await fetch('http://localhost:8000/api/config', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ config })
  });
};
```

---

### SplitView Component
**File:** `SplitView.jsx`

**Responsibilities:**
- Full document preview
- Accessibility sidebar (identical to DocumentExplorer config)
- Real-time accessibility application
- Configuration persistence

**Props:**
```typescript
interface SplitViewProps {
  document: {
    id: string;
    preview: string;    // HTML content
    title: string;
    subtitle: string;
  };
  onClose: () => void;
}
```

**Modal Structure:**
```
┌────────────────────────────────────────────────────┐
│  [Close Button]                                    │
│  ┌────────────────────┬─────────────────────────┐ │
│  │                    │  Accessibility Sidebar  │ │
│  │   Document         │  ┌────────────────────┐ │ │
│  │   Preview          │  │ Daltonisme         │ │ │
│  │   (Markdown        │  │ Police             │ │ │
│  │    rendered)       │  │ Espacement         │ │ │
│  │                    │  │ Thème              │ │ │
│  │                    │  │ Dyslexie           │ │ │
│  │                    │  │ Sémantique         │ │ │
│  │                    │  │ Aides lecture      │ │ │
│  │                    │  │ [Valider]          │ │ │
│  │                    │  └────────────────────┘ │ │
│  └────────────────────┴─────────────────────────┘ │
└────────────────────────────────────────────────────┘
```

---

### ViewSwitcher Component
**File:** `ViewSwitcher.jsx`

**Responsibilities:**
- View mode toggle (Grid/List)
- Sort dropdown
- Filter dropdown
- Document filtering logic
- Favorites management

**State:**
```javascript
const [viewMode, setViewMode] = useState('grid');
const [sortBy, setSortBy] = useState('name');
const [filterBy, setFilterBy] = useState('all');
const [favorites, setFavorites] = useState([]);
```

**Filter Logic:**
```javascript
const filteredDocuments = documents
  .filter(doc => {
    if (filterBy === 'favorites') return favorites.includes(doc.id);
    if (filterBy === 'recent') return /* recent logic */;
    return true;
  })
  .sort((a, b) => {
    if (sortBy === 'name') return a.title.localeCompare(b.title);
    if (sortBy === 'date') return new Date(b.date) - new Date(a.date);
    return 0;
  });
```

---

## 🔄 Data Flow

### Authentication Flow

```
User clicks "Sign In"
      ↓
Header displays modal
      ↓
User enters username
      ↓
POST /api/auth/login
      ↓
Backend validates & returns JWT
      ↓
Frontend stores token in localStorage
      ↓
window.dispatchEvent('user-logged-in')
      ↓
All components reload user data
```

---

### Configuration Flow

```
User changes accessibility setting
      ↓
Component state updates (React)
      ↓
useEffect applies visual changes
      ↓
User clicks "Valider et envoyer"
      ↓
POST /api/config with full config
      ↓
Backend validates via Pydantic
      ↓
Backend stores in database
      ↓
Backend returns success
      ↓
Frontend shows success alert
```

---

### Favorites Flow

```
User clicks star icon
      ↓
favorites state updates
      ↓
useEffect triggers (after initial load)
      ↓
POST /api/config with favorites array
      ↓
Backend updates user favorites
      ↓
window.dispatchEvent('favorites-updated')
      ↓
All components sync their favorites state
```

---

## 🛠️ Development Commands

```bash
# Frontend
npm run dev          # Dev server with hot reload
npm run build        # Production build
npm run preview      # Preview production build
npm run astro check  # Type checking

# Backend
python BACKEND_ENDPOINT_EXAMPLE.py  # Run server
uvicorn app:main --reload            # Run with auto-reload
pytest                               # Run tests (if configured)
```

---

## 📝 Environment Variables

Create `.env` file in `react/` directory:

```env
PUBLIC_API_URL=http://localhost:8000
PUBLIC_ENABLE_HANDSFREE=true
```

---

## 🐛 Debugging

### Enable Console Logging

All components include extensive console logging:

```javascript
console.log('[ComponentName] Action:', data);
console.error('[ComponentName] ✗ Error:', error);
console.log('[ComponentName] ✓ Success:', result);
```

### Check Authentication

```javascript
// In browser console
localStorage.getItem('zeendoc_token');
localStorage.getItem('zeendoc_username');
```

### Verify API Connection

```bash
# Test backend health
curl http://localhost:8000

# Test authentication
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test"}'
```

---

## 📚 Additional Resources

- [Astro Documentation](https://docs.astro.build)
- [React Documentation](https://react.dev)
- [FastAPI Documentation](https://fastapi.tiangolo.com)
- [Swiper.js API](https://swiperjs.com/swiper-api)
- [Handsfree.js Documentation](https://handsfree.js.org)

---

## 📄 License

MIT License - see LICENSE file for details
