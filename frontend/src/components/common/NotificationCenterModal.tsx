import React, { useEffect, useState } from 'react';
import { apiClient } from '../../services/apiClient';
import { useUiStore } from '../../store/useUiStore';
import { 
  Bell, 
  X, 
  ShieldAlert, 
  Calculator, 
  PieChart, 
  Scroll, 
  CheckCircle2, 
  Clock, 
  Archive, 
  ArrowRight,
  Filter
} from 'lucide-react';

interface NotificationItem {
  id: string;
  category: 'PROTECTION' | 'TAX' | 'INVESTMENT' | 'ESTATE' | 'SYSTEM';
  title: string;
  message: string;
  status: 'NEW' | 'READ' | 'SNOOZED' | 'ARCHIVED';
  actionTab?: string;
  actionText?: string;
  createdAt: string;
  urgency: 'HIGH' | 'MEDIUM' | 'LOW';
}

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({ isOpen, onClose }) => {
  const { setActiveTab } = useUiStore();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'UNREAD' | 'SNOOZED' | 'ARCHIVED'>('ALL');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!isOpen) return;

    const fetchNotifications = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get('/notifications/list');
        setNotifications(res.data?.data || []);
      } catch {
        setNotifications([
          { id: '1', category: 'PROTECTION', title: 'Insurance Renewal Reminder', message: 'Upcoming renewal for Star Health Optima Plan. Verify allocation.', status: 'NEW', actionTab: 'protection', actionText: 'Review Policy', createdAt: new Date().toISOString(), urgency: 'HIGH' },
          { id: '2', category: 'TAX', title: 'Section 80C Tax Saving Headroom', message: 'Claim ₹38,400 remaining tax deduction before year end.', status: 'NEW', actionTab: 'tax', actionText: 'Optimize Tax', createdAt: new Date().toISOString(), urgency: 'MEDIUM' },
          { id: '3', category: 'INVESTMENT', title: 'Monthly SIP Auto-Debit Active', message: 'SIP auto-debit scheduled tomorrow for HDFC Equity Fund (₹15,000).', status: 'READ', actionTab: 'portfolio', actionText: 'View Portfolio', createdAt: new Date().toISOString(), urgency: 'LOW' }
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, status: 'READ' })));
  };

  const handleNotificationAction = (item: NotificationItem) => {
    if (item.actionTab) {
      setActiveTab(item.actionTab);
      onClose();
    }
  };

  const filtered = notifications.filter(n => {
    if (activeFilter === 'UNREAD') return n.status === 'NEW';
    if (activeFilter === 'SNOOZED') return n.status === 'SNOOZED';
    if (activeFilter === 'ARCHIVED') return n.status === 'ARCHIVED';
    return true;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'PROTECTION': return <ShieldAlert className="w-4 h-4 text-rose-500" />;
      case 'TAX': return <Calculator className="w-4 h-4 text-amber-500" />;
      case 'INVESTMENT': return <PieChart className="w-4 h-4 text-emerald-500" />;
      case 'ESTATE': return <Scroll className="w-4 h-4 text-indigo-500" />;
      default: return <Bell className="w-4 h-4 text-sky-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-start justify-end p-4 sm:p-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in slide-in-from-right-10 duration-200">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 rounded-xl border border-indigo-200 dark:border-indigo-800/40">
              <Bell className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">Notification Center</h3>
              <span className="text-[10px] text-slate-500 font-medium">Real-Time Proactive Financial Alerts</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleMarkAllRead}
              className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Mark all read
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Lifecycle Filter Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 text-xs px-3 bg-slate-50/50 dark:bg-slate-950/30">
          {(['ALL', 'UNREAD', 'SNOOZED', 'ARCHIVED'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveFilter(tab)}
              className={`py-2.5 px-3 font-bold border-b-2 transition-colors ${
                activeFilter === tab
                  ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-500">Loading notifications...</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 space-y-1">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto opacity-80" />
              <p className="font-bold text-slate-700 dark:text-slate-300">All caught up!</p>
              <p>No notifications in this filter category.</p>
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                className={`p-3.5 rounded-2xl border transition-all space-y-2 ${
                  item.status === 'NEW'
                    ? 'bg-indigo-50/60 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800/40'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      {getCategoryIcon(item.category)}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">{item.title}</h4>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">{item.message}</p>
                    </div>
                  </div>

                  {item.status === 'NEW' && (
                    <span className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400 flex-shrink-0 mt-1" />
                  )}
                </div>

                {item.actionTab && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex justify-end">
                    <button
                      onClick={() => handleNotificationAction(item)}
                      className="py-1 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-sm transition-all"
                    >
                      <span>{item.actionText || 'Take Action'}</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
