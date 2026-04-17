// JSON formatting with syntax highlighting
function formatJson(str) {
    try {
        const obj = JSON.parse(str);
        return syntaxHighlight(JSON.stringify(obj, null, 2));
    } catch {
        return escapeHtml(str);
    }
}

function prettifyJson(str) {
    try {
        const obj = JSON.parse(str);
        return JSON.stringify(obj, null, 2);
    } catch {
        return str;
    }
}

function minifyJson(str) {
    try {
        const obj = JSON.parse(str);
        return JSON.stringify(obj);
    } catch {
        return str;
    }
}

function isValidJson(str) {
    try { JSON.parse(str); return true; } catch { return false; }
}

function syntaxHighlight(json) {
    json = escapeHtml(json);
    return json.replace(
        /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
        function (match) {
            let cls = 'json-number';
            if (/^"/.test(match)) {
                if (/:$/.test(match)) {
                    cls = 'json-key';
                } else {
                    cls = 'json-string';
                }
            } else if (/true|false/.test(match)) {
                cls = 'json-boolean';
            } else if (/null/.test(match)) {
                cls = 'json-null';
            }
            return `<span class="${cls}">${match}</span>`;
        }
    );
}

// Enhanced syntax highlight for live code editor (includes braces, brackets, colons, commas)
function syntaxHighlightEditor(text) {
    const escaped = escapeHtml(text);
    return escaped
        .replace(
            /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
            function (match) {
                let cls = 'json-number';
                if (/^"/.test(match)) {
                    cls = /:$/.test(match) ? 'json-key' : 'json-string';
                } else if (/true|false/.test(match)) {
                    cls = 'json-boolean';
                } else if (/null/.test(match)) {
                    cls = 'json-null';
                }
                return `<span class="${cls}">${match}</span>`;
            }
        )
        .replace(/([{}])/g, '<span class="json-brace">$1</span>')
        .replace(/([\[\]])/g, '<span class="json-bracket">$1</span>');
}

function escapeHtml(str) {
    if (str == null) return '';
    const div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
}

function formatBytes(bytes) {
    if (!bytes || bytes <= 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function formatTime(ms) {
    if (ms == null) return '-';
    if (ms < 1000) return Math.round(ms) + ' ms';
    return (ms / 1000).toFixed(2) + ' s';
}

function getStatusClass(code) {
    if (!code) return 'status-err';
    if (code < 200) return 'status-1xx';
    if (code < 300) return 'status-2xx';
    if (code < 400) return 'status-3xx';
    if (code < 500) return 'status-4xx';
    return 'status-5xx';
}

function getStatusBadgeClass(code) {
    return getStatusClass(code) + '-badge';
}

function truncateUrl(url, maxLen = 50) {
    if (!url) return '';
    if (url.length <= maxLen) return url;
    return url.substring(0, maxLen) + '\u2026';
}

function timeAgo(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = (now - date) / 1000;
    if (diff < 60) return 'just now';
    if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
    if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
    return date.toLocaleDateString();
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(
        () => UI.toast('Copied to clipboard'),
        () => UI.toast('Copy failed', 'error')
    );
}

// Parse a cURL command into a request payload
function parseCurl(str) {
    str = str.trim();
    if (!str.startsWith('curl ') && !str.startsWith('curl\t')) return null;

    const result = { method: 'GET', url: '', headers: [], body_type: 'none', body_content: '', auth: { type: 'none' } };

    // Normalize multiline (backslash continuations)
    str = str.replace(/\\\s*\n/g, ' ');

    // Tokenize respecting quotes
    const tokens = [];
    let current = '';
    let inSingle = false, inDouble = false;
    for (let i = 0; i < str.length; i++) {
        const ch = str[i];
        if (ch === "'" && !inDouble) { inSingle = !inSingle; continue; }
        if (ch === '"' && !inSingle) { inDouble = !inDouble; continue; }
        if (ch === ' ' && !inSingle && !inDouble) {
            if (current) tokens.push(current);
            current = '';
        } else {
            current += ch;
        }
    }
    if (current) tokens.push(current);

    for (let i = 1; i < tokens.length; i++) {
        const t = tokens[i];
        if (t === '-X' || t === '--request') {
            result.method = (tokens[++i] || 'GET').toUpperCase();
        } else if (t === '-H' || t === '--header') {
            const hdr = tokens[++i] || '';
            const colonIdx = hdr.indexOf(':');
            if (colonIdx > 0) {
                result.headers.push({ key: hdr.slice(0, colonIdx).trim(), value: hdr.slice(colonIdx + 1).trim(), enabled: true });
            }
        } else if (t === '-d' || t === '--data' || t === '--data-raw' || t === '--data-binary') {
            result.body_content = tokens[++i] || '';
            if (result.method === 'GET') result.method = 'POST';
            result.body_type = isValidJson(result.body_content) ? 'json' : 'raw';
        } else if (t === '-u' || t === '--user') {
            const cred = tokens[++i] || '';
            const [user, pass] = cred.split(':');
            result.auth = { type: 'basic', basic_username: user || '', basic_password: pass || '' };
        } else if (!t.startsWith('-') && !result.url) {
            result.url = t;
        }
    }

    return result.url ? result : null;
}
