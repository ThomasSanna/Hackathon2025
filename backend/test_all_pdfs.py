"""
Script de test pour l'endpoint OCR sur plusieurs PDFs.
Teste tous les PDFs d'un dossier.
"""

import requests
import sys
from pathlib import Path
import time


def test_ocr_endpoint(pdf_path: Path, api_url: str = "http://localhost:8000"):
    """
    Teste l'endpoint OCR avec un fichier PDF.
    
    Args:
        pdf_path: Chemin vers le fichier PDF
        api_url: URL de base de l'API
    
    Returns:
        bool: True si le test réussit, False sinon
    """
    print(f"\n{'='*70}")
    print(f"📄 Test du fichier: {pdf_path.name}")
    print(f"{'='*70}")
    
    # Préparer le fichier pour l'envoi
    with open(pdf_path, 'rb') as f:
        files = {'file': (pdf_path.name, f, 'application/pdf')}
        
        # Paramètres optionnels
        data = {
            'use_bbox_annotation': 'true',
            'use_document_annotation': 'true',
            'max_pages': '32',
            'generate_analysis': 'true'
        }
        
        try:
            # Envoyer la requête POST
            print("⏳ Traitement en cours...")
            start_time = time.time()
            
            response = requests.post(
                f"{api_url}/api/ocr/process",
                files=files,
                data=data,
                timeout=600  # Timeout de 10 minutes
            )
            
            elapsed_time = time.time() - start_time
            
            # Vérifier la réponse
            if response.status_code == 200:
                result = response.json()
                
                print(f"\n✅ Succès! (en {elapsed_time:.1f}s)")
                print(f"Message: {result.get('message')}")
                
                data_result = result.get('data', {})
                print(f"\n📊 Résultats:")
                print(f"   - Dossier: {data_result.get('output_dir')}")
                print(f"   - Pages: {data_result.get('total_pages')}")
                print(f"   - Images: {data_result.get('total_images')}")
                print(f"   - Fichiers MD: {len(data_result.get('markdown_files', []))}")
                
                # Vérifier l'analyse
                if data_result.get('analysis'):
                    analysis = data_result['analysis']
                    print(f"\n🧠 Analyse sémantique:")
                    print(f"   - Clusters: {analysis.get('metrics', {}).get('n_clusters', 'N/A')}")
                    print(f"   - Résumé: {'✓' if analysis.get('summary') else '✗'}")
                    print(f"   - Mindmap: {'✓' if analysis.get('mindmap') else '✗'}")
                elif data_result.get('analysis_error'):
                    print(f"\n⚠️ Erreur d'analyse: {data_result['analysis_error']}")
                
                return True
                
            else:
                print(f"\n❌ Erreur {response.status_code}")
                print(response.text[:500])
                return False
                
        except requests.exceptions.Timeout:
            print(f"\n❌ Timeout (plus de 10 minutes)")
            return False
        except requests.exceptions.ConnectionError:
            print(f"\n❌ Impossible de se connecter à {api_url}")
            print("Vérifiez que le serveur FastAPI est bien démarré")
            return False
        except Exception as e:
            print(f"\n❌ Erreur: {e}")
            return False


def test_all_pdfs_in_folder(folder_path: str, api_url: str = "http://localhost:8000"):
    """
    Teste tous les PDFs d'un dossier.
    
    Args:
        folder_path: Chemin vers le dossier contenant les PDFs
        api_url: URL de base de l'API
    """
    folder = Path(folder_path)
    
    if not folder.exists():
        print(f"❌ Erreur: Le dossier {folder_path} n'existe pas")
        return
    
    # Trouver tous les PDFs
    pdf_files = list(folder.glob("*.pdf"))
    
    if not pdf_files:
        print(f"❌ Aucun fichier PDF trouvé dans {folder_path}")
        return
    
    print(f"🔍 {len(pdf_files)} fichiers PDF trouvés dans {folder.name}")
    print(f"🔗 API: {api_url}")
    
    # Demander confirmation
    print(f"\n⚠️ Attention: Le traitement de {len(pdf_files)} fichiers peut prendre beaucoup de temps.")
    response = input("Continuer? (o/n): ")
    
    if response.lower() != 'o':
        print("❌ Annulé par l'utilisateur")
        return
    
    # Tester chaque PDF
    results = []
    start_total = time.time()
    
    for i, pdf_file in enumerate(pdf_files, 1):
        print(f"\n\n{'#'*70}")
        print(f"Test {i}/{len(pdf_files)}")
        print(f"{'#'*70}")
        
        success = test_ocr_endpoint(pdf_file, api_url)
        results.append((pdf_file.name, success))
        
        # Pause entre les requêtes
        if i < len(pdf_files):
            print("\n⏸️ Pause de 2 secondes...")
            time.sleep(2)
    
    # Résumé final
    total_time = time.time() - start_total
    successful = sum(1 for _, success in results if success)
    failed = len(results) - successful
    
    print(f"\n\n{'='*70}")
    print(f"📊 RÉSUMÉ FINAL")
    print(f"{'='*70}")
    print(f"⏱️ Temps total: {total_time/60:.1f} minutes")
    print(f"✅ Réussis: {successful}/{len(results)}")
    print(f"❌ Échoués: {failed}/{len(results)}")
    
    if failed > 0:
        print(f"\n❌ Fichiers en échec:")
        for filename, success in results:
            if not success:
                print(f"   - {filename}")
    
    print(f"\n{'='*70}")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python test_all_pdfs.py <chemin_vers_dossier>")
        print("\nExemple:")
        print("  python test_all_pdfs.py ../ressources")
        print("  python test_all_pdfs.py C:\\Users\\thoma\\Desktop\\programmes\\Hackathon\\2025\\ressources")
        sys.exit(1)
    
    folder_path = sys.argv[1]
    test_all_pdfs_in_folder(folder_path)
