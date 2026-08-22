import { db } from '../db';

export interface SearchResultItemDTO {
  id: string;
  category: 'Family' | 'Investment' | 'Protection' | 'Tax' | 'Document' | 'Account' | 'Goal' | 'Estate' | 'Report' | 'Graph';
  title: string;
  subtitle: string;
  tabTarget: string;
  relevanceScore: number;
}

export class SearchService {
  public async search(query: string, familyId: number): Promise<SearchResultItemDTO[]> {
    const q = (query || '').trim().toLowerCase();
    const results: SearchResultItemDTO[] = [];

    // 1. Search Assets / Investments & Accounts
    try {
      const assets = db.prepare(`
        SELECT a.id, a.name, a.type, a.category, a.identifier,
               COALESCE((SELECT price FROM asset_prices WHERE asset_id = a.id ORDER BY date DESC LIMIT 1), 0) as current_value,
               fm.name as member_name
        FROM assets a
        LEFT JOIN family_members fm ON a.family_member_id = fm.id
        WHERE (fm.family_id = ? OR a.family_member_id IS NULL)
      `).all(familyId) as any[];

      assets.forEach((a) => {
        const matchText = `${a.name} ${a.type} ${a.category || ''} ${a.identifier || ''} ${a.member_name || ''}`.toLowerCase();
        if (!q || matchText.includes(q)) {
          const isBankAccount = a.type === 'BANK_ACCOUNT' || a.category === 'CASH_BANK' || a.type === 'BANK';
          results.push({
            id: `asset_${a.id}`,
            category: isBankAccount ? 'Account' : 'Investment',
            title: a.name,
            subtitle: `${(a.type || '').replace(/_/g, ' ')} • Value: ₹${(Number(a.current_value) || 0).toLocaleString('en-IN')}${a.member_name ? ` • ${a.member_name}` : ''}`,
            tabTarget: isBankAccount ? 'accounts' : 'portfolio',
            relevanceScore: matchText.startsWith(q) ? 100 : 80
          });
        }
      });
    } catch (err) {
      console.warn('SearchService: assets query warning:', err);
    }

    // 2. Search Family Members
    try {
      const familyMembers = db.prepare(`
        SELECT id, name, relationship, pan, email, phone
        FROM family_members 
        WHERE family_id = ? AND deleted_at IS NULL
      `).all(familyId) as any[];

      familyMembers.forEach((fm) => {
        const matchText = `${fm.name} ${fm.relationship || ''} ${fm.pan || ''} ${fm.email || ''}`.toLowerCase();
        if (!q || matchText.includes(q)) {
          results.push({
            id: `member_${fm.id}`,
            category: 'Family',
            title: `${fm.name} (${fm.relationship || 'Member'})`,
            subtitle: `${fm.pan ? `PAN: ${fm.pan} • ` : ''}${fm.email || fm.relationship || 'Family Member'}`,
            tabTarget: 'family',
            relevanceScore: matchText.startsWith(q) ? 100 : 85
          });
        }
      });
    } catch (err) {
      console.warn('SearchService: familyMembers query warning:', err);
    }

    // 3. Search Insurance Policies
    try {
      const policies = db.prepare(`
        SELECT p.id, p.insurer_name, p.policy_type, p.policy_number, p.sum_assured, p.status, fm.name as holder_name
        FROM insurance_policies p
        LEFT JOIN family_members fm ON p.policy_holder_id = fm.id
        WHERE p.family_id = ? AND p.deleted_at IS NULL
      `).all(familyId) as any[];

      policies.forEach((p) => {
        const matchText = `${p.insurer_name} ${p.policy_type} ${p.policy_number} ${p.holder_name || ''}`.toLowerCase();
        if (!q || matchText.includes(q)) {
          results.push({
            id: `policy_${p.id}`,
            category: 'Protection',
            title: `${p.insurer_name} (${(p.policy_type || '').replace(/_/g, ' ')})`,
            subtitle: `Policy #${p.policy_number} • Sum Assured: ₹${(Number(p.sum_assured) || 0).toLocaleString('en-IN')}${p.holder_name ? ` • ${p.holder_name}` : ''}`,
            tabTarget: 'protection',
            relevanceScore: matchText.startsWith(q) ? 95 : 75
          });
        }
      });
    } catch (err) {
      console.warn('SearchService: insurance_policies query warning:', err);
    }

    // 4. Search Financial Goals
    try {
      const goals = db.prepare(`
        SELECT id, title, goal_type, target_amount, target_year, priority, status
        FROM financial_goals
        WHERE family_id = ?
      `).all(familyId) as any[];

      goals.forEach((g) => {
        const matchText = `${g.title} ${g.goal_type || ''}`.toLowerCase();
        if (!q || matchText.includes(q)) {
          results.push({
            id: `goal_${g.id}`,
            category: 'Goal',
            title: g.title,
            subtitle: `Target: ₹${(Number(g.target_amount) || 0).toLocaleString('en-IN')} by ${g.target_year || 'N/A'} • ${g.priority || 'Normal'} Priority`,
            tabTarget: 'planning',
            relevanceScore: matchText.startsWith(q) ? 90 : 70
          });
        }
      });
    } catch (err) {
      console.warn('SearchService: financial_goals query warning:', err);
    }

    // 5. Default Navigation Shortcuts if query is empty or broad
    if (!q || results.length === 0) {
      results.push(
        { id: 'sec_tax', category: 'Tax', title: 'Tax Intelligence & 80C Deduction Optimizer', subtitle: 'FY Tax Breakdown & Capital Gains Summary', tabTarget: 'tax', relevanceScore: 50 },
        { id: 'sec_est', category: 'Estate', title: 'Estate & Succession Planning Digest', subtitle: 'Testator Inventory, Will Clauses & Executor Registry', tabTarget: 'estate', relevanceScore: 45 },
        { id: 'sec_rep', category: 'Report', title: 'Reports Generator & PDF Exporter', subtitle: 'Executive Statements, Net Worth Audit & Tax Reports', tabTarget: 'reports', relevanceScore: 40 },
        { id: 'sec_graph', category: 'Graph', title: 'Knowledge Graph Explorer', subtitle: 'Family Wealth Node Network & Relationship Matrix', tabTarget: 'graph', relevanceScore: 35 }
      );
    }

    // Sort by relevance score descending
    return results.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }
}

export const searchService = new SearchService();
