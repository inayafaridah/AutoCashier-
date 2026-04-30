import {useState} from 'react';
import {Card, CardContent} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Avatar, AvatarFallback, AvatarImage} from '@/components/ui/avatar';
import {Shield, UserPlus, Search, Edit2, ShieldAlert, CircleCheck, Trash2, Mail, Lock, User, MapPin} from 'lucide-react';
import {cn} from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {Input} from '@/components/ui/input';
import {toast} from 'sonner';
import {MOCK_LOCATIONS} from '@/lib/api';

export default function UsersPage() {
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'Member',
    password: ''
  });

  const [editingUser, setEditingUser] = useState<any>(null);
  const [userToDelete, setUserToDelete] = useState<any>(null);

  const [users, setUsers] = useState([
    { id: '1', name: 'Super Admin', email: 'admin@autocashier.dev', role: 'Super Admin', status: 'Active', location: 'Pusat' },
    { id: '2', name: 'Budi Santoso', email: 'budi@loc.jakarta', role: 'Branch Admin', status: 'Active', location: 'Gegerkalong' },
    { id: '3', name: 'Siti Aminah', email: 'siti@loc.surabaya', role: 'Branch Admin', status: 'Offline', location: 'Surabaya Downtown' },
    { id: '4', name: 'Andi Wijaya', email: 'andi@loc.bandung', role: 'Branch Admin', status: 'Active', location: 'Bandung Industrial' },
    { id: '5', name: 'Rina Kartika', email: 'rina@loc.kuningan', role: 'Member', status: 'Active', location: 'Kuningan' },
    { id: '6', name: 'Reza Pahlevi', email: 'reza@loc.sudirman', role: 'Member', status: 'Offline', location: 'Sudirman' },
    { id: '7', name: 'Maya Sari', email: 'maya@loc.kemang', role: 'Member', status: 'Active', location: 'Kemang' },
    { id: '8', name: 'Dedi Kurniawan', email: 'dedi@loc.menteng', role: 'Member', status: 'Active', location: 'Menteng' },
  ]);

  const filteredUsers = users.filter(user => {
    const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         user.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRole && matchesSearch;
  });

  const handleCreateUser = () => {
    if (!newUser.name || !newUser.email || !newUser.password) {
      toast.error('Please fill in all fields');
      return;
    }

    const createdUser = {
      id: Math.random().toString(36).substr(2, 9),
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      status: 'Active',
      location: 'Unassigned'
    };

    setUsers([createdUser, ...users]);
    setIsAddModalOpen(false);
    toast.success('Identity created successfully');
    setNewUser({ name: '', email: '', role: 'Member', password: '' });
  };

  const handleEditUser = () => {
    if (!editingUser.name || !editingUser.email) {
      toast.error('Name and Email are required');
      return;
    }

    setUsers(users.map(u => u.id === editingUser.id ? editingUser : u));
    setIsEditModalOpen(false);
    toast.success('Identity updated successfully');
  };

  const handleDeleteUser = () => {
    if (!userToDelete) return;
    setUsers(users.filter(u => u.id !== userToDelete.id));
    setIsDeleteModalOpen(false);
    toast.success(`Identity for ${userToDelete.name} revoked`);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 max-w-7xl mx-auto w-full">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tighter uppercase">Enterprise Access</h2>
          <p className="text-gray-500 font-medium tracking-tight">Identity & Access Management Control Panel.</p>
        </div>
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger render={<Button className="bg-indigo-600 hover:bg-indigo-700 h-14 px-8 rounded-2xl shadow-xl shadow-indigo-600/20 font-black uppercase tracking-widest text-[11px] border-none transition-all hover:scale-[1.02]" />}>
            <UserPlus className="w-5 h-5 mr-3" /> Add New User
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

      <div className="flex flex-wrap gap-4 max-w-7xl mx-auto w-full">
         <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-56 bg-white border border-gray-100 rounded-2xl h-14 px-6 shadow-sm font-black text-[11px] uppercase tracking-widest transition-all hover:bg-gray-50">
               <div className="flex items-center gap-2">
                  <span className="text-gray-400 shrink-0">Show Category:</span>
                  <SelectValue placeholder="All Roles" />
               </div>
            </SelectTrigger>
            <SelectContent className="bg-white border-gray-100 rounded-2xl shadow-xl p-2 font-sans">
               <SelectItem value="ALL" className="rounded-xl p-3 focus:bg-indigo-50 cursor-pointer text-xs font-bold">All Roles</SelectItem>
               <SelectItem value="Super Admin" className="rounded-xl p-3 focus:bg-indigo-50 cursor-pointer text-xs font-bold">Super Admin</SelectItem>
               <SelectItem value="Branch Admin" className="rounded-xl p-3 focus:bg-indigo-50 cursor-pointer text-xs font-bold">Branch Admin</SelectItem>
               <SelectItem value="Member" className="rounded-xl p-3 focus:bg-indigo-50 cursor-pointer text-xs font-bold">Member</SelectItem>
            </SelectContent>
         </Select>
      </div>

      <Card className="rounded-[40px] border-none shadow-2xl shadow-indigo-600/5 bg-white overflow-hidden max-w-7xl mx-auto w-full">
         <CardContent className="p-0">
            <div className="grid grid-cols-1 md:grid-cols-4 border-b border-gray-50">
               <div className="p-10 border-r border-gray-50 flex items-center gap-5">
                  <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-[22px] flex items-center justify-center shadow-inner shadow-indigo-600/10">
                     <Shield className="w-7 h-7" />
                  </div>
                  <div className="flex flex-col">
                     <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Global Admins</span>
                     <span className="font-mono font-black text-gray-900 text-2xl tracking-tighter">{users.filter(u => u.role === 'Super Admin').length.toString().padStart(2, '0')}</span>
                  </div>
               </div>
               <div className="p-10 border-r border-gray-50 flex items-center gap-5">
                  <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-[22px] flex items-center justify-center shadow-inner shadow-emerald-600/10">
                     <CircleCheck className="w-7 h-7" />
                  </div>
                  <div className="flex flex-col">
                     <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Seats</span>
                     <span className="font-mono font-black text-gray-900 text-2xl tracking-tighter">{users.filter(u => u.status === 'Active').length.toString().padStart(2, '0')}</span>
                  </div>
               </div>
               <div className="p-10 md:col-span-2 flex items-center justify-end pr-10">
                  <div className="relative w-full max-w-sm group">
                     <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 group-focus-within:text-indigo-600 transition-colors" />
                     <input 
                        type="text" 
                        placeholder="Search system identities..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-14 pr-6 h-14 bg-gray-50 border-gray-100 border rounded-2xl text-sm font-bold placeholder:text-gray-400 focus:bg-white focus:ring-4 focus:ring-indigo-100 transition-all outline-none"
                     />
                  </div>
               </div>
            </div>
            
            <div className="overflow-x-auto">
               <table className="w-full text-left font-sans">
                  <thead>
                     <tr className="bg-[#F8F9FA]/50 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                        <th className="py-6 pl-10">Identity</th>
                        <th className="py-6">Role Type</th>
                        <th className="py-6">Auth Status</th>
                        <th className="py-6 text-right pr-10">Actions</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                     {filteredUsers.length > 0 ? filteredUsers.map((user) => (
                        <tr key={user.id} className="group hover:bg-indigo-50/20 transition-all duration-300">
                           <td className="py-8 pl-10">
                              <div className="flex items-center gap-5">
                                 <Avatar className="w-14 h-14 rounded-[22px] border-4 border-white shadow-lg ring-1 ring-gray-100 transition-transform group-hover:scale-105">
                                    <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} />
                                    <AvatarFallback className="bg-indigo-600 text-white capitalize font-black text-lg">{user.name[0]}</AvatarFallback>
                                 </Avatar>
                                 <div className="flex flex-col space-y-0.5">
                                    <span className="font-black text-gray-900 tracking-tighter text-lg">{user.name}</span>
                                    <span className="text-xs font-bold text-gray-400 group-hover:text-indigo-600/60 transition-colors">{user.email}</span>
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
                           <td className="py-8">
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
                           <td className="py-8 text-right pr-10">
                              <div className="flex items-center justify-end gap-2 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                                 <Button 
                                    onClick={() => {
                                      setEditingUser({...user});
                                      setIsEditModalOpen(true);
                                    }}
                                    variant="ghost" 
                                    size="icon" 
                                    className="rounded-2xl text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 h-11 w-11 shadow-sm"
                                  >
                                    <Edit2 className="w-4.5 h-4.5" />
                                 </Button>
                                 <Button 
                                    onClick={() => {
                                      setUserToDelete(user);
                                      setIsDeleteModalOpen(true);
                                    }}
                                    variant="ghost" 
                                    size="icon" 
                                    className="rounded-2xl text-gray-400 hover:text-rose-600 hover:bg-rose-50 h-11 w-11 shadow-sm"
                                  >
                                    <Trash2 className="w-4.5 h-4.5" />
                                 </Button>
                              </div>
                           </td>
                        </tr>
                     )) : (
                       <tr>
                         <td colSpan={4} className="py-20 text-center">
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
                    value={editingUser?.location} 
                    onValueChange={(val) => setEditingUser({...editingUser, location: val})}
                  >
                    <SelectTrigger className="bg-gray-50 border-gray-100 rounded-2xl h-14 pl-12 pr-4 font-medium transition-all focus:ring-4 focus:ring-indigo-100 ring-offset-0">
                      <SelectValue placeholder="Select Location" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-100 rounded-2xl shadow-xl p-2 font-sans">
                      {MOCK_LOCATIONS.filter(loc => loc.id !== 'ALL').map(loc => (
                        <SelectItem key={loc.id} value={loc.name} className="rounded-xl p-3 focus:bg-indigo-50 cursor-pointer">
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
    </div>
  );
}
