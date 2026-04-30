import {useState} from 'react';
import {Card, CardContent} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {
  Search,
  Bell,
  Clock,
  ChevronRight,
  Inbox,
  Filter,
  CheckCircle2,
  Calendar,
  MoreVertical,
  X,
  Sparkles
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {cn} from '@/lib/utils';
import {motion, AnimatePresence} from 'motion/react';

const MOCK_MESSAGES = [
  {
    id: '1',
    title: 'System Maintenance Window',
    preview: 'Cloud synchronization will be offline for 15 minutes tonight for high-priority security patches.',
    body: 'Greetings Captain. Our engineering team has scheduled a brief maintenance window starting at 24:00 UTC. During this time, cloud synchronization and AI analysis features may experience intermittent connectivity. This work is necessary to deploy critical high-priority security patches and ensure the long-term reliability of the Enterprise UI network nodes. No action is required on your part.',
    time: '2 hours ago',
    date: 'April 30, 2026',
    status: 'unread',
    tags: ['System', 'Maintenance']
  },
  {
    id: '2',
    title: 'New Stock Intake Guidelines',
    preview: 'Mandatory 4-sided photos required for all new product intakes starting immediately.',
    body: 'Attention all operational units. To improve AI recognition accuracy and inventory auditing, we are mandating a strict 4-sided photo protocol for all new product intakes. Every entry must include clear shots from the front, back, right, and left angles. Entries failing to meet these criteria will be flagged for review. Thank you for maintaining our enterprise data integrity.',
    time: '5 hours ago',
    date: 'April 30, 2026',
    status: 'unread',
    tags: ['Policy', 'Inventory']
  },
  {
    id: '3',
    title: 'Grand Ramadan Promo Activation',
    preview: 'Global campaign "Grand Ramadan Special" is now live across all urban branch clusters.',
    body: 'The enterprise-wide "Grand Ramadan Special" campaign has been successfully deployed. All participating locations should verify their local promo caches and ensure point-of-sale displays are aligned with the new digital assets. Our AI predicts a 22% increase in Arabica Signature orders during the evening shift sessions.',
    time: 'Yesterday',
    date: 'April 29, 2026',
    status: 'read',
    tags: ['Campaign', 'Live']
  },
  {
    id: '4',
    title: 'Regional Supply Chain Alert: Bandung',
    preview: 'Logistics delay expected for Arabica Signature blends in the Bandung industrial cluster.',
    body: 'Regional logistics reports indicate a 4-hour delay in supply chain nodes servicing the Bandung industrial cluster. Branch managers in the affected areas are advised to adjust local buffer stocks accordingly. Neural analysis suggests using the "Morning Classic" dynamic bundle to bridge the gap until secondary replenishment arrives.',
    time: '1 day ago',
    date: 'April 29, 2026',
    status: 'read',
    tags: ['Logistics', 'Alert']
  },
  {
    id: '5',
    title: 'Monthly Performance Review Available',
    preview: 'Your April Network Efficiency report is now ready for review in the AI Insights hub.',
    body: 'The monthly performance benchmarks for the reporting period of April 2026 have been finalized. Your network nodes achieved a combined efficiency rating of 94.2%. Detailed optimization vectors and efficiency leak analyses are now available in your personal AI Insights dashboard.',
    time: '3 days ago',
    date: 'April 27, 2026',
    status: 'read',
    tags: ['Report', 'AI']
  }
];

export default function BroadcastInboxPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMessage, setSelectedMessage] = useState<typeof MOCK_MESSAGES[0] | null>(null);
  const [messages, setMessages] = useState(MOCK_MESSAGES);

  const filteredMessages = messages.filter(m => 
    m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.preview.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenMessage = (msg: typeof MOCK_MESSAGES[0]) => {
    setSelectedMessage(msg);
    if (msg.status === 'unread') {
      setMessages(prev => prev.map(m => m.id === msg.id ? {...m, status: 'read' as const} : m));
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2">
        <div>
          <h2 className="text-3xl lg:text-4xl font-black text-gray-900 tracking-tighter uppercase leading-none">Broadcast Inbox</h2>
          <p className="text-gray-500 font-medium tracking-tight mt-2 italic">Central communication node for all enterprise announcements.</p>
        </div>
        
        <div className="relative group flex-1 md:max-w-sm">
           <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
           <Input 
             placeholder="Search announcements..." 
             className="pl-12 h-14 rounded-2xl bg-white border-none shadow-sm focus:ring-4 focus:ring-indigo-100 transition-all font-bold"
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
           />
        </div>
      </div>

      <div className="space-y-4">
        {filteredMessages.length > 0 ? (
          filteredMessages.map((msg, index) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card 
                className={cn(
                  "rounded-[32px] border-none shadow-sm group hover:shadow-xl hover:shadow-indigo-600/5 transition-all cursor-pointer overflow-hidden",
                  msg.status === 'unread' ? "bg-white ring-2 ring-indigo-50" : "bg-white/80"
                )}
                onClick={() => handleOpenMessage(msg)}
              >
                <CardContent className="p-0">
                  <div className="flex items-stretch min-h-[110px]">
                     {/* Blue Indicator Line */}
                     <div className={cn(
                       "w-1.5 shrink-0 transition-opacity duration-500",
                       msg.status === 'unread' ? "bg-indigo-600" : "bg-transparent"
                     )} />
                     
                     <div className="flex-1 p-6 md:p-8 flex flex-col md:flex-row md:items-center gap-6">
                        <div className="flex items-center gap-4 shrink-0">
                           <div className={cn(
                             "w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110",
                             msg.status === 'unread' ? "bg-indigo-50 text-indigo-600" : "bg-gray-50 text-gray-400"
                           )}>
                              <Bell className="w-5 h-5" />
                           </div>
                        </div>

                        <div className="flex-1 min-w-0 space-y-1">
                           <div className="flex items-center gap-2">
                              {msg.status === 'unread' && (
                                <div className="w-2 h-2 rounded-full bg-indigo-600" />
                              )}
                              <h3 className={cn(
                                "text-lg font-black tracking-tight truncate group-hover:text-indigo-600 transition-colors",
                                msg.status === 'unread' ? "text-gray-900" : "text-gray-500"
                              )}>
                                {msg.title}
                              </h3>
                           </div>
                           <p className="text-gray-400 text-xs font-bold leading-relaxed truncate md:whitespace-normal line-clamp-1">
                              {msg.preview}
                           </p>
                        </div>

                        <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-2 shrink-0 md:pl-6 md:border-l border-gray-100">
                           <div className="flex items-center gap-1.5 text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-3 py-1.5 rounded-full">
                              <Clock className="w-3 h-3" />
                              {msg.time}
                           </div>
                           <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                        </div>
                     </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        ) : (
          <div className="py-24 flex flex-col items-center justify-center text-center space-y-4">
             <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
                <Inbox className="w-10 h-10" />
             </div>
             <div>
                <p className="text-gray-900 font-black tracking-tighter text-xl capitalize">Clear Frequencies</p>
                <p className="text-gray-400 font-medium text-sm">No announcements matching your search filters.</p>
             </div>
             <Button variant="ghost" onClick={() => setSearchQuery('')} className="text-indigo-600 font-bold uppercase text-[10px] tracking-widest">
                Reset Search
             </Button>
          </div>
        )}
      </div>

      {/* Message Detail Modal */}
      <Dialog open={!!selectedMessage} onOpenChange={(open) => !open && setSelectedMessage(null)}>
        <DialogContent className="rounded-[40px] sm:max-w-[650px] p-0 overflow-hidden border-none shadow-2xl">
           {selectedMessage && (
             <>
               <div className="bg-[#0F172A] p-10 text-white relative">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-600/20 blur-[100px] rounded-full -mr-20 -mt-20" />
                  <div className="flex justify-between items-start mb-8 relative z-10">
                     <div className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-100">Verified Broadcast</span>
                     </div>
                     <div className="flex items-center gap-3">
                        <div className="text-right">
                           <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200/50">Origin Date</p>
                           <p className="text-sm font-black tracking-tight">{selectedMessage.date}</p>
                        </div>
                        <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center">
                           <Calendar className="w-4 h-4 text-white/40" />
                        </div>
                     </div>
                  </div>
                  <DialogTitle className="text-3xl font-black tracking-tighter leading-tight relative z-10">
                     {selectedMessage.title}
                  </DialogTitle>
                  <div className="flex flex-wrap gap-2 mt-6 relative z-10">
                     {selectedMessage.tags.map(tag => (
                        <span key={tag} className="px-3 py-1 bg-white/10 rounded-full text-[10px] font-bold tracking-widest text-white/50 uppercase border border-white/5">
                           #{tag}
                        </span>
                     ))}
                  </div>
               </div>
               
               <div className="p-10 bg-white max-h-[50vh] overflow-y-auto scrollbar-hide">
                  <div className="prose prose-indigo max-w-none">
                     <p className="text-gray-600 font-medium leading-relaxed whitespace-pre-wrap">
                        {selectedMessage.body}
                     </p>
                  </div>
               </div>

               <div className="p-8 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
                        <Sparkles className="w-5 h-5" />
                     </div>
                     <div className="flex flex-col">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Dispatcher</span>
                        <span className="text-xs font-bold text-gray-900 tracking-tight">System Authority 01</span>
                     </div>
                  </div>
                  <Button 
                    onClick={() => setSelectedMessage(null)}
                    className="bg-[#0F172A] hover:bg-black text-white h-12 px-8 rounded-2xl font-black uppercase tracking-widest text-[10px] border-none shadow-xl shadow-indigo-600/10 transition-all hover:scale-[1.02]"
                  >
                    Close Log
                  </Button>
               </div>
             </>
           )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
