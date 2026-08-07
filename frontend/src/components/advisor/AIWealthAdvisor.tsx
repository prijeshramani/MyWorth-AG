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
  Award,
  ArrowRight,
  Zap
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { PageShell } from '../layout/PageShell';

const FormattedMarkdown: React.FC<{ content: string }> = ({ content }) => {
  const lines = (content || '').split('\n');
  return (
    <div className="space-y-2 text-xs leading-relaxed text-[#F3F4F6]">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={i} className="h-1" />;

        if (trimmed.startsWith('### ')) {
          return <h3 key={i} className="text-sm font-bold text-[#F3F4F6] tracking-tight pt-1">{trimmed.replace(/^###\s+/, '')}</h3>;
        }
        if (trimmed.startsWith('#### ')) {
          return <h4 key={i} className="text-xs font-bold text-[#4F7FFF] pt-1 uppercase tracking-wider">{trimmed.replace(/^####\s+/, '')}</h4>;
        }
        if (trimmed.startsWith('> ')) {
          return (
            <div key={i} className="p-2.5 bg-[#15161A] border-l-2 border-[#4F7FFF] text-[11px] text-[#9CA3AF] rounded-r-xl italic">
              {trimmed.replace(/^>\s+/, '')}
            </div>
          );
        }
        if (trimmed.startsWith('- ')) {
          const parts = trimmed.replace(/^- /, '').split(/(\*\*.*?\*\*)/g);
          return (
            <div key={i} className="flex items-start gap-2 pl-2">
              <span className="text-[#4F7FFF] mt-1">•</span>
              <span className="text-[#9CA3AF]">
                {parts.map((p, idx) => p.startsWith('**') && p.endsWith('**') ? (
                  <strong key={idx} className="text-[#F3F4F6] font-semibold">{p.slice(2, -2)}</strong>
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
                return <strong key={idx} className="text-[#F3F4F6] font-bold">{p.slice(2, -2)}</strong>;
              }
              if (p.startsWith('*') && p.endsWith('*')) {
                return <em key={idx} className="text-[#9CA3AF] italic">{p.slice(1, -1)}</em>;
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
    <PageShell
      title="AI Wealth Advisor Core"
      subtitle="Permission-aware, evidence-backed multi-skill wealth orchestration engine."
      badge={<Badge variant="primary" icon={<Bot className="w-3.5 h-3.5" />}>Apple Intelligence Style</Badge>}
      actions={
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<Download className="w-3.5 h-3.5 text-[#4F7FFF]" />}
          onClick={handleExportConversation}
        >
          Export Session (.md)
        </Button>
      }
    >
      {/* Skill Bar */}
      <Card variant="glass" padding="sm" className="flex items-center gap-2 overflow-x-auto scrollbar-none">
        <span className="text-xs font-bold text-[#9CA3AF] flex items-center gap-1.5 flex-shrink-0 mr-1">
          <BrainCircuit className="w-4 h-4 text-[#4F7FFF]" />
          Skills ({skills.length}):
        </span>
        {skills.map(s => (
          <button
            key={s.id}
            onClick={() => {
              setSelectedSkillFilter(selectedSkillFilter === s.id ? null : s.id);
              handleSendQuery(`Tell me about my ${s.name} status`);
            }}
            className={`px-3 py-1 text-xs font-semibold rounded-full border transition-all flex items-center gap-1 flex-shrink-0 ${
              selectedSkillFilter === s.id
                ? 'bg-[#4F7FFF] text-white border-[#4F7FFF] shadow-md shadow-[#4F7FFF]/20'
                : 'bg-[#15161A] text-[#9CA3AF] border-[#2B2E35] hover:text-[#F3F4F6] hover:bg-[#1E2025]'
            }`}
          >
            <Sparkles className="w-3 h-3 text-[#4F7FFF]" />
            {s.name}
          </button>
        ))}
      </Card>

      {actionSuccessMsg && (
        <div className="p-4 bg-[#32D583]/15 border border-[#32D583]/30 rounded-2xl flex items-center gap-3 text-[#32D583] text-xs">
          <CheckCircle2 className="w-4 h-4 text-[#32D583] flex-shrink-0" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* Main Chat Conversation Container */}
      <Card variant="default" className="min-h-[500px] flex flex-col justify-between shadow-2xl">
        <div className="space-y-6 overflow-y-auto max-h-[580px] pr-2">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex gap-3.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'advisor' && (
                <div className="w-9 h-9 bg-[#4F7FFF]/20 border border-[#4F7FFF]/40 rounded-xl flex items-center justify-center flex-shrink-0 mt-1 shadow-md shadow-[#4F7FFF]/10">
                  <Bot className="w-5 h-5 text-[#4F7FFF]" />
                </div>
              )}

              <div className={`max-w-3xl space-y-3 ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                {/* User Message Bubble */}
                {msg.sender === 'user' ? (
                  <div className="bg-[#4F7FFF] text-white px-5 py-3.5 rounded-2xl rounded-tr-none text-xs font-medium shadow-lg shadow-[#4F7FFF]/20">
                    {msg.query}
                  </div>
                ) : (
                  /* Advisor Response Card */
                  <div className="bg-[#15161A] border border-[#2B2E35] p-5 rounded-2xl rounded-tl-none text-xs space-y-4 shadow-xl">
                    {/* Matched Skills Header */}
                    {msg.matchedSkills && msg.matchedSkills.length > 0 && (
                      <div className="flex flex-wrap items-center gap-2 pb-3 border-b border-[#2B2E35]">
                        {msg.isMultiSkill && (
                          <Badge variant="warning" size="sm" icon={<Layers className="w-3 h-3" />}>
                            Multi-Skill Orchestrated
                          </Badge>
                        )}
                        {msg.matchedSkills.map(s => (
                          <Badge key={s.id} variant="primary" size="sm" icon={<Sparkles className="w-3 h-3" />}>
                            {s.name}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <FormattedMarkdown content={msg.markdown || ''} />

                    {/* Evidence Citations */}
                    {msg.evidenceItems && msg.evidenceItems.length > 0 && (
                      <div className="pt-3 border-t border-[#2B2E35] space-y-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">
                          Evidence & Data Sources ({msg.evidenceItems.length})
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {msg.evidenceItems.map(ev => (
                            <button
                              key={ev.id}
                              onClick={() => setShowEvidenceModal(ev)}
                              className="p-2.5 rounded-xl bg-[#1E2025] hover:bg-[#252830] border border-[#2B2E35] text-left transition flex items-center justify-between group"
                            >
                              <div>
                                <h5 className="font-semibold text-[#F3F4F6] text-xs group-hover:text-[#4F7FFF] transition">{ev.title}</h5>
                                <span className="text-[10px] text-[#9CA3AF]">{ev.sourceEngine} • {(ev.confidence * 100).toFixed(0)}% Conf</span>
                              </div>
                              <Info className="w-3.5 h-3.5 text-[#9CA3AF] group-hover:text-[#4F7FFF] transition" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action Items */}
                    {msg.actionItems && msg.actionItems.length > 0 && (
                      <div className="pt-3 border-t border-[#2B2E35] space-y-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#F79009]">
                          Suggested Actions ({msg.actionItems.length})
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {msg.actionItems.map(act => (
                            <Button
                              key={act.id}
                              variant={act.type === 'EXECUTE' ? 'primary' : 'secondary'}
                              size="sm"
                              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                              onClick={() => handleExecuteAction(act)}
                            >
                              {act.title}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Follow up Prompts */}
                    {msg.followUpSuggestions && msg.followUpSuggestions.length > 0 && (
                      <div className="pt-3 border-t border-[#2B2E35] space-y-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">
                          Suggested Next Queries
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {msg.followUpSuggestions.map((sug, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleSendQuery(sug)}
                              className="px-3 py-1.5 rounded-xl bg-[#1E2025] hover:bg-[#252830] text-[#4F7FFF] border border-[#4F7FFF]/30 text-xs font-medium transition text-left"
                            >
                              {sug}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-3 text-xs text-[#9CA3AF]">
              <div className="w-9 h-9 bg-[#4F7FFF]/20 border border-[#4F7FFF]/40 rounded-xl flex items-center justify-center animate-pulse">
                <Bot className="w-5 h-5 text-[#4F7FFF]" />
              </div>
              <span className="animate-pulse font-medium">Computing deterministic advice from rule engines...</span>
            </div>
          )}
          <div ref={chatBottomRef} />
        </div>

        {/* Floating Query Input */}
        <div className="pt-4 border-t border-[#2B2E35] mt-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendQuery();
            }}
            className="flex items-center gap-3 bg-[#15161A] border border-[#2B2E35] focus-within:border-[#4F7FFF] p-2 rounded-2xl transition-all shadow-inner"
          >
            <input
              type="text"
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              placeholder="Ask anything about tax, portfolio, estate, or financial goals..."
              className="flex-1 bg-transparent px-3 py-2 text-xs sm:text-sm text-[#F3F4F6] placeholder-[#6B7280] focus:outline-none"
            />
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={loading}
              disabled={!queryInput.trim() || loading}
              leftIcon={<Send className="w-3.5 h-3.5" />}
            >
              Ask Advisor
            </Button>
          </form>
        </div>
      </Card>
    </PageShell>
  );
};
