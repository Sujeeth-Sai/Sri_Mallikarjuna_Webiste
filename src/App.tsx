import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard,
  Box,
  Users,
  CalendarDays,
  FileText,
  BrainCircuit,
  Menu,
  ChevronLeft,
  ChevronRight,
  User,
  Globe,
  Plus,
  Compass,
  CornerDownRight,
  Database,
  AlertTriangle,
  Check,
  Copy,
  ExternalLink,
  Lock,
  Mail,
  LogOut
} from 'lucide-react';

// Types and Translations
import {
  Product,
  StockMovement,
  SupplierCustomer,
  Staff,
  Attendance,
  Expense,
  ActivityLog,
  ViewType,
  LanguageType
} from './types';
import { translations } from './translations';

// Database Manager
import {
  supabase,
  onSnapshot,
  setDoc,
  deleteDoc,
  writeBatch,
  logActivity,
  getCollectionData,
  schemaStatus,
  generateUUID
} from './firebase';

// Views
import DashboardView from './components/DashboardView';
import StockInventoryView from './components/StockInventoryView';
import SuppliersCustomersView from './components/SuppliersCustomersView';
import StaffAttendanceView from './components/StaffAttendanceView';
import ExpensesLedgerView from './components/ExpensesLedgerView';
import AiCfoReportsView from './components/AiCfoReportsView';

export default function App() {
  // Navigation & Language States
  const [activeView, setActiveView] = useState<ViewType>('Dashboard');
  const [lang, setLang] = useState<LanguageType>('English');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Auth States
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSubmitting, setAuthSubmitting] = useState(false);

  // Supabase Table Status
  const [isTablesMissing, setIsTablesMissing] = useState(false);
  const [showSchemaModal, setShowSchemaModal] = useState(false);
  const [copied, setCopied] = useState(false);

  // Check & listen to Supabase Auth state
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const unsubStatus = schemaStatus.onChange((missing) => {
      setIsTablesMissing(missing);
    });
    return () => unsubStatus();
  }, []);

  // App core database state
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [contacts, setContacts] = useState<SupplierCustomer[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);

  // Subscribe to local emulated collections
  useEffect(() => {
    if (!user) return;

    const unsubProducts = onSnapshot<Product>('products', setProducts);
    const unsubMovements = onSnapshot<StockMovement>('movements', setMovements);
    const unsubContacts = onSnapshot<SupplierCustomer>('contacts', setContacts);
    const unsubStaff = onSnapshot<Staff>('staff', setStaff);
    const unsubAttendance = onSnapshot<Attendance>('attendance', setAttendance);
    const unsubExpenses = onSnapshot<Expense>('expenses', setExpenses);
    const unsubLogs = onSnapshot<ActivityLog>('logs', setLogs);

    return () => {
      unsubProducts();
      unsubMovements();
      unsubContacts();
      unsubStaff();
      unsubAttendance();
      unsubExpenses();
      unsubLogs();
    };
  }, [user]);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSubmitting(true);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email: authEmail,
          password: authPassword,
        });
        if (error) throw error;
        
        if (data?.user && !data.session) {
          setAuthError('Registration successful! Please check your email inbox to verify your account.');
        } else if (data?.user) {
          setUser(data.user);
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: authEmail,
          password: authPassword,
        });
        if (error) throw error;
        setUser(data.user);
      }
    } catch (err: any) {
      setAuthError(err.message || 'An error occurred during authentication');
    } finally {
      setAuthSubmitting(false);
    }
  };

  const t = translations[lang];

  // ==========================================
  // HANDLERS: PRODUCTS & INVENTORY
  // ==========================================
  const handleAddProduct = (name: string, startingStock: number, costPrice: number, sellPrice: number, reorderThreshold?: number, type?: 'RawMaterial' | 'FinishedGood') => {
    const newId = generateUUID();
    const threshold = reorderThreshold !== undefined ? reorderThreshold : 10;
    const status = startingStock > threshold ? 'In Stock' : startingStock > 0 ? 'Low Stock' : 'Out of Stock';
    const newProduct: Product = {
      id: newId,
      name,
      stock: startingStock,
      costPerKg: costPrice,
      pricePerKg: sellPrice,
      status,
      reorderThreshold: threshold,
      createdAt: new Date().toISOString(),
      type
    };

    const batch = writeBatch();
    batch.set('products', newId, newProduct);

    if (startingStock > 0) {
      // Create starting stock transaction log
      const movId = generateUUID();
      const startingMovement: StockMovement = {
        id: movId,
        productId: newId,
        productName: name,
        type: 'IN',
        quantity: startingStock,
        pricePerKg: costPrice,
        date: new Date().toISOString(),
        notes: 'Initial inventory load'
      };
      batch.set('movements', movId, startingMovement);
    }

    batch.commit().then(() => {
      logActivity(
        'product_add',
        lang === 'Telugu'
          ? `కొత్త ఉత్పత్తిని చేర్చారు: ${name} (ప్రారంభ స్టాక్: ${startingStock} KGs)`
          : `Added new product: ${name} with starting stock of ${startingStock} KG`
      );
    });
  };

  const handleReceiveStock = (productId: string, qty: number, costPerKg: number, notes?: string) => {
    const targetProd = products.find((p) => p.id === productId);
    if (!targetProd) return;

    const newQty = targetProd.stock + qty;
    const threshold = targetProd.reorderThreshold !== undefined ? targetProd.reorderThreshold : 10;
    const newStatus = newQty > threshold ? 'In Stock' : newQty > 0 ? 'Low Stock' : 'Out of Stock';

    const batch = writeBatch();
    batch.set('products', productId, {
      ...targetProd,
      stock: newQty,
      status: newStatus,
      costPerKg: costPerKg // update cost price on new receive
    });

    const movId = generateUUID();
    const newMovement: StockMovement = {
      id: movId,
      productId,
      productName: targetProd.name,
      type: 'IN',
      quantity: qty,
      pricePerKg: costPerKg,
      date: new Date().toISOString(),
      notes: notes || 'Received stock shipment'
    };
    batch.set('movements', movId, newMovement);

    batch.commit().then(() => {
      logActivity(
        'stock_in',
        lang === 'Telugu'
          ? `స్టాక్ స్వీకరించారు: ${targetProd.name} (+${qty} KGs) ప్రతి కేజీ ₹${costPerKg}`
          : `Received stock: ${targetProd.name} (+${qty} KG) at ₹${costPerKg}/KG`
      );
    });
  };

  const handleShipStock = (productId: string, qty: number, pricePerKg: number, notes?: string) => {
    const targetProd = products.find((p) => p.id === productId);
    if (!targetProd || targetProd.stock < qty) return;

    const newQty = targetProd.stock - qty;
    const threshold = targetProd.reorderThreshold !== undefined ? targetProd.reorderThreshold : 10;
    const newStatus = newQty > threshold ? 'In Stock' : newQty > 0 ? 'Low Stock' : 'Out of Stock';

    const batch = writeBatch();
    batch.set('products', productId, {
      ...targetProd,
      stock: newQty,
      status: newStatus,
      pricePerKg: pricePerKg // update price on sales
    });

    const movId = generateUUID();
    const newMovement: StockMovement = {
      id: movId,
      productId,
      productName: targetProd.name,
      type: 'OUT',
      quantity: qty,
      pricePerKg: pricePerKg,
      date: new Date().toISOString(),
      notes: notes || 'Invoiced sales order'
    };
    batch.set('movements', movId, newMovement);

    batch.commit().then(() => {
      logActivity(
        'stock_out',
        lang === 'Telugu'
          ? `స్టాక్ విక్రయించారు: ${targetProd.name} (-${qty} KGs) ప్రతి కేజీ ₹${pricePerKg}`
          : `Shipped stock: ${targetProd.name} (-${qty} KG) at ₹${pricePerKg}/KG`
      );
    });
  };

  const handleDeleteProduct = (id: string) => {
    const prod = products.find((p) => p.id === id);
    if (!prod) return;

    deleteDoc('products', id).then(() => {
      logActivity(
        'product_add',
        lang === 'Telugu' ? `ఉత్పత్తిని తొలగించారు: ${prod.name}` : `Deleted product: ${prod.name}`
      );
    });
  };

  // ==========================================
  // HANDLERS: SUPPLIERS & CUSTOMERS
  // ==========================================
  const handleAddContact = (name: string, type: 'Supplier' | 'Customer', email: string, phone: string, address: string) => {
    const newId = generateUUID();
    const newContact: SupplierCustomer = { id: newId, name, type, email, phone, address };
    setDoc('contacts', newId, newContact).then(() => {
      logActivity(
        'contact',
        lang === 'Telugu'
          ? `కొత్త ${type === 'Supplier' ? 'సరఫరాదారుడు' : 'కస్టమర్'} చేర్చారు: ${name}`
          : `Added new ${type.toLowerCase()}: ${name}`
      );
    });
  };

  const handleEditContact = (id: string, name: string, type: 'Supplier' | 'Customer', email: string, phone: string, address: string) => {
    const updated: SupplierCustomer = { id, name, type, email, phone, address };
    setDoc('contacts', id, updated).then(() => {
      logActivity(
        'contact',
        lang === 'Telugu' ? `కాంటాక్ట్ సవరించారు: ${name}` : `Updated contact registry: ${name}`
      );
    });
  };

  const handleDeleteContact = (id: string) => {
    const contact = contacts.find((c) => c.id === id);
    if (!contact) return;
    deleteDoc('contacts', id).then(() => {
      logActivity(
        'contact',
        lang === 'Telugu' ? `కాంటాక్ట్ తొలగించారు: ${contact.name}` : `Deleted contact registry: ${contact.name}`
      );
    });
  };

  // ==========================================
  // HANDLERS: STAFF & ATTENDANCE
  // ==========================================
  const handleAddStaff = (name: string, role: string, salary: number) => {
    const newId = generateUUID();
    const newStaff: Staff = { id: newId, name, role, salary };
    setDoc('staff', newId, newStaff).then(() => {
      logActivity(
        'attendance',
        lang === 'Telugu'
          ? `కొత్త సిబ్బంది చేర్చారు: ${name} (${role})`
          : `Registered staff profile: ${name} (${role})`
      );
    });
  };

  const handleDeleteStaff = (id: string) => {
    const member = staff.find((s) => s.id === id);
    if (!member) return;
    deleteDoc('staff', id).then(() => {
      logActivity(
        'attendance',
        lang === 'Telugu' ? `సిబ్బందిని తొలగించారు: ${member.name}` : `Removed staff profile: ${member.name}`
      );
    });
  };

  const handleSaveAttendance = (date: string, statusMap: Record<string, 'Present' | 'Absent'>) => {
    const attendanceRecord: Attendance = {
      id: date,
      date,
      status: statusMap
    };
    setDoc('attendance', date, attendanceRecord).then(() => {
      logActivity(
        'attendance',
        lang === 'Telugu'
          ? `సిబ్బంది హాజరు నవీకరించబడింది: తేదీ ${date}`
          : `Updated daily staff attendance ledger for: ${date}`
      );
    });
  };

  // ==========================================
  // HANDLERS: EXPENSES LEDGER
  // ==========================================
  const handleAddExpense = (description: string, amount: number, category: string, status: 'Settled' | 'Pending', date: string) => {
    const newId = generateUUID();
    const newExpense: Expense = { id: newId, description, amount, category, status, date };
    setDoc('expenses', newId, newExpense).then(() => {
      logActivity(
        'expense',
        lang === 'Telugu'
          ? `ఖర్చు నమోదు చేశారు: ${description} (₹${amount}) [${status}]`
          : `Logged business outflow: ${description} (₹${amount}) [${status}]`
      );
    });
  };

  const handleDeleteExpense = (id: string) => {
    const exp = expenses.find((e) => e.id === id);
    if (!exp) return;
    deleteDoc('expenses', id).then(() => {
      logActivity(
        'expense',
        lang === 'Telugu' ? `ఖర్చు తొలగించారు: ${exp.description}` : `Removed expense log: ${exp.description}`
      );
    });
  };

  const handleToggleExpenseStatus = (id: string) => {
    const exp = expenses.find((e) => e.id === id);
    if (!exp) return;
    const nextStatus = exp.status === 'Settled' ? 'Pending' : 'Settled';
    setDoc('expenses', id, { ...exp, status: nextStatus }).then(() => {
      logActivity(
        'expense',
        lang === 'Telugu'
          ? `ఖర్చు స్థితి మార్చబడింది: ${exp.description} -> ${nextStatus}`
          : `Toggled status: ${exp.description} is now ${nextStatus}`
      );
    });
  };

  // Sidebar Menu Config
  const menuItems = [
    { view: 'Dashboard' as ViewType, icon: LayoutDashboard },
    { view: 'Stock & Inventory' as ViewType, icon: Box },
    { view: 'Suppliers & Customers' as ViewType, icon: Users },
    { view: 'Staff & Attendance' as ViewType, icon: CalendarDays },
    { view: 'Expenses Ledger' as ViewType, icon: FileText },
    { view: 'AI CFO Reports' as ViewType, icon: BrainCircuit },
  ];

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center font-black text-slate-100 shadow-lg shadow-indigo-600/30 animate-bounce">
            SF
          </div>
          <div className="flex items-center space-x-2 text-slate-500 font-medium text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping" />
            <span>Establishing secure auth connection...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-4 md:p-6 select-none selection:bg-indigo-100 selection:text-indigo-800">
        <div className="w-full max-w-md space-y-8">
          
          {/* Brand header */}
          <div className="text-center space-y-3">
            <div className="inline-flex w-14 h-14 rounded-2xl bg-indigo-600 items-center justify-center font-black text-slate-100 text-xl shadow-xl shadow-indigo-600/25">
              SMI
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                {t.brandName}
              </h1>
              <p className="text-xs text-slate-400 uppercase font-black tracking-widest">
                {t.subtitle} — SECURE PORTAL
              </p>
            </div>
          </div>

          {/* Form card */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-slate-200/80 rounded-2xl p-6 md:p-8 shadow-xl shadow-slate-200/50 space-y-6"
          >
            <div className="space-y-1">
              <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
                {isSignUp ? 'Create an Account' : 'Welcome Back'}
              </h2>
              <p className="text-xs text-slate-400">
                {isSignUp ? 'Get started with your custom business terminal' : 'Sign in to access your dashboard & ledger'}
              </p>
            </div>

            {authError && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`p-3.5 rounded-xl border flex items-start space-x-3 text-xs ${
                  authError.includes('successful') 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                    : 'bg-red-50 border-red-200 text-red-800'
                }`}
              >
                <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${authError.includes('successful') ? 'text-emerald-500' : 'text-red-500'}`} />
                <span className="font-semibold leading-relaxed">{authError}</span>
              </motion.div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600/10 focus:border-indigo-600 transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600/10 focus:border-indigo-600 transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={authSubmitting}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-3 px-4 rounded-xl shadow shadow-indigo-600/20 hover:shadow-indigo-600/30 transition-all duration-150 cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <span>{authSubmitting ? 'Authenticating...' : isSignUp ? 'Sign Up' : 'Sign In'}</span>
              </button>
            </form>

            <div className="border-t border-slate-100 pt-4 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setAuthError(null);
                }}
                className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline transition-colors cursor-pointer"
              >
                {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
              </button>
            </div>
          </motion.div>

          <p className="text-center text-[10px] text-slate-400 font-mono">
            Securely connected to Supabase Instance ID dghnymvkqkhfjbwjmcok
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-800 flex flex-col md:flex-row antialiased selection:bg-amber-100 selection:text-amber-900">
      
      {/* 1. Mobile Top Bar */}
      <div className="md:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between z-20">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-slate-100 shadow shadow-indigo-600/30">
            S
          </div>
          <span className="font-bold text-sm tracking-tight text-slate-900">{t.brandName}</span>
        </div>
        <div className="flex items-center space-x-2">
          {/* Mobile Language Toggle */}
          <button
            onClick={() => setLang(lang === 'English' ? 'Telugu' : 'English')}
            className="p-1.5 bg-slate-100 border border-slate-200 text-[10px] font-bold text-indigo-600 rounded-md"
          >
            {lang === 'English' ? 'భాష' : 'EN'}
          </button>
          <button
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="p-1.5 text-slate-500 hover:text-slate-800 bg-slate-100 border border-slate-200 rounded-md"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Mobile Drawer menu list */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-14 left-0 right-0 md:hidden bg-white border-b border-slate-200 p-4 z-10 space-y-2.5 shadow-xl"
          >
            {menuItems.map((item) => (
              <button
                key={item.view}
                onClick={() => {
                  setActiveView(item.view);
                  setIsMobileOpen(false);
                }}
                className={`w-full text-left flex items-center space-x-3 p-3 rounded-xl text-xs font-semibold tracking-wide transition-colors ${
                  activeView === item.view
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span>{t.views[item.view]}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Light Navigation Sidebar for Desktop */}
      <motion.aside
        id="navigation_sidebar"
        animate={{ width: sidebarCollapsed ? '76px' : '260px' }}
        className="hidden md:flex flex-col justify-between bg-white border-r border-slate-200/80 p-4 relative shrink-0 z-10 select-none"
      >
        {/* Collapse button trigger */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="absolute -right-3 top-6 w-6 h-6 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-[#B48243] flex items-center justify-center shadow transition-transform hover:scale-105 cursor-pointer animate-none"
        >
          {sidebarCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>

        {/* Brand segment */}
        <div className="space-y-6">
          <div className="flex items-center space-x-3 px-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#B48243] to-[#D2A267] flex items-center justify-center shrink-0 shadow-sm">
              <span className="text-white font-serif font-black text-xs">SMI</span>
            </div>
            {!sidebarCollapsed && (
              <div className="space-y-0.5">
                <span className="font-serif font-bold text-sm text-slate-900 block tracking-tight leading-none">{t.brandName}</span>
                <span className="text-[9px] text-[#B48243] block uppercase font-bold tracking-widest leading-none">{t.subtitle}</span>
              </div>
            )}
          </div>

          {/* Menu Items */}
          <div className="space-y-1">
            {menuItems.map((item) => {
              const isAiCfo = item.view === 'AI CFO Reports';
              const isActive = activeView === item.view;
              
              if (isAiCfo) {
                return (
                  <button
                    key={item.view}
                    onClick={() => setActiveView(item.view)}
                    className={`w-full text-left flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#1E293B] text-white shadow-md shadow-slate-900/25 border border-slate-700'
                        : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100/50'
                    }`}
                    title={t.views[item.view]}
                  >
                    <div className="flex items-center space-x-3">
                      <item.icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#D2A267]' : 'text-slate-500'}`} />
                      {!sidebarCollapsed && <span>{t.views[item.view]}</span>}
                    </div>
                    {!sidebarCollapsed && (
                      <span className={`text-[8px] px-1.5 py-0.5 rounded font-extrabold tracking-wider ${
                        isActive ? 'bg-[#D2A267] text-white' : 'bg-amber-50 text-[#B48243]'
                      }`}>
                        AI
                      </span>
                    )}
                  </button>
                );
              }

              return (
                <button
                  key={item.view}
                  onClick={() => setActiveView(item.view)}
                  className={`w-full text-left flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#FAF3EA] text-[#B48243] font-bold shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
                  }`}
                  title={t.views[item.view]}
                >
                  <item.icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#B48243]' : 'text-slate-400'}`} />
                  {!sidebarCollapsed && <span>{t.views[item.view]}</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom user credentials, translation switch, and branding */}
        <div className="space-y-4">
          
          {/* English / Telugu language translation card toggle */}
          <div className="border-t border-slate-200 pt-4">
            <div className={`flex items-center justify-between gap-2 ${sidebarCollapsed ? 'flex-col items-center' : ''}`}>
              {!sidebarCollapsed && (
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center space-x-1">
                  <Globe className="w-3 h-3 text-[#B48243]" />
                  <span>{t.language}</span>
                </span>
              )}
              
              <div className="flex items-center bg-slate-100 border border-slate-200 rounded-lg p-0.5">
                <button
                  onClick={() => setLang('English')}
                  className={`px-2 py-0.5 text-[9px] font-bold rounded transition-all cursor-pointer ${
                    lang === 'English'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  EN
                </button>
                <button
                  onClick={() => setLang('Telugu')}
                  className={`px-2 py-0.5 text-[9px] font-bold rounded transition-all cursor-pointer ${
                    lang === 'Telugu'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  తెలుగు
                </button>
              </div>
            </div>
          </div>



          {/* Active Administrator Card */}
          <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl flex items-center justify-between overflow-hidden">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-amber-50/80 border border-amber-100 text-[#B48243] flex items-center justify-center shrink-0">
                <User className="w-4 h-4" />
              </div>
              {!sidebarCollapsed && (
                <div className="space-y-0.5 min-w-0">
                  <span className="text-[10px] text-slate-700 font-bold block truncate">{t.activeAdmin}</span>
                  <span className="text-[9px] text-slate-500 block truncate font-mono">{user?.email || 'Active User'}</span>
                </div>
              )}
            </div>
            {!sidebarCollapsed ? (
              <button
                onClick={() => supabase.auth.signOut()}
                className="text-[10px] font-bold text-red-600 hover:text-red-800 hover:underline cursor-pointer ml-1 select-none flex-shrink-0"
              >
                Log Out
              </button>
            ) : (
              <button
                onClick={() => supabase.auth.signOut()}
                className="w-4 h-4 text-slate-400 hover:text-red-500 cursor-pointer flex items-center justify-center select-none flex-shrink-0"
                title="Log Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

        </div>
      </motion.aside>

      {/* 3. Main View Area */}
      <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto space-y-6">
        
        {/* Title row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-2xl font-serif font-extrabold text-slate-900 tracking-tight flex items-center space-x-2">
              <span>{t.views[activeView]}</span>
              {activeView === 'AI CFO Reports' && (
                <span className="text-[9px] bg-amber-50 border border-amber-100 text-[#B48243] px-2 py-0.5 rounded-full uppercase font-bold tracking-wider animate-pulse">
                  AI Active
                </span>
              )}
            </h1>
            <p className="text-xs text-slate-500">
              {lang === 'Telugu' ? 'శ్రీ మల్లికార్జున ఇండస్ట్రీస్ రియల్ టైమ్ ఆర్థిక నివేదిక ప్యానెల్' : 'Sri Mallikarjuna Industries real-time financial tracking dashboard'}
            </p>
          </div>
          
          <div className="flex items-center space-x-2 font-mono text-[10px] text-slate-400">
            <span>2026-07-06</span>
            <span>•</span>
            <span>UTC Clock</span>
          </div>
        </div>



        {/* Render Selected View */}
        <div className="min-h-[500px]">
          {activeView === 'Dashboard' && (
            <DashboardView
              products={products}
              movements={movements}
              expenses={expenses}
              staff={staff}
              logs={logs}
              lang={lang}
            />
          )}

          {activeView === 'Stock & Inventory' && (
            <StockInventoryView
              products={products}
              movements={movements}
              contacts={contacts}
              onAddProduct={handleAddProduct}
              onReceiveStock={handleReceiveStock}
              onShipStock={handleShipStock}
              onDeleteProduct={handleDeleteProduct}
              lang={lang}
            />
          )}

          {activeView === 'Suppliers & Customers' && (
            <SuppliersCustomersView
              contacts={contacts}
              onAddContact={handleAddContact}
              onEditContact={handleEditContact}
              onDeleteContact={handleDeleteContact}
              lang={lang}
            />
          )}

          {activeView === 'Staff & Attendance' && (
            <StaffAttendanceView
              staff={staff}
              attendance={attendance}
              onAddStaff={handleAddStaff}
              onDeleteStaff={handleDeleteStaff}
              onSaveAttendance={handleSaveAttendance}
              lang={lang}
            />
          )}

          {activeView === 'Expenses Ledger' && (
            <ExpensesLedgerView
              expenses={expenses}
              onAddExpense={handleAddExpense}
              onDeleteExpense={handleDeleteExpense}
              onToggleExpenseStatus={handleToggleExpenseStatus}
              lang={lang}
            />
          )}

          {activeView === 'AI CFO Reports' && (
            <AiCfoReportsView
              products={products}
              movements={movements}
              expenses={expenses}
              staff={staff}
              logs={logs}
              lang={lang}
            />
          )}
        </div>

      </main>

      

    </div>
  );
}
