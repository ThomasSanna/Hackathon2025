# Backend API - Analyse de Documents PDF

API FastAPI pour l'extraction, l'analyse et la génération de résumés intelligents à partir de fichiers PDF.

## 🚀 Fonctionnalités

- **Extraction PDF → Markdown** : Conversion automatique de PDF en markdown structuré
- **Analyse sémantique** : Clustering K-means sur les embeddings pour réduire le contexte
- **Résumé intelligent** : Génération de résumé structuré avec Pydantic AI
- **Carte mentale** : Création automatique de cartes mentales au format Mermaid
- **ChromaDB** : Stockage et recherche vectorielle des documents

## 📦 Installation

```powershell
# Installer les dépendances
cd backend
pip install -r requirements.txt

# Configurer les variables d'environnement
cp .env.example .env
# Éditer .env avec vos clés API
```

## ⚙️ Configuration

Créez un fichier `.env` dans le dossier `backend/` :

```env
MISTRAL_API_KEY=votre_clé_api_mistral
```

Si vous utilisez Mistral via Ollama en local, pas besoin de clé API.

## 🏃 Démarrage

```powershell
# Depuis le dossier backend/
uvicorn app:app --reload --port 8000
```

L'API sera accessible sur `http://localhost:8000`

## 📚 Endpoints

### `POST /api/upload-pdf`

Upload et analyse complète d'un fichier PDF.

**Request:**
```
Content-Type: multipart/form-data
file: [fichier PDF]
```

**Response:**
```json
{
  "document_id": "document_abc123",
  "markdown_content": "# Titre du document\n\n...",
  "parsing_stats": {
    "pages_parsed": 10,
    "total_chars": 15000,
    "total_words": 2500,
    "average_quality": 0.95
  },
  "summary": {
    "title": "Titre du document",
    "summary": "Résumé en 2-3 phrases...",
    "key_concepts": [
      {
        "name": "Concept 1",
        "description": "Description...",
        "importance": 5
      }
    ],
    "main_themes": ["Thème 1", "Thème 2", "Thème 3"],
    "document_type": "Rapport"
  },
  "mind_map": {
    "central_theme": "Thème central",
    "branches": [...]
  },
  "mermaid_code": "mindmap\n  root((Thème))...",
  "analysis_stats": {
    "semantic_coverage": 85.5,
    "n_clusters": 5,
    "total_chunks": 25,
    "representative_chunks": 10,
    "reduction_percentage": 60.0
  }
}
```

### `POST /api/voice-command`

Traite une commande vocale pour le contrôle de la liseuse.

### `GET /api/voice-commands/available`

Liste des commandes vocales disponibles.

## 🧪 Test de l'API

### Avec curl (PowerShell)

```powershell
# Upload d'un PDF
curl -X POST http://localhost:8000/api/upload-pdf `
  -F "file=@chemin/vers/votre/document.pdf" `
  -H "accept: application/json"
```

### Avec Python

```python
import requests

url = "http://localhost:8000/api/upload-pdf"
files = {"file": open("document.pdf", "rb")}

response = requests.post(url, files=files)
print(response.json())
```

### Interface Swagger

Accédez à `http://localhost:8000/docs` pour l'interface interactive.

## 📁 Structure

```
backend/
├── app.py                    # Application FastAPI principale
├── requirements.txt          # Dépendances Python
├── .env                      # Configuration (à créer)
├── chromadb_data/           # Base ChromaDB (créé automatiquement)
└── outils/
    ├── pdf_parser.py        # Parsing PDF → Markdown
    ├── document_analyzer.py # Analyse IA et génération
    ├── commandes_vocales.py # Commandes vocales
    └── ...
```

## 🤖 Analyse IA - Fonctionnement

1. **Parsing PDF** : Extraction du texte et conversion en markdown structuré
2. **Chunking** : Découpage du markdown avec LangChain
3. **Embeddings** : Génération automatique via ChromaDB
4. **Clustering K-means** : Regroupement sémantique des chunks
5. **Sélection représentative** : Chunks les plus proches des centroïdes
6. **Génération résumé** : Pydantic AI avec Mistral pour résumé structuré
7. **Carte mentale** : Génération hiérarchique au format Mermaid

## 🔧 Dépannage

**Erreur : "No module named 'chromadb'"**
```powershell
pip install chromadb
```

**Erreur : "Mistral API key not found"**
- Vérifiez votre fichier `.env`
- Ou utilisez Ollama en local avec `mistral:mistral-large-latest`

**ChromaDB lock error**
- Arrêtez tous les processus qui utilisent ChromaDB
- Supprimez le dossier `chromadb_data/` et relancez

## 📊 Performance

- **Réduction de contexte** : ~60-80% des chunks originaux
- **Couverture sémantique** : >85% de l'information préservée
- **Temps de traitement** : ~5-15s pour un PDF de 10 pages (dépend du modèle IA)

## 🔐 Sécurité

- Limite de taille de fichier recommandée : 10 MB
- Validation du type MIME : uniquement PDF
- Nettoyage automatique des fichiers temporaires

## 📄 Licence

Ce projet fait partie du Hackathon 2025.
