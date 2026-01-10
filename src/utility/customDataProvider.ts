import { DataProvider } from "@refinedev/core";
import { dataProvider as supabaseDataProvider } from "@refinedev/supabase";
import { supabaseClient } from "./supabaseClient";

const baseDataProvider = supabaseDataProvider(supabaseClient);

// Helper to get impersonated ID from storage (since we can't easily access Context inside a plain function without hooks)
// Alternatively, we could create a custom hook usage, but Refine expects a static DataProvider object usually.
const getImpersonationId = () => localStorage.getItem("impersonated_company_id");

export const customDataProvider: DataProvider = {
    ...baseDataProvider,
    getList: async ({ resource, filters, ...params }) => {
        const companyId = getImpersonationId();

        // Don't filter the companies list itself, and don't filter if no company selected
        if (resource !== "companies" && companyId) {
            const currentFilters = filters || [];
            // Add company_id filter
            // Note: We use 'override' behavior or just push it. Refine usually ANDs them.
            return baseDataProvider.getList({
                resource,
                filters: [
                    ...currentFilters,
                    {
                        field: "company_id",
                        operator: "eq",
                        value: companyId,
                    },
                ],
                ...params,
            });
        }

        return baseDataProvider.getList({ resource, filters, ...params });
    },

    // Implement custom method for calling PostgreSQL functions
    custom: async ({ url, method: _method, payload }) => {
        try {
            // Extract function name from URL
            // Handle both full URLs and simple paths
            let functionName: string;
            if (url.includes('/rpc/')) {
                const parts = url.split('/rpc/');
                functionName = parts[parts.length - 1];
            } else {
                functionName = url;
            }

            // Call the PostgreSQL function using Supabase RPC
            const { data, error } = await supabaseClient.rpc(functionName, payload || {});

            if (error) {
                throw error;
            }

            return {
                data,
            };
        } catch (error) {
            console.error("Custom RPC error:", error);
            throw error;
        }
    },

    // We should ideally wrap getOne, create, update etc. too to enforce context, 
    // but creation is handled by Triggers now (users company). 
    // For Super Admin "Creating on behalf of company", we might need more logic or just let them select it if the form allows.
    // For now, Reading (getList) is the primary requirement for "seeing data".
};
