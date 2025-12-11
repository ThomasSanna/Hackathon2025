"""
Script de test pour l'analyse sémantique
"""
import asyncio
import logging
from pathlib import Path
from dotenv import load_dotenv
from outils.analyse_semantique import SemanticAnalyzer

# Charger les variables d'environnement
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

async def test_semantic_analysis():
    """Teste l'analyse sémantique sur un document existant"""
    
    # Trouver un dossier de sortie existant avec des fichiers markdown
    output_base = Path("./output_ocr")
    
    if not output_base.exists():
        logger.error(f"Dossier {output_base} introuvable")
        return
    
    # Chercher le premier dossier avec des fichiers markdown
    for doc_dir in output_base.iterdir():
        if doc_dir.is_dir():
            md_files = list(doc_dir.glob("page_*.md"))
            
            if md_files:
                logger.info(f"\n{'='*60}")
                logger.info(f"Test sur le document: {doc_dir.name}")
                logger.info(f"Nombre de fichiers markdown: {len(md_files)}")
                logger.info(f"{'='*60}\n")
                
                # Initialiser l'analyseur
                analyzer = SemanticAnalyzer(chroma_db_path="./chromadb_data")
                
                try:
                    # Lancer l'analyse
                    result = await analyzer.analyze_document(
                        markdown_files=[str(f) for f in md_files],
                        document_id=doc_dir.name,
                        output_dir=doc_dir
                    )
                    
                    logger.info(f"\n{'='*60}")
                    logger.info("✅ ANALYSE TERMINÉE AVEC SUCCÈS")
                    logger.info(f"{'='*60}")
                    logger.info(f"Titre: {result['summary']['title']}")
                    logger.info(f"Type: {result['summary']['document_type']}")
                    logger.info(f"Clusters: {result['metrics']['n_clusters']}")
                    logger.info(f"Couverture: {result['metrics']['coverage_percentage']:.1f}%")
                    logger.info(f"Fichiers générés:")
                    logger.info(f"  - {result['files']['analysis_json']}")
                    logger.info(f"  - {result['files']['mindmap_md']}")
                    logger.info(f"{'='*60}\n")
                    
                    return result
                    
                except Exception as e:
                    logger.error(f"❌ ÉCHEC DE L'ANALYSE: {str(e)}")
                    logger.exception("Traceback complet:")
                    return None
    
    logger.warning("Aucun document avec des fichiers markdown trouvé dans output_ocr/")

if __name__ == "__main__":
    asyncio.run(test_semantic_analysis())
