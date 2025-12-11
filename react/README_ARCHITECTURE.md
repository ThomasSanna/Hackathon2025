# Documentation Architecture Frontend (Liseuse Astro)

Ce projet est une application **Astro** conçue pour servir de liseuse de documents numérisés et convertis en Markdown.

## Structure du Projet

```
react/
├── public/              # Fichiers statiques (images, favicon, etc.) servis à la racine
├── src/
│   ├── assets/          # Assets compilés (images, polices importées dans le JS/CSS)
│   ├── components/      # Composants UI réutilisables
│   │   └── Welcome.astro # (Exemple) Composant d'accueil par défaut
│   ├── layouts/         # Gabarits de mise en page (Squelettes HTML)
│   │   ├── Layout.astro       # Layout principal pour l'accueil
│   │   └── ReaderLayout.astro # Layout spécifique pour la liseuse (styles livre, polices)
│   └── pages/           # Routes de l'application (File-based routing)
│       ├── index.astro        # Page d'accueil : Liste tous les documents trouvés
│       ├── reader/
│       │   └── [id].astro     # Route dynamique : Génère la vue "Liseuse" pour un document donné
│       └── output_2/          # Dossier contenant les données brutes (Markdown)
│           └── [ID_DOC]/
│               ├── page_1.md  # Contenu d'une page spécifique
│               └── ...
├── astro.config.mjs     # Configuration Astro (Intégrations React, Tailwind, etc.)
├── package.json         # Dépendances et scripts (npm run dev, build)
└── tsconfig.json        # Configuration TypeScript
```

## Fonctionnement Clé

### 1. Génération des Pages (Routing)
L'application utilise le **routing dynamique** d'Astro.
- **Accueil (`index.astro`)** : Scanne le dossier `output_2` au moment du build (ou à la requête en mode dev) pour lister tous les documents disponibles.
- **Liseuse (`reader/[id].astro`)** :
    - Utilise `getStaticPaths()` pour générer une route par dossier de document trouvé dans `output_2`.
    - Agrège tous les fichiers `.md` (page_1, page_2...) d'un même dossier.
    - Les trie par numéro de page.
    - Les affiche séquentiellement dans une vue unique.

### 2. Gestion du Contenu (Markdown)
Les documents sont stockés sous forme de fichiers Markdown éclatés (une page PDF = un fichier MD).
- Le frontmatter (en haut des fichiers `.md`) contient les métadonnées (numéro de page, titre, etc.).
- Astro traite ces fichiers comme des collections de données via `Astro.glob()`.

### 3. Styles
- **ReaderLayout** : Importe des polices spécifiques (Merriweather) pour un confort de lecture optimal et définit les variables CSS globales (couleurs papier, texte).
- **Scoped CSS** : Chaque composant `.astro` possède son propre bloc `<style>` qui ne fuite pas sur le reste de l'application.

## Commandes Utiles

- `npm install` : Installe les dépendances.
- `npm run dev` : Lance le serveur de développement local (http://localhost:4321).
- `npm run build` : Compile le site pour la production (statique).
- `npm run preview` : Prévisualise le build de production localement.
