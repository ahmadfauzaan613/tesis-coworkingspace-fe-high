import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../lib/api';
import { Button } from '../components/ui/button';

const demoAccounts = [
  { 
    label: 'Customer', 
    email: import.meta.env.VITE_DEMO_USER_EMAIL || 'user1@spacebook.id', 
    password: import.meta.env.VITE_DEMO_USER_PASSWORD || 'user123' 
  },
  { 
    label: 'Admin', 
    email: import.meta.env.VITE_DEMO_ADMIN_EMAIL || 'admin@spacebook.id', 
    password: import.meta.env.VITE_DEMO_ADMIN_PASSWORD || 'admin123' 
  }
];

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      if (user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
      // Force reload to update Navbar state
      window.location.reload();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-73px)] bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="text-center text-3xl font-extrabold text-slate-900 tracking-tight">
          Welcome back
        </h2>
        <p className="mt-2 text-center text-sm text-slate-655 font-medium">
          Belum punya akun?{' '}
          <Link id="link-register" to="/register" className="font-semibold text-indigo-600 hover:text-indigo-700">
            Sign Up
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 border border-slate-200 rounded-2xl shadow-xl sm:px-10">
          <form id="login-form" className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-650">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="login-email" className="block text-sm font-semibold text-slate-700">
                Email address
              </label>
              <div className="mt-1.5">
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white border border-slate-300 text-slate-900 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="login-password" className="block text-sm font-semibold text-slate-700">
                Password
              </label>
              <div className="mt-1.5">
                <input
                  id="login-password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white border border-slate-300 text-slate-900 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <Button
                id="btn-login-submit"
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 font-semibold text-sm rounded-xl transition shadow-lg shadow-indigo-500/10 cursor-pointer"
              >
                {loading ? 'Logging in...' : 'Log In'}
              </Button>
            </div>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-200">
            <div className="text-sm text-slate-500">
              <span className="font-semibold text-slate-655 block mb-2">Quick Accounts Auto Fill:</span>
              <div className="flex flex-wrap gap-2 text-xs">
                {demoAccounts.map((account, index) => (
                  <button
                    key={index}
                    id={`btn-demo-autofill-${index}`}
                    type="button"
                    onClick={() => {
                      setEmail(account.email);
                      setPassword(account.password);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/20 text-slate-600 hover:text-indigo-650 transition cursor-pointer font-medium"
                  >
                    Demo {index + 1}: {account.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
