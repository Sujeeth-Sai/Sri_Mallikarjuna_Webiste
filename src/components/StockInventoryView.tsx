import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  Sparkles,
  Trash2,
  X,
  PlusCircle,
  Search,
  PackageCheck,
  AlertCircle
} from 'lucide-react';
import { Product, StockMovement, SupplierCustomer, LanguageType } from '../types';
import { translations } from '../translations';

interface StockInventoryViewProps {
  products: Product[];
  movements: StockMovement[];
  contacts: SupplierCustomer[];
  onAddProduct: (name: string, stock: number, costPrice: number, sellPrice: number, reorderThreshold?: number, type?: 'RawMaterial' | 'FinishedGood') => void;
  onReceiveStock: (productId: string, qty: number, costPerKg: number, notes?: string) => void;
  onShipStock: (productId: string, qty: number, pricePerKg: number, notes?: string) => void;
  onDeleteProduct: (id: string) => void;
  lang: LanguageType;
}

export default function StockInventoryView({
  products,
  movements,
  contacts,
  onAddProduct,
  onReceiveStock,
  onShipStock,
  onDeleteProduct,
  lang,
}: StockInventoryViewProps) {
  const t = translations[lang];

  // UI state
  const [activeTab, setActiveTab] = useState<'products' | 'stockIn' | 'stockOut'>('products');
  const [activeForm, setActiveForm] = useState<'none' | 'add' | 'receive' | 'ship'>('none');
  const [searchTerm, setSearchTerm] = useState('');

  // Form Fields - Add Product (Reorder Threshold and Selling Price removed)
  const [prodName, setProdName] = useState('');
  const [prodType, setProdType] = useState<'RawMaterial' | 'FinishedGood'>('RawMaterial');
  const [prodStock, setProdStock] = useState('0');
  const [prodCost, setProdCost] = useState('');

  // Form Fields - Receive Stock
  const [recProdId, setRecProdId] = useState('');
  const [recQty, setRecQty] = useState('');
  const [recPrice, setRecPrice] = useState('');
  const [recSupplierId, setRecSupplierId] = useState('');
  const [recNotes, setRecNotes] = useState('');

  // Form Fields - Ship Stock
  const [shipProdId, setShipProdId] = useState('');
  const [shipQty, setShipQty] = useState('');
  const [shipPrice, setShipPrice] = useState('');
  const [shipCustomerId, setShipCustomerId] = useState('');
  const [shipNotes, setShipNotes] = useState('');

  const resetForms = () => {
    setActiveForm('none');
    setProdName('');
    setProdType('RawMaterial');
    setProdStock('0');
    setProdCost('');
    setRecProdId('');
    setRecQty('');
    setRecPrice('');
    setRecSupplierId('');
    setRecNotes('');
    setShipProdId('');
    setShipQty('');
    setShipPrice('');
    setShipCustomerId('');
    setShipNotes('');
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName.trim()) return;
    // Selling price is removed (passed as 0), reorder threshold is removed (passed as 0/undefined)
    onAddProduct(
      prodName.trim(),
      parseFloat(prodStock) || 0,
      parseFloat(prodCost) || 0,
      0, // selling price removed
      0, // reorder threshold removed
      prodType
    );
    resetForms();
  };

  const handleReceiveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recProdId) return;
    const qtyNum = parseFloat(recQty) || 0;
    const priceNum = parseFloat(recPrice) || 0;
    if (qtyNum <= 0) return;

    // Retrieve Supplier details
    const selectedSupplier = contacts.find((c) => c.id === recSupplierId);
    const supplierPart = selectedSupplier ? `Supplier: ${selectedSupplier.name}` : '';
    const userNotes = recNotes.trim();
    const finalNotes = [supplierPart, userNotes].filter(Boolean).join(' • ');

    onReceiveStock(recProdId, qtyNum, priceNum, finalNotes);
    resetForms();
  };

  const handleShipSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shipProdId) return;
    const qtyNum = parseFloat(shipQty) || 0;
    const priceNum = parseFloat(shipPrice) || 0;
    if (qtyNum <= 0) return;

    // Retrieve Customer details
    const selectedCustomer = contacts.find((c) => c.id === shipCustomerId);
    const customerPart = selectedCustomer ? `Customer: ${selectedCustomer.name}` : '';
    const userNotes = shipNotes.trim();
    const finalNotes = [customerPart, userNotes].filter(Boolean).join(' • ');

    onShipStock(shipProdId, qtyNum, priceNum, finalNotes);
    resetForms();
  };

  const handleSelectProductForReceive = (id: string) => {
    setRecProdId(id);
    const prod = products.find((p) => p.id === id);
    if (prod) {
      setRecPrice(prod.costPerKg.toString());
    }
  };

  const handleSelectProductForShip = (id: string) => {
    setShipProdId(id);
    const prod = products.find((p) => p.id === id);
    if (prod) {
      setShipPrice(prod.pricePerKg.toString() || '0');
    }
  };

  // Filters for subtabs
  const filteredStockIn = movements.filter((m) => m.type === 'IN');
  const filteredStockOut = movements.filter((m) => m.type === 'OUT');

  // Search filter
  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getKgsPurchased = (productId: string) => {
    return movements
      .filter((m) => m.productId === productId && m.type === 'IN')
      .reduce((sum, m) => sum + m.quantity, 0);
  };

  return (
    <div className="bg-white text-slate-800 p-6 md:p-8 rounded-2xl border border-slate-200/60 shadow-sm shadow-slate-100/50 space-y-6">
      
      {/* Top Action Row / Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h2 id="stock_header" className="text-2xl font-serif font-extrabold text-slate-900 tracking-tight">
            {lang === 'Telugu' ? 'స్టాక్ & ఇన్వెంటరీ నిల్వలు' : 'Stock & Inventory Ledger'}
          </h2>
          <p id="stock_header_sub" className="text-sm text-slate-500 font-medium">
            {lang === 'Telugu' ? 'ఉత్పత్తుల పరిమాణాలు, కొనుగోళ్లు మరియు అమ్మకాల పర్యవేక్షణ.' : 'Monitor product volumes, register inbound cost records, and log sales.'}
          </p>
        </div>
        
        <div id="stock_actions_row" className="flex flex-wrap items-center gap-2.5">
          <button
            id="btn_add_product"
            onClick={() => { resetForms(); setActiveForm('add'); }}
            className="flex items-center space-x-1.5 px-4 py-2.5 text-xs font-bold bg-[#B48243] hover:bg-[#A2784C] text-white rounded-xl transition-all shadow-md shadow-amber-800/10 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#FAF3EA]" />
            <span>+ {t.addProduct}</span>
          </button>

          <button
            id="btn_receive_stock"
            onClick={() => { resetForms(); setActiveForm('receive'); }}
            disabled={products.length === 0}
            className="flex items-center space-x-1.5 px-4 py-2.5 text-xs font-bold bg-[#1E293B] hover:bg-[#0F172A] text-white disabled:opacity-40 disabled:pointer-events-none rounded-xl transition-all shadow-md shadow-slate-900/10 cursor-pointer"
          >
            <span>↗ {t.receiveStock}</span>
          </button>

          <button
            id="btn_ship_stock"
            onClick={() => { resetForms(); setActiveForm('ship'); }}
            disabled={products.length === 0}
            className="flex items-center space-x-1.5 px-4 py-2.5 text-xs font-bold bg-[#10B981] hover:bg-[#059669] text-white disabled:opacity-40 disabled:pointer-events-none rounded-xl transition-all shadow-md shadow-emerald-850/10 cursor-pointer"
          >
            <span>↙ {t.shipStock}</span>
          </button>
        </div>
      </div>

      {/* Action Overlays / Inline Forms */}
      <AnimatePresence mode="wait">
        {activeForm !== 'none' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white border border-slate-200 p-6 rounded-xl shadow-md relative"
          >
            <button
              onClick={resetForms}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* FORM: Add Product */}
            {activeForm === 'add' && (
              <form onSubmit={handleAddSubmit} className="space-y-4">
                <h3 className="text-sm font-bold text-[#2563eb] uppercase tracking-wider">
                  {lang === 'Telugu' ? 'కొత్త ఉత్పత్తిని నమోదు చేయండి' : 'Register New Product'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 block">
                      {lang === 'Telugu' ? 'ఉత్పత్తి పేరు *' : 'Product Name *'}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Kaju Shell"
                      value={prodName}
                      onChange={(e) => setProdName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 block">
                      {lang === 'Telugu' ? 'ఉత్పత్తి రకం *' : 'Product Classification *'}
                    </label>
                    <select
                      required
                      value={prodType}
                      onChange={(e) => setProdType(e.target.value as 'RawMaterial' | 'FinishedGood')}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                    >
                      <option value="RawMaterial">
                        {lang === 'Telugu' ? 'ముడి సరుకు (ఉదా: Kaju Shell)' : 'Purchased Raw Material (e.g., Kaju Shell)'}
                      </option>
                      <option value="FinishedGood">
                        {lang === 'Telugu' ? 'తయారైన వస్తువు (ఉదా: Kaju Cake)' : 'Manufactured Finished Good (e.g., Kaju Cake)'}
                      </option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 block">
                      {lang === 'Telugu' ? 'ప్రారంభ నిల్వ (KGs)' : 'Initial Stock (KGs)'}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={prodStock}
                      onChange={(e) => setProdStock(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 block">
                      {lang === 'Telugu' ? 'ధర ప్రతి కేజీ (₹) *' : 'Cost Price per KG (₹) *'}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      placeholder="e.g. 60"
                      value={prodCost}
                      onChange={(e) => setProdCost(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={resetForms}
                    className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs font-bold bg-[#2563eb] text-white rounded-lg hover:bg-[#1d4ed8] transition-colors cursor-pointer"
                  >
                    Save Product
                  </button>
                </div>
              </form>
            )}

            {/* FORM: Receive Stock */}
            {activeForm === 'receive' && (
              <form onSubmit={handleReceiveSubmit} className="space-y-4">
                <h3 className="text-sm font-bold text-[#0f172a] uppercase tracking-wider">
                  {lang === 'Telugu' ? 'స్టాక్ లోపలికి నమోదు చేయండి' : 'Log Stock Inbound (Receive Stock)'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 block">
                      {lang === 'Telugu' ? 'ముడి సరుకు ఎంచుకోండి *' : 'Select Raw Material *'}
                    </label>
                    <select
                      required
                      value={recProdId}
                      onChange={(e) => handleSelectProductForReceive(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                    >
                      <option value="">-- Select --</option>
                      {products.filter((p) => !p.type || p.type === 'RawMaterial').map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} (Current: {p.stock} KG)
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 block">
                      {lang === 'Telugu' ? 'సరఫరాదారుడు (Supplier) *' : 'Select Supplier *'}
                    </label>
                    <select
                      required
                      value={recSupplierId}
                      onChange={(e) => setRecSupplierId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                    >
                      <option value="">-- Select Supplier --</option>
                      {contacts.filter((c) => c.type === 'Supplier').map((supplier) => (
                        <option key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </option>
                      ))}
                    </select>
                    {contacts.filter((c) => c.type === 'Supplier').length === 0 && (
                      <span className="text-[10px] text-amber-600 block leading-tight">
                        {lang === 'Telugu' ? 'సరఫరాదారులను నమోదు చేయండి!' : 'No suppliers registered!'}
                      </span>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 block">
                      {lang === 'Telugu' ? 'పరిమాణం (KGs) *' : 'Quantity (KGs) *'}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      placeholder="KGs to add"
                      value={recQty}
                      onChange={(e) => setRecQty(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 block">
                      {lang === 'Telugu' ? 'కొనుగోలు ధర (₹) *' : 'Cost Price per KG (₹) *'}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      placeholder="Actual purchase cost"
                      value={recPrice}
                      onChange={(e) => setRecPrice(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 block">
                      {lang === 'Telugu' ? 'గమనికలు (Notes)' : 'Notes / Remarks'}
                    </label>
                    <input
                      type="text"
                      placeholder="Batch details or invoice"
                      value={recNotes}
                      onChange={(e) => setRecNotes(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={resetForms}
                    className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs font-bold bg-[#0f172a] text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Inbound Stock
                  </button>
                </div>
              </form>
            )}

            {/* FORM: Ship Stock */}
            {activeForm === 'ship' && (
              <form onSubmit={handleShipSubmit} className="space-y-4">
                <h3 className="text-sm font-bold text-[#10b981] uppercase tracking-wider">
                  {lang === 'Telugu' ? 'స్టాక్ అమ్మకాలు నమోదు చేయండి' : 'Log Stock Outbound (Ship Stock / Sales)'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 block">
                      {lang === 'Telugu' ? 'తయారైన వస్తువు ఎంచుకోండి *' : 'Select Finished Good *'}
                    </label>
                    <select
                      required
                      value={shipProdId}
                      onChange={(e) => handleSelectProductForShip(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                    >
                      <option value="">-- Select --</option>
                      {products.filter((p) => !p.type || p.type === 'FinishedGood').map((p) => (
                        <option key={p.id} value={p.id} disabled={p.stock <= 0}>
                          {p.name} (In stock: {p.stock} KG)
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 block">
                      {lang === 'Telugu' ? 'కస్టమర్ ఎంచుకోండి *' : 'Select Customer *'}
                    </label>
                    <select
                      required
                      value={shipCustomerId}
                      onChange={(e) => setShipCustomerId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                    >
                      <option value="">-- Select Customer --</option>
                      {contacts.filter((c) => c.type === 'Customer').map((customer) => (
                        <option key={customer.id} value={customer.id}>
                          {customer.name}
                        </option>
                      ))}
                    </select>
                    {contacts.filter((c) => c.type === 'Customer').length === 0 && (
                      <span className="text-[10px] text-amber-600 block leading-tight">
                        {lang === 'Telugu' ? 'కస్టమర్లను నమోదు చేయండి!' : 'No customers registered!'}
                      </span>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 block">
                      {lang === 'Telugu' ? 'అమ్మకం పరిమాణం (KGs) *' : 'Quantity (KGs) *'}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      placeholder="KGs to ship"
                      value={shipQty}
                      onChange={(e) => {
                        const targetProd = products.find(p => p.id === shipProdId);
                        if (targetProd && parseFloat(e.target.value) > targetProd.stock) {
                          setShipQty(targetProd.stock.toString());
                        } else {
                          setShipQty(e.target.value);
                        }
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 block">
                      {lang === 'Telugu' ? 'అమ్మకపు ధర (₹) *' : 'Selling Price per KG (₹) *'}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      placeholder="Selling price"
                      value={shipPrice}
                      onChange={(e) => setShipPrice(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 block">
                      {lang === 'Telugu' ? 'గమనికలు (Notes)' : 'Notes / Remarks'}
                    </label>
                    <input
                      type="text"
                      placeholder="Invoice reference or notes"
                      value={shipNotes}
                      onChange={(e) => setShipNotes(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={resetForms}
                    className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs font-bold bg-[#10b981] text-white rounded-lg hover:bg-emerald-600 transition-colors cursor-pointer"
                  >
                    Outbound Stock
                  </button>
                </div>
              </form>
            )}

          </motion.div>
        )}
      </AnimatePresence>

      {/* Segmented Inner Navigation Tabs */}
      <div className="flex bg-slate-100 p-1.5 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('products')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
            activeTab === 'products'
              ? 'bg-[#FAF3EA] text-[#B48243] border border-[#F4E6D4]/60 shadow-sm'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Product List ({products.length})
        </button>
        <button
          onClick={() => setActiveTab('stockIn')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
            activeTab === 'stockIn'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60 shadow-sm'
              : 'text-slate-500 hover:text-emerald-700'
          }`}
        >
          Stock In (Received) ({filteredStockIn.length})
        </button>
        <button
          onClick={() => setActiveTab('stockOut')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
            activeTab === 'stockOut'
              ? 'bg-rose-50 text-rose-700 border border-rose-200/60 shadow-sm'
              : 'text-slate-500 hover:text-rose-700'
          }`}
        >
          Stock Out (Sold) ({filteredStockOut.length})
        </button>
      </div>

      {/* Search Bar Container */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 flex items-center space-x-3 shadow-sm">
        <Search className="w-5 h-5 text-slate-400 shrink-0" />
        <input
          type="text"
          placeholder="Search product by name or code..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-transparent text-slate-800 text-sm focus:outline-none placeholder-slate-400"
        />
      </div>

      {/* Main Lists Content / Tables */}
      <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-sm">
        
        {products.length === 0 ? (
          /* Elegant Centered Vector Lavender Box Empty State */
          <div id="aesthetic_empty_state" className="flex flex-col items-center justify-center py-16 px-6 text-center space-y-5 bg-gradient-to-b from-white to-slate-50/50">
            <div className="relative w-48 h-48 flex items-center justify-center">
              {/* Floating Sparkles & Dotted Lines SVG Vector Graphics */}
              <svg viewBox="0 0 200 200" className="absolute inset-0 w-full h-full text-indigo-500">
                <path
                  d="M 20 140 Q 60 40 130 90 T 180 30"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeDasharray="4 6"
                  className="text-slate-300"
                />
                <path
                  d="M 60 160 Q 140 160 120 110 T 60 110"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                  strokeDasharray="2 4"
                  className="text-indigo-200"
                />
                <g transform="translate(178, 25) rotate(-15)">
                  <path d="M0 0 L15 15 L5 20 L0 0 Z" fill="#c084fc" />
                  <path d="M15 15 L8 12 L5 20" fill="#a855f7" />
                </g>
                <g transform="translate(40, 60)" className="text-yellow-500">
                  <path d="M0 -6 L2 -2 L6 0 L2 2 L0 6 L-2 2 L-6 0 L-2 -2 Z" fill="currentColor" />
                </g>
                <g transform="translate(150, 110)" className="text-purple-400">
                  <path d="M0 -4 L1 -1 L4 0 L1 1 L0 4 L-1 1 L-4 0 L-1 -1 Z" fill="currentColor" />
                </g>
              </svg>

              <div className="relative z-10 w-32 h-32 flex items-center justify-center">
                <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_8px_16px_rgba(168,85,247,0.12)]">
                  <path d="M20 35 L40 20 L40 28 L20 43 Z" fill="#c084fc" />
                  <path d="M80 35 L60 20 L60 28 L80 43 Z" fill="#a855f7" />
                  <path d="M25 45 L50 60 L50 85 L25 70 Z" fill="#e9d5ff" />
                  <path d="M75 45 L50 60 L50 85 L75 70 Z" fill="#d8b4fe" />
                  <path d="M25 45 L50 35 L75 45 L50 60 Z" fill="#f3e8ff" />
                  <path d="M25 45 L50 60 L75 45 L75 47 L50 62 L25 47 Z" fill="#b070fc" />
                  <circle cx="50" cy="48" r="4" fill="#a855f7" />
                </svg>
              </div>
            </div>

            <div className="max-w-md space-y-1.5">
              <h3 className="text-base font-bold text-slate-800 tracking-wide">{t.emptyStateTitle}</h3>
              <p className="text-xs text-slate-500 leading-relaxed px-4">{t.emptyStateDesc}</p>
            </div>

            <button
              id="empty_state_cta"
              onClick={() => setActiveForm('add')}
              className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-bold bg-[#2563eb] text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{t.emptyStateBtn}</span>
            </button>
          </div>
        ) : filteredProducts.length === 0 ? (
          /* Search results empty state */
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center space-y-3 bg-slate-50/20">
            <AlertCircle className="w-10 h-10 text-slate-400" />
            <div className="max-w-md">
              <h3 className="text-sm font-bold text-slate-700">No products found matching your filters.</h3>
              <p className="text-xs text-slate-400 mt-1">Try resetting or editing your search keyword.</p>
            </div>
            <button
              onClick={() => setSearchTerm('')}
              className="px-3 py-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 border border-blue-200 hover:border-blue-300 rounded-lg bg-white transition-all cursor-pointer"
            >
              Clear Search
            </button>
          </div>
        ) : (
          /* Product and Movements Tables */
          <div className="overflow-x-auto">
            {activeTab === 'products' && (
              <table id="products_table" className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-[#f8fafc] text-slate-500 font-bold uppercase tracking-wider">
                    <th className="px-5 py-3.5 text-slate-600 font-bold">PRODUCT NAME</th>
                    <th className="px-5 py-3.5 text-center text-slate-600 font-bold">CLASSIFICATION</th>
                    <th className="px-5 py-3.5 text-right text-slate-600 font-bold">CURRENT STOCK (KGS)</th>
                    <th className="px-5 py-3.5 text-right text-slate-600 font-bold">COST PER KG</th>
                    <th className="px-5 py-3.5 text-right text-slate-600 font-bold">NO. OF KGS PURCHASED</th>
                    <th className="px-5 py-3.5 text-center text-slate-600 font-bold">STATUS</th>
                    <th className="px-5 py-3.5 text-center text-slate-600 font-bold">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredProducts.map((p) => {
                    const kgsPurchased = getKgsPurchased(p.id);
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition-colors text-slate-700">
                        <td className="px-5 py-3.5 font-bold text-slate-900">{p.name}</td>
                        <td className="px-5 py-3.5 text-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            p.type === 'RawMaterial'
                              ? 'bg-blue-50 border-blue-200 text-blue-700'
                              : p.type === 'FinishedGood'
                              ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                              : 'bg-slate-50 border-slate-200 text-slate-700'
                          }`}>
                            {p.type === 'RawMaterial' 
                              ? (lang === 'Telugu' ? 'ముడి సరుకు' : 'Raw Material 📥')
                              : p.type === 'FinishedGood'
                              ? (lang === 'Telugu' ? 'తయారైన వస్తువు' : 'Finished Good 📤')
                              : (lang === 'Telugu' ? 'సాధారణ' : 'General')}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right font-mono font-bold text-slate-800">
                          {p.stock.toFixed(2)} KG
                        </td>
                        <td className="px-5 py-3.5 text-right font-mono text-slate-700">
                          ₹{p.costPerKg.toFixed(2)}
                        </td>
                        <td className="px-5 py-3.5 text-right font-mono text-slate-700 font-medium">
                          {kgsPurchased.toFixed(2)} KG
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            p.status === 'In Stock'
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                              : p.status === 'Low Stock'
                              ? 'bg-amber-50 border-amber-200 text-amber-700'
                              : 'bg-rose-50 border-rose-200 text-rose-700'
                          }`}>
                            {p.status === 'In Stock' ? t.inStock : p.status === 'Low Stock' ? t.lowStock : t.outOfStock}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <button
                            onClick={() => onDeleteProduct(p.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-all cursor-pointer"
                            title="Delete Product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            {/* TAB: Stock In Movements */}
            {activeTab === 'stockIn' && (
              <table id="stock_in_table" className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-[#f8fafc] text-slate-500 font-bold uppercase tracking-wider">
                    <th className="px-5 py-3.5 text-slate-600 font-bold">Date</th>
                    <th className="px-5 py-3.5 text-slate-600 font-bold">Product Name</th>
                    <th className="px-5 py-3.5 text-right text-slate-600 font-bold">Received (KGs)</th>
                    <th className="px-5 py-3.5 text-right text-slate-600 font-bold">Actual Cost Price</th>
                    <th className="px-5 py-3.5 text-right text-slate-600 font-bold">Subtotal</th>
                    <th className="px-5 py-3.5 text-slate-600 font-bold">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredStockIn.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                        No inbound stock received yet.
                      </td>
                    </tr>
                  ) : (
                    filteredStockIn.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50/80 transition-colors text-slate-700">
                        <td className="px-5 py-3.5 text-slate-400 font-mono">
                          {new Date(m.date).toLocaleDateString(lang === 'Telugu' ? 'te-IN' : 'en-US')}
                        </td>
                        <td className="px-5 py-3.5 font-bold text-slate-900">{m.productName}</td>
                        <td className="px-5 py-3.5 text-right font-mono text-emerald-600 font-bold">
                          +{m.quantity.toFixed(2)} KG
                        </td>
                        <td className="px-5 py-3.5 text-right font-mono text-slate-600">
                          ₹{m.pricePerKg.toFixed(2)}
                        </td>
                        <td className="px-5 py-3.5 text-right font-mono text-slate-900 font-bold">
                          ₹{(m.quantity * m.pricePerKg).toFixed(2)}
                        </td>
                        <td className="px-5 py-3.5 text-slate-500 italic max-w-xs truncate">
                          {m.notes || '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {/* TAB: Stock Out Movements */}
            {activeTab === 'stockOut' && (
              <table id="stock_out_table" className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-[#f8fafc] text-slate-500 font-bold uppercase tracking-wider">
                    <th className="px-5 py-3.5 text-slate-600 font-bold">Date</th>
                    <th className="px-5 py-3.5 text-slate-600 font-bold">Product Name</th>
                    <th className="px-5 py-3.5 text-right text-slate-600 font-bold">Shipped / Sold (KGs)</th>
                    <th className="px-5 py-3.5 text-right text-slate-600 font-bold">Selling Price</th>
                    <th className="px-5 py-3.5 text-right text-slate-600 font-bold">Total Invoice</th>
                    <th className="px-5 py-3.5 text-slate-600 font-bold">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredStockOut.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                        No outbound stock shipped yet.
                      </td>
                    </tr>
                  ) : (
                    filteredStockOut.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50/80 transition-colors text-slate-700">
                        <td className="px-5 py-3.5 text-slate-400 font-mono">
                          {new Date(m.date).toLocaleDateString(lang === 'Telugu' ? 'te-IN' : 'en-US')}
                        </td>
                        <td className="px-5 py-3.5 font-bold text-slate-900">{m.productName}</td>
                        <td className="px-5 py-3.5 text-right font-mono text-rose-600 font-bold">
                          -{m.quantity.toFixed(2)} KG
                        </td>
                        <td className="px-5 py-3.5 text-right font-mono text-slate-600">
                          ₹{m.pricePerKg.toFixed(2)}
                        </td>
                        <td className="px-5 py-3.5 text-right font-mono text-emerald-600 font-bold">
                          ₹{(m.quantity * m.pricePerKg).toFixed(2)}
                        </td>
                        <td className="px-5 py-3.5 text-slate-500 italic max-w-xs truncate">
                          {m.notes || '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
