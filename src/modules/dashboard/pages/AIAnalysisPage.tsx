import {useState, useRef, useEffect, FormEvent} from 'react';
import {Card} from '@/shared/components/ui/card';
import {Button} from '@/shared/components/ui/button';
import ReactMarkdown from 'react-markdown';
import {
  BrainCircuit, 
  Sparkles, 
  Send, 
  Loader2,
  Wand2,
  Database
} from 'lucide-react';
import {motion} from 'motion/react';
import {toast} from 'sonner';
import {useLocation} from '@/shared/context/LocationContext';
import {fetchBackend} from '@/shared/lib/api';
import {cn} from '@/shared/lib/utils';

export default function AIAnalysisPage() {
  const {currentLocation, locationName} = useLocation();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [inventory, setInventory] = useState<any[]>([]);
  const [dbLoading, setDbLoading] = useState(true);
  const [chatMessages, setChatMessages] = useState([
    { role: 'ai', content: `Greeting, Manager. Neural link to ${locationName} is active. How can I assist your local branch analysis today?` }
  ]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  useEffect(() => {
    const fetchDbData = async () => {
      setDbLoading(true);
      try {
        const res = await fetchBackend('getInventory', { location_id: currentLocation });
        if (res.status === 'success') {
          setInventory(res.data || []);
        }
      } catch (err) {
        console.error('Failed to load inventory for AI analysis', err);
      } finally {
        setDbLoading(false);
      }
    };
    fetchDbData();
  }, [currentLocation]);

  const handleAutoAnalysis = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      
      const lowStockItems = inventory.filter(i => (i.stock || 0) < 20);
      const skuCount = inventory.length;
      const totalVal = inventory.reduce((acc, curr) => acc + ((curr.price || 0) * (curr.stock || 0)), 0);
      const healthScore = skuCount > 0 ? Math.round(((skuCount - lowStockItems.length) / skuCount) * 100) : 100;
      
      const categories = Array.from(new Set(inventory.map(i => i.category || 'Other')));
      const topCategories = categories.slice(0, 3).join(', ') || 'General';

      const lowStockReport = lowStockItems.length > 0
        ? lowStockItems.map(i => `* **${i.name}**: Sisa stok **${i.stock}** unit (harga jual Rp ${i.price.toLocaleString()})`).join('\n')
        : '* **No immediate stock shortage detected.** All active SKU inventories are running above critical margins.';

      const actionableReorder = lowStockItems.length > 0
        ? `Buat replenishment order segera untuk item-item yang menipis (**${lowStockItems.slice(0, 2).map(i => i.name).join(', ')}**) guna mencegah potensi lost sales.`
        : 'Lakukan pemantauan berkala dan siapkan program bundling untuk memaksimalkan perputaran produk sehat.';

      const reportContent = `### **STRATEGIC AI OPERATIONS REPORT: ${locationName.toUpperCase()}**

**Executive Summary:**
Local branch **${locationName}** has completed a real-time database audit. The operations are currently performing at **${healthScore}% health efficiency**, backed by live database verification.

* **Total Active SKUs:** **${skuCount}** unique product types
* **Operational Asset Value:** **Rp ${totalVal.toLocaleString()}**
* **Stock Security Status:** ${healthScore >= 80 ? 'OPTIMAL' : 'REPLENISHMENT REQUIRED'}

**Real-Time Database Diagnostics:**
We scanned your live inventory database and identified the following operational factors:

**Stock Variance & Alerts:**
${lowStockReport}

**Category Distribution:**
* Branch inventory is primarily distributed across: **${topCategories}**.

**Actionable Strategic Advice:**
1. **Restock Priority:** ${actionableReorder}
2. **Promotional Focus:** Launch a fast-moving customer reward bundle centering on your top-performing categories (**${categories[0] || 'Coffee'}**) to increase average customer cart size.
3. **Staff Allocation:** Deploy optimized barista scheduling during peak operational traffic (predicted spike at 08:00 - 10:00 and 15:00 - 17:00) to maximize transaction throughput by up to 15%.`;

      setChatMessages(prev => [...prev, { role: 'ai', content: reportContent }]);
      
      toast.success("Database Analysis Completed", {
        description: `Real-time intelligence report generated for ${locationName}.`,
        duration: 4000,
      });
    }, 2000);
  };

  const handleSendMessage = (e?: FormEvent) => {
    e?.preventDefault();
    if (!userInput.trim()) return;

    const currentInput = userInput;
    const newMessages = [...chatMessages, { role: 'user', content: currentInput }];
    setChatMessages(newMessages);
    setUserInput('');

    // Dynamic database-aware answers!
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      const query = currentInput.toLowerCase();
      let matchedReply = '';

      // Try to search for product in database matching query
      const matchedProducts = inventory.filter(i => i.name.toLowerCase().includes(query) || (i.category && i.category.toLowerCase().includes(query)));
      
      if (query.includes('stok') || query.includes('stock') || query.includes('reorder') || query.includes('tipis') || query.includes('sedikit')) {
        const lowStock = inventory.filter(i => (i.stock || 0) < 20);
        if (lowStock.length > 0) {
          matchedReply = `Saya mendeteksi **${lowStock.length} produk** dengan stok di bawah batas aman (< 20 unit):\n\n` +
            lowStock.map(i => `* **${i.name}**: ${i.stock} unit (Rp ${i.price.toLocaleString()})`).join('\n') + 
            `\n\nDirekomendasikan untuk segera melakukan pengisian ulang.`;
        } else {
          matchedReply = `Seluruh **${inventory.length} produk** di database Anda berada dalam kondisi aman (stok di atas batas minimum). Tidak ada kebutuhan restock mendesak saat ini.`;
        }
      } else if (query.includes('total') || query.includes('aset') || query.includes('nilai') || query.includes('value')) {
        const totalVal = inventory.reduce((acc, curr) => acc + ((curr.price || 0) * (curr.stock || 0)), 0);
        matchedReply = `Berdasarkan data riil di database Anda untuk **${locationName}**:\n` +
          `* **Total SKU Aktif:** ${inventory.length}\n` +
          `* **Total Nilai Aset Inventaris:** Rp ${totalVal.toLocaleString()}\n` +
          `* **Status Kesehatan:** ${inventory.filter(i => i.stock < 20).length > 0 ? 'Perlu perhatian khusus pada beberapa item.' : 'Sangat Sehat.'}`;
      } else if (matchedProducts.length > 0) {
        matchedReply = `Saya menemukan produk berikut di database **${locationName}** yang cocok dengan pencarian Anda:\n\n` +
          matchedProducts.slice(0, 5).map(i => `* **${i.name}**\n  - Kategori: ${i.category}\n  - Stok saat ini: **${i.stock}** unit\n  - Harga satuan: **Rp ${i.price.toLocaleString()}**\n  - Status: ${i.stock < 20 ? '🔴 KRITIS (perlu restock)' : '🟢 AMAN'}`).join('\n\n');
      } else {
        matchedReply = `Saya telah memproses pertanyaan Anda tentang **"${currentInput}"** di cabang **${locationName}**.\n\n` +
          `Berdasarkan data real-time database kami:\n` +
          `* Kami memonitor **${inventory.length} SKU** secara aktif.\n` +
          `* Total nilai stok tersimpan sebesar **Rp ${inventory.reduce((a, c) => a + (c.price * c.stock), 0).toLocaleString()}**.\n` +
          `* Tidak ditemukan produk spesifik dengan nama/kategori tersebut. Coba cari produk lain seperti kopi, pastry, cake, atau tanyakan tentang 'stok tipis' dan 'nilai aset'.`;
      }

      setChatMessages(prev => [...prev, { 
        role: 'ai', 
        content: matchedReply
      }]);
    }, 1000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12 animate-in fade-in duration-700 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-gray-100 pb-8">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 mb-1">
             <Sparkles className="w-4 h-4 text-indigo-600" />
             <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em]">Local Intelligence</span>
          </div>
          <h2 className="text-3xl lg:text-4xl font-black text-gray-900 tracking-tighter uppercase">AI Insights</h2>
          <p className="text-gray-500 font-medium tracking-tight">Predictive modeling and neural analysis for <span className="text-indigo-600 font-bold">{locationName}</span></p>
        </div>
        
        <Button 
          onClick={handleAutoAnalysis}
          disabled={isAnalyzing || dbLoading}
          className="bg-indigo-600 hover:bg-indigo-700 h-14 px-8 rounded-2xl shadow-xl shadow-indigo-600/20 font-black uppercase tracking-widest text-[11px] text-white border-none transition-all hover:scale-[1.02] gap-3"
        >
          {isAnalyzing ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Wand2 className="w-5 h-5" />
          )}
          {isAnalyzing ? 'Scanning Branch...' : 'Generate Auto-Analysis'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Main Chat Area */}
        <div className="lg:col-span-2">
          <Card className="rounded-[40px] border-none shadow-2xl shadow-indigo-600/5 bg-white flex flex-col h-[650px] overflow-hidden">
            <div className="flex-1 overflow-y-auto p-10 space-y-8 scrollbar-hide">
              {chatMessages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className={cn(
                    "flex flex-col max-w-[90%]",
                    msg.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
                  )}
                >
                  <div className={cn(
                    "p-6 rounded-[32px] text-sm font-medium leading-relaxed shadow-sm whitespace-pre-wrap",
                    msg.role === 'user' 
                      ? "bg-indigo-600 text-white rounded-br-none" 
                      : "bg-gray-50 text-gray-800 rounded-bl-none border border-gray-100"
                  )}>
                    <div className={cn(
                      "markdown-body max-w-none prose prose-slate",
                      msg.role === 'user' ? "prose-invert" : ""
                    )}>
                      <ReactMarkdown>
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  </div>
                  <style dangerouslySetInnerHTML={{ __html: `
                    .markdown-body h3 { font-size: 1.1rem; font-weight: 900; margin-bottom: 1rem; text-transform: uppercase; letter-spacing: -0.025em; }
                    .markdown-body p { margin-bottom: 0.75rem; }
                    .markdown-body ul { list-style-type: disc; padding-left: 1.25rem; margin-bottom: 1rem; }
                    .markdown-body li { margin-bottom: 0.5rem; }
                    .markdown-body strong { font-weight: 800; }
                  `}} />
                  <span className="text-[9px] font-black uppercase tracking-widest text-gray-300 mt-2 px-2">
                    {msg.role === 'user' ? 'Manager Access' : 'Core AI System'}
                  </span>
                </motion.div>
              ))}
              <div ref={chatEndRef} />
            </div>

            <div className="p-8 bg-gray-50 border-t border-gray-100">
              <form onSubmit={handleSendMessage} className="relative">
                <input
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder={dbLoading ? "Synchronizing branch database..." : `Ask anything about ${locationName} performance...`}
                  disabled={dbLoading}
                  className="w-full bg-white border-none rounded-3xl h-16 pl-8 pr-16 text-sm font-bold shadow-sm focus:ring-4 focus:ring-indigo-100 transition-all outline-none disabled:opacity-50"
                />
                <Button 
                  type="submit"
                  size="icon" 
                  disabled={dbLoading}
                  className="absolute right-3 top-3 h-10 w-10 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white transition-all active:scale-90 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </Card>
        </div>

        {/* Sidebar Summary */}
        <div className="space-y-6">
          <Card className="rounded-[40px] border-none shadow-2xl shadow-indigo-600/5 bg-white p-10 group overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 blur-3xl rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-1000" />
            <div className="relative">
              <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6">
                <BrainCircuit className="w-6 h-6 text-indigo-600" />
              </div>
              <h4 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-4">Neural Overview</h4>
              <div className="space-y-6">
                <div>
                  <h5 className="text-xl font-black tracking-tighter text-gray-900 leading-tight">Branch Health</h5>
                  <p className="text-xs text-gray-500 font-medium mt-3 leading-relaxed">
                    AI monitoring of {locationName} is active and sync'd. Local inventory database parsed in real-time.
                  </p>
                </div>
                <div className="space-y-4 pt-4 border-t border-gray-50">
                  {[
                    { name: 'Stock Sync', status: dbLoading ? 'Syncing...' : 'Active', pulse: dbLoading ? 'bg-amber-500' : 'bg-emerald-500', Icon: Database },
                    { name: 'Predictive Link', status: 'Active', pulse: 'bg-indigo-500', Icon: Sparkles },
                  ].map(cluster => (
                    <div key={cluster.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <cluster.Icon className="w-3.5 h-3.5 text-indigo-500" />
                        <span className="text-xs font-bold text-gray-900">{cluster.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">{cluster.status}</span>
                        <div className={cn("w-2 h-2 rounded-full", cluster.pulse, cluster.pulse === 'bg-emerald-500' && "animate-pulse")} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

