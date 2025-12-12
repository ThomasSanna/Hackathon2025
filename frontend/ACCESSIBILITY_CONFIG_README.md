# Accessibility Configuration Panel - Documentation

## 🎨 Features Implemented

### 1. **Ultra-Modern Configuration Panel**
- Sliding panel from the right side
- Beautiful gradient header (purple/blue)
- Smooth animations and transitions
- Responsive design
- Scrollable content area

### 2. **Daltonism Support**
- **Protanopie** (Red color blindness)
- **Deutéranopie** (Green color blindness)  
- **Tritanopie** (Blue color blindness)
- **Monochromatisme** (Complete color blindness - grayscale)
- Real-time SVG filter application
- Applies to all images in the document

### 3. **Typography & Spacing**
- Font selection (Arial, OpenDyslexic, Comic Sans MS, Verdana)
- Word spacing slider (0-20px)
- Letter spacing slider (0-10px)
- Line height adjustment (1-3)

### 4. **Theme Customization**
- Background color picker
- Text color picker
- Highlight color picker

### 5. **Dyslexia Features**
- Typographic alternation toggle
- Syllable underlining toggle
- Silent letters marking toggle
- Phoneme coloring (13 different phonemes with custom colors)

### 6. **Reading Aids**
- Reading ruler
- Line focus
- Paragraph focus

### 7. **API Integration**
- FastAPI backend communication
- POST request to `/api/config`
- Full JSON configuration sent
- Console logging for debugging
- Success/error alerts

## 🚀 Usage

### Frontend

1. **Toggle Configuration Panel**
   - Click the floating gear button (top-right corner)
   - Panel slides in from the right

2. **Adjust Settings**
   - Select daltonism type
   - Change font
   - Adjust spacing with sliders
   - Pick theme colors
   - Toggle dyslexia features
   - Enable reading aids

3. **Validate Configuration**
   - Click "Valider et envoyer au serveur" in config panel
   - OR click "Valider la configuration" under preview
   - Configuration is sent to backend
   - Console logs show the process

### Backend Setup

1. **Install FastAPI** (if not already installed):
   ```bash
   pip install fastapi uvicorn pydantic
   ```

2. **Run the Backend**:
   ```bash
   python BACKEND_ENDPOINT_EXAMPLE.py
   ```
   Server will start on `http://localhost:8000`

3. **Update API URL** (if different):
   In `DocumentExplorer.jsx`, line ~107:
   ```javascript
   const apiUrl = 'http://localhost:8000/api/config';
   ```

## 📋 JSON Configuration Structure

```json
{
    "espace_mot": 0,
    "espace_lettre": 0,
    "font": "Arial",
    "interligne": 1,
    "alignement_texte": "gauche",
    "longueur_liseuse": 100,
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
            // ... 13 phonemes total
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
    "daltonien": "Aucun" // or "Protanopie", "Deutéranopie", "Tritanopie", "Monochromatisme"
}
```

## 🔍 Console Logs for Debugging

The implementation includes extensive console logging:

```javascript
// When toggling config panel
[DocumentExplorer] Toggling config panel: true/false

// When changing any setting
[DocumentExplorer] Config change: <path> = <value>
[DocumentExplorer] New config state: {...}

// When applying daltonism filter
[DocumentExplorer] Applying daltonism filter: <type>
[DocumentExplorer] Applied class: daltonism-<type>

// When validating configuration
[DocumentExplorer] Validating configuration...
[DocumentExplorer] Current config: {...}
[DocumentExplorer] Sending to: <url>
[DocumentExplorer] Response status: <code>
[DocumentExplorer] Response data: {...}
[DocumentExplorer] ✓ Configuration validated successfully
// OR
[DocumentExplorer] ✗ Validation failed: <error>
```

## 🎨 Design Highlights

### Colors
- Primary gradient: `#667eea` → `#764ba2` (purple/blue)
- Hover effects with scale transformations
- Smooth color transitions

### Animations
- Slide-in animation for panel (300ms)
- Rotate animation for gear button (90deg)
- Scale effects on hover
- Color transitions on all interactive elements

### Modern UI Elements
- Custom styled checkboxes (toggle switches)
- Gradient sliders with custom thumbs
- Color pickers with hover effects
- Icon-based section headers
- Floating action button

## 📱 Responsive Design

- Desktop: 420px width panel
- Mobile: Full-width panel
- Adjusted button sizes for touch
- Single-column color picker on mobile

## 🔧 Customization

### Change API Endpoint
```javascript
const apiUrl = 'http://your-api.com/api/config';
```

### Change Panel Width
```css
.config-panel {
    width: 420px; /* Change this value */
}
```

### Change Colors
```css
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
/* Change #667eea and #764ba2 to your colors */
```

## 🐛 Troubleshooting

1. **CORS Error**: Make sure your FastAPI backend has CORS enabled (see example)
2. **Configuration not sending**: Check browser console for errors
3. **Daltonism not applying**: Check if SVG filters are present in DOM
4. **Panel not showing**: Check if `showConfig` state is being set

## 📝 Files Modified

- `DocumentExplorer.jsx` - Main component with config panel
- `DocumentExplorer.css` - All styling including config panel
- `BACKEND_ENDPOINT_EXAMPLE.py` - FastAPI backend example

## 🎯 Next Steps

1. Connect to your actual backend
2. Implement configuration persistence (localStorage/database)
3. Apply configuration to actual document rendering
4. Add more accessibility features as needed
5. Test with real users who need accessibility features
