import { usePage } from '@inertiajs/react';
import { AuthUser, hasRole, hasAnyRole, hasPermission, hasAnyPermission, isAdmin, isActiveUser, getPrimaryRole, getUserPermissions } from '@/utils/roleUtils';

interface PageProps {
    auth: {
        user: AuthUser;
    };
}

export function useAuth() {
    const { auth } = usePage<PageProps>().props;
    const user = auth?.user || null;

    return {
        user,
        isAuthenticated: !!user,
        hasRole: (roleName: string) => hasRole(user, roleName),
        hasAnyRole: (roleNames: string[]) => hasAnyRole(user, roleNames),
        hasPermission: (permission: string) => hasPermission(user, permission),
        hasAnyPermission: (permissions: string[]) => hasAnyPermission(user, permissions),
        isAdmin: () => isAdmin(user),
        isActive: () => isActiveUser(user),
        primaryRole: getPrimaryRole(user),
        permissions: getUserPermissions(user),
    };
}

export default useAuth;
