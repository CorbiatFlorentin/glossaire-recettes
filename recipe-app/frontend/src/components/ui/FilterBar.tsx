import { SortField } from '@/types';

interface Props {
  sortBy: SortField;
  sortOrder: 'asc' | 'desc';
  onSortByChange: (v: SortField) => void;
  onSortOrderChange: (v: 'asc' | 'desc') => void;
}

export default function FilterBar({ sortBy, sortOrder, onSortByChange, onSortOrderChange }: Props) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <span className="text-xs text-parchment-400 font-medium uppercase tracking-wider">Trier par</span>

      <div className="flex gap-1.5">
        {(
          [
            { value: 'createdAt', label: 'Date' },
            { value: 'title', label: 'Alphabétique' },
            { value: 'updatedAt', label: 'Modifié' },
          ] as { value: SortField; label: string }[]
        ).map((opt) => (
          <button
            key={opt.value}
            onClick={() => onSortByChange(opt.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              sortBy === opt.value
                ? 'bg-parchment-600 text-white'
                : 'bg-parchment-50 text-parchment-500 hover:bg-parchment-100 border border-parchment-100'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <button
        onClick={() => onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc')}
        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-parchment-50 text-parchment-500 hover:bg-parchment-100 border border-parchment-100 transition-all"
        title={sortOrder === 'asc' ? 'Croissant' : 'Décroissant'}
      >
        {sortOrder === 'asc' ? '↑ Croissant' : '↓ Décroissant'}
      </button>
    </div>
  );
}