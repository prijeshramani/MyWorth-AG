import { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Portfolio from './components/Portfolio';
import Transactions from './components/Transactions';
import ImportCenter from './components/ImportCenter';
import CashFlowDashboard from './components/CashFlowDashboard';

function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [kiteRequestToken, setKiteRequestToken] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestToken = params.get('request_token');
    if (requestToken) {
      console.log('Kite request token detected in URL redirect:', requestToken);
      setKiteRequestToken(requestToken);
      setActiveTab('import');
      
      // Clean up URL parameters to prevent re-runs
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Page Routing Router
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard onNavigate={(tab) => setActiveTab(tab)} />;
      case 'portfolio':
        return <Portfolio />;
      case 'transactions':
        return <Transactions />;
      case 'cashflow':
        return <CashFlowDashboard />;
      case 'import':
        return (
          <ImportCenter 
            initialKiteRequestToken={kiteRequestToken} 
            clearKiteRequestToken={() => setKiteRequestToken(null)} 
          />
        );
      default:
        return <Dashboard onNavigate={(tab) => setActiveTab(tab)} />;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderContent()}
    </Layout>
  );
}

export default App;
