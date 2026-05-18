import {useState, useEffect} from 'react';
import {Card, CardContent, CardHeader, CardTitle} from '@/shared/components/ui/card';
import {Button} from '@/shared/components/ui/button';
import {Input} from '@/shared/components/ui/input';
import {Label} from '@/shared/components/ui/label';
import {Textarea} from '@/shared/components/ui/textarea';
import {Megaphone, Send, Users, History, AlertTriangle, Target, MapPin, Loader2} from 'lucide-react';
import {toast} from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { useLocation } from '@/shared/context/LocationContext';
import { fetchBackend } from '@/shared/lib/api';

export default function BroadcastPage() {
  const { allBranches } = useLocation();
  const [message, setMessage] = useState('');
  const [subject, setSubject] = useState('');
  const [audience, setAudience] = useState('ALL_BRANCHES');
  const [scopeBranch, setScopeBranch] = useState('');
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const hRes = await fetchBackend('getBroadcasts');
      if (hRes.status === 'success') setHistory(hRes.data);
    } catch (err) {
      console.error('Failed to load broadcast data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSend = async () => {
    if (!message || !subject) {
      toast.error("Please fill in all fields");
      return;
    }
    
    setIsSending(true);
    try {
      const res = await fetchBackend('sendBroadcast', {
        subject,
        message,
        audience,
        targetId: audience === 'SPECIFIC_BRANCH' ? scopeBranch : null
      });

      if (res.status === 'success') {
        toast.success("Broadcast dispatched successfully!");
        setMessage('');
        setSubject('');
        loadData();
      } else {
        toast.error(res.message || "Failed to dispatch broadcast");
      }
    } catch (err) {
      toast.error("Network synchronization error");
    } finally {
      setIsSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
         <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
         <p className="text-gray-400 font-black uppercase tracking-widest text-[10px]">Loading Communication Hub...</p>
      </div>
    );
  }

  const activeBranches = allBranches.filter((b: any) => b.id !== 'ALL');

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-black text-gray-900 tracking-tighter uppercase">Enterprise Broadcast</h2>
        <p className="text-gray-500 font-medium tracking-tight">Identity & Communication Control Center.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="rounded-3xl border border-gray-100 shadow-sm bg-white p-8 group">
            <CardHeader className="px-0 pt-0 pb-8">
               <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                     <Megaphone className="w-6 h-6" />
                  </div>
                  <CardTitle className="text-2xl font-black tracking-tighter">Compose Message</CardTitle>
               </div>
            </CardHeader>
            <div className="space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                     <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Target Audience</Label>
                     <div className="relative">
                        <Target className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-600 z-10" />
                        <Select value={audience} onValueChange={setAudience}>
                           <SelectTrigger className="rounded-2xl h-14 pl-12 bg-gray-50 border-none font-bold focus:ring-4 focus:ring-indigo-100 ring-offset-0 transition-all">
                              <SelectValue placeholder="Select Audience" />
                           </SelectTrigger>
                           <SelectContent className="rounded-2xl border-none shadow-2xl p-2 font-sans">
                              <SelectItem value="ALL_BRANCHES" className="rounded-xl p-3 focus:bg-indigo-50 cursor-pointer text-xs font-bold">All Branches</SelectItem>
                              <SelectItem value="SPECIFIC_BRANCH" className="rounded-xl p-3 focus:bg-indigo-50 cursor-pointer text-xs font-bold">Specific Branch</SelectItem>
                              <SelectItem value="ALL_MEMBERS" className="rounded-xl p-3 focus:bg-indigo-50 cursor-pointer text-xs font-bold">All Members</SelectItem>
                           </SelectContent>
                        </Select>
                     </div>
                  </div>
                  
                  {audience === 'SPECIFIC_BRANCH' && (
                     <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Select Branch</Label>
                        <div className="relative">
                           <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-600 z-10" />
                           <Select value={scopeBranch} onValueChange={setScopeBranch}>
                              <SelectTrigger className="rounded-2xl h-14 pl-12 bg-gray-50 border-none font-bold focus:ring-4 focus:ring-indigo-100 ring-offset-0 transition-all">
                                 <SelectValue placeholder="Target Branch">
                                    {scopeBranch ? activeBranches.find((b: any) => b.id === scopeBranch)?.name : "Target Branch"}
                                 </SelectValue>
                              </SelectTrigger>
                              <SelectContent className="rounded-2xl border-none shadow-2xl p-2 font-sans">
                                 {activeBranches.map((branch: any) => (
                                    <SelectItem key={branch.id} value={branch.id} className="rounded-xl p-3 focus:bg-indigo-50 cursor-pointer text-xs font-bold">
                                       {branch.name}
                                    </SelectItem>
                                 ))}
                              </SelectContent>
                           </Select>
                        </div>
                     </div>
                  )}
               </div>

               <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Subject / Header</Label>
                  <Input 
                    placeholder="e.g. System Maintenance Alert" 
                    className="rounded-2xl h-14 bg-gray-50 border-none px-6 font-bold focus:bg-white focus:ring-4 focus:ring-indigo-100 transition-all" 
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                  />
               </div>
               <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Message Body</Label>
                  <Textarea 
                    placeholder="Describe the update in detail..." 
                    className="rounded-2xl min-h-[220px] bg-gray-50 border-none p-6 font-medium focus:bg-white focus:ring-4 focus:ring-indigo-100 transition-all text-sm leading-relaxed"
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                  />
               </div>
               <div className="flex items-center gap-4 p-5 bg-amber-50 rounded-2xl border border-amber-100">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                  <p className="text-xs text-amber-800 font-bold leading-relaxed">
                    {audience === 'ALL_MEMBERS' 
                      ? 'This message will be sent to all registered Members (Push Notifications enabled).' 
                      : audience === 'SPECIFIC_BRANCH' 
                        ? `This message will be sent to admins at ${activeBranches.find(b => b.id === scopeBranch)?.name || 'the selected branch'}.`
                        : 'This message will be instantly delivered as a push notification to all 34 active branch managers.'}
                  </p>
               </div>
               <Button 
                onClick={handleSend}
                disabled={isSending}
                className="w-full bg-indigo-600 hover:bg-indigo-700 h-14 rounded-2xl shadow-xl shadow-indigo-600/20 font-black uppercase tracking-widest text-xs gap-3 group transition-all hover:scale-[1.02] flex items-center justify-center border-none"
               >
                 {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />} 
                 {isSending ? 'Sending...' : 'Dispatch Broadcast'}
               </Button>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
           <Card className="rounded-[32px] border-none shadow-2xl shadow-indigo-900/20 bg-[#0F172A] text-white p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/20 blur-[60px] rounded-full" />
              <div className="relative z-10 space-y-6">
                 <div className="w-12 h-12 bg-white/10 flex items-center justify-center rounded-2xl">
                    <Users className="w-6 h-6 text-indigo-400" />
                 </div>
                 <div>
                    <h4 className="text-xl font-black tracking-tighter">Recipients</h4>
                    <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mt-2">
                       Target: <span className="text-indigo-400">
                         {audience === 'ALL_MEMBERS' ? 'All Members' : audience === 'SPECIFIC_BRANCH' ? 'Branch Admin' : 'All Branch Admins'}
                       </span>
                    </p>
                 </div>
                 <div className="space-y-4">
                    <div className="flex justify-between items-center text-sm border-b border-white/5 pb-4">
                       <span className="text-white/40 font-bold uppercase text-[10px] tracking-widest">Target Scope</span>
                       <span className="font-mono font-black text-xl">
                          {audience === 'ALL_MEMBERS' ? 'Global' : audience === 'SPECIFIC_BRANCH' ? 'Local' : 'Network'}
                       </span>
                    </div>
                    <div className="flex justify-between items-center text-sm pt-1">
                       <span className="text-white/40 font-bold uppercase text-[10px] tracking-widest">
                          Integrity Status
                       </span>
                       <span className="font-mono font-black text-xl text-emerald-400">
                          Active
                       </span>
                    </div>
                 </div>
              </div>
           </Card>

           <Card className="rounded-3xl border border-gray-100 shadow-sm bg-white p-8">
              <div className="flex items-center gap-3 mb-6">
                 <History className="w-5 h-5 text-gray-400" />
                 <h4 className="font-black text-gray-900 tracking-tighter uppercase text-sm">Recent History</h4>
              </div>
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                 {history.length > 0 ? history.map((item) => (
                    <div key={item.id} className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex flex-col gap-2 group hover:bg-indigo-50/30 transition-colors cursor-pointer">
                       <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest leading-none">
                          {new Date(item.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                       </span>
                       <span className="text-sm font-bold text-gray-900 leading-tight group-hover:text-indigo-600 transition-colors">{item.subject}</span>
                       <p className="text-[10px] text-gray-400 line-clamp-2">{item.body}</p>
                    </div>
                 )) : (
                    <div className="text-center py-8">
                       <p className="text-gray-400 text-xs font-bold">No broadcast history found.</p>
                    </div>
                 )}
              </div>
           </Card>
        </div>
      </div>
    </div>
  );
}
