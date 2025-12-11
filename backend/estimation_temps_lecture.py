def get_nombre_mots(texte):
    """Retourne le nombre de mots d'un texte.

    Args:
        texte (str): texte dont on veut compter les mots

    Returns:
        int: nb de mots
    """
    mots = texte.split()
    return len(mots)

def estimer_temps_lecture(texte, vitesse_mots_par_minute=200):
    """Estime le temps de lecture d'un texte et retourne une chaîne formatée.

    Args:
        texte (str): texte dont on veut estimer le temps de lecture
        vitesse_mots_par_minute (int, optional): vitesse de lecture en mots par minute. 
            Par défaut à 200 mots par minute.

    Returns:
        str: temps de lecture formaté (ex: "3 heures, 20 minutes et 8 secondes")
    """
    nombre_mots = get_nombre_mots(texte)
    temps_minutes = nombre_mots / vitesse_mots_par_minute
    temps_secondes_total = temps_minutes * 60
    
    # Calculer heures, minutes et secondes
    heures = int(temps_secondes_total // 3600)
    minutes = int((temps_secondes_total % 3600) // 60)
    secondes = int(temps_secondes_total % 60)
    
    # Construire dynamiquement la chaîne
    composants = []
    if heures > 0:
        composants.append(f"{heures} heure{'s' if heures > 1 else ''}")
    if minutes > 0:
        composants.append(f"{minutes} minute{'s' if minutes > 1 else ''}")
    if secondes > 0:
        composants.append(f"{secondes} seconde{'s' if secondes > 1 else ''}")
    
    # Si tout est à 0, retourner "moins d'une seconde"
    if not composants:
        return "moins d'une seconde"
    
    # Joindre avec des virgules et "et" pour le dernier élément
    if len(composants) == 1:
        return composants[0]
    elif len(composants) == 2:
        return f"{composants[0]} et {composants[1]}"
    else:
        return f"{', '.join(composants[:-1])} et {composants[-1]}"


if __name__ == "__main__":
    exemple_texte = """
    3 I'encaissement Ie 7 juillet 1995 en contradíction avec les dispositions du code é1ectoral quÍ prévoient que Ie candidat ne p.,r-t avoir recueíIli de fonds en vue du f inancement' de sa ã"rnp.gtt" gu'avant Ia date où I'électÍon a'été acquise soit Ie 7 mai 1995. Cependant, au vu de la modicité de la somme en cause' il est propose en opportunité d'écarter ce motif entraînant en droit Ie rejet du compte. Dans son courrier du 25 septembre 1995, Ie candídat plaide en ce sens demandant à ne plus Considérer "ce mouvement comme un don, maís comme une avattce"(l ). A preuve, Itattestation de Monsieur Christophe LAVERI.IHE, le donateur, datée du 20 septembre 1995t dans laiuelle iI soutient que cette sonrme de 50 F était bien une avance äoi lui a étó d'aiileurs remboursée depuis, alors même ã,ti ir "3t pourtant dest.inataíre d'un reçu-don à la date du 7 juillet 1995.
    """
    temps = estimer_temps_lecture(exemple_texte)
    print(f"Temps de lecture estimé: {temps}")