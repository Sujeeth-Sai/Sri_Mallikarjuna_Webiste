import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users,
  UserPlus,
  Mail,
  Phone,
  MapPin,
  Trash2,
  Edit2,
  X,
  Search,
  Check,
  UserCheck
} from 'lucide-react';
import { SupplierCustomer, LanguageType } from '../types';
import { translations } from '../translations';

interface SuppliersCustomersViewProps {
  contacts: SupplierCustomer[];
  onAddContact: (name: string, type: 'Supplier' | 'Customer', email: string, phone: string, address: string) => void;
  onEditContact: (id: string, name: string, type: 'Supplier' | 'Customer', email: string, phone: string, address: string) => void;
  onDeleteContact: (id: string) => void;
  lang: LanguageType;
}

export default function SuppliersCustomersView({
  contacts,
  onAddContact,
  onEditContact,
  onDeleteContact,
  lang,
}: SuppliersCustomersViewProps) {
  const t = translations[lang];

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'All' | 'Supplier' | 'Customer'>('All');

  // Form states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [type, setType] = useState<'Supplier' | 'Customer'>('Supplier');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  // Editing fields
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState<'Supplier' | 'Customer'>('Supplier');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAddContact(name.trim(), type, email.trim(), phone.trim(), address.trim());
    resetForm();
  };

  const handleEditSubmit = (e: React.FormEvent, id: string) => {
    e.preventDefault();
    if (!editName.trim()) return;
    onEditContact(id, editName.trim(), editType, editEmail.trim(), editPhone.trim(), editAddress.trim());
    setEditingId(null);
  };

  const startEdit = (c: SupplierCustomer) => {
    setEditingId(c.id);
    setEditName(c.name);
    setEditType(c.type);
    setEditEmail(c.email);
    setEditPhone(c.phone);
    setEditAddress(c.address);
  };

  const resetForm = () => {
    setName('');
    setType('Supplier');
    setEmail('');
    setPhone('');
    setAddress('');
    setIsAddOpen(false);
  };

  const filteredContacts = contacts.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery) ||
      c.address.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = filterType === 'All' ? true : c.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      
      {/* Top Banner and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200/60 p-6 rounded-2xl shadow-sm shadow-slate-100/50">
        <h2 className="text-xl font-serif font-extrabold text-slate-900 tracking-tight flex items-center space-x-2">
          <Users className="w-5 h-5 text-[#B48243]" />
          <span>{lang === 'Telugu' ? 'ఖాతాదారులు & వర్తకులు' : 'Suppliers & Customers Registry'}</span>
        </h2>
        <button
          onClick={() => setIsAddOpen(true)}
          className="flex items-center space-x-1.5 px-4 py-2.5 text-xs font-bold bg-[#B48243] hover:bg-[#A2784C] text-white rounded-xl transition-all shadow-md shadow-amber-800/10 cursor-pointer self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4 text-[#FAF3EA]" />
          <span>{t.addContact}</span>
        </button>
      </div>

      {/* Slide-out or Collapsible Add Form */}
      <AnimatePresence>
        {isAddOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white border border-slate-200 p-5 rounded-xl shadow-md overflow-hidden"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-4">
              <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                {lang === 'Telugu' ? 'కొత్త ఖాతాదారు/వర్తకుడిని చేర్చండి' : 'Create Contact Register'}
              </h3>
              <button onClick={resetForm} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-500 block">{t.contactName} *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rama Trading Corp"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-slate-500 block">{t.contactType}</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as 'Supplier' | 'Customer')}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 transition-colors"
                  >
                    <option value="Supplier">{t.supplier}</option>
                    <option value="Customer">{t.customer}</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-slate-500 block">{t.email}</label>
                  <input
                    type="email"
                    placeholder="rama@trading.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-slate-500 block">{t.phone}</label>
                  <input
                    type="tel"
                    placeholder="+91 9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-slate-500 block">{t.address}</label>
                  <input
                    type="text"
                    placeholder="Vijayawada, AP"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

              </div>
              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold bg-[#B48243] hover:bg-[#A2784C] text-white rounded-lg cursor-pointer"
                >
                  {t.add}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder={lang === 'Telugu' ? 'పేరు, ఫోన్ లేదా ఇమెయిల్ ద్వారా వెతకండి...' : 'Search registry by name, phone, address...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#B48243] transition-colors"
          />
        </div>
        <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
          {(['All', 'Supplier', 'Customer'] as const).map((tType) => (
            <button
              key={tType}
              onClick={() => setFilterType(tType)}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                filterType === tType
                  ? 'bg-[#FAF3EA] text-[#B48243] border border-[#F4E6D4]/60 shadow-sm'
                  : 'text-slate-500 hover:text-slate-950'
              }`}
            >
              {tType === 'All' ? t.all : tType === 'Supplier' ? t.supplier : t.customer}
            </button>
          ))}
        </div>
      </div>

      {/* Registers List Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        {filteredContacts.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">
            {t.noContacts}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table id="contacts_table" className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="px-5 py-3">{t.contactName}</th>
                  <th className="px-5 py-3">{t.contactType}</th>
                  <th className="px-5 py-3">{t.email}</th>
                  <th className="px-5 py-3">{t.phone}</th>
                  <th className="px-5 py-3">{t.address}</th>
                  <th className="px-5 py-3 text-center">{t.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredContacts.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors text-slate-600">
                    {editingId === c.id ? (
                      /* Inline EDITING Row */
                      <>
                        <td className="px-5 py-2">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 w-full"
                          />
                        </td>
                        <td className="px-5 py-2">
                          <select
                            value={editType}
                            onChange={(e) => setEditType(e.target.value as 'Supplier' | 'Customer')}
                            className="bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-800 focus:outline-none w-full"
                          >
                            <option value="Supplier">{t.supplier}</option>
                            <option value="Customer">{t.customer}</option>
                          </select>
                        </td>
                        <td className="px-5 py-2">
                          <input
                            type="email"
                            value={editEmail}
                            onChange={(e) => setEditEmail(e.target.value)}
                            className="bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-800 focus:outline-none w-full"
                          />
                        </td>
                        <td className="px-5 py-2">
                          <input
                            type="tel"
                            value={editPhone}
                            onChange={(e) => setEditPhone(e.target.value)}
                            className="bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-800 focus:outline-none w-full"
                          />
                        </td>
                        <td className="px-5 py-2">
                          <input
                            type="text"
                            value={editAddress}
                            onChange={(e) => setEditAddress(e.target.value)}
                            className="bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-800 focus:outline-none w-full"
                          />
                        </td>
                        <td className="px-5 py-2 text-center">
                          <div className="flex items-center justify-center space-x-1.5">
                            <button
                              onClick={(e) => handleEditSubmit(e, c.id)}
                              className="p-1 text-emerald-600 hover:text-emerald-500 rounded bg-emerald-50 hover:bg-emerald-100"
                              title="Save Changes"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="p-1 text-slate-500 hover:text-slate-800 rounded bg-slate-100 hover:bg-slate-200"
                              title="Cancel"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      /* Display Row */
                      <>
                        <td className="px-5 py-3 font-semibold text-slate-800">{c.name}</td>
                        <td className="px-5 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                            c.type === 'Supplier'
                              ? 'bg-indigo-50 border-indigo-100 text-indigo-600'
                              : 'bg-emerald-50 border-emerald-100 text-emerald-600'
                          }`}>
                            {c.type === 'Supplier' ? t.supplier : t.customer}
                          </span>
                        </td>
                        <td className="px-5 py-3 font-mono text-slate-500">
                          {c.email ? (
                            <span className="flex items-center space-x-1">
                              <Mail className="w-3.5 h-3.5 opacity-70" />
                              <span>{c.email}</span>
                            </span>
                          ) : '—'}
                        </td>
                        <td className="px-5 py-3 font-mono text-slate-500">
                          {c.phone ? (
                            <span className="flex items-center space-x-1">
                              <Phone className="w-3.5 h-3.5 opacity-70" />
                              <span>{c.phone}</span>
                            </span>
                          ) : '—'}
                        </td>
                        <td className="px-5 py-3 text-slate-500">
                          {c.address ? (
                            <span className="flex items-center space-x-1">
                              <MapPin className="w-3.5 h-3.5 opacity-70 shrink-0" />
                              <span className="truncate max-w-xs">{c.address}</span>
                            </span>
                          ) : '—'}
                        </td>
                        <td className="px-5 py-3 text-center">
                          <div className="flex items-center justify-center space-x-1.5">
                            <button
                              onClick={() => startEdit(c)}
                              className="p-1.5 text-slate-500 hover:text-indigo-600 rounded-md hover:bg-indigo-50 transition-all cursor-pointer"
                              title="Edit Registry"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onDeleteContact(c.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-all cursor-pointer"
                              title="Delete Registry"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
