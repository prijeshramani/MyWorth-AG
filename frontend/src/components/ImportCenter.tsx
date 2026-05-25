import React, { useState, useRef, useEffect } from 'react';
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
  Square 
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ParsedTx {
  assetName: string;
  assetType: 'MUTUAL_FUND' | 'STOCK' | 'NPS';
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
}

export default function ImportCenter({ initialKiteRequestToken, clearKiteRequestToken }: ImportCenterProps = {}) {
  const [importMethod, setImportMethod] = useState<'file' | 'kite'>('file');
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState<string>('');
  const [parsing, setParsing] = useState<boolean>(false);
  
  // Kite Connect configuration states
  const [apiKey, setApiKey] = useState<string>('');
  const [apiSecret, setApiSecret] = useState<string>('');
  const [isConfigured, setIsConfigured] = useState<boolean>(false);
  const [showConfigForm, setShowConfigForm] = useState<boolean>(false);
  const [savingConfig, setSavingConfig] = useState<boolean>(false);

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

  useEffect(() => {
    fetchKiteConfig();
  }, []);

  useEffect(() => {
    if (initialKiteRequestToken) {
      console.log('Automated redirect exchange active. request_token found.');
      handleKiteTokenExchange(initialKiteRequestToken);
    }
  }, [initialKiteRequestToken]);

  const fetchKiteConfig = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/import/kite/config');
      if (res.ok) {
        const data = await res.json();
        setIsConfigured(data.configured);
        setApiKey(data.apiKey);
      }
    } catch (err) {
      console.error('Failed to fetch Kite Connect settings:', err);
    }
  };

  const handleSaveKiteConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingConfig(true);
    setError('');
    try {
      const res = await fetch('http://localhost:5000/api/import/kite/config', {
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
      const res = await fetch('http://localhost:5000/api/import/kite/login-url');
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
      const res = await fetch('http://localhost:5000/api/import/kite/session', {
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

        if (data.transactions.length === 0) {
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
      const res = await fetch('http://localhost:5000/api/import/parse', {
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
      const res = await fetch('http://localhost:5000/api/import/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactions: txsToImport })
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
        fetch('http://localhost:5000/api/sync', { method: 'POST' })
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
        <div className="max-w-3xl mx-auto card-glass p-8 rounded-3xl">
          {/* Method Selector Tabs */}
          <div className="flex p-1 bg-slate-950/60 border border-slate-900 rounded-xl mb-6 max-w-md mx-auto">
            <button
              type="button"
              onClick={() => setImportMethod('file')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                importMethod === 'file' 
                  ? 'bg-indigo-600 text-white shadow shadow-indigo-600/10' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileUp className="w-4 h-4" />
              Offline Statements
            </button>
            <button
              type="button"
              onClick={() => setImportMethod('kite')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                importMethod === 'kite' 
                  ? 'bg-indigo-600 text-white shadow shadow-indigo-600/10' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <RefreshCw className="w-4 h-4" />
              Zerodha Kite API
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
          ) : (
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
          )}

          {error && (
            <div className="mt-6 p-4 bg-red-950/20 border border-red-900/40 text-red-400 text-xs rounded-xl flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Parsing Issue:</span> {error}
              </div>
            </div>
          )}

          {importSummary && (
            <div className="mt-6 p-4 bg-emerald-950/20 border border-emerald-900/40 text-emerald-400 text-xs rounded-xl flex items-start gap-2.5">
              <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Import Complete!</span> Registered{' '}
                <code className="bg-emerald-900/40 px-1.5 py-0.5 rounded text-white font-bold">{importSummary.assetsCreated}</code> new asset portfolios and imported{' '}
                <code className="bg-emerald-900/40 px-1.5 py-0.5 rounded text-white font-bold">{importSummary.transactionsImported}</code> transactions ({importSummary.duplicatesSkipped} duplicates safely skipped).
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
