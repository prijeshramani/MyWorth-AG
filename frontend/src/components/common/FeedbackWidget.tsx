import React, { useState } from 'react';
import { dxService } from '../../services/dxService';
import { MessageSquarePlus, X, Send, Check } from 'lucide-react';

export const FeedbackWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [category, setCategory] = useState<'BUG' | 'FEATURE' | 'UX' | 'PERFORMANCE'>('BUG');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notes.trim()) return;

    try {
      await dxService.submitFeedback({
        route: window.location.pathname,
        category,
        priority,
        notes
      });
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setIsOpen(false);
        setNotes('');
      }, 1500);
    } catch {
      // Handled
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 p-3 bg-purple-600 hover:bg-purple-500 text-white rounded-full shadow-lg shadow-purple-900/40 border border-purple-400/30 flex items-center gap-2 text-xs font-bold transition-transform hover:scale-105"
      >
        <MessageSquarePlus className="w-4 h-4" />
        <span>Beta Feedback</span>
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card-glass w-full max-w-md p-6 space-y-4 font-sans text-xs">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <MessageSquarePlus className="w-5 h-5 text-purple-400" />
                <h3 className="font-bold text-slate-100 text-sm">Submit Beta Feedback</h3>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            {submitted ? (
              <div className="p-6 text-center space-y-2">
                <Check className="w-8 h-8 text-emerald-400 mx-auto" />
                <p className="font-bold text-slate-100">Thank you!</p>
                <p className="text-slate-400">Feedback saved to local beta log.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-slate-400 block mb-1">Category</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-slate-100 focus:outline-none"
                  >
                    <option value="BUG">Bug / Issue</option>
                    <option value="FEATURE">Feature Request</option>
                    <option value="UX">UI / UX Suggestion</option>
                    <option value="PERFORMANCE">Performance</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Priority</label>
                  <div className="flex gap-2">
                    {(['LOW', 'MEDIUM', 'HIGH'] as const).map(p => (
                      <button
                        type="button"
                        key={p}
                        onClick={() => setPriority(p)}
                        className={`flex-1 py-1.5 rounded font-semibold transition-colors ${
                          priority === p ? 'bg-purple-600 text-white' : 'bg-slate-900 text-slate-400 border border-slate-800'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Notes / Description</label>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Describe issue or suggestion..."
                    className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-slate-100 focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold rounded"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Submit Feedback
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
};
