"""
Script de test pour l'endpoint OCR.
Envoie un PDF à l'API et affiche les résultats.
"""

import requests
import sys
from pathlib import Path


def test_ocr_endpoint(pdf_path: str, api_url: str = "http://localhost:8000"):
    """
    Teste l'endpoint OCR avec un fichier PDF.
    
    Args:
        pdf_path: Chemin vers le fichier PDF
        api_url: URL de base de l'API
    """
    pdf_file = Path(pdf_path)
    
    if not pdf_file.exists():
        print(f"❌ Erreur: Le fichier {pdf_path} n'existe pas")
        return
    
    if not pdf_file.suffix.lower() == '.pdf':
        print(f"❌ Erreur: Le fichier doit être un PDF")
        return
    
    print(f"📄 Envoi du fichier: {pdf_file.name}")
    print(f"🔗 URL: {api_url}/api/ocr/process")
    print("-" * 50)
    
    # Préparer le fichier pour l'envoi
    with open(pdf_file, 'rb') as f:
        files = {'file': (pdf_file.name, f, 'application/pdf')}
        
        # Paramètres optionnels
        data = {
            'use_bbox_annotation': 'true',
            'use_document_annotation': 'true',
            'max_pages': '32'
        }
        
        try:
            # Envoyer la requête POST
            print("⏳ Traitement en cours...")
            response = requests.post(
                f"{api_url}/api/ocr/process",
                files=files,
                data=data,
                timeout=300  # Timeout de 5 minutes
            )
            
            # Vérifier la réponse
            if response.status_code == 200:
                result = response.json()
                
                print("\n✅ Succès!")
                print("=" * 50)
                print(f"Message: {result.get('message')}")
                print("\n📊 Résultats:")
                
                data = result.get('data', {})
                print(f"   - Dossier de sortie: {data.get('output_dir')}")
                print(f"   - Total pages: {data.get('total_pages')}")
                print(f"   - Total images: {data.get('total_images')}")
                print(f"   - Fichiers markdown: {len(data.get('markdown_files', []))}")
                
                if data.get('markdown_files'):
                    print("\n📄 Fichiers markdown générés:")
                    for md_file in data.get('markdown_files', []):
                        print(f"   - {md_file}")
                
                print(f"\n📋 Métadonnées: {data.get('metadata_path')}")
                
                # Afficher l'annotation du document si disponible
                doc_annotation = data.get('document_annotation')
                if doc_annotation:
                    print("\n📝 Annotation du document:")
                    import json
                    try:
                        annotation = json.loads(doc_annotation)
                        if annotation.get('title'):
                            print(f"   - Titre: {annotation['title']}")
                        if annotation.get('language'):
                            print(f"   - Langue: {annotation['language']}")
                        if annotation.get('document_type'):
                            print(f"   - Type: {annotation['document_type']}")
                        if annotation.get('summary'):
                            print(f"   - Résumé: {annotation['summary'][:200]}...")
                    except:
                        print(f"   {doc_annotation[:200]}...")
                
            else:
                print(f"\n❌ Erreur {response.status_code}")
                print(response.text)
                
        except requests.exceptions.Timeout:
            print("\n❌ Erreur: Timeout de la requête (plus de 5 minutes)")
        except requests.exceptions.ConnectionError:
            print(f"\n❌ Erreur: Impossible de se connecter à {api_url}")
            print("Vérifiez que le serveur FastAPI est bien démarré")
        except Exception as e:
            print(f"\n❌ Erreur: {e}")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python test_ocr_endpoint.py <chemin_vers_pdf>")
        print("\nExemple:")
        print("  python test_ocr_endpoint.py ../ressources/cadastraux_paris_09_54.pdf")
        sys.exit(1)
    
    pdf_path = sys.argv[1]
    test_ocr_endpoint(pdf_path)
