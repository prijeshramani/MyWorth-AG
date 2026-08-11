import React, { useState, useRef, useEffect } from 'react';
import { useUiStore } from '../store/useUiStore';
import { 
  FileUp, 
  Lock, 
  Check, 
  AlertCircle, 
  Terminal, 
  FileText, 
  Copy, 
  RefreshCw, 
  CheckSquare, 
  Square,
  PlusCircle,
  User,
  Users
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ParsedTx {
  assetName: string;
  assetType: 'MUTUAL_FUND' | 'STOCK' | 'NPS' | 'EPF';
  category: 'Equity' | 'Debt' | 'Cash' | 'Hybrid' | 'Alternative';
  identifier: string;
  type: 'BUY' | 'SELL' | 'REINVEST' | 'DIVIDEND' | 'INTEREST';
  date: string;
  quantity: number;
  price: number;
  amount: number;
  exists: boolean;
  assetId: number | null;
  isDuplicate: boolean;
}

interface ImportCenterProps {
  initialKiteRequestToken?: string | null;
  clearKiteRequestToken?: () => void;
  initialUpstoxCode?: string | null;
  clearUpstoxCode?: () => void;
}

export default function ImportCenter({
  initialKiteRequestToken,
  clearKiteRequestToken,
  initialUpstoxCode,
  clearUpstoxCode
}: ImportCenterProps = {}) {
  const { activeFamilyId } = useUiStore();
  const [importMethod, setImportMethod] = useState<'file' | 'kite' | 'angelone' | 'upstox' | 'indmoney' | 'epf' | 'bankinsights'>('file');
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState<string>('');
  const [parsing, setParsing] = useState<boolean>(false);
  
  // Family Members selection state
  const [familyMembers, setFamilyMembers] = useState<Array<{ id: number; name: string; relationship: string }>>([]);
  const [selectedFamilyMemberId, setSelectedFamilyMemberId] = useState<number | null>(null);
  
  // INDMoney API configuration states
  const [indMoneyClientId, setIndMoneyClientId] = useState<string>('');
  const [indMoneyApiSecret, setIndMoneyApiSecret] = useState<string>('');
  const [indMoneyTotpSecret, setIndMoneyTotpSecret] = useState<string>('');
  const [indMoneyAuthMethod, setIndMoneyAuthMethod] = useState<'totp' | 'token'>('totp');
  const [indMoneyToken, setIndMoneyToken] = useState<string>('');
  const [isIndMoneyConfigured, setIsIndMoneyConfigured] = useState<boolean>(false);
  const [showIndMoneyConfigForm, setShowIndMoneyConfigForm] = useState<boolean>(false);
  const [savingIndMoneyConfig, setSavingIndMoneyConfig] = useState<boolean>(false);
  
  // Kite Connect configuration states
  const [apiKey, setApiKey] = useState<string>('');
  const [apiSecret, setApiSecret] = useState<string>('');
  const [isConfigured, setIsConfigured] = useState<boolean>(false);
  const [showConfigForm, setShowConfigForm] = useState<boolean>(false);
  const [savingConfig, setSavingConfig] = useState<boolean>(false);

  // AngelOne SmartAPI configuration states
  const [angelClientCode, setAngelClientCode] = useState<string>('');
  const [angelPassword, setAngelPassword] = useState<string>('');
  const [angelApiKey, setAngelApiKey] = useState<string>('');
  const [angelTotpSecret, setAngelTotpSecret] = useState<string>('');
  const [isAngelConfigured, setIsAngelConfigured] = useState<boolean>(false);
  const [showAngelConfigForm, setShowAngelConfigForm] = useState<boolean>(false);
  const [savingAngelConfig, setSavingAngelConfig] = useState<boolean>(false);

  // Upstox Developer API configuration states
  const [upstoxApiKey, setUpstoxApiKey] = useState<string>('');
  const [upstoxApiSecret, setUpstoxApiSecret] = useState<string>('');
  const [upstoxRedirectUri, setUpstoxRedirectUri] = useState<string>('http://localhost:5173/');
  const [isUpstoxConfigured, setIsUpstoxConfigured] = useState<boolean>(false);
  const [hasUpstoxAccessToken, setHasUpstoxAccessToken] = useState<boolean>(false);
  const [showUpstoxConfigForm, setShowUpstoxConfigForm] = useState<boolean>(false);
  const [savingUpstoxConfig, setSavingUpstoxConfig] = useState<boolean>(false);

  // BankInsights configuration states
  const [bankInsightsDbPath, setBankInsightsDbPath] = useState<string>('');
  const [editingBankInsightsPath, setEditingBankInsightsPath] = useState<boolean>(false);
  const [savingBankInsightsPath, setSavingBankInsightsPath] = useState<boolean>(false);
  const [syncingBankInsights, setSyncingBankInsights] = useState<boolean>(false);
  const [bankInsightsSyncSuccess, setBankInsightsSyncSuccess] = useState<string>('');

  // EPF Sync states
  const [epfAsset, setEpfAsset] = useState<{ id: number; name: string } | null>(null);
  const [manualEpfBalance, setManualEpfBalance] = useState<string>('');
  const [manualEpfDate, setManualEpfDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [bootstrappingEpf, setBootstrappingEpf] = useState<boolean>(false);
  const [updatingEpfBalance, setUpdatingEpfBalance] = useState<boolean>(false);

  // Results
  const [statementType, setStatementType] = useState<string>('');
  const [parsedTxs, setParsedTxs] = useState<ParsedTx[]>([]);
  const [rawText, setRawText] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [selectedTxs, setSelectedTxs] = useState<Record<number, boolean>>({});

  // Collapsible diagnostics console
  const [showDiagnostics, setShowDiagnostics] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [importing, setImporting] = useState<boolean>(false);
  const [importSummary, setImportSummary] = useState<any>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const indMoneyFileInputRef = useRef<HTMLInputElement>(null);

  const fetchBankInsightsConfig = async () => {
    try {
      const res = await fetch('/api/import/bankinsights/config');
      if (res.ok) {
        const data = await res.json();
        setBankInsightsDbPath(data.dbPath || '');
      }
    } catch (err) {
      console.error('Failed to fetch BankInsights config:', err);
    }
  };

  const handleSaveBankInsightsPath = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingBankInsightsPath(true);
    setError('');
    try {
      const res = await fetch('/api/import/bankinsights/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dbPath: bankInsightsDbPath })
      });
      if (res.ok) {
        setEditingBankInsightsPath(false);
        alert('BankInsights database path updated!');
      } else {
        alert('Failed to update BankInsights path');
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setSavingBankInsightsPath(false);
    }
  };

  const handleBankInsightsSync = async () => {
    setSyncingBankInsights(true);
    setBankInsightsSyncSuccess('');
    setError('');
    try {
      const res = await fetch('/api/import/bankinsights/sync', {
        method: 'POST'
      });
      const json = await res.json();
      if (res.ok && json.success) {
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 }
        });
        setBankInsightsSyncSuccess(`Success! Synced ${json.importedCount} new bank transactions. Current balance: Rs. ${json.latestBalance.toLocaleString()}`);
      } else {
        setError(json.error || 'Failed to sync with BankInsights database.');
      }
    } catch (err: any) {
      setError(err.message || 'Error connecting to backend server.');
    } finally {
      setSyncingBankInsights(false);
    }
  };

  const fetchFamilyMembers = async () => {
    try {
      const res = await fetch(`/api/v1/family-members?familyId=${activeFamilyId}`);
      if (res.ok) {
        const json = await res.json();
        const members = json.data || json || [];
        if (Array.isArray(members) && members.length > 0) {
          setFamilyMembers(members);
          setSelectedFamilyMemberId(members[0].id);
        }
      }
    } catch (e) {
      console.error('Failed to fetch family members in ImportCenter:', e);
    }
  };

  useEffect(() => {
    fetchKiteConfig();
    fetchAngelConfig();
    fetchUpstoxConfig();
    fetchIndMoneyConfig();
    fetchBankInsightsConfig();
    fetchEpfAsset();
    fetchFamilyMembers();
  }, []);

  useEffect(() => {
    if (initialKiteRequestToken) {
      console.log('Automated Zerodha redirect exchange active. request_token found.');
      handleKiteTokenExchange(initialKiteRequestToken);
    } else if (initialUpstoxCode) {
      console.log('Automated Upstox redirect exchange active. code found:', initialUpstoxCode);
      handleUpstoxCodeExchange(initialUpstoxCode);
    } else {
      const urlParams = new URLSearchParams(window.location.search);
      const upstoxCode = urlParams.get('code');
      if (upstoxCode) {
        console.log('Upstox OAuth redirect code detected in URL.');
        handleUpstoxCodeExchange(upstoxCode);
      }
    }
  }, [initialKiteRequestToken, initialUpstoxCode]);

  const fetchEpfAsset = async () => {
    try {
      const res = await fetch('/api/assets');
      if (res.ok) {
        const assets = await res.json();
        const found = assets.find((a: any) => a.type === 'EPF');
        if (found) {
          setEpfAsset({ id: found.id, name: found.name });
        } else {
          setEpfAsset(null);
        }
      }
    } catch (err) {
      console.error('Failed to fetch EPF asset:', err);
    }
  };

  const handleBootstrapEpf = async () => {
    setBootstrappingEpf(true);
    setError('');
    try {
      const res = await fetch('/api/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'TCS Employees Provident Fund',
          type: 'EPF',
          category: 'Debt'
        })
      });
      if (res.ok) {
        const data = await res.json();
        setEpfAsset({ id: data.id, name: data.name });
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 }
        });
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to bootstrap EPF asset.');
      }
    } catch (err: any) {
      setError(err.message || 'Error communicating with server.');
    } finally {
      setBootstrappingEpf(false);
    }
  };

  const handleSyncEpfBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!epfAsset) return;
    const balanceVal = parseFloat(manualEpfBalance);
    if (isNaN(balanceVal) || balanceVal < 0) {
      return alert('Please enter a valid balance.');
    }
    setUpdatingEpfBalance(true);
    setError('');
    try {
      const res = await fetch(`/api/assets/${epfAsset.id}/prices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: manualEpfDate,
          price: balanceVal
        })
      });
      if (res.ok) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.7 }
        });
        setManualEpfBalance('');
        alert('EPF balance successfully updated.');
        // Trigger a background market sync to update timeline
        fetch('/api/sync', { method: 'POST' }).catch(e => console.error(e));
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to update EPF balance.');
      }
    } catch (err: any) {
      setError(err.message || 'Error connecting to local server.');
    } finally {
      setUpdatingEpfBalance(false);
    }
  };

  const fetchKiteConfig = async () => {
    try {
      const res = await fetch('/api/import/kite/config');
      if (res.ok) {
        const data = await res.json();
        setIsConfigured(data.configured);
        setApiKey(data.apiKey);
      }
    } catch (err) {
      console.error('Failed to fetch Kite Connect settings:', err);
    }
  };

  const fetchAngelConfig = async () => {
    try {
      const res = await fetch('/api/import/angelone/config');
      if (res.ok) {
        const data = await res.json();
        setIsAngelConfigured(data.hasPassword && data.hasTotpSecret && !!data.apiKey && !!data.clientCode);
        setAngelClientCode(data.clientCode);
        setAngelApiKey(data.apiKey);
      }
    } catch (err) {
      console.error('Failed to fetch AngelOne settings:', err);
    }
  };

  const handleSaveAngelConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingAngelConfig(true);
    setError('');
    try {
      const res = await fetch('/api/import/angelone/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientCode: angelClientCode,
          password: angelPassword,
          apiKey: angelApiKey,
          totpSecret: angelTotpSecret
        })
      });
      if (res.ok) {
        setIsAngelConfigured(true);
        setAngelPassword('');
        setAngelTotpSecret('');
        setShowAngelConfigForm(false);
        alert('AngelOne SmartAPI credentials saved locally!');
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to save AngelOne credentials.');
      }
    } catch (err: any) {
      setError(err.message || 'Error communicating with local server.');
    } finally {
      setSavingAngelConfig(false);
    }
  };

  const handleAngelSync = async () => {
    setParsing(true);
    setError('');
    setImportSummary(null);
    try {
      const res = await fetch('/api/import/angelone/sync', {
        method: 'POST'
      });
      if (res.ok) {
        const data = await res.json();
        setStatementType(data.statementType);
        setParsedTxs(data.transactions);
        setRawText(data.rawText);

        const selectionMap: Record<number, boolean> = {};
        data.transactions.forEach((tx: ParsedTx, idx: number) => {
          selectionMap[idx] = !tx.isDuplicate;
        });
        setSelectedTxs(selectionMap);

        if (data.transactions.length === 0) {
          setError('AngelOne SmartAPI synced successfully, but returned 0 active stock holdings.');
        } else {
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.8 }
          });
        }
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to sync with AngelOne SmartAPI. Verify your credentials and TOTP secret.');
      }
    } catch (err: any) {
      setError(err.message || 'Error communicating with local server.');
    } finally {
      setParsing(false);
    }
  };

  const fetchUpstoxConfig = async () => {
    try {
      const res = await fetch('/api/import/upstox/config');
      if (res.ok) {
        const data = await res.json();
        setIsUpstoxConfigured(data.configured);
        setUpstoxApiKey(data.apiKey || '');
        setUpstoxRedirectUri(data.redirectUri || 'http://localhost:5173/');
        setHasUpstoxAccessToken(data.hasAccessToken);
      }
    } catch (err) {
      console.error('Failed to fetch Upstox API settings:', err);
    }
  };

  const handleSaveUpstoxConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingUpstoxConfig(true);
    setError('');
    try {
      const res = await fetch('/api/import/upstox/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: upstoxApiKey,
          apiSecret: upstoxApiSecret,
          redirectUri: upstoxRedirectUri
        })
      });
      if (res.ok) {
        setIsUpstoxConfigured(true);
        setUpstoxApiSecret('');
        setShowUpstoxConfigForm(false);
        alert('Upstox API credentials saved locally!');
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to save Upstox credentials.');
      }
    } catch (err: any) {
      setError(err.message || 'Error communicating with server.');
    } finally {
      setSavingUpstoxConfig(false);
    }
  };

  const handleUpstoxAuthenticate = async () => {
    setError('');
    setParsing(true);
    try {
      const res = await fetch('/api/import/upstox/login-url');
      if (res.ok) {
        const data = await res.json();
        window.location.href = data.loginUrl;
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to initialize Upstox login URL.');
        setParsing(false);
      }
    } catch (err: any) {
      setError(err.message || 'Error connecting to local server.');
      setParsing(false);
    }
  };

  const handleUpstoxCodeExchange = async (code: string) => {
    setParsing(true);
    setError('');
    setImportSummary(null);
    setImportMethod('upstox');

    try {
      const res = await fetch('/api/import/upstox/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });

      if (res.ok) {
        const data = await res.json();
        setStatementType(data.statementType);
        setParsedTxs(data.transactions);
        setRawText(data.rawText);

        const selectionMap: Record<number, boolean> = {};
        data.transactions.forEach((tx: ParsedTx, idx: number) => {
          selectionMap[idx] = !tx.isDuplicate;
        });
        setSelectedTxs(selectionMap);

        if (data.transactions.length > 0) {
          console.log(`Auto-committing ${data.transactions.length} parsed Upstox holdings...`);
          const confirmRes = await fetch('/api/import/confirm', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              transactions: data.transactions,
              familyMemberId: selectedFamilyMemberId
            })
          });
          if (confirmRes.ok) {
            const summary = await confirmRes.json();
            setImportSummary(summary);
            confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
            fetch('/api/sync', { method: 'POST' }).catch(() => {});
          }
        } else {
          setError('Upstox API session validated, but returned 0 active holdings.');
        }
      } else {
        const errJson = await res.json();
        setError(errJson.error || 'Failed to validate Upstox authorization code.');
      }
    } catch (err: any) {
      setError(err.message || 'Error communicating with server.');
    } finally {
      setParsing(false);
    }
  };

  const handleUpstoxSync = async () => {
    setParsing(true);
    setError('');
    setImportSummary(null);
    try {
      const res = await fetch('/api/import/upstox/sync', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setStatementType(data.statementType);
        setParsedTxs(data.transactions);
        setRawText(data.rawText);

        const selectionMap: Record<number, boolean> = {};
        data.transactions.forEach((tx: ParsedTx, idx: number) => {
          selectionMap[idx] = !tx.isDuplicate;
        });
        setSelectedTxs(selectionMap);

        if (data.transactions.length === 0) {
          setError('Upstox API synced successfully, but returned 0 active stock holdings.');
        } else {
          confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
        }
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to sync with Upstox API.');
      }
    } catch (err: any) {
      setError(err.message || 'Error communicating with server.');
    } finally {
      setParsing(false);
    }
  };

  const fetchIndMoneyConfig = async () => {
    try {
      const res = await fetch('/api/import/indmoney/config');
      if (res.ok) {
        const data = await res.json();
        setIsIndMoneyConfigured(data.configured);
        if (data.clientId) setIndMoneyClientId(data.clientId);
      }
    } catch (err) {
      console.error('Failed to fetch INDMoney settings:', err);
    }
  };

  const handleSaveIndMoneyConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingIndMoneyConfig(true);
    setError('');
    try {
      const res = await fetch('/api/import/indmoney/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: indMoneyClientId,
          apiSecret: indMoneyApiSecret,
          totpSecret: indMoneyTotpSecret,
          accessToken: indMoneyToken
        })
      });
      if (res.ok) {
        setIsIndMoneyConfigured(true);
        setIndMoneyApiSecret('');
        setIndMoneyTotpSecret('');
        setShowIndMoneyConfigForm(false);
        alert('INDMoney API Trading credentials saved locally!');
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to save INDMoney credentials.');
      }
    } catch (err: any) {
      setError(err.message || 'Error communicating with local server.');
    } finally {
      setSavingIndMoneyConfig(false);
    }
  };

  const handleIndMoneySync = async () => {
    setParsing(true);
    setError('');
    setImportSummary(null);
    try {
      const res = await fetch('/api/import/indmoney/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken: indMoneyToken
        })
      });
      if (res.ok) {
        const data = await res.json();
        setStatementType(data.statementType);
        setParsedTxs(data.transactions);
        setRawText(data.rawText);

        const selectionMap: Record<number, boolean> = {};
        data.transactions.forEach((tx: ParsedTx, idx: number) => {
          selectionMap[idx] = !tx.isDuplicate;
        });
        setSelectedTxs(selectionMap);

        if (data.transactions.length === 0) {
          setError('INDMoney synced successfully, but returned 0 active stock holdings.');
        } else {
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.8 }
          });
        }
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to fetch holdings from INDMoney API.');
      }
    } catch (err: any) {
      setError(err.message || 'Error connecting to backend server.');
    } finally {
      setParsing(false);
    }
  };

  const handleSaveKiteConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingConfig(true);
    setError('');
    try {
      const res = await fetch('/api/import/kite/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey, apiSecret })
      });
      if (res.ok) {
        setIsConfigured(true);
        setApiSecret('');
        setShowConfigForm(false);
        alert('Kite Connect API credentials saved locally!');
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to save credentials.');
      }
    } catch (err: any) {
      setError(err.message || 'Error communicating with local server.');
    } finally {
      setSavingConfig(false);
    }
  };

  const handleKiteAuthenticate = async () => {
    setError('');
    setParsing(true);
    try {
      const res = await fetch('/api/import/kite/login-url');
      if (res.ok) {
        const data = await res.json();
        // Redirect the browser to Zerodha connect login!
        window.location.href = data.loginUrl;
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to initialize Zerodha login URL.');
        setParsing(false);
      }
    } catch (err: any) {
      setError(err.message || 'Error connecting to local backend.');
      setParsing(false);
    }
  };

  const handleKiteTokenExchange = async (token: string) => {
    setParsing(true);
    setError('');
    setImportSummary(null);
    setImportMethod('kite'); // Switch visual tab to Kite
    
    try {
      const res = await fetch('/api/import/kite/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestToken: token })
      });

      if (res.ok) {
        const data = await res.json();
        setStatementType(data.statementType);
        setParsedTxs(data.transactions);
        setRawText(data.rawText);

        const selectionMap: Record<number, boolean> = {};
        data.transactions.forEach((tx: ParsedTx, idx: number) => {
          selectionMap[idx] = !tx.isDuplicate;
        });
        setSelectedTxs(selectionMap);

        if (data.transactions.length > 0) {
          // Auto-commit holdings to database upon Zerodha OAuth redirect
          console.log(`Auto-committing ${data.transactions.length} parsed Zerodha holdings...`);
          const confirmRes = await fetch('/api/import/confirm', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ transactions: data.transactions })
          });
          if (confirmRes.ok) {
            const summary = await confirmRes.json();
            setImportSummary(summary);
            confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
            fetch('/api/sync', { method: 'POST' }).catch(() => {});
          }
        } else {
          setError('Zerodha Kite session validated, but returned 0 active holdings.');
        }
      } else {
        const errJson = await res.json();
        setError(errJson.error || 'Failed to validate Zerodha token. Check keys.');
      }
    } catch (err: any) {
      setError(err.message || 'Error communicating with parsing server.');
    } finally {
      setParsing(false);
      if (clearKiteRequestToken) {
        clearKiteRequestToken();
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setError('');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError('');
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleParse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return setError('Please select a statement file first.');

    setParsing(true);
    setError('');
    setImportSummary(null);
    
    const formData = new FormData();
    formData.append('file', file);
    if (password) {
      formData.append('password', password);
    }

    try {
      const res = await fetch('/api/import/parse', {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        setStatementType(data.statementType);
        setParsedTxs(data.transactions);
        setRawText(data.rawText);

        // Pre-select transactions that are NOT duplicates
        const selectionMap: Record<number, boolean> = {};
        data.transactions.forEach((tx: ParsedTx, idx: number) => {
          selectionMap[idx] = !tx.isDuplicate;
        });
        setSelectedTxs(selectionMap);

        if (data.transactions.length === 0) {
          setError(`Statement detected as ${data.statementType}, but parsed 0 transactions. Open 'Raw Text Diagnostics' below to check layout.`);
        }
      } else {
        const errJson = await res.json();
        setError(errJson.error || 'Failed to parse statement. Check if password is correct.');
      }
    } catch (err: any) {
      setError(err.message || 'Error communicating with parsing server.');
    } finally {
      setParsing(false);
    }
  };

  // Checkbox selection utilities
  const handleToggleSelectAll = () => {
    const allSelected = Object.values(selectedTxs).every(val => val);
    const newMap: Record<number, boolean> = {};
    parsedTxs.forEach((_, idx) => {
      newMap[idx] = !allSelected;
    });
    setSelectedTxs(newMap);
  };

  const handleToggleSelect = (idx: number) => {
    setSelectedTxs(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  // Submit selected transactions
  const handleConfirmImport = async () => {
    const txsToImport = parsedTxs.filter((_, idx) => selectedTxs[idx]);
    if (txsToImport.length === 0) {
      return alert('Please select at least one transaction to import.');
    }

    setImporting(true);
    try {
      const res = await fetch('/api/import/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          transactions: txsToImport,
          familyMemberId: selectedFamilyMemberId
        })
      });

      if (res.ok) {
        const result = await res.json();
        setImportSummary(result);
        
        // Trigger high-fidelity confetti animation!
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 }
        });

        // Reset file picker
        setFile(null);
        setPassword('');
        setParsedTxs([]);

        // Automatically trigger a background market price sync to pull live stock closing prices!
        console.log('Ingestion success. Dispatching silent background market price sync...');
        fetch('/api/sync', { method: 'POST' })
          .then(r => r.json())
          .then(data => {
            console.log('Silent auto-sync success:', data.message);
          })
          .catch(e => {
            console.error('Silent auto-sync failure:', e);
          });
      } else {
        alert('Failed to import transactions');
      }
    } catch (err) {
      console.error(err);
      alert('Network error confirming import');
    } finally {
      setImporting(false);
    }
  };

  const handleCopyDiagnostics = () => {
    navigator.clipboard.writeText(rawText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(val);
  };

  const statementLabels: Record<string, string> = {
    CAMS_CAS: 'CAMS Consolidated Account Statement (Mutual Funds)',
    NPS_PROTEAN: 'NPS Protean CRA Statement (National Pension Scheme)',
    ZERODHA: 'Zerodha Contract Note (Stocks)',
    ZERODHA_XML: 'Zerodha Contract Note (XML Stocks)',
    ZERODHA_HOLDINGS: 'Zerodha Console Holdings (Excel Stocks)',
    ANGELONE: 'AngelOne Contract Note (Stocks)',
    ANGELONE_HOLDINGS: 'AngelOne SmartAPI Portfolio (Stocks)',
    TCS_EPF: 'TCS Employees Provident Fund Statement (EPF)',
    UNKNOWN: 'Unrecognized Statement Template'
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* KPI Info Alert */}
      <div className="p-4 bg-indigo-950/20 border border-indigo-900/40 rounded-2xl flex gap-3 text-xs leading-relaxed max-w-3xl mx-auto">
        <Lock className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="font-bold text-slate-200">Local-First Secure Ingestion</h4>
          <p className="text-slate-400 mt-1">
            All PDF text extraction, decryption, and validation run **100% locally** in your machine's offline Node.js environment. No credentials, PDF buffers, or transaction numbers leave your system.
          </p>
        </div>
      </div>

      {/* Main Row: Upload panel */}
      {parsedTxs.length === 0 ? (
        <div className="max-w-3xl mx-auto card-glass p-8 rounded-3xl space-y-6">
          {/* Family Member Investment Holder Selection Card */}
          <div className="p-4 rounded-2xl border border-sky-500/30 bg-sky-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                  Portfolio Holder / Family Member
                  <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">Required</span>
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Select which family member owns this statement or portfolio.
                </p>
              </div>
            </div>

            {familyMembers.length > 0 ? (
              <select
                value={selectedFamilyMemberId || ''}
                onChange={(e) => setSelectedFamilyMemberId(Number(e.target.value))}
                className="bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs font-semibold text-sky-300 focus:outline-none focus:border-sky-500 min-w-[200px]"
              >
                {familyMembers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.relationship || 'Member'})
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-xs text-amber-400 italic font-semibold">Primary Account Holder</span>
            )}
          </div>

          {/* Method Selector Tabs */}
          <div className="flex flex-wrap p-1 bg-slate-950/60 border border-slate-900 rounded-xl max-w-3xl mx-auto">
            <button
              type="button"
              onClick={() => setImportMethod('file')}
              className={`flex-1 min-w-[80px] py-2 text-[10px] sm:text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                importMethod === 'file' 
                  ? 'bg-indigo-600 text-white shadow shadow-indigo-600/10' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileUp className="w-4 h-4" />
              Offline
            </button>
            <button
              type="button"
              onClick={() => setImportMethod('kite')}
              className={`flex-1 min-w-[80px] py-2 text-[10px] sm:text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                importMethod === 'kite' 
                  ? 'bg-indigo-600 text-white shadow shadow-indigo-600/10' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <RefreshCw className="w-4 h-4" />
              Zerodha API
            </button>
            <button
              type="button"
              onClick={() => setImportMethod('angelone')}
              className={`flex-1 min-w-[80px] py-2 text-[10px] sm:text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                importMethod === 'angelone' 
                  ? 'bg-indigo-600 text-white shadow shadow-indigo-600/10' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <RefreshCw className="w-4 h-4" />
              AngelOne API
            </button>
            <button
              type="button"
              onClick={() => { setImportMethod('upstox'); fetchUpstoxConfig(); }}
              className={`flex-1 min-w-[80px] py-2 text-[10px] sm:text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                importMethod === 'upstox' 
                  ? 'bg-indigo-600 text-white shadow shadow-indigo-600/10' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <RefreshCw className="w-4 h-4" />
              Upstox API
            </button>
            <button
              type="button"
              onClick={() => setImportMethod('indmoney')}
              className={`flex-1 min-w-[80px] py-2 text-[10px] sm:text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                importMethod === 'indmoney' 
                  ? 'bg-indigo-600 text-white shadow shadow-indigo-600/10' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <RefreshCw className="w-4 h-4" />
              INDMoney API
            </button>
            <button
              type="button"
              onClick={() => { setImportMethod('epf'); fetchEpfAsset(); }}
              className={`flex-1 min-w-[80px] py-2 text-[10px] sm:text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                importMethod === 'epf' 
                  ? 'bg-indigo-600 text-white shadow shadow-indigo-600/10' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <RefreshCw className="w-4 h-4" />
              EPF (Provident Fund)
            </button>
            <button
              type="button"
              onClick={() => { setImportMethod('bankinsights'); fetchBankInsightsConfig(); }}
              className={`flex-1 min-w-[80px] py-2 text-[10px] sm:text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                importMethod === 'bankinsights' 
                  ? 'bg-indigo-600 text-white shadow shadow-indigo-600/10' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <RefreshCw className="w-4 h-4 text-emerald-400" />
              BankInsights Sync
            </button>
          </div>

          {importMethod === 'file' ? (
            <form onSubmit={handleParse} className="space-y-6">
              {/* File Drag and Drop zone */}
              <div 
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={handleUploadClick}
                className={`border-2 border-dashed rounded-2xl py-10 px-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
                  file 
                    ? 'border-indigo-500/80 bg-indigo-500/5' 
                    : 'border-slate-800 hover:border-slate-700 bg-slate-900/10 hover:bg-slate-900/20'
                }`}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange}
                  accept=".pdf,.csv,.xml,.xlsx"
                  className="hidden"
                />
                <div className="p-4 bg-slate-800/60 rounded-full border border-slate-700/50">
                  <FileUp className="w-6 h-6 text-indigo-400" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-200">
                    {file ? file.name : 'Select or drag broker PDF/CSV/XML/Excel statement'}
                  </h4>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Supports CAMS/NPS PDFs, NPS CSV, Zerodha XML, and Zerodha holdings Excel (.xlsx) files (Max 10MB)
                  </p>
                </div>
              </div>

              {/* Optional Password decryption input */}
              <div className="space-y-1.5 max-w-sm mx-auto text-xs">
                <label className="text-slate-400 font-semibold flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-indigo-400" /> PDF Password (if locked)
                </label>
                <input 
                  type="password" 
                  placeholder="Enter password (usually PAN or email)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#111726]/80 text-slate-200 border border-slate-800 focus:border-indigo-500/50 rounded-xl px-4 py-2.5 outline-none font-medium"
                />
                <span className="text-[9px] text-slate-500 block leading-tight">
                  Passwords are used strictly in RAM for decryption; they are never saved to SQLite.
                </span>
              </div>

              {/* Submit parse */}
              <div className="text-center pt-2">
                <button
                  type="submit"
                  disabled={parsing || !file}
                  className="w-full sm:w-auto px-10 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/25 disabled:opacity-50 transition-all flex items-center justify-center gap-2 mx-auto"
                >
                  {parsing ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
                  {parsing ? 'Parsing and Decrypting PDF...' : 'Begin Statement Import'}
                </button>
              </div>
            </form>
          ) : importMethod === 'kite' ? (
            /* ZERODHA KITE API CONTROL BOARD */
            <div className="space-y-6 text-xs max-w-lg mx-auto py-2">
              <div className="p-4 bg-slate-950/40 border border-slate-900/60 rounded-2xl flex gap-3 text-slate-400 leading-relaxed">
                <AlertCircle className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-bold text-slate-300">Zerodha Developer Account Required</h5>
                  <p className="mt-1">
                    Kite Connect offers an official **Personal (Free)** tier for retail investors. Set the **Redirect URL** in your developer app config to: <code className="bg-slate-900 px-1.5 py-0.5 rounded text-white font-bold">http://localhost:5173/</code>
                  </p>
                </div>
              </div>

              {isConfigured && !showConfigForm ? (
                <div className="space-y-4 text-center">
                  <div className="p-4 bg-indigo-950/10 border border-indigo-900/30 rounded-2xl inline-block w-full text-left">
                    <span className="font-bold text-slate-300 block">Kite Connect Active Setup</span>
                    <span className="text-slate-500 block mt-1">API Key: <code className="text-slate-300 bg-slate-900/50 px-1.5 py-0.5 rounded">{apiKey}</code></span>
                  </div>
                  
                  <div className="flex justify-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowConfigForm(true)}
                      className="px-4 py-2 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 rounded-xl font-semibold"
                    >
                      Edit Credentials
                    </button>
                    <button
                      type="button"
                      onClick={handleKiteAuthenticate}
                      disabled={parsing}
                      className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-md shadow-indigo-600/20 disabled:opacity-50 flex items-center justify-center gap-1.5"
                    >
                      {parsing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
                      {parsing ? 'Contacting Zerodha...' : 'Authenticate & Sync Holdings'}
                    </button>
                  </div>
                </div>
              ) : (
                /* Credentials Settings Form */
                <form onSubmit={handleSaveKiteConfig} className="space-y-4 border border-slate-900/40 bg-slate-950/20 p-5 rounded-2xl">
                  <h5 className="font-bold text-slate-200 text-sm">Configure Kite Connect API Credentials</h5>
                  
                  <div className="space-y-1.5">
                    <label className="text-slate-400 font-semibold block">API Key</label>
                    <input 
                      type="text" 
                      placeholder="Enter API Key"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      className="w-full bg-[#111726]/80 text-slate-200 border border-slate-800 focus:border-indigo-500/50 rounded-xl px-4 py-2.5 outline-none font-medium"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-400 font-semibold block">API Secret</label>
                    <input 
                      type="password" 
                      placeholder="Enter API Secret"
                      value={apiSecret}
                      onChange={(e) => setApiSecret(e.target.value)}
                      className="w-full bg-[#111726]/80 text-slate-200 border border-slate-800 focus:border-indigo-500/50 rounded-xl px-4 py-2.5 outline-none font-medium"
                      required={!isConfigured}
                    />
                  </div>

                  <div className="flex gap-2.5 pt-2">
                    {isConfigured && (
                      <button
                        type="button"
                        onClick={() => setShowConfigForm(false)}
                        className="flex-1 py-2.5 border border-slate-800 text-slate-400 rounded-xl font-semibold hover:bg-slate-800/40"
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={savingConfig}
                      className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold disabled:opacity-50"
                    >
                      {savingConfig ? 'Saving Settings...' : 'Save Credentials locally'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : importMethod === 'angelone' ? (
            /* ANGELONE SMARTAPI CONTROL BOARD */
            <div className="space-y-6 text-xs max-w-lg mx-auto py-2">
              <div className="p-4 bg-slate-950/40 border border-slate-900/60 rounded-2xl flex gap-3 text-slate-400 leading-relaxed">
                <AlertCircle className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-bold text-slate-300">AngelOne SmartAPI Developer Setup</h5>
                  <p className="mt-1">
                    SmartAPI is completely free for retail clients. Create a developer account at <a href="https://smartapi.angelone.in" target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline font-bold">smartapi.angelone.in</a>, register a retail app, and enable TOTP on your AngelOne trading account.
                  </p>
                </div>
              </div>

              {isAngelConfigured && !showAngelConfigForm ? (
                <div className="space-y-4 text-center">
                  <div className="p-4 bg-indigo-950/10 border border-indigo-900/30 rounded-2xl inline-block w-full text-left space-y-1">
                    <span className="font-bold text-slate-300 block">SmartAPI Active Setup</span>
                    <span className="text-slate-500 block">Client Code: <code className="text-slate-300 bg-slate-900/50 px-1.5 py-0.5 rounded font-mono">{angelClientCode}</code></span>
                    <span className="text-slate-500 block">API Key: <code className="text-slate-300 bg-slate-900/50 px-1.5 py-0.5 rounded font-mono">{angelApiKey}</code></span>
                  </div>
                  
                  <div className="flex justify-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAngelConfigForm(true)}
                      className="px-4 py-2 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 rounded-xl font-semibold transition-all"
                    >
                      Edit Credentials
                    </button>
                    <button
                      type="button"
                      onClick={handleAngelSync}
                      disabled={parsing}
                      className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-md shadow-indigo-600/20 disabled:opacity-50 flex items-center justify-center gap-1.5 transition-all"
                    >
                      {parsing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
                      {parsing ? 'Contacting SmartAPI...' : 'Sync Stock Holdings'}
                    </button>
                  </div>
                </div>
              ) : (
                /* Credentials Settings Form */
                <form onSubmit={handleSaveAngelConfig} className="space-y-4 border border-slate-900/40 bg-slate-950/20 p-5 rounded-2xl">
                  <h5 className="font-bold text-slate-200 text-sm">Configure AngelOne SmartAPI Credentials</h5>
                  
                  <div className="space-y-1.5">
                    <label className="text-slate-400 font-semibold block">Client Code (AngelOne Login ID)</label>
                    <input 
                      type="text" 
                      placeholder="e.g. A123456"
                      value={angelClientCode}
                      onChange={(e) => setAngelClientCode(e.target.value)}
                      className="w-full bg-[#111726]/80 text-slate-200 border border-slate-800 focus:border-indigo-500/50 rounded-xl px-4 py-2.5 outline-none font-medium font-mono"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-400 font-semibold block">Password / Account PIN</label>
                    <input 
                      type="password" 
                      placeholder="Enter your AngelOne Password or PIN"
                      value={angelPassword}
                      onChange={(e) => setAngelPassword(e.target.value)}
                      className="w-full bg-[#111726]/80 text-slate-200 border border-slate-800 focus:border-indigo-500/50 rounded-xl px-4 py-2.5 outline-none font-medium"
                      required={!isAngelConfigured}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-400 font-semibold block">SmartAPI API Key</label>
                    <input 
                      type="text" 
                      placeholder="Paste your SmartAPI API Key"
                      value={angelApiKey}
                      onChange={(e) => setAngelApiKey(e.target.value)}
                      className="w-full bg-[#111726]/80 text-slate-200 border border-slate-800 focus:border-indigo-500/50 rounded-xl px-4 py-2.5 outline-none font-medium font-mono"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-400 font-semibold block">2FA TOTP Secret Key</label>
                    <input 
                      type="password" 
                      placeholder="Paste your 2FA TOTP Secret Key (from Google Authenticator setup)"
                      value={angelTotpSecret}
                      onChange={(e) => setAngelTotpSecret(e.target.value)}
                      className="w-full bg-[#111726]/80 text-slate-200 border border-slate-800 focus:border-indigo-500/50 rounded-xl px-4 py-2.5 outline-none font-medium font-mono"
                      required={!isAngelConfigured}
                    />
                    <span className="text-[9px] text-slate-500 block leading-tight mt-1">
                      To get this, enable TOTP in AngelOne app. AngelOne will display a secret code alongside the QR code. Enter that alphanumeric key here to allow MyWorth to compute dynamic 2FA tokens offline.
                    </span>
                  </div>

                  <div className="flex gap-2.5 pt-2">
                    {isAngelConfigured && (
                      <button
                        type="button"
                        onClick={() => setShowAngelConfigForm(false)}
                        className="flex-1 py-2.5 border border-slate-800 text-slate-400 rounded-xl font-semibold hover:bg-slate-800/40 transition-all"
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={savingAngelConfig}
                      className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold disabled:opacity-50 transition-all"
                    >
                      {savingAngelConfig ? 'Saving Settings...' : 'Save Credentials locally'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : importMethod === 'upstox' ? (
            /* UPSTOX DEVELOPER API CONTROL BOARD */
            <div className="space-y-6 text-xs max-w-lg mx-auto py-2">
              <div className="p-4 bg-slate-950/40 border border-slate-900/60 rounded-2xl flex gap-3 text-slate-400 leading-relaxed">
                <AlertCircle className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-bold text-slate-300">Upstox Developer Account Setup</h5>
                  <p className="mt-1">
                    Upstox API v2 supports official **Developer Accounts**. Create an app at <a href="https://account.upstox.com/developer/apps" target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline font-bold">account.upstox.com/developer/apps</a> and set Redirect URI to: <code className="bg-slate-900 px-1.5 py-0.5 rounded text-white font-bold">http://localhost:5173/import/upstox/callback</code>
                  </p>
                </div>
              </div>

              {isUpstoxConfigured && !showUpstoxConfigForm ? (
                <div className="space-y-4 text-center">
                  <div className="p-4 bg-indigo-950/10 border border-indigo-900/30 rounded-2xl inline-block w-full text-left space-y-1">
                    <span className="font-bold text-slate-300 block">Upstox Developer Setup</span>
                    <span className="text-slate-500 block">API Key: <code className="text-slate-300 bg-slate-900/50 px-1.5 py-0.5 rounded font-mono">{upstoxApiKey}</code></span>
                    <span className="text-slate-500 block">Redirect URI: <code className="text-slate-300 bg-slate-900/50 px-1.5 py-0.5 rounded font-mono">{upstoxRedirectUri}</code></span>
                  </div>

                  <div className="flex justify-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowUpstoxConfigForm(true)}
                      className="px-4 py-2 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 rounded-xl font-semibold transition-all"
                    >
                      Edit Credentials
                    </button>
                    {hasUpstoxAccessToken ? (
                      <button
                        type="button"
                        onClick={handleUpstoxSync}
                        disabled={parsing}
                        className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-md shadow-emerald-600/20 disabled:opacity-50 flex items-center justify-center gap-1.5 transition-all"
                      >
                        {parsing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                        {parsing ? 'Syncing Upstox...' : 'Quick Sync Holdings'}
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={handleUpstoxAuthenticate}
                      disabled={parsing}
                      className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-md shadow-indigo-600/20 disabled:opacity-50 flex items-center justify-center gap-1.5 transition-all"
                    >
                      {parsing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
                      {parsing ? 'Contacting Upstox...' : 'Login with Upstox'}
                    </button>
                  </div>
                </div>
              ) : (
                /* Credentials Settings Form */
                <form onSubmit={handleSaveUpstoxConfig} className="space-y-4 border border-slate-900/40 bg-slate-950/20 p-5 rounded-2xl">
                  <h5 className="font-bold text-slate-200 text-sm">Configure Upstox API v2 Credentials</h5>

                  <div className="space-y-1.5">
                    <label className="text-slate-400 font-semibold block">API Key (Client ID)</label>
                    <input 
                      type="text" 
                      placeholder="Paste your Upstox API Key"
                      value={upstoxApiKey}
                      onChange={(e) => setUpstoxApiKey(e.target.value)}
                      className="w-full bg-[#111726]/80 text-slate-200 border border-slate-800 focus:border-indigo-500/50 rounded-xl px-4 py-2.5 outline-none font-medium font-mono"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-400 font-semibold block">API Secret (Client Secret)</label>
                    <input 
                      type="password" 
                      placeholder="Paste your Upstox API Secret"
                      value={upstoxApiSecret}
                      onChange={(e) => setUpstoxApiSecret(e.target.value)}
                      className="w-full bg-[#111726]/80 text-slate-200 border border-slate-800 focus:border-indigo-500/50 rounded-xl px-4 py-2.5 outline-none font-medium font-mono"
                      required={!isUpstoxConfigured}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-400 font-semibold block">Redirect URI</label>
                    <input 
                      type="text" 
                      placeholder="http://localhost:5173/import/upstox/callback"
                      value={upstoxRedirectUri}
                      onChange={(e) => setUpstoxRedirectUri(e.target.value)}
                      className="w-full bg-[#111726]/80 text-slate-200 border border-slate-800 focus:border-indigo-500/50 rounded-xl px-4 py-2.5 outline-none font-medium font-mono"
                      required
                    />
                  </div>

                  <div className="flex gap-2.5 pt-2">
                    {isUpstoxConfigured && (
                      <button
                        type="button"
                        onClick={() => setShowUpstoxConfigForm(false)}
                        className="flex-1 py-2.5 border border-slate-800 text-slate-400 rounded-xl font-semibold hover:bg-slate-800/40 transition-all"
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={savingUpstoxConfig}
                      className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold disabled:opacity-50 transition-all"
                    >
                      {savingUpstoxConfig ? 'Saving Settings...' : 'Save Credentials locally'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : importMethod === 'indmoney' ? (
            /* INDMONEY US STOCKS STATEMENT IMPORT BOARD */
            <div className="space-y-6 text-xs max-w-xl mx-auto py-2">
              <div className="p-4 bg-slate-950/40 border border-slate-900/60 rounded-2xl flex gap-3 text-slate-400 leading-relaxed">
                <AlertCircle className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-bold text-slate-300">INDmoney US Stocks Statement Export Guide</h5>
                  <p className="mt-1.5 leading-relaxed">
                    INDmoney does not support public API access for US stock holdings. You can easily import your complete US stock holdings and transactions by uploading statement files generated by INDmoney:
                  </p>
                  <ul className="mt-2 space-y-1.5 list-disc list-inside text-slate-300">
                    <li>
                      <strong className="text-white">Option 1: Order Book Statement (Full Inception History)</strong>
                      <br />
                      <span className="text-slate-400 ml-4">Open INDmoney app &rarr; US Stocks &rarr; Account &rarr; Reports &rarr; Download <code className="bg-slate-900 px-1.5 py-0.5 rounded text-indigo-300">Order Book (.xls / .xlsx)</code></span>
                    </li>
                    <li>
                      <strong className="text-white">Option 2: Consolidated Tax Report</strong>
                      <br />
                      <span className="text-slate-400 ml-4">Open INDmoney app &rarr; More &rarr; Taxation & Report &rarr; US Stocks &rarr; Download <code className="bg-slate-900 px-1.5 py-0.5 rounded text-indigo-300">Tax Report (.xlsx)</code></span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Integrated File Upload Component */}
              <form onSubmit={handleParse} className="space-y-4 border border-slate-900/40 bg-slate-950/20 p-6 rounded-2xl text-center">
                <input 
                  type="file" 
                  ref={indMoneyFileInputRef} 
                  onChange={handleFileChange}
                  accept=".xls,.xlsx,.csv,.pdf,.xml"
                  className="hidden"
                />
                <div 
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={() => indMoneyFileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-800 hover:border-indigo-500/50 bg-[#111726]/40 hover:bg-[#111726]/80 p-8 rounded-2xl cursor-pointer transition-all flex flex-col items-center justify-center gap-3 group"
                >
                  <div className="p-3 bg-indigo-950/40 group-hover:bg-indigo-900/40 text-indigo-400 rounded-xl border border-indigo-900/40 transition-colors">
                    <FileUp className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-200">
                      {file ? file.name : 'Click to select or drag & drop your INDmoney statement'}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Supports INDmoney Order Book (<code className="text-slate-400">.xls</code>, <code className="text-slate-400">.xlsx</code>), Tax Report (<code className="text-slate-400">.xlsx</code>), or CSV exports
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  {file && (
                    <button
                      type="button"
                      onClick={() => setFile(null)}
                      className="px-4 py-2.5 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 rounded-xl font-semibold transition-all"
                    >
                      Clear
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={!file || parsing}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-600/20 disabled:opacity-50 flex items-center justify-center gap-2 transition-all text-sm"
                  >
                    {parsing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                    {parsing ? 'Parsing INDmoney Statement...' : 'Parse & Preview INDmoney Holdings'}
                  </button>
                </div>
              </form>
            </div>
          ) : importMethod === 'epf' ? (
            /* EPF (PROVIDENT FUND) SYNC BOARD */
            <div className="space-y-8 max-w-4xl mx-auto py-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Method A: Upload Statement PDF */}
                <div className="card-glass border border-slate-800/60 p-6 rounded-2xl flex flex-col justify-between space-y-4">
                  <div>
                    <h5 className="font-bold text-slate-200 text-sm flex items-center gap-1.5">
                      <FileUp className="w-4 h-4 text-indigo-400" />
                      Option A: Upload TCS EPF Statement
                    </h5>
                    <p className="text-slate-400 text-[11px] mt-1.5 leading-relaxed">
                      Upload your official TCS Employees' Provident Fund statement PDF. The secure local parser will automatically read the financial year, opening balance, monthly contributions, and credited interest.
                    </p>
                  </div>

                  <form onSubmit={handleParse} className="space-y-4 pt-2">
                    {/* File picker */}
                    <div 
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                      onClick={handleUploadClick}
                      className={`border border-dashed rounded-xl py-6 px-3 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
                        file && file.name.toLowerCase().endsWith('.pdf')
                          ? 'border-indigo-500/80 bg-indigo-500/5' 
                          : 'border-slate-800 hover:border-slate-700 bg-slate-900/10 hover:bg-slate-900/20'
                      }`}
                    >
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange}
                        accept=".pdf"
                        className="hidden"
                      />
                      <FileUp className="w-5 h-5 text-indigo-400" />
                      <span className="font-bold text-[11px] text-slate-300 block truncate max-w-[200px]">
                        {file && file.name.toLowerCase().endsWith('.pdf') ? file.name : 'Select or drag TCS EPF statement PDF'}
                      </span>
                    </div>

                    {/* PDF Password */}
                    <div className="space-y-1 text-[11px]">
                      <label className="text-slate-400 font-semibold flex items-center gap-1">
                        <Lock className="w-3 h-3 text-indigo-400" /> PDF Password (usually TCS birthdate/email or PAN)
                      </label>
                      <input 
                        type="password" 
                        placeholder="Enter PDF password if locked"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-[#111726]/80 text-slate-200 border border-slate-800 focus:border-indigo-500/50 rounded-xl px-3.5 py-2 outline-none font-medium text-[11px]"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={parsing || !file}
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[11px] font-bold shadow-md shadow-indigo-600/20 disabled:opacity-50 transition-all flex items-center justify-center gap-1.5"
                    >
                      {parsing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                      {parsing ? 'Parsing EPF PDF...' : 'Ingest EPF PDF Statement'}
                    </button>
                  </form>
                </div>

                {/* Method B: Manual Balance Sync */}
                <div className="card-glass border border-slate-800/60 p-6 rounded-2xl flex flex-col justify-between space-y-4">
                  <div>
                    <h5 className="font-bold text-slate-200 text-sm flex items-center gap-1.5">
                      <RefreshCw className="w-4 h-4 text-indigo-400" />
                      Option B: Manual Balance Sync
                    </h5>
                    <p className="text-slate-400 text-[11px] mt-1.5 leading-relaxed">
                      If you do not have a statement PDF, you can bootstrap a manual EPF account and periodically sync your balance to reflect your EPFO assets on your net worth timeline.
                    </p>
                  </div>

                  {!epfAsset ? (
                    <div className="space-y-4 pt-2 text-center flex-1 flex flex-col justify-center">
                      <div className="p-3 bg-indigo-950/20 border border-indigo-900/30 rounded-xl text-left text-slate-400 text-[10px] leading-relaxed">
                        No active EPF holding has been registered in your local database. Click below to bootstrap a secure portfolio entry for your provident fund.
                      </div>
                      <button
                        type="button"
                        onClick={handleBootstrapEpf}
                        disabled={bootstrappingEpf}
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[11px] font-bold disabled:opacity-50 transition-all flex items-center justify-center gap-1.5"
                      >
                        {bootstrappingEpf ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <PlusCircle className="w-3.5 h-3.5" />}
                        {bootstrappingEpf ? 'Bootstrapping...' : 'Bootstrap EPF Asset Ledger'}
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleSyncEpfBalance} className="space-y-4 pt-2 flex-1 flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="p-2.5 bg-emerald-950/10 border border-emerald-900/20 rounded-xl text-[10px] text-slate-400">
                          Linked Holding: <strong className="text-emerald-400">{epfAsset.name}</strong> (ID: {epfAsset.id})
                        </div>

                        <div className="space-y-1 text-[11px]">
                          <label className="text-slate-400 font-semibold block">Current EPF Balance (Rs.)</label>
                          <input 
                            type="number" 
                            step="any"
                            placeholder="e.g. 1741353"
                            value={manualEpfBalance}
                            onChange={(e) => setManualEpfBalance(e.target.value)}
                            required
                            className="w-full bg-[#111726]/80 text-slate-200 border border-slate-800 focus:border-indigo-500/50 rounded-xl px-3.5 py-2 outline-none font-bold text-[11px]"
                          />
                        </div>

                        <div className="space-y-1 text-[11px]">
                          <label className="text-slate-400 font-semibold block">Balance Record Date</label>
                          <input 
                            type="date" 
                            value={manualEpfDate}
                            onChange={(e) => setManualEpfDate(e.target.value)}
                            required
                            className="w-full bg-[#111726]/80 text-slate-200 border border-slate-800 focus:border-indigo-500/50 rounded-xl px-3.5 py-2 outline-none font-medium text-[11px]"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={updatingEpfBalance}
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[11px] font-bold disabled:opacity-50 transition-all flex items-center justify-center gap-1.5"
                      >
                        {updatingEpfBalance ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                        {updatingEpfBalance ? 'Syncing...' : 'Sync EPF Balance'}
                      </button>
                    </form>
                  )}
                </div>

              </div>
            </div>
          ) : (
            /* BANKINSIGHTS APP DIRECT SYNC BOARD */
            <div className="space-y-6 max-w-2xl mx-auto py-2 text-center">
              <div className="w-14 h-14 bg-indigo-600/10 border border-indigo-500/20 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-indigo-500/5">
                <RefreshCw className="w-7 h-7 text-indigo-500 dark:text-indigo-400" />
              </div>
              <h4 className="font-bold text-slate-900 dark:text-slate-100 text-lg">BankInsights Local SQLite Direct Sync</h4>
              <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed max-w-md mx-auto">
                Connect directly to your local <span className="font-bold text-indigo-600 dark:text-indigo-400">BankInsights</span> app database file to dynamically pull and classify bank accounts, credits, debits, and salary deposits into your local ledger.
              </p>

              <div className="space-y-4 max-w-md mx-auto text-left text-xs bg-slate-50 dark:bg-slate-950/40 p-4 border border-slate-200 dark:border-slate-900 rounded-2xl">
                <div className="space-y-1">
                  <label className="text-slate-700 dark:text-slate-400 font-semibold block">Configured SQLite Database Path</label>
                  {editingBankInsightsPath ? (
                    <form onSubmit={handleSaveBankInsightsPath} className="space-y-3 pt-1">
                      <input 
                        type="text" 
                        value={bankInsightsDbPath} 
                        onChange={(e) => setBankInsightsDbPath(e.target.value)}
                        placeholder="Path to bank_insights.db"
                        className="w-full bg-white dark:bg-[#111726]/80 text-slate-900 dark:text-slate-200 border border-slate-200 dark:border-slate-800 focus:border-indigo-500/50 rounded-xl px-3.5 py-2 outline-none font-mono text-[11px]"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingBankInsightsPath(false)}
                          className="flex-1 py-2 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/40 rounded-xl font-semibold transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={savingBankInsightsPath}
                          className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold disabled:opacity-50 transition-colors"
                        >
                          Save Path
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex items-center justify-between gap-2 pt-1">
                      <span className="font-mono text-[11px] text-slate-800 dark:text-slate-300 break-all bg-white dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800/60 flex-1">
                        {bankInsightsDbPath || 'Not configured'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setEditingBankInsightsPath(true)}
                        className="px-3 py-1.5 border border-slate-200 dark:border-slate-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-800/40 rounded-xl font-semibold flex-shrink-0 transition-colors"
                      >
                        Change
                      </button>
                    </div>
                  )}
                </div>

                {bankInsightsSyncSuccess && (
                  <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-300 text-[11px] font-medium rounded-xl flex items-center gap-2.5 shadow-sm">
                    <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                    <span>{bankInsightsSyncSuccess}</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleBankInsightsSync}
                  disabled={syncingBankInsights}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-md shadow-indigo-600/20 disabled:opacity-50 flex items-center justify-center gap-2 transition-all mt-2"
                >
                  {syncingBankInsights ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  {syncingBankInsights ? 'Connecting & Syncing Bank Transactions...' : 'Establish Direct App Sync'}
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-6 p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 text-rose-800 dark:text-rose-400 text-xs rounded-xl flex items-start gap-2.5 shadow-sm">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-500 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Parsing Issue:</span> {error}
              </div>
            </div>
          )}

          {importSummary && (
            <div className="mt-6 p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-400 text-xs rounded-xl flex items-start gap-2.5 shadow-sm">
              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Import Complete!</span> Registered{' '}
                <code className="bg-emerald-200/60 dark:bg-emerald-900/40 px-1.5 py-0.5 rounded text-emerald-900 dark:text-white font-bold">{importSummary.assetsCreated}</code> new asset portfolios and imported{' '}
                <code className="bg-emerald-200/60 dark:bg-emerald-900/40 px-1.5 py-0.5 rounded text-emerald-900 dark:text-white font-bold">{importSummary.transactionsImported}</code> transactions ({importSummary.duplicatesSkipped} duplicates safely skipped).
              </div>
            </div>
          )}
        </div>
      ) : (
        /* INTERACTIVE PREVIEW MODAL SCREEN */
        <div className="card-glass p-6 rounded-3xl space-y-6">
          <div className="border-b border-slate-800/40 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Extracted Ingestion Review</span>
              <h3 className="text-lg font-bold text-slate-200 mt-1">
                {statementLabels[statementType] || statementType}
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Review matched assets and duplicates before submitting ledger entries to the local database.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => { setFile(null); setParsedTxs([]); }}
                className="py-2 px-4 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 rounded-xl text-xs font-semibold"
              >
                Cancel Import
              </button>
              <button
                onClick={handleConfirmImport}
                disabled={importing}
                className="py-2 px-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20 disabled:opacity-50 flex items-center gap-1.5"
              >
                {importing ? <RefreshCw className="w-4.5 h-4.5 animate-spin" /> : <Check className="w-4 h-4" />}
                Confirm Ingestion ({parsedTxs.filter((_, idx) => selectedTxs[idx]).length} items)
              </button>
            </div>
          </div>

          {/* Extracted Transactions List Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="text-slate-400 border-b border-slate-800/60 pb-2.5 font-bold uppercase tracking-wider">
                  <th className="pb-3 text-center w-10">
                    <button 
                      type="button"
                      onClick={handleToggleSelectAll} 
                      className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition-all"
                    >
                      {Object.values(selectedTxs).every(val => val) ? <CheckSquare className="w-4 h-4 text-indigo-400" /> : <Square className="w-4 h-4" />}
                    </button>
                  </th>
                  <th className="pb-3">Trading Date</th>
                  <th className="pb-3">Asset</th>
                  <th className="pb-3">Identifier</th>
                  <th className="pb-3">Type</th>
                  <th className="pb-3 text-right">Units / Shares</th>
                  <th className="pb-3 text-right">Rate</th>
                  <th className="pb-3 text-right">Amount</th>
                  <th className="pb-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/30">
                {parsedTxs.map((tx, idx) => {
                  const isSelected = !!selectedTxs[idx];
                  const isBuy = tx.type === 'BUY' || tx.type === 'REINVEST';
                  return (
                    <tr 
                      key={idx} 
                      className={`hover:bg-slate-800/10 ${tx.isDuplicate ? 'opacity-50 bg-yellow-950/5' : ''}`}
                    >
                      <td className="py-3 text-center">
                        <button 
                          type="button"
                          onClick={() => handleToggleSelect(idx)}
                          className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition-all"
                        >
                          {isSelected ? <CheckSquare className="w-4 h-4 text-indigo-400" /> : <Square className="w-4 h-4" />}
                        </button>
                      </td>
                      <td className="py-3 text-slate-300 font-medium whitespace-nowrap">
                        {new Date(tx.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="py-3">
                        <span className="font-semibold text-slate-200 block truncate max-w-[180px]">{tx.assetName}</span>
                      </td>
                      <td className="py-3 font-semibold text-slate-400">{tx.identifier || 'N/A'}</td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded-md font-bold text-[9px] ${
                          isBuy ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}>
                          {tx.type}
                        </span>
                      </td>
                      <td className="py-3 text-right font-medium text-slate-300">{tx.quantity.toFixed(4)}</td>
                      <td className="py-3 text-right font-medium text-slate-300">{formatCurrency(tx.price)}</td>
                      <td className="py-3 text-right font-bold text-slate-200">{formatCurrency(tx.amount)}</td>
                      <td className="py-3 text-center">
                        {tx.isDuplicate ? (
                          <span className="px-1.5 py-0.5 rounded bg-yellow-500/15 text-yellow-400 border border-yellow-500/20 font-bold text-[9px] whitespace-nowrap">
                            Duplicate (will skip)
                          </span>
                        ) : tx.exists ? (
                          <span className="px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-400 border border-blue-500/20 font-bold text-[9px] whitespace-nowrap">
                            Append to Asset
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-400 border border-indigo-500/20 font-bold text-[9px] whitespace-nowrap">
                            New Asset Portfolio
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* RAW TEXT DIAGNOSTIC CONSOLE (ANTI-ASSUMPTION BLOCK) */}
      {rawText && (
        <div className="card-glass rounded-2xl overflow-hidden max-w-5xl mx-auto border border-slate-800/80">
          <button
            onClick={() => setShowDiagnostics(!showDiagnostics)}
            className="w-full flex items-center justify-between px-6 py-4 bg-[#0a0f1d] hover:bg-[#0e1529]/80 transition-colors text-xs font-bold text-slate-300"
          >
            <span className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-indigo-400" /> 
              PDF Extracted Text Diagnostic Sandbox (Strict Ingestion Integrity)
            </span>
            <span className="text-[10px] text-slate-500 bg-slate-800 px-2 py-0.5 rounded">
              {showDiagnostics ? 'Hide Raw Logs' : 'Show Raw Logs'}
            </span>
          </button>

          {showDiagnostics && (
            <div className="p-6 bg-[#04060c] space-y-4">
              {/* Context helper */}
              <div className="p-3.5 bg-indigo-950/20 border border-indigo-900/40 rounded-xl text-slate-400 text-[10px] leading-relaxed flex gap-2.5">
                <AlertCircle className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-300">Layout Transparency:</span> This console prints the exact structured characters extracted from your statement. Because broker statement columns can fluctuate (due to specific transaction codes or formatting differences), checking this output allows you to inspect what text patterns the backend parsed. If a fund's transactions were skipped, you can copy this text (redacting personal details) to help us refine the regex decoders instantly!
                </div>
              </div>

              {/* Console logs box */}
              <div className="relative">
                <button
                  onClick={handleCopyDiagnostics}
                  className="absolute right-3 top-3 p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-all flex items-center gap-1 text-[10px] font-bold"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {copied ? 'Copied!' : 'Copy Raw Text'}
                </button>
                
                <pre className="w-full h-80 overflow-y-auto bg-black/40 text-emerald-500 font-mono text-[9px] p-5 rounded-xl border border-slate-900 focus:outline-none select-text whitespace-pre-wrap leading-normal scrollbar-thin">
                  {rawText}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
