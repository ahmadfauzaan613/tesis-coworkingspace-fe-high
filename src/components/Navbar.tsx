import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

export default function Navbar() {
  const navigate = useNavigate();
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [user, setUser] = useState(() => {
    const userJson = localStorage.getItem('user');
    return userJson ? JSON.parse(userJson) : null;
  });

  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    const handleStorageChange = () => {
      setToken(localStorage.getItem('token'));
      const userJson = localStorage.getItem('user');
      setUser(userJson ? JSON.parse(userJson) : null);
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  useEffect(() => {
    if (!dropdownOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('#btn-profile-dropdown')) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => {
      document.removeEventListener('click', handleOutsideClick);
    };
  }, [dropdownOpen]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setDropdownOpen(false);
    navigate('/login');
  };

  const toggleDropdown = () => setDropdownOpen(!dropdownOpen);
  const closeDropdown = () => setDropdownOpen(false);

  return (
    <nav className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <Link id="nav-brand" to="/" className="flex items-center space-x-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              CS
            </div>
            <div>
              <h1 className="text-lg font-extrabold tracking-tight text-slate-900">
                SpaceBook
              </h1>
              <p className="text-[10px] text-slate-500 font-bold tracking-wider uppercase">Coworking Space</p>
            </div>
          </Link>

          <div className="hidden md:flex items-center space-x-6">
            <Link id="nav-home" to="/" className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition">
              Home
            </Link>
            <Link id="nav-catalog" to="/catalog" className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition">
              Catalog
            </Link>
            <Link id="nav-about" to="/about" className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition">
              About
            </Link>
            <Link id="nav-contacts" to="/contacts" className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition">
              Contacts
            </Link>
            {token && user?.role === 'customer' && (
              <Link id="nav-my-bookings" to="/my-bookings" className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition">
                My Bookings
              </Link>
            )}
            {token && user?.role === 'admin' && (
              <Link id="nav-admin-dashboard" to="/admin" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                Admin Dashboard
              </Link>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {token ? (
            <div className="relative">
              <button 
                id="btn-profile-dropdown"
                onClick={toggleDropdown}
                className="flex items-center gap-2.5 text-right hover:text-indigo-650 transition cursor-pointer group focus:outline-none bg-transparent border-0"
              >
                {user?.avatar_url ? (
                  <img 
                    src={user.avatar_url.startsWith('http') ? user.avatar_url : `http://localhost:5000${user.avatar_url}`} 
                    alt={user.name} 
                    className="w-9 h-9 rounded-full object-cover border border-slate-200 group-hover:border-indigo-400 transition"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-indigo-50 border border-indigo-150 text-indigo-700 flex items-center justify-center font-bold text-sm group-hover:bg-indigo-100 transition">
                    {user?.name ? user.name.slice(0, 2).toUpperCase() : 'U'}
                  </div>
                )}
                <div className="hidden sm:block text-left mr-1">
                  <p className="text-sm font-bold text-slate-800 leading-none group-hover:text-indigo-600 transition flex items-center gap-1">
                    {user?.name}
                    <svg className={`w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-600 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </p>
                  <p className="text-[10px] text-slate-500 capitalize leading-none mt-1">{user?.role}</p>
                </div>
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2.5 w-48 bg-white border border-slate-250 rounded-xl shadow-xl py-1.5 z-55 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Signed in as</p>
                    <p className="text-sm font-semibold text-slate-850 truncate mt-0.5">{user?.name}</p>
                  </div>
                  
                  <Link 
                    id="dropdown-profile"
                    to="/profile"
                    onClick={closeDropdown}
                    className="flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-indigo-650 transition"
                  >
                    Profile Settings
                  </Link>

                  {user?.role === 'customer' && (
                    <Link 
                      id="dropdown-my-bookings"
                      to="/my-bookings"
                      onClick={closeDropdown}
                      className="flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-indigo-655 transition"
                    >
                      My Bookings
                    </Link>
                  )}

                  {user?.role === 'admin' && (
                    <Link 
                      id="dropdown-admin-dashboard"
                      to="/admin"
                      onClick={closeDropdown}
                      className="flex items-center px-4 py-2 text-sm font-medium text-indigo-600 hover:bg-slate-50 hover:text-indigo-700 transition"
                    >
                      Admin Portal
                    </Link>
                  )}

                  <div className="border-t border-slate-100 my-1"></div>

                  <button
                    id="dropdown-logout"
                    onClick={() => {
                      closeDropdown();
                      handleLogout();
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition font-medium cursor-pointer"
                  >
                    Log Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center">
              <Link
                id="btn-login-nav"
                to="/login"
                className="text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-xl transition shadow-md shadow-indigo-600/10 cursor-pointer"
              >
                Log In
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
