import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Upload, 
  Lock, 
  ShieldCheck, 
  User as UserIcon, 
  Mail, 
  Phone,
  Save,
  CheckCircle2,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { fetchBackend, BACKEND_URL } from '@/lib/api';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, login } = useAuth();
  
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Profile State - initialized empty, filled from DB
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [usernameInput, setUsernameInput] = useState('');
  const [memberPoints, setMemberPoints] = useState<number>(0);
  const [avatarUrl, setAvatarUrl] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [verifyPassword, setVerifyPassword] = useState('');

  // Fetch fresh profile data from DB on mount
  useEffect(() => {
    async function loadProfile() {
      setIsLoading(true);
      try {
        const savedUser = localStorage.getItem('autocashier_user');
        let token = '';
        if (savedUser) {
          try { token = JSON.parse(savedUser).token || ''; } catch {}
        }

        if (!token) {
          // Fallback to auth context data if no token
          setFullName(user?.full_name || user?.username || '');
          setEmail(user?.email || '');
          setPhone(user?.whatsapp || '');
          setAvatarUrl(user?.avatar_url || '');
          return;
        }

        const res = await fetch(`${BACKEND_URL}/api/profile`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await res.json();

        if (data.status === 'success' && data.data) {
          const profile = data.data;
          setFullName(profile.full_name || '');
          setEmail(profile.email || '');
          setPhone(profile.whatsapp || '');
          setUsernameInput(profile.username || user?.username || '');
          setMemberPoints(profile.member_points ?? 0);
          setAvatarUrl(profile.avatar_url || user?.avatar_url || '');
          // Sync auth context with fresh DB data
          if (user) {
            login({
              ...user,
              full_name: profile.full_name,
              email: profile.email,
              whatsapp: profile.whatsapp,
              username: profile.username || user.username,
              avatar_url: profile.avatar_url || user.avatar_url,
            });
          }
        } else {
          // Fallback to local state
          setFullName(user?.full_name || user?.username || '');
          setEmail(user?.email || '');
          setPhone(user?.whatsapp || '');
          setUsernameInput(user?.username || '');
          setAvatarUrl(user?.avatar_url || '');
        }
      } catch (err) {
        // Fallback to local state on error
        setFullName(user?.full_name || user?.username || '');
        setEmail(user?.email || '');
        setPhone(user?.whatsapp || '');
        setUsernameInput(user?.username || '');
        setAvatarUrl(user?.avatar_url || '');
      } finally {
        setIsLoading(false);
      }
    }
    loadProfile();
  }, []);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsSaving(true);
      setErrorMsg('');
      const formData = new FormData();
      formData.append('photo', file);

      const res = await fetchBackend('uploadProfilePhoto', formData);
      if (res.status === 'success') {
        const newUrl = res.data.avatar_url;
        setAvatarUrl(newUrl);
        if (user) {
          login({ ...user, avatar_url: newUrl });
        }
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      } else {
        throw new Error(res.error || res.message || 'Gagal mengupload foto');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan saat upload.');
    } finally {
      setIsSaving(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    setErrorMsg('');
    if (newPassword && newPassword !== verifyPassword) {
      setErrorMsg('Password baru tidak cocok');
      return;
    }
    if (newPassword && newPassword.length < 6) {
      setErrorMsg('Password baru minimal 6 karakter');
      return;
    }

    setIsSaving(true);
    
    try {
      // 1. Update Profile
      const profileRes = await fetchBackend('updateProfile', {
        full_name: fullName,
        email: email,
        whatsapp: phone,
        username: usernameInput
      });

      if (profileRes.status !== 'success') {
        const errMap: Record<string, string> = {
          'USERNAME_TAKEN': 'Username sudah digunakan oleh akun lain',
          'FAILED_TO_UPDATE_PROFILE': 'Gagal memperbarui profil'
        };
        throw new Error(errMap[profileRes.error] || profileRes.error || 'Gagal memperbarui profil');
      }

      // Update local auth context
      if (user) {
        login({
          ...user,
          full_name: profileRes.data.full_name,
          email: profileRes.data.email,
          whatsapp: profileRes.data.whatsapp,
          username: profileRes.data.username || usernameInput,
        });
      }

      // 2. Update Password (if provided)
      if (currentPassword && newPassword) {
        const passRes = await fetchBackend('updatePassword', {
          currentPassword,
          newPassword
        });

        if (passRes.status !== 'success') {
          const errMap: Record<string, string> = {
            'INCORRECT_CURRENT_PASSWORD': 'Password saat ini salah',
            'PASSWORD_TOO_SHORT': 'Password baru terlalu pendek (min 6 karakter)',
            'INVALID_INPUT': 'Harap isi semua field password',
          };
          throw new Error(errMap[passRes.error] || passRes.error || 'Gagal memperbarui password');
        }
        
        // Clear password fields on success
        setCurrentPassword('');
        setNewPassword('');
        setVerifyPassword('');
      }

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan saat menyimpan.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] text-gray-900 p-6 lg:p-10 font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header/Nav */}
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 gap-2 rounded-full px-4 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
          
          <AnimatePresence>
            {showSuccess && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100 shadow-sm"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-sm font-bold">Berhasil disimpan!</span>
              </motion.div>
            )}
            {errorMsg && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-center gap-2 text-rose-600 bg-rose-50 px-4 py-2 rounded-full border border-rose-100 shadow-sm"
              >
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm font-bold">{errorMsg}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-32">
            <div className="flex flex-col items-center gap-4 text-gray-400">
              <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
              <p className="text-sm font-medium">Memuat data profil...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Profile Card */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white border border-gray-100 rounded-[32px] p-12 shadow-sm flex flex-col items-center text-center space-y-8">
                <div className="relative group">
                  <div className="w-36 h-36 rounded-[48px] bg-indigo-50 border-4 border-white flex items-center justify-center overflow-hidden shadow-xl shadow-indigo-100 transition-transform group-hover:scale-105 duration-500">
                    <img 
                      src={avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username || 'user'}`}
                      alt="User" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    ref={fileInputRef} 
                    onChange={handlePhotoUpload} 
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isSaving}
                    className="absolute -bottom-2 -right-2 w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center border-4 border-white text-white hover:bg-indigo-500 transition-all shadow-lg hover:shadow-indigo-200 disabled:opacity-50"
                  >
                    <Upload className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="space-y-3">
                  <h2 className="text-3xl font-black tracking-tight text-gray-900">
                    {usernameInput || user?.username || 'User'}
                  </h2>
                  <div className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-full text-[10px] font-black uppercase tracking-[0.2em]">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    {user?.roleName || user?.role || 'Admin'}
                  </div>
                  {fullName && (
                    <p className="text-gray-500 text-sm">{fullName}</p>
                  )}
                </div>
              </div>

              <div className="bg-indigo-600 rounded-[32px] p-6 text-white relative overflow-hidden shadow-lg shadow-indigo-200">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl -mr-16 -mt-16"></div>
                <p className="text-indigo-100 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Informasi Akun</p>
                <h3 className="text-xl font-bold">@{usernameInput || user?.username}</h3>
                <p className="text-indigo-100/60 text-xs mt-1">{email || user?.email || 'Belum ada email'}</p>
                <div className="mt-4 pt-4 border-t border-white/10">
                  <p className="text-indigo-100 text-[10px] font-black uppercase tracking-[0.2em]">Role</p>
                  <p className="text-white font-semibold text-sm mt-1">{user?.role || 'super_admin'}</p>
                </div>
              </div>
            </div>

            {/* Right Column: Settings Form */}
            <div className="lg:col-span-8 space-y-6">
              <section className="bg-white border border-gray-100 rounded-[32px] p-8 shadow-sm space-y-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center">
                     <UserIcon className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold tracking-tight text-gray-900">Informasi Pribadi</h3>
                    <p className="text-gray-500 text-sm">Perbarui nama dan kontak Anda</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Nama Lengkap</label>
                    <div className="relative group">
                      <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                      <Input 
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Masukkan nama lengkap"
                        className="bg-gray-50/50 border-gray-100 rounded-2xl h-14 pl-12 focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-200 transition-all text-sm font-medium"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Email</label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                      <Input 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="email@contoh.com"
                        type="email"
                        className="bg-gray-50/50 border-gray-100 rounded-2xl h-14 pl-12 focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-200 transition-all text-sm font-medium"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">WhatsApp</label>
                    <div className="relative group">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                      <Input 
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+62 812-xxxx-xxxx"
                        className="bg-gray-50/50 border-gray-100 rounded-2xl h-14 pl-12 focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-200 transition-all text-sm font-medium"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Username</label>
                    <div className="relative group">
                      <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                      <Input 
                        value={usernameInput}
                        onChange={(e) => setUsernameInput(e.target.value)}
                        placeholder="Masukkan username"
                        className="bg-gray-50/50 border-gray-100 rounded-2xl h-14 pl-12 focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-200 transition-all text-sm font-medium"
                      />
                    </div>
                  </div>
                </div>
              </section>

              <section className="bg-white border border-gray-100 rounded-[32px] p-8 shadow-sm space-y-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center">
                     <Lock className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold tracking-tight text-gray-900">Keamanan Akun</h3>
                    <p className="text-gray-500 text-sm">Ubah password Anda (opsional)</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Password Saat Ini</label>
                    <Input 
                      type="password"
                      placeholder="Masukkan password saat ini"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="bg-gray-50/50 border-gray-100 rounded-2xl h-14 focus:bg-white focus:ring-4 focus:ring-purple-100 focus:border-purple-200 transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Password Baru</label>
                      <Input 
                        type="password"
                        placeholder="Min. 6 karakter"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="bg-gray-50/50 border-gray-100 rounded-2xl h-14 focus:bg-white focus:ring-4 focus:ring-purple-100 focus:border-purple-200 transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Konfirmasi Password</label>
                      <Input 
                        type="password"
                        placeholder="Ulangi password baru"
                        value={verifyPassword}
                        onChange={(e) => setVerifyPassword(e.target.value)}
                        className={`bg-gray-50/50 border-gray-100 rounded-2xl h-14 focus:bg-white focus:ring-4 transition-all ${
                          verifyPassword && newPassword !== verifyPassword 
                            ? 'border-rose-300 focus:ring-rose-100 focus:border-rose-300' 
                            : 'focus:ring-purple-100 focus:border-purple-200'
                        }`}
                      />
                      {verifyPassword && newPassword !== verifyPassword && (
                        <p className="text-xs text-rose-500 ml-1">Password tidak cocok</p>
                      )}
                    </div>
                  </div>
                </div>
              </section>

              <div className="flex items-center justify-end gap-3 pt-4">
                <Button 
                  variant="ghost" 
                  className="rounded-2xl h-14 px-8 font-bold text-gray-500 hover:bg-gray-100"
                  onClick={() => navigate('/')}
                >
                  Batal
                </Button>
                <Button 
                  onClick={handleSave}
                  disabled={isSaving}
                  className="bg-indigo-600 hover:bg-indigo-700 rounded-2xl h-14 px-10 font-bold shadow-lg shadow-indigo-200 gap-2 min-w-[200px] text-white"
                >
                  {isSaving ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Menyimpan...
                    </div>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Simpan Perubahan
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
