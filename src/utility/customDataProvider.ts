import { DataProvider } from "@refinedev/core";
import { stringify } from "query-string";

const API_URL = import.meta.env.VITE_API_URL || '';

// Helper to get stored token
const getToken = (): string | null => {
    return localStorage.getItem('auth_token');
};

// Helper to make authenticated requests
const fetchWithAuth = async (url: string, options: RequestInit = {}): Promise<Response> => {
    const token = getToken();
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
    };

    return fetch(url, {
        ...options,
        headers,
    });
};

// Helper to get impersonated company ID
const getImpersonationId = () => localStorage.getItem("impersonated_company_id");

export const customDataProvider: DataProvider = {
    getList: async ({ resource, pagination, filters, sorters, meta }) => {
        const { current = 1, pageSize = 10 } = pagination ?? {};

        const queryFilters: Record<string, any> = {};

        // Handle filters
        const handleFilter = (filter: any) => {
            if (filter.operator === "or" || filter.operator === "and") {
                filter.value.forEach(handleFilter);
                return;
            }

            if (filter.operator === "eq" || filter.operator === "in") {
                queryFilters[filter.field] = filter.value;
            } else if (filter.operator === "contains") {
                queryFilters.search = filter.value;
            }
        };

        if (filters) {
            filters.forEach(handleFilter);
        }

        // Handle sorting
        let sort = 'created_at';
        let order = 'desc';
        if (sorters && sorters.length > 0) {
            sort = sorters[0].field;
            order = sorters[0].order;
        }

        // Add company impersonation filter if applicable
        const companyId = getImpersonationId();
        if (resource !== "companies" && companyId) {
            queryFilters.company_id = companyId;
        }

        const query = {
            page: current,
            limit: pageSize,
            sort,
            order,
            ...(meta ? { meta: JSON.stringify(meta) } : {}),
            ...queryFilters,
        };

        const url = `${API_URL}/api/${resource}?${stringify(query)}`;

        try {
            const response = await fetchWithAuth(url);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            return {
                data: data.data || [],
                total: data.pagination?.total || 0,
            };
        } catch (error) {
            console.error(`Error fetching ${resource}:`, error);
            throw error;
        }
    },

    getOne: async ({ resource, id, meta }) => {
        const query = meta ? { meta: JSON.stringify(meta) } : {};
        const url = `${API_URL}/api/${resource}/${id}${meta ? `?${stringify(query)}` : ''}`;

        try {
            const response = await fetchWithAuth(url);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            return {
                data: result.data,
            };
        } catch (error) {
            console.error(`Error fetching ${resource} ${id}:`, error);
            throw error;
        }
    },

    create: async ({ resource, variables }) => {
        const url = `${API_URL}/api/${resource}`;

        try {
            const response = await fetchWithAuth(url, {
                method: 'POST',
                body: JSON.stringify(variables),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            return {
                data: result.data,
            };
        } catch (error) {
            console.error(`Error creating ${resource}:`, error);
            throw error;
        }
    },

    update: async ({ resource, id, variables }) => {
        const url = `${API_URL}/api/${resource}/${id}`;

        try {
            const response = await fetchWithAuth(url, {
                method: 'PUT',
                body: JSON.stringify(variables),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            return {
                data: result.data,
            };
        } catch (error) {
            console.error(`Error updating ${resource} ${id}:`, error);
            throw error;
        }
    },

    createMany: async ({ resource, variables }) => {
        try {
            const data = await Promise.all(
                variables.map(async (variable) => {
                    const url = `${API_URL}/api/${resource}`;
                    const response = await fetchWithAuth(url, {
                        method: 'POST',
                        body: JSON.stringify(variable),
                    });

                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
                    }

                    const result = await response.json();
                    return result.data;
                })
            );

            return {
                data,
            };
        } catch (error) {
            console.error(`Error creating multiple ${resource}:`, error);
            throw error;
        }
    },

    deleteOne: async ({ resource, id }) => {
        const url = `${API_URL}/api/${resource}/${id}`;

        try {
            const response = await fetchWithAuth(url, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            return {
                data: { id } as any,
            };
        } catch (error) {
            console.error(`Error deleting ${resource} ${id}:`, error);
            throw error;
        }
    },

    getMany: async ({ resource, ids }) => {
        try {
            const data = await Promise.all(
                ids.map(async (id) => {
                    const url = `${API_URL}/api/${resource}/${id}`;
                    const response = await fetchWithAuth(url);

                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }

                    const result = await response.json();
                    return result.data;
                })
            );

            return {
                data,
            };
        } catch (error) {
            console.error(`Error fetching multiple ${resource}:`, error);
            throw error;
        }
    },

    updateMany: async ({ resource, ids, variables }) => {
        try {
            const data = await Promise.all(
                ids.map(async (id) => {
                    const url = `${API_URL}/api/${resource}/${id}`;
                    const response = await fetchWithAuth(url, {
                        method: 'PUT',
                        body: JSON.stringify(variables),
                    });

                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }

                    const result = await response.json();
                    return result.data;
                })
            );

            return {
                data,
            };
        } catch (error) {
            console.error(`Error updating multiple ${resource}:`, error);
            throw error;
        }
    },

    deleteMany: async ({ resource, ids }) => {
        try {
            await Promise.all(
                ids.map(async (id) => {
                    const url = `${API_URL}/api/${resource}/${id}`;
                    const response = await fetchWithAuth(url, {
                        method: 'DELETE',
                    });

                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                })
            );

            return {
                data: ids.map(id => ({ id })) as any,
            };
        } catch (error) {
            console.error(`Error deleting multiple ${resource}:`, error);
            throw error;
        }
    },

    getApiUrl: () => API_URL,
    custom: async ({ url, method, payload, query, headers }) => {
        let requestUrl = `${API_URL}/api/${url}`;

        if (query) {
            requestUrl = `${requestUrl}?${stringify(query)}`;
        }

        try {
            const response = await fetchWithAuth(requestUrl, {
                method: method.toUpperCase(),
                body: payload ? JSON.stringify(payload) : undefined,
                headers,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            return {
                data: result.data,
            };
        } catch (error) {
            console.error(`Error in custom request to ${url}:`, error);
            throw error;
        }
    },
};
