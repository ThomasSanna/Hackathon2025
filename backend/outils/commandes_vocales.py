import json
import os
from typing import Dict, Any
from pydantic import BaseModel
from mistralai import Mistral


# ==================== MODÈLES PYDANTIC ====================

class PhonemeConfig(BaseModel):
    """Configuration pour un phonème"""
    couleur: str
    actif: bool


class PhonemesConfig(BaseModel):
    """Configuration de tous les phonèmes"""
    an: PhonemeConfig
    on: PhonemeConfig
    in_: PhonemeConfig  # "in" est un mot-clé Python, on utilise "in_"
    ou: PhonemeConfig
    oi: PhonemeConfig
    eu: PhonemeConfig
    ai: PhonemeConfig
    ui: PhonemeConfig
    gn: PhonemeConfig
    ill: PhonemeConfig
    eau: PhonemeConfig
    au: PhonemeConfig
    en: PhonemeConfig
    
    class Config:
        # Permet d'utiliser "in" dans le JSON mais "in_" dans le code
        populate_by_name = True
        fields = {'in_': {'alias': 'in'}}


class DyslexieConfig(BaseModel):
    """Configuration des aides à la dyslexie"""
    alternement_typo: bool
    soulignement_syllabes: bool
    phonemes: PhonemesConfig
    lettres_muettes: bool


class SemantiqueConfig(BaseModel):
    """Configuration des aides sémantiques"""
    nom_propre: bool
    date_chiffre: bool
    mot_long: bool


class ThemeConfig(BaseModel):
    """Configuration du thème visuel"""
    couleur_fond: str
    couleur_texte: str
    couleur_surlignage: str


class LiseuseConfig(BaseModel):
    """Configuration complète de la liseuse"""
    espace_mot: int
    espace_lettre: int
    font: str
    interligne: float
    alignement_texte: str
    longueur_liseuse: int
    theme: ThemeConfig
    dyslexie: DyslexieConfig
    semantique: SemantiqueConfig
    mode_p_p: bool
    barre_progression: bool
    focus_paragraphe: bool
    regle_lecture: bool
    ligne_focus: bool
    daltonien: str


class CommandResponse(BaseModel):
    """Réponse après traitement d'une commande"""
    success: bool
    message: str
    config: Dict[str, Any]


# ==================== AGENT VOCAL ====================

class VoiceCommandAgent:
    """Agent IA pour traiter les commandes vocales et modifier la configuration de la liseuse"""
    
    def __init__(self, api_key: str = None):
        """
        Initialise l'agent avec l'API Mistral
        
        Args:
            api_key: Clé API Mistral (si None, cherche dans MISTRAL_API_KEY env var)
        """
        
        self.client = Mistral(api_key=api_key or os.getenv("MISTRAL_API_KEY"))
        self.model = "mistral-large-latest"
    
    def process_command(self, config: Dict[str, Any], command: str) -> CommandResponse:
        """
        Traite une commande vocale et modifie la configuration
        
        Args:
            config: Configuration actuelle de la liseuse (dict ou LiseuseConfig)
            command: Commande vocale de l'utilisateur
            
        Returns:
            CommandResponse avec la configuration modifiée
        """
        # Valider et convertir la config en dict si nécessaire
        if isinstance(config, LiseuseConfig):
            config_dict = config.model_dump()
        else:
            config_dict = config
        
        # Construire le prompt pour Mistral
        system_prompt = self._build_system_prompt()
        user_prompt = self._build_user_prompt(config_dict, command)
        
        try:
            # Appeler l'API Mistral
            response = self.client.chat.complete(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                response_format={"type": "json_object"}
            )
            
            # Extraire la réponse
            result = json.loads(response.choices[0].message.content)
            
            return CommandResponse(
                success=True,
                message=result.get("message", "Configuration mise à jour"),
                config=result.get("config", config_dict)
            )
            
        except Exception as e:
            return CommandResponse(
                success=False,
                message=f"Erreur lors du traitement de la commande : {str(e)}",
                config=config_dict
            )
    
    def _build_system_prompt(self) -> str:
        """Construit le prompt système pour l'IA"""
        return """Tu es un assistant vocal pour une application de liseuse électronique accessible.
Ton rôle est d'interpréter les commandes vocales de l'utilisateur et de modifier la configuration de la liseuse en conséquence.

La configuration contient :
- Paramètres typographiques : espace_mot, espace_lettre, font, interligne, alignement_texte, longueur_liseuse
- Thème : couleur_fond, couleur_texte, couleur_surlignage
- Aides à la dyslexie : alternement_typo, soulignement_syllabes, phonemes (avec couleurs), lettres_muettes
- Aides sémantiques : nom_propre, date_chiffre, mot_long
- Modes spéciaux : mode_p_p (point par point), barre_progression, focus_paragraphe, regle_lecture, ligne_focus
- Accessibilité : daltonien (Aucun, Protanopie, Deutéranopie, Tritanopie)

INSTRUCTIONS :
1. Analyse la commande de l'utilisateur
2. Identifie quels paramètres doivent être modifiés
3. Applique les modifications à la configuration fournie
4. Retourne un JSON avec EXACTEMENT cette structure :
{
    "message": "Description de ce qui a été modifié",
    "config": { ... configuration complète modifiée ... }
}

EXEMPLES de commandes :
- "Active le mode sombre" → change couleur_fond et couleur_texte
- "Police Arial taille 16" → change font
- "Active le surlignage des phonèmes 'an' et 'on'" → active ces phonèmes dans dyslexie.phonemes
- "Augmente l'espacement entre les mots" → augmente espace_mot
- "Mode dyslexie complet" → active toutes les aides dyslexie
- "Désactive tout" → remet les paramètres par défaut
- "Je suis daltonien protanope" → change daltonien à "Protanopie"

IMPORTANT :
- Retourne TOUJOURS la configuration COMPLÈTE (pas seulement les champs modifiés)
- Les couleurs sont en format hexadécimal (#RRGGBB)
- Les booléens sont true/false
- Respecte EXACTEMENT la structure JSON fournie"""

    def _build_user_prompt(self, config: Dict[str, Any], command: str) -> str:
        """Construit le prompt utilisateur"""
        config_json = json.dumps(config, ensure_ascii=False, indent=2)
        
        return f"""Configuration actuelle :
{config_json}

Commande de l'utilisateur : "{command}"

Modifie la configuration selon cette commande et retourne le JSON complet."""

    def validate_config(self, config: Dict[str, Any]) -> LiseuseConfig:
        """
        Valide une configuration avec Pydantic
        
        Args:
            config: Configuration à valider
            
        Returns:
            LiseuseConfig validé
            
        Raises:
            ValidationError si la config est invalide
        """
        return LiseuseConfig(**config)


# ==================== FONCTIONS UTILITAIRES ====================

def create_default_config() -> Dict[str, Any]:
    """Crée une configuration par défaut"""
    return {
        "espace_mot": 0,
        "espace_lettre": 0,
        "font": "Arial",
        "interligne": 1,
        "alignement_texte": "gauche",
        "longueur_liseuse": 100,
        "theme": {
            "couleur_fond": "#FFFFFF",
            "couleur_texte": "#000000",
            "couleur_surlignage": "#FFFF00"
        },
        "dyslexie": {
            "alternement_typo": False,
            "soulignement_syllabes": False,
            "phonemes": {
                "an": {"couleur": "#FF0000", "actif": False},
                "on": {"couleur": "#00CC00", "actif": False},
                "in": {"couleur": "#0066FF", "actif": False},
                "ou": {"couleur": "#FF6600", "actif": False},
                "oi": {"couleur": "#CC00FF", "actif": False},
                "eu": {"couleur": "#00CCCC", "actif": False},
                "ai": {"couleur": "#FFB300", "actif": False},
                "ui": {"couleur": "#FF0099", "actif": False},
                "gn": {"couleur": "#006633", "actif": False},
                "ill": {"couleur": "#9933FF", "actif": False},
                "eau": {"couleur": "#FF3333", "actif": False},
                "au": {"couleur": "#3399FF", "actif": False},
                "en": {"couleur": "#FFCC00", "actif": False}
            },
            "lettres_muettes": False
        },
        "semantique": {
            "nom_propre": False,
            "date_chiffre": False,
            "mot_long": False
        },
        "mode_p_p": False,
        "barre_progression": False,
        "focus_paragraphe": False,
        "regle_lecture": False,
        "ligne_focus": False,
        "daltonien": "Aucun"
    }


# ==================== EXEMPLE D'UTILISATION ====================

if __name__ == "__main__":
    # Exemple d'utilisation
    
    # 1. Créer l'agent (nécessite MISTRAL_API_KEY dans les variables d'environnement)
    try:
        agent = VoiceCommandAgent()
    except ValueError as e:
        print(f"Erreur : {e}")
        print("Définissez la variable d'environnement MISTRAL_API_KEY")
        exit(1)
    
    # 2. Créer une configuration par défaut
    config = create_default_config()
    
    # 3. Tester quelques commandes
    test_commands = [
        "Active le mode sombre"
    ]
    
    print("=== TEST DU VOICE COMMAND AGENT ===\n")
    
    for command in test_commands:
        print(f"\n📢 Commande : {command}")
        print("-" * 60)
        
        response = agent.process_command(config, command)
        
        if response.success:
            print(f"✅ {response.message}")
            # Mettre à jour la config pour la prochaine commande
            config = response.config
        else:
            print(f"❌ {response.message}")
    
    # 4. Afficher la configuration finale
    print("\n" + "=" * 60)
    print("CONFIGURATION FINALE :")
    print("=" * 60)
    print(json.dumps(config, ensure_ascii=False, indent=2))