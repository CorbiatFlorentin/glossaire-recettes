interface Props {
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}

export default function Pagination({ page, totalPages, onPageChange }: Props) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  const visible = pages.filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1);

  return (
    <div className="flex items-center justify-center gap-1.5">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="px-3 py-2 rounded-lg text-sm text-parchment-500 hover:bg-parchment-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
      >
        ← Précédent
      </button>

      {visible.map((p, i) => {
        const prev = visible[i - 1];
        const gap = prev && p - prev > 1;
        return (
          <span key={p} className="flex items-center gap-1.5">
            {gap && <span className="text-parchment-300 text-sm px-1">…</span>}
            <button
              onClick={() => onPageChange(p)}
              className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${
                p === page
                  ? 'bg-parchment-600 text-white'
                  : 'text-parchment-500 hover:bg-parchment-100'
              }`}
            >
              {p}
            </button>
          </span>
        );
      })}

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="px-3 py-2 rounded-lg text-sm text-parchment-500 hover:bg-parchment-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
      >
        Suivant →
      </button>
    </div>
  );
}