import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  ShieldCheck, 
  FileText, 
  ChevronRight, 
  RefreshCw, 
  BrainCircuit, 
  Layers, 
  CheckCircle2, 
  AlertTriangle, 
  Download, 
  Info, 
  HelpCircle,
  TrendingUp,
  PieChart,
  DollarSign,
  Shield,
  Target,
  Award
} from 'lucide-react';
const FormattedMarkdown: React.FC<{ content: string }> = ({ content }) => {
  const lines = (content || '').split('\n');
  return (
    <div className="space-y-2 text-xs leading-relaxed text-slate-200">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={i} className="h-1" />;

        if (trimmed.startsWith('### ')) {
          return <h3 key={i} className="text-sm font-bold text-white tracking-tight pt-1">{trimmed.replace(/^###\s+/, '')}</h3>;
        }
        if (trimmed.startsWith('#### ')) {
          return <h4 key={i} className="text-xs font-bold text-indigo-300 pt-1 uppercase tracking-wider">{trimmed.replace(/^####\s+/, '')}</h4>;
        }
        if (trimmed.startsWith('> ')) {
          return (
            <div key={i} className="p-2.5 bg-slate-950/80 border-l-2 border-indigo-500 text-[11px] text-slate-300 rounded-r-lg italic">
              {trimmed.replace(/^>\s+/, '')}
            </div>
          );
        }
        if (trimmed.startsWith('- ')) {
          const parts = trimmed.replace(/^- /, '').split(/(\*\*.*?\*\*)/g);
          return (
            <div key={i} className="flex items-start gap-2 pl-2">
              <span className="text-indigo-400 mt-1">•</span>
              <span className="text-slate-300">
                {parts.map((p, idx) => p.startsWith('**') && p.endsWith('**') ? (
                  <strong key={idx} className="text-white font-semibold">{p.slice(2, -2)}</strong>
                ) : p)}
              </span>
            </div>
          );
        }

        const parts = trimmed.split(/(\*\*.*?\*\*|\*.*?\*)/g);
        return (
          <p key={i}>
            {parts.map((p, idx) => {
              if (p.startsWith('**') && p.endsWith('**')) {
                return <strong key={idx} className="text-white font-bold">{p.slice(2, -2)}</strong>;
              }
              if (p.startsWith('*') && p.endsWith('*')) {
                return <em key={idx} className="text-slate-400 italic">{p.slice(1, -1)}</em>;
              }
              return p;
            })}
          </p>
        );
      })}
    </div>
  );
};

interface AISkill {
  id: string;
  name: string;
  category: string;
  description: string;
}

interface EvidenceItem {
  id: string;
  title: string;
  category: string;
  summary: string;
  confidence: number;
  freshness: string;
  sourceEngine: string;
  calculationVersion: string;
  ruleVersion: string;
  lastUpdated: string;
}

interface ActionItem {
  id: string;
  type: 'EXPLAIN' | 'RECOMMEND' | 'EXECUTE';
  title: string;
  description: string;
  requiresConfirmation: boolean;
  targetEndpoint?: string;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'advisor';
  query?: string;
  markdown?: string;
  timestamp: string;
  matchedSkills?: Array<{ id: string; name: string; category: string }>;
  isMultiSkill?: boolean;
  evidenceItems?: EvidenceItem[];
  followUpSuggestions?: string[];
  actionItems?: ActionItem[];
  safetyCheckPassed?: boolean;
}

export const AIWealthAdvisor: React.FC = () => {
  const [skills, setSkills] = useState<AISkill[]>([]);
  const [selectedSkillFilter, setSelectedSkillFilter] = useState<string | null>(null);
  const [queryInput, setQueryInput] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [showEvidenceModal, setShowEvidenceModal] = useState<EvidenceItem | null>(null);
  const [confirmActionModal, setConfirmActionModal] = useState<ActionItem | null>(null);
  const [executingAction, setExecutingAction] = useState<boolean>(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string>('');

  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchSkills();
    // Welcome message
    setMessages([
      {
        id: 'msg_welcome',
        sender: 'advisor',
        markdown: `### Welcome to AI Wealth Advisor Core\n\nI am your permission-aware, evidence-backed wealth advisor. Every recommendation I provide is computed deterministically by platform calculation engines (**Finance Act 2024 Tax Engine, Projection Engine, Rule Engine, Knowledge Graph**) and verified against official evidence layers.\n\nAsk any query or select an active skill badge below to get started!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        followUpSuggestions: [
          'Give me a portfolio risk and asset allocation analysis',
          'What are my STCG and LTCG capital gains tax liabilities?',
          'Can I retire at 55 and reduce my tax liability?',
          'Show me active recommendations from the Rule Engine'
        ]
      }
    ]);
  }, []);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const fetchSkills = async () => {
    try {
      const res = await fetch('/api/v1/ai/advisor/skills');
      if (res.ok) {
        const data = await res.json();
        setSkills(data.skills || []);
      }
    } catch (err) {
      console.error('Failed to fetch AI skills:', err);
    }
  };

  const handleSendQuery = async (customQuery?: string) => {
    const textToSubmit = customQuery || queryInput;
    if (!textToSubmit.trim() || loading) return;

    const userMsgId = `user_${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      query: textToSubmit,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!customQuery) setQueryInput('');
    setLoading(true);
    setActionSuccessMsg('');

    try {
      const res = await fetch('/api/v1/ai/advisor/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: textToSubmit, familyId: 1 })
      });

      if (res.ok) {
        const data = await res.json();
        const advisorMsg: ChatMessage = {
          id: `adv_${Date.now()}`,
          sender: 'advisor',
          markdown: data.adviceMarkdown,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          matchedSkills: data.matchedSkills,
          isMultiSkill: data.isMultiSkill,
          evidenceItems: data.evidenceItems,
          followUpSuggestions: data.followUpSuggestions,
          actionItems: data.actionItems,
          safetyCheckPassed: data.safetyCheckPassed
        };
        setMessages(prev => [...prev, advisorMsg]);
      } else {
        const errJson = await res.json();
        setMessages(prev => [
          ...prev,
          {
            id: `err_${Date.now()}`,
            sender: 'advisor',
            markdown: `### ❌ Advisor Processing Error\n\n${errJson.error || 'Failed to process request.'}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          sender: 'advisor',
          markdown: `### ❌ Connection Error\n\n${err.message || 'Error connecting to local server.'}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteAction = async (action: ActionItem) => {
    if (action.requiresConfirmation && !confirmActionModal) {
      setConfirmActionModal(action);
      return;
    }

    setExecutingAction(true);
    try {
      if (action.targetEndpoint) {
        const res = await fetch(action.targetEndpoint, { method: 'POST' });
        if (res.ok) {
          setActionSuccessMsg(`Action "${action.title}" executed successfully!`);
        } else {
          const err = await res.json();
          alert(`Action execution error: ${err.error || 'Failed'}`);
        }
      } else {
        setActionSuccessMsg(`Action "${action.title}" acknowledged.`);
      }
    } catch (err: any) {
      alert(`Error executing action: ${err.message}`);
    } finally {
      setExecutingAction(false);
      setConfirmActionModal(null);
    }
  };

  const handleExportConversation = () => {
    let exportText = `# FamilyWealthOS – AI Wealth Advisor Conversation Export\n\nGenerated: ${new Date().toLocaleString()}\n\n---\n\n`;

    for (const msg of messages) {
      if (msg.sender === 'user') {
        exportText += `### 👤 User Query\n> ${msg.query}\n*Timestamp: ${msg.timestamp}*\n\n`;
      } else {
        exportText += `### 🤖 AI Wealth Advisor Response\n${msg.markdown}\n\n`;
        if (msg.matchedSkills && msg.matchedSkills.length > 0) {
          exportText += `*Skills Used*: ${msg.matchedSkills.map(s => s.name).join(', ')}\n\n`;
        }
        if (msg.evidenceItems && msg.evidenceItems.length > 0) {
          exportText += `*Evidence Items Cited*:\n`;
          for (const ev of msg.evidenceItems) {
            exportText += `- **${ev.title}** (${ev.sourceEngine}, Confidence: ${(ev.confidence * 100).toFixed(0)}%)\n`;
          }
          exportText += `\n`;
        }
        exportText += `---\n\n`;
      }
    }

    const blob = new Blob([exportText], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AI_Wealth_Advisor_Session_${new Date().toISOString().split('T')[0]}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Header Banner */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 backdrop-blur-xl relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-56 h-56 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white tracking-tight">AI Wealth Advisor Core</h1>
                <span className="px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold rounded-md">
                  v1.8.0 Orchestration Engine
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Evidence-Backed • Zero-Calculation Guardrails • Permission-Aware Multi-Skill Intelligence
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleExportConversation}
              className="px-3.5 py-2 bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 flex items-center gap-1.5 transition-all"
              title="Export conversation history to Markdown"
            >
              <Download className="w-3.5 h-3.5 text-indigo-400" />
              Export Session (.md)
            </button>
          </div>
        </div>

        {/* Skill Badges Bar */}
        <div className="mt-5 pt-4 border-t border-slate-800/60 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1 flex-shrink-0 mr-1">
            <BrainCircuit className="w-3.5 h-3.5 text-indigo-400" />
            Skill Registry ({skills.length}):
          </span>
          {skills.map(s => (
            <button
              key={s.id}
              onClick={() => {
                setSelectedSkillFilter(selectedSkillFilter === s.id ? null : s.id);
                handleSendQuery(`Tell me about my ${s.name} status`);
              }}
              className={`px-3 py-1 text-[11px] font-semibold rounded-full border transition-all flex items-center gap-1 flex-shrink-0 ${
                selectedSkillFilter === s.id
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/20'
                  : 'bg-slate-800/40 text-slate-300 border-slate-700/60 hover:bg-slate-800 hover:border-slate-600'
              }`}
            >
              <Sparkles className="w-3 h-3 text-indigo-400" />
              {s.name}
            </button>
          ))}
        </div>
      </div>

      {actionSuccessMsg && (
        <div className="p-4 bg-emerald-950/20 border border-emerald-800/40 rounded-2xl flex items-center gap-3 text-emerald-300 text-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* Main Chat Conversation Container */}
      <div className="bg-slate-950/40 border border-slate-900 rounded-3xl p-6 min-h-[480px] flex flex-col justify-between shadow-2xl backdrop-blur-xl">
        <div className="space-y-6 overflow-y-auto max-h-[580px] pr-2">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex gap-3.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'advisor' && (
                <div className="w-9 h-9 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 mt-1 shadow-md shadow-indigo-600/20">
                  <Bot className="w-5 h-5 text-white" />
                </div>
              )}

              <div className={`max-w-3xl space-y-3 ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                {/* User Message Bubble */}
                {msg.sender === 'user' ? (
                  <div className="bg-indigo-600 text-white px-5 py-3.5 rounded-2xl rounded-tr-none text-xs font-medium shadow-md shadow-indigo-600/20">
                    {msg.query}
                  </div>
                ) : (
                  /* Advisor Response Card */
                  <div className="bg-slate-900/80 border border-slate-800/80 p-5 rounded-2xl rounded-tl-none text-xs space-y-4 shadow-xl">
                    {/* Matched Skills Header */}
                    {msg.matchedSkills && msg.matchedSkills.length > 0 && (
                      <div className="flex flex-wrap items-center gap-2 pb-3 border-b border-slate-800/60">
                        {msg.isMultiSkill && (
                          <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-bold rounded-md flex items-center gap-1">
                            <Layers className="w-3 h-3 text-purple-400" />
                            Multi-Skill Orchestrated
                          </span>
                        )}
                        {msg.matchedSkills.map(s => (
                          <span key={s.id} className="px-2.5 py-0.5 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[10px] font-bold rounded-md flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-indigo-400" />
                            {s.name}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Advice Markdown Content */}
                    <div className="prose prose-invert max-w-none text-slate-200 text-xs leading-relaxed space-y-2">
                      <FormattedMarkdown content={msg.markdown || ''} />
                    </div>

                    {/* Cited Evidence Cards */}
                    {msg.evidenceItems && msg.evidenceItems.length > 0 && (
                      <div className="pt-3 border-t border-slate-800/60 space-y-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                          Verified Evidence Cards ({msg.evidenceItems.length}):
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {msg.evidenceItems.map(ev => (
                            <div
                              key={ev.id}
                              onClick={() => setShowEvidenceModal(ev)}
                              className="p-3 bg-slate-950/60 border border-slate-800/80 hover:border-indigo-500/40 rounded-xl cursor-pointer transition-all space-y-1 group"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-300 group-hover:text-indigo-300 text-xs truncate">
                                  {ev.title}
                                </span>
                                <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 text-[9px] font-mono font-bold rounded">
                                  {(ev.confidence * 100).toFixed(0)}% Match
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-400 line-clamp-1">{ev.summary}</p>
                              <div className="flex items-center justify-between text-[9px] text-slate-500 font-mono pt-1">
                                <span>Engine: {ev.sourceEngine}</span>
                                <span className="text-indigo-400 group-hover:underline">View Metadata →</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action Execution Items */}
                    {msg.actionItems && msg.actionItems.length > 0 && (
                      <div className="pt-3 border-t border-slate-800/60 space-y-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Suggested Action Items:
                        </span>
                        <div className="space-y-2">
                          {msg.actionItems.map(act => (
                            <div key={act.id} className="p-3 bg-indigo-950/20 border border-indigo-900/40 rounded-xl flex items-center justify-between gap-3">
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded ${act.type === 'EXECUTE' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-indigo-500/20 text-indigo-300'}`}>
                                    {act.type}
                                  </span>
                                  <span className="font-bold text-slate-200">{act.title}</span>
                                </div>
                                <p className="text-[10px] text-slate-400">{act.description}</p>
                              </div>
                              <button
                                onClick={() => handleExecuteAction(act)}
                                disabled={executingAction}
                                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-[11px] flex-shrink-0 transition-all shadow-md shadow-indigo-600/20 disabled:opacity-50"
                              >
                                {act.requiresConfirmation ? 'Confirm & Trigger' : 'View Action'}
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Interactive Follow-Up Prompt Chips */}
                    {msg.followUpSuggestions && msg.followUpSuggestions.length > 0 && (
                      <div className="pt-3 border-t border-slate-800/60 space-y-2">
                        <span className="text-[10px] font-semibold text-slate-500 flex items-center gap-1">
                          <HelpCircle className="w-3 h-3 text-indigo-400" />
                          Recommended Follow-Up Actions:
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {msg.followUpSuggestions.map((sug, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleSendQuery(sug)}
                              className="px-3 py-1.5 bg-slate-950 border border-slate-800 hover:border-indigo-500/50 hover:bg-indigo-950/30 text-indigo-300 text-[11px] font-medium rounded-xl transition-all flex items-center gap-1.5 group"
                            >
                              <span>{sug}</span>
                              <ChevronRight className="w-3 h-3 text-slate-500 group-hover:text-indigo-400 transition-all" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                <div className="text-[10px] text-slate-500 font-mono px-1">
                  {msg.timestamp}
                </div>
              </div>

              {msg.sender === 'user' && (
                <div className="w-9 h-9 bg-slate-800 border border-slate-700 rounded-xl flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="font-bold text-xs text-indigo-300">YOU</span>
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3.5 items-start">
              <div className="w-9 h-9 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md shadow-indigo-600/20">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl rounded-tl-none text-xs text-slate-400 flex items-center gap-3">
                <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
                <span>Orchestrating AI Skills & Aggregating Context Evidence...</span>
              </div>
            </div>
          )}
          <div ref={chatBottomRef} />
        </div>

        {/* Input Query Bar */}
        <div className="mt-6 pt-4 border-t border-slate-800/80">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendQuery();
            }}
            className="flex gap-3"
          >
            <input
              type="text"
              placeholder="Ask anything about your portfolio, taxes, retirement, goals, estate, or recommendations..."
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              className="flex-1 bg-slate-900/90 text-slate-200 border border-slate-800 focus:border-indigo-500/60 rounded-2xl px-5 py-3.5 text-xs outline-none font-medium placeholder:text-slate-500 transition-all shadow-inner"
            />
            <button
              type="submit"
              disabled={loading || !queryInput.trim()}
              className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold text-xs shadow-lg shadow-indigo-600/20 disabled:opacity-50 flex items-center justify-center gap-2 transition-all flex-shrink-0"
            >
              <span>Ask Advisor</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>

      {/* Evidence Inspection Modal */}
      {showEvidenceModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h4 className="font-bold text-slate-200 text-sm">{showEvidenceModal.title}</h4>
              </div>
              <button
                onClick={() => setShowEvidenceModal(null)}
                className="text-slate-400 hover:text-white font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1">
                <span className="text-slate-400 font-semibold block">Summary</span>
                <p className="text-slate-200 font-medium">{showEvidenceModal.summary}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2.5 bg-slate-950/40 border border-slate-800/60 rounded-lg">
                  <span className="text-slate-500 block">Confidence Score</span>
                  <span className="font-bold text-emerald-400">{(showEvidenceModal.confidence * 100).toFixed(0)}%</span>
                </div>
                <div className="p-2.5 bg-slate-950/40 border border-slate-800/60 rounded-lg">
                  <span className="text-slate-500 block">Data Freshness</span>
                  <span className="font-bold text-indigo-300">{showEvidenceModal.freshness}</span>
                </div>
                <div className="p-2.5 bg-slate-950/40 border border-slate-800/60 rounded-lg">
                  <span className="text-slate-500 block">Source Engine</span>
                  <span className="font-bold text-slate-300">{showEvidenceModal.sourceEngine}</span>
                </div>
                <div className="p-2.5 bg-slate-950/40 border border-slate-800/60 rounded-lg">
                  <span className="text-slate-500 block">Calculation Version</span>
                  <span className="font-bold text-slate-300">{showEvidenceModal.calculationVersion}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowEvidenceModal(null)}
                className="px-5 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-500 transition-all"
              >
                Close Metadata
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for EXECUTE Actions */}
      {confirmActionModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-500/40 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-amber-400">
              <AlertTriangle className="w-6 h-6 flex-shrink-0" />
              <h4 className="font-bold text-slate-100 text-base">User Confirmation Required</h4>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              You are about to execute action: <strong className="text-white">{confirmActionModal.title}</strong>.
              <br /><br />
              {confirmActionModal.description}
            </p>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setConfirmActionModal(null)}
                className="flex-1 py-2.5 border border-slate-700 text-slate-400 hover:text-white rounded-xl text-xs font-bold transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => handleExecuteAction(confirmActionModal)}
                className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-amber-600/20 transition-all"
              >
                Confirm & Execute
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
