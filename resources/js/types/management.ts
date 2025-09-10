export interface Role {
    id: number;
    name: string;
    description: string | null;
    permissions: string[];
    is_active: boolean;
    users_count?: number;
    created_at: string;
    updated_at: string;
}

export interface User {
    id: number;
    name: string;
    username: string;
    email: string;
    email_verified_at: string | null;
    is_active: boolean;
    roles: Role[];
    created_at: string;
    updated_at: string;
}

export interface CreateUserRequest {
    name: string;
    username: string;
    email: string;
    password: string;
    role_ids: number[];
    is_active?: boolean;
}

export interface UpdateUserRequest {
    name: string;
    username: string;
    email: string;
    password?: string;
    role_ids: number[];
    is_active: boolean;
}

export interface CreateRoleRequest {
    name: string;
    description?: string;
    permissions: string[];
    is_active?: boolean;
}

export interface UpdateRoleRequest {
    name: string;
    description?: string;
    permissions: string[];
    is_active: boolean;
}

export interface PaginatedResponse<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
}

export interface ApiResponse<T> {
    message: string;
    data?: T;
    errors?: Record<string, string[]>;
}

export interface FilterOptions {
    search?: string;
    role?: string;
    status?: 'active' | 'inactive';
    sort?: string;
    direction?: 'asc' | 'desc';
    per_page?: number;
    page?: number;
}

export interface AvailablePermissions {
    [key: string]: string;
}
