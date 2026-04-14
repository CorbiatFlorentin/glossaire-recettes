interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  icon?: string;
}

export default function SearchBar({ value, onChange, placeholder = 'Rechercher...', icon = '🔍' }: Props) {
  return (
    <div className="relative flex-1">
      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm pointer-events-none">
        {icon}
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="input pl-10 pr-8"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-parchment-300 hover:text-parchment-600 transition-colors text-sm"
        >
          ✕
        </button>
      )}
    </div>
  );
}