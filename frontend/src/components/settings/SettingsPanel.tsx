import React from "react";
import {
  User,
  Sun,
  Moon,
  Palette,
  Eye,
  Type,
  Sparkles,
  Brain,
  BookOpen,
  RotateCcw,
  Monitor,
  Contrast,
  Glasses,
  Zap,
  Heart,
  Target,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  ArrowLeft,
} from "lucide-react";
import SettingsSection from "./SettingsSection";
import ToggleSwitch from "./ToggleSwitch";
import SelectableCard from "./SelectableCard";
import SliderInput from "./SliderInput";
import {
  usePersonnalisationStore,
  type PersonnalisationState,
} from "../../stores/personnalisationStore";

// Profiles d'accessibilité prédéfinis
const accessibilityProfiles = [
  {
    id: "standard" as const,
    name: "Standard",
    description: "Configuration par défaut",
    icon: <Monitor size={24} />,
  },
  {
    id: "dyslexie" as const,
    name: "Dyslexie",
    description: "Police adaptée, syllabes colorées",
    icon: <Type size={24} />,
  },
  {
    id: "tdah" as const,
    name: "TDA/H",
    description: "Focus paragraphe, mise en évidence",
    icon: <Target size={24} />,
  },
  {
    id: "fatigue" as const,
    name: "Fatigue visuelle",
    description: "Couleurs douces, espacement",
    icon: <Heart size={24} />,
  },
  {
    id: "malvoyance" as const,
    name: "Malvoyance",
    description: "Contraste élevé, grande police",
    icon: <Eye size={24} />,
  },
];

const themes = [
  {
    id: "light" as const,
    name: "Clair",
    icon: <Sun size={20} />,
    bg: "#ffffff",
    text: "#1a1a1a",
  },
  {
    id: "sepia" as const,
    name: "Sépia",
    icon: <BookOpen size={20} />,
    bg: "#f4ecd8",
    text: "#5b4636",
  },
  {
    id: "dark" as const,
    name: "Sombre",
    icon: <Moon size={20} />,
    bg: "#1a1a1a",
    text: "#e0e0e0",
  },
  {
    id: "contrast" as const,
    name: "Contraste",
    icon: <Contrast size={20} />,
    bg: "#000000",
    text: "#ffff00",
  },
  {
    id: "oled" as const,
    name: "OLED",
    icon: <Sparkles size={20} />,
    bg: "#000000",
    text: "#ffffff",
  },
];

const fonts = [
  { id: "Inter", name: "Inter", description: "Police moderne" },
  {
    id: "OpenDyslexic",
    name: "OpenDyslexic",
    description: "Optimisé dyslexie",
  },
  { id: "Lexend", name: "Lexend", description: "Lecture fluide" },
];

const colorBlindModes: {
  id: PersonnalisationState["daltonien"];
  name: string;
  description: string;
  color: string;
}[] = [
  {
    id: "Aucun",
    name: "Aucun",
    description: "Vision normale",
    color: "bg-gradient-to-br from-red-400 via-green-400 to-blue-400",
  },
  {
    id: "protanopia",
    name: "Protanopie",
    description: "Rouge faible",
    color: "bg-gradient-to-br from-amber-400 via-amber-300 to-blue-400",
  },
  {
    id: "deuteranopia",
    name: "Deutéranopie",
    description: "Vert faible",
    color: "bg-gradient-to-br from-amber-500 via-yellow-300 to-blue-400",
  },
  {
    id: "tritanopia",
    name: "Tritanopie",
    description: "Bleu faible",
    color: "bg-gradient-to-br from-red-400 via-pink-400 to-teal-400",
  },
  {
    id: "achromatopsia",
    name: "Achromatopsie",
    description: "Vision en gris",
    color: "bg-gradient-to-br from-gray-300 via-gray-400 to-gray-500",
  },
];

const columnWidths = [
  { id: 600, name: "Étroit" },
  { id: 800, name: "Moyen" },
  { id: 1000, name: "Large" },
];

const alignments: {
  id: PersonnalisationState["alignement_texte"];
  name: string;
  icon: React.ReactNode;
}[] = [
  { id: "gauche", name: "Gauche", icon: <AlignLeft size={18} /> },
  { id: "centre", name: "Centre", icon: <AlignCenter size={18} /> },
  { id: "droite", name: "Droite", icon: <AlignRight size={18} /> },
  { id: "justify", name: "Justifié", icon: <AlignJustify size={18} /> },
];

export default function SettingsPanel() {
  // Utiliser le store Zustand directement
  const store = usePersonnalisationStore();

  // Extraire les valeurs et actions du store
  const {
    // État
    espace_mot,
    espace_lettre,
    font,
    taille_texte,
    interligne,
    alignement_texte,
    longueur_liseuse,
    theme,
    theme_mode,
    dyslexie,
    segmentation_syllabique,
    phonemes_actifs,
    semantique,
    focus_paragraphe,
    ligne_focus,
    mode_p_p,
    barre_progression,
    regle_lecture,
    daltonien,
    profil_actif,
    // Actions
    setEspaceMot,
    setEspaceLettre,
    setFont,
    setTailleTexte,
    setInterligne,
    setAlignementTexte,
    setLongueurLiseuse,
    setThemeMode,
    setSegmentationSyllabique,
    setAlternementTypo,
    setSoulignementSyllabes,
    setPhonemesActifs,
    togglePhoneme,
    setLettresMuettes,
    setNomPropre,
    setDateChiffre,
    setMotLong,
    setFocusParagraphe,
    setLigneFocus,
    setModePP,
    setBarreProgression,
    setRegleLecture,
    setDaltonien,
    appliquerProfil,
    reset,
  } = store;

  // Trouver le thème actuel pour l'aperçu
  const currentTheme = themes.find((t) => t.id === theme_mode);

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-100 via-amber-50/30 to-stone-100">
      {/* Floating Action Buttons */}
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3">
        <button
          onClick={reset}
          className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/90 backdrop-blur-md border border-stone-200 text-stone-600 hover:bg-stone-50 transition-all shadow-lg hover:shadow-xl"
        >
          <RotateCcw size={18} />
          <span className="hidden sm:inline">Réinitialiser</span>
        </button>
        <a
          href="/library"
          className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all shadow-lg hover:shadow-xl bg-amber-600 text-white hover:bg-amber-700 no-underline"
        >
          <ArrowLeft size={18} />
          Retour à la bibliothèque
        </a>
      </div>

      {/* Content - Two Column Layout */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Column - Preview (Sticky) */}
          <div className="lg:w-2/5 order-2 lg:order-1">
            <div className="lg:sticky lg:top-8">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-stone-200/60 shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-stone-500 uppercase tracking-wide">
                    Aperçu en direct
                  </h3>
                  <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                    ✓ Sauvegarde auto
                  </span>
                </div>
                <div
                  className="p-6 rounded-xl border border-stone-200 min-h-[300px] transition-all duration-300"
                  style={{
                    backgroundColor: theme.couleur_fond,
                    color: theme.couleur_texte,
                    fontFamily: font,
                    fontSize: `${taille_texte}px`,
                    lineHeight: interligne,
                    letterSpacing: `${espace_lettre}px`,
                    wordSpacing: `${espace_mot}px`,
                    textAlign:
                      alignement_texte === "gauche"
                        ? "left"
                        : alignement_texte === "centre"
                        ? "center"
                        : alignement_texte === "droite"
                        ? "right"
                        : "justify",
                    maxWidth: `${longueur_liseuse}px`,
                  }}
                >
                  <p className="mb-4">
                    Ceci est un exemple de texte pour visualiser vos paramètres
                    de lecture.
                  </p>
                  <p className="mb-4">
                    Les plans cadastraux de <strong>Paris</strong> couvrent la
                    période de <em>1809</em> à <em>1854</em> et représentent
                    environ <strong>26 200</strong> feuilles d'immeubles
                    parisiens.
                  </p>
                  <p>
                    La documentation comprend des informations détaillées sur
                    chaque propriété.
                  </p>
                </div>

                {/* Quick Stats */}
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="bg-stone-50 rounded-lg p-3">
                    <p className="text-xs text-stone-500">Taille</p>
                    <p className="font-semibold text-stone-700">
                      {taille_texte}px
                    </p>
                  </div>
                  <div className="bg-stone-50 rounded-lg p-3">
                    <p className="text-xs text-stone-500">Interligne</p>
                    <p className="font-semibold text-stone-700">{interligne}</p>
                  </div>
                  <div className="bg-stone-50 rounded-lg p-3">
                    <p className="text-xs text-stone-500">Police</p>
                    <p className="font-semibold text-stone-700">{font}</p>
                  </div>
                  <div className="bg-stone-50 rounded-lg p-3">
                    <p className="text-xs text-stone-500">Thème</p>
                    <p className="font-semibold text-stone-700 capitalize">
                      {currentTheme?.name || theme_mode}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Settings */}
          <div className="lg:w-3/5 order-1 lg:order-2 space-y-6 pb-24">
            {/* Profils d'accessibilité */}
            <SettingsSection
              title="Profils d'accessibilité"
              icon={<User size={22} />}
              defaultOpen={true}
            >
              <p className="text-stone-500 text-sm mb-4">
                Sélectionnez un profil pré-configuré pour ajuster
                automatiquement tous les paramètres.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {accessibilityProfiles.map((profile) => (
                  <SelectableCard
                    key={profile.id}
                    selected={profil_actif === profile.id}
                    onClick={() => appliquerProfil(profile.id)}
                    icon={profile.icon}
                    title={profile.name}
                    description={profile.description}
                  />
                ))}
              </div>
            </SettingsSection>

            {/* Thème & Apparence */}
            <SettingsSection
              title="Thème & Apparence"
              icon={<Palette size={22} />}
              defaultOpen={true}
            >
              <div className="space-y-6">
                {/* Thèmes */}
                <div>
                  <h3 className="font-medium text-stone-700 mb-3">Thème</h3>
                  <div className="flex flex-wrap gap-3">
                    {themes.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setThemeMode(t.id)}
                        className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all min-w-[80px] ${
                          theme_mode === t.id
                            ? "border-amber-500 bg-amber-50"
                            : "border-stone-200 hover:border-stone-300"
                        }`}
                      >
                        <div
                          className="w-10 h-10 rounded-lg mb-2 flex items-center justify-center border"
                          style={{
                            backgroundColor: t.bg,
                            color: t.text,
                          }}
                        >
                          {t.icon}
                        </div>
                        <span className="text-sm font-medium text-stone-700">
                          {t.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Polices */}
                <div>
                  <h3 className="font-medium text-stone-700 mb-3">
                    Police de caractères
                  </h3>
                  <div className="grid grid-cols-3 gap-3">
                    {fonts.map((f) => (
                      <SelectableCard
                        key={f.id}
                        selected={font === f.id}
                        onClick={() => setFont(f.id)}
                        title={f.name}
                        description={f.description}
                        preview={
                          <span
                            className="text-2xl font-medium text-stone-600"
                            style={{ fontFamily: f.id }}
                          >
                            Aa
                          </span>
                        }
                        className="text-center items-center"
                      />
                    ))}
                  </div>
                </div>
              </div>
            </SettingsSection>

            {/* Paramètres de lecture */}
            <SettingsSection
              title="Paramètres de lecture"
              icon={<BookOpen size={22} />}
            >
              <div className="space-y-4">
                <SliderInput
                  label="Taille du texte"
                  value={taille_texte}
                  onChange={setTailleTexte}
                  min={12}
                  max={32}
                  unit="px"
                />

                <SliderInput
                  label="Interligne"
                  value={interligne}
                  onChange={setInterligne}
                  min={1}
                  max={3}
                  step={0.1}
                />

                <SliderInput
                  label="Espacement des lettres"
                  value={espace_lettre}
                  onChange={setEspaceLettre}
                  min={0}
                  max={10}
                  unit="px"
                />

                <SliderInput
                  label="Espacement des mots"
                  value={espace_mot}
                  onChange={setEspaceMot}
                  min={0}
                  max={20}
                  unit="px"
                />

                {/* Alignement du texte */}
                <div className="py-3">
                  <h3 className="font-medium text-stone-800 mb-3">
                    Alignement du texte
                  </h3>
                  <div className="flex gap-2">
                    {alignments.map((align) => (
                      <button
                        key={align.id}
                        onClick={() => setAlignementTexte(align.id)}
                        className={`flex-1 py-2 px-4 rounded-xl border-2 font-medium transition-all flex items-center justify-center gap-2 ${
                          alignement_texte === align.id
                            ? "border-amber-500 bg-amber-50 text-amber-700"
                            : "border-stone-200 text-stone-600 hover:border-stone-300"
                        }`}
                        title={align.name}
                      >
                        {align.icon}
                        <span className="hidden sm:inline text-sm">
                          {align.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Largeur de colonne */}
                <div className="py-3">
                  <h3 className="font-medium text-stone-800 mb-3">
                    Largeur de colonne
                  </h3>
                  <div className="flex gap-2">
                    {columnWidths.map((width) => (
                      <button
                        key={width.id}
                        onClick={() => setLongueurLiseuse(width.id)}
                        className={`flex-1 py-2 px-4 rounded-xl border-2 font-medium transition-all ${
                          longueur_liseuse === width.id
                            ? "border-amber-500 bg-amber-50 text-amber-700"
                            : "border-stone-200 text-stone-600 hover:border-stone-300"
                        }`}
                      >
                        {width.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </SettingsSection>

            {/* Outils Dyslexie */}
            <SettingsSection title="Outils Dyslexie" icon={<Type size={22} />}>
              <div className="space-y-1">
                <ToggleSwitch
                  label="Segmentation syllabique"
                  description="Sépare les mots en syllabes avec des couleurs alternées"
                  enabled={segmentation_syllabique}
                  onChange={setSegmentationSyllabique}
                />

                <ToggleSwitch
                  label="Alternance typographique"
                  description="Alterne gras/normal sur les syllabes"
                  enabled={dyslexie.alternement_typo}
                  onChange={setAlternementTypo}
                />

                <ToggleSwitch
                  label="Souligner les syllabes"
                  description="Ajoute un soulignement coloré aux syllabes"
                  enabled={dyslexie.soulignement_syllabes}
                  onChange={setSoulignementSyllabes}
                />

                <ToggleSwitch
                  label="Phonèmes en surbrillance"
                  description="Met en évidence les phonèmes complexes (an, on, ou, etc.)"
                  enabled={phonemes_actifs}
                  onChange={setPhonemesActifs}
                />

                {/* Grille des phonèmes */}
                {phonemes_actifs && (
                  <div className="mt-4 p-4 bg-stone-50 rounded-xl">
                    <p className="text-sm text-stone-600 mb-3">
                      Sélectionnez les phonèmes à mettre en évidence :
                    </p>
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                      {Object.entries(dyslexie.phonemes).map(([key, value]) => (
                        <button
                          key={key}
                          onClick={() => togglePhoneme(key)}
                          className={`flex items-center justify-center gap-2 p-2 rounded-lg border-2 transition-all ${
                            value.actif
                              ? "border-amber-500 bg-white"
                              : "border-stone-200 bg-white/50"
                          }`}
                        >
                          <span
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: value.couleur }}
                          />
                          <span className="font-medium text-stone-700">
                            {key}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <ToggleSwitch
                  label="Lettres muettes grisées"
                  description="Affiche les lettres muettes en gris clair"
                  enabled={dyslexie.lettres_muettes}
                  onChange={setLettresMuettes}
                />
              </div>
            </SettingsSection>

            {/* Aides TDA/H */}
            <SettingsSection title="Aides TDA/H" icon={<Brain size={22} />}>
              <div className="space-y-1">
                <ToggleSwitch
                  label="Focus paragraphe"
                  description="Assombrit le texte non actif"
                  enabled={focus_paragraphe}
                  onChange={setFocusParagraphe}
                />

                <ToggleSwitch
                  label="Focus ligne"
                  description="Surligne la ligne de lecture"
                  enabled={ligne_focus}
                  onChange={setLigneFocus}
                />

                <ToggleSwitch
                  label="Mode paragraphe par paragraphe"
                  description="Affiche un seul paragraphe à la fois avec navigation"
                  enabled={mode_p_p}
                  onChange={setModePP}
                />

                <div className="border-t border-stone-100 my-4" />

                <ToggleSwitch
                  label="Noms propres"
                  description="Met en évidence les personnages et lieux"
                  enabled={semantique.nom_propre}
                  onChange={setNomPropre}
                />

                <ToggleSwitch
                  label="Dates et chiffres"
                  description="Surligne les dates et nombres"
                  enabled={semantique.date_chiffre}
                  onChange={setDateChiffre}
                />

                <ToggleSwitch
                  label="Mots longs (> 8 lettres)"
                  description="Met en évidence les mots complexes"
                  enabled={semantique.mot_long}
                  onChange={setMotLong}
                />
              </div>
            </SettingsSection>

            {/* Accessibilité visuelle */}
            <SettingsSection
              title="Accessibilité visuelle"
              icon={<Glasses size={22} />}
            >
              <div>
                <h3 className="font-medium text-stone-700 mb-3">
                  Mode daltonien
                </h3>
                <p className="text-sm text-stone-500 mb-4">
                  Ajuste les couleurs pour compenser les différents types de
                  daltonisme.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  {colorBlindModes.map((mode) => (
                    <button
                      key={mode.id}
                      onClick={() => setDaltonien(mode.id)}
                      className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all ${
                        daltonien === mode.id
                          ? "border-amber-500 bg-amber-50"
                          : "border-stone-200 hover:border-stone-300"
                      }`}
                    >
                      <div
                        className={`w-12 h-12 rounded-full ${mode.color} mb-2`}
                      />
                      <span className="font-medium text-sm text-stone-700">
                        {mode.name}
                      </span>
                      <span className="text-xs text-stone-500 text-center">
                        {mode.description}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </SettingsSection>

            {/* Outils de lecture */}
            <SettingsSection title="Outils de lecture" icon={<Zap size={22} />}>
              <div className="space-y-1">
                <ToggleSwitch
                  label="Barre de progression"
                  description="Affiche la progression dans le document"
                  enabled={barre_progression}
                  onChange={setBarreProgression}
                />

                <ToggleSwitch
                  label="Règle de lecture"
                  description="Guide visuel pour suivre les lignes"
                  enabled={regle_lecture}
                  onChange={setRegleLecture}
                />
              </div>
            </SettingsSection>
          </div>
        </div>
      </div>
    </div>
  );
}
