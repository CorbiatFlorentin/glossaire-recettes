# Mes Recettes

> Un carnet de cuisine personnel. Classez, photographiez, planifiez — depuis votre navigateur ou par email.

---

## Aperçu

**Mes Recettes** est une application full-stack pensée comme un carnet de cuisine numérique : sobre, rapide et réellement utile au quotidien. On y retrouve l'essentiel — créer une recette, la retrouver par saison ou ingrédient, planifier la semaine — sans superflu.

L'originalité du projet tient à son **import par email** : envoyez un email depuis votre adresse enregistrée avec "recette" dans l'objet, et la recette apparaît automatiquement dans votre carnet, analysée et structurée.

---

## Fonctionnalités

**Carnet de recettes**
- Création manuelle avec ingrédients, temps, portions, catégorie et saison
- Import depuis une URL (Marmiton, 750g, et tout site utilisant JSON-LD)
- Import par email au format structuré (service IMAP temps réel)
- Photos multiples par recette avec conversion automatique en WebP
- Filtre par saison, catégorie (entrée / plat / dessert), ingrédient, favori
- Tri par date, titre, temps de cuisson, coût

**Planificateur de semaine**
- Grille semaine × repas (petit-déj, déjeuner, dîner)
- Ajout depuis vos recettes ou depuis une URL externe
- Navigation semaine par semaine

**Partage**
- Envoi d'une recette par email à n'importe quelle adresse

---

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS |
| State | Zustand + TanStack Query |
| Backend | Node.js + Express + TypeScript |
| ORM | Prisma |
| Base de données | PostgreSQL |
| Images | Multer + Sharp → WebP |
| Stockage images | Cloudinary (prod) / disque local (dev) |
| Auth | JWT + bcrypt |
| Email import | IMAP (node-imap + mailparser) |
| Email envoi | Resend |

---

## Démarrage rapide

### Prérequis

- Node.js 20+
- Docker (pour PostgreSQL) ou PostgreSQL local

### 1. Base de données

```bash
docker-compose up -d postgres
```

### 2. Variables d'environnement

```bash
cp backend/.env.example backend/.env
# Renseigner DATABASE_URL, JWT_SECRET, et optionnellement IMAP / Cloudinary / Resend
```

### 3. Installation et migration

```bash
npm run install:all
npm run db:migrate
```

### 4. Lancement

```bash
npm run dev              # backend (3001) + frontend (5173) en parallèle
npm run dev:email        # listener email (optionnel, processus séparé)
```

Ouvrir [http://localhost:5173](http://localhost:5173)

---

## Import par email

Envoyez un email **depuis l'adresse de votre compte** avec le mot-clé `recette` dans l'objet.

Le corps doit suivre ce format :

```
Objet : Recette — Gratin dauphinois

TITRE: Gratin Dauphinois
DESCRIPTION: Un classique réconfortant de la cuisine savoyarde
TEMPS_PREP: 20
TEMPS_CUISSON: 45
PORTIONS: 6
SAISONS: AUTUMN, WINTER

INGREDIENTS:
- 1 kg pommes de terre
- 40 cl crème fraîche
- 2 gousses d'ail
- 50 g beurre
- sel, poivre

INSTRUCTIONS:
Épluchez et tranchez finement les pommes de terre.
Frottez le plat avec l'ail et beurrez-le généreusement.
Disposez les couches en alternant avec la crème...
```

### Configuration IMAP

| Fournisseur | `IMAP_HOST` | `IMAP_PORT` |
|-------------|-------------|-------------|
| Gmail | `imap.gmail.com` | `993` |
| Outlook / Hotmail | `outlook.office365.com` | `993` |
| Yahoo | `imap.mail.yahoo.com` | `993` |
| OVH | `ssl0.ovh.net` | `993` |

Pour Gmail : activez l'accès IMAP dans les paramètres, puis créez un [mot de passe d'application](https://myaccount.google.com/apppasswords) (2FA requis).

---

## API

### Authentification

```
POST /api/auth/register   { name, email, password }
POST /api/auth/login      { email, password }
GET  /api/auth/me                                     — JWT requis
```

### Recettes

```
GET    /api/recipes        ?search, season, category, favorite, ingredient, sortBy, sortOrder, page, limit
GET    /api/recipes/:id
POST   /api/recipes        { title, instructions, description?, season[], category?, prepTime?, cookTime?, servings?, ingredients[] }
PUT    /api/recipes/:id
DELETE /api/recipes/:id
PATCH  /api/recipes/:id/favorite
```

### Photos

```
POST   /api/upload/:recipeId/photos
DELETE /api/upload/:recipeId/photos/:photoId
PATCH  /api/upload/:recipeId/photos/:photoId/main
```

### Planificateur

```
GET  /api/meal-plans/week     ?weekStart=YYYY-MM-DD
PUT  /api/meal-plans/:id/entries
DELETE /api/meal-plans/:id/entries/:entryId
POST /api/meal-plans/scrape   { url }
```

---

## Variables d'environnement

| Variable | Description | Requis |
|----------|-------------|--------|
| `DATABASE_URL` | URL PostgreSQL | ✓ |
| `JWT_SECRET` | Clé secrète JWT (min. 32 caractères) | ✓ |
| `JWT_EXPIRES_IN` | Durée de vie du token | `7d` |
| `PORT` | Port du serveur | `3001` |
| `FRONTEND_URL` | URL du frontend (CORS) | `http://localhost:5173` |
| `CLOUDINARY_CLOUD_NAME` | Nom du projet Cloudinary | prod |
| `CLOUDINARY_API_KEY` | Clé API Cloudinary | prod |
| `CLOUDINARY_API_SECRET` | Secret API Cloudinary | prod |
| `RESEND_API_KEY` | Clé API Resend (envoi email) | partage |
| `EMAIL_FROM` | Adresse expéditeur | partage |
| `IMAP_HOST` | Serveur IMAP | import email |
| `IMAP_PORT` | Port IMAP | `993` |
| `IMAP_USER` | Adresse email IMAP | import email |
| `IMAP_PASSWORD` | Mot de passe IMAP | import email |
| `IMAP_MAILBOX` | Boîte à surveiller | `INBOX` |
| `EMAIL_RECIPE_TAG` | Mot-clé dans le sujet | `recette` |
| `UPLOAD_DIR` | Dossier uploads local (dev) | `uploads` |
| `MAX_FILE_SIZE_MB` | Taille max photo | `10` |

---

## Modèle de données

```
User
 └── Recipe
      ├── RecipeIngredient[]
      ├── RecipePhoto[]
      └── MealPlanEntry[]

MealPlan (User, weekStart)
 └── MealPlanEntry[]

Enums
  Season          : SPRING | SUMMER | AUTUMN | WINTER
  CourseCategory  : STARTER | MAIN | DESSERT
  MealType        : BREAKFAST | LUNCH | DINNER
  RecipeSource    : MANUAL | EMAIL
```

---

## Structure du projet

```
.
├── backend/
│   ├── prisma/
│   │   └── schema.prisma
│   └── src/
│       ├── controllers/      auth · recipe · upload · share · mealplan
│       ├── middleware/        auth · error · upload
│       ├── routes/            auth · recipe · upload · share · mealplan
│       ├── services/          email.service · emailListener · scraper
│       ├── lib/               prisma · cloudinary
│       └── utils/             jwt
└── frontend/
    └── src/
        ├── components/
        │   ├── layout/        Layout (sidebar)
        │   ├── recipes/       RecipeCard · RecipeForm · PhotoUploader · ShareModal
        │   └── ui/            SearchBar · FilterBar · Pagination · EmptyState · LoadingGrid
        ├── hooks/             useRecipes
        ├── pages/             Recipes · RecipeDetail · NewRecipe · EditRecipe · MealPlanner · Login · Register
        ├── stores/            auth.store
        └── lib/               api (axios)
```

---

## Déploiement

Le projet est configuré pour **Render** via `render.yaml` (service web Node.js + PostgreSQL managé). Les images sont hébergées sur **Cloudinary**.

CI/CD via GitHub Actions : lint + build sur chaque push, déploiement automatique sur merge sur `main`.
