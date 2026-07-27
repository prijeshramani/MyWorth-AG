export const queryKeys = {
  portfolio: {
    all: ['portfolio'] as const,
    summary: (familyId: number, asOfDate?: string, currency?: string) =>
      ['portfolio', 'summary', familyId, asOfDate, currency] as const
  },
  dashboard: {
    all: ['dashboard'] as const,
    overview: (familyId: number, asOfDate?: string) =>
      ['dashboard', 'overview', familyId, asOfDate] as const
  },
  reports: {
    all: ['reports'] as const
  },
  health: {
    all: ['health'] as const,
    overall: () => ['health', 'overall'] as const
  },
  protection: {
    all: ['protection'] as const,
    summary: (familyId: number) => ['protection', 'summary', familyId] as const
  },
  tax: {
    all: ['tax'] as const,
    summary: (familyId: number) => ['tax', 'summary', familyId] as const
  },
  graph: {
    all: ['graph'] as const,
    overview: (familyId: number) => ['graph', 'overview', familyId] as const
  }
};
