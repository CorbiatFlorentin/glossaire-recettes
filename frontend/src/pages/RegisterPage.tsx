import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { register, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error('Le mot de passe doit faire au moins 8 caractères');
      return;
    }
    try {
      await register(name, email, password);
      navigate('/');
    } catch {
      toast.error('Erreur lors de la création du compte');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm animate-scale-in">
        <div className="text-center mb-10">
          <h1 className="text-5xl font-display font-bold text-parchment-800 leading-none">
            Mes<br />
            <span className="text-parchment-500 italic text-4xl">Recettes</span>
          </h1>
          <p className="text-sm text-parchment-400 mt-3">Créez votre carnet de cuisine</p>
        </div>

        <div className="card p-8">
          <h2 className="font-display text-xl font-semibold text-parchment-800 mb-6">
            Créer un compte
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Votre prénom ou pseudo</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Marie"
                required
                autoComplete="name"
                className="input"
              />
            </div>

            <div>
              <label className="label">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@exemple.fr"
                required
                autoComplete="email"
                className="input"
              />
            </div>

            <div>
              <label className="label">Mot de passe (8 caractères min.)</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={8}
                autoComplete="new-password"
                className="input"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full justify-center mt-2"
            >
              {isLoading ? 'Création…' : 'Créer mon compte'}
            </button>
          </form>

          <p className="text-sm text-center text-parchment-400 mt-6">
            Déjà un compte ?{' '}
            <Link to="/login" className="text-parchment-600 hover:text-parchment-800 font-medium transition-colors">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}