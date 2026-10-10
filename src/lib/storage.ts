import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { AppData, Attendance, Expense, Product, Staff, StockMovement, SupplierCustomer } from '../types'
import { emptyData } from '../data/seed'

const LOCAL_KEY = 'smi-erp-data-v3'
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim()
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()

export interface DataProvider {
  load(): Promise<AppData>
  save(data: AppData): Promise<void>
}

export class LocalStorageProvider implements DataProvider {
  async load() {
    const saved = localStorage.getItem(LOCAL_KEY)
    if (!saved) return structuredClone(emptyData)
    try { return JSON.parse(saved) as AppData } catch { return structuredClone(emptyData) }
  }

  async save(data: AppData) {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(data))
  }
}

type DbProduct = { id: string; name: string; current_stock: number; cost_per_kg: number; selling_price_per_kg: number; reorder_threshold: number; classification: string; unit: string; is_archived?: boolean }
type DbContact = { id: string; name: string; type: string; email?: string | null; phone?: string | null; address?: string | null; balance?: number | null }
type DbTransaction = { id: string; product_id: string; contact_id?: string | null; type: string; quantity: number; price_per_kg: number; transaction_date: string; remarks?: string | null }
type DbExpense = { id: string; description: string; amount: number; category: string; status: string; expense_date: string; notes?: string | null; paid?: boolean | null }
type DbEmployee = { id: string; name: string; designation: string; monthly_salary: number; phone?: string | null; is_active?: boolean; joining_date?: string | null }
type DbAttendance = { id: string; employee_id: string; attendance_date: string; status: string; daily_wage?: number | null }

const roleFromDb = (value: string): Staff['role'] => {
  const role = value.toLowerCase()
  if (role.includes('shell')) return 'Shelling'
  if (role.includes('peel')) return 'Peeling'
  if (role.includes('grad')) return 'Grading'
  if (role.includes('pack')) return 'Packing'
  if (role.includes('machine') || role.includes('boiler')) return 'Machine Operator'
  return 'Supervisor'
}

const categoryFromDb = (value: string): Expense['category'] => {
  const category = value.toLowerCase()
  if (category.includes('labour') || category.includes('wage')) return 'Labour'
  if (category.includes('electric') || category.includes('power') || category.includes('utilit')) return 'Electricity & Power'
  if (category.includes('pack')) return 'Packaging Material'
  if (category.includes('freight') || category.includes('transport')) return 'Freight & Transport'
  if (category.includes('machine') || category.includes('maintenance')) return 'Machinery Maintenance'
  return 'General & Admin'
}

const activityFrom = (movements: StockMovement[], expenses: Expense[], attendance: Attendance[]) => [
  ...movements.slice(0, 5).map(m => ({ id: `activity-${m.id}`, type: 'stock' as const, message: `${m.quantity} kg ${m.productName} ${m.type === 'IN' ? 'received' : 'dispatched'}`, timestamp: new Date(m.date).toISOString() })),
  ...expenses.slice(0, 3).map(e => ({ id: `activity-${e.id}`, type: 'expense' as const, message: `₹${e.amount.toLocaleString('en-IN')} ${e.description}`, timestamp: new Date(e.date).toISOString() })),
  ...attendance.slice(0, 2).map(a => ({ id: `activity-attendance-${a.date}`, type: 'attendance' as const, message: `Attendance updated for ${Object.keys(a.status).length} workers`, timestamp: new Date(a.date).toISOString() })),
].sort((a, b) => b.timestamp.localeCompare(a.timestamp))

async function stableUuid(value: string) {
  const bytes = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)))
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = [...bytes.slice(0, 16)].map(byte => byte.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

class SupabaseProvider implements DataProvider {
  private client: SupabaseClient
  private cache = new LocalStorageProvider()
  private previous: AppData | null = null

  constructor(url: string, key: string) {
    this.client = createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true } })
  }

  async load(): Promise<AppData> {
    try {
      const [productResult, contactResult, transactionResult, expenseResult, employeeResult, attendanceResult] = await Promise.all([
        this.client.from('products').select('*').order('name'),
        this.client.from('contacts').select('*').order('name'),
        this.client.from('stock_transactions').select('*').order('transaction_date', { ascending: false }),
        this.client.from('expenses').select('*').order('expense_date', { ascending: false }),
        this.client.from('employees').select('*').order('name'),
        this.client.from('attendance').select('*').order('attendance_date', { ascending: false }),
      ])
      const failure = [productResult, contactResult, transactionResult, expenseResult, employeeResult, attendanceResult].find(result => result.error)
      if (failure?.error) throw failure.error

      const products: Product[] = ((productResult.data || []) as DbProduct[]).filter(p => !p.is_archived).map(p => {
        const stock = Number(p.current_stock || 0)
        const threshold = Number(p.reorder_threshold || 0)
        return { id: p.id, name: p.name, stock, costPerKg: Number(p.cost_per_kg || 0), pricePerKg: Number(p.selling_price_per_kg || 0), reorderThreshold: threshold, status: stock <= 0 ? 'Out of Stock' : stock <= threshold ? 'Low Stock' : 'In Stock', type: p.classification.toLowerCase().includes('raw') ? 'RawMaterial' : 'FinishedGood', batch: `DB-${p.id.slice(0, 8).toUpperCase()}` }
      })
      const parties: SupplierCustomer[] = ((contactResult.data || []) as DbContact[]).map(p => ({ id: p.id, name: p.name, type: p.type === 'Supplier' ? 'Supplier' : 'Customer', email: p.email || '', phone: p.phone || '', address: p.address || '' }))
      const productNames = new Map(products.map(p => [p.id, p.name]))
      const partyNames = new Map(parties.map(p => [p.id, p.name]))
      const movements: StockMovement[] = ((transactionResult.data || []) as DbTransaction[]).map(m => ({ id: m.id, productId: m.product_id, productName: productNames.get(m.product_id) || 'Unknown product', type: m.type.toLowerCase().startsWith('in') ? 'IN' : 'OUT', quantity: Number(m.quantity || 0), pricePerKg: Number(m.price_per_kg || 0), date: m.transaction_date.slice(0, 10), notes: m.remarks || '', party: m.contact_id ? partyNames.get(m.contact_id) : undefined }))
      const expenses: Expense[] = ((expenseResult.data || []) as DbExpense[]).map(e => ({ id: e.id, description: e.description, recipient: e.notes?.match(/^Paid to:\s*(.+)$/i)?.[1] || 'Factory account', amount: Number(e.amount || 0), category: categoryFromDb(e.category), status: e.status === 'Settled' || e.paid ? 'Settled' : 'Pending', date: e.expense_date.slice(0, 10) }))
      const staff: Staff[] = ((employeeResult.data || []) as DbEmployee[]).filter(e => e.is_active !== false).map(e => ({ id: e.id, name: e.name, role: roleFromDb(e.designation), salary: Number(e.monthly_salary || 0) }))
      const grouped = new Map<string, Attendance>()
      ;((attendanceResult.data || []) as DbAttendance[]).forEach(a => {
        const date = a.attendance_date.slice(0, 10)
        const record = grouped.get(date) || { id: date, date, status: {} }
        record.status[a.employee_id] = a.status === 'Absent' ? 'Absent' : 'Present'
        grouped.set(date, record)
      })
      const attendance = [...grouped.values()]
      const data = { products, movements, parties, staff, attendance, expenses, activities: activityFrom(movements, expenses, attendance) }
      this.previous = structuredClone(data)
      await this.cache.save(data)
      return data
    } catch (error) {
      console.warn('Supabase unavailable; using the local offline cache.', error)
      const cached = await this.cache.load()
      this.previous = structuredClone(cached)
      return cached
    }
  }

  async save(data: AppData) {
    await this.cache.save(data)
    try {
      const productRows = data.products.map(p => ({ id: p.id, name: p.name, current_stock: p.stock, cost_per_kg: p.costPerKg, selling_price_per_kg: p.pricePerKg, reorder_threshold: p.reorderThreshold, classification: p.type === 'RawMaterial' ? 'Raw Material' : 'Finished Good', unit: 'KG', is_archived: false }))
      const contactRows = data.parties.map(p => ({ id: p.id, name: p.name, type: p.type, email: p.email || null, phone: p.phone || null, address: p.address || null, balance: 0 }))
      const partyIds = new Map(data.parties.map(p => [p.name, p.id]))
      const movementRows = data.movements.map(m => ({ id: m.id, product_id: m.productId, contact_id: m.party ? partyIds.get(m.party) || null : null, type: m.type === 'IN' ? 'Inbound' : 'Outbound', quantity: m.quantity, price_per_kg: m.pricePerKg, total_amount: m.quantity * m.pricePerKg, transaction_date: m.date, remarks: m.notes || null }))
      const expenseRows = data.expenses.map(e => ({ id: e.id, description: e.description, amount: e.amount, category: e.category, status: e.status, expense_date: e.date, notes: `Paid to: ${e.recipient}`, paid: e.status === 'Settled' }))
      const employeeRows = data.staff.map(s => ({ id: s.id, name: s.name, designation: s.role, monthly_salary: s.salary, is_active: true, joining_date: new Date().toISOString().slice(0, 10) }))
      const attendanceRows = await Promise.all(data.attendance.flatMap(a => Object.entries(a.status).map(async ([employeeId, status]) => ({ id: await stableUuid(`${employeeId}:${a.date}`), employee_id: employeeId, attendance_date: a.date, status, daily_wage: (data.staff.find(s => s.id === employeeId)?.salary || 0) / 26 }))))

      const writes = [
        productRows.length ? this.client.from('products').upsert(productRows) : null,
        contactRows.length ? this.client.from('contacts').upsert(contactRows) : null,
        movementRows.length ? this.client.from('stock_transactions').upsert(movementRows) : null,
        expenseRows.length ? this.client.from('expenses').upsert(expenseRows) : null,
        employeeRows.length ? this.client.from('employees').upsert(employeeRows) : null,
        attendanceRows.length ? this.client.from('attendance').upsert(attendanceRows) : null,
      ].filter(Boolean)
      const results = await Promise.all(writes)
      const failure = results.find(result => result?.error)
      if (failure?.error) throw failure.error

      if (this.previous) {
        await Promise.all([
          this.deleteRemoved('products', this.previous.products.map(x => x.id), data.products.map(x => x.id)),
          this.deleteRemoved('contacts', this.previous.parties.map(x => x.id), data.parties.map(x => x.id)),
          this.deleteRemoved('expenses', this.previous.expenses.map(x => x.id), data.expenses.map(x => x.id)),
          this.deleteRemoved('employees', this.previous.staff.map(x => x.id), data.staff.map(x => x.id)),
        ])
      }
      this.previous = structuredClone(data)
    } catch (error) {
      console.warn('Cloud sync failed; changes remain safely cached on this device.', error)
    }
  }

  private async deleteRemoved(table: string, before: string[], after: string[]) {
    const removed = before.filter(id => !after.includes(id))
    if (removed.length) await this.client.from(table).delete().in('id', removed)
  }
}

export const isCloudConfigured = Boolean(supabaseUrl && supabaseKey)
export const dataProvider: DataProvider = isCloudConfigured ? new SupabaseProvider(supabaseUrl!, supabaseKey!) : new LocalStorageProvider()
