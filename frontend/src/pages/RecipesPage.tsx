import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useRecipes, useToggleFavorite, useDeleteRecipe } from '@/hooks/useRecipes';
import {
  RecipeFilters, Season, CourseCategory,
  SEASON_LABELS, SEASON_EMOJIS,
  CATEGORY_LABELS, CATEGORY_EMOJIS,
} from '@/types';
import RecipeCard from '@/components/recipes/RecipeCard';
import SearchBar from '@/components/ui/SearchBar';
import FilterBar from '@/components/ui/FilterBar';
import Pagination from '@/components/ui/Pagination';
import EmptyState from '@/components/ui/EmptyState';
import LoadingGrid from '@/components/ui/LoadingGrid';

export default function RecipesPage() {
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [ingredient, setIngredient] = useState('');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<RecipeFilters['sortBy']>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [category, setCategory] = useState<CourseCategory | ''>('');

  const season = (searchParams.get('season') as Season | null) || undefined;
  const favoriteParam = searchParams.get('favorite');
  const favorite = favoriteParam === 'true' ? true : undefined;

  const filters: RecipeFilters = {
    search: search || undefined,
    season,
    category: category || undefined,
    favorite,
    ingredient: ingredient || undefined,
    sortBy,
    sortOrder,
    page,
    limit: 12,
  };

  const { data, isLoading } = useRecipes(filters);
  const toggleFavorite = useToggleFavorite();
  const deleteRecipe = useDeleteRecipe();

  const pageTitle = favorite
    ? 'Mes Favoris'
    : season
    ? `Recettes de ${SEASON_LABELS[season]}`
    : category
    ? `${CATEGORY_EMOJIS[category]} ${CATEGORY_LABELS[category]}s`
    : 'Toutes mes recettes';

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header — sans bouton "Nouvelle recette" */}
      <div className="mb-8 animate-fade-in">
        <h2 className="text-3xl font-display font-bold text-parchment-800">
          {season && <span className="mr-2">{SEASON_EMOJIS[season]}</span>}
          {pageTitle}
        </h2>
        {data && (
          <p className="text-sm text-parchment-400 mt-1 font-body">
            {data.pagination.total} recette{data.pagination.total !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Filtres */}
      <div className="space-y-3 mb-8 animate-fade-in" style={{ animationDelay: '50ms' }}>
        <div className="flex gap-3">
          <SearchBar value={search} onChange={setSearch} placeholder="Rechercher une recette..." />
          <SearchBar value={ingredient} onChange={setIngredient} placeholder="Filtrer par ingrédient..." icon="🥕" />
        </div>

        {/* Filtre catégorie */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-parchment-400 font-medium uppercase tracking-wider">Catégorie</span>
          {(['', 'STARTER', 'MAIN', 'DESSERT'] as (CourseCategory | '')[]).map((cat) => (
            <button
              key={cat || 'all'}
              onClick={() => { setCategory(cat); setPage(1); }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                category === cat
                  ? 'bg-parchment-600 text-white border-parchment-600'
                  : 'bg-white text-parchment-500 border-parchment-200 hover:border-parchment-400'
              }`}
            >
              {cat === '' ? 'Toutes' : `${CATEGORY_EMOJIS[cat]} ${CATEGORY_LABELS[cat]}`}
            </button>
          ))}
        </div>

        <FilterBar
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortByChange={setSortBy}
          onSortOrderChange={setSortOrder}
        />
      </div>

      {/* Grille */}
      {isLoading ? (
        <LoadingGrid />
      ) : !data?.data.length ? (
        <EmptyState
          title={search || ingredient ? 'Aucune recette trouvée' : 'Aucune recette pour le moment'}
          description={
            search || ingredient
              ? "Essayez avec d'autres mots-clés"
              : 'Commencez par créer votre première recette !'
          }
          action={!search && !ingredient ? { label: 'Créer une recette', to: '/recipes/new' } : undefined}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
            {data.data.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                onToggleFavorite={() => toggleFavorite.mutate(recipe.id)}
                onDelete={() => {
                  if (confirm(`Supprimer "${recipe.title}" ?`)) deleteRecipe.mutate(recipe.id);
                }}
              />
            ))}
          </div>
          {data.pagination.totalPages > 1 && (
            <div className="mt-10">
              <Pagination page={page} totalPages={data.pagination.totalPages} onPageChange={setPage} />
            </div>
          )}
        </>
      )}
    </div>
  );
}