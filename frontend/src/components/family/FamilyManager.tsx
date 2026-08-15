import React, { useState } from 'react';
import { Users, Plus, Edit2, Trash2, Check, ShieldCheck, Mail, Phone, FileText } from 'lucide-react';
import { useUiStore } from '../../store/useUiStore';
import { apiClient } from '../../services/apiClient';

interface FamilyMemberItem {
  id: number;
  name: string;
  relationship: 'Head' | 'Spouse' | 'Child' | 'Parent' | 'SELF' | 'SIBLING';
  pan: string;
  aadhaarLinked: boolean;
  email: string;
  phone: string;
  status: 'ACTIVE' | 'INACTIVE';
}

const INITIAL_MEMBERS: FamilyMemberItem[] = [
  { id: 1, name: 'Rajesh Sharma', relationship: 'Head', pan: 'ABCDE1234F', aadhaarLinked: true, email: 'rajesh@family.com', phone: '+91 9876543210', status: 'ACTIVE' },
  { id: 2, name: 'Priya Sharma', relationship: 'Spouse', pan: 'FGHIJ5678K', aadhaarLinked: true, email: 'priya@family.com', phone: '+91 9876543211', status: 'ACTIVE' },
  { id: 3, name: 'Aarav Sharma', relationship: 'Child', pan: 'KLMNO9012P', aadhaarLinked: true, email: 'aarav@family.com', phone: '+91 9876543212', status: 'ACTIVE' }
];

export const FamilyManager: React.FC = () => {
  const { datasetMode, activeFamilyId } = useUiStore();
  const [members, setMembers] = React.useState<FamilyMemberItem[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMemberItem | null>(null);

  const [newMember, setNewMember] = useState<Partial<FamilyMemberItem>>({
    name: '',
    relationship: 'Child',
    pan: '',
    aadhaarLinked: true,
    email: '',
    phone: '',
    status: 'ACTIVE'
  });

  const fetchMembers = React.useCallback(async () => {
    if (datasetMode === 'DEMO') {
      setMembers(INITIAL_MEMBERS);
      setLoading(false);
    } else {
      setLoading(true);
      try {
        const res = await apiClient.get<any[]>(`/family-members?familyId=${activeFamilyId}`);
        const raw = Array.isArray(res.data) ? res.data : [];
        const mapped: FamilyMemberItem[] = raw.map((m: any) => ({
          id: m.id,
          name: m.name,
          relationship: m.relationship || 'Member',
          pan: m.pan || m.pan_number || 'N/A',
          aadhaarLinked: m.aadhaarLinked ?? true,
          email: m.email || '',
          phone: m.phone || '',
          status: 'ACTIVE'
        }));
        setMembers(mapped);
      } catch {
        setMembers([]);
      } finally {
        setLoading(false);
      }
    }
  }, [datasetMode, activeFamilyId]);

  React.useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMember.name) return;

    if (datasetMode === 'DEMO') {
      const item: FamilyMemberItem = {
        id: Date.now(),
        name: newMember.name,
        relationship: newMember.relationship as any || 'Child',
        pan: newMember.pan?.toUpperCase() || 'NOT_PROVIDED',
        aadhaarLinked: !!newMember.aadhaarLinked,
        email: newMember.email || '',
        phone: newMember.phone || '',
        status: 'ACTIVE'
      };
      setMembers([...members, item]);
    } else {
      try {
        await apiClient.post('/family-members', {
          familyId: activeFamilyId,
          family_id: activeFamilyId,
          name: newMember.name.trim(),
          relationship: (newMember.relationship === 'Head' ? 'SELF' : newMember.relationship?.toUpperCase()) || 'OTHER',
          pan: newMember.pan?.trim().toUpperCase() || undefined,
          email: newMember.email?.trim() || undefined,
          phone: newMember.phone?.trim() || undefined,
          dateOfBirth: '1990-01-01',
          date_of_birth: '1990-01-01'
        });
        await fetchMembers();
      } catch (err: any) {
        console.error('Failed to add member to database', err);
        alert(err.response?.data?.error?.message || err.message || 'Failed to add family member');
      }
    }
    setShowAddModal(false);
    setNewMember({ name: '', relationship: 'Child', pan: '', aadhaarLinked: true, email: '', phone: '' });
  };

  const handleOpenEditModal = (member: FamilyMemberItem) => {
    setEditingMember({ ...member });
    setShowEditModal(true);
  };

  const handleUpdateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember || !editingMember.name.trim()) return;

    if (datasetMode === 'DEMO') {
      setMembers(members.map(m => m.id === editingMember.id ? editingMember : m));
    } else {
      try {
        await apiClient.put(`/v1/family-members/${editingMember.id}`, {
          name: editingMember.name.trim(),
          relationship: (editingMember.relationship === 'Head' ? 'SELF' : editingMember.relationship.toUpperCase()),
          pan: editingMember.pan && editingMember.pan !== 'N/A' ? editingMember.pan.trim().toUpperCase() : undefined,
          email: editingMember.email?.trim() || undefined,
          phone: editingMember.phone?.trim() || undefined
        });
        await fetchMembers();
      } catch (err: any) {
        console.error('Failed to update family member', err);
        alert(err.response?.data?.error?.message || err.message || 'Failed to update family member');
      }
    }
    setShowEditModal(false);
    setEditingMember(null);
  };

  const handleDeleteMember = async (id: number) => {
    if (datasetMode === 'DEMO') {
      setMembers(members.filter(m => m.id !== id));
    } else {
      try {
        await apiClient.delete(`/v1/family-members/${id}`);
        setMembers(members.filter(m => m.id !== id));
      } catch (err) {
        console.error('Failed to delete family member', err);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-800/80 pb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-sky-400" />
            <h2 className="text-xl font-bold text-slate-100">Family & Members Management</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Manage family members, ownership entities, KYC credentials, and relationship roles.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Family Member
        </button>
      </div>

      {/* Member Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {members.map((m) => (
          <div key={m.id} className="card-glass p-5 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-100">{m.name}</h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 font-semibold inline-block mt-1">
                    {m.relationship}
                  </span>
                </div>
                <button
                  onClick={() => handleDeleteMember(m.id)}
                  className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                  title="Remove Member"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-4 space-y-2 text-xs font-mono text-slate-400">
                <div className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  <span>PAN: {m.pan}</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Aadhaar: {m.aadhaarLinked ? 'LINKED' : 'NOT LINKED'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-500" />
                  <span>{m.email || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-500" />
                  <span>{m.phone || 'N/A'}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
              <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                <Check className="w-3 h-3" /> {m.status}
              </span>
              <button 
                onClick={() => handleOpenEditModal(m)}
                className="text-sky-400 hover:text-sky-300 hover:underline flex items-center gap-1 font-semibold transition-colors"
              >
                <Edit2 className="w-3 h-3" /> Edit Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleAddMember} className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 w-full max-w-md space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Add New Family Member</h3>

            <div>
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">Full Name</label>
              <input
                type="text"
                required
                value={newMember.name}
                onChange={e => setNewMember({ ...newMember, name: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-sky-500"
                placeholder="e.g. Ananya Sharma"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">Relationship</label>
                <select
                  value={newMember.relationship}
                  onChange={e => setNewMember({ ...newMember, relationship: e.target.value as any })}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
                >
                  <option value="Head">Head</option>
                  <option value="Spouse">Spouse</option>
                  <option value="Child">Child</option>
                  <option value="Parent">Parent</option>
                  <option value="Sibling">Sibling</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">PAN Number</label>
                <input
                  type="text"
                  value={newMember.pan}
                  onChange={e => setNewMember({ ...newMember, pan: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
                  placeholder="ABCDE1234F"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">Email</label>
                <input
                  type="email"
                  value={newMember.email}
                  onChange={e => setNewMember({ ...newMember, email: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
                  placeholder="ananya@example.com"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">Phone</label>
                <input
                  type="text"
                  value={newMember.phone}
                  onChange={e => setNewMember({ ...newMember, phone: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
                  placeholder="+91 9876543210"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-xl shadow-md shadow-sky-600/20 transition-colors"
              >
                Save Member
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Member Modal */}
      {showEditModal && editingMember && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleUpdateMember} className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 w-full max-w-md space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Edit Family Member Details</h3>

            <div>
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">Full Name</label>
              <input
                type="text"
                required
                value={editingMember.name}
                onChange={e => setEditingMember({ ...editingMember, name: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">Relationship</label>
                <select
                  value={editingMember.relationship}
                  onChange={e => setEditingMember({ ...editingMember, relationship: e.target.value as any })}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
                >
                  <option value="Head">Head</option>
                  <option value="SELF">SELF</option>
                  <option value="Spouse">Spouse</option>
                  <option value="Child">Child</option>
                  <option value="Parent">Parent</option>
                  <option value="Sibling">Sibling</option>
                  <option value="OTHER">OTHER</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">PAN Number</label>
                <input
                  type="text"
                  value={editingMember.pan === 'N/A' ? '' : editingMember.pan}
                  onChange={e => setEditingMember({ ...editingMember, pan: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
                  placeholder="ABCDE1234F"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">Email</label>
                <input
                  type="email"
                  value={editingMember.email}
                  onChange={e => setEditingMember({ ...editingMember, email: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
                  placeholder="member@example.com"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">Phone</label>
                <input
                  type="text"
                  value={editingMember.phone}
                  onChange={e => setEditingMember({ ...editingMember, phone: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
                  placeholder="+91 9876543210"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => { setShowEditModal(false); setEditingMember(null); }}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-xl shadow-md shadow-sky-600/20 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
