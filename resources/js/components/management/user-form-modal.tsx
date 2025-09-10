import React, { useState, useEffect } from 'react';
import { Users, Save, X, Eye, EyeOff } from 'lucide-react';
import Modal from '@/components/ui/modal';
import { userManagementService } from '@/services/userManagementService';
import { 
    User, 
    CreateUserRequest, 
    UpdateUserRequest, 
    Role 
} from '@/types/management';

interface UserFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    user?: User | null;
    mode: 'create' | 'edit';
}

interface FormData {
    name: string;
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
    role_ids: number[];
    is_active: boolean;
}

const initialFormData: FormData = {
    name: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role_ids: [],
    is_active: true
};

export const UserFormModal: React.FC<UserFormModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    user,
    mode
}) => {
    const [formData, setFormData] = useState<FormData>(initialFormData);
    const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingRoles, setLoadingRoles] = useState(false);
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    useEffect(() => {
        if (isOpen) {
            loadAvailableRoles();
            if (mode === 'edit' && user) {
                setFormData({
                    name: user.name,
                    username: user.username,
                    email: user.email,
                    password: '',
                    confirmPassword: '',
                    role_ids: user.roles.map(role => role.id),
                    is_active: user.is_active
                });
            } else {
                setFormData(initialFormData);
            }
            setErrors({});
        }
    }, [isOpen, user, mode]);

    const loadAvailableRoles = async () => {
        try {
            setLoadingRoles(true);
            const roles = await userManagementService.getAvailableRoles();
            setAvailableRoles(roles);
        } catch (error) {
            console.error('Failed to load roles:', error);
        } finally {
            setLoadingRoles(false);
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

    const handleRoleToggle = (roleId: number) => {
        const currentRoles = formData.role_ids;
        const newRoles = currentRoles.includes(roleId)
            ? currentRoles.filter(id => id !== roleId)
            : [...currentRoles, roleId];
        
        handleInputChange('role_ids', newRoles);
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string[]> = {};

        if (!formData.name.trim()) {
            newErrors.name = ['Name is required'];
        }

        if (!formData.username.trim()) {
            newErrors.username = ['Username is required'];
        }

        if (!formData.email.trim()) {
            newErrors.email = ['Email is required'];
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = ['Please enter a valid email address'];
        }

        if (mode === 'create' || formData.password) {
            if (!formData.password) {
                newErrors.password = ['Password is required'];
            } else if (formData.password.length < 8) {
                newErrors.password = ['Password must be at least 8 characters long'];
            }

            if (formData.password !== formData.confirmPassword) {
                newErrors.confirmPassword = ['Passwords do not match'];
            }
        }

        if (formData.role_ids.length === 0) {
            newErrors.role_ids = ['At least one role is required'];
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

            if (mode === 'create') {
                const requestData: CreateUserRequest = {
                    name: formData.name.trim(),
                    username: formData.username.trim(),
                    email: formData.email.trim(),
                    password: formData.password,
                    role_ids: formData.role_ids,
                    is_active: formData.is_active
                };
                await userManagementService.createUser(requestData);
            } else if (user) {
                const requestData: UpdateUserRequest = {
                    name: formData.name.trim(),
                    username: formData.username.trim(),
                    email: formData.email.trim(),
                    role_ids: formData.role_ids,
                    is_active: formData.is_active
                };
                
                if (formData.password) {
                    requestData.password = formData.password;
                }

                await userManagementService.updateUser(user.id, requestData);
            }

            onSuccess();
            onClose();
        } catch (error: any) {
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            } else {
                setErrors({
                    general: [error.response?.data?.message || 'An error occurred while saving the user']
                });
            }
        } finally {
            setLoading(false);
        }
    };

    const title = mode === 'create' ? 'Create New User' : `Edit User: ${user?.name}`;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} size="lg">
            <form onSubmit={handleSubmit} className="space-y-6">
                {errors.general && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
                        {errors.general.join(', ')}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Name */}
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Full Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            id="name"
                            value={formData.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white ${
                                errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                            }`}
                            placeholder="Enter full name"
                            disabled={loading}
                        />
                        {errors.name && (
                            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name.join(', ')}</p>
                        )}
                    </div>

                    {/* Username */}
                    <div>
                        <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Username <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            id="username"
                            value={formData.username}
                            onChange={(e) => handleInputChange('username', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white ${
                                errors.username ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                            }`}
                            placeholder="Enter username"
                            disabled={loading}
                        />
                        {errors.username && (
                            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.username.join(', ')}</p>
                        )}
                    </div>
                </div>

                {/* Email */}
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="email"
                        id="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white ${
                            errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                        }`}
                        placeholder="Enter email address"
                        disabled={loading}
                    />
                    {errors.email && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email.join(', ')}</p>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Password */}
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Password {mode === 'create' && <span className="text-red-500">*</span>}
                            {mode === 'edit' && <span className="text-sm text-gray-500">(leave blank to keep current)</span>}
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                id="password"
                                value={formData.password}
                                onChange={(e) => handleInputChange('password', e.target.value)}
                                className={`w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white ${
                                    errors.password ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                                }`}
                                placeholder="Enter password"
                                disabled={loading}
                            />
                            <button
                                type="button"
                                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? (
                                    <EyeOff className="h-4 w-4 text-gray-400" />
                                ) : (
                                    <Eye className="h-4 w-4 text-gray-400" />
                                )}
                            </button>
                        </div>
                        {errors.password && (
                            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password.join(', ')}</p>
                        )}
                    </div>

                    {/* Confirm Password */}
                    <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Confirm Password {(mode === 'create' || formData.password) && <span className="text-red-500">*</span>}
                        </label>
                        <div className="relative">
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                id="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                                className={`w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white ${
                                    errors.confirmPassword ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                                }`}
                                placeholder="Confirm password"
                                disabled={loading}
                            />
                            <button
                                type="button"
                                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                                {showConfirmPassword ? (
                                    <EyeOff className="h-4 w-4 text-gray-400" />
                                ) : (
                                    <Eye className="h-4 w-4 text-gray-400" />
                                )}
                            </button>
                        </div>
                        {errors.confirmPassword && (
                            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.confirmPassword.join(', ')}</p>
                        )}
                    </div>
                </div>

                {/* Roles */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Roles <span className="text-red-500">*</span>
                    </label>
                    
                    {loadingRoles ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                            <span className="ml-2 text-sm text-gray-500">Loading roles...</span>
                        </div>
                    ) : (
                        <div className="border border-gray-300 rounded-md p-4 max-h-40 overflow-y-auto dark:border-gray-600 dark:bg-gray-800">
                            <div className="grid grid-cols-1 gap-2">
                                {availableRoles.map((role) => (
                                    <label key={role.id} className="flex items-center space-x-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.role_ids.includes(role.id)}
                                            onChange={() => handleRoleToggle(role.id)}
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                            disabled={loading}
                                        />
                                        <span className="text-sm text-gray-700 dark:text-gray-300">
                                            {role.name}
                                            {role.description && (
                                                <span className="text-xs text-gray-500 block">
                                                    {role.description}
                                                </span>
                                            )}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    {errors.role_ids && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.role_ids.join(', ')}</p>
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
                        <span className="text-sm text-gray-700 dark:text-gray-300">User is active</span>
                    </label>
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
                                {mode === 'create' ? 'Create User' : 'Update User'}
                            </div>
                        )}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default UserFormModal;
