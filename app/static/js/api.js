// API wrapper for backend API calls
const API = {
    async _fetch(url, options = {}) {
        const headers = { 'Content-Type': 'application/json', ...options.headers };
        const resp = await fetch(url, { headers, ...options });
        if (options.rawResponse) return resp;
        if (resp.status === 204) return null;
        if (!resp.ok) {
            let detail;
            try {
                const err = await resp.json();
                detail = err.detail || JSON.stringify(err);
            } catch {
                detail = `HTTP ${resp.status}: ${resp.statusText}`;
            }
            throw new Error(detail);
        }
        return resp.json();
    },

    // Proxy
    sendRequest(payload) {
        return this._fetch('/api/send', { method: 'POST', body: JSON.stringify(payload) });
    },

    // Collections
    getCollections() { return this._fetch('/api/collections'); },
    createCollection(data) {
        return this._fetch('/api/collections', { method: 'POST', body: JSON.stringify(data) });
    },
    getCollection(id) { return this._fetch(`/api/collections/${id}`); },
    updateCollection(id, data) {
        return this._fetch(`/api/collections/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    },
    deleteCollection(id) {
        return this._fetch(`/api/collections/${id}`, { method: 'DELETE' });
    },

    // Saved requests
    createSavedRequest(collId, data) {
        return this._fetch(`/api/collections/${collId}/requests`, { method: 'POST', body: JSON.stringify(data) });
    },
    updateSavedRequest(collId, reqId, data) {
        return this._fetch(`/api/collections/${collId}/requests/${reqId}`, { method: 'PUT', body: JSON.stringify(data) });
    },
    deleteSavedRequest(collId, reqId) {
        return this._fetch(`/api/collections/${collId}/requests/${reqId}`, { method: 'DELETE' });
    },

    // History
    getHistory(limit = 50) { return this._fetch(`/api/history?limit=${limit}`); },
    getHistoryEntry(id) { return this._fetch(`/api/history/${id}`); },
    clearHistory() { return this._fetch('/api/history', { method: 'DELETE' }); },

    // Environments
    getEnvironments() { return this._fetch('/api/environments'); },
    createEnvironment(data) {
        return this._fetch('/api/environments', { method: 'POST', body: JSON.stringify(data) });
    },
    getEnvironment(id) { return this._fetch(`/api/environments/${id}`); },
    updateEnvironment(id, data) {
        return this._fetch(`/api/environments/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    },
    deleteEnvironment(id) {
        return this._fetch(`/api/environments/${id}`, { method: 'DELETE' });
    },
    activateEnvironment(id) {
        return this._fetch(`/api/environments/${id}/activate`, { method: 'POST' });
    },
    setVariables(envId, variables) {
        return this._fetch(`/api/environments/${envId}/variables`, { method: 'PUT', body: JSON.stringify({ variables }) });
    },

    // Import/Export
    exportCollection(id) { return this._fetch(`/api/export/collections/${id}`, { rawResponse: true }); },
    exportAllCollections() { return this._fetch('/api/export/collections', { rawResponse: true }); },
    async importCollections(file) {
        const formData = new FormData();
        formData.append('file', file);
        const resp = await fetch('/api/import/collections', { method: 'POST', body: formData });
        if (!resp.ok) {
            let detail;
            try { const err = await resp.json(); detail = err.detail; } catch { detail = 'Import failed'; }
            throw new Error(detail);
        }
        return resp.json();
    },
};
