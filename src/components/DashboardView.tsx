import React from 'react';
import { motion } from 'motion/react';
import {
  TrendingUp,
  TrendingDown,
  Layers,
  IndianRupee,
  Activity,
  Calendar,
  DollarSign,
  Briefcase
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { Product, StockMovement, Expense, Staff, ActivityLog, LanguageType } from '../types';
import { translations } from '../translations';

interface DashboardViewProps {
  products: Product[];
  movements: StockMovement[];
  expenses: Expense[];
  staff: Staff[];
  logs: ActivityLog[];
  lang: LanguageType;
}

export default function DashboardView({
  products,
  movements,
  expenses,
  staff,
  logs,
  lang,
}: DashboardViewProps) {
  const t = translations[lang];

  // Calculations
  // Total Inventory Value = Sum of (stock * costPerKg)
  const totalInventoryValue = products.reduce((acc, p) => acc + (p.stock * p.costPerKg), 0);

  // Total Revenue = Sum of OUT movements (quantity * pricePerKg)
  const totalRevenue = movements
    .filter((m) => m.type === 'OUT')
    .reduce((acc, m) => acc + (m.quantity * m.pricePerKg), 0);

  // Total Expenses = Sum of IN movements (quantity * pricePerKg) + Logged Expenses (amount) + Staff Salaries
  const stockPurchaseExpenses = movements
    .filter((m) => m.type === 'IN')
    .reduce((acc, m) => acc + (m.quantity * m.pricePerKg), 0);

  const loggedExpensesVal = expenses.reduce((acc, e) => acc + e.amount, 0);
  const staffSalariesVal = staff.reduce((acc, s) => acc + s.salary, 0);

  const totalExpenses = stockPurchaseExpenses + loggedExpensesVal + staffSalariesVal;
  const netProfit = totalRevenue - totalExpenses;

  // Chart Data: Financial trends (Simulated over recent days/months to show a beautiful graph)
  // Let's group movements by date to show a beautiful chronological trend
  const sortedMovements = [...movements].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  // Create last 7 days chart data
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });

  const chartData = last7Days.map((dateStr) => {
    const dateObj = new Date(dateStr);
    const dayName = dateObj.toLocaleDateString(lang === 'Telugu' ? 'te-IN' : 'en-US', { weekday: 'short' });
    
    // Revenue for this day
    const rev = movements
      .filter((m) => m.type === 'OUT' && m.date.startsWith(dateStr))
      .reduce((sum, m) => sum + (m.quantity * m.pricePerKg), 0);

    // Expenses for this day
    const expMov = movements
      .filter((m) => m.type === 'IN' && m.date.startsWith(dateStr))
      .reduce((sum, m) => sum + (m.quantity * m.pricePerKg), 0);
    const expLogged = expenses
      .filter((e) => e.date === dateStr)
      .reduce((sum, e) => sum + e.amount, 0);

    return {
      name: dayName,
      date: dateStr,
      Revenue: rev,
      Expenses: expMov + expLogged,
    };
  });

  // Expense breakdown data for Pie Chart
  const expenseCategories = [
    { name: t.categoryPurchase, value: stockPurchaseExpenses, color: '#6366f1' }, // Indigo
    { name: t.categorySalary, value: staffSalariesVal, color: '#f59e0b' }, // Amber
    { name: t.categoryRent, value: expenses.filter(e => e.category === 'Rent' || e.category === 'Utilities').reduce((sum, e) => sum + e.amount, 0), color: '#3b82f6' }, // Blue
    { name: t.categoryOther, value: expenses.filter(e => e.category !== 'Rent' && e.category !== 'Utilities').reduce((sum, e) => sum + e.amount, 0), color: '#10b981' } // Emerald
  ].filter(c => c.value > 0);

  // If no expenses exist yet, display a placeholder breakdown
  const pieData = expenseCategories.length > 0 ? expenseCategories : [
    { name: 'Stock Purchase', value: 1, color: '#e2e8f0' }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 100 } },
  };

  const getLogIcon = (type: ActivityLog['type']) => {
    switch (type) {
      case 'product_add': return <Layers className="w-4 h-4 text-emerald-600" />;
      case 'stock_in': return <TrendingUp className="w-4 h-4 text-indigo-600" />;
      case 'stock_out': return <TrendingDown className="w-4 h-4 text-amber-600" />;
      case 'contact': return <Briefcase className="w-4 h-4 text-blue-600" />;
      case 'attendance': return <Calendar className="w-4 h-4 text-violet-600" />;
      case 'expense': return <IndianRupee className="w-4 h-4 text-rose-600" />;
      default: return <Activity className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* KPI Cards Grid */}
      <div id="kpi_grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Card 1: Total Inventory Value */}
        <motion.div
          variants={itemVariants}
          className="bg-white border border-slate-200/60 p-5 rounded-2xl flex items-center justify-between shadow-sm shadow-slate-100/50"
        >
          <div className="space-y-1">
            <span className="text-xs text-[#B48243] font-serif font-bold tracking-wide block uppercase">{t.totalInventoryValue}</span>
            <span className="text-2xl font-serif font-extrabold text-slate-900 block">₹{totalInventoryValue.toLocaleString('en-IN')}</span>
            <span className="text-[10px] text-slate-400 block">{t.valueText}</span>
          </div>
          <div className="p-3 bg-amber-50/70 border border-amber-100 text-[#B48243] rounded-xl">
            <Layers className="w-5 h-5" />
          </div>
        </motion.div>

        {/* Card 2: Total Revenue */}
        <motion.div
          variants={itemVariants}
          className="bg-white border border-slate-200/60 p-5 rounded-2xl flex items-center justify-between shadow-sm shadow-slate-100/50"
        >
          <div className="space-y-1">
            <span className="text-xs text-[#B48243] font-serif font-bold tracking-wide block uppercase">{t.totalRevenue}</span>
            <span className="text-2xl font-serif font-extrabold text-slate-900 block">₹{totalRevenue.toLocaleString('en-IN')}</span>
            <span className="text-[10px] text-slate-400 block">{movements.filter(m => m.type === 'OUT').length} orders completed</span>
          </div>
          <div className="p-3 bg-emerald-50/70 border border-emerald-100/80 text-emerald-600 rounded-xl">
            <TrendingUp className="w-5 h-5" />
          </div>
        </motion.div>

        {/* Card 3: Total Expenses */}
        <motion.div
          variants={itemVariants}
          className="bg-white border border-slate-200/60 p-5 rounded-2xl flex items-center justify-between shadow-sm shadow-slate-100/50"
        >
          <div className="space-y-1">
            <span className="text-xs text-[#B48243] font-serif font-bold tracking-wide block uppercase">{t.totalExpenses}</span>
            <span className="text-2xl font-serif font-extrabold text-slate-900 block">₹{totalExpenses.toLocaleString('en-IN')}</span>
            <span className="text-[10px] text-slate-400 block">Stock, salaries & logs</span>
          </div>
          <div className="p-3 bg-rose-50/70 border border-rose-100/80 text-rose-600 rounded-xl">
            <TrendingDown className="w-5 h-5" />
          </div>
        </motion.div>

        {/* Card 4: Net Profit */}
        <motion.div
          variants={itemVariants}
          className="bg-white border border-slate-200/60 p-5 rounded-2xl flex items-center justify-between shadow-sm shadow-slate-100/50"
        >
          <div className="space-y-1">
            <span className="text-xs text-[#B48243] font-serif font-bold tracking-wide block uppercase">{t.netProfit}</span>
            <span className={`text-2xl font-serif font-extrabold block ${netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
              ₹{netProfit.toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] text-slate-400 block">Overall margins</span>
          </div>
          <div className={`p-3 rounded-xl border ${netProfit >= 0 ? 'bg-emerald-50/70 border-emerald-100 text-emerald-700' : 'bg-rose-50/70 border-rose-100 text-rose-600'}`}>
            <IndianRupee className="w-5 h-5" />
          </div>
        </motion.div>

      </div>

      {/* Analytics Charts & Activity Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Trend Area Chart (Columns 1 & 2) */}
        <motion.div
          variants={itemVariants}
          className="lg:col-span-2 bg-white border border-slate-200/60 p-5 rounded-2xl shadow-sm shadow-slate-100/50 space-y-4"
        >
          <div>
            <h3 className="text-sm font-serif font-bold text-slate-900 uppercase tracking-wider">{t.financialOverview}</h3>
            <p className="text-xs text-slate-500">{t.revenueVsExpenses} (7-Day Activity)</p>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px' }}
                  labelStyle={{ color: '#1e293b', fontWeight: 'bold' }}
                />
                <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: 12, color: '#1e293b' }} />
                <Area type="monotone" dataKey="Revenue" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" name={t.totalRevenue} />
                <Area type="monotone" dataKey="Expenses" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#colorExp)" name={t.totalExpenses} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Expense Category Split Pie Chart (Column 3) */}
        <motion.div
          variants={itemVariants}
          className="bg-white border border-slate-200/60 p-5 rounded-2xl shadow-sm shadow-slate-100/50 flex flex-col justify-between"
        >
          <div>
            <h3 className="text-sm font-serif font-bold text-slate-900 uppercase tracking-wider">{lang === 'Telugu' ? 'ఖర్చుల వర్గీకరణ' : 'Expense Distribution'}</h3>
            <p className="text-xs text-slate-500">{lang === 'Telugu' ? 'మొత్తం ఖర్చుల నిష్పత్తి' : 'Breakdown by categories'}</p>
          </div>

          <div className="h-52 flex items-center justify-center">
            {expenseCategories.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px' }}
                    formatter={(value) => [`₹${(value as number).toLocaleString('en-IN')}`, 'Amount']}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-slate-400 text-xs">
                {lang === 'Telugu' ? 'ఖర్చులు ఏవీ నమోదు కాలేదు' : 'No expenses to analyze yet'}
              </div>
            )}
          </div>

          {/* Custom Legends */}
          <div className="space-y-2 mt-4">
            {expenseCategories.length > 0 ? (
              expenseCategories.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="w-3 h-3 rounded-full block" style={{ backgroundColor: item.color }} />
                    <span className="text-slate-700 font-medium">{item.name}</span>
                  </div>
                  <span className="text-slate-600 font-mono">₹{item.value.toLocaleString('en-IN')}</span>
                </div>
              ))
            ) : (
              <div className="text-center text-slate-400 text-[10px]">
                {lang === 'Telugu' ? 'విశ్లేషణ కోసం డేటా లేదు' : 'Register transactions to view insights'}
              </div>
            )}
          </div>
        </motion.div>

      </div>

      {/* Activity Logs Timeline */}
      <motion.div
        variants={itemVariants}
        className="bg-white border border-slate-200/60 p-5 rounded-2xl shadow-sm shadow-slate-100/50 space-y-4"
      >
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-[#B48243]" />
            <h3 className="text-sm font-serif font-bold text-slate-900 uppercase tracking-wider">{t.activityLog}</h3>
          </div>
          <span className="text-[10px] text-[#B48243] bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100/80 font-mono font-bold">
            {logs.length} Total Logs
          </span>
        </div>

        <div className="max-h-60 overflow-y-auto pr-2 space-y-3 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
          {logs.length > 0 ? (
            logs.map((log) => {
              const dateObj = new Date(log.date);
              const timeString = dateObj.toLocaleTimeString(lang === 'Telugu' ? 'te-IN' : 'en-US', {
                hour: '2-digit',
                minute: '2-digit',
              });
              const dateString = dateObj.toLocaleDateString(lang === 'Telugu' ? 'te-IN' : 'en-US', {
                month: 'short',
                day: 'numeric',
              });

              return (
                <div key={log.id} className="flex items-start space-x-3 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100 hover:border-slate-200 transition-colors">
                  <div className="p-1.5 bg-white border border-slate-200 rounded-md shrink-0">
                    {getLogIcon(log.type)}
                  </div>
                  <div className="flex-1 space-y-0.5">
                    <p className="text-slate-800 font-medium leading-relaxed">{log.message}</p>
                    <div className="flex items-center space-x-1.5 text-[10px] text-slate-400">
                      <span>{dateString}</span>
                      <span>•</span>
                      <span>{timeString}</span>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-6 text-slate-400 text-xs">
              {t.noActivity}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
