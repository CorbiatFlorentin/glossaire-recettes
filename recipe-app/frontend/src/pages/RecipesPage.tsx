import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useRecipes, useToggleFavorite, useDeleteRecipe } from '@/hooks/useRecipes';
import { RecipeFilters, Season, SortField, SEASON_LABELS, SEASON_EMOJIS } from '@/types';
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

  const season = (searchParams.get('season') as Season | null) || undefined;
  const favoriteParam = searchParams.get('favorite');
  const favorite = favoriteParam === 'true' ? true : undefined;

  const [sortBy, setSortBy] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const filters: RecipeFilters = {
    search: search || undefined,
    season,
    favorite,
    ingredient: ingredient || undefined,
    sortBy,
    sortOrder,
    page,
    limit: 12,
  };

  // Reset page on filter change
  useEffect(() => setPage(1), [search, season, favorite, ingredient, sortBy, sortOrder]);

  const { data, isLoading } = useRecipes(filters);
  const toggleFavorite = useToggleFavorite();
  const deleteRecipe = useDeleteRecipe();

  const pageTitle = favorite ? 'Mes Favoris' : season ? `Recettes de ${SEASON_LABELS[season]}` : 'Toutes mes recettes';

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8 animate-fade-in">
        <div>
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
        <Link to="/recipes/new" className="btn-primary">
          <span>+</span>
          Nouvelle recette
        </Link>
      </div>

      {/* Search + filters */}
      <div className="space-y-3 mb-8 animate-fade-in" style={{ animationDelay: '50ms' }}>
        <div className="flex gap-3">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Rechercher une recette..."
          />
          <SearchBar
            value={ingredient}
            onChange={setIngredient}
            placeholder="Filtrer par ingrédient..."
            icon="🥕"
          />
        </div>
        <FilterBar
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortByChange={setSortBy}
          onSortOrderChange={setSortOrder}
        />
      </div>

      {/* Grid */}
      {isLoading ? (
        <LoadingGrid />
      ) : !data?.data.length ? (
        <EmptyState
          title={search || ingredient ? 'Aucune recette trouvée' : 'Aucune recette pour le moment'}
          description={
            search || ingredient
              ? 'Essayez avec d\'autres mots-clés'
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
                  if (confirm(`Supprimer "${recipe.title}" ?`)) {
                    deleteRecipe.mutate(recipe.id);
                  }
                }}
              />
            ))}
          </div>

          {data.pagination.totalPages > 1 && (
            <div className="mt-10">
              <Pagination
                page={page}
                totalPages={data.pagination.totalPages}
                onPageChange={setPage}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}