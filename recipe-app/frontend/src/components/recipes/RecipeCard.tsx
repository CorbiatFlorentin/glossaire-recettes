import { Link } from 'react-router-dom';
import { Recipe } from '@/types';

interface Props {
  recipe: Recipe;
  onToggleFavorite?: () => void;
  onDelete?: () => void;
}

export default function RecipeCard({ recipe, onToggleFavorite, onDelete }: Props) {
  return (
    <article className="card p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-parchment-900">{recipe.title || 'Sans titre'}</h3>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={onToggleFavorite} className="btn-ghost">
            ♥
          </button>
          {onDelete && (
            <button type="button" onClick={onDelete} className="btn-ghost text-terracotta-500">
              ✕
            </button>
          )}
        </div>
      </div>
      <p className="text-sm text-parchment-500 line-clamp-2">{recipe.description || 'Aucune description'}</p>
      <Link to={`/recipes/${recipe.id}`} className="text-sm text-parchment-600 hover:text-parchment-800">
        Voir la recette
      </Link>
    </article>
  );
}
