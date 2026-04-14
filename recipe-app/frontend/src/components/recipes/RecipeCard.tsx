import { Link } from 'react-router-dom';
import { Recipe, SEASON_LABELS, SEASON_EMOJIS, CATEGORY_LABELS, CATEGORY_EMOJIS, CATEGORY_COLORS, COST_LABELS } from '@/types';
import clsx from 'clsx';

interface Props {
  recipe: Recipe;
  onToggleFavorite: () => void;
  onDelete: () => void;
}

function totalCost(recipe: Recipe): number {
  return recipe.ingredients.reduce((sum, i) => sum + (i.cost || 0), 0);
}

export default function RecipeCard({ recipe, onToggleFavorite, onDelete }: Props) {
  const mainPhoto = recipe.photos.find((p) => p.isMain) || recipe.photos[0];
  const colors = recipe.category ? CATEGORY_COLORS[recipe.category] : null;
  const cost = totalCost(recipe);

  return (
    <article
      className={clsx(
        'group rounded-2xl border overflow-hidden transition-all duration-300 hover:-translate-y-0.5',
        'shadow-card hover:shadow-card-hover',
        colors ? `${colors.cardBg} ${colors.border}` : 'bg-white border-parchment-100'
      )}
    >
      {/* Photo */}
      <Link to={`/recipes/${recipe.id}`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-parchment-100">
          {mainPhoto ? (
            <img
              src={mainPhoto.path}
              alt={recipe.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className={clsx(
              'w-full h-full flex items-center justify-center text-5xl',
              colors ? colors.bg : 'bg-parchment-50'
            )}>
              {recipe.category ? CATEGORY_EMOJIS[recipe.category] : '🍽️'}
            </div>
          )}

          {/* Catégorie badge */}
          {recipe.category && (
            <span className={clsx('absolute top-3 left-3 badge', colors?.bg, colors?.text)}>
              {CATEGORY_EMOJIS[recipe.category]} {CATEGORY_LABELS[recipe.category]}
            </span>
          )}

          {recipe.source === 'EMAIL' && (
            <span className="absolute top-3 left-3 badge-email text-xs">📧 Email</span>
          )}

          {/* Favori */}
          <button
            onClick={(e) => { e.preventDefault(); onToggleFavorite(); }}
            className={clsx(
              'absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center text-sm',
              'bg-white/80 backdrop-blur-sm hover:bg-white transition-all shadow-sm',
              recipe.favorite ? 'text-red-500' : 'text-parchment-300 hover:text-red-400'
            )}
          >
            {recipe.favorite ? '❤️' : '🤍'}
          </button>
        </div>
      </Link>

      {/* Body */}
      <div className="p-5">
        {/* Saisons */}
        {recipe.season.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {recipe.season.map((s) => (
              <span key={s} className={`badge badge-${s.toLowerCase()}`}>
                {SEASON_EMOJIS[s]} {SEASON_LABELS[s]}
              </span>
            ))}
          </div>
        )}

        <Link to={`/recipes/${recipe.id}`}>
          <h3 className="font-display font-semibold text-parchment-800 text-lg leading-snug hover:text-parchment-600 transition-colors line-clamp-2">
            {recipe.title}
          </h3>
        </Link>

        {recipe.description && (
          <p className="text-sm text-parchment-500 mt-1.5 line-clamp-2 leading-relaxed">
            {recipe.description}
          </p>
        )}

        {/* Meta */}
        <div className="flex items-center gap-4 mt-4 text-xs text-parchment-400">
          {recipe.prepTime && <span>⏱ {recipe.prepTime} min</span>}
          {recipe.cookTime && <span>🔥 {recipe.cookTime} min</span>}
          {recipe.servings && <span>👥 {recipe.servings} pers.</span>}
          {cost > 0 && (
            <span className="ml-auto font-medium text-parchment-600" title={`Coût total : ${cost} €`}>
              {COST_LABELS[Math.min(cost, 5)] || '€€€€€+'}
            </span>
          )}
        </div>

        {/* Ingrédients preview */}
        {recipe.ingredients.length > 0 && (
          <p className="text-xs text-parchment-400 mt-3 line-clamp-1">
            🥘 {recipe.ingredients.slice(0, 4).map((i) => i.name).join(', ')}
            {recipe.ingredients.length > 4 && ` +${recipe.ingredients.length - 4}`}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-parchment-100/60">
          <span className="text-xs text-parchment-300">
            {new Date(recipe.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Link
              to={`/recipes/${recipe.id}/edit`}
              className="text-xs text-parchment-400 hover:text-parchment-600 px-2 py-1 rounded hover:bg-white/60 transition-all"
            >
              Modifier
            </Link>
            <button
              onClick={onDelete}
              className="text-xs text-parchment-400 hover:text-terracotta-400 px-2 py-1 rounded hover:bg-white/60 transition-all"
            >
              Supprimer
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}