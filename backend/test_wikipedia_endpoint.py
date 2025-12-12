"""
Script de test pour l'endpoint Wikipedia
"""
import requests
import json

BASE_URL = "http://localhost:8000"

def test_wikipedia_search(nom, langue="fr"):
    """Test de recherche Wikipedia"""
    url = f"{BASE_URL}/api/wikipedia/search"
    
    payload = {
        "nom": nom,
        "langue": langue
    }
    
    print(f"\n{'='*60}")
    print(f"Test de recherche: '{nom}' (langue: {langue})")
    print(f"{'='*60}")
    
    try:
        response = requests.post(url, json=payload)
        
        print(f"\nStatut: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(data)
        
        else:
            print(response.json())
    
    except requests.exceptions.ConnectionError:
        print("\n✗ ERREUR: Impossible de se connecter au serveur")
        print("Assurez-vous que le serveur FastAPI est démarré avec:")
        print("  uvicorn app:app --reload --port 8000")
    
    except Exception as e:
        print(f"\n✗ ERREUR: {str(e)}")


if __name__ == "__main__":
    # Tests avec différents noms
    
    # Test 1: Personne célèbre
    test_wikipedia_search("Albert Einstein", langue="fr")
    
    # Test 2: Lieu
    test_wikipedia_search("Paris", langue="fr")
    
    # Test 3: Concept
    test_wikipedia_search("Intelligence artificielle", langue="fr")
    
    # Test 4: Page avec désambiguïsation
    test_wikipedia_search("Python", langue="fr")
    
    # Test 5: Recherche en anglais
    test_wikipedia_search("Marie Curie", langue="en")
    
    # Test 6: Page inexistante
    test_wikipedia_search("Nom inexistant xyz123", langue="fr")
    
    print(f"\n{'='*60}")
    print("Tests terminés")
    print(f"{'='*60}\n")
