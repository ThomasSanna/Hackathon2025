"""
Module pour traiter les documents avec l'API Mistral OCR.
Génère un fichier markdown par page avec annotations.
"""

import os
import base64
import json
import yaml
from pathlib import Path
from typing import Dict, List, Tuple, Optional
from pydantic import BaseModel, Field
from enum import Enum
from mistralai import Mistral
from mistralai.models import OCRResponse
from mistralai.extra import response_format_from_pydantic_model
from dotenv import load_dotenv

# Charger les variables d'environnement depuis la racine du projet
# Remonter de 2 niveaux depuis backend/outils/ vers la racine
env_path = Path(__file__).parent.parent.parent / '.env'
load_dotenv(dotenv_path=env_path)


# Définition des types d'images pour BBox Annotation
class ImageType(str, Enum):
    GRAPH = "graph"
    CHART = "chart"
    TABLE = "table"
    SCHEMA = "schema"
    DIAGRAM = "diagram"
    FIGURE = "figure"
    IMAGE = "image"
    TEXT = "text"
    SIGNATURE = "signature"
    LOGO = "logo"


# Modèle pour l'annotation des BBox (images extraites)
class ImageAnnotation(BaseModel):
    image_type: ImageType = Field(..., description="Le type de l'image détectée")
    title: str = Field(..., description="Titre ou légende de l'image si disponible")
    short_description: str = Field(..., description="Description courte de l'image en français")
    detailed_description: str = Field(..., description="Description détaillée du contenu de l'image en français")
    data_extracted: str = Field(default="", description="Données extraites si c'est un tableau ou graphique")


# Modèle pour l'annotation du document complet
class DocumentAnnotation(BaseModel):
    language: str = Field(..., description="Langue du document en format ISO 639-1")
    title: str = Field(..., description="Titre principal du document")
    document_type: str = Field(..., description="Type de document (rapport, procès-verbal, contrat, etc.)")
    summary: str = Field(..., description="Résumé complet du document en français")
    key_points: List[str] = Field(..., description="Points clés du document")
    authors: List[str] = Field(default=[], description="Liste des auteurs ou signataires")
    date: str = Field(default="", description="Date du document si mentionnée")
    organizations: List[str] = Field(default=[], description="Organisations ou entités mentionnées")


class OCRProcessor:
    """Processeur OCR utilisant l'API Mistral."""
    
    def __init__(self, api_key: Optional[str] = None):
        """
        Initialise le processeur OCR.
        
        Args:
            api_key: Clé API Mistral (sinon chargée depuis .env)
        """
        self.api_key = api_key or os.getenv("MISTRAL_API_KEY")
        if not self.api_key:
            raise ValueError("MISTRAL_API_KEY non trouvée dans l'environnement")
        
        self.client = Mistral(api_key=self.api_key)
    
    @staticmethod
    def encode_file_to_base64(file_content: bytes) -> str:
        """Encode un contenu de fichier en base64."""
        return base64.b64encode(file_content).decode('utf-8')
    
    @staticmethod
    def save_base64_image(base64_string: str, output_path: Path) -> bool:
        """
        Sauvegarde une image base64 vers un fichier.
        
        Args:
            base64_string: Image encodée en base64
            output_path: Chemin de sortie
            
        Returns:
            True si succès
        """
        try:
            if base64_string.startswith('data:'):
                base64_string = base64_string.split(',', 1)[1]
            
            image_data = base64.b64decode(base64_string)
            
            with open(output_path, 'wb') as f:
                f.write(image_data)
            return True
        except Exception as e:
            print(f"Erreur lors de la sauvegarde de l'image: {e}")
            return False
    
    @staticmethod
    def parse_document_annotation(annotation_str: str) -> dict:
        """Parse l'annotation du document (JSON string) en dictionnaire."""
        if not annotation_str:
            return {}
        try:
            return json.loads(annotation_str)
        except:
            return {"raw": annotation_str}
    
    @staticmethod
    def parse_image_annotation(annotation_str: str) -> dict:
        """Parse l'annotation d'image (JSON string) en dictionnaire."""
        if not annotation_str:
            return {}
        try:
            return json.loads(annotation_str)
        except:
            return {"description": annotation_str}
    
    def generate_page_frontmatter(
        self,
        source_file: str,
        page_number: int,
        total_pages: int,
        document_annotation: str,
        page_images_info: List[dict]
    ) -> str:
        """
        Génère le frontmatter YAML pour une page individuelle.
        
        Args:
            source_file: Nom du fichier source
            page_number: Numéro de la page (1-indexed)
            total_pages: Nombre total de pages
            document_annotation: Annotation du document complet
            page_images_info: Liste des images de cette page
            
        Returns:
            Frontmatter YAML formaté
        """
        doc_data = self.parse_document_annotation(document_annotation)
        
        frontmatter = {
            "source_file": source_file,
            "page_number": page_number,
            "total_pages": total_pages,
            "total_images": len(page_images_info),
        }
        
        # Ajouter les données du document si disponibles
        if doc_data:
            if "title" in doc_data:
                frontmatter["document_title"] = doc_data.get("title", "")
            if "language" in doc_data:
                frontmatter["language"] = doc_data.get("language", "")
            if "document_type" in doc_data:
                frontmatter["document_type"] = doc_data.get("document_type", "")
            
            # Le résumé n'est inclus que sur la première page
            if page_number == 1:
                if "summary" in doc_data:
                    frontmatter["summary"] = doc_data.get("summary", "")
                if "key_points" in doc_data:
                    frontmatter["key_points"] = doc_data.get("key_points", [])
                if "authors" in doc_data:
                    frontmatter["authors"] = doc_data.get("authors", [])
                if "date" in doc_data:
                    frontmatter["date"] = doc_data.get("date", "")
                if "organizations" in doc_data:
                    frontmatter["organizations"] = doc_data.get("organizations", [])
        
        # Ajouter les annotations des images de cette page
        if page_images_info:
            images_data = []
            for img in page_images_info:
                img_entry = {
                    "id": img.get("id", ""),
                    "filename": img.get("filename", ""),
                }
                
                if "annotation" in img and img["annotation"]:
                    img_annotation = self.parse_image_annotation(img["annotation"])
                    if img_annotation:
                        img_entry["image_type"] = img_annotation.get("image_type", "")
                        img_entry["title"] = img_annotation.get("title", "")
                        img_entry["description"] = img_annotation.get("short_description", "") or img_annotation.get("description", "")
                        img_entry["detailed_description"] = img_annotation.get("detailed_description", "")
                        if "data_extracted" in img_annotation and img_annotation["data_extracted"]:
                            img_entry["data_extracted"] = img_annotation.get("data_extracted", "")
                
                images_data.append(img_entry)
            
            frontmatter["images"] = images_data
        
        yaml_content = yaml.dump(frontmatter, allow_unicode=True, default_flow_style=False, sort_keys=False)
        return f"---\n{yaml_content}---\n"
    
    def process_ocr_response_per_page(
        self,
        ocr_response: OCRResponse,
        output_dir: Path,
        source_filename: str = ""
    ) -> Tuple[List[Path], List[dict]]:
        """
        Traite la réponse OCR et génère un markdown par page avec frontmatter.
        
        Args:
            ocr_response: Réponse de l'API OCR
            output_dir: Dossier de sortie
            source_filename: Nom du fichier source
            
        Returns:
            Tuple (liste des chemins markdown, images_info)
        """
        images_dir = output_dir / "images"
        images_dir.mkdir(parents=True, exist_ok=True)
        
        markdown_paths = []
        all_images_info = []
        
        document_annotation = getattr(ocr_response, 'document_annotation', None)
        total_pages = len(ocr_response.pages)
        
        # D'abord, collecter et sauvegarder toutes les images
        for page_idx, page in enumerate(ocr_response.pages):
            for img_idx, img in enumerate(page.images):
                img_id = img.id
                
                if hasattr(img, 'image_base64') and img.image_base64:
                    base64_str = img.image_base64
                    
                    if base64_str.startswith('data:image/png'):
                        ext = '.png'
                    elif base64_str.startswith('data:image/jpeg') or base64_str.startswith('data:image/jpg'):
                        ext = '.jpg'
                    else:
                        ext = '.png'
                    
                    img_filename = f"page{page_idx + 1}_img{img_idx + 1}{ext}"
                    img_path = images_dir / img_filename
                    
                    if self.save_base64_image(base64_str, img_path):
                        img_info = {
                            "id": img_id,
                            "filename": img_filename,
                            "page": page_idx + 1,
                            "position": {
                                "top_left_x": getattr(img, 'top_left_x', None),
                                "top_left_y": getattr(img, 'top_left_y', None),
                                "bottom_right_x": getattr(img, 'bottom_right_x', None),
                                "bottom_right_y": getattr(img, 'bottom_right_y', None),
                            }
                        }
                        
                        if hasattr(img, 'image_annotation') and img.image_annotation:
                            img_info["annotation"] = img.image_annotation
                        
                        all_images_info.append(img_info)
        
        # Générer un fichier markdown par page
        for page_idx, page in enumerate(ocr_response.pages):
            page_number = page_idx + 1
            
            # Filtrer les images de cette page
            page_images = [img for img in all_images_info if img["page"] == page_number]
            
            # Générer le frontmatter pour cette page
            frontmatter = self.generate_page_frontmatter(
                source_file=source_filename,
                page_number=page_number,
                total_pages=total_pages,
                document_annotation=document_annotation,
                page_images_info=page_images
            )
            
            # Préparer les données des images pour le remplacement
            image_data = {}
            for img_info in page_images:
                img_id = img_info["id"]
                relative_path = f"images/{img_info['filename']}"
                
                alt_text = img_id
                if "annotation" in img_info and img_info["annotation"]:
                    img_annotation = self.parse_image_annotation(img_info["annotation"])
                    if img_annotation:
                        parts = []
                        if img_annotation.get("image_type"):
                            parts.append(f"[{img_annotation['image_type']}]")
                        if img_annotation.get("title"):
                            parts.append(img_annotation["title"])
                        elif img_annotation.get("short_description"):
                            parts.append(img_annotation["short_description"])
                        elif img_annotation.get("description"):
                            parts.append(img_annotation["description"])
                        
                        if parts:
                            alt_text = " - ".join(parts)
                
                image_data[img_id] = {
                    "path": relative_path,
                    "alt": alt_text
                }
            
            # Remplacer les références d'images dans le markdown
            page_markdown = page.markdown
            for img_id, data in image_data.items():
                old_ref = f"![{img_id}]({img_id})"
                new_ref = f"![{data['alt']}]({data['path']})"
                page_markdown = page_markdown.replace(old_ref, new_ref)
            
            # Combiner frontmatter et contenu
            full_content = frontmatter + "\n" + page_markdown
            
            # Sauvegarder le fichier markdown de la page
            page_filename = f"page_{page_number}.md"
            page_path = output_dir / page_filename
            
            with open(page_path, 'w', encoding='utf-8') as f:
                f.write(full_content)
            
            markdown_paths.append(page_path)
        
        return markdown_paths, all_images_info
    
    def process_pdf(
        self,
        pdf_content: bytes,
        filename: str,
        output_base_dir: Path,
        use_bbox_annotation: bool = True,
        use_document_annotation: bool = True,
        max_pages: int = 8
    ) -> Dict:
        """
        Traite un fichier PDF avec l'API Mistral OCR et génère un markdown par page.
        
        Args:
            pdf_content: Contenu binaire du PDF
            filename: Nom du fichier original
            output_base_dir: Dossier de base pour la sortie
            use_bbox_annotation: Activer l'annotation des images
            use_document_annotation: Activer l'annotation du document
            max_pages: Nombre maximum de pages pour document_annotation (limite: 8)
            
        Returns:
            Dictionnaire avec les résultats du traitement
        """
        base_name = Path(filename).stem
        output_dir = output_base_dir / base_name
        output_dir.mkdir(parents=True, exist_ok=True)
        
        # Encoder le fichier en base64
        base64_content = self.encode_file_to_base64(pdf_content)
        
        # Préparer la configuration du document
        document_config = {
            "type": "document_url",
            "document_url": f"data:application/pdf;base64,{base64_content}"
        }
        
        # Préparer les paramètres de l'appel OCR
        ocr_params = {
            "model": "mistral-ocr-latest",
            "document": document_config,
            "include_image_base64": True
        }
        
        # Ajouter les formats d'annotation si demandés
        if use_bbox_annotation:
            ocr_params["bbox_annotation_format"] = response_format_from_pydantic_model(ImageAnnotation)
        
        if use_document_annotation:
            ocr_params["document_annotation_format"] = response_format_from_pydantic_model(DocumentAnnotation)
            if max_pages is None: # Si non spécifié, pas de limité
                ocr_params["pages"] = None
            else : 
                ocr_params["pages"] = list(range(max_pages))
        
        # Appel à l'API OCR
        try:
            ocr_response = self.client.ocr.process(**ocr_params)
        except Exception as e:
            raise Exception(f"Erreur lors de l'OCR: {str(e)}")
        
        # Traiter la réponse et générer un markdown par page
        markdown_paths, images_info = self.process_ocr_response_per_page(
            ocr_response,
            output_dir,
            source_filename=filename
        )
        
        # Sauvegarder les métadonnées JSON globales
        metadata = {
            "source_file": filename,
            "total_pages": len(ocr_response.pages),
            "total_images": len(images_info),
            "document_annotation": ocr_response.document_annotation if hasattr(ocr_response, 'document_annotation') else None,
            "markdown_files": [str(p.name) for p in markdown_paths],
            "images": images_info
        }
        
        metadata_path = output_dir / f"{base_name}_metadata.json"
        with open(metadata_path, 'w', encoding='utf-8') as f:
            json.dump(metadata, f, indent=2, ensure_ascii=False)
        
        return {
            "output_dir": str(output_dir),
            "markdown_files": [str(p) for p in markdown_paths],
            "metadata_path": str(metadata_path),
            "total_pages": len(ocr_response.pages),
            "total_images": len(images_info),
            "metadata": metadata
        }
