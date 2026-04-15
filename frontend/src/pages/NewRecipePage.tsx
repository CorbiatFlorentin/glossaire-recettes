import { useNavigate } from 'react-router-dom';
import { useCreateRecipe } from '@/hooks/useRecipes';
import { CreateRecipeDto } from '@/types';
import RecipeForm from '@/components/recipes/RecipeForm';

export default function NewRecipePage() {
  const navigate = useNavigate();
  const createRecipe = useCreateRecipe();

  const handleSubmit = async (data: CreateRecipeDto) => {
    const recipe = await createRecipe.mutateAsync(data);
    navigate(`/recipes/${recipe.id}`);
  };

  return (
    <div className="p-8 max-w-3xl mx-auto animate-fade-in">
      <div className="mb-8">
        <button onClick={() => navigate(-1)} className="text-sm text-parchment-400 hover:text-parchment-600 transition-colors mb-4 flex items-center gap-1.5">
          ← Retour
        </button>
        <h2 className="text-3xl font-display font-bold text-parchment-800">Nouvelle recette</h2>
        <p className="text-parchment-400 text-sm mt-1">Ajoutez une recette manuellement</p>
      </div>

      <RecipeForm
        onSubmit={handleSubmit}
        isLoading={createRecipe.isPending}
        submitLabel="Créer la recette"
      />
    </div>
  );
}