import {useState, ReactNode, useEffect} from 'react';
import foto2 from '../../../../assets/2.png';
import {motion, AnimatePresence} from 'motion/react';
import {NavLink, useLocation as useRouteLocation, useNavigate} from 'react-router-dom';
import {
  LayoutDashboard, 
  Package, 
  Archive, 
  Tag, 
  Users, 
  LogOut, 
  Menu, 
  X,
  User,
  Bell,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  MapPin,
  Globe,
  Check,
  Megaphone,
  BrainCircuit,
  MonitorCheck,
  Settings,
  Moon,
  Sun,
} from 'lucide-react';
import {useAuth} from '@/shared/context/AuthContext';
import {useLocation} from '@/shared/context/LocationContext';
import {cn} from '@/shared/lib/utils';
import {Button, buttonVariants} from '@/shared/components/ui/button';
import {Avatar, AvatarFallback, AvatarImage} from '@/shared/components/ui/avatar';
import {Switch} from '@/shared/components/ui/switch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import {ScrollArea} from '@/shared/components/ui/scroll-area';
import {Separator} from '@/shared/components/ui/separator';
import {MOCK_LOCATIONS, LocationID, BACKEND_URL} from '@/shared/lib/api';

const SUPER_ADMIN_NAV = [
  {path: '/overview', label: 'Overview', icon: LayoutDashboard},
  {path: '/catalog', label: 'Master Products', icon: Package},
  {path: '/promo', label: 'Promo', icon: Tag},
  {path: '/monitor', label: 'Branch Inventory', icon: MonitorCheck},
  {path: '/users', label: 'User Management', icon: Users},
  {path: '/broadcast', label: 'Broadcast', icon: Megaphone},
  {path: '/insights', label: 'AI Insights', icon: BrainCircuit},
];

const BRANCH_ADMIN_NAV = [
  {path: '/overview', label: 'Overview', icon: LayoutDashboard},
  {path: '/inventory', label: 'Inventory', icon: Archive},
  {path: '/promo', label: 'Promo', icon: Tag},
  {path: '/users', label: 'User Management', icon: Users},
  {path: '/analysis', label: 'AI Insights', icon: BrainCircuit},
];

export default function DashboardLayout({children}: {children: ReactNode}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const {user, logout} = useAuth();
  const {currentLocation, setCurrentLocation, locationName} = useLocation();
  const routeLocation = useRouteLocation();
  const navigate = useNavigate();

  const isSuperAdmin = user?.role === 'super_admin';
  const navItems = isSuperAdmin ? SUPER_ADMIN_NAV : BRANCH_ADMIN_NAV;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const activePageLabel = [...SUPER_ADMIN_NAV, ...BRANCH_ADMIN_NAV].find(n => n.path === routeLocation.pathname)?.label || 'Dashboard';

  const getAvatarUrl = () => {
    const avatarStr = user?.avatar_url;
    if (!avatarStr || avatarStr === 'null' || avatarStr === '') {
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.username || 'User')}&background=4f46e5&color=fff&bold=true`;
    }
    if (avatarStr.startsWith('http')) return avatarStr;
    return `${BACKEND_URL}${avatarStr}`;
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] flex font-sans selection:bg-indigo-100 relative">
      
      {/* Floating Sidebar Toggle Button (Desktop) */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className={cn(
          "hidden lg:flex absolute top-24 z-[60] items-center justify-center w-8 h-8 rounded-full bg-indigo-600 text-white shadow-[0_4px_12px_rgba(79,70,229,0.4)] hover:bg-indigo-700 transition-all duration-500 ease-in-out hover:scale-110",
          isSidebarOpen ? "left-[244px]" : "left-[56px]"
        )}
      >
        {isSidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </button>

      {/* Sidebar... */}
      <aside 
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 bg-[#0F172A] text-white transition-all duration-500 ease-in-out shadow-[10px_0_40px_rgba(0,0,0,0.1)] overflow-hidden",
          isSidebarOpen ? "w-[260px]" : "w-0 lg:w-[72px]"
        )}
      >
        <div className="h-full flex flex-col py-6 px-3">
          {/* Logo Header */}
          <div className="flex items-center justify-between mb-10 sticky top-0 bg-[#0F172A] z-10 py-2">
            {isSidebarOpen ? (
              <div className="flex items-center gap-3 pl-1 min-w-0">
                <div className="w-12 h-12 shadow-lg shadow-indigo-500/20 flex-shrink-0 hover:scale-105 transition-transform cursor-pointer rounded-xl">
                  <img src={foto2} alt="AutoCashier Logo" className="w-full h-full object-contain rounded-md" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[17px] font-black tracking-tighter uppercase italic leading-none truncate">AutoCashier</span>
                  <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.2em] mt-0.5">Scan & Pay</span>
                </div>
              </div>
            ) : (
              <div className="w-full flex justify-center">
                <div className="w-10 h-10 shadow-lg shadow-indigo-500/20 hover:scale-110 transition-transform cursor-pointer rounded-xl">
                  <img src={foto2} alt="AutoCashier Logo" className="w-full h-full object-contain rounded-md" />
                </div>
              </div>
            )}
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="hover:bg-white/10 text-white/40 lg:hidden flex-shrink-0"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </div>

          <ScrollArea className="flex-1">
            <div className="space-y-1.5">
              {isSidebarOpen && (
                <p className="text-[9px] font-black text-white/25 uppercase tracking-[0.35em] px-4 mb-4">
                  Main Menu
                </p>
              )}
              {navItems.map((item) => {
                const isActive = routeLocation.pathname === item.path;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    title={!isSidebarOpen ? item.label : undefined}
                    className={cn(
                      "flex items-center transition-all duration-200 group relative rounded-xl overflow-hidden",
                      isSidebarOpen
                        ? "gap-3 px-4 py-3 w-full"
                        : "justify-center p-0 mx-auto w-11 h-11",
                      isActive
                        ? "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-500/40"
                        : "text-white/60 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10"
                    )}
                  >
                    {/* Active glow bar */}
                    {isActive && isSidebarOpen && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white/50 rounded-r-full" />
                    )}
                    <item.icon className={cn(
                      "flex-shrink-0 transition-all duration-200 w-[18px] h-[18px]",
                      isActive ? "text-white" : "text-white/60 group-hover:text-white group-hover:scale-110"
                    )} />
                    {isSidebarOpen && (
                      <span className={cn(
                        "text-[13px] tracking-tight whitespace-nowrap transition-all",
                        isActive ? "font-bold" : "font-medium"
                      )}>
                        {item.label}
                      </span>
                    )}
                    {isActive && isSidebarOpen && (
                      <div className="ml-auto flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-white/70 animate-pulse" />
                      </div>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </ScrollArea>

          <div className="mt-4 pt-4 border-t border-white/5">
            <button
              onClick={handleLogout}
              title={!isSidebarOpen ? 'Sign Out' : undefined}
              className={cn(
                "flex items-center transition-all duration-300 rounded-2xl text-rose-400 hover:text-white hover:bg-rose-500/20 font-semibold",
                isSidebarOpen
                  ? "w-full gap-3 px-3 py-3"
                  : "justify-center p-3 mx-auto w-12 h-12"
              )}
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              {isSidebarOpen && <span className="text-[14px]">Sign Out</span>}
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-x-hidden relative">
        <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-indigo-50/50 blur-[120px] rounded-full pointer-events-none -z-10" />

        <header className="h-24 bg-white/70 backdrop-blur-xl border-b border-gray-100 flex items-center justify-between px-8 sticky top-0 z-40 shrink-0">
          <div className="flex items-center gap-6">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="w-10 h-10 lg:hidden flex items-center justify-center rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/30 transition-all active:scale-90 hover:scale-105 flex-shrink-0"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex flex-col">
              <h1 className="text-2xl font-black text-gray-900 tracking-tighter leading-none">
                {activePageLabel} {user?.role === 'branch_admin' ? `- ${locationName}` : ''}
              </h1>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Enterprise</span>
                <ChevronRight className="w-3 h-3 text-gray-300" />
                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest leading-none">
                  {user?.roleName || 'System Admin'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4 text-right">

            <div className="flex items-center gap-2">
               {!isSuperAdmin && (
                 <DropdownMenu>
                    <DropdownMenuTrigger className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "rounded-2xl relative text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 outline-none")}>
                        <Bell className="w-5 h-5" />
                        <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-indigo-600 rounded-full border-2 border-white" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-80 rounded-3xl p-4 bg-white border-gray-100 shadow-2xl space-y-4">
                       <DropdownMenuLabel className="font-black text-gray-900 tracking-tighter uppercase text-xs tracking-widest text-indigo-600">Broadcast Center</DropdownMenuLabel>
                       <div className="space-y-3">
                          {[
                             { title: 'System Maintenance', time: '2h ago', preview: 'Cloud synchronization will be offline for 15 minutes.' },
                             { title: 'New Stock Guidelines', time: '5h ago', preview: 'Mandatory 4-sided photos required for all new intakes.' }
                          ].map((notif, i) => (
                             <div key={i} className="p-3 bg-gray-50 rounded-2xl hover:bg-indigo-50/50 transition-colors cursor-pointer group">
                                <div className="flex justify-between items-start mb-1">
                                   <span className="text-xs font-black text-gray-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{notif.title}</span>
                                   <span className="text-[10px] font-bold text-gray-400">{notif.time}</span>
                                </div>
                                <p className="text-[11px] text-gray-500 font-medium leading-tight">{notif.preview}</p>
                             </div>
                          ))}
                       </div>
                       <Button 
                         variant="ghost" 
                         onClick={() => navigate('/inbox')}
                         className="w-full text-xs font-bold text-gray-400 h-10 hover:text-indigo-600 rounded-xl"
                       >
                         View All Notifications
                       </Button>
                    </DropdownMenuContent>
                 </DropdownMenu>
               )}

                <Button 
                  variant="ghost" 
                  onClick={() => navigate('/profile')}
                  className="rounded-2xl gap-3 pl-2 pr-4 hover:bg-gray-50 border border-transparent hover:border-gray-100 h-14"
                >
                   <Avatar className="w-10 h-10 rounded-xl relative">
                      <AvatarImage src={getAvatarUrl()} alt={user?.username || 'User Avatar'} />
                      <AvatarFallback className="bg-indigo-600 text-white rounded-xl text-xs">{user?.username?.[0]}</AvatarFallback>
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white" />
                   </Avatar>
                   <div className="hidden lg:flex flex-col items-start">
                      <span className="text-xs font-bold text-gray-900 leading-none">{user?.username}</span>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Status: Online</span>
                   </div>
                </Button>
            </div>
          </div>
        </header>

        <ScrollArea className="flex-1 bg-transparent w-full">
          <div className="p-6 lg:p-10 max-w-[1600px] mx-auto w-full">
             <motion.div
               key={routeLocation.pathname}
               initial={{opacity: 0, y: 20}}
               animate={{opacity: 1, y: 0}}
               transition={{duration: 0.5, ease: "easeOut"}}
             >
               {children}
             </motion.div>
          </div>
        </ScrollArea>
      </main>
    </div>
  );
}
