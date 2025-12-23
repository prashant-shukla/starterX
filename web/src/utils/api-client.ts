import { apiRequest } from './api'

// Simple in-memory cache to dedupe repeated frontend requests during navigation.
// Keys map to { ts: number, value: any }. TTL is in ms.
const cache: Record<string, { ts: number; value: any }> = {}
const CACHE_TTL = 30 * 1000 // 30 seconds

// Request deduplication: track pending promises to prevent duplicate concurrent requests
const pendingRequests: Record<string, Promise<any>> = {}

function getCached<T>(key: string): T | null {
  const e = cache[key]
  if (!e) return null
  if ((Date.now() - e.ts) > CACHE_TTL) {
    delete cache[key]
    return null
  }
  return e.value as T
}

function setCached(key: string, value: any, ttl: number = CACHE_TTL) {
  cache[key] = { ts: Date.now(), value }
  // Auto-cleanup after TTL
  setTimeout(() => {
    if (cache[key] && (Date.now() - cache[key].ts) >= ttl) {
      delete cache[key]
    }
  }, ttl)
}

// Function to clear all client-related caches
export function clearClientCache() {
  Object.keys(cache).forEach(key => {
    delete cache[key];
  });
}

export async function listClients(token?: string) {
  const cacheKey = `listClients:${token || 'anon'}`
  const cached = getCached<any[]>(cacheKey)
  if (cached) return cached

  if (pendingRequests[cacheKey]) {
    return pendingRequests[cacheKey]
  }

  const requestPromise = (async () => {
    try {
      const res = await apiRequest('/clients', { headers: token ? { 'Authorization': `Bearer ${token}` } : {} })
      const rows = res?.data || res?.companies || []
      const result = Array.isArray(rows) ? rows.map(normalizeServerClient) : []
      setCached(cacheKey, result)
      return result
    } finally {
      delete pendingRequests[cacheKey]
    }
  })()

  pendingRequests[cacheKey] = requestPromise
  return requestPromise
}

export async function fetchClientSummaries(token?: string) {
  const cacheKey = `fetchClientSummaries:${token || 'anon'}`
  const cached = getCached<any[]>(cacheKey)
  if (cached) return cached
  const res = await apiRequest('/clients/summary', { headers: token ? { 'Authorization': `Bearer ${token}` } : {} })
  const rows = res?.data || []
  const result = Array.isArray(rows) ? rows.map(normalizeServerClient) : []
  setCached(cacheKey, result)
  return result
}

export async function getClient(id: string, token?: string) {
  const cacheKey = `getClient:${id}:${token || 'anon'}`

  // Check cache first
  const cached = getCached<any>(cacheKey)
  if (cached) return cached

  // Check if there's already a pending request for this client
  if (pendingRequests[cacheKey]) {
    return pendingRequests[cacheKey]
  }

  // Create new request and store promise
  const requestPromise = (async () => {
    try {
      const res = await apiRequest(`/clients/${encodeURIComponent(id)}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })
      const normalized = res?.data ? normalizeServerClient(res.data) : undefined

      if (normalized) {
        setCached(cacheKey, normalized, 5000) // Cache for 5 seconds
      }

      return normalized
    } finally {
      // Clean up pending request
      delete pendingRequests[cacheKey]
    }
  })()

  pendingRequests[cacheKey] = requestPromise
  return requestPromise
}

export async function createClient(payload: any, token?: string) {
  const res = await apiRequest('/clients', { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }, body: JSON.stringify(payload) })
  return res?.data ? normalizeServerClient(res.data) : undefined
}

export async function updateClient(id: string, payload: any, token?: string) {
  const res = await apiRequest(`/clients/${encodeURIComponent(id)}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }, body: JSON.stringify(payload) })
  return res?.data ? normalizeServerClient(res.data) : undefined
}

export async function deleteCompany(id: string, token?: string) {
  const res = await apiRequest(`/clients/company/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: token ? { 'Authorization': `Bearer ${token}` } : {}
  })
  return res
}

export async function getClientUsers(token?: string) {
  const cacheKey = `getClientUsers:${token || 'anon'}`
  const cached = getCached<any[]>(cacheKey)
  if (cached) return cached

  if (pendingRequests[cacheKey]) {
    return pendingRequests[cacheKey]
  }

  const requestPromise = (async () => {
    try {
      const res = await apiRequest('/clients/users', { headers: token ? { 'Authorization': `Bearer ${token}` } : {} })
      const rows = res?.data || []
      setCached(cacheKey, rows)
      return rows
    } finally {
      delete pendingRequests[cacheKey]
    }
  })()

  pendingRequests[cacheKey] = requestPromise
  return requestPromise
}

export async function getManagers(token?: string) {
  const cacheKey = `getManagers:${token || 'anon'}`
  const cached = getCached<any[]>(cacheKey)
  if (cached) return cached

  if (pendingRequests[cacheKey]) {
    return pendingRequests[cacheKey]
  }

  const requestPromise = (async () => {
    try {
      const res = await apiRequest('/clients/managers', { headers: token ? { 'Authorization': `Bearer ${token}` } : {} })
      const rows = res?.data || []
      setCached(cacheKey, rows)
      return rows
    } finally {
      delete pendingRequests[cacheKey]
    }
  })()

  pendingRequests[cacheKey] = requestPromise
  return requestPromise
}

export async function getBookkeepers(token?: string) {
  const cacheKey = `getBookkeepers:${token || 'anon'}`
  const cached = getCached<any[]>(cacheKey)
  if (cached) return cached

  if (pendingRequests[cacheKey]) {
    return pendingRequests[cacheKey]
  }

  const requestPromise = (async () => {
    try {
      const res = await apiRequest('/clients/bookkeepers', { headers: token ? { 'Authorization': `Bearer ${token}` } : {} })
      const rows = res?.data || []
      setCached(cacheKey, rows)
      return rows
    } finally {
      delete pendingRequests[cacheKey]
    }
  })()

  pendingRequests[cacheKey] = requestPromise
  return requestPromise
}

export async function getContractors(token?: string) {
  const cacheKey = `getContractors:${token || 'anon'}`
  const cached = getCached<any[]>(cacheKey)
  if (cached) return cached
  const res = await apiRequest('/clients/contractors', { headers: token ? { 'Authorization': `Bearer ${token}` } : {} })
  const rows = res?.data || []
  setCached(cacheKey, rows)
  return rows
}

export async function createCompany(payload: any, token?: string) {
  const res = await apiRequest('/clients/company', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
    body: JSON.stringify(payload)
  })
  return res?.data ? res.data : undefined
}

// Lazy loading functions for tasks and subtasks
export async function getStageTasks(stageId: string, token?: string) {
  const cacheKey = `getStageTasks:${stageId}:${token || 'anon'}`
  const cached = getCached<any[]>(cacheKey)
  if (cached) return cached

  if (pendingRequests[cacheKey]) {
    return pendingRequests[cacheKey]
  }

  const requestPromise = (async () => {
    try {
      const res = await apiRequest(`/clients/stages/${stageId}/tasks`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })
      const tasks = res?.data || []
      setCached(cacheKey, tasks)
      return tasks
    } finally {
      delete pendingRequests[cacheKey]
    }
  })()

  pendingRequests[cacheKey] = requestPromise
  return requestPromise
}

export async function getStageDetails(stageId: string, token?: string) {
  const cacheKey = `getStageDetails:${stageId}:${token || 'anon'}`
  const cached = getCached<any>(cacheKey)
  if (cached) return cached

  if (pendingRequests[cacheKey]) {
    return pendingRequests[cacheKey]
  }

  const requestPromise = (async () => {
    try {
      const res = await apiRequest(`/clients/stages/${stageId}/details`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })
      const data = res?.data || { stage: null, tasks: [] }
      setCached(cacheKey, data)
      return data
    } finally {
      delete pendingRequests[cacheKey]
    }
  })()

  pendingRequests[cacheKey] = requestPromise
  return requestPromise
}

export async function getMonthlyStages(companyId: string, token?: string) {
  const res = await apiRequest(`/clients/${encodeURIComponent(companyId)}/stages/monthly/all`, {
    headers: token ? { 'Authorization': `Bearer ${token}` } : {}
  })
  return res?.data || []
}

export async function getCatchUpStage(companyId: string, token?: string) {
  const cacheKey = `getCatchUpStage:${companyId}:${token || 'anon'}`
  const cached = getCached<any>(cacheKey)
  if (cached) return cached

  if (pendingRequests[cacheKey]) {
    return pendingRequests[cacheKey]
  }

  const requestPromise = (async () => {
    try {
      const res = await apiRequest(`/clients/${companyId}/stages/catch_up`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })
      const stage = res?.data || res
      setCached(cacheKey, stage)
      return stage
    } finally {
      delete pendingRequests[cacheKey]
    }
  })()

  pendingRequests[cacheKey] = requestPromise
  return requestPromise
}

export async function getCompanyWorkflows(companyId: string, token?: string) {
  const cacheKey = `getCompanyWorkflows:${companyId}:${token || 'anon'}`
  const cached = getCached<any>(cacheKey)
  if (cached) return cached

  if (pendingRequests[cacheKey]) {
    return pendingRequests[cacheKey]
  }

  const requestPromise = (async () => {
    try {
      const res = await apiRequest(`/workflows/company/${companyId}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })
      const workflows = res?.data || res
      setCached(cacheKey, workflows)
      return workflows
    } finally {
      delete pendingRequests[cacheKey]
    }
  })()

  pendingRequests[cacheKey] = requestPromise
  return requestPromise
}

export async function getLatestMonthlyStage(companyId: string, token?: string) {
  const stages = await getMonthlyStages(companyId, token)
  if (Array.isArray(stages) && stages.length > 0) {
    return stages[0]
  }
  return null
}

export async function getTaskSubtasks(taskId: string, token?: string) {
  const cacheKey = `getTaskSubtasks:${taskId}:${token || 'anon'}`
  const cached = getCached<any[]>(cacheKey)
  if (cached) return cached

  if (pendingRequests[cacheKey]) {
    return pendingRequests[cacheKey]
  }

  const requestPromise = (async () => {
    try {
      const res = await apiRequest(`/clients/tasks/${taskId}/subtasks`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })
      const subtasks = res?.data || []
      setCached(cacheKey, subtasks)
      return subtasks
    } finally {
      delete pendingRequests[cacheKey]
    }
  })()

  pendingRequests[cacheKey] = requestPromise
  return requestPromise
}

export async function fetchWorkflowsForClient(clientId: string, token?: string) {
  const res = await apiRequest(`/workflows/client/${clientId}`, {
    headers: token ? { 'Authorization': `Bearer ${token}` } : {}
  })
  return res?.data || { stages: [], tasks: [] }
}

export async function getOnboardingProgress(token?: string) {
  const cacheKey = `getOnboardingProgress:${token || 'anon'}`
  const cached = getCached<any[]>(cacheKey)
  if (cached) return cached

  if (pendingRequests[cacheKey]) {
    return pendingRequests[cacheKey]
  }

  const requestPromise = (async () => {
    try {
      const res = await apiRequest('/clients/onboarding-progress', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })
      const rows = res?.data || []
      const result = Array.isArray(rows) ? rows : []
      setCached(cacheKey, result)
      return result
    } finally {
      delete pendingRequests[cacheKey]
    }
  })()

  pendingRequests[cacheKey] = requestPromise
  return requestPromise
}

export async function getMonthlyProgress(token?: string) {
  const cacheKey = `getMonthlyProgress:${token || 'anon'}`
  const cached = getCached<any[]>(cacheKey)
  if (cached) return cached

  if (pendingRequests[cacheKey]) {
    return pendingRequests[cacheKey]
  }

  const requestPromise = (async () => {
    try {
      const res = await apiRequest('/clients/monthly-progress', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })
      const rows = res?.data || []
      const result = Array.isArray(rows) ? rows : []
      setCached(cacheKey, result)
      return result
    } finally {
      delete pendingRequests[cacheKey]
    }
  })()

  pendingRequests[cacheKey] = requestPromise
  return requestPromise
}

export async function getCatchUpProgress(token?: string) {
  const cacheKey = `getCatchUpProgress:${token || 'anon'}`
  const cached = getCached<any[]>(cacheKey)
  if (cached) return cached

  if (pendingRequests[cacheKey]) {
    return pendingRequests[cacheKey]
  }

  const requestPromise = (async () => {
    try {
      const res = await apiRequest('/clients/catch-up-progress', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })
      const rows = res?.data || []
      const result = Array.isArray(rows) ? rows : []
      setCached(cacheKey, result)
      return result
    } finally {
      delete pendingRequests[cacheKey]
    }
  })()

  pendingRequests[cacheKey] = requestPromise
  return requestPromise
}

// Normalizer: convert server-side snake_case fields into frontend-friendly camelCase
function normalizeServerClient(r: any) {
  if (!r) return r
  // helpers: users map and finders
  const users = Array.isArray(r.users) ? r.users : (Array.isArray(r.user_list) ? r.user_list : undefined)
  const findUserById = (id: any) => {
    if (!id || !users) return undefined
    return users.find((u: any) => {
      if (!u) return false
      return String(u.id) === String(id) || String(u.user_id) === String(id) || String(u.uuid) === String(id)
    })
  }

  const findPreferredContact = () => {
    // prefer explicit contact object
    if (r.contact && (r.contact.first_name || r.contact.firstName || r.contact.name)) return r.contact
    // prefer a user with role 'client' or 'contact' or 'owner'
    if (users) {
      const roleUser = users.find((u: any) => (u.role && ['client', 'contact', 'owner', 'primary'].includes(String(u.role).toLowerCase())))
      if (roleUser) return roleUser
      // fallback to first user
      if (users.length > 0) return users[0]
    }
    return undefined
  }

  const contactUser = findPreferredContact()
  const composeName = (u: any) => {
    if (!u) return ''
    if (u.name || u.full_name || u.display_name) return u.name || u.full_name || u.display_name
    const fn = u.first_name || u.firstName || u.fn || ''
    const ln = u.last_name || u.lastName || u.ln || ''
    return `${(fn || '').toString().trim()}${ln ? ` ${ln.toString().trim()}` : ''}`.trim()
  }

  // resolve assigned/manager id lookups via users array when server provides only ids
  const resolveAssigned = () => {
    const raw = r.assigned_name ?? r.assignedName ?? r.assigned ?? r.assigned_to ?? r.assigned_user_id ?? r.contractor_name ?? r.assigned_contractor_id ?? r.assigned_contractor ?? r.assigned_manager_id ?? r.assigned_manager
    // if raw looks like an id and users present, attempt to map
    if (users && typeof raw === 'string' && /^[0-9a-fA-F-]{8,}$/.test(raw)) {
      const u = findUserById(raw)
      if (u) return composeName(u)
    }
    // if raw is an object, compose name
    if (raw && typeof raw === 'object') return composeName(raw)
    return raw ?? ''
  }

  const resolveManager = () => {
    const raw = r.manager_name ?? r.managerName ?? r.manager ?? r.managed_by ?? r.manager_user_id ?? r.manager_id ?? r.assigned_manager_id ?? r.assigned_manager
    if (users && typeof raw === 'string' && /^[0-9a-fA-F-]{8,}$/.test(raw)) {
      const u = findUserById(raw)
      if (u) return composeName(u)
    }
    if (raw && typeof raw === 'object') return composeName(raw)
    return raw ?? ''
  }

  // status: try multiple possible shapes (including bookkeeping arrays)
  const resolveStatus = () => {
    const direct = r.status ?? r.status_name ?? r.current_stage ?? r.currentStage ?? r.stage ?? r.stage_name
    if (direct) return direct
    if (r.bookkeeping_stage && (r.bookkeeping_stage.stage_type || r.bookkeeping_stage.current)) return r.bookkeeping_stage.stage_type ?? r.bookkeeping_stage.current
    if (Array.isArray(r.company_stages)) {
      const inProg = r.company_stages.find((s: any) => s && (s.in_progress === true || s.in_progress === 'true' || s.in_progress === 1))
      if (inProg) return inProg.stage_type ?? inProg.stage ?? inProg.name
    }
    if (r.bookkeeping_summary && (r.bookkeeping_summary.current_stage || r.bookkeeping_summary.stage)) return r.bookkeeping_summary.current_stage ?? r.bookkeeping_summary.stage
    return null
  }

  return {
    ...r,
    id: r.id,
    name: r.company_name ?? r.name ?? r.display_name ?? r.companyName ?? '',
    // contact person normalization - try several shapes including nested users or contact objects
    firstName: r.first_name ?? r.firstName ?? (contactUser && (contactUser.first_name || contactUser.firstName)) ?? '',
    lastName: r.last_name ?? r.lastName ?? (contactUser && (contactUser.last_name || contactUser.lastName)) ?? '',
    // client name - prefer direct API response, then contact user name, then compose from first/last
    clientName: r.client_name ?? r.clientName ?? (contactUser ? composeName(contactUser) : ''),
    client_name: r.client_name ?? r.clientName ?? (contactUser ? composeName(contactUser) : ''),
    // generated password from metadata
    generated_password: r.generated_password ?? r.generatedPassword ?? null,
    // assigned/manager: try to resolve ids to user names when possible
    assigned: resolveAssigned(),
    // Try to infer assigned_contractor_id when server returns only contractor_name
    assigned_contractor_id: (function () {
      const existingId = r.assigned_contractor_id ?? r.contractor_id ?? null
      if (existingId) return existingId
      const cname = r.contractor_name ?? r.assigned_name ?? null
      if (!cname || !users) return null
      try {
        const lc = String(cname).toLowerCase().trim()
        const match = users.find((u: any) => {
          const nm = composeName(u)
          return nm && String(nm).toLowerCase().trim() === lc
        })
        return match ? (match.id || match.user_id || match.uuid || null) : null
      } catch {
        return null
      }
    })(),
    manager: resolveManager(),
    // preserve currentStage from backend response, with fallbacks
    currentStage: (
      r.currentStage ??
      r.current_stage ??
      r.currentstage ??
      r.active_stage_type ??
      r.activeStageType ??
      null
    ),
    // status resolved via multiple places
    status: resolveStatus(),
    // bookkeeping in-progress flags (backend may return these in snake_case or camelCase)
    onboarding_in_progress: (typeof r.onboarding_in_progress !== 'undefined') ? !!r.onboarding_in_progress : (typeof r.onboardingInProgress !== 'undefined' ? !!r.onboardingInProgress : (r.bookkeeping_summary && !!r.bookkeeping_summary.onboarding_in_progress)),
    catchup_in_progress: (typeof r.catchup_in_progress !== 'undefined') ? !!r.catchup_in_progress : (typeof r.catchupInProgress !== 'undefined' ? !!r.catchupInProgress : (r.bookkeeping_summary && !!r.bookkeeping_summary.catchup_in_progress)),
    monthly_in_progress: (typeof r.monthly_in_progress !== 'undefined') ? !!r.monthly_in_progress : (typeof r.monthlyInProgress !== 'undefined' ? !!r.monthlyInProgress : (r.bookkeeping_summary && !!r.bookkeeping_summary.monthly_in_progress)),
    // Normalize Postgres DATERANGE values: could be returned as a string like "[2023-01-01,2023-03-01)".
    // Convert to an object with start/end when possible, otherwise expose raw string.
    closeDateRange: (function () {
      const raw = r.close_date_range ?? r.closeDateRange ?? ''
      if (!raw) return ''
      try {
        // simple parse: remove enclosing [] or () and split by comma
        const m = String(raw).trim()
        const inner = m.replace(/^[\[\(]/, '').replace(/[\]\)]$/, '')
        const parts = inner.split(',')
        const start = parts[0] ? parts[0].trim() : ''
        const end = parts[1] ? parts[1].trim() : ''
        return { raw: m, start: start || null, end: end || null }
      } catch (e) {
        return String(raw)
      }
    })(),
    closeDue: r.close_due ?? r.closeDue ?? null,
    closeStatus: r.close_status ?? r.closeStatus ?? null,
    chatStatus: r.chat_status ?? r.chatStatus ?? null,
    paymentStatus: r.payment_status ?? r.paymentStatus ?? null,
    monthlyPaymentStatus: r.monthly_payment_status ?? r.monthlyPaymentStatus ?? null,
    catchUpPaymentStatus: r.catchup_payment_status ?? r.catchUpPaymentStatus ?? null,
    cfoPaymentStatus: r.cfo_payment_status ?? r.cfoPaymentStatus ?? null,
    payrollPaymentStatus: r.payroll_payment_status ?? r.payrollPaymentStatus ?? null,
    qbPaymentStatus: r.qb_payment_status ?? r.qbPaymentStatus ?? null,
  }
}

// Contractors CRUD - minimal helpers for AdminPayroll and contractor management
export async function listContractors(token?: string) {
  const res = await apiRequest('/contractors', { headers: token ? { 'Authorization': `Bearer ${token}` } : {} })
  return res?.data || []
}

export async function listUsers(token?: string) {
  const res = await apiRequest('/users', { headers: token ? { 'Authorization': `Bearer ${token}` } : {} })
  // some APIs return { users: [...] } and some return { data: [...] }
  return res?.users ?? res?.data ?? []
}

export async function getContractor(id: string, token?: string) {
  const res = await apiRequest(`/contractors/${encodeURIComponent(id)}`, { headers: token ? { 'Authorization': `Bearer ${token}` } : {} })
  return res?.data
}

// Generate random password
function generateRandomPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

export async function createContractor(payload: any, token?: string) {
  // Convert the contractor payload to the format expected by the /users endpoint
  const userPayload: any = {
    first_name: payload.firstName,
    last_name: payload.lastName,
    name: `${payload.firstName} ${payload.lastName}`.trim(),
    email: payload.email,
    password: payload.password || generateRandomPassword(), // Auto-generate unique password if not provided
    role: payload.position || 'bookkeeper',
    phone: payload.phone || null,
    status: payload.status || 'active',
    payout_percent: payload.payoutPercentage ? parseInt(payload.payoutPercentage) : null,
    date_joined: payload.dateJoined || new Date().toISOString().split('T')[0]
  }

  const res = await apiRequest('/users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    },
    body: JSON.stringify(userPayload)
  })

  // Check for error in response (even if status is 200)
  if (res?.error) {
    throw new Error(res.error)
  }

  return res?.user || res?.data
}

export async function updateContractor(id: string, payload: any, token?: string) {
  const res = await apiRequest(`/contractors/${encodeURIComponent(id)}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }, body: JSON.stringify(payload) })
  return res?.data
}

export async function deleteContractor(id: string, token?: string) {
  const res = await apiRequest(`/contractors/${encodeURIComponent(id)}`, { method: 'DELETE', headers: token ? { 'Authorization': `Bearer ${token}` } : {} })
  return res
}

// Fetch contractor payout summaries (server should return array of ContractorPayout-like objects)
export async function fetchContractorPayouts(year?: number, token?: string) {
  const query = year ? `?year=${year}` : ''
  const res = await apiRequest(`/contractors/payouts${query}`, { headers: token ? { 'Authorization': `Bearer ${token}` } : {} })
  const rows = res?.data || []
  // Normalize server rows to frontend-friendly camelCase shape
  const asNumber = (v: any, fallback = 0) => {
    if (v === null || v === undefined) return fallback
    if (typeof v === 'number') return v
    const n = Number(v)
    return Number.isFinite(n) ? n : fallback
  }

  const normalized = (Array.isArray(rows) ? rows : []).map((r: any) => ({
    id: String(r.id || r.payout_id || r.payoutId || r.contractor_id || r.contractorId || ''),
    contractorId: r.contractor_id || r.contractorId || r.contractor || null,
    name: r.name || r.contractor_name || r.contractorName || r.display_name || r.contractor_id || '',
    totalPayout: typeof r.total_payout !== 'undefined' ? (r.total_payout ?? 0) : (typeof r.totalPayout !== 'undefined' ? (r.totalPayout ?? 0) : (r.total ?? 0)),
    paidStatus: r.paid_status || r.paidStatus || r.status || '',
    periodStart: r.period_start || r.periodStart || r.start || null,
    periodEnd: r.period_end || r.periodEnd || r.end || null,
    clientDetails: (r.lines || r.client_details || r.clientDetails || r.items || []).map((line: any) => ({
      id: line.id || line.line_id || null,
      clientId: line.client_id || line.clientId || line.client || null,
      name: line.client_name || line.clientName || line.name || null,
      serviceName: line.service_name || line.serviceName || line.service || null,
      clientPaid: line.client_paid ?? line.clientPaid ?? line.clientPays ?? 0,
      contractorFee: line.contractor_fee ?? line.contractorFee ?? line.fee ?? 0,
      contractorPayout: line.contractor_payout ?? line.contractorPayout ?? line.payout ?? 0,
      // Optional per-month breakdown: try common server field names
      months: Array.isArray(line.months)
        ? line.months.map((m: any) => asNumber(m, 0))
        : Array.isArray(line.monthly) ? line.monthly.map((m: any) => asNumber(m, 0))
          : Array.isArray(line.per_month) ? line.per_month.map((m: any) => asNumber(m, 0))
            : undefined,
      paid: !!(line.paid || line.is_paid || line.paid === true)
    }))
  }))

  return normalized
}

export async function updatePayoutLine(payoutId: string | number, lineId: string | number, updates: any, token?: string) {
  const res = await apiRequest(`/contractors/payouts/${encodeURIComponent(String(payoutId))}/lines/${encodeURIComponent(String(lineId))}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
    body: JSON.stringify(updates)
  })
  return res?.data
}

export async function updatePayoutLineMonths(payoutId: string | number, lineId: string | number, months: number[] | null, token?: string) {
  const payload = { months }
  const res = await apiRequest(`/contractors/payouts/${encodeURIComponent(String(payoutId))}/lines/${encodeURIComponent(String(lineId))}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
    body: JSON.stringify(payload)
  })
  return res?.data
}