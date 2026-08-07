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
  public async search(query: string, familyId: number = 1): Promise<SearchResultItemDTO[]> {
    const q = (query || '').trim().toLowerCase();
    const results: SearchResultItemDTO[] = [];

    // 1. Search Assets / Investments
    const assets = db.prepare(`
      SELECT id, name, type, current_value, symbol
      FROM assets 
      WHERE family_id = ? AND deleted_at IS NULL
    `).all(familyId) as any[];

    assets.forEach((a) => {
      const matchText = `${a.name} ${a.type} ${a.symbol || ''}`.toLowerCase();
      if (!q || matchText.includes(q)) {
        results.push({
          id: `asset_${a.id}`,
          category: 'Investment',
          title: a.name,
          subtitle: `${a.type} • Market Value: ₹${(a.current_value || 0).toLocaleString('en-IN')}`,
          tabTarget: 'portfolio',
          relevanceScore: matchText.startsWith(q) ? 100 : 80
        });
      }
    });

    // 2. Search Family Members
    const familyMembers = db.prepare(`
      SELECT id, name, relationship, pan_number, status
      FROM family_members 
      WHERE family_id = ? AND deleted_at IS NULL
    `).all(familyId) as any[];

    familyMembers.forEach((fm) => {
      const matchText = `${fm.name} ${fm.relationship} ${fm.pan_number || ''}`.toLowerCase();
      if (!q || matchText.includes(q)) {
        results.push({
          id: `member_${fm.id}`,
          category: 'Family',
          title: `${fm.name} (${fm.relationship || 'Member'})`,
          subtitle: `PAN: ${fm.pan_number || 'N/A'} • Status: ${fm.status || 'Active'}`,
          tabTarget: 'family',
          relevanceScore: matchText.startsWith(q) ? 100 : 85
        });
      }
    });

    // 3. Search Insurance Policies
    const policies = db.prepare(`
      SELECT policy_id, insurer_name, policy_type, policy_number, sum_assured, status
      FROM insurance_policies 
      WHERE family_id = ? AND deleted_at IS NULL
    `).all(familyId) as any[];

    policies.forEach((p) => {
      const matchText = `${p.insurer_name} ${p.policy_type} ${p.policy_number}`.toLowerCase();
      if (!q || matchText.includes(q)) {
        results.push({
          id: `policy_${p.policy_id}`,
          category: 'Protection',
          title: `${p.insurer_name} (${p.policy_type})`,
          subtitle: `Policy #${p.policy_number} • Sum Assured: ₹${(p.sum_assured || 0).toLocaleString('en-IN')}`,
          tabTarget: 'protection',
          relevanceScore: matchText.startsWith(q) ? 95 : 75
        });
      }
    });

    // 4. Search Bank & Demat Accounts
    const accounts = db.prepare(`
      SELECT id, account_name, account_type, account_number_masked, balance
      FROM accounts 
      WHERE family_id = ? AND deleted_at IS NULL
    `).all(familyId) as any[];

    accounts.forEach((acc) => {
      const matchText = `${acc.account_name} ${acc.account_type} ${acc.account_number_masked}`.toLowerCase();
      if (!q || matchText.includes(q)) {
        results.push({
          id: `acc_${acc.id}`,
          category: 'Account',
          title: acc.account_name,
          subtitle: `${acc.account_type} • A/c: ${acc.account_number_masked} • Balance: ₹${(acc.balance || 0).toLocaleString('en-IN')}`,
          tabTarget: 'accounts',
          relevanceScore: matchText.startsWith(q) ? 90 : 70
        });
      }
    });

    // 5. Default Navigation Shortcuts if query is empty or broad
    if (results.length === 0 || !q) {
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
