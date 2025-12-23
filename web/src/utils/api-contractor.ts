import { apiRequest, apiFetch, BASE_API_URL } from './api'

// Lightweight in-memory cache similar to api-client to reduce repeated calls
const _cache: Record<string, { ts: number; value: any }> = {}
const _CACHE_TTL = 30 * 1000
function _getCached(key: string) {
  const e = _cache[key]
  if (!e) return null
  if ((Date.now() - e.ts) > _CACHE_TTL) { delete _cache[key]; return null }
  return e.value
}
function _setCached(key: string, value: any) { _cache[key] = { ts: Date.now(), value } }

export async function fetchWorkflowsForClient(clientId: string, accessToken: string) {
  const cacheKey = `wf:${clientId}:${accessToken || 'anon'}`
  const cached = _getCached(cacheKey)
  if (cached) return { data: cached }
  const resp = await apiRequest(`/workflows/client/${encodeURIComponent(clientId)}`, {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  })
  const rows = resp?.data || []
  _setCached(cacheKey, rows)
  return { data: rows }
}

export async function fetchWorkflowsSummary(clientIds: string[], accessToken: string) {
  if (!Array.isArray(clientIds) || clientIds.length === 0) return { data: {} }
  const q = `?clientIds=${clientIds.map(encodeURIComponent).join(',')}`
  const cacheKey = `wfsummary:${clientIds.join(',')}:${accessToken || 'anon'}`
  const cached = _getCached(cacheKey)
  if (cached) return { data: cached }
  const resp = await apiRequest(`/workflows/summary${q}`, { headers: { 'Authorization': `Bearer ${accessToken}` } })
  const rows = resp?.data || {}
  _setCached(cacheKey, rows)
  return { data: rows }
}

export async function fetchTasks(accessToken: string) {
  const cacheKey = `tasks:${accessToken || 'anon'}`
  const cached = _getCached(cacheKey)
  if (cached) return { data: cached }
  const resp = await apiRequest('/tasks', { headers: { 'Authorization': `Bearer ${accessToken}` } })
  const rows = resp?.data || []
  const tasks = rows.map((r: any) => ({
    id: r.id,
    title: r.name || r.title || 'Untitled',
    description: r.notes || r.description || '',
    status: r.completed ? 'completed' : (r.status || 'open'),
    priority: r.priority || 'low',
    dueDate: r.due_date || r.dueDate || r.due || null,
    createdAt: r.created_at || r.createdAt || new Date().toISOString(),
    respondedAt: r.responded_at || r.respondedAt || null,
    metadata: r.metadata || {}
  }))
  return { data: tasks }
}

export async function updateTask(taskId: string, updates: any, accessToken: string) {
  return apiRequest(`/tasks/${taskId}`, { method: 'PATCH', headers: { 'Authorization': `Bearer ${accessToken}` }, body: JSON.stringify(updates) })
}

export async function fetchDocuments(clientId: string, accessToken: string) {
  const resp = await apiRequest(`/documents/${encodeURIComponent(clientId)}`, { headers: { 'Authorization': `Bearer ${accessToken}` } })
  const rows = resp?.data || []
  return {
    data: rows.map((r: any) => ({
      id: r.id,
      name: r.file_name || r.name || r.fileName || 'file',
      uploadedAt: r.uploaded_at || r.uploadedAt || r.created_at || new Date().toISOString(),
      signedUrl: r.url || (r.storage_path ? `${BASE_API_URL}${r.storage_path}` : null),
      raw: r,
    }))
  }
}

export async function uploadDocument(file: File, taskId: string, accessToken: string, category: string = 'other', documentName?: string) {
  try {
    const allowedTypes = [
      'image/png','image/jpeg','image/jpg','image/webp','image/gif',
      'application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
    const ext = (file.name.split('.').pop() || '').toLowerCase()
    const allowedExt = ['png','jpg','jpeg','webp','gif','pdf','doc','docx']
    if (!allowedTypes.includes(file.type) && !allowedExt.includes(ext)) {
      throw new Error('Only images (png, jpg, jpeg, webp, gif) and documents (pdf, doc, docx) are allowed')
    }
    const presignResp: any = await apiRequest('/documents/presign', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileName: documentName || file.name, contentType: file.type, client_id: taskId }),
    })

    if (presignResp?.data?.url && presignResp?.data?.key) {
      const putUrl = presignResp.data.url as string
      const putResp = await fetch(putUrl, { method: 'PUT', headers: { 'Content-Type': file.type || 'application/octet-stream' }, body: file })
      if (!putResp.ok) throw new Error('Failed to upload to storage')
      const finalizeResp: any = await apiRequest('/documents/finalize', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: taskId, file_name: documentName || file.name, file_type: file.type, size_bytes: file.size || file.size, s3_key: presignResp.data.key, category }),
      })
      if (finalizeResp?.data) return { data: finalizeResp.data, url: finalizeResp?.data?.url || null }
    }
  } catch (e) { /* fallthrough to multipart fallback */ }

  const formData = new FormData()
  formData.append('file', file)
  formData.append('taskId', taskId)
  formData.append('client_id', taskId)
  formData.append('category', category)
  if (documentName) {
    formData.append('document_name', documentName)
  }
  const response = await fetch(`${BASE_API_URL}/documents/upload`, { method: 'POST', headers: { 'Authorization': `Bearer ${accessToken}` }, body: formData })
  if (!response.ok) { let err = 'Upload failed'; try { const data = await response.json(); if (data?.error) err = data.error } catch (e) { }; throw new Error(err) }
  const json = await response.json()
  return { data: json.data, url: json.url }
}
