import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileText,
  Plus,
  Trash2,
  CheckCircle,
  Clock,
  Filter,
  DollarSign,
  X,
  CreditCard,
  IndianRupee,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import { Expense, LanguageType } from '../types';
import { translations } from '../translations';

interface ExpensesLedgerViewProps {
  expenses: Expense[];
  onAddExpense: (description: string, amount: number, category: string, status: 'Settled' | 'Pending', date: string) => void;
  onDeleteExpense: (id: string) => void;
  onToggleExpenseStatus: (id: string) => void;
  lang: LanguageType;
}

export default function ExpensesLedgerView({
  expenses,
  onAddExpense,
  onDeleteExpense,
  onToggleExpenseStatus,
  lang,
}: ExpensesLedgerViewProps) {
  const t = translations[lang];

  // UI States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'All' | 'Settled' | 'Pending'>('All');
  const [filterCategory, setFilterCategory] = useState<string>('All');

  // Form Fields
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Rent & Utilities');
  const [status, setStatus] = useState<'Settled' | 'Pending'>('Settled');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!desc.trim() || !amount) return;
    onAddExpense(
      desc.trim(),
      parseFloat(amount) || 0,
      category,
      status,
      date
    );
    // Reset Form
    setDesc('');
    setAmount('');
    setIsFormOpen(false);
  };

  // Summaries
  const totalSettled = expenses
    .filter((e) => e.status === 'Settled')
    .reduce((acc, e) => acc + e.amount, 0);

  const totalPending = expenses
    .filter((e) => e.status === 'Pending')
    .reduce((acc, e) => acc + e.amount, 0);

  // Filter list
  const filteredExpenses = expenses.filter((e) => {
    const matchesStatus = filterStatus === 'All' ? true : e.status === filterStatus;
    const matchesCategory = filterCategory === 'All' ? true : e.category === filterCategory;
    return matchesStatus && matchesCategory;
  });

  const categories = [
    'Rent & Utilities',
    'Staff Salary',
    'Stock Purchase',
    'Miscellaneous'
  ];

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'Stock Purchase': return t.categoryPurchase;
      case 'Staff Salary': return t.categorySalary;
      case 'Rent & Utilities': return t.categoryRent;
      default: return t.categoryOther;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Ledger and Actions banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200/60 p-6 rounded-2xl shadow-sm shadow-slate-100/50">
        <h2 className="text-xl font-serif font-extrabold text-slate-900 tracking-tight flex items-center space-x-2">
          <FileText className="w-5 h-5 text-[#B48243]" />
          <span>{lang === 'Telugu' ? 'ఖర్చుల రిజిస్టర్ & బాకీల పట్టిక' : 'Business Outflows & Expenses Ledger'}</span>
        </h2>
        <button
          onClick={() => setIsFormOpen(true)}
          className="flex items-center space-x-1.5 px-4 py-2.5 text-xs font-bold bg-[#B48243] hover:bg-[#A2784C] text-white rounded-xl transition-all shadow-md shadow-amber-800/10 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-[#FAF3EA]" />
          <span>{t.addExpense}</span>
        </button>
      </div>

      {/* Expense Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="bg-white border border-slate-200/60 p-5 rounded-2xl flex items-center justify-between shadow-sm shadow-slate-100/50">
          <div className="space-y-0.5">
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{lang === 'Telugu' ? 'చెల్లించిన మొత్తం' : 'Total Settled Outflows'}</span>
            <span className="text-xl font-bold text-slate-900 block font-sans">₹{totalSettled.toLocaleString('en-IN')}</span>
          </div>
          <div className="p-2.5 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-lg">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/60 p-5 rounded-2xl flex items-center justify-between shadow-sm shadow-slate-100/50">
          <div className="space-y-0.5">
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{lang === 'Telugu' ? 'బాకీ ఉన్న మొత్తం' : 'Total Pending Obligations'}</span>
            <span className="text-xl font-bold text-amber-600 block font-sans">₹{totalPending.toLocaleString('en-IN')}</span>
          </div>
          <div className="p-2.5 bg-amber-50 border border-amber-100 text-amber-600 rounded-lg">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Log Form collapsible */}
      <AnimatePresence>
        {isFormOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white border border-slate-200 p-5 rounded-xl shadow-md overflow-hidden"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-4">
              <h3 className="text-xs font-bold text-[#B48243] uppercase tracking-wider">
                {lang === 'Telugu' ? 'కొత్త వ్యాపార ఖర్చు నమోదు చేయండి' : 'Record Outflow Entry'}
              </h3>
              <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-500 block">{t.description} *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Warehouse electricity bill"
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#B48243] transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-slate-500 block">{t.amount} *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    placeholder="₹ Price"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#B48243] transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-slate-500 block">{t.category}</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#B48243] transition-colors"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {getCategoryLabel(cat)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-slate-500 block">{t.status}</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'Settled' | 'Pending')}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#B48243] transition-colors"
                  >
                    <option value="Settled">{t.settled}</option>
                    <option value="Pending">{t.pending}</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-slate-500 block">Date</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#B48243] transition-colors"
                  />
                </div>

              </div>
              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
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

      {/* Multi-Filters Panel */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Status Toggle filter */}
        <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm self-start">
          {(['All', 'Settled', 'Pending'] as const).map((stat) => (
            <button
              key={stat}
              onClick={() => setFilterStatus(stat)}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                filterStatus === stat
                  ? 'bg-[#FAF3EA] text-[#B48243] border border-[#F4E6D4]/60 shadow-sm'
                  : 'text-slate-500 hover:text-slate-955'
              }`}
            >
              {stat === 'All' ? t.all : stat === 'Settled' ? t.settled : t.pending}
            </button>
          ))}
        </div>

        {/* Category dropdown filter */}
        <div className="relative flex-1 sm:max-w-xs">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none"
          >
            <option value="All">{lang === 'Telugu' ? 'అన్ని కేటగిరీలు' : 'All Categories'}</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {getCategoryLabel(cat)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        {filteredExpenses.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">
            {t.noExpenses}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table id="expenses_table" className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">{t.description}</th>
                  <th className="px-5 py-3">{t.category}</th>
                  <th className="px-5 py-3 text-right">{t.amount}</th>
                  <th className="px-5 py-3 text-center">{t.status}</th>
                  <th className="px-5 py-3 text-center">{t.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredExpenses.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/80 transition-colors text-slate-600">
                    <td className="px-5 py-3.5 font-mono text-slate-400">
                      {new Date(e.date).toLocaleDateString(lang === 'Telugu' ? 'te-IN' : 'en-US')}
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-slate-800">{e.description}</td>
                    <td className="px-5 py-3.5 text-slate-500">{getCategoryLabel(e.category)}</td>
                    <td className="px-5 py-3.5 text-right font-mono font-semibold text-rose-600">
                      ₹{e.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <button
                        onClick={() => onToggleExpenseStatus(e.id)}
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold border cursor-pointer hover:scale-105 transition-all ${
                          e.status === 'Settled'
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                            : 'bg-amber-50 border-amber-200 text-amber-600'
                        }`}
                        title="Click to toggle status"
                      >
                        {e.status === 'Settled' ? (
                          <span className="flex items-center space-x-1">
                            <CheckCircle className="w-3 h-3 shrink-0" />
                            <span>{t.settled}</span>
                          </span>
                        ) : (
                          <span className="flex items-center space-x-1">
                            <Clock className="w-3 h-3 shrink-0" />
                            <span>{t.pending}</span>
                          </span>
                        )}
                      </button>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <button
                        onClick={() => onDeleteExpense(e.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete Ledger Entry"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
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
