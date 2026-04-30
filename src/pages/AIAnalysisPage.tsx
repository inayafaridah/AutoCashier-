import {useState, useRef, useEffect, FormEvent} from 'react';
import {Card} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import ReactMarkdown from 'react-markdown';
import {
  BrainCircuit, 
  Sparkles, 
  Send, 
  Loader2,
  Wand2
} from 'lucide-react';
import {motion} from 'motion/react';
import {toast} from 'sonner';
import {useLocation} from '@/context/LocationContext';
import {cn} from '@/lib/utils';

export default function AIAnalysisPage() {
  const {locationName} = useLocation();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [userInput, setUserInput] = useState('');
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

  const handleAutoAnalysis = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      
      const reportContent = `### **BRANCH STRATEGIC ANALYSIS: ${locationName.toUpperCase()}**

**Executive Summary:**
Local operations at **${locationName}** are performing at **88.4% efficiency**. Predictive models suggest a high-impact window for revenue optimization in the next 72 hours.

**Anomalies Detected:**
* **Stock Variance:** *Arabica Signature* stock levels are low relative to projected weekend demand.
* **Customer Pulse:** Spike in morning traffic detected (07:00 - 09:00), leading to suboptimal wait times.
* **Waste Vector:** Recent pastry disposal rates are 12% higher than the network average.

**Actionable Advice:**
1. **Restock Priority:** Immediately increase *Arabica Signature* inventory by 20 units.
2. **Shift Optimization:** Deploy an additional barista for the morning peak (07:00-09:00) to capture 15% more throughput.
3. **Dynamic Bundling:** Launch a "Morning Classic" promo to reduce pastry waste and boost basket size.`;

      setChatMessages(prev => [...prev, { role: 'ai', content: reportContent }]);
      
      toast.success("Branch Analysis Complete", {
        description: "Intelligent report injected into local neural link.",
        duration: 4000,
      });
    }, 2500);
  };

  const handleSendMessage = (e?: FormEvent) => {
    e?.preventDefault();
    if (!userInput.trim()) return;

    const currentInput = userInput;
    const newMessages = [...chatMessages, { role: 'user', content: currentInput }];
    setChatMessages(newMessages);
    setUserInput('');

    // Simulate AI Response
    setTimeout(() => {
      setChatMessages(prev => [...prev, { 
        role: 'ai', 
        content: `I've analyzed the local branch data regarding **${currentInput.toLowerCase()}**. 

Based on my analysis of ${locationName}:
* Current trends support a **12% increase** in potential capture.
* Competitor activity in the area suggests maintaining current pricing.
* Efficiency can be boosted by targeted staff reallocation.` 
      }]);
    }, 1000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12 animate-in fade-in duration-700">
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
          disabled={isAnalyzing}
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
                  placeholder={`Ask anything about ${locationName} performance...`}
                  className="w-full bg-white border-none rounded-3xl h-16 pl-8 pr-16 text-sm font-bold shadow-sm focus:ring-4 focus:ring-indigo-100 transition-all outline-none"
                />
                <Button 
                  type="submit"
                  size="icon" 
                  className="absolute right-3 top-3 h-10 w-10 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white transition-all active:scale-90"
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
                    AI monitoring of {locationName} is optimal. Network sync latency is within 14ms parameters.
                  </p>
                </div>
                <div className="space-y-4 pt-4 border-t border-gray-50">
                  {[
                    { name: 'Stock Sync', status: 'Active', pulse: 'bg-emerald-500' },
                    { name: 'Predictive Link', status: 'Active', pulse: 'bg-indigo-500' },
                  ].map(cluster => (
                    <div key={cluster.name} className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-900">{cluster.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">{cluster.status}</span>
                        <div className={cn("w-2 h-2 rounded-full animate-pulse", cluster.pulse)} />
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
