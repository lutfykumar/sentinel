import axios from '@/lib/axios';
import { RuleGroupType } from 'react-querybuilder';

export interface RuleSetData {
    id: number;
    name: string;
    description?: string;
    rules: RuleGroupType;
    user_id: number;
    is_public: boolean;
    created_at: string;
    updated_at: string;
    user?: {
        id: number;
        name: string;
        email: string;
    };
}

export interface CreateRuleSetRequest {
    name: string;
    description?: string;
    rules: RuleGroupType;
    is_public?: boolean;
}

class RuleSetService {
    private readonly baseUrl = '/api/rulesets';

    async getRuleSets(): Promise<RuleSetData[]> {
        const response = await axios.get(this.baseUrl);
        return response.data;
    }

    async getRuleSet(id: number): Promise<RuleSetData> {
        const response = await axios.get(`${this.baseUrl}/${id}`);
        return response.data;
    }

    async createRuleSet(data: CreateRuleSetRequest): Promise<RuleSetData> {
        const response = await axios.post(this.baseUrl, data);
        return response.data.rule_set;
    }

    async updateRuleSet(id: number, data: CreateRuleSetRequest): Promise<RuleSetData> {
        const response = await axios.put(`${this.baseUrl}/${id}`, data);
        return response.data.rule_set;
    }

    async deleteRuleSet(id: number): Promise<void> {
        await axios.delete(`${this.baseUrl}/${id}`);
    }

    async getAllRuleSets(): Promise<{ data: RuleSetData[] }> {
        const response = await axios.get(`${this.baseUrl}/admin/all`);
        return response.data;
    }
}

export const ruleSetService = new RuleSetService();
