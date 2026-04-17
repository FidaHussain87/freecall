import type { HttpMethod, KeyValuePair, AuthConfig, BodyType } from '@/api/types'

interface CurlResult {
  method: HttpMethod
  url: string
  headers: KeyValuePair[]
  body_type: BodyType
  body_content: string
  auth: AuthConfig
}

function isValidJson(str: string): boolean {
  try { JSON.parse(str); return true } catch { return false }
}

export function useCurl() {
  function parseCurl(str: string): CurlResult | null {
    str = str.trim()
    if (!str.startsWith('curl ') && !str.startsWith('curl\t')) return null

    const result: CurlResult = {
      method: 'GET',
      url: '',
      headers: [],
      body_type: 'none',
      body_content: '',
      auth: { type: 'none' },
    }

    // Normalize multiline
    str = str.replace(/\\\s*\n/g, ' ')

    // Tokenize respecting quotes
    const tokens: string[] = []
    let current = ''
    let inSingle = false
    let inDouble = false
    for (let i = 0; i < str.length; i++) {
      const ch = str[i]
      if (ch === "'" && !inDouble) { inSingle = !inSingle; continue }
      if (ch === '"' && !inSingle) { inDouble = !inDouble; continue }
      if (ch === ' ' && !inSingle && !inDouble) {
        if (current) tokens.push(current)
        current = ''
      } else {
        current += ch
      }
    }
    if (current) tokens.push(current)

    for (let i = 1; i < tokens.length; i++) {
      const t = tokens[i]
      if (t === '-X' || t === '--request') {
        result.method = (tokens[++i] || 'GET').toUpperCase() as HttpMethod
      } else if (t === '-H' || t === '--header') {
        const hdr = tokens[++i] || ''
        const colonIdx = hdr.indexOf(':')
        if (colonIdx > 0) {
          result.headers.push({ key: hdr.slice(0, colonIdx).trim(), value: hdr.slice(colonIdx + 1).trim(), enabled: true })
        }
      } else if (t === '-d' || t === '--data' || t === '--data-raw' || t === '--data-binary') {
        result.body_content = tokens[++i] || ''
        if (result.method === 'GET') result.method = 'POST'
        result.body_type = isValidJson(result.body_content) ? 'json' : 'raw'
      } else if (t === '-u' || t === '--user') {
        const cred = tokens[++i] || ''
        const [user, pass] = cred.split(':')
        result.auth = { type: 'basic', basic_username: user || '', basic_password: pass || '' }
      } else if (!t.startsWith('-') && !result.url) {
        result.url = t
      }
    }

    return result.url ? result : null
  }

  return { parseCurl }
}
