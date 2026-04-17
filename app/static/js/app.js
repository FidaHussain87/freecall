// Main application controller
const App = {
    state: {
        method: 'GET',
        url: '',
        headers: [{ key: '', value: '', enabled: true }],
        queryParams: [{ key: '', value: '', enabled: true }],
        bodyType: 'none',
        bodyContent: '',
        auth: { type: 'none' },
        collections: [],
        expandedCollections: new Set(),
        history: [],
        environments: [],
        envModalVars: [],
        sending: false,
    },
    _lastResponseBody: '',
    _resizing: false,

    async init() {
        this.restoreState();
        this.bindEvents();
        this.bindDelegatedEvents();
        this.initResizer();
        this.initCodeEditor();
        await Promise.all([
            this.loadCollections(),
            this.loadHistory(),
            this.loadEnvironments(),
        ]);
        UI.clearResponse();
        this.renderKVEditors();
        this.syncFormToState();
    },

    // --- Persist/restore basic state across reloads ---
    saveState() {
        try {
            const s = this.state;
            sessionStorage.setItem('fc_state', JSON.stringify({
                method: s.method, url: s.url, headers: s.headers, queryParams: s.queryParams,
                bodyType: s.bodyType, bodyContent: s.bodyContent, auth: s.auth,
            }));
            localStorage.setItem('fc_expanded', JSON.stringify([...this.state.expandedCollections]));
        } catch {}
    },

    restoreState() {
        try {
            const saved = sessionStorage.getItem('fc_state');
            if (saved) {
                const s = JSON.parse(saved);
                Object.assign(this.state, s);
            }
            const expanded = localStorage.getItem('fc_expanded');
            if (expanded) {
                this.state.expandedCollections = new Set(JSON.parse(expanded));
            }
        } catch {}
    },

    syncFormToState() {
        const $ = id => document.getElementById(id);
        const ms = $('method-select');
        const ui = $('url-input');
        const bt = $('body-type');
        const bc = $('body-content');
        const at = $('auth-type');
        if (ms) { ms.value = this.state.method; ms.className = `method-select method-${this.state.method}`; }
        if (ui) ui.value = this.state.url;
        if (bt) bt.value = this.state.bodyType;
        if (bc) bc.value = this.state.bodyContent;
        if (at) { at.value = this.state.auth.type || 'none'; }
        this.renderKVEditors();
        this.updateCodeEditorMode();
        this.syncCodeEditor();
    },

    // =============================================
    // DRAGGABLE RESIZER
    // =============================================
    initResizer() {
        const resizer = document.getElementById('pane-resizer');
        const requestConfig = document.getElementById('request-config');
        const responseArea = document.getElementById('response-area');
        const requestArea = document.querySelector('.request-area');
        if (!resizer || !requestConfig || !responseArea || !requestArea) return;

        // Restore saved ratio
        const savedRatio = localStorage.getItem('fc_pane_ratio');
        if (savedRatio) {
            const ratio = parseFloat(savedRatio);
            if (ratio > 0.1 && ratio < 0.9) {
                requestConfig.style.flex = `${ratio}`;
                responseArea.style.flex = `${1 - ratio}`;
            }
        }

        let startY = 0;
        let startTopH = 0;
        let totalH = 0;

        const onMouseDown = (e) => {
            e.preventDefault();
            this._resizing = true;
            startY = e.clientY || (e.touches && e.touches[0].clientY) || 0;
            startTopH = requestConfig.getBoundingClientRect().height;
            totalH = requestArea.getBoundingClientRect().height - resizer.getBoundingClientRect().height;
            resizer.classList.add('dragging');
            document.body.classList.add('resizing');
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
            document.addEventListener('touchmove', onMouseMove, { passive: false });
            document.addEventListener('touchend', onMouseUp);
        };

        const onMouseMove = (e) => {
            if (!this._resizing) return;
            e.preventDefault();
            const clientY = e.clientY || (e.touches && e.touches[0].clientY) || 0;
            const dy = clientY - startY;
            let newTopH = startTopH + dy;

            // Enforce min sizes
            const minPx = 80;
            newTopH = Math.max(minPx, Math.min(totalH - minPx, newTopH));

            const ratio = newTopH / totalH;
            requestConfig.style.flex = `${ratio}`;
            responseArea.style.flex = `${1 - ratio}`;
        };

        const onMouseUp = () => {
            this._resizing = false;
            resizer.classList.remove('dragging');
            document.body.classList.remove('resizing');
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            document.removeEventListener('touchmove', onMouseMove);
            document.removeEventListener('touchend', onMouseUp);

            // Save ratio
            const topH = requestConfig.getBoundingClientRect().height;
            const area = document.querySelector('.request-area').getBoundingClientRect().height - resizer.getBoundingClientRect().height;
            if (area > 0) {
                localStorage.setItem('fc_pane_ratio', (topH / area).toFixed(3));
            }
        };

        resizer.addEventListener('mousedown', onMouseDown);
        resizer.addEventListener('touchstart', onMouseDown, { passive: false });
    },

    // =============================================
    // CODE EDITOR (live syntax highlighting)
    // =============================================
    initCodeEditor() {
        const textarea = document.getElementById('body-content');
        const highlight = document.getElementById('code-editor-highlight');
        if (!textarea || !highlight) return;

        // Sync scroll
        textarea.addEventListener('scroll', () => {
            highlight.scrollTop = textarea.scrollTop;
            highlight.scrollLeft = textarea.scrollLeft;
        });

        // Tab key support
        textarea.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                e.preventDefault();
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;
                textarea.value = textarea.value.substring(0, start) + '  ' + textarea.value.substring(end);
                textarea.selectionStart = textarea.selectionEnd = start + 2;
                textarea.dispatchEvent(new Event('input'));
            }
        });

        this.updateCodeEditorMode();
        this.syncCodeEditor();
    },

    syncCodeEditor() {
        const textarea = document.getElementById('body-content');
        const highlight = document.getElementById('code-editor-highlight');
        const wrap = document.getElementById('code-editor-wrap');
        if (!textarea || !highlight || !wrap) return;

        if (wrap.classList.contains('plain-mode')) {
            highlight.innerHTML = '';
            return;
        }

        const text = textarea.value;
        if (!text) {
            highlight.innerHTML = '';
            return;
        }

        highlight.innerHTML = syntaxHighlightEditor(text) + '\n';
        // Sync scroll position
        highlight.scrollTop = textarea.scrollTop;
        highlight.scrollLeft = textarea.scrollLeft;
    },

    updateCodeEditorMode() {
        const wrap = document.getElementById('code-editor-wrap');
        if (!wrap) return;
        if (this.state.bodyType === 'json') {
            wrap.classList.remove('plain-mode');
        } else {
            wrap.classList.add('plain-mode');
        }
        this.syncCodeEditor();
    },

    bindEvents() {
        const $ = id => document.getElementById(id);

        // Method selector
        $('method-select')?.addEventListener('change', (e) => {
            this.state.method = e.target.value;
            e.target.className = `method-select method-${e.target.value}`;
            this.saveState();
        });

        // URL input
        $('url-input')?.addEventListener('input', (e) => {
            this.state.url = e.target.value;
        });

        // URL input - Enter to send, cURL paste detection
        $('url-input')?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') this.sendRequest();
        });
        $('url-input')?.addEventListener('paste', (e) => {
            setTimeout(() => {
                const val = $('url-input').value;
                if (val.trim().startsWith('curl ')) {
                    const parsed = parseCurl(val);
                    if (parsed) {
                        this.applyCurlParsed(parsed);
                        UI.toast('Parsed cURL command');
                    }
                }
            }, 0);
        });

        // Cmd/Ctrl+Enter to send from anywhere
        document.addEventListener('keydown', (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                e.preventDefault();
                this.sendRequest();
            }
        });

        // Send button
        $('send-btn')?.addEventListener('click', () => this.sendRequest());

        // Request tabs
        document.querySelectorAll('.request-config .tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.request-config .tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.request-config .tab-content').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                document.getElementById(`req-${tab.dataset.tab}`)?.classList.add('active');
            });
        });

        // Response tabs
        document.querySelectorAll('.response-area .tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.response-area .tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.response-area .tab-content').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                document.getElementById(`resp-${tab.dataset.tab}`)?.classList.add('active');
            });
        });

        // Sidebar tabs
        document.querySelectorAll('.sidebar-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.sidebar-tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.sidebar-panel').forEach(p => p.style.display = 'none');
                tab.classList.add('active');
                document.getElementById(`sidebar-${tab.dataset.panel}`).style.display = 'flex';
            });
        });

        // Body type
        $('body-type')?.addEventListener('change', (e) => {
            this.state.bodyType = e.target.value;
            this.updateBodyEditorHint();
            this.updateCodeEditorMode();
            this.saveState();
        });

        // Body content - sync to code editor highlight on input
        $('body-content')?.addEventListener('input', (e) => {
            this.state.bodyContent = e.target.value;
            this.syncCodeEditor();
        });
        $('body-content')?.addEventListener('blur', () => this.saveState());

        // Body format button
        $('body-format-btn')?.addEventListener('click', () => this.formatBody());

        // Auth type
        $('auth-type')?.addEventListener('change', (e) => {
            this.state.auth.type = e.target.value;
            this.renderAuthFields();
            this.saveState();
        });

        // Sidebar toggle (mobile)
        $('sidebar-toggle')?.addEventListener('click', () => {
            document.querySelector('.sidebar')?.classList.toggle('sidebar-open');
        });
        $('sidebar-close')?.addEventListener('click', () => {
            document.querySelector('.sidebar')?.classList.remove('sidebar-open');
        });
    },

    // Event delegation for dynamically rendered elements (KV editors, etc.)
    bindDelegatedEvents() {
        document.addEventListener('click', (e) => {
            const addBtn = e.target.closest('.kv-add');
            if (addBtn) { this.kvAdd(addBtn.dataset.container); return; }

            const rmBtn = e.target.closest('.kv-remove');
            if (rmBtn) { this.kvRemove(rmBtn.dataset.container, parseInt(rmBtn.dataset.idx)); return; }
        });

        document.addEventListener('change', (e) => {
            if (e.target.dataset.action === 'toggle') {
                this.kvToggle(e.target.dataset.container, parseInt(e.target.dataset.idx), e.target.checked);
            }
            if (e.target.dataset.action === 'update') {
                this.kvUpdate(e.target.dataset.container, parseInt(e.target.dataset.idx), e.target.dataset.field, e.target.value);
            }
        });
    },

    // --- cURL import ---
    applyCurlParsed(parsed) {
        this.state.method = parsed.method;
        this.state.url = parsed.url;
        this.state.headers = parsed.headers.length ? parsed.headers : [{ key: '', value: '', enabled: true }];
        this.state.bodyType = parsed.body_type || 'none';
        this.state.bodyContent = parsed.body_content || '';
        if (parsed.auth) this.state.auth = parsed.auth;
        this.syncFormToState();
        this.saveState();
    },

    // --- Body formatting ---
    formatBody() {
        if (this.state.bodyType === 'json' && this.state.bodyContent) {
            const formatted = prettifyJson(this.state.bodyContent);
            if (formatted !== this.state.bodyContent) {
                this.state.bodyContent = formatted;
                const el = document.getElementById('body-content');
                if (el) el.value = formatted;
                this.syncCodeEditor();
                this.saveState();
            } else if (!isValidJson(this.state.bodyContent)) {
                UI.toast('Invalid JSON - cannot format', 'error');
            }
        }
    },

    updateBodyEditorHint() {
        const el = document.getElementById('body-content');
        if (!el) return;
        const hints = { none: '', json: '{"key": "value"}', form: '{"field": "value"}', raw: 'Raw request body...' };
        el.placeholder = hints[this.state.bodyType] || '';
    },

    // --- Send Request ---
    async sendRequest() {
        const url = (this.state.url || '').trim();
        if (this.state.sending || !url) {
            if (!url) UI.toast('Enter a URL first', 'error');
            return;
        }

        // Validate JSON body before sending
        if (this.state.bodyType === 'json' && this.state.bodyContent) {
            if (!isValidJson(this.state.bodyContent)) {
                UI.toast('Invalid JSON body', 'error');
                return;
            }
        }

        this.state.sending = true;
        const btn = document.getElementById('send-btn');
        if (btn) { btn.innerHTML = '<span class="spinner"></span> Sending'; btn.disabled = true; }
        this.saveState();

        try {
            const payload = {
                method: this.state.method,
                url: this.state.url,
                headers: this.state.headers.filter(h => h.key),
                query_params: this.state.queryParams.filter(p => p.key),
                body_type: this.state.bodyType,
                body_content: this.state.bodyContent || null,
                auth: this.buildAuthPayload(),
            };

            const resp = await API.sendRequest(payload);
            UI.renderResponse(resp);
            // Don't await history reload to keep UI snappy
            this.loadHistory();
        } catch (err) {
            UI.renderResponse({ error: err.message });
        } finally {
            this.state.sending = false;
            if (btn) { btn.innerHTML = 'Send'; btn.disabled = false; }
        }
    },

    buildAuthPayload() {
        const auth = this.state.auth;
        const payload = { type: auth.type || 'none' };
        if (auth.type === 'bearer') {
            payload.bearer_token = document.getElementById('auth-bearer-token')?.value || auth.bearer_token || '';
        } else if (auth.type === 'basic') {
            payload.basic_username = document.getElementById('auth-basic-user')?.value || auth.basic_username || '';
            payload.basic_password = document.getElementById('auth-basic-pass')?.value || auth.basic_password || '';
        } else if (auth.type === 'api_key') {
            payload.api_key_key = document.getElementById('auth-apikey-key')?.value || auth.api_key_key || '';
            payload.api_key_value = document.getElementById('auth-apikey-value')?.value || auth.api_key_value || '';
            payload.api_key_in = document.getElementById('auth-apikey-in')?.value || auth.api_key_in || 'header';
        }
        return payload;
    },

    renderAuthFields() {
        const el = document.getElementById('auth-fields');
        if (!el) return;
        const type = this.state.auth.type;
        if (type === 'none') {
            el.innerHTML = '<p style="color:var(--text-muted);font-size:12px">No authentication</p>';
        } else if (type === 'bearer') {
            el.innerHTML = `<div class="auth-field"><label>Token</label><input type="text" id="auth-bearer-token" placeholder="Enter token" value="${escapeHtml(this.state.auth.bearer_token || '')}"></div>`;
        } else if (type === 'basic') {
            el.innerHTML = `
                <div class="auth-field"><label>Username</label><input type="text" id="auth-basic-user" placeholder="Username" value="${escapeHtml(this.state.auth.basic_username || '')}"></div>
                <div class="auth-field"><label>Password</label><input type="password" id="auth-basic-pass" placeholder="Password" value="${escapeHtml(this.state.auth.basic_password || '')}"></div>`;
        } else if (type === 'api_key') {
            el.innerHTML = `
                <div class="auth-field"><label>Key</label><input type="text" id="auth-apikey-key" placeholder="X-API-Key" value="${escapeHtml(this.state.auth.api_key_key || '')}"></div>
                <div class="auth-field"><label>Value</label><input type="text" id="auth-apikey-value" placeholder="api key value" value="${escapeHtml(this.state.auth.api_key_value || '')}"></div>
                <div class="auth-field"><label>Add to</label>
                    <select id="auth-apikey-in">
                        <option value="header" ${(this.state.auth.api_key_in || 'header') === 'header' ? 'selected' : ''}>Header</option>
                        <option value="query" ${this.state.auth.api_key_in === 'query' ? 'selected' : ''}>Query Param</option>
                    </select>
                </div>`;
        }
    },

    // --- Key-Value Editors ---
    renderKVEditors() {
        UI.renderKVEditor('params-editor', this.state.queryParams);
        UI.renderKVEditor('headers-editor', this.state.headers);
        this.renderAuthFields();
    },

    _getKVArray(containerId) {
        return containerId === 'headers-editor' ? this.state.headers : this.state.queryParams;
    },

    kvAdd(containerId) {
        const arr = this._getKVArray(containerId);
        arr.push({ key: '', value: '', enabled: true });
        UI.renderKVEditor(containerId, arr);
    },

    kvRemove(containerId, idx) {
        const arr = this._getKVArray(containerId);
        if (idx >= 0 && idx < arr.length) arr.splice(idx, 1);
        if (arr.length === 0) arr.push({ key: '', value: '', enabled: true });
        UI.renderKVEditor(containerId, arr);
    },

    kvToggle(containerId, idx, checked) {
        const arr = this._getKVArray(containerId);
        if (arr[idx]) arr[idx].enabled = checked;
    },

    kvUpdate(containerId, idx, field, value) {
        const arr = this._getKVArray(containerId);
        if (arr[idx]) arr[idx][field] = value;
    },

    // --- Collections ---
    async loadCollections() {
        try {
            this.state.collections = await API.getCollections();
            UI.renderCollections(this.state.collections, this.state.expandedCollections);
            // Render requests for already-expanded collections
            for (const eid of this.state.expandedCollections) {
                try {
                    const coll = await API.getCollection(eid);
                    UI.renderCollectionRequests(eid, coll.requests || []);
                } catch {}
            }
        } catch (err) {
            console.error('Failed to load collections:', err);
        }
    },

    async toggleCollection(id) {
        if (this.state.expandedCollections.has(id)) {
            this.state.expandedCollections.delete(id);
        } else {
            this.state.expandedCollections.add(id);
        }
        this.saveState();
        UI.renderCollections(this.state.collections, this.state.expandedCollections);

        // Load requests for all expanded collections
        const promises = [...this.state.expandedCollections].map(async eid => {
            try {
                const coll = await API.getCollection(eid);
                UI.renderCollectionRequests(eid, coll.requests || []);
            } catch {}
        });
        await Promise.all(promises);
    },

    showNewCollectionModal() {
        UI.showNewCollectionModal();
    },

    showNewSubCollectionModal(parentId) {
        UI.showNewCollectionModal(parentId);
    },

    async confirmNewCollection() {
        const name = document.getElementById('new-coll-name')?.value?.trim();
        const desc = document.getElementById('new-coll-desc')?.value?.trim();
        const parentId = document.getElementById('new-coll-parent')?.value || null;
        if (!name) return UI.toast('Name is required', 'error');
        try {
            const data = { name, description: desc || null };
            if (parentId) data.parent_id = parseInt(parentId);
            await API.createCollection(data);
            UI.closeModal();
            await this.loadCollections();
            UI.toast('Collection created');
        } catch (err) {
            UI.toast(err.message, 'error');
        }
    },

    async deleteCollection(id) {
        if (!confirm('Delete this collection and all its contents?')) return;
        try {
            await API.deleteCollection(id);
            this.state.expandedCollections.delete(id);
            this.saveState();
            await this.loadCollections();
            UI.toast('Collection deleted');
        } catch (err) {
            UI.toast(err.message, 'error');
        }
    },

    showSaveRequestModal() {
        if (!(this.state.url || '').trim()) return UI.toast('Enter a URL first', 'error');
        if (!this.state.collections.length) return UI.toast('Create a collection first', 'error');
        UI.showSaveRequestModal(this.state.collections);
    },

    async confirmSaveRequest() {
        const name = document.getElementById('save-req-name')?.value?.trim();
        const collId = document.getElementById('save-req-collection')?.value;
        if (!name) return UI.toast('Name is required', 'error');
        try {
            await API.createSavedRequest(collId, {
                name,
                method: this.state.method,
                url: this.state.url,
                headers: this.state.headers.filter(h => h.key),
                query_params: this.state.queryParams.filter(p => p.key),
                body_type: this.state.bodyType,
                body_content: this.state.bodyContent || null,
                auth_type: this.state.auth.type,
                auth_data: this.buildAuthPayload(),
            });
            UI.closeModal();
            await this.loadCollections();
            UI.toast('Request saved');
        } catch (err) {
            UI.toast(err.message, 'error');
        }
    },

    async loadSavedRequest(collId, reqId) {
        try {
            const coll = await API.getCollection(collId);
            const req = (coll.requests || []).find(r => r.id === reqId);
            if (!req) return;

            this.state.method = req.method || 'GET';
            this.state.url = req.url || '';
            this.state.headers = (req.headers?.length)
                ? req.headers.map(h => ({ key: h.key || '', value: h.value || '', enabled: h.enabled !== false }))
                : [{ key: '', value: '', enabled: true }];
            this.state.queryParams = (req.query_params?.length)
                ? req.query_params.map(p => ({ key: p.key || '', value: p.value || '', enabled: p.enabled !== false }))
                : [{ key: '', value: '', enabled: true }];
            this.state.bodyType = req.body_type || 'none';
            this.state.bodyContent = req.body_content || '';
            this.state.auth = req.auth_data || { type: req.auth_type || 'none' };

            this.syncFormToState();
            this.saveState();
            // Close sidebar on mobile
            document.querySelector('.sidebar')?.classList.remove('sidebar-open');
        } catch (err) {
            UI.toast(err.message, 'error');
        }
    },

    async deleteSavedRequest(collId, reqId) {
        if (!confirm('Delete this saved request?')) return;
        try {
            await API.deleteSavedRequest(collId, reqId);
            await this.loadCollections();
            UI.toast('Request deleted');
        } catch (err) {
            UI.toast(err.message, 'error');
        }
    },

    // --- History ---
    async loadHistory() {
        try {
            this.state.history = await API.getHistory();
            UI.renderHistory(this.state.history);
        } catch (err) {
            console.error('Failed to load history:', err);
        }
    },

    async loadHistoryEntry(id) {
        try {
            const entry = await API.getHistoryEntry(id);
            this.state.method = entry.method || 'GET';
            this.state.url = entry.url || '';
            this.state.headers = (entry.request_headers?.length)
                ? entry.request_headers.map(h => ({ key: h.key || '', value: h.value || '', enabled: h.enabled !== false }))
                : [{ key: '', value: '', enabled: true }];
            this.state.queryParams = [{ key: '', value: '', enabled: true }];
            this.state.bodyType = 'none';
            this.state.bodyContent = entry.request_body || '';

            this.syncFormToState();
            this.saveState();
            // Close sidebar on mobile
            document.querySelector('.sidebar')?.classList.remove('sidebar-open');

            // Show the response
            if (entry.status_code || entry.error) {
                UI.renderResponse({
                    status_code: entry.status_code,
                    status_text: '',
                    response_headers: entry.response_headers || {},
                    body: entry.response_body,
                    is_json: (entry.response_headers?.['content-type'] || '').includes('json'),
                    time_ms: entry.response_time_ms,
                    size_bytes: entry.response_size_bytes,
                    error: entry.error,
                });
            }
        } catch (err) {
            UI.toast(err.message, 'error');
        }
    },

    async clearHistory() {
        if (!confirm('Clear all history?')) return;
        try {
            await API.clearHistory();
            await this.loadHistory();
            UI.toast('History cleared');
        } catch (err) {
            UI.toast(err.message, 'error');
        }
    },

    // --- Environments ---
    async loadEnvironments() {
        try {
            this.state.environments = await API.getEnvironments();
            this.renderEnvSelector();
        } catch (err) {
            console.error('Failed to load environments:', err);
        }
    },

    renderEnvSelector() {
        const el = document.getElementById('env-select');
        if (!el) return;
        el.innerHTML = `<option value="">No Environment</option>` +
            this.state.environments.map(e =>
                `<option value="${e.id}" ${e.is_active ? 'selected' : ''}>${escapeHtml(e.name)}</option>`
            ).join('');
    },

    async activateEnvFromSelector() {
        const id = document.getElementById('env-select')?.value;
        if (!id) return;
        try {
            await API.activateEnvironment(id);
            await this.loadEnvironments();
            UI.toast('Environment activated');
        } catch (err) {
            UI.toast(err.message, 'error');
        }
    },

    showEnvironmentModal() {
        const active = this.state.environments.find(e => e.is_active);
        UI.showEnvironmentModal(this.state.environments, active?.id);
        if (active) {
            this.envModalVars = (active.variables || []).map(v => ({ key: v.key, value: v.value, is_secret: v.is_secret }));
        } else {
            this.envModalVars = [];
        }
        UI.renderEnvVars(this.envModalVars);
    },

    async envModalSelect(id) {
        if (!id) {
            this.envModalVars = [];
            UI.renderEnvVars([]);
            return;
        }
        try {
            const env = await API.getEnvironment(id);
            this.envModalVars = (env.variables || []).map(v => ({ key: v.key, value: v.value, is_secret: v.is_secret }));
            UI.renderEnvVars(this.envModalVars);
        } catch (err) {
            UI.toast(err.message, 'error');
        }
    },

    async envModalActivate() {
        const id = document.getElementById('env-modal-select')?.value;
        if (!id) return UI.toast('Select an environment first', 'error');
        try {
            await API.activateEnvironment(id);
            await this.loadEnvironments();
            UI.toast('Environment activated');
        } catch (err) {
            UI.toast(err.message, 'error');
        }
    },

    async envModalNew() {
        const name = prompt('Environment name:');
        if (!name?.trim()) return;
        try {
            const env = await API.createEnvironment({ name: name.trim() });
            await this.loadEnvironments();
            const select = document.getElementById('env-modal-select');
            if (select) {
                const opt = document.createElement('option');
                opt.value = env.id;
                opt.textContent = env.name;
                select.appendChild(opt);
                select.value = env.id;
            }
            this.envModalVars = [];
            UI.renderEnvVars([]);
            UI.toast('Environment created');
        } catch (err) {
            UI.toast(err.message, 'error');
        }
    },

    async envModalDelete() {
        const id = document.getElementById('env-modal-select')?.value;
        if (!id) return;
        if (!confirm('Delete this environment?')) return;
        try {
            await API.deleteEnvironment(id);
            await this.loadEnvironments();
            UI.closeModal();
            this.showEnvironmentModal();
            UI.toast('Environment deleted');
        } catch (err) {
            UI.toast(err.message, 'error');
        }
    },

    envAddVar() {
        this.envModalVars.push({ key: '', value: '', is_secret: false });
        UI.renderEnvVars(this.envModalVars);
    },

    envRemoveVar(idx) {
        this.envModalVars.splice(idx, 1);
        UI.renderEnvVars(this.envModalVars);
    },

    async envModalSave() {
        const id = document.getElementById('env-modal-select')?.value;
        if (!id) return UI.toast('Select an environment first', 'error');

        // Read values from DOM
        const rows = document.querySelectorAll('#env-modal-vars .env-var-table tbody tr');
        const variables = [];
        rows.forEach(row => {
            const inputs = row.querySelectorAll('input');
            if (inputs.length >= 3) {
                variables.push({
                    key: inputs[0]?.value || '',
                    value: inputs[1]?.value || '',
                    is_secret: inputs[2]?.checked || false,
                });
            }
        });

        try {
            await API.setVariables(id, variables.filter(v => v.key));
            this.envModalVars = variables.filter(v => v.key);
            await this.loadEnvironments();
            UI.toast('Variables saved');
        } catch (err) {
            UI.toast(err.message, 'error');
        }
    },

    // --- Import/Export ---
    async exportCollection(id) {
        try {
            const resp = await API.exportCollection(id);
            const blob = await resp.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'collection.json';
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            UI.toast(err.message, 'error');
        }
    },

    async exportAllCollections() {
        try {
            const resp = await API.exportAllCollections();
            const blob = await resp.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'freecall_export.json';
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            UI.toast(err.message, 'error');
        }
    },

    showImportModal() {
        UI.showImportModal();
    },

    async confirmImport() {
        const fileInput = document.getElementById('import-file');
        const file = fileInput?.files?.[0];
        if (!file) return UI.toast('Select a file', 'error');
        try {
            const result = await API.importCollections(file);
            UI.closeModal();
            await this.loadCollections();
            UI.toast(`Imported ${result.count} collection(s)`);
        } catch (err) {
            UI.toast(err.message, 'error');
        }
    },
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => App.init());
