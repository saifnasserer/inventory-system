import { AccessControlProvider } from "@refinedev/core";
import { authProvider } from "./authProvider";

// Define the resource roles mapping
const resourceRoles: Record<string, string[]> = {
    "dashboard": ["admin", "warehouse_manager"],
    "shipments": ["admin", "warehouse_manager"],
    "devices": ["admin", "warehouse_manager", "branch_manager"],
    "maintenance-dashboard": ["repair_manager"],
    "maintenance": ["admin", "warehouse_manager", "repair_manager"],
    "sales": ["branch_manager"],
    "sales-portal": ["admin", "warehouse_manager", "branch_manager", "sales_staff"],
    "my-dashboard": ["warehouse_staff", "technician", "sales_staff"],
    "my-tasks": ["warehouse_staff", "technician"],
    "companies": ["super_admin"],
};

export const accessControlProvider: AccessControlProvider = {
    can: async ({ resource, action }) => {
        const permissions = await authProvider.getPermissions?.();
        const role = (permissions as any)?.role;

        // Silenced verbose logging for cleaner console
        // console.log(`🔐 Access Control Check: resource="${resource}", action="${action}", role="${role}"`);

        // If no role, deny access
        if (!role) {
            // console.log('❌ No role assigned');
            return { can: false, reason: "No role assigned" };
        }

        // If no resource specified, deny access
        if (!resource) {
            console.log('❌ No resource specified');
            return { can: false, reason: "No resource specified" };
        }

        // Check if resource has role restrictions
        const allowedRoles = resourceRoles[resource];

        // If no role restrictions defined, allow access (for hidden resources, etc.)
        if (!allowedRoles) {
            console.log('✅ No role restrictions for resource:', resource);
            return { can: true };
        }

        // Check if user's role is in the allowed roles
        const hasAccess = allowedRoles.includes(role);

        // Device assignments - only admins and managers can create
        if (resource === "device_assignments" && action === "create") {
            const isAdmin = ["admin", "warehouse_manager", "repair_manager", "super_admin"].includes(role);
            console.log('🔧 Device assignment check:', { isAdmin });
            return {
                can: isAdmin,
                reason: isAdmin ? undefined : "Only admins can assign devices",
            };
        }

        // const accessDecision = hasAccess ? '✅ Access granted' : '❌ Access denied';
        // console.log(`${accessDecision}: resource="${resource}", role="${role}", allowedRoles=[${allowedRoles.join(', ')}]`);

        return {
            can: hasAccess,
            reason: hasAccess ? undefined : `Access denied for role: ${role}`,
        };
    },
};
