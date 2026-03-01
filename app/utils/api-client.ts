export const getZkLoginJwt = (): string | null => {
    if (typeof window === 'undefined') return null;
    const configStr = localStorage.getItem('zkLoginProofCache');
    if (!configStr) return null;

    try {
        const config = JSON.parse(configStr);
        return config.jwt || null;
    } catch (e) {
        console.warn('Failed to parse zkLoginProofCache for JWT', e);
        return null;
    }
};

const handleApiError = async (response: Response) => {
    let errorData;
    try {
        errorData = await response.json();
    } catch (e) {
        errorData = { detail: response.statusText };
    }

    // If 401 Unauthorized, the zkLogin JWT is likely expired or invalid
    if (response.status === 401) {
        // We could potentially try to silently refresh here in the future
        // For now, redirect to auth
        if (typeof window !== 'undefined') {
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

export const apiPost = async (url: string, body: any, isFormData: boolean = false): Promise<any> => {
    const options: RequestInit = {
        method: 'POST',
        body: isFormData ? body : JSON.stringify(body),
    };

    if (!isFormData) {
        options.headers = {
            'Content-Type': 'application/json',
        };
    }

    const response = await apiFetch(url, options);
    return response.json();
};

export const apiGet = async (url: string): Promise<any> => {
    const response = await apiFetch(url, { method: 'GET' });
    return response.json();
};
