import axios from '@/lib/axios';
import {
    Role,
    CreateRoleRequest,
    UpdateRoleRequest,
    PaginatedResponse,
    FilterOptions,
    AvailablePermissions,
} from '@/types/management';

class RoleManagementService {
    private readonly baseUrl = '/api/roles';

    async getRoles(filters?: FilterOptions): Promise<PaginatedResponse<Role>> {
        const response = await axios.get(this.baseUrl, { params: filters });
        return response.data;
    }

    async getRole(id: number): Promise<Role> {
        const response = await axios.get(`${this.baseUrl}/${id}`);
        return response.data;
    }

    async createRole(roleData: CreateRoleRequest): Promise<{ message: string; role: Role }> {
        const response = await axios.post(this.baseUrl, roleData);
        return response.data;
    }

    async updateRole(id: number, roleData: UpdateRoleRequest): Promise<{ message: string; role: Role }> {
        const response = await axios.put(`${this.baseUrl}/${id}`, roleData);
        return response.data;
    }

    async deleteRole(id: number): Promise<{ message: string }> {
        const response = await axios.delete(`${this.baseUrl}/${id}`);
        return response.data;
    }

    async toggleRoleStatus(id: number): Promise<{ message: string; role: Role }> {
        const response = await axios.post(`${this.baseUrl}/${id}/toggle-status`);
        return response.data;
    }

    async getAvailablePermissions(): Promise<AvailablePermissions> {
        const response = await axios.get('/api/available-permissions');
        return response.data;
    }
}

export const roleManagementService = new RoleManagementService();
