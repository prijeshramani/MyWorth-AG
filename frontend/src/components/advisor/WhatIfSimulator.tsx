import React from 'react';
import { PageShell } from '../layout/PageShell';
import { WhatIfSimulatorPanel } from '../timeMachine/WhatIfSimulatorPanel';

export const WhatIfSimulator: React.FC = () => {
  return (
    <PageShell
      title="What-If Financial Simulator"
      subtitle="Stateless scenario projection engine with 0 database writes"
    >
      <WhatIfSimulatorPanel />
    </PageShell>
  );
};
