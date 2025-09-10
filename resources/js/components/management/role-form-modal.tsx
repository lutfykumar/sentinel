import React, { useState, useEffect } from 'react';
import { Shield, Save, X } from 'lucide-react';
import Modal from '@/components/ui/modal';
import { roleManagementService } from '@/services/roleManagementService';
import { 
    Role, 
    CreateRoleRequest, 
    UpdateRoleRequest, 
    AvailablePermissions 
} from '@/types/management';

interface RoleFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    role?: Role | null;
    mode: 'create' | 'edit';
}

interface FormData {
    name: string;
    description: string;
    permissions: string[];
    is_active: boolean;
}

const initialFormData: FormData = {
    name: '',
    description: '',
    permissions: [],
    is_active: true
};

export const RoleFormModal: React.FC<RoleFormModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    role,
    mode
}) => {
    const [formData, setFormData] = useState<FormData>(initialFormData);
    const [availablePermissions, setAvailablePermissions] = useState<AvailablePermissions>({});
    const [loading, setLoading] = useState(false);
    const [loadingPermissions, setLoadingPermissions] = useState(false);
    const [errors, setErrors] = useState<Record<string, string[]>>({});

    useEffect(() => {
        if (isOpen) {
            loadAvailablePermissions();
            if (mode === 'edit' && role) {
                setFormData({
                    name: role.name,
                    description: role.description || '',
                    permissions: role.permissions || [],
                    is_active: role.is_active
                });
            } else {
                setFormData(initialFormData);
            }
            setErrors({});
        }
    }, [isOpen, role, mode]);

    const loadAvailablePermissions = async () => {
        try {
            setLoadingPermissions(true);
            const permissions = await roleManagementService.getAvailablePermissions();
            setAvailablePermissions(permissions);
        } catch (error) {
            console.error('Failed to load permissions:', error);
        } finally {
            setLoadingPermissions(false);
        }
    };

    const handleInputChange = (field: keyof FormData, value: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
        // Clear field error when user starts typing
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: []
            }));
        }
    };

    const handlePermissionToggle = (permission: string) => {
        const currentPermissions = formData.permissions;
        const newPermissions = currentPermissions.includes(permission)
            ? currentPermissions.filter(p => p !== permission)
            : [...currentPermissions, permission];
        
        handleInputChange('permissions', newPermissions);
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string[]> = {};

        if (!formData.name.trim()) {
            newErrors.name = ['Role name is required'];
        }

        if (formData.permissions.length === 0) {
            newErrors.permissions = ['At least one permission is required'];
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        try {
            setLoading(true);
            setErrors({});

            const requestData = {
                name: formData.name.trim(),
                description: formData.description.trim() || undefined,
                permissions: formData.permissions,
                is_active: formData.is_active
            };

            if (mode === 'create') {
                await roleManagementService.createRole(requestData as CreateRoleRequest);
            } else if (role) {
                await roleManagementService.updateRole(role.id, requestData as UpdateRoleRequest);
            }

            onSuccess();
            onClose();
        } catch (error: any) {
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            } else {
                setErrors({
                    general: [error.response?.data?.message || 'An error occurred while saving the role']
                });
            }
        } finally {
            setLoading(false);
        }
    };

    const title = mode === 'create' ? 'Create New Role' : `Edit Role: ${role?.name}`;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} size="lg">
            <form onSubmit={handleSubmit} className="space-y-6">
                {errors.general && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
                        {errors.general.join(', ')}
                    </div>
                )}

                <div className="grid grid-cols-1 gap-6">
                    {/* Role Name */}
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Role Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            id="name"
                            value={formData.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white ${
                                errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                            }`}
                            placeholder="Enter role name"
                            disabled={loading}
                        />
                        {errors.name && (
                            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name.join(', ')}</p>
                        )}
                    </div>

                    {/* Description */}
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Description
                        </label>
                        <textarea
                            id="description"
                            rows={3}
                            value={formData.description}
                            onChange={(e) => handleInputChange('description', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white dark:border-gray-600"
                            placeholder="Optional description for this role"
                            disabled={loading}
                        />
                    </div>

                    {/* Permissions */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Permissions <span className="text-red-500">*</span>
                        </label>
                        
                        {loadingPermissions ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                                <span className="ml-2 text-sm text-gray-500">Loading permissions...</span>
                            </div>
                        ) : (
                            <div className="border border-gray-300 rounded-md p-4 max-h-60 overflow-y-auto dark:border-gray-600 dark:bg-gray-800">
                                <div className="grid grid-cols-1 gap-2">
                                    {Object.entries(availablePermissions).map(([key, label]) => (
                                        <label key={key} className="flex items-center space-x-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={formData.permissions.includes(key)}
                                                onChange={() => handlePermissionToggle(key)}
                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                disabled={loading}
                                            />
                                            <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        {errors.permissions && (
                            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.permissions.join(', ')}</p>
                        )}
                    </div>

                    {/* Active Status */}
                    <div>
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.is_active}
                                onChange={(e) => handleInputChange('is_active', e.target.checked)}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                disabled={loading}
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">Role is active</span>
                        </label>
                    </div>
                </div>

                {/* Form Actions */}
                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-600">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
                        disabled={loading}
                    >
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={loading}
                    >
                        {loading ? (
                            <div className="flex items-center">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                {mode === 'create' ? 'Creating...' : 'Updating...'}
                            </div>
                        ) : (
                            <div className="flex items-center">
                                <Save className="w-4 h-4 mr-2" />
                                {mode === 'create' ? 'Create Role' : 'Update Role'}
                            </div>
                        )}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default RoleFormModal;
