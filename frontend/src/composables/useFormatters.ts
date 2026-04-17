export function useFormatters() {
  function formatBytes(bytes: number | null | undefined): string {
    if (!bytes || bytes <= 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1)
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  function formatTime(ms: number | null | undefined): string {
    if (ms == null) return '-'
    if (ms < 1000) return Math.round(ms) + ' ms'
    return (ms / 1000).toFixed(2) + ' s'
  }

  function timeAgo(dateStr: string): string {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = (now.getTime() - date.getTime()) / 1000
    if (diff < 60) return 'just now'
    if (diff < 3600) return Math.floor(diff / 60) + 'm ago'
    if (diff < 86400) return Math.floor(diff / 3600) + 'h ago'
    return date.toLocaleDateString()
  }

  function getStatusClass(code: number | null): string {
    if (!code) return 'error'
    if (code < 200) return 'info'
    if (code < 300) return 'success'
    if (code < 400) return 'redirect'
    if (code < 500) return 'warning'
    return 'error'
  }

  function truncateUrl(url: string, maxLen = 50): string {
    if (!url || url.length <= maxLen) return url
    return url.substring(0, maxLen) + '\u2026'
  }

  /**
   * Attempt to fix common JSON syntax errors:
   * - Missing commas between key-value pairs / array elements
   * - Trailing commas before } or ]
   * - Single quotes instead of double quotes
   * - Unquoted keys
   * Returns the fixed string, or the original if unfixable.
   */
  function fixJson(str: string): string {
    if (!str.trim()) return str

    // If already valid, return as-is
    try { JSON.parse(str); return str } catch { /* continue fixing */ }

    let fixed = str

    // 1. Replace single-quoted strings with double-quoted strings
    //    Handles: { 'key': 'value' } -> { "key": "value" }
    fixed = fixed.replace(/'/g, (match, offset) => {
      // Check if inside a double-quoted string (don't replace)
      let inDouble = false
      for (let i = 0; i < offset; i++) {
        if (fixed[i] === '"' && (i === 0 || fixed[i - 1] !== '\\')) {
          inDouble = !inDouble
        }
      }
      return inDouble ? match : '"'
    })

    // 2. Fix trailing commas before } or ]
    //    Handles: { "a": 1, } -> { "a": 1 }
    fixed = fixed.replace(/,(\s*[}\]])/g, '$1')

    // 3. Fix missing commas between values on separate lines
    //    This is the main fix the user wants:
    //    { "Hello": "Hi"
    //      "Hi": "Name" }
    //    -> { "Hello": "Hi",
    //       "Hi": "Name" }
    //
    //    Pattern: a value ending (string, number, bool, null, }, ])
    //    followed by whitespace/newline, then a new key or value start (", digit, {, [, true, false, null)
    //    without a comma between them.

    // Pass 1: Fix missing comma after a value followed by a quoted key or value on the next line
    // Match: (value-end)(whitespace-with-newline)(value-start) without comma
    fixed = fixed.replace(
      /(["}\]\d]|true|false|null)(\s*\n\s*)(["{\[\dtfn])/g,
      (match, before, ws, after) => {
        // Don't add comma after { or [ (those are openers, not values)
        // The `before` capture already excludes those since it only matches ", }, ], digits, true, false, null
        return before + ',' + ws + after
      }
    )

    // Pass 2: Fix missing comma on same line between values
    // e.g., { "a": "b" "c": "d" }
    fixed = fixed.replace(
      /(")(\s+)(")/g,
      (match, q1, ws, q2) => {
        // Need to determine if the first " closes a value and second " opens a key
        // Simple heuristic: if there's no comma or colon between them, add comma
        return q1 + ',' + ws + q2
      }
    )

    // Pass 3: Handle missing comma between closing bracket and next value
    // e.g., } "next" or ] "next" or } { or ] [
    fixed = fixed.replace(
      /([}\]])(\s+)(["{\[\dtfn])/g,
      (match, bracket, ws, after) => {
        return bracket + ',' + ws + after
      }
    )

    // Pass 4: Fix missing comma after number/bool/null followed by key
    // e.g., { "a": 1 "b": 2 }
    fixed = fixed.replace(
      /(\d)(\s+)(")/g,
      '$1,$2$3'
    )

    // Clean up any double commas we may have introduced
    fixed = fixed.replace(/,(\s*),/g, ',$1')

    // Re-fix trailing commas (in case passes above added one before })
    fixed = fixed.replace(/,(\s*[}\]])/g, '$1')

    // Validate the fix worked
    try {
      JSON.parse(fixed)
      return fixed
    } catch {
      // If still invalid, try a more aggressive character-by-character approach
      return fixJsonCharByChar(str)
    }
  }

  /**
   * Character-by-character JSON fixer for more complex cases.
   * Walks through the string tracking context and inserting missing commas.
   */
  function fixJsonCharByChar(str: string): string {
    const chars = str.split('')
    const result: string[] = []
    let i = 0
    let lastValueEnd = -1  // index in result[] where last value ended

    function skipWhitespace() {
      while (i < chars.length && /\s/.test(chars[i])) {
        result.push(chars[i])
        i++
      }
    }

    function readString(): string {
      let s = chars[i] // opening quote
      result.push(chars[i])
      i++
      while (i < chars.length && chars[i] !== '"') {
        if (chars[i] === '\\' && i + 1 < chars.length) {
          result.push(chars[i])
          i++
        }
        result.push(chars[i])
        i++
      }
      if (i < chars.length) {
        result.push(chars[i]) // closing quote
        i++
      }
      return s
    }

    function readToken(): string {
      let tok = ''
      while (i < chars.length && /[a-zA-Z0-9.+\-]/.test(chars[i])) {
        tok += chars[i]
        result.push(chars[i])
        i++
      }
      return tok
    }

    // Track whether we expect a comma before the next value
    type Context = 'object' | 'array'
    const stack: Context[] = []
    let needsComma = false

    while (i < chars.length) {
      skipWhitespace()
      if (i >= chars.length) break

      const ch = chars[i]

      if (ch === '{' || ch === '[') {
        if (needsComma) {
          result.push(',')
          needsComma = false
        }
        stack.push(ch === '{' ? 'object' : 'array')
        result.push(chars[i])
        i++
        needsComma = false
      } else if (ch === '}' || ch === ']') {
        // Remove trailing comma if present
        let ri = result.length - 1
        while (ri >= 0 && /\s/.test(result[ri])) ri--
        if (ri >= 0 && result[ri] === ',') {
          result[ri] = '' // remove trailing comma
        }
        stack.pop()
        result.push(chars[i])
        i++
        needsComma = true
      } else if (ch === ',') {
        result.push(chars[i])
        i++
        needsComma = false
      } else if (ch === ':') {
        result.push(chars[i])
        i++
        needsComma = false
      } else if (ch === '"') {
        if (needsComma) {
          result.push(',')
        }
        readString()
        // After a string, check if next non-ws char is : (it's a key) or not (it's a value)
        const saveI = i
        let tmpI = i
        while (tmpI < chars.length && /\s/.test(chars[tmpI])) tmpI++
        if (tmpI < chars.length && chars[tmpI] === ':') {
          // It's a key, needsComma stays false until we read the value
          needsComma = false
        } else {
          // It's a value
          needsComma = true
        }
      } else if (/[\d\-]/.test(ch)) {
        if (needsComma) {
          result.push(',')
        }
        readToken()
        needsComma = true
      } else if (/[a-zA-Z]/.test(ch)) {
        // true, false, null
        if (needsComma) {
          result.push(',')
        }
        readToken()
        needsComma = true
      } else {
        result.push(chars[i])
        i++
      }
    }

    const fixedStr = result.join('')
    try {
      JSON.parse(fixedStr)
      return fixedStr
    } catch {
      return str // return original if still can't fix
    }
  }

  function prettifyJson(str: string): string {
    try {
      return JSON.stringify(JSON.parse(str), null, 2)
    } catch {
      // Try fixing first
      const fixed = fixJson(str)
      try {
        return JSON.stringify(JSON.parse(fixed), null, 2)
      } catch {
        return str
      }
    }
  }

  function minifyJson(str: string): string {
    try {
      return JSON.stringify(JSON.parse(str))
    } catch {
      const fixed = fixJson(str)
      try {
        return JSON.stringify(JSON.parse(fixed))
      } catch {
        return str
      }
    }
  }

  function isValidJson(str: string): boolean {
    try { JSON.parse(str); return true } catch { return false }
  }

  /**
   * Check if the string can be fixed into valid JSON.
   */
  function isFixableJson(str: string): boolean {
    if (isValidJson(str)) return true
    const fixed = fixJson(str)
    return isValidJson(fixed)
  }

  function copyToClipboard(text: string, onSuccess?: () => void, onError?: () => void) {
    navigator.clipboard.writeText(text).then(onSuccess, onError)
  }

  return { formatBytes, formatTime, timeAgo, getStatusClass, truncateUrl, prettifyJson, minifyJson, isValidJson, isFixableJson, fixJson, copyToClipboard }
}
