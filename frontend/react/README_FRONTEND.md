# Zeendoc - Document Library Viewer

A modern, accessible document viewer built with Astro and React, featuring an interactive 3D carousel and accessibility-focused reading modes.

## 🏗️ Architecture Overview

This project uses **Astro** as the primary framework with **React** components for interactive features. The architecture follows a hybrid approach:
- **Astro** handles routing, SSR, and static content
- **React** provides interactive components (carousel, modals)
- **Swiper.js** powers the 3D coverflow carousel effect

## 📁 Project Structure

```text
react/
├── public/
│   └── output_2/                    # Static document assets (images)
│       └── {document}.Zeendoc/
│           ├── images/              # Document page images
│           └── ...
├── src/
│   ├── assets/                      # Static assets (logos, icons)
│   ├── components/                  # Reusable UI components
│   │   ├── Carousel.jsx             # Main 3D carousel (React + Swiper)
│   │   ├── Carousel.css             # Carousel styling
│   │   ├── SplitView.jsx            # Accessibility modal (React)
│   │   ├── SplitView.css            # Modal styling
│   │   ├── Header.astro             # Fixed navigation header
│   │   ├── Hero.astro               # Landing hero section
│   │   ├── Grid.jsx                 # Grid layout component
│   │   └── Grid.css                 # Grid styling
│   ├── layouts/
│   │   ├── Layout.astro             # Base HTML wrapper
│   │   └── ReaderLayout.astro       # Document reader layout
│   └── pages/                       # File-based routing
│       ├── index.astro              # Homepage with carousel
│       ├── output_2/                # Document markdown files
│       │   └── {document}.Zeendoc/
│       │       ├── page_1.md        # Document pages (markdown)
│       │       ├── page_2.md
│       │       └── {document}_metadata.json
│       └── reader/
│           └── [id].astro           # Dynamic document reader
├── astro.config.mjs                 # Astro configuration
├── package.json                     # Dependencies
└── tsconfig.json                    # TypeScript configuration
```

## 🎨 Component Architecture

### 1. **Carousel.jsx** (Main Feature)
- **Purpose**: Interactive 3D document carousel using Swiper.js
- **Features**:
  - Coverflow effect with 3D transformations
  - Document preview rendering (markdown → HTML)
  - Favorite/bookmark functionality (star icon)
  - Export functionality
  - Expandable summaries
  - Click to open accessibility modal
- **State Management**:
  - `expandedSlide`: Tracks which summary is expanded
  - `selectedSplitSlide`: Controls SplitView modal
  - `favorites`: Array of favorited document IDs
- **Key Dependencies**: `swiper`, `marked` (markdown parser)

### 2. **SplitView.jsx** (Accessibility Modal)
- **Purpose**: Popup modal for accessible document viewing
- **Features**:
  - Full document preview (centered, fills available space)
  - Accessibility options sidebar (Visual, Auditory, Cognitive)
  - Checkbox filters for different handicaps
  - Glass-morphism UI with smooth animations
- **Layout**: 65% content area + 35% sidebar
- **State**: `selectedHandicaps` for accessibility preferences

### 3. **Header.astro** (Navigation)
- **Purpose**: Fixed top navigation bar
- **Features**:
  - Logo and branding ("Zeendoc")
  - Navigation links (Library, Search, About, Archive)
  - Upload document CTA button
- **Styling**: Glass-morphism with backdrop blur

### 4. **Layout.astro** (Base Template)
- **Purpose**: HTML wrapper for all pages
- **Features**:
  - Global meta tags and SEO
  - Font imports
  - CSS reset
  - Slot for page content

### 5. **index.astro** (Homepage)
- **Purpose**: Main landing page with document carousel
- **Features**:
  - Reads `output_2` folder for documents
  - Parses markdown files (page_1.md) for previews
  - Extracts metadata from JSON files
  - Image path rewriting for static serving
  - Passes document data to Carousel component

## 🔄 Data Flow

```
1. Server-Side (Astro)
   └─> index.astro reads output_2/ folder
       └─> Parses page_1.md for each document
           └─> Converts markdown to HTML (marked library)
               └─> Extracts metadata (title, subtitle, tag)
                   └─> Passes documents array to Carousel

2. Client-Side (React)
   └─> Carousel.jsx receives documents prop
       └─> Renders Swiper slides with previews
           └─> User clicks slide
               └─> Opens SplitView modal
                   └─> Displays full document with accessibility options
```

## 🎯 Key Features

### Interactive Carousel
- **Coverflow Effect**: 3D rotating cards with depth perception
- **Navigation**: Left/right arrows (orange accent color)
- **Active Slide**: Highlighted with full opacity and scale
- **Preview Content**: First page of each document rendered as HTML

### Accessibility Focus
- **Modal Interface**: Dedicated reading view with customization
- **Handicap Options**:
  - Visual (Blind/Low Vision, Color Blindness)
  - Auditory (Deaf/Hard of Hearing)
  - Cognitive (Dyslexia, Attention Disorders)
- **Future**: AI-powered document transformations based on selections

### Document Management
- **Favorites**: Star icon to bookmark documents (persisted in state)
- **Export**: Download/export functionality (placeholder)
- **Metadata Display**: Title, subtitle, tag, summary overlay

## 🎨 Styling Approach

- **CSS Modules**: Component-scoped styles (`.css` files per component)
- **Design System**:
  - Primary Color: `#FF6B35` (Orange accent)
  - Favorites: `#FFD700` (Gold star)
  - Glass-morphism: `backdrop-filter: blur()` with transparency
  - Typography: System fonts (SF Pro, Segoe UI) for modern look
- **Responsive**: Mobile-first with breakpoints (TODO)

## 🚀 Commands

| Command                | Action                                          |
| :--------------------- | :---------------------------------------------- |
| `npm install`          | Install dependencies                            |
| `npm run dev`          | Start dev server at `localhost:4321`            |
| `npm run build`        | Build production site to `./dist/`              |
| `npm run preview`      | Preview production build locally                |

## 📦 Dependencies

### Core Framework
- `astro` (5.16.5): Static site generator with SSR
- `@astrojs/react`: React integration for Astro

### React & UI
- `react`, `react-dom`: UI library
- `swiper`: Carousel/slider library
- `marked`: Markdown to HTML parser

### Development
- `@types/node`: Node.js type definitions
- TypeScript support

## 🔧 Configuration

### Astro Config (`astro.config.mjs`)
```js
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

export default defineConfig({
  integrations: [react()],
});
```

### Key Routes
- `/` - Homepage with carousel
- `/reader/[id]` - Document reader (dynamic route)
- `/output_2/` - Document data (markdown + images)

## 📝 Document Format

Documents follow this structure:
```
output_2/
└── {document-name}.Zeendoc/
    ├── {document-name}_metadata.json    # Title, author, date, etc.
    ├── page_1.md                        # Markdown content (used for preview)
    ├── page_2.md
    ├── ...
    └── images/
        ├── page1_img1.jpg
        └── ...
```

**Metadata JSON Example**:
```json
{
  "title": "Document Title",
  "subtitle": "Document Subtitle",
  "tag": "Category",
  "summary": "Brief description of the document..."
}
```

## 🎯 Future Enhancements

- [ ] AI-powered accessibility transformations
- [ ] Backend API integration for document processing
- [ ] User authentication and profile management
- [ ] Document search and filtering
- [ ] Mobile responsive design
- [ ] Keyboard navigation for carousel
- [ ] Screen reader optimization
- [ ] Export to multiple formats (PDF, DOCX, etc.)

## 👥 Contributing

This project was built for a hackathon focusing on accessibility and document management.

---

**Built with** ❤️ **using Astro, React, and Swiper.js**
