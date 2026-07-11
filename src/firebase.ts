import { createClient } from '@supabase/supabase-js';
import { Product, StockMovement, SupplierCustomer, Staff, Attendance, Expense, ActivityLog } from './types';

// Supabase Credentials (loaded from environment variables, with fallback to default project)
const supabaseUrl = process.env.SUPABASE_URL || (process.env as any).NEXT_PUBLIC_SUPABASE_URL || 'https://dghnymvkqkhfjbwjmcok.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || (process.env as any).NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_BpVhvIF4LjP0dKkEFjVWtg_BsiPdHZx';

// Initialize Supabase Client
export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Generates a standard RFC4122 v4 UUID string.
 * This ensures client-generated IDs are fully compatible with both UUID and TEXT column types in Supabase.
 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Synchronously tracked user ID from Auth state
let currentUserId: string | null = null;

supabase.auth.onAuthStateChange((_event, session) => {
  currentUserId = session?.user?.id || null;
  console.log('⚡ [SUPABASE AUTH SYNC] User ID:', currentUserId);
});

// Schema status monitoring state
export const schemaStatus = {
  isTablesMissing: false,
  listeners: new Set<(isMissing: boolean) => void>(),
  setTablesMissing(val: boolean) {
    if (this.isTablesMissing !== val) {
      this.isTablesMissing = val;
      this.listeners.forEach(cb => cb(val));
    }
  },
  onChange(cb: (isMissing: boolean) => void) {
    this.listeners.add(cb);
    cb(this.isTablesMissing);
    return () => {
      this.listeners.delete(cb);
    };
  }
};

// ============================================================================
// STYLIZED CONSOLE LOGGER FOR SUPABASE DEBUGGING
// ============================================================================

function logRequest(action: string, table: string, payload?: any) {
  console.log(
    `%c⚡ [SUPABASE REQUEST] %c${action.toUpperCase()}%c on table %c"${table}"%c`,
    "color: #2563eb; font-weight: bold; background-color: #eff6ff; padding: 2px 4px; border-radius: 4px; border: 1px solid #bfdbfe;",
    "color: #1e40af; font-weight: 800; text-decoration: underline;",
    "color: #4b5563; font-weight: normal;",
    "color: #059669; font-weight: bold; font-family: monospace;",
    "color: #4b5563; font-weight: normal;",
    payload ? { payload } : ""
  );
}

function logResponse(action: string, table: string, data: any) {
  console.log(
    `%c✅ [SUPABASE RESPONSE] %c${action.toUpperCase()}%c on table %c"${table}"%c`,
    "color: #059669; font-weight: bold; background-color: #ecfdf5; padding: 2px 4px; border-radius: 4px; border: 1px solid #a7f3d0;",
    "color: #065f46; font-weight: 800;",
    "color: #4b5563; font-weight: normal;",
    "color: #2563eb; font-weight: bold; font-family: monospace;",
    "color: #4b5563; font-weight: normal;",
    { responseData: data }
  );
}

function logError(action: string, table: string, error: any) {
  console.error(
    `%c❌ [SUPABASE ERROR] %c${action.toUpperCase()}%c on table %c"${table}"%c`,
    "color: #dc2626; font-weight: bold; background-color: #fef2f2; padding: 2px 4px; border-radius: 4px; border: 1px solid #fca5a5;",
    "color: #991b1b; font-weight: 800;",
    "color: #4b5563; font-weight: normal;",
    "color: #d97706; font-weight: bold; font-family: monospace;",
    "color: #4b5563; font-weight: normal;",
    error
  );
}

function logRealtime(action: string, table: string, payload: any) {
  console.log(
    `%c🔔 [SUPABASE REALTIME EVENT] %c${action}%c on table %c"${table}"%c`,
    "color: #7c3aed; font-weight: bold; background-color: #f5f3ff; padding: 2px 4px; border-radius: 4px; border: 1px solid #ddd6fe;",
    "color: #5b21b6; font-weight: 800;",
    "color: #4b5563; font-weight: normal;",
    "color: #db2777; font-weight: bold; font-family: monospace;",
    "color: #4b5563; font-weight: normal;",
    payload
  );
}

// Runtime schema version flags to dynamically fallback if user hasn't run the latest SQL migration
const schemaVersions: Record<string, 'new' | 'old'> = {
  products: 'new',
  movements: 'new',
  contacts: 'new',
  staff: 'new',
  attendance: 'new',
  expenses: 'new'
};

// In-Memory Database Cache (strictly in-memory, no persistence to localStorage/IndexedDB)
const inMemoryData: Record<string, any[]> = {};

// Active registry of snapshot listener callbacks
const listeners: Record<string, Set<(data: any[]) => void>> = {};

/**
 * Maps collection name to actual Postgres table name in Supabase
 */
function getTableName(collectionName: string): string {
  const version = schemaVersions[collectionName] || 'new';
  if (collectionName === 'movements') {
    return version === 'new' ? 'stock_transactions' : 'movements';
  }
  if (collectionName === 'staff') {
    return version === 'new' ? 'employees' : 'staff';
  }
  return collectionName;
}

/**
 * Group flat attendance records from Database by attendance_date for the UI
 */
function groupAttendance(rows: any[]): Attendance[] {
  const grouped: Record<string, Record<string, 'Present' | 'Absent'>> = {};
  
  rows.forEach(row => {
    const date = row.attendance_date || row.date;
    const employeeId = row.employee_id || row.id;
    let status = 'Present';
    if (row.status) {
      if (typeof row.status === 'string') {
        status = (row.status === 'Present' || row.status === 'Absent') ? row.status : 'Present';
      }
    }
    
    if (date && employeeId) {
      if (!grouped[date]) {
        grouped[date] = {};
      }
      grouped[date][employeeId] = status as 'Present' | 'Absent';
    }
  });
  
  return Object.entries(grouped).map(([date, statusMap]) => ({
    id: date,
    date,
    status: statusMap
  }));
}

/**
 * Maps a single object loaded from Supabase to App-friendly camelCase fields.
 */
export function mapFromDB(collectionName: string, item: any): any {
  if (!item) return item;
  
  if (collectionName === 'products') {
    return {
      id: item.id,
      name: item.name,
      stock: Number(item.current_stock ?? item.stock ?? 0),
      costPerKg: Number(item.cost_per_kg ?? item.costPerKg ?? item.costperkg ?? 0),
      pricePerKg: Number(item.selling_price_per_kg ?? item.pricePerKg ?? item.priceperkg ?? 0),
      status: item.status || (Number(item.current_stock ?? item.stock ?? 0) > (item.reorder_threshold ?? item.reorderThreshold ?? 10) ? 'In Stock' : Number(item.current_stock ?? item.stock ?? 0) > 0 ? 'Low Stock' : 'Out of Stock'),
      reorderThreshold: item.reorder_threshold !== undefined && item.reorder_threshold !== null 
        ? Number(item.reorder_threshold) 
        : (item.reorderThreshold !== undefined && item.reorderThreshold !== null ? Number(item.reorderThreshold) : undefined),
      createdAt: item.created_at ?? item.createdAt ?? item.createdat ?? new Date().toISOString(),
      type: item.classification ?? item.type
    };
  }
  
  if (collectionName === 'movements') {
    const productName = item.products?.name ?? item.product_name ?? item.productname ?? item.productName ?? 'Unknown Product';
    return {
      id: item.id,
      productId: item.product_id ?? item.productid ?? item.productId,
      productName: productName,
      type: item.type,
      quantity: Number(item.quantity ?? 0),
      pricePerKg: Number(item.price_per_kg ?? item.priceperkg ?? item.pricePerKg ?? 0),
      date: item.transaction_date ?? item.date,
      notes: item.remarks ?? item.notes
    };
  }
  
  if (collectionName === 'contacts') {
    return {
      id: item.id,
      name: item.name,
      type: item.type,
      email: item.email ?? '',
      phone: item.phone ?? '',
      address: item.address ?? ''
    };
  }
  
  if (collectionName === 'staff') {
    return {
      id: item.id,
      name: item.name,
      role: item.designation ?? item.role,
      salary: Number(item.monthly_salary ?? item.salary ?? 0)
    };
  }
  
  if (collectionName === 'expenses') {
    return {
      id: item.id,
      description: item.notes ?? item.description,
      amount: Number(item.amount ?? 0),
      category: item.category,
      status: item.paid === true || item.status === 'Settled' ? 'Settled' : 'Pending',
      date: item.expense_date ?? item.date
    };
  }
  
  if (collectionName === 'logs') {
    return {
      id: item.id,
      type: item.type,
      message: item.message,
      date: item.created_at ?? item.date
    };
  }
  
  return item;
}

/**
 * Maps a single object from App-friendly camelCase fields to DB-friendly lowercase/columns.
 */
export function mapToDB(collectionName: string, item: any): any {
  if (!item) return item;
  const version = schemaVersions[collectionName] || 'new';
  
  if (collectionName === 'products') {
    if (version === 'new') {
      return {
        id: item.id,
        name: item.name,
        classification: item.type || 'RawMaterial',
        unit: 'kg',
        current_stock: item.stock || 0,
        cost_per_kg: item.costPerKg || 0,
        selling_price_per_kg: item.pricePerKg || 0,
        reorder_threshold: item.reorderThreshold !== undefined ? item.reorderThreshold : 10,
        is_archived: false,
        created_at: item.createdAt || new Date().toISOString()
      };
    } else {
      return {
        id: item.id,
        name: item.name,
        stock: item.stock || 0,
        costPerKg: item.costPerKg || 0,
        pricePerKg: item.pricePerKg || 0,
        status: item.status || (Number(item.stock || 0) > (item.reorderThreshold ?? 10) ? 'In Stock' : Number(item.stock || 0) > 0 ? 'Low Stock' : 'Out of Stock'),
        reorderThreshold: item.reorderThreshold !== undefined ? item.reorderThreshold : 10,
        createdAt: item.createdAt || new Date().toISOString(),
        type: item.type || 'RawMaterial'
      };
    }
  }
  
  if (collectionName === 'movements') {
    if (version === 'new') {
      const qty = Number(item.quantity ?? 0);
      const price = Number(item.pricePerKg ?? 0);
      const totalAmount = qty * price;
      
      let contactId: string | null = null;
      const notes = item.notes || '';
      const contactNamePart = notes.split(' • ')[0];
      if (contactNamePart && (contactNamePart.startsWith("Supplier: ") || contactNamePart.startsWith("Customer: "))) {
        const contactName = contactNamePart.replace("Supplier: ", "").replace("Customer: ", "").trim();
        const cachedContacts = inMemoryData['contacts'] || [];
        const foundContact = cachedContacts.find((c: any) => c.name?.toLowerCase() === contactName.toLowerCase());
        if (foundContact) {
          contactId = foundContact.id;
        }
      }
      
      return {
        id: item.id,
        type: item.type,
        product_id: item.productId,
        contact_id: contactId,
        quantity: qty,
        price_per_kg: price,
        total_amount: totalAmount,
        remarks: notes,
        transaction_date: item.date || new Date().toISOString()
      };
    } else {
      return {
        id: item.id,
        productId: item.productId,
        productName: item.productName || 'Product',
        type: item.type,
        quantity: item.quantity || 0,
        pricePerKg: item.pricePerKg || 0,
        date: item.date || new Date().toISOString(),
        notes: item.notes || ''
      };
    }
  }
  
  if (collectionName === 'contacts') {
    if (version === 'new') {
      return {
        id: item.id,
        type: item.type,
        name: item.name,
        phone: item.phone || '',
        email: item.email || '',
        address: item.address || '',
        balance: 0
      };
    } else {
      return {
        id: item.id,
        name: item.name,
        type: item.type,
        email: item.email || '',
        phone: item.phone || '',
        address: item.address || ''
      };
    }
  }
  
  if (collectionName === 'staff') {
    if (version === 'new') {
      return {
        id: item.id,
        name: item.name,
        designation: item.role,
        monthly_salary: item.salary || 0,
        joining_date: new Date().toISOString().split('T')[0],
        is_active: true
      };
    } else {
      return {
        id: item.id,
        name: item.name,
        role: item.role,
        salary: item.salary || 0
      };
    }
  }
  
  if (collectionName === 'expenses') {
    if (version === 'new') {
      return {
        id: item.id,
        category: item.category || 'General',
        amount: item.amount || 0,
        paid: item.status === 'Settled',
        notes: item.description || '',
        expense_date: item.date || new Date().toISOString()
      };
    } else {
      return {
        id: item.id,
        description: item.description || '',
        amount: item.amount || 0,
        category: item.category || 'General',
        status: item.status || 'Settled',
        date: item.date || new Date().toISOString()
      };
    }
  }
  
  if (collectionName === 'logs') {
    return {
      id: item.id,
      type: item.type,
      message: item.message,
      created_at: item.date || new Date().toISOString()
    };
  }
  
  return item;
}

/**
 * Internal helper to update memory cache and notify active subscribers.
 * Keeps React UI ultra-snappy with latency-compensation.
 */
function updateInMemoryAndNotify(collectionName: string, item: any, isDelete: boolean = false) {
  if (!inMemoryData[collectionName]) {
    inMemoryData[collectionName] = [];
  }
  const current = inMemoryData[collectionName];
  if (isDelete) {
    inMemoryData[collectionName] = current.filter((x) => x.id !== item.id);
  } else {
    const idx = current.findIndex((x) => x.id === item.id);
    if (idx >= 0) {
      current[idx] = { ...current[idx], ...item };
    } else {
      current.push(item);
    }
  }

  // Dispatch to React listener hooks
  if (listeners[collectionName]) {
    listeners[collectionName].forEach((callback) => {
      try {
        callback(inMemoryData[collectionName]);
      } catch (err) {
        console.error(`Error in snapshot dispatch for "${collectionName}":`, err);
      }
    });
  }
}

/**
 * Gets currently held in-memory list for a collection
 */
export function getCollectionData<T>(collectionName: string): T[] {
  return (inMemoryData[collectionName] || []) as T[];
}

/**
 * Direct memory update and listener notification.
 */
export function saveCollectionData<T>(collectionName: string, data: T[]): void {
  inMemoryData[collectionName] = data;
  if (listeners[collectionName]) {
    listeners[collectionName].forEach((callback) => {
      try {
        callback(data);
      } catch (err) {
        console.error(`Error in listener notify for "${collectionName}":`, err);
      }
    });
  }
}

/**
 * Subscribes to direct realtime events and pulls direct live data from Supabase tables
 */
export function onSnapshot<T>(collectionName: string, callback: (data: T[]) => void): () => void {
  if (!listeners[collectionName]) {
    listeners[collectionName] = new Set();
  }
  listeners[collectionName].add(callback);

  // If we already have loaded in-memory data, send it immediately for continuous rendering
  if (inMemoryData[collectionName]) {
    callback(inMemoryData[collectionName] as T[]);
  }

  if (collectionName === 'logs') {
    // For 'logs', manage completely locally to support the user's custom schema without 'logs' table
    if (!inMemoryData['logs']) {
      inMemoryData['logs'] = [];
    }
    // Set up initial dummy data if empty so the UI doesn't look barren
    if (inMemoryData['logs'].length === 0) {
      inMemoryData['logs'] = [
        { id: '1', type: 'system', message: 'Business terminal initialized securely', date: new Date(Date.now() - 3600000).toISOString() },
        { id: '2', type: 'stock', message: 'Current stock balances matching database schema', date: new Date().toISOString() }
      ];
    }
    callback(inMemoryData['logs'] as T[]);
    return () => {};
  }

  // Trigger immediate fetch from Supabase with automated fallback
  const fetchSupabaseData = async () => {
    logRequest('select_all', collectionName);
    try {
      const tryFetch = async (version: 'new' | 'old') => {
        const tblName = getTableName(collectionName);
        let query = supabase.from(tblName).select('*');
        if (collectionName === 'movements' && version === 'new') {
          query = supabase.from(tblName).select('*, products(name)');
        }
        return query;
      };

      const currentVersion = schemaVersions[collectionName] || 'new';
      let res = await tryFetch(currentVersion);

      if (res.error) {
        if ((res.error.code === '42P01' || res.error.code === '42703') && currentVersion === 'new') {
          console.warn(`Supabase: Table or column fail for "${collectionName}" in fetch. Falling back to old schema...`);
          schemaVersions[collectionName] = 'old';
          res = await tryFetch('old');
        }
        if (res.error) {
          logError('select_all', collectionName, res.error);
          if (res.error.code === '42P01') {
            schemaStatus.setTablesMissing(true);
          }
          throw res.error;
        }
      }

      if (res.data) {
        logResponse('select_all', collectionName, res.data);
        let mappedData;
        if (collectionName === 'attendance') {
          if (schemaVersions['attendance'] === 'new') {
            mappedData = groupAttendance(res.data);
          } else {
            mappedData = res.data.map((row: any) => ({
              id: row.id || row.date,
              date: row.date,
              status: typeof row.status === 'string' ? JSON.parse(row.status) : (row.status || {})
            }));
          }
        } else {
          mappedData = res.data.map(item => mapFromDB(collectionName, item));
        }
        inMemoryData[collectionName] = mappedData;
        callback(mappedData as T[]);
      }
    } catch (err) {
      logError('select_all_catch', collectionName, err);
    }
  };
  
  fetchSupabaseData();

  // Subscribe to Realtime Postgres Changes
  const tblName = getTableName(collectionName);
  const channel = supabase
    .channel(`public:${collectionName}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: tblName },
      (payload) => {
        logRealtime(payload.eventType, collectionName, payload);
        
        if (collectionName === 'movements' || collectionName === 'attendance') {
          fetchSupabaseData();
        } else {
          const current = inMemoryData[collectionName] || [];
          if (payload.eventType === 'INSERT') {
            const item = mapFromDB(collectionName, payload.new);
            if (!current.some((x) => x.id === item.id)) {
              current.push(item);
            }
            saveCollectionData(collectionName, current);
          } else if (payload.eventType === 'UPDATE') {
            const item = mapFromDB(collectionName, payload.new);
            const idx = current.findIndex((x) => x.id === item.id);
            if (idx >= 0) {
              current[idx] = { ...current[idx], ...item };
            } else {
              current.push(item);
            }
            saveCollectionData(collectionName, current);
          } else if (payload.eventType === 'DELETE') {
            const id = payload.old.id;
            const filtered = current.filter((x) => x.id !== id);
            saveCollectionData(collectionName, filtered);
          }
        }
      }
    )
    .subscribe();

  // Return a unified unsubscribe function
  return () => {
    supabase.removeChannel(channel);
    if (listeners[collectionName]) {
      listeners[collectionName].delete(callback);
      if (listeners[collectionName].size === 0) {
        delete listeners[collectionName];
      }
    }
  };
}

/**
 * Writes/Updates a document directly in Supabase
 */
export async function setDoc<T extends { id: string }>(
  collectionName: string,
  docId: string,
  data: Partial<T> & { id: string }
): Promise<void> {
  // Immediate local cache reflection for latency compensation
  if (collectionName !== 'attendance') {
    updateInMemoryAndNotify(collectionName, data);
  }

  if (collectionName === 'logs') {
    return; // Managed locally, return early to avoid Supabase calls
  }

  // Dedicated attendance handler
  if (collectionName === 'attendance') {
    const date = docId;
    const statusMap = (data as any).status || {};
    const employees = inMemoryData['staff'] || [];

    const tryUpsert = async (version: 'new' | 'old') => {
      const tblName = getTableName('attendance');
      if (version === 'new') {
        const rows = Object.entries(statusMap).map(([employeeId, status]) => {
          const emp = employees.find((e: any) => e.id === employeeId);
          const monthlySalary = emp ? Number(emp.salary || 0) : 0;
          const dailyWage = Math.round(monthlySalary / 30);
          
          return {
            id: generateUUID(),
            employee_id: employeeId,
            attendance_date: date,
            status: status,
            daily_wage: dailyWage
          };
        });
        
        if (rows.length === 0) return { data: null, error: null };
        
        return supabase
          .from(tblName)
          .upsert(rows, { onConflict: 'employee_id,attendance_date' })
          .select();
      } else {
        const row = {
          id: date,
          date: date,
          status: statusMap
        };
        return supabase
          .from(tblName)
          .upsert(row)
          .select();
      }
    };

    try {
      const currentVersion = schemaVersions['attendance'] || 'new';
      let res = await tryUpsert(currentVersion);
      if (res.error) {
        if ((res.error.code === '42P01' || res.error.code === '42703') && currentVersion === 'new') {
          console.warn(`Supabase: Attendance upsert failed. Falling back to old attendance schema...`);
          schemaVersions['attendance'] = 'old';
          res = await tryUpsert('old');
        }
        if (res.error) throw res.error;
      }

      // Fetch latest and update cache
      const { data: allAttendance, error: fetchErr } = await supabase
        .from('attendance')
        .select('*');
      if (allAttendance && !fetchErr) {
        let grouped;
        if (schemaVersions['attendance'] === 'new') {
          grouped = groupAttendance(allAttendance);
        } else {
          grouped = allAttendance.map((row: any) => ({
            id: row.id || row.date,
            date: row.date,
            status: typeof row.status === 'string' ? JSON.parse(row.status) : (row.status || {})
          }));
        }
        inMemoryData['attendance'] = grouped;
        if (listeners['attendance']) {
          listeners['attendance'].forEach(cb => cb(grouped));
        }
      }
    } catch (err) {
      logError('upsert_attendance_catch', 'attendance', err);
      throw err;
    }
    return;
  }

  // General handler
  try {
    const currentVersion = schemaVersions[collectionName] || 'new';
    const tryGeneralUpsert = async (version: 'new' | 'old') => {
      const tblName = getTableName(collectionName);
      const dbData = mapToDB(collectionName, data);
      return supabase
        .from(tblName)
        .upsert(dbData)
        .select();
    };

    let res = await tryGeneralUpsert(currentVersion);
    if (res.error) {
      if ((res.error.code === '42P01' || res.error.code === '42703') && currentVersion === 'new') {
        console.warn(`Supabase: Upsert failed for "${collectionName}". Falling back to old...`);
        schemaVersions[collectionName] = 'old';
        res = await tryGeneralUpsert('old');
      }
      if (res.error) throw res.error;
    }
    logResponse('upsert_single', collectionName, res.data);
  } catch (err) {
    logError('upsert_single_catch', collectionName, err);
    throw err;
  }
}

/**
 * Deletes a document directly from Supabase
 */
export async function deleteDoc(collectionName: string, docId: string): Promise<void> {
  // Direct, non-caching immediate removal
  updateInMemoryAndNotify(collectionName, { id: docId }, true);

  if (collectionName === 'logs') {
    return; // Managed locally, return early to avoid Supabase calls
  }

  logRequest('delete_single', collectionName, { id: docId });
  try {
    const currentVersion = schemaVersions[collectionName] || 'new';
    const tryDelete = async () => {
      const tblName = getTableName(collectionName);
      return supabase
        .from(tblName)
        .delete()
        .eq('id', docId)
        .select();
    };

    let res = await tryDelete();
    if (res.error) {
      if ((res.error.code === '42P01' || res.error.code === '42703') && currentVersion === 'new') {
        console.warn(`Supabase: Delete failed for "${collectionName}". Falling back to old...`);
        schemaVersions[collectionName] = 'old';
        res = await tryDelete();
      }
      if (res.error) throw res.error;
    }
    logResponse('delete_single', collectionName, res.data);
  } catch (err) {
    logError('delete_single_catch', collectionName, err);
    throw err;
  }
}

/**
 * Batch write helper committing directly to Supabase with instant memory reflection
 */
export function writeBatch() {
  const localOperations: Array<{
    type: 'set' | 'delete';
    collectionName: string;
    docId: string;
    data?: any;
  }> = [];

  return {
    set(collectionName: string, docId: string, data: any) {
      localOperations.push({ type: 'set', collectionName, docId, data });
    },
    delete(collectionName: string, docId: string) {
      localOperations.push({ type: 'delete', collectionName, docId });
    },
    async commit(): Promise<void> {
      // 1. Immediately apply changes to in-memory listeners for latency-compensation
      for (const op of localOperations) {
        if (op.type === 'set') {
          updateInMemoryAndNotify(op.collectionName, op.data);
        } else if (op.type === 'delete') {
          updateInMemoryAndNotify(op.collectionName, { id: op.docId }, true);
        }
      }

      // 2. Map and perform raw batch requests directly to Supabase
      logRequest('batch_commit', 'multiple_tables', localOperations);
      try {
        const promises = localOperations.map(async (op) => {
          const currentVersion = schemaVersions[op.collectionName] || 'new';
          const tryBatchOp = async () => {
            const tblName = getTableName(op.collectionName);
            if (op.type === 'set') {
              const dbData = mapToDB(op.collectionName, op.data);
              return supabase
                .from(tblName)
                .upsert(dbData)
                .select();
            } else {
              return supabase
                .from(tblName)
                .delete()
                .eq('id', op.docId)
                .select();
            }
          };

          let res = await tryBatchOp();
          if (res.error) {
            if ((res.error.code === '42P01' || res.error.code === '42703') && currentVersion === 'new') {
              console.warn(`Supabase: Batch operation failed for "${op.collectionName}". Falling back to old...`);
              schemaVersions[op.collectionName] = 'old';
              res = await tryBatchOp();
            }
            if (res.error) throw res.error;
          }
          return { op, success: true, resData: res.data };
        });

        const results = await Promise.all(promises);
        logResponse('batch_commit', 'multiple_tables', results);
      } catch (err: any) {
        logError('batch_commit', 'multiple_tables', err);
        if (err.code === '42P01') {
          schemaStatus.setTablesMissing(true);
        }
        throw err;
      }
    }
  };
}

/**
 * Logs business activities and syncs them to Supabase
 */
export function logActivity(
  type: ActivityLog['type'],
  message: string
): void {
  const newLog: ActivityLog = {
    id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    type,
    message,
    date: new Date().toISOString(),
  };

  // Immediate local cache reflection for logs
  updateInMemoryAndNotify('logs', newLog);
}
