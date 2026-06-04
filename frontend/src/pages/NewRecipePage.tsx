import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateRecipe } from '@/hooks/useRecipes';
import { CreateRecipeDto } from '@/types';
import RecipeForm from '@/components/recipes/RecipeForm';
import { api } from '@/lib/api';

interface ScrapedRecipe {
  title: string;
  description?: string;
  prepTime?: number;
  cookTime?: number;
  servings?: number;
  ingredients: string[];
  instructions: string;
}

function parseIngredient(raw: string): { quantity: string; unit: string; name: string } {
  const s = raw.trim();
  const numMatch = s.match(/^(\d+(?:[.,]\d+)?(?:\/\d+)?)\s*(.*)/);
  if (!numMatch) return { quantity: '', unit: '', name: s };

  const qty = numMatch[1];
  const rest = numMatch[2];

  // "gr" doit être avant "g" pour éviter que "gr" soit matché en "g" + "r" résiduel
  const unitRe = /^(gr|g|kg|ml|cl|dl|l|cs|cc|cuillères?\s+à\s+soupe|cuillères?\s+à\s+café|tasses?|pincées?|poignées?|tranches?|gousses?|bottes?|sachets?|feuilles?|brins?|branches?|morceaux?|filets?)\s*/i;
  const unitMatch = rest.match(unitRe);
  if (unitMatch) {
    const unit = unitMatch[1];
    const name = rest.slice(unitMatch[0].length).replace(/^de?\s+|^d['']/u, '').trim();
    return { quantity: qty, unit, name: name || rest.trim() };
  }

  const name = rest.replace(/^de?\s+|^d['']/u, '').trim();
  return { quantity: qty, unit: '', name: name || s };
}

function scrapedToDefaults(scraped: ScrapedRecipe): Partial<CreateRecipeDto> {
  return {
    title: scraped.title,
    description: scraped.description,
    prepTime: scraped.prepTime,
    cookTime: scraped.cookTime,
    servings: scraped.servings,
    instructions: scraped.instructions,
    season: [],
    ingredients: scraped.ingredients.length
      ? scraped.ingredients.map(parseIngredient)
      : [{ name: '', quantity: '', unit: '' }],
  };
}

export default function NewRecipePage() {
  const navigate = useNavigate();
  const createRecipe = useCreateRecipe();
  const [importUrl, setImportUrl] = useState('');
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState('');
  const [formKey, setFormKey] = useState(0);
  const [defaultValues, setDefaultValues] = useState<Partial<CreateRecipeDto> | undefined>();

  const handleImport = async () => {
    const url = importUrl.trim();
    if (!url) return;
    setImporting(true);
    setImportError('');
    try {
      const { data } = await api.post<ScrapedRecipe>('/meal-plans/scrape', { url });
      if (!data.ingredients.length && !data.instructions) {
        setImportError("Ce site ne permet pas l'import automatique (contenu chargé en JavaScript). Essayez avec AllRecipes, 750g ou un site PDF.");
      } else {
        setDefaultValues(scrapedToDefaults(data));
        setFormKey((k) => k + 1);
      }
    } catch {
      setImportError("Impossible d'extraire la recette depuis cette URL.");
    } finally {
      setImporting(false);
    }
  };

  const handleSubmit = async (data: CreateRecipeDto) => {
    const recipe = await createRecipe.mutateAsync(data);
    navigate(`/recipes/${recipe.id}`);
  };

  return (
    <div className="p-8 max-w-3xl mx-auto animate-fade-in">
      <div className="mb-8">
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-parchment-400 hover:text-parchment-600 transition-colors mb-4 flex items-center gap-1.5"
        >
          ← Retour
        </button>
        <h2 className="text-3xl font-display font-bold text-parchment-800">Nouvelle recette</h2>
        <p className="text-parchment-400 text-sm mt-1">Ajoutez une recette manuellement ou importez depuis un lien</p>
      </div>

      <div className="card p-5 mb-6 space-y-3">
        <h3 className="font-display text-base font-semibold text-parchment-700">Importer depuis une URL</h3>
        <p className="text-sm text-parchment-400">
          Collez un lien vers une recette pour pré-remplir le formulaire.{' '}
          <span className="text-parchment-500 font-medium">Compatible : Jow, AllRecipes, 750g, BBC Good Food, Cuisine AZ, fichiers PDF.</span>{' '}
          <span className="text-parchment-300">(Marmiton non supporté — contenu JavaScript)</span>
        </p>
        <div className="flex gap-2">
          <input
            type="url"
            value={importUrl}
            onChange={(e) => setImportUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleImport()}
            placeholder="https://www.marmiton.org/recettes/..."
            className="input flex-1"
          />
          <button
            type="button"
            onClick={handleImport}
            disabled={importing || !importUrl.trim()}
            className="btn-primary whitespace-nowrap min-w-[110px] justify-center"
          >
            {importing ? (
              <span className="inline-flex items-center gap-2">
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Import…
              </span>
            ) : (
              'Importer'
            )}
          </button>
        </div>
        {importError && <p className="text-xs text-terracotta-400">{importError}</p>}
        {defaultValues && !importError && (
          <p className="text-xs text-green-600 font-medium">
            Recette importée — vérifiez et complétez les champs ci-dessous avant d'enregistrer.
          </p>
        )}
      </div>

      <RecipeForm
        key={formKey}
        defaultValues={defaultValues}
        onSubmit={handleSubmit}
        isLoading={createRecipe.isPending}
        submitLabel="Créer la recette"
      />
    </div>
  );
}
