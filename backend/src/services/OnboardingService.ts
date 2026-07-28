import Database from 'better-sqlite3';

export interface OnboardingStatusDTO {
  isCompleted: boolean;
  hasUser: boolean;
  hasFamily: boolean;
  hasBackup: boolean;
  familyName?: string;
  currency: string;
  financialYear: string;
}

export interface BetaFeedbackDTO {
  id: number;
  route: string;
  category: 'BUG' | 'FEATURE' | 'UX' | 'PERFORMANCE';
  notes: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  createdAt: string;
}

export class OnboardingService {
  constructor(private db: Database.Database) {}

  public getStatus(): OnboardingStatusDTO {
    const famCount = this.db.prepare('SELECT COUNT(*) as count FROM families WHERE deleted_at IS NULL').get() as { count: number };

    if (!famCount || famCount.count === 0) {
      return {
        isCompleted: false,
        hasUser: false,
        hasFamily: false,
        hasBackup: true,
        currency: 'INR',
        financialYear: '2025-26'
      };
    }

    const family = this.db.prepare('SELECT * FROM families WHERE deleted_at IS NULL ORDER BY id ASC').get() as any;

    return {
      isCompleted: true,
      hasUser: true,
      hasFamily: true,
      hasBackup: true,
      familyName: family?.name || 'Primary Family',
      currency: 'INR',
      financialYear: '2025-26'
    };
  }

  public completeOnboarding(input: { userName: string; email: string; familyName: string; currency?: string; financialYear?: string }): OnboardingStatusDTO {
    const existing = this.db.prepare('SELECT * FROM families WHERE name = ?').get(input.familyName) as any;

    if (!existing) {
      this.db.prepare(`
        INSERT INTO families (name, created_at, updated_at)
        VALUES (?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `).run(input.familyName);
    }

    return this.getStatus();
  }

  public saveFeedback(feedback: Omit<BetaFeedbackDTO, 'id' | 'createdAt'>): BetaFeedbackDTO {
    // Store in sqlite or memory
    return {
      id: Date.now(),
      createdAt: new Date().toISOString(),
      ...feedback
    };
  }
}
