"""
Module d'analyse sémantique avec K-means clustering et génération de résumé/carte mentale
"""
import numpy as np
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score
from sklearn.metrics.pairwise import cosine_similarity
from pydantic import BaseModel, Field
from typing import List, Dict, Any
from pydantic_ai import Agent
import chromadb
from langchain_text_splitters import MarkdownTextSplitter
import json
from pathlib import Path
import logging

# Configuration du logger
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)


# ============================================
# MODÈLES PYDANTIC POUR LE RÉSUMÉ
# ============================================

class KeyConcept(BaseModel):
    """Un concept clé extrait du document"""
    name: str = Field(description="Nom du concept")
    description: str = Field(description="Description brève du concept")
    importance: int = Field(description="Importance de 1 à 5", ge=1, le=5)


class DocumentSummary(BaseModel):
    """Résumé structuré d'un document"""
    title: str = Field(description="Titre ou sujet principal du document")
    summary: str = Field(description="Résumé concis en 2-3 phrases")
    key_concepts: List[KeyConcept] = Field(description="Concepts clés identifiés (3-5 concepts)")
    main_themes: List[str] = Field(description="Thèmes principaux abordés (3-5 thèmes)")
    document_type: str = Field(description="Type de document (rapport, procès-verbal, circulaire, etc.)")


# ============================================
# MODÈLES PYDANTIC POUR LA CARTE MENTALE
# ============================================

class MindMapNode(BaseModel):
    """Noeud de la carte mentale"""
    title: str = Field(description="Titre du noeud")
    children: List["MindMapNode"] = Field(default_factory=list, description="Sous-noeuds (2-4 enfants max)")


class MindMap(BaseModel):
    """Carte mentale complète"""
    central_theme: str = Field(description="Thème central de la carte mentale")
    branches: List[MindMapNode] = Field(description="Branches principales de la carte (3-5 branches)")


class SemanticAnalyzer:
    """Analyseur sémantique avec clustering et génération de résumé/mindmap"""
    
    def __init__(self, chroma_db_path: str = "./chromadb_data"):
        """
        Initialise l'analyseur sémantique
        
        Args:
            chroma_db_path: Chemin vers la base ChromaDB
        """
        self.client = chromadb.PersistentClient(path=chroma_db_path)
        self.collection = self.client.get_or_create_collection(name="ressources")
        self.splitter = MarkdownTextSplitter()
        
        # Agents Pydantic AI
        self.summary_agent = Agent(
            "mistral:mistral-large-latest",
            output_type=DocumentSummary,
            system_prompt="""Tu es un assistant expert en analyse documentaire française.
Tu dois analyser des extraits de documents et produire un résumé structuré.
Identifie le type de document, les thèmes principaux et les concepts clés.
Réponds toujours en français avec précision et concision."""
        )
        
        self.mindmap_agent = Agent(
            "mistral:mistral-large-latest",
            output_type=MindMap,
            system_prompt="""Tu es un expert en organisation de l'information et création de cartes mentales.
Tu dois analyser des documents et créer une carte mentale hiérarchique.
Organise l'information de manière logique avec un thème central et des branches.
Chaque branche peut avoir des sous-branches (2-3 niveaux max).
Réponds toujours en français."""
        )
    
    def add_document_to_collection(self, markdown_content: str, document_id: str, metadata: Dict[str, Any]):
        """
        Ajoute un document markdown à la collection ChromaDB en le découpant en chunks
        
        Args:
            markdown_content: Contenu markdown du document
            document_id: Identifiant unique du document
            metadata: Métadonnées du document
        """
        logger.info(f"Découpage du document {document_id} en chunks...")
        chunks = self.splitter.split_text(markdown_content)
        logger.info(f"Document découpé en {len(chunks)} chunks")
        
        for i, chunk in enumerate(chunks):
            chunk_metadata = {
                **metadata,
                "chunk_index": i
            }
            self.collection.add(
                documents=[chunk],
                metadatas=[chunk_metadata],
                ids=[f"{document_id}_chunk_{i}"]
            )
        
        logger.info(f"✓ Document {document_id} ajouté à la collection")
    
    def find_optimal_clusters(self, embeddings: np.ndarray, max_k: int = 15) -> int:
        """
        Trouve le nombre optimal de clusters avec la méthode silhouette
        
        Args:
            embeddings: Embeddings des chunks
            max_k: Nombre maximum de clusters à tester
            
        Returns:
            Nombre optimal de clusters
        """
        K_range = range(2, min(max_k, len(embeddings)))
        silhouette_scores = []
        
        for k in K_range:
            kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
            kmeans.fit(embeddings)
            silhouette_scores.append(silhouette_score(embeddings, kmeans.labels_))
        
        optimal_k = K_range[np.argmax(silhouette_scores)]
        return optimal_k
    
    def get_representative_chunks(self, document_id: str, n_per_cluster: int = 2):
        """
        Récupère les chunks représentatifs d'un document via clustering K-means
        
        Args:
            document_id: Identifiant du document
            n_per_cluster: Nombre de chunks à sélectionner par cluster
            
        Returns:
            Tuple (chunks représentatifs, métriques de couverture)
        """
        logger.info(f"Récupération des chunks pour {document_id}...")
        # Récupérer tous les chunks du document avec embeddings
        results = self.collection.get(
            where={"document_id": document_id},
            include=["embeddings", "documents", "metadatas"]
        )
        logger.info(f"Trouvé {len(results['ids']) if results['ids'] else 0} chunks")
        
        if not results['ids'] or len(results['ids']) < 2:
            # Pas assez de chunks pour le clustering
            metrics = {
                "coverage_percentage": 100.0,
                "n_clusters": 1,
                "total_chunks": len(results['documents']) if results['documents'] else 0,
                "representative_chunks": len(results['documents']) if results['documents'] else 0,
                "avg_similarity": 1.0
            }
            return results['documents'], metrics
        
        embeddings = np.array(results['embeddings'])
        documents = results['documents']
        metadatas = results['metadatas']
        ids = results['ids']
        
        # Trouver le nombre optimal de clusters
        logger.info("Recherche du nombre optimal de clusters...")
        n_clusters = self.find_optimal_clusters(embeddings)
        logger.info(f"Nombre optimal de clusters: {n_clusters}")
        
        # Appliquer K-Means
        logger.info("Application du K-Means clustering...")
        kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
        cluster_labels = kmeans.fit_predict(embeddings)
        logger.info("✓ Clustering terminé")
        
        # Organiser par cluster
        clusters = {}
        for idx, label in enumerate(cluster_labels):
            if label not in clusters:
                clusters[label] = []
            clusters[label].append({
                'id': ids[idx],
                'document': documents[idx],
                'metadata': metadatas[idx],
                'embedding': embeddings[idx]
            })
        
        # Sélectionner les chunks représentatifs (plus proches du centroïde)
        representative_chunks = []
        for cluster_id, items in clusters.items():
            centroid = kmeans.cluster_centers_[cluster_id]
            distances = [(np.linalg.norm(item['embedding'] - centroid), item) for item in items]
            distances.sort(key=lambda x: x[0])
            
            for dist, item in distances[:n_per_cluster]:
                representative_chunks.append(item)
        
        # Calculer la couverture sémantique
        selected_embeddings = np.array([chunk['embedding'] for chunk in representative_chunks])
        similarity_matrix = cosine_similarity(embeddings, selected_embeddings)
        max_similarities = similarity_matrix.max(axis=1)
        coverage_percentage = 100 * np.sum(max_similarities >= 0.7) / len(embeddings)
        
        metrics = {
            "coverage_percentage": float(coverage_percentage),
            "n_clusters": int(n_clusters),
            "total_chunks": len(documents),
            "representative_chunks": len(representative_chunks),
            "avg_similarity": float(np.mean(max_similarities))
        }
        
        return [chunk['document'] for chunk in representative_chunks], metrics
    
    async def generate_summary(self, context: str, metrics: Dict[str, Any]) -> DocumentSummary:
        """
        Génère un résumé structuré avec Pydantic AI
        
        Args:
            context: Contexte textuel des chunks représentatifs
            metrics: Métriques de couverture sémantique
            
        Returns:
            Résumé structuré
        """
        logger.info("Génération du résumé avec Pydantic AI...")
        prompt = f"""Analyse les extraits de documents suivants et génère un résumé structuré.

📊 Ces extraits représentent {metrics['coverage_percentage']:.1f}% de l'information sémantique totale
   ({metrics['representative_chunks']} chunks représentatifs sur {metrics['total_chunks']} au total).

=== EXTRAITS DES DOCUMENTS ===
{context}
=== FIN DES EXTRAITS ===

Génère un résumé complet avec:
- Un titre descriptif
- Un résumé en 2-3 phrases
- Les concepts clés (3-5)
- Les thèmes principaux (3-5)
- Le type de document"""

        try:
            result = await self.summary_agent.run(prompt)
            logger.info("✓ Résumé généré avec succès")
            return result.output
        except Exception as e:
            logger.error(f"Erreur lors de la génération du résumé: {str(e)}")
            raise
    
    async def generate_mindmap(self, context: str, summary: DocumentSummary) -> MindMap:
        """
        Génère une carte mentale avec Pydantic AI
        
        Args:
            context: Contexte textuel des chunks représentatifs
            summary: Résumé du document
            
        Returns:
            Carte mentale structurée
        """
        logger.info("Génération de la carte mentale avec Pydantic AI...")
        themes_str = ", ".join(summary.main_themes)
        concepts_str = ", ".join([c.name for c in summary.key_concepts])
        
        prompt = f"""Crée une carte mentale hiérarchique basée sur les documents suivants.

📌 Contexte du résumé:
- Titre: {summary.title}
- Type: {summary.document_type}
- Thèmes identifiés: {themes_str}
- Concepts clés: {concepts_str}

=== EXTRAITS DES DOCUMENTS ===
{context}
=== FIN DES EXTRAITS ===

Génère une carte mentale avec:
- Un thème central représentatif
- 3 à 5 branches principales
- Chaque branche peut avoir 2-4 sous-branches
- Maximum 3 niveaux de profondeur"""

        try:
            result = await self.mindmap_agent.run(prompt)
            logger.info("✓ Carte mentale générée avec succès")
            return result.output
        except Exception as e:
            logger.error(f"Erreur lors de la génération de la carte mentale: {str(e)}")
            raise
    
    def generate_mermaid_mindmap(self, mind_map: MindMap) -> str:
        """
        Génère le code Mermaid pour la carte mentale
        
        Args:
            mind_map: Carte mentale structurée
            
        Returns:
            Code Mermaid
        """
        lines = ["mindmap", f"  root(({mind_map.central_theme}))"]
        
        def add_node(node: MindMapNode, level: int = 2):
            indent = "  " * level
            title = node.title.replace("(", "[").replace(")", "]")
            lines.append(f"{indent}{title}")
            for child in node.children:
                add_node(child, level + 1)
        
        for branch in mind_map.branches:
            add_node(branch)
        
        return "\n".join(lines)
    
    async def analyze_document(self, markdown_files: List[str], document_id: str, output_dir: Path):
        """
        Analyse complète d'un document: clustering, résumé et carte mentale
        
        Args:
            markdown_files: Liste des fichiers markdown à analyser
            document_id: Identifiant du document
            output_dir: Dossier de sortie pour les résultats
            
        Returns:
            Dict avec les résultats de l'analyse
        """
        logger.info(f"🚀 Début de l'analyse sémantique pour {document_id}")
        logger.info(f"Nombre de fichiers markdown: {len(markdown_files)}")
        
        try:
            # Ajouter tous les fichiers markdown à la collection
            logger.info("📄 Ajout des documents à la collection ChromaDB...")
            for i, md_file in enumerate(markdown_files, 1):
                logger.info(f"  Traitement du fichier {i}/{len(markdown_files)}: {Path(md_file).name}")
                with open(md_file, "r", encoding="utf-8") as f:
                    content = f.read()
                    metadata = {
                        "document_id": document_id,
                        "file_path": str(md_file)
                    }
                    self.add_document_to_collection(content, document_id, metadata)
            
            # Récupérer les chunks représentatifs
            logger.info("🔍 Extraction des chunks représentatifs...")
            representative_chunks, metrics = self.get_representative_chunks(document_id)
            logger.info(f"✓ {len(representative_chunks)} chunks représentatifs extraits")
            
            # Préparer le contexte
            logger.info("📝 Préparation du contexte...")
            context = "\n---\n".join(representative_chunks)
            logger.info(f"Contexte préparé: {len(context)} caractères")
            
            # Générer le résumé
            logger.info("🤖 Génération du résumé IA...")
            summary = await self.generate_summary(context, metrics)
            
            # Générer la carte mentale
            logger.info("🗺️ Génération de la carte mentale IA...")
            mindmap = await self.generate_mindmap(context, summary)
            
            # Générer le code Mermaid
            logger.info("📊 Génération du code Mermaid...")
            mermaid_code = self.generate_mermaid_mindmap(mindmap)
            logger.info("✓ Code Mermaid généré")
        
            # Sauvegarder les résultats
            logger.info("💾 Sauvegarde des résultats...")
            analysis_result = {
                "metadata": {
                    "document_id": document_id,
                    "source_files": [str(md_file) for md_file in markdown_files],
                    **metrics
                },
                "summary": summary.model_dump(),
                "mind_map": mindmap.model_dump()
            }
            
            # Sauvegarder le JSON
            json_path = output_dir / "analysis_result.json"
            with open(json_path, "w", encoding="utf-8") as f:
                json.dump(analysis_result, f, ensure_ascii=False, indent=2)
            logger.info(f"✓ Résultat JSON sauvegardé: {json_path}")
            
            # Sauvegarder la carte mentale Mermaid
            mindmap_dir = output_dir / "mind_map"
            mindmap_dir.mkdir(parents=True, exist_ok=True)
            mindmap_path = mindmap_dir / "mind_map.md"
            with open(mindmap_path, "w", encoding="utf-8") as f:
                f.write(f"# Carte Mentale - {summary.title}\n\n")
                f.write("```mermaid\n")
                f.write(mermaid_code)
                f.write("\n```\n")
            logger.info(f"✓ Carte mentale sauvegardée: {mindmap_path}")
            
            logger.info(f"🎉 Analyse sémantique terminée avec succès pour {document_id}")
            
            return {
                "summary": summary.model_dump(),
                "mindmap": mindmap.model_dump(),
                "metrics": metrics,
                "files": {
                    "analysis_json": str(json_path),
                    "mindmap_md": str(mindmap_path)
                }
            }
        
        except Exception as e:
            logger.error(f"❌ Erreur lors de l'analyse sémantique de {document_id}: {str(e)}")
            logger.exception("Traceback complet:")
            raise
