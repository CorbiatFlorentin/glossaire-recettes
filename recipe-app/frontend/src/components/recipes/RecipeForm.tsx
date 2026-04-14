import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CreateRecipeDto, Season, SEASON_LABELS, SEASON_EMOJIS } from '@/types';
import clsx from 'clsx';

const ingredientSchema = z.object({
  name: z.string().min(1, 'Nom requis'),
  quantity: z.string().optional(),
  unit: z.string().optional(),
});

const recipeSchema = z.object({
  title: z.string().min(1, 'Titre requis').max(200),
  description: z.string().optional(),
  instructions: z.string().min(1, 'Instructions requises'),
  servings: z.coerce.number().positive().optional().or(z.literal('')),
  prepTime: z.coerce.number().positive().optional().or(z.literal('')),
  cookTime: z.coerce.number().positive().optional().or(z.literal('')),
  season: z.array(z.enum(['SPRING', 'SUMMER', 'AUTUMN', 'WINTER'])),
  ingredients: z.array(ingredientSchema),
});

type FormValues = z.infer<typeof recipeSchema>;

interface Props {
  defaultValues?: Partial<CreateRecipeDto>;
  onSubmit: (data: CreateRecipeDto) => void;
  isLoading?: boolean;
  submitLabel?: string;
}

export default function RecipeForm({ defaultValues, onSubmit, isLoading, submitLabel = 'Enregistrer' }: Props) {
  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(recipeSchema),
    defaultValues: {
      title: '',
      description: '',
      instructions: '',
      season: [],
      ingredients: [{ name: '', quantity: '', unit: '' }],
      ...defaultValues,
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'ingredients' });
  const selectedSeasons = watch('season');

  const toggleSeason = (s: Season) => {
    const current = (selectedSeasons ?? []) as Season[];
    setValue(
      'season',
      current.includes(s) ? current.filter((x: Season) => x !== s) : [...current, s]
    );
  };

  const handleFormSubmit = (data: FormValues) => {
    onSubmit({
      ...data,
      servings: data.servings ? Number(data.servings) : undefined,
      prepTime: data.prepTime ? Number(data.prepTime) : undefined,
      cookTime: data.cookTime ? Number(data.cookTime) : undefined,
      ingredients: data.ingredients.filter((i: { name: string }) => i.name.trim()),
    } as CreateRecipeDto);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8">
      {/* Titre & description */}
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
          <textarea
            {...register('description')}
            rows={2}
            placeholder="Un résumé appétissant de la recette..."
            className="input resize-none"
          />
        </div>

        {/* Saisons */}
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

        {/* Temps & portions */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="label">Temps de préparation (min)</label>
            <input {...register('prepTime')} type="number" min="0" placeholder="15" className="input" />
          </div>
          <div>
            <label className="label">Temps de cuisson (min)</label>
            <input {...register('cookTime')} type="number" min="0" placeholder="30" className="input" />
          </div>
          <div>
            <label className="label">Portions</label>
            <input {...register('servings')} type="number" min="1" placeholder="4" className="input" />
          </div>
        </div>
      </section>

      {/* Ingrédients */}
      <section className="card p-6 space-y-4">
        <h3 className="font-display text-lg font-semibold text-parchment-700 pb-2 border-b border-parchment-50">
          Ingrédients
        </h3>

        <div className="space-y-2.5">
          {fields.map((field: any, index: number) => (
            <div key={field.id} className="flex gap-2 items-start group">
              <div className="flex gap-2 flex-1">
                <input
                  {...register(`ingredients.${index}.quantity`)}
                  placeholder="200"
                  className="input w-20 flex-shrink-0"
                />
                <input
                  {...register(`ingredients.${index}.unit`)}
                  placeholder="g"
                  className="input w-20 flex-shrink-0"
                />
                <div className="flex-1">
                  <input
                    {...register(`ingredients.${index}.name`)}
                    placeholder="farine"
                    className={clsx('input', errors.ingredients?.[index]?.name && 'border-terracotta-400')}
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => remove(index)}
                disabled={fields.length === 1}
                className="mt-0.5 p-2.5 text-parchment-300 hover:text-terracotta-400 transition-colors disabled:opacity-20 opacity-0 group-hover:opacity-100"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => append({ name: '', quantity: '', unit: '' })}
          className="btn-ghost text-sm"
        >
          + Ajouter un ingrédient
        </button>
      </section>

      {/* Instructions */}
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
        {errors.instructions && (
          <p className="text-xs text-terracotta-400">{errors.instructions.message}</p>
        )}
      </section>

      {/* Actions */}
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