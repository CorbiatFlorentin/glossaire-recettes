import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useRecipe, useToggleFavorite, useDeleteRecipe, useUploadPhoto, useDeletePhoto } from '@/hooks/useRecipes';
import { api } from '@/lib/api';
import { SEASON_LABELS, SEASON_EMOJIS } from '@/types';
import PhotoUploader from '@/components/recipes/PhotoUploader';
import ShareModal from '@/components/recipes/ShareModal';
import clsx from 'clsx';

export default function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: recipe, isLoading } = useRecipe(id!);
  const toggleFavorite = useToggleFavorite();
  const deleteRecipe = useDeleteRecipe();
  const uploadPhoto = useUploadPhoto(id!);
  const deletePhoto = useDeletePhoto(id!);
  const [activePhoto, setActivePhoto] = useState<number>(0);
  const [showShareModal, setShowShareModal] = useState(false);
  const [currentServings, setCurrentServings] = useState<number | null>(null);

  const baseServings = recipe?.servings ?? null;
  const servings = currentServings ?? baseServings ?? 1;
  const ratio = baseServings ? servings / baseServings : 1;

  const handleSetMain = async (photoId: string) => {
    await api.patch(`/upload/${id}/photos/${photoId}/main`);
  };

  const handleDelete = async () => {
    if (!confirm(`Supprimer "${recipe?.title}" ?`)) return;
    await deleteRecipe.mutateAsync(id!);
    navigate('/');
  };

  if (isLoading) {
    return (
      <div className="p-8 max-w-4xl mx-auto animate-pulse space-y-6">
        <div className="h-8 bg-parchment-100 rounded w-1/2" />
        <div className="aspect-video bg-parchment-100 rounded-2xl" />
        <div className="h-4 bg-parchment-100 rounded w-full" />
      </div>
    );
  }

  if (!recipe) return null;

  function parseQty(q: string): number | null {
    const s = q.trim().replace(',', '.');
    const frac = s.match(/^(\d+)\/(\d+)$/);
    if (frac) return parseInt(frac[1]) / parseInt(frac[2]);
    const mixed = s.match(/^(\d+)\s+(\d+)\/(\d+)$/);
    if (mixed) return parseInt(mixed[1]) + parseInt(mixed[2]) / parseInt(mixed[3]);
    const n = parseFloat(s);
    return isNaN(n) ? null : n;
  }

  function formatQty(n: number): string {
    if (Number.isInteger(n)) return String(n);
    const r = Math.round(n * 10) / 10;
    return String(r).replace('.', ',');
  }

  function scaleQty(quantity: string | null | undefined): string {
    if (!quantity) return '';
    const n = parseQty(quantity);
    if (n === null) return quantity;
    return formatQty(n * ratio);
  }

  const mainPhotoIndex = recipe.photos.findIndex((p) => p.isMain);
  const displayIndex = mainPhotoIndex >= 0 ? mainPhotoIndex : 0;
  const currentPhoto = recipe.photos[activePhoto >= 0 ? activePhoto : displayIndex];

  return (
    <>
    <div className="p-8 max-w-4xl mx-auto animate-fade-in">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-parchment-400 mb-6">
        <Link to="/" className="hover:text-parchment-600 transition-colors">Recettes</Link>
        <span>›</span>
        <span className="text-parchment-600 truncate max-w-xs">{recipe.title}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left column */}
        <div className="lg:col-span-3 space-y-6">
          {/* Hero photo */}
          {recipe.photos.length > 0 && (
            <div className="space-y-3">
              <div className="aspect-video rounded-2xl overflow-hidden bg-parchment-100 shadow-card">
                <img
                  src={currentPhoto?.path}
                  alt={recipe.title}
                  className="w-full h-full object-cover"
                />
              </div>
              {recipe.photos.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {recipe.photos.map((p, i) => (
                    <button
                      key={p.id}
                      onClick={() => setActivePhoto(i)}
                      className={clsx(
                        'flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all',
                        i === activePhoto ? 'border-parchment-600' : 'border-transparent opacity-60 hover:opacity-100'
                      )}
                    >
                      <img src={p.path} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Instructions */}
          <div className="card p-6">
            <h3 className="font-display text-lg font-semibold text-parchment-700 mb-4 flex items-center gap-2">
              <span>📋</span> Instructions
            </h3>
            <div className="prose prose-sm max-w-none">
              {recipe.instructions.split('\n').filter(Boolean).map((line, i) => (
                <p key={i} className="text-parchment-700 leading-relaxed mb-3 last:mb-0 font-body">
                  {line}
                </p>
              ))}
            </div>
          </div>

          {/* Photos section */}
          <div className="card p-6">
            <h3 className="font-display text-lg font-semibold text-parchment-700 mb-4 flex items-center gap-2">
              <span>📷</span> Photos
            </h3>
            <PhotoUploader
              photos={recipe.photos}
              onUpload={(file) => uploadPhoto.mutate(file)}
              onDelete={(photoId) => deletePhoto.mutate(photoId)}
              onSetMain={handleSetMain}
              isUploading={uploadPhoto.isPending}
            />
          </div>
        </div>

        {/* Right column */}
        <div className="lg:col-span-2 space-y-5">
          {/* Header card */}
          <div className="card p-6">
            <div className="flex items-start justify-between gap-3 mb-3">
              <h2 className="text-2xl font-display font-bold text-parchment-800 leading-tight">
                {recipe.title}
              </h2>
              <button
                onClick={() => toggleFavorite.mutate(recipe.id)}
                className="text-2xl flex-shrink-0 hover:scale-110 transition-transform"
              >
                {recipe.favorite ? '❤️' : '🤍'}
              </button>
            </div>

            {recipe.description && (
              <p className="text-sm text-parchment-500 leading-relaxed mb-4">{recipe.description}</p>
            )}

            {/* Seasons */}
            {recipe.season.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {recipe.season.map((s) => (
                  <span key={s} className={`badge badge-${s.toLowerCase()}`}>
                    {SEASON_EMOJIS[s]} {SEASON_LABELS[s]}
                  </span>
                ))}
              </div>
            )}

            {/* Meta grid */}
            <div className="grid grid-cols-3 gap-3 py-4 border-y border-parchment-50">
              {recipe.prepTime && (
                <div className="text-center">
                  <p className="text-xs text-parchment-400 mb-0.5">Préparation</p>
                  <p className="text-sm font-semibold text-parchment-700">{recipe.prepTime} min</p>
                </div>
              )}
              {recipe.cookTime && (
                <div className="text-center">
                  <p className="text-xs text-parchment-400 mb-0.5">Cuisson</p>
                  <p className="text-sm font-semibold text-parchment-700">{recipe.cookTime} min</p>
                </div>
              )}
              {baseServings && (
                <div className="text-center">
                  <p className="text-xs text-parchment-400 mb-1">Portions</p>
                  <div className="flex items-center justify-center gap-1.5">
                    <button
                      onClick={() => setCurrentServings(Math.max(1, servings - 1))}
                      className="w-6 h-6 rounded-full bg-parchment-100 hover:bg-parchment-200 text-parchment-600 text-sm font-bold transition-colors flex items-center justify-center"
                    >−</button>
                    <span className="text-sm font-semibold text-parchment-700 min-w-[2rem] text-center">{servings}</span>
                    <button
                      onClick={() => setCurrentServings(servings + 1)}
                      className="w-6 h-6 rounded-full bg-parchment-100 hover:bg-parchment-200 text-parchment-600 text-sm font-bold transition-colors flex items-center justify-center"
                    >+</button>
                  </div>
                  {ratio !== 1 && (
                    <button onClick={() => setCurrentServings(null)} className="text-xs text-parchment-400 hover:text-parchment-600 mt-0.5 transition-colors">
                      reset
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Source */}
            {recipe.source === 'EMAIL' && (
              <p className="text-xs text-parchment-400 mt-3 flex items-center gap-1.5">
                <span>📧</span>
                Reçue par email de <span className="font-medium">{recipe.emailFrom}</span>
              </p>
            )}

            <p className="text-xs text-parchment-300 mt-2">
              Ajoutée le {new Date(recipe.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>

          {/* Ingredients */}
          {recipe.ingredients.length > 0 && (
            <div className="card p-6">
              <h3 className="font-display text-lg font-semibold text-parchment-700 mb-4 flex items-center gap-2">
                <span>🥘</span> Ingrédients
              </h3>
              <ul className="space-y-2.5">
                {recipe.ingredients.map((ing) => (
                  <li key={ing.id} className="flex items-baseline gap-2 text-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-parchment-300 flex-shrink-0 mt-1.5" />
                    {(ing.quantity || ing.unit) && (
                      <span className={clsx('font-medium flex-shrink-0 font-mono text-xs', ratio !== 1 ? 'text-parchment-800' : 'text-parchment-600')}>
                        {scaleQty(ing.quantity)}{ing.unit && ` ${ing.unit}`}
                      </span>
                    )}
                    <span className="text-parchment-700">{ing.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Link to={`/recipes/${id}/edit`} className="btn-secondary flex-1 justify-center">
              ✏️ Modifier
            </Link>
            <button onClick={handleDelete} className="btn-danger flex-1 justify-center">
              🗑 Supprimer
            </button>
          </div>

          <button
            onClick={() => setShowShareModal(true)}
            className="btn-secondary w-full justify-center"
          >
            📧 Envoyer par email
          </button>
        </div>
      </div>
    </div>

    {showShareModal && (
      <ShareModal
        recipeId={id!}
        recipeTitle={recipe.title}
        onClose={() => setShowShareModal(false)}
      />
    )}
    </>
  );
}