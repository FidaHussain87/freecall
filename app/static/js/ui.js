// DOM manipulation and rendering
const UI = {
    // Toast notifications
    toast(message, type = 'success') {
        const container = document.getElementById('toast-container');
        if (!container) return;
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    },

    // Sidebar: Collections (with sub-collection hierarchy)
    renderCollections(collections, expandedIds = new Set()) {
        const el = document.getElementById('collections-list');
        if (!el) return;
        if (!collections.length) {
            el.innerHTML = '<div class="empty-state"><p>No collections yet</p><p style="font-size:11px">Click + New Collection to create one</p></div>';
            return;
        }

        // Build tree: separate roots (no parent_id) from children
        const roots = collections.filter(c => !c.parent_id);
        const childMap = {};
        collections.forEach(c => {
            if (c.parent_id) {
                if (!childMap[c.parent_id]) childMap[c.parent_id] = [];
                childMap[c.parent_id].push(c);
            }
        });

        function renderNode(c, depth) {
            const children = childMap[c.id] || [];
            const hasChildren = children.length > 0 || (c.request_count || 0) > 0;
            const isExpanded = expandedIds.has(c.id);
            const indent = depth * 12;

            let html = `
                <div class="collection-item" data-id="${c.id}">
                    <div class="collection-header ${isExpanded ? 'expanded' : ''}" style="padding-left:${8 + indent}px" onclick="App.toggleCollection(${c.id})">
                        <span class="arrow">${hasChildren ? '\u25B6' : '\u2022'}</span>
                        <span class="coll-icon">${depth > 0 ? '\uD83D\uDCC2' : '\uD83D\uDCC1'}</span>
                        <span class="name">${escapeHtml(c.name)}</span>
                        <span class="count">${c.request_count || 0}</span>
                        <span class="coll-actions">
                            <button class="btn-icon" onclick="event.stopPropagation();App.showNewSubCollectionModal(${c.id})" title="Add sub-collection">+</button>
                            <button class="btn-icon" onclick="event.stopPropagation();App.deleteCollection(${c.id})" title="Delete">\u00D7</button>
                        </span>
                    </div>
                    <div class="collection-requests ${isExpanded ? 'open' : ''}" id="coll-requests-${c.id}">
                        ${children.map(child => renderNode(child, depth + 1)).join('')}
                    </div>
                </div>`;
            return html;
        }

        el.innerHTML = roots.map(c => renderNode(c, 0)).join('');
    },

    renderCollectionRequests(collectionId, requests) {
        const el = document.getElementById(`coll-requests-${collectionId}`);
        if (!el) return;

        // Preserve existing sub-collection nodes (they were rendered in renderCollections)
        const existingSubColls = el.querySelectorAll(':scope > .collection-item');
        const subCollHtml = Array.from(existingSubColls).map(n => n.outerHTML).join('');

        let reqHtml = '';
        if (requests.length) {
            reqHtml = requests.map(r => `
                <div class="request-item" onclick="App.loadSavedRequest(${collectionId}, ${r.id})">
                    <span class="method-badge method-${r.method}">${r.method}</span>
                    <span class="req-name">${escapeHtml(r.name)}</span>
                    <button class="btn-icon" onclick="event.stopPropagation();App.deleteSavedRequest(${collectionId},${r.id})" title="Delete">\u00D7</button>
                </div>
            `).join('');
        } else if (!subCollHtml) {
            reqHtml = '<div style="padding:6px 8px;font-size:11px;color:var(--text-muted)">Empty</div>';
        }

        el.innerHTML = subCollHtml + reqHtml;
    },

    // Sidebar: History
    renderHistory(history) {
        const el = document.getElementById('history-list');
        if (!el) return;
        if (!history.length) {
            el.innerHTML = '<div class="empty-state"><p>No history yet</p><p style="font-size:11px">Send a request to get started</p></div>';
            return;
        }
        el.innerHTML = history.map(h => {
            const statusCls = h.error ? 'status-err' : getStatusClass(h.status_code);
            const statusText = h.error ? 'ERR' : (h.status_code || '');
            return `
                <div class="history-item" onclick="App.loadHistoryEntry(${h.id})" title="${escapeHtml(h.url)}">
                    <span class="method-badge method-${h.method}">${h.method}</span>
                    <span class="url">${escapeHtml(truncateUrl(h.url))}</span>
                    <span class="status ${statusCls}">${statusText}</span>
                    <span class="time-ago">${timeAgo(h.timestamp)}</span>
                </div>
            `;
        }).join('');
    },

    // Response
    renderResponse(resp) {
        const statusBar = document.getElementById('response-status-bar');
        const bodyEl = document.getElementById('response-body');
        const headersEl = document.getElementById('response-headers');
        const rawEl = document.getElementById('response-raw');
        if (!statusBar || !bodyEl) return;

        if (resp.error) {
            statusBar.innerHTML = `<span class="status-badge status-err-badge">ERROR</span><span class="meta">${escapeHtml(resp.error)}</span>`;
            bodyEl.innerHTML = `<div class="empty-state"><p style="color:var(--red)">${escapeHtml(resp.error)}</p></div>`;
            if (headersEl) headersEl.innerHTML = '';
            if (rawEl) rawEl.innerHTML = '';
            return;
        }

        const badgeCls = getStatusBadgeClass(resp.status_code);
        statusBar.innerHTML = `
            <span class="status-badge ${badgeCls}">${resp.status_code} ${escapeHtml(resp.status_text || '')}</span>
            <span class="meta">Time: <span>${formatTime(resp.time_ms)}</span></span>
            <span class="meta">Size: <span>${formatBytes(resp.size_bytes)}</span></span>
            <button class="btn btn-sm copy-resp-btn" onclick="copyToClipboard(App._lastResponseBody || '')">Copy</button>
        `;

        // Store for copy
        App._lastResponseBody = resp.body || '';

        // Body - truncate display for very large responses (>2MB)
        const bodyStr = resp.body || '';
        const truncated = bodyStr.length > 2_000_000;
        const displayBody = truncated ? bodyStr.slice(0, 2_000_000) : bodyStr;

        if (resp.is_json && displayBody) {
            bodyEl.innerHTML = `<pre class="response-body-content">${formatJson(displayBody)}</pre>`;
        } else {
            bodyEl.innerHTML = `<pre class="response-body-content">${escapeHtml(displayBody)}</pre>`;
        }
        if (truncated) {
            bodyEl.innerHTML += '<div style="padding:8px;color:var(--yellow);font-size:12px">Response truncated for display (> 2MB). Use Copy to get full response.</div>';
        }

        // Headers
        if (headersEl && resp.response_headers) {
            const rows = Object.entries(resp.response_headers)
                .map(([k, v]) => `<tr><td>${escapeHtml(k)}</td><td>${escapeHtml(v)}</td></tr>`)
                .join('');
            headersEl.innerHTML = `<table class="response-headers-table">${rows}</table>`;
        }

        // Raw
        if (rawEl) {
            rawEl.innerHTML = `<pre class="response-body-content">${escapeHtml(displayBody)}</pre>`;
        }
    },

    clearResponse() {
        const el = (id) => document.getElementById(id);
        const bar = el('response-status-bar');
        const body = el('response-body');
        const headers = el('response-headers');
        const raw = el('response-raw');
        if (bar) bar.innerHTML = '';
        if (body) body.innerHTML = '<div class="empty-state"><p>Send a request to see the response</p></div>';
        if (headers) headers.innerHTML = '';
        if (raw) raw.innerHTML = '';
    },

    // Key-value editor (using data attributes for robustness)
    renderKVEditor(containerId, pairs) {
        const el = document.getElementById(containerId);
        if (!el) return;
        const html = pairs.map((p, i) => `
            <div class="kv-row" data-idx="${i}">
                <input type="checkbox" ${p.enabled ? 'checked' : ''} data-action="toggle" data-container="${containerId}" data-idx="${i}">
                <input type="text" placeholder="Key" value="${escapeHtml(p.key)}" data-action="update" data-field="key" data-container="${containerId}" data-idx="${i}">
                <input type="text" placeholder="Value" value="${escapeHtml(p.value)}" data-action="update" data-field="value" data-container="${containerId}" data-idx="${i}">
                <button class="btn-icon kv-remove" data-container="${containerId}" data-idx="${i}">\u00D7</button>
            </div>
        `).join('');
        el.innerHTML = html + `<button class="btn btn-sm kv-add" data-container="${containerId}">+ Add</button>`;
    },

    // Modals
    showModal(content) {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
        overlay.innerHTML = `<div class="modal">${content}</div>`;
        document.body.appendChild(overlay);
        // Escape to close
        const escHandler = (e) => {
            if (e.key === 'Escape') { overlay.remove(); document.removeEventListener('keydown', escHandler); }
        };
        document.addEventListener('keydown', escHandler);
        // Focus first input
        setTimeout(() => { const inp = overlay.querySelector('input[type="text"],input:not([type="file"])'); if (inp) inp.focus(); }, 50);
        return overlay;
    },

    closeModal() {
        document.querySelector('.modal-overlay')?.remove();
    },

    showSaveRequestModal(collections) {
        // Flatten collections for the dropdown (show hierarchy with indentation)
        function flatOptions(colls, depth = 0) {
            return colls.map(c => {
                const indent = '\u00A0\u00A0'.repeat(depth);
                return `<option value="${c.id}">${indent}${escapeHtml(c.name)}</option>`;
            }).join('');
        }
        const options = flatOptions(collections);
        const content = `
            <h2>Save Request</h2>
            <div class="form-group">
                <label>Name</label>
                <input type="text" id="save-req-name" placeholder="My Request">
            </div>
            <div class="form-group">
                <label>Collection</label>
                <select id="save-req-collection">${options}</select>
            </div>
            <div class="modal-actions">
                <button class="btn" onclick="UI.closeModal()">Cancel</button>
                <button class="btn btn-primary" onclick="App.confirmSaveRequest()">Save</button>
            </div>
        `;
        this.showModal(content);
    },

    showNewCollectionModal(parentId) {
        const parentLabel = parentId ? '<p style="font-size:11px;color:var(--text-muted);margin-bottom:12px">Creating sub-collection</p>' : '';
        const content = `
            <h2>${parentId ? 'New Sub-Collection' : 'New Collection'}</h2>
            ${parentLabel}
            <div class="form-group">
                <label>Name</label>
                <input type="text" id="new-coll-name" placeholder="Collection name">
            </div>
            <div class="form-group">
                <label>Description</label>
                <textarea id="new-coll-desc" rows="2" placeholder="Optional description"></textarea>
            </div>
            <input type="hidden" id="new-coll-parent" value="${parentId || ''}">
            <div class="modal-actions">
                <button class="btn" onclick="UI.closeModal()">Cancel</button>
                <button class="btn btn-primary" onclick="App.confirmNewCollection()">Create</button>
            </div>
        `;
        this.showModal(content);
    },

    showEnvironmentModal(environments, activeId) {
        const envOptions = environments.map(e =>
            `<option value="${e.id}" ${e.is_active ? 'selected' : ''}>${escapeHtml(e.name)}${e.is_active ? ' (active)' : ''}</option>`
        ).join('');

        const content = `
            <h2>Environments</h2>
            <div class="env-modal-bar">
                <select id="env-modal-select" onchange="App.envModalSelect(this.value)">
                    <option value="">No environment</option>
                    ${envOptions}
                </select>
                <button class="btn btn-sm btn-primary" onclick="App.envModalNew()">New</button>
                <button class="btn btn-sm" onclick="App.envModalActivate()">Activate</button>
                <button class="btn btn-sm btn-danger" onclick="App.envModalDelete()">Delete</button>
            </div>
            <div id="env-modal-vars"></div>
            <div class="modal-actions">
                <button class="btn" onclick="UI.closeModal()">Close</button>
                <button class="btn btn-primary" onclick="App.envModalSave()">Save Variables</button>
            </div>
        `;
        this.showModal(content);
    },

    renderEnvVars(variables) {
        const el = document.getElementById('env-modal-vars');
        if (!el) return;
        const rows = (variables || []).map((v, i) => `
            <tr>
                <td><input type="text" value="${escapeHtml(v.key)}" data-idx="${i}" data-field="key"></td>
                <td><input type="text" value="${escapeHtml(v.value)}" data-idx="${i}" data-field="value"></td>
                <td style="width:40px;text-align:center">
                    <input type="checkbox" ${v.is_secret ? 'checked' : ''} data-idx="${i}" data-field="is_secret">
                </td>
                <td style="width:30px">
                    <button class="btn-icon" onclick="App.envRemoveVar(${i})">\u00D7</button>
                </td>
            </tr>
        `).join('');

        el.innerHTML = `
            <table class="env-var-table">
                <thead><tr><th>Key</th><th>Value</th><th>Secret</th><th></th></tr></thead>
                <tbody>${rows}</tbody>
            </table>
            <button class="btn btn-sm" onclick="App.envAddVar()" style="margin-top:8px">+ Add Variable</button>
        `;
    },

    showImportModal() {
        const content = `
            <h2>Import Collections</h2>
            <div class="form-group">
                <label>Select JSON file</label>
                <input type="file" id="import-file" accept=".json" style="color:var(--text-primary)">
            </div>
            <div class="modal-actions">
                <button class="btn" onclick="UI.closeModal()">Cancel</button>
                <button class="btn btn-primary" onclick="App.confirmImport()">Import</button>
            </div>
        `;
        this.showModal(content);
    },
};
