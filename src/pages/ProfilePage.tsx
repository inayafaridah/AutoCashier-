import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Camera, 
  Lock, 
  ShieldCheck, 
  User as UserIcon, 
  Mail, 
  Phone,
  Save,
  CheckCircle2,
  LogOut,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }, 1200);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-gray-900 p-6 lg:p-10 font-sans">
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
                <span className="text-sm font-bold">Settings synchronized</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Profile Card */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white border border-gray-100 rounded-[32px] p-12 shadow-sm flex flex-col items-center text-center space-y-8">
              <div className="relative group">
                <div className="w-36 h-36 rounded-[48px] bg-indigo-50 border-4 border-white flex items-center justify-center overflow-hidden shadow-xl shadow-indigo-100 transition-transform group-hover:scale-105 duration-500">
                  <img 
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username || 'Budi'}`}
                    alt="User" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <button className="absolute -bottom-2 -right-2 w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center border-4 border-white text-white hover:bg-indigo-500 transition-all shadow-lg hover:shadow-indigo-200">
                  <Camera className="w-4 h-4" />
                </button>
              </div>
              
              <div className="space-y-3">
                <h2 className="text-3xl font-black tracking-tight text-gray-900">{user?.username || 'Budi Santoso'}</h2>
                <div className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-full text-[10px] font-black uppercase tracking-[0.2em]">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {user?.roleName || 'Super Admin'}
                </div>
              </div>
            </div>

            <div className="bg-indigo-600 rounded-[32px] p-6 text-white relative overflow-hidden shadow-lg shadow-indigo-200">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl -mr-16 -mt-16"></div>
              <p className="text-indigo-100 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Session Data</p>
              <h3 className="text-xl font-bold">Last Login: Today</h3>
              <p className="text-indigo-100/60 text-xs mt-4">Jakarta, ID • 182.253.xx.xx</p>
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
                  <h3 className="text-xl font-bold tracking-tight text-gray-900">Personal Information</h3>
                  <p className="text-gray-500 text-sm">Update your public profile and contact handles</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Full Name</label>
                  <div className="relative group">
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                    <Input 
                      defaultValue={user?.username || 'Budi Santoso'}
                      className="bg-gray-50/50 border-gray-100 rounded-2xl h-14 pl-12 focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-200 transition-all text-sm font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Email Address</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                    <Input 
                      defaultValue="budi.s@autocashier.id"
                      className="bg-gray-50/50 border-gray-100 rounded-2xl h-14 pl-12 focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-200 transition-all text-sm font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Phone Reference</label>
                  <div className="relative group">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                    <Input 
                      defaultValue="+62 812-****-7890"
                      className="bg-gray-50/50 border-gray-100 rounded-2xl h-14 pl-12 focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-200 transition-all text-sm font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Node Permissions</label>
                  <div className="relative group opacity-60">
                    <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input 
                      readOnly
                      defaultValue="Global Network Access"
                      className="bg-gray-50/80 border-gray-100 rounded-2xl h-14 pl-12 cursor-not-allowed italic text-sm"
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
                  <h3 className="text-xl font-bold tracking-tight text-gray-900">Account Security</h3>
                  <p className="text-gray-500 text-sm">Update your authentication credentials</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Current Password</label>
                  <Input 
                    type="password"
                    placeholder="••••••••••••"
                    className="bg-gray-50/50 border-gray-100 rounded-2xl h-14 focus:bg-white focus:ring-4 focus:ring-purple-100 focus:border-purple-200 transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">New Secure Password</label>
                    <Input 
                      type="password"
                      className="bg-gray-50/50 border-gray-100 rounded-2xl h-14 focus:bg-white focus:ring-4 focus:ring-purple-100 focus:border-purple-200 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Verify Password</label>
                    <Input 
                      type="password"
                      className="bg-gray-50/50 border-gray-100 rounded-2xl h-14 focus:bg-white focus:ring-4 focus:ring-purple-100 focus:border-purple-200 transition-all"
                    />
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
                Discard Changes
              </Button>
              <Button 
                onClick={handleSave}
                disabled={isSaving}
                className="bg-indigo-600 hover:bg-indigo-700 rounded-2xl h-14 px-10 font-bold shadow-lg shadow-indigo-200 gap-2 min-w-[200px] text-white"
              >
                {isSaving ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Updating Info...
                  </div>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Commit Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
