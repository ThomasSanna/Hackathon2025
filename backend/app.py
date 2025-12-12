from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional, Dict, Any
import uuid
import os
from pathlib import Path
from datetime import datetime
from outils.commandes_vocales import VoiceCommandAgent, CommandResponse, create_default_config
from outils.ocr_processor import OCRProcessor

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Initialiser l'agent de commandes vocales
voice_agent = VoiceCommandAgent()

# Initialiser le processeur OCR
ocr_processor = OCRProcessor()

# Dossier de sortie pour les fichiers OCR
OUTPUT_DIR = Path("./output_ocr")


class VoiceCommandRequest(BaseModel):
    """Requete de commande vocale"""
    command: str
    config: Optional[Dict[str, Any]] = None


@app.get("/")
async def read_root():
    return {"msg": "Hello from FastAPI"}


@app.post("/api/voice-command", response_model=CommandResponse)
async def process_voice_command(request: VoiceCommandRequest):
    """
    Traite une commande vocale et retourne l'action a effectuer
    
    Args:
        request: Requete contenant la commande vocale et la config optionnelle
        
    Returns:
        CommandResponse avec l'action detaillee et la config modifiee
    """
    if not request.command or not request.command.strip():
        raise HTTPException(status_code=400, detail="Commande vide")
    
    # Utiliser la config fournie ou créer une config par défaut
    config = request.config if request.config else create_default_config()
    
    # Traiter la commande avec l'agent IA
    response = voice_agent.process_command(config, request.command)
    
    return response


@app.post("/api/ocr/process")
async def process_pdf_ocr(
    file: UploadFile = File(...),
    use_bbox_annotation: bool = True,
    use_document_annotation: bool = True,
    max_pages: int = 8
):
    """
    Traite un fichier PDF avec l'API Mistral OCR et génère un markdown par page.
    
    Args:
        file: Fichier PDF à traiter
        use_bbox_annotation: Activer l'annotation des images/graphiques
        use_document_annotation: Activer l'annotation du document entier
        max_pages: Nombre maximum de pages pour document_annotation (limite API: 8)
        
    Returns:
        JSON avec les chemins des fichiers générés et les métadonnées
    """
    # Vérifier le type de fichier
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(
            status_code=400, 
            detail="Seuls les fichiers PDF sont acceptés"
        )
    
    try:
        # Lire le contenu du fichier
        pdf_content = await file.read()
        
        # Traiter le PDF avec OCR
        result = ocr_processor.process_pdf(
            pdf_content=pdf_content,
            filename=file.filename,
            output_base_dir=OUTPUT_DIR,
            use_bbox_annotation=use_bbox_annotation,
            use_document_annotation=use_document_annotation,
            max_pages=max_pages
        )
        
        return JSONResponse(content={
            "success": True,
            "message": f"PDF traité avec succès: {result['total_pages']} pages, {result['total_images']} images",
            "data": {
                "output_dir": result["output_dir"],
                "markdown_files": result["markdown_files"],
                "metadata_path": result["metadata_path"],
                "total_pages": result["total_pages"],
                "total_images": result["total_images"],
                "document_annotation": result["metadata"].get("document_annotation")
            }
        })
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erreur lors du traitement OCR: {str(e)}"
        )

