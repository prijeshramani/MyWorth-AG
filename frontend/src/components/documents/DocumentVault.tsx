import React, { useState } from 'react';
import { FileText, Upload, Trash2, Eye, Tag, Lock, ShieldCheck, Filter } from 'lucide-react';

interface DocumentItem {
  id: string;
  name: string;
  category: 'PAN' | 'Aadhaar' | 'Insurance' | 'Tax' | 'Property' | 'Bank' | 'Estate';
  size: string;
  uploadDate: string;
  linkedEntity: string;
}

const INITIAL_DOCS: DocumentItem[] = [
  { id: '1', name: 'PAN_Card_Rajesh_Sharma.pdf', category: 'PAN', size: '1.2 MB', uploadDate: '2026-05-10', linkedEntity: 'Rajesh Sharma' },
  { id: '2', name: 'Aadhaar_Priya_Sharma.pdf', category: 'Aadhaar', size: '2.4 MB', uploadDate: '2026-05-12', linkedEntity: 'Priya Sharma' },
  { id: '3', name: 'Max_Life_Policy_Document.pdf', category: 'Insurance', size: '4.8 MB', uploadDate: '2026-06-15', linkedEntity: 'Policy POL-9901' },
  { id: '4', name: 'ITR_V_Acknowledgement_FY2425.pdf', category: 'Tax', size: '850 KB', uploadDate: '2026-07-01', linkedEntity: 'Tax Profile 2024-25' },
  { id: '5', name: 'Property_Sale_Deed_Bangalore.pdf', category: 'Property', size: '12.5 MB', uploadDate: '2026-07-10', linkedEntity: 'Real Estate Holding' }
];

export const DocumentVault: React.FC = () => {
  const [docs, setDocs] = useState<DocumentItem[]>(INITIAL_DOCS);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [uploading, setUploading] = useState(false);

  const filteredDocs = selectedCategory === 'ALL'
    ? docs
    : docs.filter(d => d.category === selectedCategory);

  const handleSimulatedUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);

    setTimeout(() => {
      const newDoc: DocumentItem = {
        id: Date.now().toString(),
        name: file.name,
        category: 'Tax',
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        uploadDate: new Date().toISOString().split('T')[0],
        linkedEntity: 'Uploaded Document'
      };
      setDocs([newDoc, ...docs]);
      setUploading(false);
    }, 1000);
  };

  const handleDelete = (id: string) => {
    setDocs(docs.filter(d => d.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-800/80 pb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-6 h-6 text-indigo-400" />
            <h2 className="text-xl font-bold text-slate-100">Document Vault & Repository</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Secure vault for identity cards, insurance policies, tax acknowledgements, property deeds, and estate documents.
          </p>
        </div>

        <label className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer">
          <Upload className="w-4 h-4" />
          {uploading ? 'Uploading...' : 'Upload Document'}
          <input type="file" onChange={handleSimulatedUpload} className="hidden" disabled={uploading} />
        </label>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <span className="text-xs text-slate-500 font-mono flex items-center gap-1">
          <Filter className="w-3 h-3" /> Category:
        </span>
        {['ALL', 'PAN', 'Aadhaar', 'Insurance', 'Tax', 'Property', 'Bank', 'Estate'].map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1 rounded-full text-xs font-mono font-medium transition-colors ${
              selectedCategory === cat
                ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Document Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDocs.map((doc) => (
          <div key={doc.id} className="card-glass p-4 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-start justify-between">
                <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-indigo-400">
                  <FileText className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 font-semibold">
                  {doc.category}
                </span>
              </div>

              <h3 className="text-xs font-bold text-slate-100 mt-3 truncate" title={doc.name}>
                {doc.name}
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">Linked to: {doc.linkedEntity}</p>
            </div>

            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-500">
              <span>{doc.size} • {doc.uploadDate}</span>
              <div className="flex items-center gap-2">
                <button className="text-sky-400 hover:underline flex items-center gap-1">
                  <Eye className="w-3 h-3" /> View
                </button>
                <button onClick={() => handleDelete(doc.id)} className="text-rose-400 hover:underline">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
