from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional, Dict, Any
import uuid
import os
from pathlib import Path
from datetime import datetime
import logging
import wikipedia
import requests
from outils.commandes_vocales import VoiceCommandAgent, CommandResponse, create_default_config
from outils.ocr_processor import OCRProcessor
from outils.statistique_lecture import analyser_texte_lu
from outils.analyse_semantique import SemanticAnalyzer

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

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

# Initialiser l'analyseur sémantique
semantic_analyzer = SemanticAnalyzer(chroma_db_path="./chromadb_data")

# Dossier de sortie pour les fichiers OCR
OUTPUT_DIR = Path("./output_ocr")


class VoiceCommandRequest(BaseModel):
    """Requete de commande vocale"""
    command: str
    config: Optional[Dict[str, Any]] = None


class TextAnalysisRequest(BaseModel):
    """Requete d'analyse de texte"""
    texte: str


class WikipediaSearchRequest(BaseModel):
    """Requete de recherche Wikipedia"""
    nom: str
    langue: str = "fr"  # Langue par défaut: français


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
    max_pages: int = 32,
    generate_analysis: bool = True
):
    """
    Traite un fichier PDF avec l'API Mistral OCR et génère un markdown par page.
    Traite jusqu'à 32 pages par blocs de 8 pages pour contourner la limite API.
    Génère optionnellement un résumé et une carte mentale avec analyse sémantique.
    
    Args:
        file: Fichier PDF à traiter
        use_bbox_annotation: Activer l'annotation des images/graphiques
        use_document_annotation: Activer l'annotation du document (appliqué aux 8 premières pages)
        max_pages: Nombre maximum de pages à traiter (limite: 32 pages = 4 blocs de 8)
        generate_analysis: Générer le résumé et la carte mentale (défaut: True)
        
    Returns:
        JSON avec les chemins des fichiers générés, les métadonnées, le résumé et la mindmap
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
        
        response_data = {
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
        }
        
        # Générer l'analyse sémantique si demandé
        if generate_analysis and result['markdown_files']:
            logger.info("🧠 Démarrage de l'analyse sémantique...")
            try:
                # Créer un ID unique pour le document
                document_id = Path(result["output_dir"]).name
                logger.info(f"Document ID: {document_id}")
                logger.info(f"Nombre de fichiers markdown: {len(result['markdown_files'])}")
                
                # Analyser le document
                logger.info("Appel à semantic_analyzer.analyze_document()...")
                analysis_result = await semantic_analyzer.analyze_document(
                    markdown_files=result['markdown_files'],
                    document_id=document_id,
                    output_dir=Path(result["output_dir"])
                )
                
                logger.info("✓ Analyse sémantique terminée avec succès")
                
                # Ajouter les résultats d'analyse à la réponse
                response_data["data"]["analysis"] = {
                    "summary": analysis_result["summary"],
                    "mindmap": analysis_result["mindmap"],
                    "metrics": analysis_result["metrics"],
                    "files": analysis_result["files"]
                }
                response_data["message"] += f" | Analyse sémantique générée avec {analysis_result['metrics']['n_clusters']} clusters"
                
            except Exception as analysis_error:
                # Ne pas échouer complètement si l'analyse échoue
                logger.error(f"❌ Erreur lors de l'analyse sémantique: {str(analysis_error)}")
                logger.exception("Traceback complet de l'erreur d'analyse:")
                response_data["data"]["analysis_error"] = str(analysis_error)
                response_data["message"] += " | Erreur lors de l'analyse sémantique"
            finally:
                logger.info(f"🌍 Empreinte carbone de l'analyse sémantique: {emissions} kg CO2eq")
        return JSONResponse(content=response_data)
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erreur lors du traitement OCR: {str(e)}"
        )


@app.post("/api/stats/analyse-texte")
async def analyse_texte(request: TextAnalysisRequest):
    """
    Analyse un texte et retourne des statistiques de lecture détaillées.
    
    Args:
        request: Requête contenant le texte à analyser
        
    Returns:
        JSON avec toutes les statistiques du texte
    """
    if not request.texte or not request.texte.strip():
        raise HTTPException(
            status_code=400,
            detail="Le texte ne peut pas être vide"
        )
    
    try:
        # Analyser le texte avec la fonction de statistiques
        stats = analyser_texte_lu(request.texte)
        
        return JSONResponse(content={
            "success": True,
            "data": stats
        })
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erreur lors de l'analyse du texte: {str(e)}"
        )


@app.post("/api/wikipedia/search")
async def search_wikipedia(request: WikipediaSearchRequest):
    """
    Recherche une personne/sujet sur Wikipedia et retourne les premières lignes.
    
    Args:
        request: Requête contenant le nom à rechercher et la langue
        
    Returns:
        JSON avec la description, l'URL et d'autres informations
    """
    if not request.nom or not request.nom.strip():
        raise HTTPException(
            status_code=400,
            detail="Le nom ne peut pas être vide"
        )
    
    try:
        # Configurer la langue de Wikipedia
        wikipedia.set_lang(request.langue)
        
        # Rechercher la page
        try:
            # Recherche de la page exacte
            page = wikipedia.page(request.nom, auto_suggest=True)
            
            # Extraire le résumé (premières lignes)
            summary = wikipedia.summary(request.nom, sentences=3, auto_suggest=True)
            
            # Obtenir l'image principale si disponible
            images = page.images[:3] if page.images else []
            
            # Préparer la réponse
            response_data = {
                "success": True,
                "data": {
                    "titre": page.title,
                    "description": summary,
                    "url": page.url,
                    "images": images,
                    "categories": page.categories[:5] if hasattr(page, 'categories') else [],
                    "langue": request.langue,
                    "contenu_complet_disponible": True
                }
            }
            
            return JSONResponse(content=response_data)
            
        except wikipedia.DisambiguationError as e:
            # Page d'homonymie trouvée - retourner les options
            return JSONResponse(content={
                "success": False,
                "error": "disambiguation",
                "message": f"Plusieurs résultats trouvés pour '{request.nom}'",
                "options": e.options[:10],  # Limiter à 10 options
                "suggestion": "Veuillez préciser votre recherche"
            })
            
        except wikipedia.PageError:
            # Page non trouvée - essayer une recherche
            search_results = wikipedia.search(request.nom, results=5)
            
            if search_results:
                return JSONResponse(content={
                    "success": False,
                    "error": "page_not_found",
                    "message": f"Aucune page exacte trouvée pour '{request.nom}'",
                    "suggestions": search_results,
                    "suggestion": "Voici quelques suggestions"
                })
            else:
                raise HTTPException(
                    status_code=404,
                    detail=f"Aucun résultat trouvé pour '{request.nom}'"
                )
        
    except Exception as e:
        logger.error(f"Erreur lors de la recherche Wikipedia: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Erreur lors de la recherche: {str(e)}"
        )
