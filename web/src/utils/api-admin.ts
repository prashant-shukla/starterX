import { apiRequest } from './api'
import { requestDeduplication } from './request-deduplication'
import { clearClientCache } from './api-client'

// Simple in-memory cache for admin client list to avoid repeated fetches when switching tabs
const _adminCache: Record<string, { ts: number; value: any }> = {}
const ADMIN_CACHE_TTL = 5 * 60 * 1000 // 5 minutes

// Global cache to prevent duplicate calls across components
let _globalClientsCache: { data: any, timestamp: number } | null = null;

// Request deduplication for concurrent API calls
const pendingRequests: Record<string, Promise<any>> = {}
// Cache invalidation timestamp to force refresh when needed
let _cacheInvalidationTimestamp: number = 0;
function _getAdminCached(key: string) {
  const e = _adminCache[key]
  if (!e) return null
  if ((Date.now() - e.ts) > ADMIN_CACHE_TTL) { delete _adminCache[key]; return null }
  return e.value
}
function _setAdminCached(key: string, value: any) { _adminCache[key] = { ts: Date.now(), value } }

export async function sendChatMessage(message: string, accessToken: string, clientId?: string) {
  return apiRequest('/ai/admin-chat', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${accessToken}` },
    body: JSON.stringify({ prompt: message, client_id: clientId }),
  })
}

export async function fetchDashboardData(accessToken: string) {
  // backend dashboard endpoint not implemented always return empty
  return { data: { summary: {}, stats: {} } }
}

export async function fetchAdminSummary(token?: string) {
  const res = await apiRequest('/admin/summary', { headers: token ? { 'Authorization': `Bearer ${token}` } : {} })
  return res?.data || null
}

export async function fetchChatHistory(accessToken: string) {
  return { data: [] }
}

export async function fetchUsers(token?: string | null, options?: { includeInactive?: boolean }) {
  const includeInactive = options?.includeInactive ? 'true' : 'false'
  const url = `/admin/users?includeInactive=${includeInactive}`
  const res = await apiRequest(url, { headers: token ? { 'Authorization': `Bearer ${token}` } : {} })
  const users = res?.users || []

  return users;
}

export async function fetchClients(token?: string | null, options?: { includeInactive?: boolean }) {
  const users = await fetchUsers(token, options)
  if (!Array.isArray(users)) return []
  return users.filter((user) => user.role === 'client')
}

export async function deleteContractor(contractorId: string, token?: string) {

  const res = await apiRequest(`/admin/users/${contractorId}`, {
    method: 'DELETE',
    headers: token ? { 'Authorization': `Bearer ${token}` } : {}
  })

  return res;
}

export async function createContractor(contractorData: {
  name: string;
  email: string;
  password: string;
  role: 'bookkeeper' | 'manager' | 'cfo' | 'sales' | 'marketing';
}, token?: string) {

  const res = await apiRequest('/users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    },
    body: JSON.stringify(contractorData)
  })

  return res;
}

export async function fetchCompanies(token?: string) {
  const cacheKey = `fetchCompanies:${token || 'anon'}`

  if (pendingRequests[cacheKey]) {
    return pendingRequests[cacheKey]
  }

  const requestPromise = (async () => {
    try {
      const res = await apiRequest('/admin/contractor/companies', { headers: token ? { 'Authorization': `Bearer ${token}` } : {} })
      const companies = res?.companies || []
      return companies
    } finally {
      delete pendingRequests[cacheKey]
    }
  })()

  pendingRequests[cacheKey] = requestPromise
  return requestPromise
}

export async function fetchContractorSalarySummary(options: { token?: string; year?: number | string; month?: number | string }) {
  const { token, year, month } = options || {}
  const params = new URLSearchParams()
  if (year !== undefined && year !== null && String(year).trim() !== '') {
    params.append('year', String(year))
  }
  if (month !== undefined && month !== null && String(month).trim() !== '') {
    params.append('month', String(month))
  }

  const queryString = params.toString()
  const url = queryString ? `/admin/contractors/salary-summary?${queryString}` : '/admin/contractors/salary-summary'

  const res = await apiRequest(url, {
    headers: token ? { 'Authorization': `Bearer ${token}` } : {}
  })

  return res?.data || res || []
}

// Function to clear the clients cache (useful after client deletion/creation)
export function clearClientsCache() {
  _globalClientsCache = null;
  // Set invalidation timestamp to force cache refresh
  _cacheInvalidationTimestamp = Date.now();
  // Clear ALL admin cache entries (not just ClientDirectory data)
  Object.keys(_adminCache).forEach(key => {
    delete _adminCache[key];
  });
  // Clear api-client cache as well
  clearClientCache();
  // Clear request deduplication cache to ensure fresh requests
  requestDeduplication.clear();
}

// Force refresh clients data by bypassing all caches
export async function forceRefreshCompanies(token?: string) {
  clearClientsCache();
  return fetchCompanies(token);
}

// Export all functions as AdminAPI object
export const AdminAPI = {
  sendChatMessage,
  fetchDashboardData,
  fetchAdminSummary,
  fetchChatHistory,
  fetchUsers,
  fetchClients,
  deleteContractor,
  createContractor, // Added this
  fetchCompanies,
  fetchContractorSalarySummary,
  clearClientsCache,
  forceRefreshCompanies
}
