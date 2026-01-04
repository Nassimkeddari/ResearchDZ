
import React, { useState, useEffect, useRef } from 'react';
import { Message, QuickAction, ResearchMode, IMRADSection, ExportSelection } from './types';
import { sendMessageToGemini, resetChat } from './services/geminiService';
import MessageBubble from './components/MessageBubble';
import ExportModal from './components/ExportModal';
import { exportToWord } from './services/exportService';
import { 
  BeakerIcon, 
  BookOpenIcon, 
  ExclamationTriangleIcon, 
  PaperAirplaneIcon,
  ArrowPathIcon,
  SparklesIcon,
  MapIcon,
  ChartBarIcon,
  ShareIcon,
  CheckIcon,
  DocumentArrowDownIcon,
  CheckCircleIcon,
  AdjustmentsHorizontalIcon,
  StarIcon,
  TrophyIcon
} from '@heroicons/react/24/outline';

const SUGGESTED_ACTIONS: QuickAction[] = [
  {
    label: 'Methodology Analysis',
    mode: ResearchMode.Methodology,
    prompt: "Analyze the research methodologies used in these high-impact articles. Explain the study design, sampling frame, and data analysis techniques used in this field.",
    icon: <BeakerIcon className="w-4 h-4" />,
  },
  {
    label: 'Theoretical Frameworks',
    mode: ResearchMode.Framework,
    prompt: "What theoretical or conceptual frameworks are commonly employed in these studies? Map how they guide current research inquiries.",
    icon: <BookOpenIcon className="w-4 h-4" />,
  },
  {
    label: 'Visual Map',
    mode: ResearchMode.DesignMap,
    prompt: "Create a visual Mermaid.js diagram mapping the design framework or research flow for these studies. Show relationships between concepts and research phases. Use double quotes for all node labels.",
    icon: <MapIcon className="w-4 h-4" />,
  },
  {
    label: 'Bibliometric Table',
    mode: ResearchMode.Bibliometric,
    prompt: "Perform a bibliometric analysis for this research topic. Focus on Q1 and Q2 ranked journals. Present data in structured markdown tables showing publication trends and key keywords.",
    icon: <ChartBarIcon className="w-4 h-4" />,
  },
  {
    label: 'Research Gaps',
    mode: ResearchMode.Gaps,
    prompt: "Identify critical research gaps highlighted in these articles. What limitations are mentioned, and what future research directions are needed most?",
    icon: <ExclamationTriangleIcon className="w-4 h-4" />,
  },
];

type PrecisionLevel = 'broad' | 'high' | 'ultra';

const App: React.FC = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasResults, setHasResults] = useState(false);
  const [showShareToast, setShowShareToast] = useState(false);
  const [showExportToast, setShowExportToast] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [currentTopic, setCurrentTopic] = useState('');
  const [precision, setPrecision] = useState<PrecisionLevel>('high');
  const [focusedMessageId, setFocusedMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages([
      {
        id: '1',
        role: 'model',
        content: "**Welcome to ScholarSync.** \n\nI am your specialized academic research assistant. Enter your research topic or specific keywords, and I will retrieve top academic summaries (simulating Scopus/WoS), analyze methodologies, and map theoretical frameworks for you.",
        timestamp: new Date(),
      },
    ]);
    resetChat();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (textOverride?: string) => {
    const textToSend = textOverride || input;
    if (!textToSend.trim() || isLoading) return;

    const selectedMode = SUGGESTED_ACTIONS.find(a => a.prompt === textOverride)?.mode;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: textToSend,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const thinkingId = 'thinking-' + Date.now();
    setMessages((prev) => [
      ...prev,
      {
        id: thinkingId,
        role: 'model',
        content: '',
        timestamp: new Date(),
        isThinking: true,
      },
    ]);

    try {
      let prompt = textToSend;
      let modeToApply = selectedMode;

      if (!hasResults && !textOverride) {
         let filterInstruction = "Focus on sources indexed in Scopus or Web of Science.";
         if (precision === 'high') {
           filterInstruction += " Prioritize articles from Q1 or Q2 ranked journals with high impact factors (IF > 2.0).";
         } else if (precision === 'ultra') {
           filterInstruction += " Strictly only include articles from Q1 ranked journals or flagship publications with top-tier impact factors (IF > 5.0).";
         }

         prompt = `Act as a senior researcher. Retrieve and summarize the top 5 high-impact research articles about "${textToSend}". ${filterInstruction} For each, provide Title, Authors, Year, and a concise summary including Research Problem, Method, and Finding.`;
         modeToApply = ResearchMode.Retreive;
         setCurrentTopic(textToSend);
      }

      const response = await sendMessageToGemini(prompt);
      
      setMessages((prev) => {
        const filtered = prev.filter(m => m.id !== thinkingId);
        return [
          ...filtered,
          {
            id: (Date.now() + 1).toString(),
            role: 'model',
            content: response.text,
            sources: response.sources,
            timestamp: new Date(),
            mode: modeToApply
          }
        ];
      });
      setHasResults(true);

    } catch (error) {
      setMessages((prev) => {
        const filtered = prev.filter(m => m.id !== thinkingId);
        return [
          ...filtered,
          {
            id: (Date.now() + 1).toString(),
            role: 'model',
            content: "I encountered an error while accessing academic databases. Please check your connection and try again.",
            timestamp: new Date(),
          }
        ];
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickExport = (msg: Message) => {
    setFocusedMessageId(msg.id);
    setIsExportModalOpen(true);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleReset = () => {
    resetChat();
    setHasResults(false);
    setCurrentTopic('');
    setPrecision('high');
    setMessages([
        {
        id: Date.now().toString(),
        role: 'model',
        content: "Literature review session reset. What research topic shall we analyze next?",
        timestamp: new Date(),
      },
    ]);
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setShowShareToast(true);
      setTimeout(() => setShowShareToast(false), 3000);
    });
  };

  const handleExportSubmit = async (selected: ExportSelection[]) => {
    const abstractMsg = messages.find(m => m.mode === ResearchMode.Retreive);
    const abstract = abstractMsg?.content
      .split('\n')
      .filter(line => line.trim().length > 0)
      .slice(0, 3)
      .join(' ')
      .replace(/[#*`]/g, '') || "";

    try {
      await exportToWord(currentTopic || "Research Analysis", abstract, selected);
      setIsExportModalOpen(false);
      setFocusedMessageId(null);
      setShowExportToast(true);
      setTimeout(() => setShowExportToast(false), 4000);
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-900 overflow-hidden font-sans">
      
      {showExportToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[110] animate-fade-in">
          <div className="bg-emerald-600 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-emerald-500/20">
            <CheckCircleIcon className="w-5 h-5" />
            <span className="text-sm font-bold">Research document exported successfully!</span>
          </div>
        </div>
      )}

      <header className="flex-none h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 shadow-sm z-30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-indigo-200 shadow-lg">
            <SparklesIcon className="w-5 h-5" />
          </div>
          <h1 className="text-lg font-bold text-slate-800 tracking-tight">ScholarSync</h1>
        </div>
        
        <div className="flex items-center gap-2 md:gap-4">
          {hasResults && (
            <button 
              onClick={() => {
                setFocusedMessageId(null);
                setIsExportModalOpen(true);
              }}
              className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 transition-all px-3 py-1.5 rounded-full hover:bg-indigo-50 font-semibold text-sm border border-indigo-100"
            >
              <DocumentArrowDownIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Bulk Export</span>
            </button>
          )}

          <button 
            onClick={handleShare}
            className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-all px-3 py-1.5 rounded-full hover:bg-slate-100 font-medium text-sm border border-transparent hover:border-slate-200"
          >
            {showShareToast ? <CheckIcon className="w-4 h-4 text-green-500" /> : <ShareIcon className="w-4 h-4" />}
            <span className="hidden sm:inline">{showShareToast ? 'Copied' : 'Share'}</span>
          </button>

          <button 
            onClick={handleReset}
            className="text-slate-400 hover:text-rose-500 transition-colors p-2 rounded-full hover:bg-rose-50 border border-transparent"
          >
            <ArrowPathIcon className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-2">
        <div className="max-w-4xl mx-auto pb-48">
          {messages.map((msg) => (
            <MessageBubble 
              key={msg.id} 
              message={msg} 
              onQuickExport={msg.role === 'model' && !msg.isThinking ? handleQuickExport : undefined} 
            />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-slate-200 p-4 md:p-6 z-20">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="flex flex-col gap-3">
            {!hasResults && (
              <div className="flex items-center gap-3 bg-slate-100/50 p-1.5 rounded-xl border border-slate-200 self-start animate-fade-in">
                <div className="flex items-center gap-2 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-r border-slate-200 mr-1">
                  <AdjustmentsHorizontalIcon className="w-4 h-4" />
                  Precision
                </div>
                <div className="flex gap-1">
                  {[
                    { id: 'broad', label: 'Any Tier', icon: <AdjustmentsHorizontalIcon className="w-3 h-3" /> },
                    { id: 'high', label: 'Q1 / Q2', icon: <StarIcon className="w-3 h-3" /> },
                    { id: 'ultra', label: 'Q1 Only', icon: <TrophyIcon className="w-3 h-3" /> },
                  ].map((lvl) => (
                    <button
                      key={lvl.id}
                      onClick={() => setPrecision(lvl.id as PrecisionLevel)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all
                        ${precision === lvl.id 
                          ? 'bg-white text-indigo-600 shadow-sm border border-indigo-100' 
                          : 'text-slate-500 hover:bg-white/50 border border-transparent'}
                      `}
                    >
                      {lvl.icon}
                      {lvl.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {hasResults && !isLoading && (
              <div className="flex flex-wrap gap-2 animate-fade-in">
                {SUGGESTED_ACTIONS.map((action) => (
                  <button
                    key={action.label}
                    onClick={() => handleSendMessage(action.prompt)}
                    className="flex items-center gap-2 px-3 py-2 bg-white hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 transition-all shadow-sm"
                  >
                    <span className="text-indigo-500">{action.icon}</span>
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative flex items-end gap-2 bg-white border border-slate-300 rounded-2xl p-2 shadow-lg focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent transition-all">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={hasResults ? "Refine your analysis..." : "Enter research topic..."}
              className="w-full bg-transparent border-none focus:ring-0 resize-none text-slate-800 placeholder-slate-400 min-h-[48px] max-h-48 py-3 px-3 text-sm md:text-base"
              rows={1}
              disabled={isLoading}
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={!input.trim() || isLoading}
              className={`flex-none w-12 h-12 flex items-center justify-center rounded-xl transition-all
                ${(!input.trim() || isLoading) 
                  ? 'bg-slate-100 text-slate-300' 
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md transform active:scale-95'}
              `}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <PaperAirplaneIcon className="w-6 h-6" />
              )}
            </button>
          </div>
          
          <p className="text-[10px] text-center text-slate-400 font-medium italic">
            World-class academic synthesis powered by ScholarSync Engine.
          </p>
        </div>
      </div>

      <ExportModal 
        isOpen={isExportModalOpen} 
        onClose={() => {
          setIsExportModalOpen(false);
          setFocusedMessageId(null);
        }} 
        messages={messages}
        topic={currentTopic}
        onExport={handleExportSubmit}
        focusedId={focusedMessageId}
      />
    </div>
  );
};

export default App;
