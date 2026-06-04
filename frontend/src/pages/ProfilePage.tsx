import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import toast from 'react-hot-toast';

interface HouseholdInfo {
  id: string;
  inviteCode: string;
  members: { id: string; name: string; email: string }[];
}

export default function ProfilePage() {
  const { user, logout } = useAuthStore();
  const queryClient = useQueryClient();
  const [joinCode, setJoinCode] = useState('');
  const [copied, setCopied] = useState(false);

  const { data: household, isLoading } = useQuery<HouseholdInfo>({
    queryKey: ['household'],
    queryFn: () => api.get('/household').then((r) => r.data),
  });

  const joinMutation = useMutation({
    mutationFn: (inviteCode: string) => api.post('/household/join', { inviteCode }),
    onSuccess: () => {
      toast.success('Foyer rejoint ! Vos recettes sont maintenant partagées.');
      queryClient.invalidateQueries({ queryKey: ['household'] });
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      setJoinCode('');
    },
    onError: () => toast.error('Code invalide ou déjà utilisé'),
  });

  const handleCopy = () => {
    if (!household) return;
    navigator.clipboard.writeText(household.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-8 max-w-2xl mx-auto animate-fade-in space-y-6">
      <h2 className="text-3xl font-display font-bold text-parchment-800">Mon profil</h2>

      {/* Infos utilisateur */}
      <div className="card p-6 space-y-2">
        <h3 className="font-display text-lg font-semibold text-parchment-700 pb-2 border-b border-parchment-50">
          Compte
        </h3>
        <p className="text-parchment-700"><span className="text-parchment-400 text-sm">Prénom :</span> {user?.name}</p>
        <p className="text-parchment-700"><span className="text-parchment-400 text-sm">Email :</span> {user?.email}</p>
        <button onClick={logout} className="btn-secondary mt-4 text-sm">
          Se déconnecter
        </button>
      </div>

      {/* Foyer partagé */}
      <div className="card p-6 space-y-4">
        <h3 className="font-display text-lg font-semibold text-parchment-700 pb-2 border-b border-parchment-50">
          Foyer partagé
        </h3>

        {isLoading ? (
          <p className="text-sm text-parchment-400">Chargement…</p>
        ) : household ? (
          <>
            <div>
              <p className="text-sm text-parchment-500 mb-2">
                Membres du foyer ({household.members.length}) :
              </p>
              <ul className="space-y-1">
                {household.members.map((m) => (
                  <li key={m.id} className="text-sm text-parchment-700 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-parchment-400 inline-block" />
                    {m.name} <span className="text-parchment-400">({m.email})</span>
                  </li>
                ))}
              </ul>
            </div>

            {household.members.length < 2 && (
              <div className="bg-parchment-50 rounded-xl p-4 space-y-2">
                <p className="text-sm font-medium text-parchment-700">
                  Invitez votre conjoint(e) à rejoindre votre foyer
                </p>
                <p className="text-xs text-parchment-400">
                  Partagez ce code lors de la création de son compte :
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-white border border-parchment-100 rounded-lg px-3 py-2 text-sm font-mono text-parchment-700 select-all truncate">
                    {household.inviteCode}
                  </code>
                  <button onClick={handleCopy} className="btn-primary text-sm whitespace-nowrap">
                    {copied ? 'Copié !' : 'Copier'}
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-parchment-400">Aucun foyer associé.</p>
        )}

        {/* Rejoindre un foyer existant */}
        <div className="pt-2 border-t border-parchment-50 space-y-2">
          <p className="text-sm font-medium text-parchment-700">Rejoindre un foyer existant</p>
          <p className="text-xs text-parchment-400">
            Si vous avez déjà un compte et souhaitez rejoindre le répertoire de quelqu'un d'autre.
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              placeholder="Code d'invitation…"
              className="input flex-1 font-mono text-sm"
            />
            <button
              onClick={() => joinMutation.mutate(joinCode.trim())}
              disabled={!joinCode.trim() || joinMutation.isPending}
              className="btn-primary whitespace-nowrap"
            >
              {joinMutation.isPending ? 'Chargement…' : 'Rejoindre'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
