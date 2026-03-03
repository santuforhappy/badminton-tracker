const BASE = '/api';

async function request(url, options = {}) {
    const res = await fetch(`${BASE}${url}`, {
        headers: { 'Content-Type': 'application/json', ...options.headers },
        ...options,
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(err.error || 'Request failed');
    }
    return res.json();
}

// Players
export const getPlayers = () => request('/players');
export const getPlayer = (id) => request(`/players/${id}`);
export const createPlayer = (data) => request('/players', { method: 'POST', body: JSON.stringify(data) });
export const updatePlayer = (id, data) => request(`/players/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deletePlayer = (id) => request(`/players/${id}`, { method: 'DELETE' });

// Credits
export const getCreditHistory = (playerId) => request(`/credits/${playerId}`);
export const getAllCreditHistory = () => request('/credits');
export const addCredit = (playerId, data) => request(`/credits/${playerId}`, { method: 'POST', body: JSON.stringify(data) });
export const editCreditEntry = (entryId, data) => request(`/credits/entry/${entryId}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteCreditEntry = (entryId) => request(`/credits/entry/${entryId}`, { method: 'DELETE' });

// Sessions
export const getSessions = () => request('/sessions');
export const getSession = (id) => request(`/sessions/${id}`);
export const createSession = (data) => request('/sessions', { method: 'POST', body: JSON.stringify(data) });
export const updateSession = (id, data) => request(`/sessions/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteSession = (id) => request(`/sessions/${id}`, { method: 'DELETE' });

// Reports
export const getReport = (period) => request(`/reports?period=${period || ''}`);

// Barrels
export const getBarrels = () => request('/barrels');
export const createBarrel = (data) => request('/barrels', { method: 'POST', body: JSON.stringify(data) });
export const updateBarrel = (id, data) => request(`/barrels/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteBarrel = (id) => request(`/barrels/${id}`, { method: 'DELETE' });
export const getShuttleSummary = (from, to) => {
    let url = '/barrels/shuttle-summary';
    const params = [];
    if (from) params.push(`from=${from}`);
    if (to) params.push(`to=${to}`);
    if (params.length) url += `?${params.join('&')}`;
    return request(url);
};

// Sheets
export const syncToSheets = (spreadsheetId) => request('/sheets/sync', { method: 'POST', body: JSON.stringify({ spreadsheetId }) });
