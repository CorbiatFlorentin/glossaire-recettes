import { useNavigate, useParams } from 'react-router-dom';
import { useRecipe, useUpdateRecipe } from '@/hooks/useRecipes';
import { CreateRecipeDto } from '@/types';
import RecipeForm from '@/components/recipes/RecipeForm';

export default function EditRecipePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: recipe, isLoading } = useRecipe(id!);
  const updateRecipe = useUpdateRecipe(id!);

  const handleSubmit = async (data: CreateRecipeDto) => {
    await updateRecipe.mutateAsync(data);
    navigate(`/recipes/${id}`);
  };

  if (isLoading) {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-parchment-100 rounded w-1/3" />
          <div className="h-64 bg-parchment-100 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!recipe) return null;

  return (
    <div className="p-8 max-w-3xl mx-auto animate-fade-in">
      <div className="mb-8">
        <button onClick={() => navigate(-1)} className="text-sm text-parchment-400 hover:text-parchment-600 transition-colors mb-4 flex items-center gap-1.5">
          ← Retour
        </button>
        <h2 className="text-3xl font-display font-bold text-parchment-800">Modifier la recette</h2>
        <p className="text-parchment-400 text-sm mt-1 font-italic">{recipe.title}</p>
      </div>

      <RecipeForm
        defaultValues={{
          title: recipe.title,
          description: recipe.description,
          instructions: recipe.instructions,
          servings: recipe.servings,
          prepTime: recipe.prepTime,
          cookTime: recipe.cookTime,
          season: recipe.season,
          ingredients: recipe.ingredients.map(({ name, quantity, unit }) => ({ name, quantity: quantity ?? '', unit: unit ?? '' })),
        }}
        onSubmit={handleSubmit}
        isLoading={updateRecipe.isPending}
        submitLabel="Enregistrer les modifications"
      />
    </div>
  );
}