# 🍽️ Mes Recettes — Application full-stack

Application de gestion de recettes personnelles avec import par email, classification avancée et gestion de photos.

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS (thème parchement custom) |
| State | Zustand + React Query |
| Backend | Node.js + Express + TypeScript |
| ORM | Prisma |
| Base de données | PostgreSQL |
| Email | IMAP (node-imap + mailparser) |
| Images | Multer + Sharp (conversion WebP auto) |
| Auth | JWT (jsonwebtoken + bcryptjs) |

---

## 📁 Structure du projet

```
recipe-app/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          # Modèles BDD (User, Recipe, Ingredient, Photo)
│   │   └── migrations/
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── auth.controller.ts
│   │   │   ├── recipe.controller.ts
│   │   │   └── upload.controller.ts
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts
│   │   │   ├── error.middleware.ts
│   │   │   └── upload.middleware.ts
│   │   ├── routes/
│   │   │   ├── auth.routes.ts
│   │   │   ├── recipe.routes.ts
│   │   │   └── upload.routes.ts
│   │   ├── services/
│   │   │   └── emailListener.ts   # Service IMAP temps réel
│   │   ├── utils/jwt.ts
│   │   ├── types/index.ts
│   │   ├── lib/prisma.ts
│   │   └── index.ts
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/Layout.tsx      # Sidebar + navigation
│   │   │   ├── recipes/
│   │   │   │   ├── RecipeCard.tsx
│   │   │   │   ├── RecipeForm.tsx     # Formulaire partagé new/edit
│   │   │   │   └── PhotoUploader.tsx  # Drag & drop photos
│   │   │   └── ui/
│   │   │       ├── SearchBar.tsx
│   │   │       ├── FilterBar.tsx
│   │   │       ├── Pagination.tsx
│   │   │       ├── EmptyState.tsx
│   │   │       └── LoadingGrid.tsx
│   │   ├── hooks/useRecipes.ts        # React Query hooks
│   │   ├── pages/
│   │   │   ├── RecipesPage.tsx        # Liste + filtres
│   │   │   ├── RecipeDetailPage.tsx
│   │   │   ├── NewRecipePage.tsx
│   │   │   ├── EditRecipePage.tsx
│   │   │   ├── LoginPage.tsx
│   │   │   └── RegisterPage.tsx
│   │   ├── stores/auth.store.ts       # Zustand auth
│   │   ├── lib/api.ts                 # Axios + intercepteurs
│   │   ├── types/index.ts
│   │   └── App.tsx
│   ├── tailwind.config.ts
│   └── package.json
├── docker-compose.yml
└── package.json
```

---

## 🚀 Installation et démarrage

### 1. Prérequis

- Node.js 20+
- Docker (pour PostgreSQL) ou PostgreSQL installé localement

### 2. Lancer PostgreSQL

```bash
docker-compose up -d postgres
```

La base sera disponible sur `postgresql://recipe_user:recipe_pass@localhost:5432/recipe_app`

### 3. Configurer l'environnement backend

```bash
cp backend/.env.example backend/.env
# Éditez backend/.env avec vos valeurs
```

### 4. Installer les dépendances

```bash
npm run install:all
```

### 5. Migrer la base de données

```bash
npm run db:migrate
```

### 6. Lancer l'application

```bash
# Backend + frontend en parallèle
npm run dev

# Séparément :
npm run dev:backend   # port 3001
npm run dev:frontend  # port 5173

# Listener email (séparé)
npm run dev:email
```

Ouvrez [http://localhost:5173](http://localhost:5173)

---

## 📧 Import par email

### Format d'email attendu

Envoyez un email depuis votre adresse enregistrée avec **"recette"** dans l'objet :

```
Objet: Recette - Gratin dauphinois

TITRE: Gratin Dauphinois
DESCRIPTION: Un classique réconfortant
TEMPS_PREP: 20
TEMPS_CUISSON: 45
PORTIONS: 6
SAISONS: AUTUMN, WINTER

INGREDIENTS:
- 1 kg pommes de terre
- 40 cl crème fraîche
- 2 gousses ail
- 50 g beurre
- sel
- poivre

INSTRUCTIONS:
Épluchez et tranchez finement les pommes de terre.
Frottez le plat avec l'ail et beurrez-le.
Disposez les couches de pommes de terre...
```

### Configuration IMAP (Gmail)

1. Activez l'accès IMAP dans Gmail (Paramètres → Voir tous les paramètres → Transfert et POP/IMAP)
2. Créez un [mot de passe d'application](https://myaccount.google.com/apppasswords) (2FA requis)
3. Renseignez `IMAP_USER` et `IMAP_PASSWORD` dans `.env`

### Autres fournisseurs

| Fournisseur | IMAP_HOST | IMAP_PORT |
|-------------|-----------|-----------|
| Gmail | imap.gmail.com | 993 |
| Outlook/Hotmail | outlook.office365.com | 993 |
| Yahoo | imap.mail.yahoo.com | 993 |
| OVH | ssl0.ovh.net | 993 |

---

## 🔌 API Endpoints

### Auth
```
POST /api/auth/register   { name, email, password }
POST /api/auth/login      { email, password }
GET  /api/auth/me         → user (JWT requis)
```

### Recettes
```
GET    /api/recipes              ?search, season, favorite, ingredient, sortBy, sortOrder, page, limit
GET    /api/recipes/:id
POST   /api/recipes              { title, instructions, description?, season[], prepTime?, cookTime?, servings?, ingredients[] }
PUT    /api/recipes/:id
DELETE /api/recipes/:id
PATCH  /api/recipes/:id/favorite
```

### Photos
```
POST   /api/upload/:recipeId/photos          multipart/form-data { photo: File }
DELETE /api/upload/:recipeId/photos/:photoId
PATCH  /api/upload/:recipeId/photos/:photoId/main
```

---

## 🎨 Design

Le frontend utilise une palette "parchemin" chaude et des typographies éditoriales :
- **Playfair Display** pour les titres (caractère éditorial)
- **DM Sans** pour le corps de texte (lisibilité)
- **JetBrains Mono** pour les quantités d'ingrédients

---

## 🗄️ Modèle de données

```
User
 └── Recipe (userId)
      ├── RecipeIngredient[] (recipeId)
      └── RecipePhoto[]      (recipeId)

Enums : Season (SPRING|SUMMER|AUTUMN|WINTER)
        RecipeSource (MANUAL|EMAIL)
```

---

## 🔒 Sécurité

- Mots de passe hashés avec bcrypt (12 rounds)
- JWT expiration configurable (défaut 7 jours)
- Chaque recette est strictement liée à son propriétaire (`userId`)
- Les photos sont converties en WebP et redimensionnées à max 1200×900px
- Validation des types MIME sur les uploads

---

## 📦 Variables d'environnement

| Variable | Description | Défaut |
|----------|-------------|--------|
| `DATABASE_URL` | URL PostgreSQL | — |
| `JWT_SECRET` | Clé secrète JWT | — |
| `JWT_EXPIRES_IN` | Durée de vie du token | `7d` |
| `PORT` | Port du serveur | `3001` |
| `FRONTEND_URL` | URL du frontend (CORS) | `http://localhost:5173` |
| `IMAP_HOST` | Serveur IMAP | `imap.gmail.com` |
| `IMAP_PORT` | Port IMAP | `993` |
| `IMAP_USER` | Email IMAP | — |
| `IMAP_PASSWORD` | Mot de passe IMAP | — |
| `IMAP_MAILBOX` | Boîte à écouter | `INBOX` |
| `EMAIL_RECIPE_TAG` | Mot-clé dans le sujet | `recette` |
| `UPLOAD_DIR` | Dossier d'uploads | `uploads` |
| `MAX_FILE_SIZE_MB` | Taille max des photos | `10` |