# Direction artistique — Mes Recettes

## Concept central : *Le carnet de cuisine de famille*

L'application doit évoquer un objet physique qu'on aime : un carnet de recettes transmis, annoté, taché de farine. Pas une app SaaS froide. Pas non plus un Pinterest culinaire. Quelque chose entre les deux — **intime, éditorial, artisanal**.

L'enjeu est de donner une **âme à un outil utilitaire**, sans sacrifier la lisibilité ni l'efficacité.

---

## Référence directrice : *Le Livre de Cuisine de Famille*

Imagine qu'une grand-mère sérieuse ait confié son carnet à un studio de design parisien. Le résultat serait :
- Des proportions généreuses (pas de densité d'information oppressante)
- Une typographie avec caractère mais lisible
- Des couleurs qui rappellent le papier, la terre, les épices
- Des photos qui montrent la vraie cuisine — imparfaite, chaleureuse
- Des gestes d'UI qui répondent comme un objet physique (poids, friction, satisfaction)

**Inspirations visuelles primaires**
- *Kinfolk* magazine — photographie culinaire épurée, blancs larges
- *Le Creuset* brand identity — terracotta, fonte, matières nobles
- *Notion* + *Bear* — information architecture about minimalism
- *Epicurious* redesign 2022 — cards généreuses, typographie éditoriale forte
- *Whisk app* — planificateur fluide, drag & drop naturel

---

## Palette de couleurs

### Palette principale — Parchemin

La palette actuelle est bonne dans son intention. On l'affine et on la complète.

```
Parchemin (fond, surfaces)
  parchment-50  : #FDFAF5   — fond général de la page
  parchment-100 : #F5EFE0   — fond des cards, input backgrounds
  parchment-200 : #E8DCC8   — bordures légères
  parchment-300 : #CEBA9A   — textes désactivés, placeholders
  parchment-400 : #A8946F   — textes secondaires, métadonnées
  parchment-500 : #8A7555   — textes de corps moyen
  parchment-600 : #6B5940   — textes principaux, titres secondaires
  parchment-700 : #4E3F2C   — titres
  parchment-800 : #322818   — titres forts, texte de marque
  parchment-900 : #1A1208   — presque noir, accents

Terracotta (accents primaires, CTA)
  terracotta-50  : #FDF2EE
  terracotta-100 : #FADDD2
  terracotta-200 : #F4B89F
  terracotta-300 : #EC8E6A
  terracotta-400 : #E06840   — hover states
  terracotta-500 : #C94E27   — couleur d'action principale
  terracotta-600 : #A33B1C   — pressed states
  terracotta-700 : #7D2B12
```

### Palette étendue — Saisons

Chaque saison a sa propre teinte identitaire. Ces couleurs apparaissent sur les badges, les filtres actifs, et subtilisement dans les cards de recettes associées.

```
Printemps  : #E8F5E0 (fond) / #4CAF50 (accent) — vert tendre, herbe fraîche
Été        : #FFF8E1 (fond) / #F9A825 (accent) — jaune soleil, safran
Automne    : #FFF3E0 (fond) / #E65100 (accent) — orange épice, cannelle
Hiver      : #E8EAF6 (fond) / #3949AB (accent) — bleu nuit, givre
```

### Mode sombre (objectif futur)

La palette parchemin se transpose bien :
```
Fond principal  : #1C1510  — brun presque noir (café)
Surface cards   : #261D15  — brun moyen
Bordures        : #3A2D20
Texte principal : #E8DCC8  — parchemin clair
Accent terracotta reste identique
```

---

## Typographie

### Hiérarchie typographique

| Rôle | Police | Usage |
|------|--------|-------|
| **Serif éditorial** | Playfair Display | Titres de recettes, logo, H1 |
| **Sans-serif lisible** | DM Sans | Corps, navigation, UI |
| **Mono chiffré** | JetBrains Mono | Quantités d'ingrédients, temps, prix |

### Règles d'usage

**Playfair Display** — réservé aux moments éditoriaux
- Titre de la recette sur la page détail : 32–40px, bold, `letter-spacing: -0.02em`
- Titre dans la card : 18–20px, semibold
- Logo "Mes Recettes" en sidebar : 24px, italic pour "Recettes"
- *Ne jamais utiliser pour des labels, des boutons ou du texte de navigation*

**DM Sans** — tout le reste
- Corps de texte : 14–16px, `line-height: 1.65`
- Navigation : 14px, medium (500)
- Labels, badges : 11–12px, medium, `letter-spacing: 0.03em` uppercase

**JetBrains Mono** — les données chiffrées seulement
- Quantités ingrédients : `150g`, `20 min`, `4 pers.`
- Toujours en petit (12–13px), jamais en titre
- Crée un contraste visuel utile : on repère les infos pratiques au premier coup d'œil

---

## Composants — Guide de style

### Cards recettes

La card est le composant central. Elle doit inviter à cliquer sans être criarde.

```
Structure
  ┌─────────────────────────┐
  │  Photo 4:3              │  ← ratio fixe, `object-cover`
  │  [badge catégorie]  [♡] │  ← overlay sur la photo
  └─────────────────────────┘
  │  [badge saison(s)]      │  ← max 2 saisons affichées
  │  Titre de la recette    │  ← Playfair, max 2 lignes
  │  Description courte     │  ← DM Sans, max 2 lignes, gris moyen
  │  ⏱ 20 min  🔥 30 min  👥 4  €€ │
  ├─────────────────────────┤
  │  🥘 tomates, basilic... │  ← preview ingrédients
  │  12 janv. 2025   [✏][🗑]│  ← footer, actions au hover
  └─────────────────────────┘

États
  Default  : border-parchment-100, shadow légère
  Hover    : -translate-y-1, shadow plus portée, photo scale(1.03)
  Catégorie: fond légèrement teinté selon la catégorie
```

### Sidebar

La sidebar est la colonne vertébrale de l'app. Elle doit être stable et rassurante.

```
Largeur : 256px (fixe desktop), slide-over sur mobile
Fond    : blanc pur (#FFFFFF)
Bordure : 1px solid parchment-100 à droite

Sections
  ─ Logo (Playfair, avec version italic pour "Recettes")
  ─ Navigation principale (Toutes, Favoris, Planifier)
  ─ Section "Saisons" avec séparateur et label uppercase
  ─ Bouton "Nouvelle recette" (terracotta, pleine largeur)
  ─ Profil utilisateur avec déconnexion

NavLink actif : fond parchment-100, texte parchment-800
NavLink hover : fond parchment-50 transition 150ms
```

### Boutons

```
Primary (btn-primary)
  Fond      : terracotta-500
  Texte     : blanc
  Hover     : terracotta-600, légère élévation
  Radius    : 10px
  Padding   : 10px 18px
  Font      : DM Sans 14px medium

Secondary (btn-secondary)
  Fond      : transparent
  Bordure   : 1.5px solid parchment-200
  Texte     : parchment-600
  Hover     : fond parchment-50

Danger (btn-danger)
  Fond      : transparent
  Bordure   : 1.5px solid terracotta-200
  Texte     : terracotta-600
  Hover     : fond terracotta-50
```

### Inputs

```
Fond         : parchment-50
Bordure      : 1.5px solid parchment-200
Focus        : bordure terracotta-400, ring terracotta-100
Placeholder  : parchment-300
Radius       : 10px
Padding      : 10px 14px
Font         : DM Sans 14px
```

### Badges saisons

```
Printemps  : fond #E8F5E0, texte #2E7D32
Été        : fond #FFF8E1, texte #E65100
Automne    : fond #FFF3E0, texte #BF360C
Hiver      : fond #E3F2FD, texte #1565C0

Taille     : 11px, uppercase, letter-spacing 0.05em
Radius     : 99px (pill)
Padding    : 3px 10px
```

---

## Photographie & Images

L'image est la première chose qu'on voit. Elle donne le ton.

**Style photographique recommandé**
- Lumière naturelle, légèrement surexposée (pas de flash)
- Fond neutre : bois clair, marbre, lin beige, ardoise
- Cadrage généreux — ne pas hésiter à montrer le contexte (main, ustensile, nappe)
- Couleurs chaudes, pas de saturation artificielle
- Assiettes simples, poterie artisanale de préférence

**Traitement technique**
- Ratio d'affichage : 4:3 en card, 16:9 en hero page détail
- Conversion automatique WebP (déjà en place)
- Placeholder : fond parchment-100 + emoji centré de la catégorie

**Ce qu'il faut éviter**
- Photos stock trop parfaites et lisses
- Fonds blancs éblouissants (cassent l'ambiance parchemin)
- Filtres Instagram trop marqués

---

## Motion & Interactions

Les animations doivent évoquer la **physique du papier** — léger, réactif, sans être lourd.

```
Transitions de base
  Durée standard : 150ms  (hover, focus)
  Durée moyenne  : 250ms  (apparition d'élément)
  Durée longue   : 400ms  (modals, page transitions)
  Easing         : cubic-bezier(0.16, 1, 0.3, 1)  — "spring" léger

Comportements
  Card hover     : translateY(-4px) + shadow — comme soulever une fiche
  Photo hover    : scale(1.03) à l'intérieur du clip — loupe douce
  Bouton press   : scale(0.98) — retour haptique visuel
  Modal open     : fadeIn + scale(0.97→1) — apparition organique
  Page change    : fade 200ms — discret

Patterns à éviter
  Animations complexes en cascade (distrait, ralentit)
  Bounce excessif (trop ludique pour un carnet sérieux)
  Transitions > 500ms (frustrant pour des actions répétées)
```

**Framer Motion** est recommandé pour les transitions de page et les modals.

---

## Iconographie

Deux approches coexistent et se complètent :

**Emojis natifs** — pour les contenus (saisons 🌸☀️🍂❄️, catégories, actions rapides)
- Ils apportent de la chaleur et restent universellement lisibles
- Les limiter aux contextes "contenus" (badges, labels, empty states)

**Icônes linéaires** — pour les actions UI (navigation, boutons, formulaires)
- Recommandation : **Lucide React** (trait 1.5px, style cohérent, 1000+ icônes)
- Taille standard : 16px dans les boutons, 20px dans la navigation
- Stroke couleur : hérite du texte parent
- *Ne jamais mélanger deux bibliothèques d'icônes*

---

## Grille & Espacement

**Principe** : des espaces généreux qui respirent. L'erreur classique est de trop compresser.

```
Espacement de base : 4px (1 unité Tailwind)

Espacement recommandé
  Entre cards     : 24px (gap-6)
  Padding card    : 20px (p-5)
  Padding page    : 32px (p-8) desktop / 16px mobile
  Marge sidebar   : 256px

Breakpoints
  Mobile   : < 768px   — 1 colonne, sidebar en drawer
  Tablet   : 768-1024px — 2 colonnes
  Desktop  : > 1024px  — 3 colonnes (recettes)
```

---

## Voix & Ton (microcopy)

Le texte de l'interface fait partie du design.

**Ton général** : chaleureux et direct. Pas de jargon. Pas de formalité excessive. Comme un ami qui cuisine bien.

```
Labels de navigation
  ✓ "Toutes mes recettes"       ✗ "Recettes" (trop générique)
  ✓ "Planifier la semaine"      ✗ "Meal planner" (éviter l'anglais)
  ✓ "Nouvelle recette"          ✗ "Créer" / "Ajouter"

Empty states
  ✓ "Votre carnet est vide pour l'instant."
     Commencez par ajouter votre première recette.
  ✗ "Aucun résultat trouvé."

Actions destructives
  ✓ "Supprimer cette recette ?" avec sous-texte "Cette action est irréversible."
  ✗ "Êtes-vous sûr de vouloir supprimer ?"

Confirmations
  ✓ Toast : "Recette ajoutée aux favoris ♡"
  ✗ Alert : "Succès !"

Erreurs
  ✓ "Impossible d'enregistrer. Vérifiez votre connexion."
  ✗ "Erreur 500."
```

---

## Plan de mise en œuvre (priorités design)

### Phase 1 — Fondations (2–3 jours)
- Corriger le `tailwind.config.ts` : déclarer explicitement toutes les couleurs et polices custom
- Implémenter le responsive mobile avec sidebar en drawer (hamburger)
- Remplacer les `confirm()` natifs par un composant `ConfirmModal`
- Ajouter `react-hot-toast` avec style cohérent à la palette

### Phase 2 — Raffinement des composants (3–5 jours)
- Passer les boutons et inputs à la spec design ci-dessus
- Améliorer la page détail : hero photo pleine largeur avec titre en overlay
- Ajouter une animation d'entrée sur les cards (stagger fade-in)
- Implémenter le mode impression CSS (`@media print`)

### Phase 3 — Élévation visuelle (1 semaine)
- Transitions de page avec Framer Motion
- Illustrations pour les empty states (SVG artisanaux en style ligne)
- Refonte des badges saisons avec les couleurs affinées
- Mode sombre (optionnel, mais la palette s'y prête bien)

---

## Ce qu'il faut garder

- **Le thème parchemin** : il est identitaire et rare dans les apps culinaires. Ne pas l'abandonner pour un blanc générique.
- **Playfair Display** sur les titres de recettes : donne immédiatement de la noblesse au contenu.
- **JetBrains Mono** pour les quantités : c'est un détail élégant que les cuisiniers apprécient.
- **La sidebar fixe desktop** : elle ancre l'app et donne une navigation immédiate.

## Ce qu'il faut faire évoluer

- Ajouter de la **couleur terracotta** comme vrai accent (CTAs, états actifs, illustrations)
- Rendre les **saisons visuellement distinctes** — aujourd'hui les badges se ressemblent trop
- Introduire des **moments de blanc** (padding généreux, sections aérées) pour contrebalancer la chaleur du parchemin
- Soigner les **transitions** : elles manquent de cohérence entre les pages
