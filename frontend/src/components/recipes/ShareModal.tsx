import { useState } from 'react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

interface Props {
  recipeId: string;
  recipeTitle: string;
  onClose: () => void;
}

export default function ShareModal({ recipeId, recipeTitle, onClose }: Props) {
  const [to, setTo] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!to.trim()) return;

    setLoading(true);
    try {
      await api.post(`/recipes/${recipeId}/share-email`, { to: to.trim(), message: message.trim() || undefined });
      toast.success(`Recette envoyée à ${to}`);
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Erreur lors de l\'envoi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-display font-semibold text-parchment-800">Envoyer par email</h2>
            <p className="text-sm text-parchment-400 mt-0.5 truncate max-w-xs">{recipeTitle}</p>
          </div>
          <button onClick={onClose} className="text-parchment-400 hover:text-parchment-600 text-xl leading-none">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-parchment-700 mb-1.5">
              Destinataire
            </label>
            <input
              type="email"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="ami@example.com"
              required
              className="input w-full"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-parchment-700 mb-1.5">
              Message personnel <span className="text-parchment-300 font-normal">(optionnel)</span>
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Je t'envoie cette recette, elle est délicieuse !"
              rows={3}
              maxLength={500}
              className="input w-full resize-none"
            />
            <p className="text-xs text-parchment-300 text-right mt-1">{message.length}/500</p>
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">
              Annuler
            </button>
            <button type="submit" disabled={loading || !to.trim()} className="btn-primary flex-1 justify-center">
              {loading ? 'Envoi…' : '📧 Envoyer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
