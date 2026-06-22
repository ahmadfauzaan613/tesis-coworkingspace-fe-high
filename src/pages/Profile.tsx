import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { Button } from '../components/ui/button';
import { User, Key, CheckCircle2, ShieldAlert, Camera } from 'lucide-react';

interface UserProfile {
  id: number;
  name: string;
  email: string;
  role: string;
  avatar_url: string | null;
}

export default function Profile() {
  const token = localStorage.getItem('token');

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  
  // Password states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI state
  const [submittingProfile, setSubmittingProfile] = useState(false);
  const [submittingPassword, setSubmittingPassword] = useState(false);
  const [submittingAvatar, setSubmittingAvatar] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Redirect if not logged in
  useEffect(() => {
    if (!token) {
      window.location.href = '/login';
    }
  }, [token]);

  // Fetch Profile data
  const { data: profile, refetch } = useQuery<UserProfile>({
    queryKey: ['userProfile'],
    queryFn: async () => {
      const res = await api.get('/auth/profile');
      return res.data.user;
    },
    enabled: !!token
  });

  // Populate forms
  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setEmail(profile.email);
    }
  }, [profile]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) {
      showToast('Name and email are required.', 'error');
      return;
    }

    setSubmittingProfile(true);
    try {
      const res = await api.put('/auth/profile', { name, email });
      // Update local storage
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      window.dispatchEvent(new Event('storage'));
      
      showToast('Profile details updated successfully.', 'success');
      refetch();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to update profile.', 'error');
    } finally {
      setSubmittingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      showToast('Password fields are required.', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match.', 'error');
      return;
    }

    setSubmittingPassword(true);
    try {
      await api.put('/auth/profile/password', { currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showToast('Password updated successfully.', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to update password.', 'error');
    } finally {
      setSubmittingPassword(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const formData = new FormData();
    formData.append('avatar', file);

    setSubmittingAvatar(true);
    try {
      const res = await api.post('/auth/profile/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Update local storage with new avatar_url
      const userJson = localStorage.getItem('user');
      if (userJson) {
        const user = JSON.parse(userJson);
        user.avatar_url = res.data.avatar_url;
        localStorage.setItem('user', JSON.stringify(user));
      }
      window.dispatchEvent(new Event('storage'));
      
      showToast('Avatar updated successfully.', 'success');
      refetch();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to upload avatar.', 'error');
    } finally {
      setSubmittingAvatar(false);
    }
  };

  const formatAvatarUrl = (url: string | null) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `http://localhost:5000${url}`;
  };

  return (
    <div className="min-h-[calc(100vh-73px)] bg-slate-50 text-slate-800 py-12 px-6 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Account Settings</h2>
          <p className="text-sm text-slate-500 mt-1">Manage your professional profile details, security settings, and avatar image.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {/* Avatar Settings Box */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col items-center text-center space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">Profile Avatar</h3>
            
            <div className="relative group w-32 h-32 rounded-full overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center">
              {profile?.avatar_url ? (
                <img 
                  src={formatAvatarUrl(profile.avatar_url)} 
                  alt={profile.name} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-slate-400 font-extrabold text-3xl">
                  {profile?.name ? profile.name.slice(0, 2).toUpperCase() : 'U'}
                </div>
              )}
              
              <label 
                htmlFor="avatar-file-input" 
                className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center cursor-pointer text-white text-xs font-semibold"
              >
                <Camera className="w-5 h-5 mb-1 text-slate-200" />
                Change Image
              </label>
              
              <input 
                id="avatar-file-input"
                type="file" 
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden" 
                disabled={submittingAvatar}
              />
            </div>
            
            <div>
              <p className="text-sm font-bold text-slate-800 leading-none">{profile?.name}</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1.5">{profile?.role}</p>
            </div>
            
            <p className="text-[10px] text-slate-500 leading-relaxed">
              Supports JPEG, JPG, PNG, or GIF. Max filesize 2MB.
            </p>
          </div>

          {/* Form Settings Box */}
          <div className="md:col-span-2 space-y-6">
            
            {/* Edit details card */}
            <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
              <h3 className="text-base font-bold text-slate-905 flex items-center gap-2 mb-6 text-left">
                <User className="w-4.5 h-4.5 text-indigo-600" /> Edit Details
              </h3>
              
              <form id="profile-details-form" onSubmit={handleUpdateProfile} className="space-y-4 text-left">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="input-profile-name" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Full Name</label>
                    <input 
                      id="input-profile-name"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-white border border-slate-300 text-slate-900 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                    />
                  </div>
                  <div>
                    <label htmlFor="input-profile-email" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Email Address</label>
                    <input 
                      id="input-profile-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-white border border-slate-300 text-slate-900 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                    />
                  </div>
                </div>
                
                <div className="pt-2 flex justify-end">
                  <Button 
                    id="btn-submit-profile-details"
                    type="submit" 
                    disabled={submittingProfile}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-5 py-2.5 cursor-pointer shadow-md"
                  >
                    {submittingProfile ? 'Saving...' : 'Save Profile Details'}
                  </Button>
                </div>
              </form>
            </div>

            {/* Change Password Card */}
            <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
              <h3 className="text-base font-bold text-slate-905 flex items-center gap-2 mb-6 text-left">
                <Key className="w-4.5 h-4.5 text-indigo-600" /> Change Password
              </h3>
              
              <form id="profile-password-form" onSubmit={handleUpdatePassword} className="space-y-4 text-left">
                <div>
                  <label htmlFor="input-profile-curr-pw" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Current Password</label>
                  <input 
                    id="input-profile-curr-pw"
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full bg-white border border-slate-300 text-slate-900 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="input-profile-new-pw" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">New Password</label>
                    <input 
                      id="input-profile-new-pw"
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-white border border-slate-300 text-slate-900 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                    />
                  </div>
                  <div>
                    <label htmlFor="input-profile-confirm-pw" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Confirm New Password</label>
                    <input 
                      id="input-profile-confirm-pw"
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-white border border-slate-300 text-slate-900 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                    />
                  </div>
                </div>
                
                <div className="pt-2 flex justify-end">
                  <Button 
                    id="btn-submit-profile-password"
                    type="submit" 
                    disabled={submittingPassword}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-5 py-2.5 cursor-pointer shadow-md"
                  >
                    {submittingPassword ? 'Updating...' : 'Update Password'}
                  </Button>
                </div>
              </form>
            </div>
            
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border shadow-lg backdrop-blur-md min-w-[300px] text-left ${
            toast.type === 'success' 
              ? 'bg-emerald-50/90 border-emerald-200 text-emerald-800' 
              : 'bg-red-50/90 border-red-200 text-red-800'
          }`}>
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            ) : (
              <ShieldAlert className="w-5 h-5 text-red-655 flex-shrink-0" />
            )}
            <span className="text-xs font-bold">{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
