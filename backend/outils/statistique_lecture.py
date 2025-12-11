from collections import Counter
import re
import json
import os
import unicodedata

def _strip_accents(s: str) -> str:
    if not isinstance(s, str):
        return ""
    return ''.join(c for c in unicodedata.normalize('NFD', s) if unicodedata.category(c) != 'Mn')

def analyser_texte_lu(texte):
    """
    Analyse un texte et retourne des statistiques de lecture détaillées.
    
    Args:
        texte (str): Le texte à analyser
        
    Returns:
        dict: Dictionnaire contenant toutes les statistiques
    """
    if not texte or texte.isspace():
        return {
            "mots_lus": 0,
            "caracteres_lus": 0,
            "message": "Aucun texte à analyser"
        }
    
    # Nettoyage et préparation
    mots = re.findall(r'\b\w+\b', texte.lower())
    phrases = re.split(r'[.!?]+', texte)
    phrases = [p for p in phrases if p.strip()]
    
    # Statistiques de base
    nb_mots = len(mots)
    nb_caracteres = len(texte)
    nb_caracteres_sans_espaces = len(texte.replace(' ', ''))
    nb_phrases = len(phrases)
    
    # Statistiques avancées
    mots_uniques = set(mots)
    nb_mots_uniques = len(mots_uniques)
    
    # Analyse des mots
    longueurs_mots = [len(mot) for mot in mots]
    mot_le_plus_long = max(mots, key=len) if mots else ""
    mot_le_plus_court = min(mots, key=len) if mots else ""
    
    # Charger la liste de fréquences pour récupérer les déterminants (type 'dét.' / 'det.')
    det_norm_set = set()
    try:
        freq_path = os.path.join(os.path.dirname(__file__), 'fichiers', 'frequence.json')
        with open(freq_path, 'r', encoding='utf-8') as f:
            freq_data = json.load(f)
        for entry in freq_data:
            t = entry.get('type', '')
            t_norm = _strip_accents(t.lower())
            label = entry.get('label', '')
            if t_norm.startswith('det') or t_norm.startswith("prep") or t_norm.startswith("conj"):  # couvre 'dét.' et 'det.'
                if isinstance(label, str) and label:
                    det_norm_set.add(_strip_accents(label.lower()))
    except Exception:
        det_norm_set = set()
    
    mots_enleve_manuellement = ('les', "à")
    for mot in mots_enleve_manuellement:
        det_norm_set.add(_strip_accents(mot))
    
    # Fréquences: utiliser Counter(mots) mais exclure les déterminants présents dans frequence.json (comparaison normalisée)
    frequences = Counter(m for m in mots if _strip_accents(m) not in det_norm_set)
    mots_plus_frequents = frequences.most_common(100)
    
    # Calculs moyennes
    longueur_moyenne_mots = sum(longueurs_mots) / nb_mots if nb_mots > 0 else 0
    mots_par_phrase = nb_mots / nb_phrases if nb_phrases > 0 else 0
    
    # Temps de lecture (environ 200 mots par minute)
    temps_lecture_minutes = nb_mots / 200
    temps_lecture_secondes = int(temps_lecture_minutes * 60)
    
    # Richesse vocabulaire
    richesse_vocabulaire = (nb_mots_uniques / nb_mots * 100) if nb_mots > 0 else 0
    
    # Analyse des caractères
    nb_lettres = sum(c.isalpha() for c in texte)
    nb_chiffres = sum(c.isdigit() for c in texte)
    nb_espaces = sum(c.isspace() for c in texte)
    nb_ponctuation = sum(not c.isalnum() and not c.isspace() for c in texte)
    
    return {
        "lecture": {
            "mots_lus": nb_mots,
            "caracteres_lus": nb_caracteres,
            "caracteres_sans_espaces": nb_caracteres_sans_espaces,
            "phrases_lues": nb_phrases,
        },
        "temps_de_lecture": {
            "minutes": round(temps_lecture_minutes, 2),
            "secondes": temps_lecture_secondes,
            "estimation": f"~{temps_lecture_secondes} secondes"
        },
        "moyennes": {
            "longueur_moyenne_mots": round(longueur_moyenne_mots, 2),
            "mots_par_phrase": round(mots_par_phrase, 2),
        },
        "vocabulaire": {
            "mots_uniques": nb_mots_uniques,
            "richesse_vocabulaire": f"{richesse_vocabulaire:.1f}%",
            "mot_le_plus_long": mot_le_plus_long,
            "mot_le_plus_court": mot_le_plus_court,
        },
        "top_mots": [
            {"mot": mot, "occurrences": count} 
            for mot, count in mots_plus_frequents
        ],
        "details_caractères": {
            "lettres": nb_lettres,
            "chiffres": nb_chiffres,
            "espaces": nb_espaces,
            "ponctuation": nb_ponctuation,
        }
    }


def afficher_statistiques(stats):
    """Affiche les statistiques de manière formatée."""
    for categorie, valeurs in stats.items():
        print(f"\n{categorie}")
        print("=" * 40)
        if isinstance(valeurs, dict):
            for cle, valeur in valeurs.items():
                print(f"  {cle.replace('_', ' ').title()}: {valeur}")
        elif isinstance(valeurs, list):
            for item in valeurs:
                if isinstance(item, dict):
                    print(f"  • {item['mot']}: {item['occurrences']} fois")


if __name__ == "__main__":
    texte_exemple = """
 Dans tous les cas, I'ordre de virement portait mention du nom de Monsieur Carlos L. MBERTON. Le montant des so¡nmes justÍfiées de Ia sorte s'éIève à 187 595 US $ dont la contre-valeur est proche de 975 000 F du troisième prêt consenti à t'lonsíeur Jacques CHEMINADE. Les fonds prêtés par Madame Ruth BIERRE à Monsieur -Jacques CHEMINADE proviendrãient donc d'avances et donateurs versés entre 1e 15 novembre 1991 et le 7 juin 1995
    """
    
    stats = analyser_texte_lu(texte_exemple)
    afficher_statistiques(stats)