export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS'

export type AuthType = 'none' | 'bearer' | 'basic' | 'api_key'

export type BodyType = 'none' | 'json' | 'form' | 'form_urlencoded' | 'multipart' | 'xml' | 'graphql' | 'raw' | 'binary'

export type RawSubType = 'text' | 'html' | 'xml' | 'javascript'

export interface KeyValuePair {
  key: string
  value: string
  enabled: boolean
}

export interface AuthConfig {
  type: AuthType
  bearer_token?: string
  basic_username?: string
  basic_password?: string
  api_key_key?: string
  api_key_value?: string
  api_key_in?: 'header' | 'query'
}

export interface SendRequestPayload {
  method: HttpMethod
  url: string
  headers: KeyValuePair[]
  query_params: KeyValuePair[]
  body_type: BodyType
  body_content?: string
  raw_sub_type?: RawSubType
  auth: AuthConfig
}

export interface SendRequestResponse {
  status_code: number | null
  status_text: string | null
  response_headers: Record<string, string>
  body: string | null
  is_json: boolean
  time_ms: number | null
  size_bytes: number | null
  error: string | null
}

export interface Collection {
  id: number
  name: string
  parent_id: number | null
  children: Collection[]
  requests: SavedRequest[]
  created_at: string
  updated_at: string
}

export interface SavedRequest {
  id: number
  collection_id: number
  name: string
  method: HttpMethod
  url: string
  headers: KeyValuePair[]
  query_params: KeyValuePair[]
  body_type: BodyType
  body_content: string | null
  auth_type: AuthType
  auth_data: Record<string, any> | null
  sort_order: number
  created_at: string
  updated_at: string
}

export interface HistoryEntry {
  id: number
  method: string
  url: string
  request_headers: KeyValuePair[]
  request_body: string | null
  status_code: number | null
  response_headers: Record<string, string> | null
  response_body: string | null
  response_time_ms: number | null
  response_size_bytes: number | null
  error: string | null
  created_at: string
}

export interface Environment {
  id: number
  name: string
  is_active: boolean
  variables: EnvironmentVariable[]
  created_at: string
}

export interface EnvironmentVariable {
  id: number
  key: string
  value: string
  is_secret: boolean
}

export interface ImportResult {
  imported: number
  message: string
}

export interface MultipartField {
  key: string
  value: string
  type: 'text' | 'file'
  file?: File | null
  enabled: boolean
}
