import { useForm, useFieldArray, useWatch, Control } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CreateRecipeDto, Season, CourseCategory, SEASON_LABELS, SEASON_EMOJIS, CATEGORY_LABELS, CATEGORY_EMOJIS } from '@/types';
import clsx from 'clsx';

const ingredientSchema = z.object({
  name: z.string().min(1, 'Nom requis'),
  quantity: z.string().optional(),
  unit: z.string().optional(),
  cost: z.coerce.number().min(1).max(5).optional().or(z.literal('')),
});

const recipeSchema = z.object({
  title: z.string().min(1, 'Titre requis').max(200),
  description: z.string().optional(),
  instructions: z.string().min(1, 'Instructions requises'),
  servings: z.coerce.number().positive().optional().or(z.literal('')),
  prepTime: z.coerce.number().positive().optional().or(z.literal('')),
  cookTime: z.coerce.number().positive().optional().or(z.literal('')),
  season: z.array(z.enum(['SPRING', 'SUMMER', 'AUTUMN', 'WINTER'])),
  category: z.enum(['STARTER', 'MAIN', 'DESSERT']).optional().or(z.literal('')),
  ingredients: z.array(ingredientSchema),
});

type FormValues = z.infer<typeof recipeSchema>;

interface Props {
  defaultValues?: Partial<CreateRecipeDto>;
  onSubmit: (data: CreateRecipeDto) => void;
  isLoading?: boolean;
  submitLabel?: string;
}

const COST_OPTIONS = [
  { value: 1, label: '€', title: 'Très bon marché' },
  { value: 2, label: '€€', title: 'Bon marché' },
  { value: 3, label: '€€€', title: 'Moyen' },
  { value: 4, label: '€€€€', title: 'Assez cher' },
  { value: 5, label: '€€€€€', title: 'Cher' },
];

// ── Sous-composant pour isoler useWatch hors du .map() ──────────────────────
interface CostSelectorProps {
  index: number;
  control: Control<FormValues>;
  setValue: (name: `ingredients.${number}.cost`, value: 1|2|3|4|5|undefined) => void;
}

function CostSelector({ index, control, setValue }: CostSelectorProps) {
  const costVal = useWatch({ control, name: `ingredients.${index}.cost` });
  return (
    <div className="flex gap-0.5">
      {COST_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          title={opt.title}
          onClick={() => setValue(`ingredients.${index}.cost`, costVal === opt.value ? undefined : opt.value as 1|2|3|4|5)}
          className={clsx(
            'flex-1 py-2 text-xs font-medium rounded transition-all border',
            Number(costVal) === opt.value
              ? 'bg-parchment-600 text-white border-parchment-600'
              : 'bg-parchment-50 text-parchment-400 border-parchment-100 hover:bg-parchment-100'
          )}
        >
          €
        </button>
      ))}
    </div>
  );
}
// ────────────────────────────────────────────────────────────────────────────

export default function RecipeForm({ defaultValues, onSubmit, isLoading, submitLabel = 'Enregistrer' }: Props) {
  const { register, control, handleSubmit, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(recipeSchema),
    defaultValues: {
      title: '',
      description: '',
      instructions: '',
      season: [],
      category: '',
      ingredients: [{ name: '', quantity: '', unit: '', cost: undefined }],
      ...defaultValues,
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'ingredients' });
  const selectedSeasons = useWatch({ control, name: 'season' });
  const selectedCategory = useWatch({ control, name: 'category' });

  const toggleSeason = (s: Season) => {
    const current = selectedSeasons || [];
    setValue('season', current.includes(s) ? current.filter((x) => x !== s) : [...current, s]);
  };

  const handleFormSubmit = (data: FormValues) => {
    onSubmit({
      ...data,
      servings: data.servings ? Number(data.servings) : undefined,
      prepTime: data.prepTime ? Number(data.prepTime) : undefined,
      cookTime: data.cookTime ? Number(data.cookTime) : undefined,
      category: (data.category as CourseCategory) || undefined,
      ingredients: data.ingredients
        .filter((i) => i.name.trim())
        .map((i) => ({ ...i, cost: i.cost ? Number(i.cost) : undefined })),
    } as CreateRecipeDto);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8">
      <section className="card p-6 space-y-5">
        <h3 className="font-display text-lg font-semibold text-parchment-700 pb-2 border-b border-parchment-50">
          Informations générales
        </h3>
        <div>
          <label className="label">Titre *</label>
          <input {...register('title')} placeholder="Ex : Tarte aux pommes de grand-mère" className="input" />
          {errors.title && <p className="text-xs text-terracotta-400 mt-1">{errors.title.message}</p>}
        </div>
        <div>
          <label className="label">Description courte</label>
          <textarea {...register('description')} rows={2} placeholder="Un résumé appétissant..." className="input resize-none" />
        </div>
        <div>
          <label className="label">Catégorie</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setValue('category', '')}
              className={clsx(
                'px-4 py-2 rounded-xl text-sm font-medium border transition-all',
                selectedCategory === ''
                  ? 'bg-parchment-600 text-white border-parchment-600'
                  : 'bg-white text-parchment-500 border-parchment-200 hover:border-parchment-400'
              )}
            >
              Aucune
            </button>
            {(['STARTER', 'MAIN', 'DESSERT'] as CourseCategory[]).map((cat) => {
              const catColors = {
                STARTER: selectedCategory === cat ? 'bg-green-500 text-white border-green-500' : 'bg-green-50 text-green-700 border-green-200 hover:border-green-400',
                MAIN: selectedCategory === cat ? 'bg-red-500 text-white border-red-500' : 'bg-red-50 text-red-700 border-red-200 hover:border-red-400',
                DESSERT: selectedCategory === cat ? 'bg-yellow-500 text-white border-yellow-500' : 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:border-yellow-400',
              };
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setValue('category', cat)}
                  className={clsx('px-4 py-2 rounded-xl text-sm font-medium border transition-all', catColors[cat])}
                >
                  {CATEGORY_EMOJIS[cat]} {CATEGORY_LABELS[cat]}
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <label className="label">Saisons</label>
          <div className="flex flex-wrap gap-2">
            {(['SPRING', 'SUMMER', 'AUTUMN', 'WINTER'] as Season[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => toggleSeason(s)}
                className={clsx(
                  'px-3 py-1.5 rounded-full text-sm font-medium transition-all border',
                  selectedSeasons?.includes(s)
                    ? 'bg-parchment-600 text-white border-parchment-600'
                    : 'bg-white text-parchment-500 border-parchment-200 hover:border-parchment-400'
                )}
              >
                {SEASON_EMOJIS[s]} {SEASON_LABELS[s]}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="label">Prép. (min)</label>
            <input {...register('prepTime')} type="number" min="0" placeholder="15" className="input" />
          </div>
          <div>
            <label className="label">Cuisson (min)</label>
            <input {...register('cookTime')} type="number" min="0" placeholder="30" className="input" />
          </div>
          <div>
            <label className="label">Portions</label>
            <input {...register('servings')} type="number" min="1" placeholder="4" className="input" />
          </div>
        </div>
      </section>

      <section className="card p-6 space-y-4">
        <h3 className="font-display text-lg font-semibold text-parchment-700 pb-2 border-b border-parchment-50">
          Ingrédients
        </h3>
        <div className="grid grid-cols-[80px_80px_1fr_120px_32px] gap-2 text-xs text-parchment-400 uppercase tracking-wider px-1">
          <span>Qté</span>
          <span>Unité</span>
          <span>Ingrédient</span>
          <span>Coût</span>
          <span />
        </div>
        <div className="space-y-2.5">
          {fields.map((field, index) => (
            <div key={field.id} className="grid grid-cols-[80px_80px_1fr_120px_32px] gap-2 items-center group">
              <input {...register(`ingredients.${index}.quantity`)} placeholder="200" className="input text-sm" />
              <input {...register(`ingredients.${index}.unit`)} placeholder="g" className="input text-sm" />
              <input
                {...register(`ingredients.${index}.name`)}
                placeholder="farine"
                className={clsx('input text-sm', errors.ingredients?.[index]?.name && 'border-terracotta-400')}
              />
              {/* ← sous-composant isolé, plus de hook dans le .map() */}
              <CostSelector index={index} control={control} setValue={setValue} />
              <button
                type="button"
                onClick={() => remove(index)}
                disabled={fields.length === 1}
                className="p-1.5 text-parchment-300 hover:text-terracotta-400 transition-colors disabled:opacity-20 opacity-0 group-hover:opacity-100"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-3 flex-wrap pt-1">
          {COST_OPTIONS.map((opt) => (
            <span key={opt.value} className="text-xs text-parchment-400">
              <span className="font-medium text-parchment-600">{opt.label}</span> = {opt.title}
            </span>
          ))}
        </div>
        <button type="button" onClick={() => append({ name: '', quantity: '', unit: '', cost: undefined })} className="btn-ghost text-sm">
          + Ajouter un ingrédient
        </button>
      </section>

      <section className="card p-6 space-y-4">
        <h3 className="font-display text-lg font-semibold text-parchment-700 pb-2 border-b border-parchment-50">
          Instructions
        </h3>
        <textarea
          {...register('instructions')}
          rows={10}
          placeholder="Décrivez les étapes de préparation..."
          className={clsx('input resize-y font-mono text-sm leading-relaxed', errors.instructions && 'border-terracotta-400')}
        />
        {errors.instructions && <p className="text-xs text-terracotta-400">{errors.instructions.message}</p>}
      </section>

      <div className="flex items-center justify-end gap-3 pb-8">
        <button type="button" onClick={() => window.history.back()} className="btn-secondary">
          Annuler
        </button>
        <button type="submit" disabled={isLoading} className="btn-primary min-w-[140px] justify-center">
          {isLoading ? (
            <span className="inline-flex items-center gap-2">
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Enregistrement…
            </span>
          ) : submitLabel}
        </button>
      </div>
    </form>
  );
}