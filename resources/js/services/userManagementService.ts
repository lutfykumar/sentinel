import axios from '@/lib/axios';
import {
    User,
    CreateUserRequest,
    UpdateUserRequest,
    PaginatedResponse,
    FilterOptions,
    Role,
} from '@/types/management';

class UserManagementService {
    private readonly baseUrl = '/api/users';

    async getUsers(filters?: FilterOptions): Promise<PaginatedResponse<User>> {
        const response = await axios.get(this.baseUrl, { params: filters });
        return response.data;
    }

    async getUser(id: number): Promise<User> {
        const response = await axios.get(`${this.baseUrl}/${id}`);
        return response.data;
    }

    async createUser(userData: CreateUserRequest): Promise<{ message: string; user: User }> {
        const response = await axios.post(this.baseUrl, userData);
        return response.data;
    }

    async updateUser(id: number, userData: UpdateUserRequest): Promise<{ message: string; user: User }> {
        const response = await axios.put(`${this.baseUrl}/${id}`, userData);
        return response.data;
    }

    async deleteUser(id: number): Promise<{ message: string }> {
        const response = await axios.delete(`${this.baseUrl}/${id}`);
        return response.data;
    }

    async toggleUserStatus(id: number): Promise<{ message: string; user: User }> {
        const response = await axios.post(`${this.baseUrl}/${id}/toggle-status`);
        return response.data;
    }

    async getAvailableRoles(): Promise<Role[]> {
        const response = await axios.get('/api/users-roles');
        return response.data;
    }
}

export const userManagementService = new UserManagementService();
