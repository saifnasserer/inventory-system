import { AccessControlProvider } from "@refinedev/core";
import { authProvider } from "./authProvider";

export const accessControlProvider: AccessControlProvider = {
    can: async ({ resource, action }) => {
        const permissions = await authProvider.getPermissions?.();
        const role = (permissions as any)?.role;

        // Super admin can access companies
        if (resource === "companies") {
            const isSuperAdmin = role === "super_admin";
            return {
                can: isSuperAdmin,
                reason: isSuperAdmin ? undefined : "Only Super Admins can manage companies",
            };
        }

        // Employee-specific resources
        if (resource === "my-dashboard" || resource === "my-tasks") {
            // All authenticated users can access their own dashboard and tasks
            return { can: true };
        }

        // Maintenance manager dashboard
        if (resource === "maintenance-dashboard") {
            // Repair managers and technicians can access maintenance dashboard
            return { can: true };
        }

        // Device assignments - only admins and managers can create
        if (resource === "device_assignments" && action === "create") {
            const isAdmin = role && ["admin", "warehouse_manager", "repair_manager", "super_admin"].includes(role);
            return {
                can: isAdmin,
                reason: isAdmin ? undefined : "Only admins can assign devices",
            };
        }

        // Default allow for other resources (RLS handles data security)
        return { can: true };
    },
};
