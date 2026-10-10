import type { AppData } from '../types'

const today = new Date()
const iso = (daysAgo: number) => new Date(today.getTime() - daysAgo * 86400000).toISOString()
const dateOnly = (daysAgo: number) => iso(daysAgo).slice(0, 10)

export const seedData: AppData = {
  products: [
    { id: 'p1', name: 'Raw Cashew Nuts (RCN)', stock: 5000, costPerKg: 154, pricePerKg: 172, status: 'In Stock', reorderThreshold: 1800, type: 'RawMaterial', batch: 'RCN-2410-A' },
    { id: 'p2', name: 'W-180 · King', stock: 320, costPerKg: 890, pricePerKg: 1120, status: 'In Stock', reorderThreshold: 120, type: 'FinishedGood', batch: 'KRN-180-18' },
    { id: 'p3', name: 'W-210 · Jumbo', stock: 475, costPerKg: 810, pricePerKg: 975, status: 'In Stock', reorderThreshold: 180, type: 'FinishedGood', batch: 'KRN-210-21' },
    { id: 'p4', name: 'W-240', stock: 850, costPerKg: 745, pricePerKg: 890, status: 'In Stock', reorderThreshold: 250, type: 'FinishedGood', batch: 'KRN-240-42' },
    { id: 'p5', name: 'W-320 · Standard', stock: 1400, costPerKg: 680, pricePerKg: 805, status: 'In Stock', reorderThreshold: 400, type: 'FinishedGood', batch: 'KRN-320-67' },
    { id: 'p6', name: 'LWP · Large White Pieces', stock: 360, costPerKg: 520, pricePerKg: 640, status: 'In Stock', reorderThreshold: 150, type: 'FinishedGood', batch: 'LWP-2410-09' },
    { id: 'p7', name: 'JH / Tukda · Splits', stock: 600, costPerKg: 470, pricePerKg: 565, status: 'In Stock', reorderThreshold: 225, type: 'FinishedGood', batch: 'TUK-2410-31' },
    { id: 'p8', name: 'SWP · Baby Bits', stock: 95, costPerKg: 365, pricePerKg: 435, status: 'Low Stock', reorderThreshold: 120, type: 'FinishedGood', batch: 'SWP-2410-12' },
  ],
  parties: [
    { id: 'c1', name: 'Palasa Coastal Aggregators', type: 'Supplier', email: 'procurement@palasacoastal.in', phone: '+91 94403 18842', address: 'Kasibugga Road, Palasa, Srikakulam' },
    { id: 'c2', name: 'Krishna Delta Farmers Collective', type: 'Supplier', email: 'sales@kdfc.co.in', phone: '+91 98481 66210', address: 'Auto Nagar, Vijayawada, Krishna' },
    { id: 'c3', name: 'Sri Rama Packaging', type: 'Supplier', email: 'orders@sriramapack.com', phone: '+91 863 224 9081', address: 'Brodipet, Guntur' },
    { id: 'c4', name: 'Vizag Dry Fruits Wholesale', type: 'Customer', email: 'buying@vizagdryfruits.in', phone: '+91 891 278 4412', address: 'Dwaraka Nagar, Visakhapatnam' },
    { id: 'c5', name: 'Coastal Choice Retail', type: 'Customer', email: 'purchase@coastalchoice.in', phone: '+91 866 247 3190', address: 'Governorpet, Vijayawada' },
    { id: 'c6', name: 'Guntur Premium Foods', type: 'Customer', email: 'accounts@gunturpremium.in', phone: '+91 863 233 7824', address: 'Arundelpet, Guntur' },
  ],
  staff: [
    { id: 's1', name: 'S. Lakshmi', role: 'Shelling', salary: 16800 },
    { id: 's2', name: 'P. Durga Rao', role: 'Machine Operator', salary: 24500 },
    { id: 's3', name: 'K. Bhavani', role: 'Peeling', salary: 16400 },
    { id: 's4', name: 'M. Padma', role: 'Grading', salary: 18200 },
    { id: 's5', name: 'T. Suresh', role: 'Packing', salary: 17600 },
    { id: 's6', name: 'V. Anjali', role: 'Grading', salary: 18200 },
    { id: 's7', name: 'N. Srinivas', role: 'Supervisor', salary: 32000 },
    { id: 's8', name: 'B. Ramana', role: 'Shelling', salary: 16800 },
  ],
  attendance: Array.from({ length: 10 }, (_, i) => ({
    id: dateOnly(i + 1), date: dateOnly(i + 1),
    status: Object.fromEntries(['s1','s2','s3','s4','s5','s6','s7','s8'].map((id, j) => [id, (i + j) % 11 === 0 ? 'Absent' : 'Present'])) as Record<string, 'Present' | 'Absent'>,
  })),
  movements: [
    { id: 'm1', productId: 'p1', productName: 'Raw Cashew Nuts (RCN)', type: 'IN', quantity: 2200, pricePerKg: 154, date: dateOnly(2), party: 'Palasa Coastal Aggregators', notes: 'Moisture checked at 9.2%' },
    { id: 'm2', productId: 'p5', productName: 'W-320 · Standard', type: 'OUT', quantity: 420, pricePerKg: 805, date: dateOnly(3), party: 'Vizag Dry Fruits Wholesale', notes: 'Invoice SMI/2410/084' },
    { id: 'm3', productId: 'p4', productName: 'W-240', type: 'OUT', quantity: 180, pricePerKg: 890, date: dateOnly(6), party: 'Coastal Choice Retail', notes: '25 kg vacuum packs' },
    { id: 'm4', productId: 'p7', productName: 'JH / Tukda · Splits', type: 'IN', quantity: 210, pricePerKg: 470, date: dateOnly(7), party: 'Internal production', notes: 'Grading lot GR-391' },
    { id: 'm5', productId: 'p2', productName: 'W-180 · King', type: 'OUT', quantity: 80, pricePerKg: 1120, date: dateOnly(9), party: 'Guntur Premium Foods', notes: 'Premium export cartons' },
  ],
  expenses: [
    { id: 'e1', description: 'October factory power bill', recipient: 'APEPDCL Power Bill', amount: 86420, category: 'Electricity & Power', status: 'Settled', date: dateOnly(2) },
    { id: 'e2', description: 'Sorting and grading wages', recipient: 'Daily Sorters Wages', amount: 48400, category: 'Labour', status: 'Settled', date: dateOnly(4) },
    { id: 'e3', description: 'Food-grade vacuum pouches', recipient: 'Sri Rama Packaging', amount: 32750, category: 'Packaging Material', status: 'Pending', date: dateOnly(5) },
    { id: 'e4', description: 'RCN transport Palasa to factory', recipient: 'Sri Venkateswara Logistics', amount: 28600, category: 'Freight & Transport', status: 'Settled', date: dateOnly(7) },
    { id: 'e5', description: 'Shelling machine belt and service', recipient: 'Coastal Agro Machinery', amount: 18750, category: 'Machinery Maintenance', status: 'Pending', date: dateOnly(8) },
    { id: 'e6', description: 'Quality testing and stationery', recipient: 'Petty Cash — Factory Office', amount: 6240, category: 'General & Admin', status: 'Settled', date: dateOnly(10) },
  ],
  activities: [
    { id: 'a1', type: 'stock', message: '420 kg W-320 dispatched to Vizag Dry Fruits', timestamp: iso(0.08) },
    { id: 'a2', type: 'attendance', message: 'Attendance marked for 8 workers', timestamp: iso(0.16) },
    { id: 'a3', type: 'expense', message: '₹32,750 packaging expense added', timestamp: iso(1.2) },
    { id: 'a4', type: 'stock', message: '2,200 kg raw cashew nuts received', timestamp: iso(2.1) },
  ],
}
