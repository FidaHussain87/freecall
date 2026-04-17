import axios from 'axios'
import type {
  SendRequestPayload,
  SendRequestResponse,
  Collection,
  SavedRequest,
  HistoryEntry,
  Environment,
  ImportResult,
} from './types'

const http = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

// Proxy
export async function sendRequest(payload: SendRequestPayload): Promise<SendRequestResponse> {
  const { data } = await http.post<SendRequestResponse>('/send', payload)
  return data
}

export async function sendMultipart(formData: FormData): Promise<SendRequestResponse> {
  const { data } = await http.post<SendRequestResponse>('/send-multipart', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

// Collections
export async function getCollections(): Promise<Collection[]> {
  const { data } = await http.get<Collection[]>('/collections')
  return data
}

export async function createCollection(payload: { name: string; parent_id?: number | null }): Promise<Collection> {
  const { data } = await http.post<Collection>('/collections', payload)
  return data
}

export async function getCollection(id: number): Promise<Collection> {
  const { data } = await http.get<Collection>(`/collections/${id}`)
  return data
}

export async function updateCollection(id: number, payload: { name: string }): Promise<Collection> {
  const { data } = await http.put<Collection>(`/collections/${id}`, payload)
  return data
}

export async function deleteCollection(id: number): Promise<void> {
  await http.delete(`/collections/${id}`)
}

// Saved Requests
export async function createSavedRequest(collId: number, payload: Record<string, any>): Promise<SavedRequest> {
  const { data } = await http.post<SavedRequest>(`/collections/${collId}/requests`, payload)
  return data
}

export async function updateSavedRequest(collId: number, reqId: number, payload: Record<string, any>): Promise<SavedRequest> {
  const { data } = await http.put<SavedRequest>(`/collections/${collId}/requests/${reqId}`, payload)
  return data
}

export async function deleteSavedRequest(collId: number, reqId: number): Promise<void> {
  await http.delete(`/collections/${collId}/requests/${reqId}`)
}

// History
export async function getHistory(limit = 50): Promise<HistoryEntry[]> {
  const { data } = await http.get<HistoryEntry[]>('/history', { params: { limit } })
  return data
}

export async function getHistoryEntry(id: number): Promise<HistoryEntry> {
  const { data } = await http.get<HistoryEntry>(`/history/${id}`)
  return data
}

export async function clearHistory(): Promise<void> {
  await http.delete('/history')
}

// Environments
export async function getEnvironments(): Promise<Environment[]> {
  const { data } = await http.get<Environment[]>('/environments')
  return data
}

export async function createEnvironment(payload: { name: string }): Promise<Environment> {
  const { data } = await http.post<Environment>('/environments', payload)
  return data
}

export async function getEnvironment(id: number): Promise<Environment> {
  const { data } = await http.get<Environment>(`/environments/${id}`)
  return data
}

export async function updateEnvironment(id: number, payload: { name: string }): Promise<Environment> {
  const { data } = await http.put<Environment>(`/environments/${id}`, payload)
  return data
}

export async function deleteEnvironment(id: number): Promise<void> {
  await http.delete(`/environments/${id}`)
}

export async function activateEnvironment(id: number): Promise<void> {
  await http.post(`/environments/${id}/activate`)
}

export async function setVariables(envId: number, variables: { key: string; value: string; is_secret?: boolean }[]): Promise<void> {
  await http.put(`/environments/${envId}/variables`, { variables })
}

// Import/Export
export async function exportCollection(id: number): Promise<Blob> {
  const resp = await http.get<Blob>(`/export/collections/${id}`, { responseType: 'blob' })
  return resp.data
}

export async function exportAllCollections(): Promise<Blob> {
  const resp = await http.get<Blob>('/export/collections', { responseType: 'blob' })
  return resp.data
}

export async function importCollections(file: File): Promise<ImportResult> {
  const formData = new FormData()
  formData.append('file', file)
  const { data } = await http.post<ImportResult>('/import/collections', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}
