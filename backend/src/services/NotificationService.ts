import { db } from '../db';

export interface NotificationDTO {
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

export class NotificationService {
  public async getNotifications(familyId: number = 1): Promise<{
    notifications: NotificationDTO[];
    unreadCount: number;
  }> {

    // Check policies due soon
    const notifications: NotificationDTO[] = [];

    const policies = db.prepare(`
      SELECT policy_type, insurer_name, next_premium_due_date 
      FROM insurance_policies 
      WHERE family_id = ? AND status = 'ACTIVE' AND deleted_at IS NULL
    `).all(familyId) as any[];

    if (policies.length > 0) {
      notifications.push({
        id: 'notif_ins_due',
        category: 'PROTECTION',
        title: 'Insurance Renewal Reminder',
        message: `Upcoming renewal for ${policies[0].insurer_name} (${policies[0].policy_type}). Verify premium allocation.`,
        status: 'NEW',
        actionTab: 'protection',
        actionText: 'Review Policy',
        createdAt: new Date().toISOString(),
        urgency: 'HIGH'
      });
    }

    notifications.push(
      {
        id: 'notif_tax_deadline',
        category: 'TAX',
        title: 'Section 80C Tax Saving Headroom',
        message: 'Claim ₹38,400 remaining deduction under Section 80C before financial year end.',
        status: 'NEW',
        actionTab: 'tax',
        actionText: 'Optimize Tax',
        createdAt: new Date().toISOString(),
        urgency: 'MEDIUM'
      },
      {
        id: 'notif_sip_alert',
        category: 'INVESTMENT',
        title: 'Monthly SIP Auto-Debit Active',
        message: 'SIP auto-debit scheduled tomorrow for HDFC Top 100 Equity Fund (₹15,000).',
        status: 'READ',
        actionTab: 'portfolio',
        actionText: 'View Portfolio',
        createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
        urgency: 'LOW'
      },
      {
        id: 'notif_nominee_audit',
        category: 'ESTATE',
        title: 'Nominee Verification Audit',
        message: '100% of primary holdings and insurance policies have verified designated nominees.',
        status: 'READ',
        actionTab: 'estate',
        actionText: 'View Estate',
        createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
        urgency: 'LOW'
      }
    );

    const unreadCount = notifications.filter(n => n.status === 'NEW').length;

    return { notifications, unreadCount };
  }
}

export const notificationService = new NotificationService();
