# FastAPI Backend Example for Configuration Endpoint
# Place this in your FastAPI backend

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Optional

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:4321"],  # Add your frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration Models
class ThemeConfig(BaseModel):
    couleur_fond: str
    couleur_texte: str
    couleur_surlignage: str

class PhonemeConfig(BaseModel):
    couleur: str
    actif: bool

class DyslexieConfig(BaseModel):
    alternement_typo: bool
    soulignement_syllabes: bool
    phonemes: Dict[str, PhonemeConfig]
    lettres_muettes: bool

class SemantiqueConfig(BaseModel):
    nom_propre: bool
    date_chiffre: bool
    mot_long: bool

class AccessibilityConfig(BaseModel):
    espace_mot: int
    espace_lettre: int
    font: str
    interligne: float
    alignement_texte: str
    longueur_liseuse: int
    theme: ThemeConfig
    dyslexie: DyslexieConfig
    semantique: SemantiqueConfig
    mode_p_p: bool
    barre_progression: bool
    focus_paragraphe: bool
    regle_lecture: bool
    ligne_focus: bool
    daltonien: str

# Store current configuration (in production, use a database)
current_config: Optional[AccessibilityConfig] = None

@app.post("/api/config")
async def update_config(config: AccessibilityConfig):
    """
    Receive and validate configuration from frontend
    """
    global current_config
    
    try:
        # Validate daltonien enum
        valid_daltonien = ["Aucun", "Protanopie", "Deutéranopie", "Tritanopie", "Monochromatisme"]
        if config.daltonien not in valid_daltonien:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid daltonien value. Must be one of: {valid_daltonien}"
            )
        
        # Store configuration
        current_config = config
        
        print("=" * 50)
        print("📋 Configuration received:")
        print(f"  Font: {config.font}")
        print(f"  Daltonisme: {config.daltonien}")
        print(f"  Word spacing: {config.espace_mot}px")
        print(f"  Letter spacing: {config.espace_lettre}px")
        print(f"  Line height: {config.interligne}")
        print(f"  Background: {config.theme.couleur_fond}")
        print(f"  Text color: {config.theme.couleur_texte}")
        print(f"  Reading ruler: {config.regle_lecture}")
        print(f"  Line focus: {config.ligne_focus}")
        print(f"  Paragraph focus: {config.focus_paragraphe}")
        print("=" * 50)
        
        # Here you can:
        # 1. Save to database
        # 2. Apply transformations
        # 3. Generate custom CSS
        # 4. Process text with dyslexia aids
        # etc.
        
        return {
            "status": "success",
            "message": "Configuration validée et appliquée avec succès",
            "config": config.dict()
        }
        
    except Exception as e:
        print(f"❌ Error processing configuration: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/config")
async def get_config():
    """
    Get current configuration
    """
    if current_config is None:
        return {
            "status": "no_config",
            "message": "No configuration set yet"
        }
    
    return {
        "status": "success",
        "config": current_config.dict()
    }

@app.get("/")
async def root():
    return {
        "message": "Accessibility Configuration API",
        "endpoints": {
            "POST /api/config": "Update configuration",
            "GET /api/config": "Get current configuration"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
