import { User, Role } from '@/types/management';

export interface AuthUser {
    id: number;
    name: string;
    username: string;
    email: string;
    roles: Role[];
    is_active: boolean;
}

/**
 * Check if user has a specific role
 */
export function hasRole(user: AuthUser | null, roleName: string): boolean {
    if (!user || !user.roles) {
        return false;
    }
    
    return user.roles.some(role => 
        role.name.toLowerCase() === roleName.toLowerCase() && role.is_active
    );
}

/**
 * Check if user has any of the specified roles
 */
export function hasAnyRole(user: AuthUser | null, roleNames: string[]): boolean {
    if (!user || !user.roles || !Array.isArray(roleNames)) {
        return false;
    }
    
    return roleNames.some(roleName => hasRole(user, roleName));
}

/**
 * Check if user has a specific permission
 */
export function hasPermission(user: AuthUser | null, permission: string): boolean {
    if (!user || !user.roles) {
        return false;
    }
    
    return user.roles.some(role => {
        if (!role.is_active || !role.permissions) {
            return false;
        }
        return role.permissions.includes(permission);
    });
}

/**
 * Check if user has any of the specified permissions
 */
export function hasAnyPermission(user: AuthUser | null, permissions: string[]): boolean {
    if (!user || !user.roles || !Array.isArray(permissions)) {
        return false;
    }
    
    return permissions.some(permission => hasPermission(user, permission));
}

/**
 * Check if user is admin
 */
export function isAdmin(user: AuthUser | null): boolean {
    return hasRole(user, 'admin');
}

/**
 * Check if user is active
 */
export function isActiveUser(user: AuthUser | null): boolean {
    return user?.is_active === true;
}

/**
 * Get user's primary role (first active role)
 */
export function getPrimaryRole(user: AuthUser | null): Role | null {
    if (!user || !user.roles) {
        return null;
    }
    
    return user.roles.find(role => role.is_active) || null;
}

/**
 * Get all permissions for user
 */
export function getUserPermissions(user: AuthUser | null): string[] {
    if (!user || !user.roles) {
        return [];
    }
    
    const permissions = new Set<string>();
    
    user.roles.forEach(role => {
        if (role.is_active && role.permissions) {
            role.permissions.forEach(permission => permissions.add(permission));
        }
    });
    
    return Array.from(permissions);
}
