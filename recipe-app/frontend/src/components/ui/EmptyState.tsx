import { Link } from 'react-router-dom';

interface Props {
  title: string;
  description?: string;
  action?: { label: string; to: string };
}

export default function EmptyState({ title, description, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center animate-fade-in">
      <div className="text-6xl mb-6 opacity-40">🍽️</div>
      <h3 className="text-xl font-display font-semibold text-parchment-600 mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-parchment-400 max-w-xs mb-6">{description}</p>
      )}
      {action && (
        <Link to={action.to} className="btn-primary">
          {action.label}
        </Link>
      )}
    </div>
  );
}