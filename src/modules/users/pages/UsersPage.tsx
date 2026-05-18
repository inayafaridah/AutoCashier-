import {useState, useEffect} from 'react';
import {Card, CardContent} from '@/shared/components/ui/card';
import {Button} from '@/shared/components/ui/button';
import {Avatar, AvatarFallback, AvatarImage} from '@/shared/components/ui/avatar';
import {Shield, UserPlus, Search, Edit2, ShieldAlert, CircleCheck, Trash2, Mail, Lock, User, MapPin, Loader2, Gift, Tag, Percent, Banknote, Users2, RefreshCw} from 'lucide-react';
import {cn} from '@/shared/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/components/ui/dialog";
import {Input} from '@/shared/components/ui/input';
import {toast} from 'sonner';
import {fetchBackend, BACKEND_URL} from '@/shared/lib/api';
import {useAuth} from '@/shared/context/AuthContext';

export default function UsersPage() {
  const {user} = useAuth();
  const isSuperAdmin = user?.role === 'super_admin';

  const getAvatarUrl = (user: any) => {
    const avatarStr = user?.profile_picture || user?.avatar_url;
    if (!avatarStr || avatarStr === 'null' || avatarStr === '') {
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=4f46e5&color=fff&bold=true`;
    }
    if (avatarStr.startsWith('http')) return avatarStr;
    return `${BACKEND_URL}${avatarStr}`;
  };

  const [roleFilter, setRoleFilter] = useState(isSuperAdmin ? 'ALL' : 'Member');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'Member',
    password: '',
    branchId: ''
  });

  const [editingUser, setEditingUser] = useState<any>(null);
  const [userToDelete, setUserToDelete] = useState<any>(null);
  const [selectedMemberForVoucher, setSelectedMemberForVoucher] = useState<any>(null);
  const [voucherForm, setVoucherForm] = useState({
    code: '',
    discount_type: 'percent',
    discount_value: '',
    min_purchase: ''
  });
  
  const [users, setUsers] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [uRes, bRes] = await Promise.all([
        fetchBackend('getUsers'),
        fetchBackend('getBranches')
      ]);
      
      if (uRes.status === 'success') setUsers(uRes.data);
      if (bRes.status === 'success') setBranches(bRes.data || []);
    } catch (err) {
      toast.error('Failed to sync network identities');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredUsers = users.filter(user => {
    const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         user.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRole && matchesSearch;
  });

  const handleCreateUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.password) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      const res = await fetchBackend('createUser', newUser);
      if (res.status === 'success') {
        toast.success('Identity created successfully');
        setIsAddModalOpen(false);
        setNewUser({ name: '', email: '', role: 'Member', password: '', branchId: '' });
        loadData();
      } else {
        toast.error(res.message || 'Failed to create identity');
      }
    } catch (err) {
      toast.error('Network connection error');
    }
  };

  const handleEditUser = async () => {
    if (!editingUser.name || !editingUser.email) {
      toast.error('Name and Email are required');
      return;
    }

    try {
      const res = await fetchBackend('updateUser', editingUser);
      if (res.status === 'success') {
        toast.success('Identity updated successfully');
        setIsEditModalOpen(false);
        loadData();
      } else {
        toast.error(res.message || 'Failed to update identity');
      }
    } catch (err) {
      toast.error('Network connection error');
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      const res = await fetchBackend('deleteUser', { id: userToDelete.id });
      if (res.status === 'success') {
        toast.success(`Identity for ${userToDelete.name} revoked`);
        setIsDeleteModalOpen(false);
        loadData();
      } else {
        toast.error(res.message || 'Failed to revoke identity');
      }
    } catch (err) {
      toast.error('Network connection error');
    }
  };

  const handleAssignVoucher = async () => {
    if (!voucherForm.code || !voucherForm.discount_value) {
      toast.error('Code and Discount Value are required');
      return;
    }

    try {
      const res = await fetchBackend('assignMemberPromo', {
        userId: selectedMemberForVoucher.id,
        code: voucherForm.code.toUpperCase(),
        discount_type: voucherForm.discount_type,
        discount_value: Number(voucherForm.discount_value),
        min_purchase: Number(voucherForm.min_purchase) || 0
      });

      if (res.status === 'success') {
        toast.success(`Voucher sent to ${selectedMemberForVoucher.name}`);
        setIsVoucherModalOpen(false);
        setVoucherForm({ code: '', discount_type: 'percent', discount_value: '', min_purchase: '' });
      } else {
        toast.error(res.message || 'Failed to assign voucher');
      }
    } catch (err) {
      toast.error('Network connection error');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
         <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
         <p className="text-gray-400 font-black uppercase tracking-widest text-[10px]">Synchronizing Identities...</p>
      </div>
    );
  }

  const superAdminCount = users.filter(u => u.role === 'Super Admin').length;
  const branchAdminCount = users.filter(u => u.role === 'Branch Admin').length;
  const memberCount = users.filter(u => u.role === 'Member').length;
  const activeCount = users.filter(u => u.status === 'Active').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">

      {/* ── PAGE HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/20 text-white flex-shrink-0">
            <Users2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tighter">
              {isSuperAdmin ? 'Identity & Access' : 'Member Management'}
            </h2>
            <p className="text-gray-500 font-medium text-sm mt-0.5">
              {isSuperAdmin ? 'Govern system privileges, roles, and network identities' : 'Manage your branch members, loyalty points, and vouchers'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={loadData} className="h-11 px-4 rounded-xl border-gray-200 text-gray-500 hover:bg-gray-50 font-bold gap-2 text-xs">
            <RefreshCw className="w-4 h-4" /> Refresh
          </Button>
          <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <DialogTrigger render={<Button className="bg-indigo-600 hover:bg-indigo-700 h-11 px-6 rounded-xl shadow-lg shadow-indigo-600/20 font-black uppercase tracking-widest text-[11px] border-none transition-all hover:scale-[1.02]" />}>
              <UserPlus className="w-4 h-4 mr-2" /> Tambah User
            </DialogTrigger>
          <DialogContent className="rounded-[32px] sm:max-w-[480px] p-8 border-none shadow-2xl bg-white">
            <DialogHeader className="space-y-2">
              <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mb-2">
                <UserPlus className="w-6 h-6 text-indigo-600" />
              </div>
              <DialogTitle className="text-2xl font-black text-gray-900 tracking-tight">Create New Identity</DialogTitle>
              <DialogDescription className="text-sm text-gray-500 font-medium">Register a new access profile for the network.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-6 font-sans">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input 
                    placeholder="Enter full name" 
                    value={newUser.name}
                    onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                    className="bg-gray-50 border-gray-100 rounded-2xl h-14 pl-12 focus:bg-white focus:ring-4 focus:ring-indigo-100 transition-all font-medium" 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input 
                    type="email"
                    placeholder="name@company.com" 
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                    className="bg-gray-50 border-gray-100 rounded-2xl h-14 pl-12 focus:bg-white focus:ring-4 focus:ring-indigo-100 transition-all font-medium" 
                  />
                </div>
              </div>
              {isSuperAdmin ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Assign Role</label>
                      <Select value={newUser.role} onValueChange={(val) => setNewUser({...newUser, role: val})}>
                        <SelectTrigger className="bg-gray-50 border-gray-100 rounded-2xl h-14 px-4 font-medium transition-all focus:ring-4 focus:ring-indigo-100 ring-offset-0">
                          <SelectValue placeholder="Select Role" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-gray-100 rounded-2xl shadow-xl p-2 font-sans">
                          <SelectItem value="Super Admin" className="rounded-xl p-3 focus:bg-indigo-50 cursor-pointer">Super Admin</SelectItem>
                          <SelectItem value="Branch Admin" className="rounded-xl p-3 focus:bg-indigo-50 cursor-pointer">Branch Admin</SelectItem>
                          <SelectItem value="Member" className="rounded-xl p-3 focus:bg-indigo-50 cursor-pointer">Member</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Initial Password</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input 
                          type="password"
                          placeholder="••••••••" 
                          value={newUser.password}
                          onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                          className="bg-gray-50 border-gray-100 rounded-2xl h-14 pl-12 focus:bg-white focus:ring-4 focus:ring-indigo-100 transition-all font-medium" 
                        />
                      </div>
                    </div>
                  </div>

                  {newUser.role === 'Branch Admin' && (
                    <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Assign Location</label>
                      <div className="relative">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
                        <Select 
                          value={newUser.branchId} 
                          onValueChange={(val) => setNewUser({...newUser, branchId: val})}
                        >
                          <SelectTrigger className="bg-gray-50 border-gray-100 rounded-2xl h-14 pl-12 pr-4 font-medium transition-all focus:ring-4 focus:ring-indigo-100 ring-offset-0">
                            <SelectValue placeholder="Select Branch" />
                          </SelectTrigger>
                          <SelectContent className="bg-white border-gray-100 rounded-2xl shadow-xl p-2 font-sans">
                            {branches.map(loc => (
                              <SelectItem key={loc.id} value={loc.id} className="rounded-xl p-3 focus:bg-indigo-50 cursor-pointer">
                                {loc.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">User Role</label>
                    <div className="px-5 py-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
                      <span className="text-sm font-bold text-gray-900">Member</span>
                      <Users2 className="w-4 h-4 text-indigo-600" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Initial Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input 
                        type="password"
                        placeholder="••••••••" 
                        value={newUser.password}
                        onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                        className="bg-gray-50 border-gray-100 rounded-2xl h-14 pl-12 focus:bg-white focus:ring-4 focus:ring-indigo-100 transition-all font-medium" 
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter className="flex flex-col sm:flex-row gap-3 pt-4 font-sans">
              <Button 
                variant="ghost" 
                onClick={() => setIsAddModalOpen(false)}
                className="h-14 rounded-2xl font-bold flex-1 text-gray-500 hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCreateUser}
                className="bg-indigo-600 hover:bg-indigo-700 h-14 rounded-2xl font-black uppercase tracking-widest text-[11px] flex-1 text-white shadow-lg shadow-indigo-100 transition-all hover:scale-[1.02]"
              >
                Generate Identity
              </Button>
            </DialogFooter>
          </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* ── STAT MINI CARDS ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {isSuperAdmin ? (
          [
            { label: 'Super Admin', value: superAdminCount, icon: Shield, iconBg: 'bg-indigo-50 text-indigo-600' },
            { label: 'Branch Admin', value: branchAdminCount, icon: ShieldAlert, iconBg: 'bg-amber-50 text-amber-600' },
            { label: 'Member', value: memberCount, icon: Users2, iconBg: 'bg-violet-50 text-violet-600' },
            { label: 'Pengguna Aktif', value: activeCount, icon: CircleCheck, iconBg: 'bg-emerald-50 text-emerald-600' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
              <div className={cn('p-3 rounded-xl flex-shrink-0', s.iconBg)}><s.icon className="w-5 h-5" /></div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-0.5">{s.label}</p>
                <p className="text-2xl font-black text-gray-900 tracking-tight font-mono">{s.value.toString().padStart(2, '0')}</p>
              </div>
            </div>
          ))
        ) : (
          [
            { label: 'Total Member', value: memberCount, icon: Users2, iconBg: 'bg-violet-50 text-violet-600' },
            { label: 'Member Aktif', value: users.filter(u => u.role === 'Member' && u.status === 'Active').length, icon: CircleCheck, iconBg: 'bg-emerald-50 text-emerald-600' },
            { label: 'Total Poin Member', value: users.filter(u => u.role === 'Member').reduce((sum, u) => sum + (u.points || 0), 0), icon: Tag, iconBg: 'bg-amber-50 text-amber-600', isMono: true },
            { label: 'Status Server', value: 'ONLINE', icon: Shield, iconBg: 'bg-emerald-50 text-emerald-600', isText: true },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
              <div className={cn('p-3 rounded-xl flex-shrink-0', s.iconBg)}><s.icon className="w-5 h-5" /></div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-0.5">{s.label}</p>
                <p className={cn("text-2xl font-black tracking-tight", s.isMono ? "font-mono text-amber-600" : "text-gray-900", s.isText ? "text-sm text-emerald-600" : "")}>
                  {s.isText ? s.value : (s.isMono ? s.value.toLocaleString() : s.value.toString().padStart(2, '0'))}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── FILTER BAR ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
          <input
            type="text"
            placeholder="Cari nama atau email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 h-11 bg-white border border-gray-100 rounded-xl text-sm font-medium placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-200 transition-all outline-none shadow-sm"
          />
        </div>
        {isSuperAdmin && (
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-full sm:w-48 bg-white border border-gray-100 rounded-xl h-11 px-4 shadow-sm font-bold text-xs transition-all hover:bg-gray-50">
              <SelectValue placeholder="Semua Role" />
            </SelectTrigger>
            <SelectContent className="bg-white border-gray-100 rounded-2xl shadow-xl p-2">
              <SelectItem value="ALL" className="rounded-xl p-3 focus:bg-indigo-50 cursor-pointer text-xs font-bold">Semua Role</SelectItem>
              <SelectItem value="Super Admin" className="rounded-xl p-3 focus:bg-indigo-50 cursor-pointer text-xs font-bold">Super Admin</SelectItem>
              <SelectItem value="Branch Admin" className="rounded-xl p-3 focus:bg-indigo-50 cursor-pointer text-xs font-bold">Branch Admin</SelectItem>
              <SelectItem value="Member" className="rounded-xl p-3 focus:bg-indigo-50 cursor-pointer text-xs font-bold">Member</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      {/* ── TABLE CARD ── */}
      <Card className="rounded-3xl border border-gray-100 shadow-sm bg-white overflow-hidden w-full">
         <CardContent className="p-0">
            <div className="border-b border-gray-50 hidden"> {/* removed old stat strip */}
               <div className="hidden">
                  <div className="relative w-full max-w-sm group">
                     <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                     <input 
                        type="text"
                     placeholder=""
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                     className="hidden"
                  />
                  </div>
               </div>
            </div>
            
            <div className="overflow-x-auto">
               <table className="w-full text-left font-sans">
                  <thead>
                     <tr className="bg-gray-50/60 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                        <th className="py-4 pl-6">Pengguna</th>
                        <th className="py-4">Role</th>
                        <th className="py-4">Cabang</th>
                        <th className="py-4">Status</th>
                        <th className="py-4">Poin</th>
                        <th className="py-4 text-right pr-6">Aksi</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                     {filteredUsers.length > 0 ? filteredUsers.map((user) => (
                        <tr key={user.id} className="group hover:bg-indigo-50/20 transition-all duration-200">
                            <td className="py-4 pl-6">
                               <div className="flex items-center gap-3">
                                  <Avatar className="w-12 h-12 rounded-2xl border-2 border-white shadow-md ring-2 ring-gray-100 flex-shrink-0">
                                     <AvatarImage src={getAvatarUrl(user)} alt={user.name} />
                                     <AvatarFallback className="bg-indigo-600 text-white capitalize font-black text-sm">{user.name[0]}</AvatarFallback>
                                 </Avatar>
                                  <div className="flex flex-col space-y-0.5">
                                     <span className="font-black text-gray-900 text-sm">{user.name}</span>
                                     <span className="text-xs font-medium text-gray-400">{user.email}</span>
                                  </div>
                              </div>
                           </td>
                           <td className="py-8">
                              <div className="flex items-center gap-2.5">
                                 <div className={cn(
                                   "p-2 rounded-xl shadow-sm",
                                   user.role === 'Super Admin' ? "bg-indigo-50 text-indigo-600" :
                                   user.role === 'Branch Admin' ? "bg-amber-50 text-amber-600" :
                                   "bg-gray-100 text-gray-500"
                                 )}>
                                    <ShieldAlert className="w-4 h-4" />
                                 </div>
                                 <span className={cn(
                                   "text-[11px] font-black uppercase tracking-widest px-3 py-1 rounded-full",
                                   user.role === 'Super Admin' ? "text-indigo-600" :
                                   user.role === 'Branch Admin' ? "text-amber-600" :
                                   "text-gray-500"
                                 )}>{user.role}</span>
                              </div>
                           </td>
                            <td className="py-4">
                               <div className="flex items-center gap-1.5 text-gray-500">
                                 <MapPin className="w-3.5 h-3.5 text-gray-300" />
                                 <span className="text-xs font-medium">{user.location}</span>
                               </div>
                            </td>
                            <td className="py-4">
                              <div className="flex items-center gap-2.5">
                                 <div className={cn(
                                    "w-2 h-2 rounded-full ring-4 ring-offset-0",
                                    user.status === 'Active' ? "bg-emerald-500 ring-emerald-500/20" : "bg-gray-300 ring-gray-300/20"
                                 )} />
                                 <span className={cn(
                                    "text-[11px] font-black uppercase tracking-widest",
                                    user.status === 'Active' ? "text-emerald-600" : "text-gray-400"
                                 )}>
                                    {user.status}
                                 </span>
                              </div>
                           </td>
                            <td className="py-4">
                               {user.role === 'Member' ? (
                                 <div className="flex items-center gap-1.5">
                                  <div className="bg-amber-50 text-amber-600 p-1.5 rounded-lg shadow-sm">
                                    <Tag className="w-3.5 h-3.5" />
                                  </div>
                                  <span className="font-mono font-black text-amber-600 text-sm">
                                    {user.points || 0} Pts
                                  </span>
                                </div>
                              ) : (
                                <span className="text-gray-300 text-xs font-bold">-</span>
                              )}
                           </td>
                            <td className="py-4 text-right pr-6">
                               <div className="flex items-center justify-end gap-1.5 opacity-60 group-hover:opacity-100 transition-all duration-200">
                                 {user.role === 'Member' && (
                                   <Button 
                                      onClick={() => {
                                        setSelectedMemberForVoucher(user);
                                        setIsVoucherModalOpen(true);
                                      }}
                                      variant="ghost" 
                                      size="icon" 
                                      className="bg-white hover:bg-emerald-50 shadow-[0_8px_30px_rgb(0,0,0,0.08)] rounded-[18px] text-emerald-600 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(16,185,129,0.15)] transition-all duration-300 h-12 w-12 flex items-center justify-center animate-in zoom-in-50 duration-300"
                                    >
                                      <Gift className="w-5 h-5" strokeWidth={2.5} />
                                   </Button>
                                 )}
                                 <Button 
                                    onClick={() => {
                                      setEditingUser({...user});
                                      setIsEditModalOpen(true);
                                    }}
                                    variant="ghost" 
                                    size="icon" 
                                    className="bg-white hover:bg-indigo-50 shadow-[0_8px_30px_rgb(0,0,0,0.08)] rounded-[18px] text-indigo-600 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(79,70,229,0.15)] transition-all duration-300 h-12 w-12 flex items-center justify-center"
                                  >
                                    <Edit2 className="w-5 h-5" strokeWidth={2.5} />
                                 </Button>
                                 <button 
                                    onClick={() => {
                                      setUserToDelete(user);
                                      setIsDeleteModalOpen(true);
                                    }}
                                    className="bg-white hover:bg-rose-50 shadow-[0_8px_30px_rgb(0,0,0,0.08)] rounded-[18px] text-rose-500 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(244,63,94,0.15)] transition-all duration-300 h-12 w-12 flex items-center justify-center"
                                  >
                                    <Trash2 className="w-5 h-5" strokeWidth={2.5} />
                                 </button>
                               </div>
                            </td>
                        </tr>
                     )) : (
                       <tr>
                         <td colSpan={6} className="py-20 text-center">
                           <div className="flex flex-col items-center gap-3">
                             <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
                               <Search className="w-8 h-8 text-gray-300" />
                             </div>
                             <p className="text-gray-400 font-bold tracking-tight">No identities matching your filter.</p>
                             <Button variant="link" onClick={() => {setRoleFilter('ALL'); setSearchQuery('');}} className="text-indigo-600 font-black uppercase tracking-widest text-[10px]">Clear all filters</Button>
                           </div>
                         </td>
                       </tr>
                     )}
                  </tbody>
               </table>
            </div>
         </CardContent>
      </Card>

      {/* Edit Identity Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="rounded-[32px] sm:max-w-[480px] p-8 border-none shadow-2xl bg-white">
          <DialogHeader className="space-y-2">
            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mb-2">
              <Edit2 className="w-6 h-6 text-indigo-600" />
            </div>
            <DialogTitle className="text-2xl font-black text-gray-900 tracking-tight">Edit Identity</DialogTitle>
            <DialogDescription className="text-sm text-gray-500 font-medium">Update profile details and access rights.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-6 font-sans">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input 
                  placeholder="Enter full name" 
                  value={editingUser?.name || ''}
                  onChange={(e) => setEditingUser({...editingUser, name: e.target.value})}
                  className="bg-gray-50 border-gray-100 rounded-2xl h-14 pl-12 focus:bg-white focus:ring-4 focus:ring-indigo-100 transition-all font-medium" 
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input 
                  type="email"
                  placeholder="name@company.com" 
                  value={editingUser?.email || ''}
                  onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
                  className="bg-gray-50 border-gray-100 rounded-2xl h-14 pl-12 focus:bg-white focus:ring-4 focus:ring-indigo-100 transition-all font-medium" 
                />
              </div>
            </div>

            {editingUser?.role === 'Branch Admin' && (
              <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Location Assignment</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
                  <Select 
                    value={editingUser?.branchId} 
                    onValueChange={(val) => setEditingUser({...editingUser, branchId: val})}
                  >
                    <SelectTrigger className="bg-gray-50 border-gray-100 rounded-2xl h-14 pl-12 pr-4 font-medium transition-all focus:ring-4 focus:ring-indigo-100 ring-offset-0">
                      <SelectValue placeholder="Select Location" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-100 rounded-2xl shadow-xl p-2 font-sans">
                      {branches.map(loc => (
                        <SelectItem key={loc.id} value={loc.id} className="rounded-xl p-3 focus:bg-indigo-50 cursor-pointer">
                          {loc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">User Role</label>
              <div className="px-5 py-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
                <span className="text-sm font-bold text-gray-900">{editingUser?.role}</span>
                <ShieldAlert className="w-4 h-4 text-gray-400" />
              </div>
              <p className="text-[10px] text-gray-400 italic ml-1">* Role type is immutable. Revoke access to change roles.</p>
            </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-3 pt-4 font-sans">
            <Button 
              variant="ghost" 
              onClick={() => setIsEditModalOpen(false)}
              className="h-14 rounded-2xl font-bold flex-1 text-gray-500 hover:bg-gray-50"
            >
              Discard Changes
            </Button>
            <Button 
              onClick={handleEditUser}
              className="bg-indigo-600 hover:bg-indigo-700 h-14 rounded-2xl font-black uppercase tracking-widest text-[11px] flex-1 text-white shadow-lg shadow-indigo-100 transition-all hover:scale-[1.02]"
            >
              Update Identity
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="rounded-[32px] sm:max-w-[420px] p-8 border-none shadow-2xl bg-white">
          <DialogHeader className="space-y-2">
            <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center mb-2">
              <Trash2 className="w-6 h-6 text-rose-600" />
            </div>
            <DialogTitle className="text-2xl font-black text-gray-900 tracking-tight">Revoke Access</DialogTitle>
            <DialogDescription className="text-sm text-gray-500 font-medium leading-relaxed">
              Are you sure you want to revoke access for <span className="text-gray-900 font-black">{userToDelete?.name}</span>? This will permanently delete their account and terminal access.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-3 pt-6 font-sans">
            <Button 
              variant="ghost" 
              onClick={() => setIsDeleteModalOpen(false)}
              className="h-14 rounded-2xl font-bold flex-1 text-gray-500 hover:bg-gray-50"
            >
              No, Keep User
            </Button>
            <Button 
              onClick={handleDeleteUser}
              className="bg-rose-600 hover:bg-rose-700 h-14 rounded-2xl font-black uppercase tracking-widest text-[11px] flex-1 text-white shadow-lg shadow-rose-100 transition-all hover:scale-[1.02]"
            >
              Revoke Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Give Voucher Modal */}
      <Dialog open={isVoucherModalOpen} onOpenChange={setIsVoucherModalOpen}>
        <DialogContent className="rounded-[32px] sm:max-w-[480px] p-8 border-none shadow-2xl bg-white">
          <DialogHeader className="space-y-2">
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mb-2">
              <Gift className="w-6 h-6 text-emerald-600" />
            </div>
            <DialogTitle className="text-2xl font-black text-gray-900 tracking-tight">Send Voucher</DialogTitle>
            <DialogDescription className="text-sm text-gray-500 font-medium">
              Gift a special promo code directly to <span className="text-gray-900 font-bold">{selectedMemberForVoucher?.name}</span>.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-6 font-sans">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Voucher Code</label>
              <div className="relative">
                <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input 
                  placeholder="e.g. VIP50" 
                  value={voucherForm.code}
                  onChange={(e) => setVoucherForm({...voucherForm, code: e.target.value.toUpperCase()})}
                  className="bg-gray-50 border-gray-100 rounded-2xl h-14 pl-12 focus:bg-white focus:ring-4 focus:ring-indigo-100 transition-all font-mono font-bold uppercase" 
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Discount Type</label>
                <div className="flex bg-gray-50 p-1 border border-gray-100 rounded-2xl h-14">
                  <button 
                    onClick={() => setVoucherForm({...voucherForm, discount_type: 'percent'})}
                    className={cn("flex-1 flex items-center justify-center gap-1.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all", voucherForm.discount_type === 'percent' ? "bg-white text-indigo-600 shadow-sm" : "text-gray-400")}
                  >
                    <Percent className="w-3 h-3" /> %
                  </button>
                  <button 
                    onClick={() => setVoucherForm({...voucherForm, discount_type: 'fixed'})}
                    className={cn("flex-1 flex items-center justify-center gap-1.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all", voucherForm.discount_type === 'fixed' ? "bg-white text-indigo-600 shadow-sm" : "text-gray-400")}
                  >
                    <Banknote className="w-3 h-3" /> Rp
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Discount Value</label>
                <Input 
                  type="number"
                  placeholder={voucherForm.discount_type === 'percent' ? "10" : "15000"} 
                  value={voucherForm.discount_value}
                  onChange={(e) => setVoucherForm({...voucherForm, discount_value: e.target.value})}
                  className="bg-gray-50 border-gray-100 rounded-2xl h-14 px-4 focus:bg-white focus:ring-4 focus:ring-indigo-100 transition-all font-bold" 
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Min. Purchase (Optional)</label>
              <Input 
                type="number"
                placeholder="0" 
                value={voucherForm.min_purchase}
                onChange={(e) => setVoucherForm({...voucherForm, min_purchase: e.target.value})}
                className="bg-gray-50 border-gray-100 rounded-2xl h-14 px-4 focus:bg-white focus:ring-4 focus:ring-indigo-100 transition-all font-bold" 
              />
            </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-3 pt-4 font-sans">
            <Button 
              variant="ghost" 
              onClick={() => setIsVoucherModalOpen(false)}
              className="h-14 rounded-2xl font-bold flex-1 text-gray-500 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAssignVoucher}
              className="bg-emerald-600 hover:bg-emerald-700 h-14 rounded-2xl font-black uppercase tracking-widest text-[11px] flex-1 text-white shadow-lg shadow-emerald-100 transition-all hover:scale-[1.02]"
            >
              Send Voucher
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
