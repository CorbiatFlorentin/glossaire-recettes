export default function LoadingGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="card animate-pulse">
          <div className="aspect-[4/3] bg-parchment-100" />
          <div className="p-5 space-y-3">
            <div className="h-3 bg-parchment-100 rounded w-1/3" />
            <div className="h-5 bg-parchment-100 rounded w-3/4" />
            <div className="h-4 bg-parchment-100 rounded w-full" />
            <div className="h-4 bg-parchment-100 rounded w-2/3" />
            <div className="flex gap-3 pt-2">
              <div className="h-3 bg-parchment-100 rounded w-16" />
              <div className="h-3 bg-parchment-100 rounded w-16" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}