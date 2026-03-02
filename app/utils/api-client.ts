export const getZkLoginJwt = (): string | null => {
    if (typeof window === 'undefined') return null;
    const configStr = localStorage.getItem('zkLoginProofCache');
    if (!configStr) return null;

    try {
        const config = JSON.parse(configStr);
        // SessionManager stores it as jwtToken, fallback to jwt just in case
        return config.jwtToken || config.jwt || null;
    } catch {
        console.warn('Failed to parse zkLoginProofCache for JWT');
        return null;
    }
};

const handleApiError = async (response: Response) => {
    let errorData: { detail?: string; message?: string } = {};
    try {
        errorData = await response.json();
    } catch {
        errorData = { detail: response.statusText };
    }

    // If 401 Unauthorized, the zkLogin JWT is expired or invalid
    if (response.status === 401) {
        if (typeof window !== 'undefined') {
            // Clear stale session data so the auth page triggers a fresh login
            // instead of reading the expired JWT and looping back to 401
            localStorage.removeItem('zkLoginProofCache');
            localStorage.removeItem('zkLoginSession');
            window.location.href = '/auth';
        }
        throw new Error('Authentication expired. Please log in again.');
    }

    throw new Error(errorData.detail || errorData.message || 'API Request Failed');
};

export const apiFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
    const jwt = getZkLoginJwt();

    const headers = new Headers(options.headers || {});
    if (jwt) {
        headers.set('Authorization', `Bearer ${jwt}`);
    }

    const response = await fetch(url, {
        ...options,
        headers,
    });

    if (!response.ok) {
        await handleApiError(response);
    }

    return response;
};

export const apiPost = async <T = unknown>(url: string, body: unknown, isFormData: boolean = false): Promise<T> => {
    const options: RequestInit = {
        method: 'POST',
        body: isFormData ? (body as FormData) : JSON.stringify(body),
    };

    if (!isFormData) {
        options.headers = {
            'Content-Type': 'application/json',
        };
    }

    const response = await apiFetch(url, options);
    return response.json();
};

export const apiGet = async <T = unknown>(url: string): Promise<T> => {
    const response = await apiFetch(url, { method: 'GET' });
    return response.json();
};
