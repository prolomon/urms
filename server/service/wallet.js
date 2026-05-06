
import { customAlphabet } from "nanoid";

const nanoid = customAlphabet('1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 16);

// In-memory token store
let currentAccessToken = null;
let currentRefreshToken = null;
let currentExpiresAt = null; // epoch ms
let refreshTimer = null;

const ensureEnv = () => {
    if (!process.env.NOMBA_CLIENT_ID || !process.env.NOMBA_PRIVATE_SECRET || !process.env.NOMBA_ACCOUNT_ID || !process.env.NOMBA_API_BASE_URL) {
        throw new Error('NOMBA configuration is not complete');
    }
};

const parseNombaResponse = (payload) => {
    // Handle different shapes: { code: '00', data: {...} } or direct { access_token }
    if (!payload) return null;
    if (payload.code && payload.data) return payload.data;
    if (payload.data && payload.data.access_token) return payload.data;
    return payload;
};

const scheduleRefresh = () => {
    if (!currentExpiresAt || !currentRefreshToken) return;
    // Refresh 60 seconds before expiry
    const ms = currentExpiresAt - Date.now() - 60_000;
    const delay = Math.max(ms, 10_000); // at least 10s
    if (refreshTimer) clearTimeout(refreshTimer);
    refreshTimer = setTimeout(async () => {
        try {
            await refreshAuthToken();
        } catch (err) {
            console.error('Scheduled token refresh failed:', err?.message || err);
        }
    }, delay);
};

export const obtainAuthToken = async () => {
    ensureEnv();
    const url = `${process.env.NOMBA_API_BASE_URL}/v1/auth/token/issue`;
    const payload = {
        grant_type: 'client_credentials',
        client_id: process.env.NOMBA_CLIENT_ID,
        client_secret: process.env.NOMBA_PRIVATE_SECRET,
    };

    const headers = { 'Content-Type': 'application/json', accountId: process.env.NOMBA_ACCOUNT_ID, 'x-account-id': process.env.NOMBA_ACCOUNT_ID };

    const response = await fetch(url, { method: 'POST', headers, body: JSON.stringify(payload) });
    const raw = await response.json();
    const data = parseNombaResponse(raw);
    if (!response.ok || !data?.access_token) {
        const errMsg = raw?.message || raw?.description || `NOMBA auth failed with status ${response.status}`;
        throw new Error(errMsg);
    }

    currentAccessToken = data.access_token;
    currentRefreshToken = data.refresh_token || data.refreshToken || currentRefreshToken;
    currentExpiresAt = data.expiresAt ? Date.parse(data.expiresAt) : Date.now() + (data.expires_in ? Number(data.expires_in) * 1000 : 15 * 60 * 1000);
    scheduleRefresh();
    return { access_token: currentAccessToken, refresh_token: currentRefreshToken, expiresAt: currentExpiresAt };
};

export const refreshAuthToken = async () => {
    ensureEnv();
    if (!currentAccessToken || !currentRefreshToken) {
        return obtainAuthToken();
    }
    const url = `${process.env.NOMBA_API_BASE_URL}/v1/auth/token/refresh`;
    const headers = { Authorization: `Bearer ${currentAccessToken}`, 'Content-Type': 'application/json', accountId: process.env.NOMBA_ACCOUNT_ID, 'x-account-id': process.env.NOMBA_ACCOUNT_ID };
    const payload = { grant_type: 'refresh_token', refresh_token: currentRefreshToken };
    const response = await fetch(url, { method: 'POST', headers, body: JSON.stringify(payload) });
    const raw = await response.json();
    const data = parseNombaResponse(raw);
    if (!response.ok || !data?.access_token) {
        // try to obtain fresh token with client credentials
        console.warn('Refresh failed, falling back to client credentials', raw);
        return obtainAuthToken();
    }

    currentAccessToken = data.access_token;
    currentRefreshToken = data.refresh_token || currentRefreshToken;
    currentExpiresAt = data.expiresAt ? Date.parse(data.expiresAt) : Date.now() + (data.expires_in ? Number(data.expires_in) * 1000 : 15 * 60 * 1000);
    scheduleRefresh();
    return { access_token: currentAccessToken, refresh_token: currentRefreshToken, expiresAt: currentExpiresAt };
};

export const getManagedAccessToken = async () => {
    // Return existing if valid, otherwise obtain or refresh
    if (currentAccessToken && currentExpiresAt && Date.now() < currentExpiresAt - 30_000) {
        return currentAccessToken;
    }
    if (currentRefreshToken) {
        const t = await refreshAuthToken();
        return t.access_token;
    }
    const t = await obtainAuthToken();
    return t.access_token;
};

export const createAccount = async (name, bvn, id) => {
    if (!process.env.NOMBA_PRIVATE_SECRET || !process.env.NOMBA_ACCOUNT_ID || !process.env.NOMBA_API_BASE_URL) {
        return {
            status: false,
            message: 'NOMBA_PRIVATE_SECRET is not configured',
            data: null,
        };
    }

    const url = `${process.env.NOMBA_API_BASE_URL}/v1/accounts/virtual`; // customer creation endpoint

    try {
        const payload = {
            // include both camelCase and snake_case keys for compatibility with differing API docs
            accountRef: id || nanoid(),
            accountName: name,
            bvn: bvn,
            expiryDate: "2026-05-06 12:15:00",
        };

        const token = await getManagedAccessToken();
        const headers = {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            accountId: process.env.NOMBA_ACCOUNT_ID,
            'x-account-id': process.env.NOMBA_ACCOUNT_ID,
        };

        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload),
        });

        const data = await response.json();

        console.log('Nomba createAccount response', { data });

        if (!response.ok || !data?.status) {
            console.log('Nomba createAccount error', { data });
            return {
                status: false,
                message: data?.message || `NOMBA request failed with status ${response.status}`,
                data: data?.data || null,
            };
        }

        return data;
    } catch (error) {
        console.log('Nomba createAccount exception', { error });
        return {
            status: false,
            message: error?.message || 'Unable to reach NOMBA',
            data: null,
        };
    }
};

export const initiateTransfer = async (amount, accountNumber, accountName, bankCode, merchantTxRef, senderName, narration = 'User wallet payout') => {
    if (!process.env.NOMBA_PRIVATE_SECRET || !process.env.NOMBA_ACCOUNT_ID || !process.env.NOMBA_API_BASE_URL) {
        return {
            status: false,
            message: 'NOMBA_PRIVATE_SECRET is not configured',
            data: null,
        };
    }

    const url = `${process.env.NOMBA_API_BASE_URL}/v2/transfers/bank`;

    try {
        const token = await getManagedAccessToken();
        const headers = {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            accountId: process.env.NOMBA_ACCOUNT_ID,
            'x-account-id': process.env.NOMBA_ACCOUNT_ID,
        };

        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                amount,
                accountNumber,
                accountName,
                bankCode,
                merchantTxRef,
                senderName,
                narration,
            }),
        });

        const data = await response.json();

        console.log('Nomba initiateTransfer response', { data });

        if (!response.ok || !data?.status) {
            return {
                status: false,
                message: data?.message || `NOMBA request failed with status ${response.status}`,
                data: data?.data || null,
            };
        }

        return data;
    } catch (error) {
        return {
            status: false,
            message: error?.message || 'Unable to reach NOMBA',
            data: null,
        };
    }
};

export const getBanks = async () => {
    if (!process.env.NOMBA_PRIVATE_SECRET || !process.env.NOMBA_ACCOUNT_ID || !process.env.NOMBA_API_BASE_URL) {
        return {
            status: false,
            message: 'NOMBA_PRIVATE_SECRET is not configured',
            data: null,
        };
    }

    const url = `${process.env.NOMBA_API_BASE_URL}/v1/transfers/banks`;

    try {
        const token = await getManagedAccessToken();
        const headers = {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            accountId: process.env.NOMBA_ACCOUNT_ID,
            'x-account-id': process.env.NOMBA_ACCOUNT_ID,
        };

        const response = await fetch(url, {
            method: 'GET',
            headers,
        });

        const data = await response.json();

        if (!response.ok || !data?.status) {
            return {
                status: false,
                message: data?.message || `NOMBA request failed with status ${response.status}`,
                data: data?.data || null,
            };
        }

        return data;
    } catch (error) {
        return {
            status: false,
            message: error?.message || 'Unable to reach NOMBA',
            data: null,
        };
    }
};

export const resolveBankAccount = async (accountNumber, bankCode) => {
    if (!process.env.NOMBA_API_BASE_URL) {
        return {
            status: false,
            message: 'NOMBA_API_BASE_URL is not configured',
            data: null,
        };
    }

    const url = `${process.env.NOMBA_API_BASE_URL}/v1/transfers/bank/lookup`;

    try {
        const token = await getManagedAccessToken();
        const headers = {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            accountId: process.env.NOMBA_ACCOUNT_ID,
            'x-account-id': process.env.NOMBA_ACCOUNT_ID,
        };

        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify({ accountNumber, bankCode }),
        });

        const data = await response.json();

        console.log('Nomba resolveBankAccount response', { data });

        if (!response.ok || !data?.status) {
            return {
                status: false,
                message: data?.message || `NOMBA request failed with status ${response.status}`,
                data: data?.data || null,
            };
        }

        return data;
    } catch (error) {
        return {
            status: false,
            message: error?.message || 'Unable to reach NOMBA',
            data: null,
        };
    }
};  

export const verifyTransfer = async (merchantTxRef) => {
    if (!process.env.NOMBA_API_BASE_URL) {
        return {
            status: false,
            message: 'NOMBA_API_BASE_URL is not configured',
            data: null,
        };
    }

    const url = `${process.env.NOMBA_API_BASE_URL}/v1/transfers/verify`;

    try {
        const token = await getManagedAccessToken();
        const headers = {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            accountId: process.env.NOMBA_ACCOUNT_ID,
            'x-account-id': process.env.NOMBA_ACCOUNT_ID,
        };
        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify({ merchantTxRef }),
        });
        const data = await response.json();

        if (!response.ok || !data?.status) {
            return {
                status: false,
                message: data?.message || `NOMBA request failed with status ${response.status}`,
                data: data?.data || null,
            };
        }

        return data;
    } catch (error) {
        return {
            status: false,
            message: error?.message || 'Unable to reach NOMBA',
            data: null,
        };
    }
};

export const getTransactions = async (accountNumber, fromDate, toDate) => {
    if (!process.env.NOMBA_API_BASE_URL) {
        return {    
            status: false,
            message: 'NOMBA_API_BASE_URL is not configured',
            data: null,
        };
    }

    const url = `${process.env.NOMBA_API_BASE_URL}/v1/transactions/virtual?virtual_account=${accountNumber}&dateFrom=${fromDate}&dateTo=${toDate}`;

    try {
        const token = await getManagedAccessToken();
        const headers = {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            accountId: process.env.NOMBA_ACCOUNT_ID,
            'x-account-id': process.env.NOMBA_ACCOUNT_ID,
        };
        const response = await fetch(url, {
            method: 'GET',
            headers,
        });
        const data = await response.json();

        if (!response.ok || !data?.status) {
            return {
                status: false,
                message: data?.message || `NOMBA request failed with status ${response.status}`,
                data: data?.data || null,
            };
        }

        return data;
    } catch (error) {
        return {
            status: false,
            message: error?.message || 'Unable to reach NOMBA',
            data: null,
        };
    }
};
