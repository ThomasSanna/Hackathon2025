# Bonnes pratiques liseuses

## Norme WCAG 2.1

1. Texte lisible
    - Taille ajustable par l’utilisateur.
    - Police sans empattement ou police optimisée lecture (Bookerly, Literata, etc.).
    - Espacement de ligne réglable.
    - Marges réglables.
    - Longueur de ligne contrôlée.

2. Couleurs et contraste
    - Thèmes : clair, sombre, sépia.
    - Contraste au moins 4,5:1 selon WCAG.
    - Pas d’information transmise uniquement par la couleur.

3. Navigation simple
    - Aller à un chapitre.
    - Sauvegarde de position.
    - Indicateurs discrets (progression).
    - Retour arrière clair.

4. Commandes clavier / tactile
    - Actions simples : page suivante, précédente.
    - Zone tactile suffisante.
    - Pas de gestes compliqués.

5. Aide à la compréhension
    - Détection langue du texte.
    - Mode lecture non perturbé (pas d’animations, pas d’autoplay).

6. Robustesse
    - Format propre (EPUB, HTML bien structuré).
    - Accessibilité basique pour lecteurs d’écran si nécessaire.

## Recommandations : Pourquoi Kindle fonctionne bien

- Interface épurée.
- Personnalisation avancée : police, taille, marges.
- Lecture sans distraction.
- Simuler un écran papier e-ink:
    - Couleurs neutres. fond crème clair, texte gris foncé.
    - Pas de rétroéclairage apparent. pas de dégradés lumineux ni d’ombres portées.
    - Grayscale + dithering pour images et éléments non textuels.
    - Réduire ou supprimer animations et transitions. rafraîchir par « pages » (déclenchement explicite).