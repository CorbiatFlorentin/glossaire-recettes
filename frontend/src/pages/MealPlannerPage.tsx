import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { Recipe, PaginatedResponse } from '@/types';
import clsx from 'clsx';

// ── Types ────────────────────────────────────────────────────────────────────

type MealType = 'BREAKFAST' | 'LUNCH' | 'DINNER';

interface MealEntry {
  id: string;
  dayOfWeek: number;
  mealType: MealType;
  recipeId?: string;
  recipe?: { id: string; title: string; photos: { path: string }[] };
  externalTitle?: string;
  externalUrl?: string;
  notes?: string;
}

interface MealPlan {
  id: string;
  weekStart: string;
  entries: MealEntry[];
}

interface ScrapedRecipe {
  title: string;
  description?: string;
  prepTime?: number;
  cookTime?: number;
  servings?: number;
  ingredients: string[];
  instructions: string;
  imageUrl?: string;
  sourceUrl: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
const MEAL_LABELS: Record<MealType, string> = { BREAKFAST: 'Petit-déj', LUNCH: 'Déjeuner', DINNER: 'Dîner' };
const MEAL_EMOJIS: Record<MealType, string> = { BREAKFAST: '🌅', LUNCH: '☀️', DINNER: '🌙' };
const MEAL_TYPES: MealType[] = ['BREAKFAST', 'LUNCH', 'DINNER'];

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function toISODate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function formatWeekLabel(monday: Date): string {
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const fmt = (d: Date) =>
    d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
  return `${fmt(monday)} – ${fmt(sunday)} ${sunday.getFullYear()}`;
}

function getDayDate(monday: Date, dayIndex: number): Date {
  const d = new Date(monday);
  d.setDate(monday.getDate() + dayIndex);
  return d;
}

// ── Modal for picking / scraping a meal ──────────────────────────────────────

interface PickerModalProps {
  mealPlanId: string;
  dayOfWeek: number;
  mealType: MealType;
  onClose: () => void;
}

function PickerModal({ mealPlanId, dayOfWeek, mealType, onClose }: PickerModalProps) {
  const qc = useQueryClient();
  const [tab, setTab] = useState<'recipes' | 'url'>('recipes');
  const [search, setSearch] = useState('');
  const [url, setUrl] = useState('');
  const [scraping, setScraping] = useState(false);
  const [scraped, setScraped] = useState<ScrapedRecipe | null>(null);
  const [notes, setNotes] = useState('');

  const { data: recipesData } = useQuery({
    queryKey: ['recipes-picker', search],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: '50' });
      if (search) params.set('search', search);
      const { data } = await api.get<PaginatedResponse<Recipe>>(`/recipes?${params}`);
      return data;
    },
  });

  const upsert = useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const { data } = await api.put(`/meal-plans/${mealPlanId}/entries`, {
        dayOfWeek,
        mealType,
        ...body,
      });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['meal-plan'] });
      toast.success('Repas ajouté !');
      onClose();
    },
    onError: () => toast.error('Erreur lors de l\'ajout'),
  });

  const handleScrape = async () => {
    if (!url.trim()) return;
    setScraping(true);
    setScraped(null);
    try {
      const { data } = await api.post<ScrapedRecipe>('/meal-plans/scrape', { url: url.trim() });
      setScraped(data);
    } catch {
      toast.error('Impossible d\'extraire la recette depuis cette URL');
    } finally {
      setScraping(false);
    }
  };

  const handleAddScraped = () => {
    if (!scraped) return;
    upsert.mutate({
      externalTitle: scraped.title,
      externalUrl: scraped.sourceUrl || url,
      notes: notes || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-parchment-100">
          <div>
            <h2 className="font-display font-semibold text-parchment-800">
              {MEAL_EMOJIS[mealType]} {MEAL_LABELS[mealType]}
            </h2>
            <p className="text-xs text-parchment-400 mt-0.5">{DAYS[dayOfWeek]}</p>
          </div>
          <button onClick={onClose} className="text-parchment-400 hover:text-parchment-600 text-xl">×</button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-parchment-100">
          {(['recipes', 'url'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={clsx(
                'flex-1 py-3 text-sm font-medium transition-colors',
                tab === t
                  ? 'text-parchment-800 border-b-2 border-parchment-600'
                  : 'text-parchment-400 hover:text-parchment-600'
              )}
            >
              {t === 'recipes' ? '📚 Mes recettes' : '🌐 Depuis internet'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {tab === 'recipes' && (
            <div className="space-y-3">
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher une recette…"
                className="input w-full"
                autoFocus
              />
              <ul className="space-y-2">
                {recipesData?.data.map((recipe) => {
                  const photo = recipe.photos.find((p) => p.isMain) ?? recipe.photos[0];
                  return (
                    <li key={recipe.id}>
                      <button
                        onClick={() => upsert.mutate({ recipeId: recipe.id, externalTitle: null, externalUrl: null })}
                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-parchment-50 transition-colors text-left group"
                      >
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-parchment-100 flex-shrink-0">
                          {photo ? (
                            <img src={photo.path} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xl">🍽</div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-parchment-800 truncate">{recipe.title}</p>
                          {(recipe.prepTime || recipe.cookTime) && (
                            <p className="text-xs text-parchment-400">
                              {[recipe.prepTime && `${recipe.prepTime} min prép.`, recipe.cookTime && `${recipe.cookTime} min cuisson`].filter(Boolean).join(' · ')}
                            </p>
                          )}
                        </div>
                        <span className="text-parchment-300 group-hover:text-parchment-600 text-sm">+</span>
                      </button>
                    </li>
                  );
                })}
                {recipesData?.data.length === 0 && (
                  <p className="text-sm text-parchment-400 text-center py-6">Aucune recette trouvée</p>
                )}
              </ul>
            </div>
          )}

          {tab === 'url' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-parchment-700 mb-1.5">
                  URL de la recette
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://www.marmiton.org/recettes/..."
                    className="input flex-1"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleScrape()}
                  />
                  <button
                    onClick={handleScrape}
                    disabled={scraping || !url.trim()}
                    className="btn-primary px-4"
                  >
                    {scraping ? '…' : 'Importer'}
                  </button>
                </div>
                <p className="text-xs text-parchment-300 mt-1">
                  Compatible avec Marmiton, 750g, et la plupart des sites de recettes
                </p>
              </div>

              {scraped && (
                <div className="border border-parchment-100 rounded-xl p-4 space-y-3">
                  {scraped.imageUrl && (
                    <img src={scraped.imageUrl} alt={scraped.title} className="w-full h-32 object-cover rounded-lg" />
                  )}
                  <h3 className="font-display font-semibold text-parchment-800">{scraped.title}</h3>
                  {scraped.description && (
                    <p className="text-sm text-parchment-500 line-clamp-2">{scraped.description}</p>
                  )}
                  <div className="flex gap-4 text-xs text-parchment-400">
                    {scraped.prepTime && <span>⏱ {scraped.prepTime} min prép.</span>}
                    {scraped.cookTime && <span>🔥 {scraped.cookTime} min cuisson</span>}
                    {scraped.servings && <span>🍽 {scraped.servings} portions</span>}
                  </div>
                  {scraped.ingredients.length > 0 && (
                    <details className="text-sm">
                      <summary className="cursor-pointer text-parchment-500 hover:text-parchment-700">
                        {scraped.ingredients.length} ingrédient{scraped.ingredients.length > 1 ? 's' : ''}
                      </summary>
                      <ul className="mt-2 space-y-0.5 text-parchment-600 list-disc list-inside">
                        {scraped.ingredients.slice(0, 8).map((ing, i) => <li key={i}>{ing}</li>)}
                        {scraped.ingredients.length > 8 && (
                          <li className="text-parchment-400">+{scraped.ingredients.length - 8} autres…</li>
                        )}
                      </ul>
                    </details>
                  )}

                  <div>
                    <label className="block text-xs font-medium text-parchment-700 mb-1">
                      Note <span className="text-parchment-300 font-normal">(optionnel)</span>
                    </label>
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="ex: doubler les quantités"
                      className="input w-full text-sm"
                    />
                  </div>

                  <button
                    onClick={handleAddScraped}
                    disabled={upsert.isPending}
                    className="btn-primary w-full justify-center"
                  >
                    {upsert.isPending ? 'Ajout…' : 'Ajouter au planning'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Cell ─────────────────────────────────────────────────────────────────────

interface CellProps {
  entry?: MealEntry;
  dayOfWeek: number;
  mealType: MealType;
  mealPlanId: string;
  monday: Date;
  onAdd: () => void;
}

function MealCell({ entry, mealPlanId, onAdd }: CellProps) {
  const qc = useQueryClient();

  const remove = useMutation({
    mutationFn: async () => {
      await api.delete(`/meal-plans/${mealPlanId}/entries/${entry!.id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['meal-plan'] });
      toast.success('Repas retiré');
    },
  });

  if (!entry) {
    return (
      <button
        onClick={onAdd}
        className="w-full h-full min-h-[72px] flex items-center justify-center rounded-xl border-2 border-dashed border-parchment-100 text-parchment-300 hover:border-parchment-300 hover:text-parchment-500 transition-all group"
      >
        <span className="text-lg group-hover:scale-110 transition-transform">+</span>
      </button>
    );
  }

  const title = entry.recipe?.title ?? entry.externalTitle ?? 'Repas';
  const photo = entry.recipe?.photos?.[0];
  const isExternal = !entry.recipeId && !!entry.externalUrl;

  return (
    <div className="relative group w-full min-h-[72px] rounded-xl bg-parchment-50 border border-parchment-100 p-2.5 flex flex-col gap-1">
      <div className="flex items-start gap-2">
        {photo && (
          <img src={photo.path} alt="" className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          {entry.recipeId ? (
            <Link
              to={`/recipes/${entry.recipeId}`}
              className="text-xs font-medium text-parchment-800 hover:text-parchment-600 line-clamp-2 leading-tight"
            >
              {title}
            </Link>
          ) : (
            <a
              href={entry.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium text-parchment-800 hover:text-parchment-600 line-clamp-2 leading-tight"
            >
              {title} {isExternal && <span className="text-parchment-300">↗</span>}
            </a>
          )}
          {entry.notes && (
            <p className="text-xs text-parchment-400 truncate mt-0.5">{entry.notes}</p>
          )}
        </div>
      </div>

      <button
        onClick={() => remove.mutate()}
        disabled={remove.isPending}
        className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity text-parchment-300 hover:text-terracotta-400 text-xs leading-none p-0.5"
        title="Retirer"
      >
        ×
      </button>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function MealPlannerPage() {
  const [monday, setMonday] = useState<Date>(() => getMonday(new Date()));
  const [picker, setPicker] = useState<{ dayOfWeek: number; mealType: MealType } | null>(null);

  const weekStart = toISODate(monday);

  const { data: plan, isLoading } = useQuery<MealPlan>({
    queryKey: ['meal-plan', weekStart],
    queryFn: async () => {
      const { data } = await api.get<MealPlan>(`/meal-plans/week?weekStart=${weekStart}`);
      return data;
    },
  });

  const prevWeek = useCallback(() => {
    setMonday((d) => { const n = new Date(d); n.setDate(d.getDate() - 7); return n; });
  }, []);

  const nextWeek = useCallback(() => {
    setMonday((d) => { const n = new Date(d); n.setDate(d.getDate() + 7); return n; });
  }, []);

  const goToCurrentWeek = useCallback(() => setMonday(getMonday(new Date())), []);

  const getEntry = (dayOfWeek: number, mealType: MealType) =>
    plan?.entries.find((e) => e.dayOfWeek === dayOfWeek && e.mealType === mealType);

  const isCurrentWeek = toISODate(monday) === toISODate(getMonday(new Date()));

  return (
    <div className="p-6 max-w-full animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold text-parchment-800">Planning de la semaine</h1>
          <p className="text-sm text-parchment-400 mt-1">{formatWeekLabel(monday)}</p>
        </div>

        <div className="flex items-center gap-2">
          {!isCurrentWeek && (
            <button onClick={goToCurrentWeek} className="btn-secondary text-sm px-3 py-1.5">
              Aujourd'hui
            </button>
          )}
          <button onClick={prevWeek} className="btn-secondary p-2" title="Semaine précédente">
            ←
          </button>
          <button onClick={nextWeek} className="btn-secondary p-2" title="Semaine suivante">
            →
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-8 gap-2 animate-pulse">
          {Array.from({ length: 24 }).map((_, i) => (
            <div key={i} className="h-20 bg-parchment-50 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-[700px]">
            {/* Day headers */}
            <div className="grid grid-cols-8 gap-2 mb-2">
              <div /> {/* empty corner */}
              {DAYS.map((day, i) => {
                const date = getDayDate(monday, i);
                const isToday = toISODate(date) === toISODate(new Date());
                return (
                  <div key={day} className="text-center">
                    <p className={clsx(
                      'text-xs font-medium uppercase tracking-widest',
                      isToday ? 'text-parchment-800' : 'text-parchment-400'
                    )}>
                      {day.slice(0, 3)}
                    </p>
                    <p className={clsx(
                      'text-lg font-display font-semibold mt-0.5',
                      isToday ? 'text-parchment-800 bg-parchment-100 rounded-full w-8 h-8 flex items-center justify-center mx-auto' : 'text-parchment-500'
                    )}>
                      {date.getDate()}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Meal rows */}
            {MEAL_TYPES.map((mealType) => (
              <div key={mealType} className="grid grid-cols-8 gap-2 mb-2">
                {/* Row label */}
                <div className="flex flex-col items-end justify-center pr-2 py-2">
                  <span className="text-base">{MEAL_EMOJIS[mealType]}</span>
                  <span className="text-xs text-parchment-400 mt-0.5 text-right leading-tight">
                    {MEAL_LABELS[mealType]}
                  </span>
                </div>

                {/* Cells */}
                {DAYS.map((_, dayIndex) => (
                  <MealCell
                    key={dayIndex}
                    entry={getEntry(dayIndex, mealType)}
                    dayOfWeek={dayIndex}
                    mealType={mealType}
                    mealPlanId={plan!.id}
                    monday={monday}
                    onAdd={() => setPicker({ dayOfWeek: dayIndex, mealType })}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Picker modal */}
      {picker && plan && (
        <PickerModal
          mealPlanId={plan.id}
          dayOfWeek={picker.dayOfWeek}
          mealType={picker.mealType}
          onClose={() => setPicker(null)}
        />
      )}
    </div>
  );
}
