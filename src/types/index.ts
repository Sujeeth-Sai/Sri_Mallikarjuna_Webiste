export type Language = 'en' | 'te'
export type View = 'dashboard' | 'inventory' | 'parties' | 'staff' | 'expenses' | 'advisor'

export type Product = {
  id: string
  name: string
  stock: number
  costPerKg: number
  pricePerKg: number
  status: 'In Stock' | 'Low Stock' | 'Out of Stock'
  reorderThreshold: number
  type: 'RawMaterial' | 'FinishedGood'
  batch: string
}

export type StockMovement = {
  id: string
  productId: string
  productName: string
  type: 'IN' | 'OUT'
  quantity: number
  pricePerKg: number
  date: string
  notes: string
  party?: string
}

export type SupplierCustomer = {
  id: string
  name: string
  type: 'Supplier' | 'Customer'
  email: string
  phone: string
  address: string
}

export type Staff = {
  id: string
  name: string
  role: 'Shelling' | 'Peeling' | 'Grading' | 'Packing' | 'Machine Operator' | 'Supervisor'
  salary: number
}

export type Attendance = {
  id: string
  date: string
  status: Record<string, 'Present' | 'Absent'>
}

export type Expense = {
  id: string
  description: string
  recipient: string
  amount: number
  category: 'Labour' | 'Electricity & Power' | 'Packaging Material' | 'Freight & Transport' | 'Machinery Maintenance' | 'General & Admin'
  status: 'Settled' | 'Pending'
  date: string
}

export type ActivityLog = {
  id: string
  type: 'stock' | 'expense' | 'attendance' | 'party'
  message: string
  timestamp: string
}

export type AppData = {
  products: Product[]
  movements: StockMovement[]
  parties: SupplierCustomer[]
  staff: Staff[]
  attendance: Attendance[]
  expenses: Expense[]
  activities: ActivityLog[]
}
