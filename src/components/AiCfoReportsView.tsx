import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Download,
  AlertCircle,
  TrendingUp,
  BrainCircuit,
  MessageSquare,
  ArrowRight,
  RefreshCw,
  Clock
} from 'lucide-react';
import Markdown from 'react-markdown';
import { jsPDF } from 'jspdf';
import { Product, StockMovement, Expense, Staff, ActivityLog, LanguageType } from '../types';
import { translations } from '../translations';

interface AiCfoReportsViewProps {
  products: Product[];
  movements: StockMovement[];
  expenses: Expense[];
  staff: Staff[];
  logs: ActivityLog[];
  lang: LanguageType;
}

export default function AiCfoReportsView({
  products,
  movements,
  expenses,
  staff,
  logs,
  lang,
}: AiCfoReportsViewProps) {
  const t = translations[lang];

  // Component local states
  const [report, setReport] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [customQuestion, setCustomQuestion] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Timeline selection states
  const [timelineType, setTimelineType] = useState<'All' | 'Today' | 'Week' | 'Month' | 'Custom'>('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Helper to set preset dates
  const setPresetDates = (type: 'All' | 'Today' | 'Week' | 'Month' | 'Custom') => {
    setTimelineType(type);
    const todayStr = new Date().toISOString().split('T')[0];
    if (type === 'Today') {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (type === 'Week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      setStartDate(weekAgo.toISOString().split('T')[0]);
      setEndDate(todayStr);
    } else if (type === 'Month') {
      const monthAgo = new Date();
      monthAgo.setDate(monthAgo.getDate() - 30);
      setStartDate(monthAgo.toISOString().split('T')[0]);
      setEndDate(todayStr);
    } else if (type === 'All') {
      setStartDate('');
      setEndDate('');
    }
  };

  // Filtering logic based on direct startDate and endDate selections
  const getTimelineRange = () => {
    let start = new Date(0); // Epoch start (All-time)
    let end = new Date();
    end.setHours(23, 59, 59, 999);

    if (startDate) {
      const s = new Date(startDate);
      s.setHours(0, 0, 0, 0);
      start = s;
    }
    if (endDate) {
      const e = new Date(endDate);
      e.setHours(23, 59, 59, 999);
      end = e;
    }
    return { start, end };
  };

  const { start, end } = getTimelineRange();

  const isWithinTimeline = (dateStr: string, start: Date, end: Date) => {
    if (!dateStr) return false;
    const dateObj = new Date(dateStr);
    if (isNaN(dateObj.getTime())) return false;
    return dateObj >= start && dateObj <= end;
  };

  // Filtered lists for the chosen timeline
  const filteredMovements = movements.filter((m) => isWithinTimeline(m.date, start, end));
  const filteredExpensesList = expenses.filter((e) => isWithinTimeline(e.date, start, end));
  const filteredLogsList = logs.filter((l) => isWithinTimeline(l.date, start, end));

  // Computations for payload & display
  const totalInventoryValue = products.reduce((acc, p) => acc + (p.stock * p.costPerKg), 0);
  
  const totalRevenue = filteredMovements
    .filter((m) => m.type === 'OUT')
    .reduce((acc, m) => acc + (m.quantity * m.pricePerKg), 0);

  const stockPurchaseExpenses = filteredMovements
    .filter((m) => m.type === 'IN')
    .reduce((acc, m) => acc + (m.quantity * m.pricePerKg), 0);
  
  const loggedExpensesVal = filteredExpensesList.reduce((acc, e) => acc + e.amount, 0);

  // Computed total Kilograms bought and sold during period
  const totalKgsBought = filteredMovements
    .filter((m) => m.type === 'IN')
    .reduce((acc, m) => acc + m.quantity, 0);

  const totalKgsSold = filteredMovements
    .filter((m) => m.type === 'OUT')
    .reduce((acc, m) => acc + m.quantity, 0);

  // Helper to prorate staff salaries overhead based on the selected timeframe
  const getTimelineDays = () => {
    if (!startDate && !endDate) return 30; // standard month baseline if all-time
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
    return diffDays;
  };

  const timelineDays = getTimelineDays();
  const staffSalariesVal = staff.reduce((acc, s) => acc + s.salary, 0) * (timelineDays / 30);

  const totalExpenses = stockPurchaseExpenses + loggedExpensesVal + staffSalariesVal;
  const netProfit = totalRevenue - totalExpenses;

  const getTimelineLabel = () => {
    if (!startDate && !endDate) return 'All-Time';
    return `Range: ${startDate || 'Beginning'} to ${endDate || 'Today'}`;
  };

  // Triggers server-side Gemini generation
  const handleGenerateReport = async (queryText?: string) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const payload = {
        products,
        logs: filteredLogsList,
        expenses: filteredExpensesList,
        staff,
        totalInventoryValue,
        totalRevenue,
        totalExpenses,
        netProfit,
        totalKgsBought,
        totalKgsSold,
        staffSalariesVal,
        loggedExpensesVal,
        stockPurchaseExpenses,
        language: lang,
        customQuestion: queryText || '',
        timelineLabel: getTimelineLabel(),
        startDate: startDate || start.toISOString().split('T')[0],
        endDate: endDate || end.toISOString().split('T')[0]
      };

      const response = await fetch('/api/ai-cfo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Server returned an error. Check server.ts logs.');
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      setReport(data.report);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to communicate with AI CFO server.');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomAskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customQuestion.trim()) return;
    handleGenerateReport(`Special User Question: ${customQuestion.trim()}`);
    setCustomQuestion('');
  };

  // Highly robust line-splitter and page-builder for PDF export
  const handleExportPDF = () => {
    try {
      const doc = new jsPDF();
      let y = 18;

      // Header Banner
      doc.setFillColor(30, 41, 59); // deep slate-800 brand background
      doc.rect(0, 0, 220, 36, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('SRI MALLIKARJUNA INDUSTRIES', 15, 14);

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(9);
      doc.text('CFO BUSINESS LEDGER & FINANCIAL AUDIT REPORT', 15, 20);

      const periodStr = startDate && endDate 
        ? `Timeline: From ${startDate} to ${endDate}`
        : 'Timeline: All-Time Business Ledger';
      doc.text(periodStr, 15, 27);

      const dateStr = `Audit Date: ${new Date().toLocaleDateString()} (UTC)`;
      doc.text(dateStr, 140, 27);

      y = 48;

      // Section 1: Quantitative Audit Summary
      doc.setTextColor(15, 23, 42); // slate-900
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('1. QUANTITATIVE OPERATIONS SUMMARY', 15, y);
      
      y += 4;
      doc.setDrawColor(203, 213, 225); // slate-300
      doc.setLineWidth(0.5);
      doc.line(15, y, 195, y);
      y += 8;

      // Table layout for quantitative metrics
      const metrics = [
        { label: 'Total Raw Materials Bought (IN)', value: `${totalKgsBought.toLocaleString('en-IN')} kg` },
        { label: 'Total Finished Products Sold (OUT)', value: `${totalKgsSold.toLocaleString('en-IN')} kg` },
        { label: 'Total Revenue Generated', value: `INR ${totalRevenue.toLocaleString('en-IN')}` },
        { label: 'Stock Purchase Costs (Raw Stock IN)', value: `INR ${stockPurchaseExpenses.toLocaleString('en-IN')}` },
        { label: 'Prorated Staff Salaries Paid', value: `INR ${Math.round(staffSalariesVal).toLocaleString('en-IN')}` },
        { label: 'Other Operating Expenses (Ledger)', value: `INR ${loggedExpensesVal.toLocaleString('en-IN')}` },
        { label: 'Total Business Expenditures', value: `INR ${totalExpenses.toLocaleString('en-IN')}` },
        { label: 'Net Business Profit / (Loss)', value: `INR ${netProfit.toLocaleString('en-IN')}`, highlight: true }
      ];

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(9.5);
      
      metrics.forEach((m) => {
        if (m.highlight) {
          doc.setFont('Helvetica', 'bold');
          if (netProfit >= 0) {
            doc.setTextColor(16, 185, 129); // emerald-600
          } else {
            doc.setTextColor(239, 68, 68); // rose-600
          }
        } else {
          doc.setFont('Helvetica', 'normal');
          doc.setTextColor(51, 65, 85); // slate-700
        }

        doc.text(m.label, 15, y);
        doc.text(m.value, 150, y);
        
        y += 2;
        doc.setDrawColor(241, 245, 249); // slate-100
        doc.setLineWidth(0.2);
        doc.line(15, y, 195, y);
        y += 5.5;
      });

      y += 4;
      doc.setTextColor(15, 23, 42);

      // Section 2: AI CFO Strategic Evaluations
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('2. CHIEF FINANCIAL OFFICER (CFO) STRATEGIC AUDIT', 15, y);
      
      y += 4;
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.5);
      doc.line(15, y, 195, y);
      y += 8;

      if (report) {
        // Render the actual AI report
        const cleanedText = report
          .replace(/#{1,6}\s?/g, '') // remove headings
          .replace(/\*\*/g, '')      // remove bold formatting
          .replace(/\*/g, '•')        // list bullets
          .replace(/`/g, '');        // inline code

        const textLines = doc.splitTextToSize(cleanedText, 175);
        
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(51, 65, 85);
        
        for (let i = 0; i < textLines.length; i++) {
          if (y > 275) {
            doc.addPage();
            y = 20;
          }
          const line = textLines[i];
          
          // Check if it's a bold header section
          if (line.startsWith('Executive Summary') || line.startsWith('Revenue & Expenses') || line.startsWith('CFO Recommendations') || line.startsWith('Inventory & Operations')) {
            doc.setFont('Helvetica', 'bold');
            doc.setTextColor(15, 23, 42);
          } else {
            doc.setFont('Helvetica', 'normal');
            doc.setTextColor(51, 65, 85);
          }

          doc.text(line, 15, y);
          y += 5.2;
        }
      } else {
        doc.setFont('Helvetica', 'italic');
        doc.setFontSize(9);
        doc.setTextColor(148, 163, 184);
        doc.text('Real-time AI CFO strategic audit is not yet generated. To append expert operational analysis and custom cost minimization tips directly into this document, click the "Generate CFO Report" button inside the web application before downloading.', 15, y);
      }

      doc.save(`Sri_Mallikarjuna_Industries_CFO_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error('PDF export failed:', err);
    }
  };  return (
    <div className="space-y-6">
      
      {/* Visual Header */}
      <div className="bg-white border border-slate-200/60 p-6 rounded-2xl shadow-sm shadow-slate-100/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 max-w-xl">
          {/* Glowing Emblem */}
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-[#FAF3EA] border border-[#F4E6D4] relative shrink-0">
            <div className="w-10 h-10 rounded-full bg-[#EAD5C3] opacity-40 absolute animate-pulse" />
            <Sparkles className="w-5 h-5 text-[#B48243]" />
          </div>
          <div className="space-y-1.5 text-center sm:text-left">
            <h2 className="text-xl font-serif font-extrabold text-slate-900 tracking-tight">
              {t.aiCfoTitle}
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              {t.aiCfoDesc}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2.5">
          <button
            onClick={() => handleGenerateReport()}
            disabled={loading}
            className="flex items-center space-x-2 px-5 py-3 text-xs font-semibold bg-[#1E293B] hover:bg-[#0F172A] text-white disabled:opacity-50 rounded-xl transition-all shadow-md shadow-slate-900/15 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#D2A267]" />
            <span>{loading ? (lang === 'Telugu' ? 'తయారవుతోంది...' : 'Generating...') : t.generateReport}</span>
          </button>

          <button
            onClick={handleExportPDF}
            className="flex items-center space-x-1.5 px-4 py-3 text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl transition-all shadow-sm cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-400" />
            <span>{lang === 'Telugu' ? 'పిడిఎఫ్ (PDF)' : 'Download PDF'}</span>
          </button>
        </div>
      </div>

      {/* Errors Alert */}
      <AnimatePresence>
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-rose-50 border border-rose-200 text-rose-650 text-xs rounded-xl flex items-start space-x-2 shadow-sm"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
            <div className="space-y-1">
              <span className="font-bold text-rose-800">AI Connection Blocked</span>
              <p>{errorMsg}</p>
              <p className="text-[10px] text-rose-550">
                Please make sure your GEMINI_API_KEY is configured in the AI Studio Secrets panel.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dynamic Timeline Selector Card */}
      <div className="bg-white border border-slate-200/60 p-5 rounded-2xl shadow-sm shadow-slate-100/50 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-xs font-serif font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
              <Clock className="w-4 h-4 text-[#B48243]" />
              <span>{lang === 'Telugu' ? 'వ్యవధి ఎంపిక (Select Period)' : 'Select Report Period'}</span>
            </h3>
            <p className="text-[11px] text-slate-500">
              {lang === 'Telugu' 
                ? 'తేదీల మధ్య (రోజు నుండి రోజుకు) కొనుగోళ్లు, అమ్మకాలు, శాలరీలు మరియు ఖర్చులను లెక్కించండి.' 
                : 'Calculate kilograms bought/sold, staff salaries, and operating expenses between specific dates.'}
            </p>
          </div>

          {/* Preset Buttons */}
          <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-xl w-fit">
            {(['All', 'Today', 'Week', 'Month'] as const).map((type) => {
              const labelMap: Record<string, string> = {
                All: lang === 'Telugu' ? 'మొత్తం కాలం' : 'All-Time',
                Today: lang === 'Telugu' ? 'ఈ రోజు' : 'Today',
                Week: lang === 'Telugu' ? 'ఈ వారం' : 'This Week',
                Month: lang === 'Telugu' ? 'ఈ నెల' : 'This Month'
              };
              const isSelected = type === 'All' ? (!startDate && !endDate) : (timelineType === type);
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setPresetDates(type)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#FAF3EA] text-[#B48243] border border-[#F4E6D4]/60 shadow-sm'
                      : 'text-slate-600 hover:text-slate-950 hover:bg-slate-50'
                  }`}
                >
                  {labelMap[type]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Date pickers (Always Visible side-by-side) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-600 block">
              {lang === 'Telugu' ? 'ప్రారంభ తేదీ (From Date)' : 'From (Start Date)'}
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setTimelineType('Custom');
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-600 block">
              {lang === 'Telugu' ? 'ముగింపు తేదీ (To Date)' : 'To (End Date)'}
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setTimelineType('Custom');
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
        </div>

        {/* Dynamic Financial & Operations Preview Cards (Bento-Grid style with 6 cards) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 pt-4 border-t border-slate-100">
          <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100 space-y-1">
            <span className="text-[10px] text-[#B48243] uppercase font-bold block">
              {lang === 'Telugu' ? 'కొనుగోలు పరిమాణం' : 'Kgs Bought'}
            </span>
            <p className="text-sm font-serif font-extrabold text-blue-600">{totalKgsBought.toLocaleString('en-IN')} kg</p>
            <span className="text-[9px] text-slate-400 block leading-none">
              {lang === 'Telugu' ? 'మొత్తం ఇన్ స్టాక్' : 'Total quantity received'}
            </span>
          </div>

          <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100 space-y-1">
            <span className="text-[10px] text-[#B48243] uppercase font-bold block">
              {lang === 'Telugu' ? 'అమ్మకపు పరిమాణం' : 'Kgs Sold'}
            </span>
            <p className="text-sm font-serif font-extrabold text-indigo-600">{totalKgsSold.toLocaleString('en-IN')} kg</p>
            <span className="text-[9px] text-slate-400 block leading-none">
              {lang === 'Telugu' ? 'మొత్తం ఔట్ స్టాక్' : 'Total quantity shipped'}
            </span>
          </div>

          <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100 space-y-1">
            <span className="text-[10px] text-[#B48243] uppercase font-bold block">
              {lang === 'Telugu' ? 'వ్యవధి ఆదాయం' : 'Total Revenue'}
            </span>
            <p className="text-sm font-serif font-extrabold text-emerald-600">₹{totalRevenue.toLocaleString('en-IN')}</p>
            <span className="text-[9px] text-emerald-500 block leading-none">
              {lang === 'Telugu' ? 'సరుకు విక్రయాల ఆదాయం' : 'Total sales value'}
            </span>
          </div>

          <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100 space-y-1">
            <span className="text-[10px] text-[#B48243] uppercase font-bold block">
              {lang === 'Telugu' ? 'సిబ్బంది జీతాలు' : 'Staff Salaries'}
            </span>
            <p className="text-sm font-serif font-extrabold text-amber-600">₹{Math.round(staffSalariesVal).toLocaleString('en-IN')}</p>
            <span className="text-[9px] text-amber-500 block leading-none">
              {lang === 'Telugu' ? 'జీతాల కేటాయింపు' : 'Prorated for period'}
            </span>
          </div>

          <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100 space-y-1">
            <span className="text-[10px] text-[#B48243] uppercase font-bold block">
              {lang === 'Telugu' ? 'ఇతర ఖర్చులు' : 'Other Expenses'}
            </span>
            <p className="text-sm font-serif font-extrabold text-rose-600">₹{(loggedExpensesVal + stockPurchaseExpenses).toLocaleString('en-IN')}</p>
            <span className="text-[9px] text-rose-500 block leading-none">
              {lang === 'Telugu' ? 'సరుకు + ఇతర ఖర్చులు' : 'Purchase + Ledger costs'}
            </span>
          </div>

          <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100 space-y-1">
            <span className="text-[10px] text-[#B48243] uppercase font-bold block">
              {lang === 'Telugu' ? 'నికర లాభం' : 'Net Profit'}
            </span>
            <p className={`text-sm font-serif font-extrabold ${netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
              ₹{Math.round(netProfit).toLocaleString('en-IN')}
            </p>
            <span className={`text-[9px] block leading-none ${netProfit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              {netProfit >= 0 
                ? (lang === 'Telugu' ? 'లాభం' : 'Surplus') 
                : (lang === 'Telugu' ? 'నష్టం' : 'Deficit')}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Ask CFO Custom Panel (Left Column 1) */}
        <div className="bg-white border border-slate-200/60 p-5 rounded-2xl shadow-sm shadow-slate-100/50 space-y-4 h-fit">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-sm font-serif font-bold text-slate-900 tracking-wider flex items-center space-x-2">
              <MessageSquare className="w-4 h-4 text-[#B48243]" />
              <span>{lang === 'Telugu' ? 'CFO సంభాషణ బోర్డు' : 'CFO Advisory Board'}</span>
            </h3>
            <Sparkles className="w-3.5 h-3.5 text-[#B48243]" />
          </div>

          <form onSubmit={handleCustomAskSubmit} className="space-y-3">
            <label className="text-[11px] text-slate-550 uppercase font-bold block">{t.askCfo}</label>
            <textarea
              rows={4}
              value={customQuestion}
              onChange={(e) => setCustomQuestion(e.target.value)}
              placeholder={lang === 'Telugu' ? 'ఉదాహరణ: నేను ఇతర ఖర్చులను ఎలా తగ్గించగలను?' : 'e.g. How can I reduce utilities expenses? Is my profit margin healthy?'}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-400 resize-none"
            />
            <button
              type="submit"
              disabled={loading || !customQuestion.trim()}
              className="w-full flex items-center justify-center space-x-1.5 py-2.5 text-xs font-semibold bg-[#B48243] hover:bg-[#A2784C] text-white disabled:opacity-50 disabled:pointer-events-none rounded-xl transition-colors cursor-pointer shadow-md shadow-amber-800/10"
            >
              <span>{t.askBtn}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick suggestions */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <span className="text-[10px] text-slate-500 uppercase font-bold block">Quick Prompts</span>
            <div className="flex flex-col gap-1.5">
              <button
                type="button"
                onClick={() => handleGenerateReport("Suggest three ways to reduce warehouse cost price leaks.")}
                className="text-left text-[11px] text-slate-600 hover:text-[#B48243] hover:bg-[#FAF3EA]/30 px-2.5 py-1.5 rounded-lg border border-slate-200 transition-all truncate cursor-pointer"
              >
                {lang === 'Telugu' ? 'లీకేజీలను తగ్గించడానికి 3 మార్గాలు' : 'How to stop leaks & increase profit'}
              </button>
              <button
                type="button"
                onClick={() => handleGenerateReport("Is my pricing model sound? Compare cost price against selling price.")}
                className="text-left text-[11px] text-slate-600 hover:text-[#B48243] hover:bg-[#FAF3EA]/30 px-2.5 py-1.5 rounded-lg border border-slate-200 transition-all truncate cursor-pointer"
              >
                {lang === 'Telugu' ? 'ధరల నమూనా విశ్లేషణ' : 'Analyze cost vs. selling prices'}
              </button>
            </div>
          </div>
        </div>

        {/* Output Report Frame (Right Columns 2, 3) */}
        <div className="lg:col-span-2 bg-white border border-slate-200/60 p-5 rounded-2xl shadow-sm shadow-slate-100/50 min-h-[400px] flex flex-col">
          
          {loading ? (
            /* Loading State */
            <div className="flex-1 flex flex-col items-center justify-center py-16 space-y-4">
              <div className="relative w-12 h-12">
                <RefreshCw className="w-12 h-12 text-[#B48243] animate-spin" />
                <Sparkles className="w-5 h-5 text-[#D2A267] absolute -top-1.5 -right-1.5 animate-bounce" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-xs font-semibold text-slate-700 animate-pulse">{t.aiTyping}</p>
                <p className="text-[10px] text-slate-400">Evaluating inventory balances, profit margins, and expense logs...</p>
              </div>
            </div>
          ) : report ? (
            /* Rendered Markdown Report */
            <div className="flex-1 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider flex items-center space-x-1">
                  <Clock className="w-3 h-3 text-[#B48243]" />
                  <span>Report Compiled Successfully</span>
                </span>
                <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-mono font-semibold">
                  Live CFO analysis
                </span>
              </div>
              
              <div className="prose prose-xs text-slate-700 leading-relaxed space-y-4 text-xs font-normal">
                <div className="markdown-body font-serif">
                  <Markdown>{report}</Markdown>
                </div>
              </div>
            </div>
          ) : (
            /* Blank Placeholder State */
            <div className="flex-1 flex flex-col items-center justify-center py-20 text-center space-y-4 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[#FAF3EA] border border-[#F4E6D4] text-[#B48243]">
                <BrainCircuit className="w-5 h-5" />
              </div>
              <div className="max-w-md space-y-1">
                <p className="text-sm font-serif font-bold text-slate-900">Ledger Report Ready for Compilation</p>
                <p className="text-[11px] text-slate-500 leading-relaxed px-6">
                  {t.defaultReportIntro}
                </p>
              </div>
              <button
                onClick={() => handleGenerateReport()}
                className="inline-flex items-center space-x-2 px-5 py-2.5 text-xs font-semibold bg-[#B48243] hover:bg-[#A2784C] text-white rounded-xl transition-all shadow-md shadow-amber-800/10 cursor-pointer"
              >
                <span>{lang === 'Telugu' ? 'CFO నివేదికను సృష్టించండి' : 'Generate CFO Report'}</span>
              </button>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
