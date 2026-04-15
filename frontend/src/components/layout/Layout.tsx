import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';

export default function Layout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-parchment-100 flex flex-col shadow-sm fixed inset-y-0 left-0 z-10">
        {/* Logo */}
        <div className="px-6 py-8 border-b border-parchment-100">
          <h1 className="text-2xl font-display font-bold text-parchment-800 leading-tight">
            Mes<br />
            <span className="text-parchment-500 italic">Recettes</span>
          </h1>
          <p className="text-xs text-parchment-400 mt-1 font-body">Carnet de cuisine personnel</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-parchment-100 text-parchment-800'
                  : 'text-parchment-500 hover:bg-parchment-50 hover:text-parchment-700'
              }`
            }
          >
            <span className="text-base">📚</span>
            Toutes les recettes
          </NavLink>

          <NavLink
            to="/?favorite=true"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-parchment-100 text-parchment-800'
                  : 'text-parchment-500 hover:bg-parchment-50 hover:text-parchment-700'
              }`
            }
          >
            <span className="text-base">❤️</span>
            Favoris
          </NavLink>

          <div className="pt-4 pb-2">
            <p className="px-3 text-xs font-medium text-parchment-300 uppercase tracking-widest">
              Saisons
            </p>
          </div>

          {(['SPRING', 'SUMMER', 'AUTUMN', 'WINTER'] as const).map((s) => {
            const labels = { SPRING: 'Printemps', SUMMER: 'Été', AUTUMN: 'Automne', WINTER: 'Hiver' };
            const emojis = { SPRING: '🌸', SUMMER: '☀️', AUTUMN: '🍂', WINTER: '❄️' };
            return (
              <NavLink
                key={s}
                to={`/?season=${s}`}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-parchment-100 text-parchment-800'
                      : 'text-parchment-500 hover:bg-parchment-50 hover:text-parchment-700'
                  }`
                }
              >
                <span className="text-base">{emojis[s]}</span>
                {labels[s]}
              </NavLink>
            );
          })}
        </nav>

        {/* New recipe button */}
        <div className="px-4 py-4 border-t border-parchment-100">
          <NavLink to="/recipes/new" className="btn-primary w-full justify-center">
            <span>+</span>
            Nouvelle recette
          </NavLink>
        </div>

        {/* User */}
        <div className="px-4 pb-6 pt-2">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-parchment-50 transition-all">
            <div className="w-8 h-8 rounded-full bg-parchment-200 flex items-center justify-center text-sm font-medium text-parchment-700">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-parchment-800 truncate">{user?.name}</p>
              <p className="text-xs text-parchment-400 truncate">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="text-parchment-400 hover:text-terracotta-400 transition-colors text-xs"
              title="Se déconnecter"
            >
              ↗
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 ml-64 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}