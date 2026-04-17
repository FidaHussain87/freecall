import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { HttpMethod, BodyType, RawSubType, KeyValuePair, AuthConfig, SendRequestResponse, MultipartField } from '@/api/types'
import * as api from '@/api/client'
import { useUiStore } from './ui'

export const useRequestStore = defineStore('request', () => {
  // Request state
  const method = ref<HttpMethod>('GET')
  const url = ref('')
  const headers = ref<KeyValuePair[]>([{ key: '', value: '', enabled: true }])
  const queryParams = ref<KeyValuePair[]>([{ key: '', value: '', enabled: true }])
  const bodyType = ref<BodyType>('none')
  const bodyContent = ref('')
  const bodyRawSubType = ref<RawSubType>('text')
  const graphqlVariables = ref('')
  const multipartFields = ref<MultipartField[]>([{ key: '', value: '', type: 'text', file: null, enabled: true }])
  const binaryFile = ref<File | null>(null)
  const auth = ref<AuthConfig>({ type: 'none' })

  // Execution state
  const sending = ref(false)
  const response = ref<SendRequestResponse | null>(null)

  // Context
  const activeRequestId = ref<number | null>(null)
  const activeCollectionId = ref<number | null>(null)

  async function sendRequest() {
    if (!url.value.trim()) {
      useUiStore().toast('URL is required', 'error')
      return
    }

    sending.value = true
    response.value = null

    try {
      if (bodyType.value === 'multipart' || bodyType.value === 'binary') {
        const formData = new FormData()
        formData.append('method', method.value)
        formData.append('url', url.value)

        const enabledHeaders = headers.value.filter(h => h.enabled && h.key)
        formData.append('headers_json', JSON.stringify(enabledHeaders))

        const enabledParams = queryParams.value.filter(p => p.enabled && p.key)
        formData.append('query_params_json', JSON.stringify(enabledParams))

        formData.append('auth_json', JSON.stringify(auth.value))
        formData.append('body_type', bodyType.value)

        if (bodyType.value === 'multipart') {
          for (const field of multipartFields.value) {
            if (!field.enabled || !field.key) continue
            if (field.type === 'file' && field.file) {
              formData.append(`file_${field.key}`, field.file)
            } else {
              formData.append(`field_${field.key}`, field.value)
            }
          }
        } else if (bodyType.value === 'binary' && binaryFile.value) {
          formData.append('binary_file', binaryFile.value)
        }

        response.value = await api.sendMultipart(formData)
      } else {
        let sendBodyContent = bodyContent.value
        if (bodyType.value === 'graphql') {
          const query = bodyContent.value
          const vars = graphqlVariables.value
          try {
            const payload: any = { query }
            if (vars.trim()) {
              payload.variables = JSON.parse(vars)
            }
            sendBodyContent = JSON.stringify(payload)
          } catch {
            useUiStore().toast('Invalid GraphQL variables JSON', 'error')
            sending.value = false
            return
          }
        }

        // Map form_urlencoded to form for backward compat with backend
        let sendBodyType = bodyType.value
        if (sendBodyType === 'form_urlencoded') sendBodyType = 'form'

        response.value = await api.sendRequest({
          method: method.value,
          url: url.value,
          headers: headers.value.filter(h => h.enabled && h.key),
          query_params: queryParams.value.filter(p => p.enabled && p.key),
          body_type: sendBodyType,
          body_content: sendBodyContent || undefined,
          raw_sub_type: bodyType.value === 'raw' ? bodyRawSubType.value : undefined,
          auth: auth.value,
        })
      }

      if (response.value?.error) {
        useUiStore().toast(response.value.error, 'error')
      }
    } catch (e: any) {
      const msg = e?.response?.data?.detail || e?.message || 'Request failed'
      useUiStore().toast(msg, 'error')
      response.value = { status_code: null, status_text: null, response_headers: {}, body: null, is_json: false, time_ms: null, size_bytes: null, error: msg }
    } finally {
      sending.value = false
      saveState()
    }
  }

  function loadFromSaved(collId: number, req: any) {
    activeCollectionId.value = collId
    activeRequestId.value = req.id
    method.value = req.method || 'GET'
    url.value = req.url || ''
    headers.value = req.headers?.length ? req.headers : [{ key: '', value: '', enabled: true }]
    queryParams.value = req.query_params?.length ? req.query_params : [{ key: '', value: '', enabled: true }]
    bodyType.value = req.body_type || 'none'
    bodyContent.value = req.body_content || ''

    // Normalize auth - handle both auth_data object and auth_type string
    if (req.auth_data && typeof req.auth_data === 'object' && Object.keys(req.auth_data).length) {
      auth.value = { type: 'none', ...req.auth_data }
    } else {
      auth.value = { type: req.auth_type || 'none' }
    }

    response.value = null
    saveState()
  }

  function loadFromHistory(entry: any) {
    activeCollectionId.value = null
    activeRequestId.value = null
    method.value = entry.method || 'GET'
    url.value = entry.url || ''
    headers.value = entry.request_headers?.length ? entry.request_headers : [{ key: '', value: '', enabled: true }]
    queryParams.value = [{ key: '', value: '', enabled: true }]
    bodyType.value = 'none'
    bodyContent.value = entry.request_body || ''

    if (bodyContent.value) {
      try { JSON.parse(bodyContent.value); bodyType.value = 'json' } catch { bodyType.value = 'raw' }
    }

    // Show response from history
    if (entry.status_code || entry.error) {
      response.value = {
        status_code: entry.status_code,
        status_text: entry.status_code ? `${entry.status_code}` : null,
        response_headers: entry.response_headers || {},
        body: entry.response_body,
        is_json: false,
        time_ms: entry.response_time_ms,
        size_bytes: entry.response_size_bytes,
        error: entry.error,
      }
      // Check if response body is JSON
      if (response.value.body) {
        try {
          JSON.parse(response.value.body)
          response.value.is_json = true
        } catch { /* not json */ }
      }
    } else {
      response.value = null
    }
  }

  function reset() {
    method.value = 'GET'
    url.value = ''
    headers.value = [{ key: '', value: '', enabled: true }]
    queryParams.value = [{ key: '', value: '', enabled: true }]
    bodyType.value = 'none'
    bodyContent.value = ''
    bodyRawSubType.value = 'text'
    graphqlVariables.value = ''
    multipartFields.value = [{ key: '', value: '', type: 'text', file: null, enabled: true }]
    binaryFile.value = null
    auth.value = { type: 'none' }
    response.value = null
    activeRequestId.value = null
    activeCollectionId.value = null
    sessionStorage.removeItem('fc_request_state')
  }

  function saveState() {
    try {
      sessionStorage.setItem('fc_request_state', JSON.stringify({
        method: method.value, url: url.value, headers: headers.value,
        queryParams: queryParams.value, bodyType: bodyType.value,
        bodyContent: bodyContent.value, bodyRawSubType: bodyRawSubType.value,
        graphqlVariables: graphqlVariables.value, auth: auth.value,
        activeRequestId: activeRequestId.value, activeCollectionId: activeCollectionId.value,
      }))
    } catch { /* storage full */ }
  }

  function restoreState() {
    try {
      const raw = sessionStorage.getItem('fc_request_state')
      if (!raw) return
      const s = JSON.parse(raw)
      method.value = s.method || 'GET'
      url.value = s.url || ''
      headers.value = s.headers?.length ? s.headers : [{ key: '', value: '', enabled: true }]
      queryParams.value = s.queryParams?.length ? s.queryParams : [{ key: '', value: '', enabled: true }]
      bodyType.value = s.bodyType || 'none'
      bodyContent.value = s.bodyContent || ''
      bodyRawSubType.value = s.bodyRawSubType || 'text'
      graphqlVariables.value = s.graphqlVariables || ''
      auth.value = s.auth || { type: 'none' }
      activeRequestId.value = s.activeRequestId ?? null
      activeCollectionId.value = s.activeCollectionId ?? null
    } catch { /* corrupt */ }
  }

  // Restore on creation
  restoreState()

  return {
    method, url, headers, queryParams, bodyType, bodyContent,
    bodyRawSubType, graphqlVariables, multipartFields, binaryFile,
    auth, sending, response, activeRequestId, activeCollectionId,
    sendRequest, loadFromSaved, loadFromHistory, reset, saveState, restoreState,
  }
})
