import React, { useState, useEffect } from 'react';
import AppLayout from '@/layouts/app-layout';
import { managementRoles } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { roleManagementService } from '@/services/roleManagementService';
import { type Role, type PaginatedResponse } from '@/types/management';
import { Shield, Plus, Search, Edit, Trash2, Power, Users } from 'lucide-react';
import RoleFormModal from '@/components/management/role-form-modal';
import ConfirmationModal from '@/components/ui/confirmation-modal';
import ToastContainer from '@/components/ui/toast-container';
import { useToast } from '@/hooks/useToast';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Management',
        href: managementRoles(),
    },
    {
        title: 'Roles',
        href: managementRoles(),
    },
];

export default function Roles() {
    const [roles, setRoles] = useState<PaginatedResponse<Role> | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Modal states
    const [roleFormModal, setRoleFormModal] = useState<{
        isOpen: boolean;
        mode: 'create' | 'edit';
        role?: Role | null;
    }>({ isOpen: false, mode: 'create', role: null });
    
    const [deleteModal, setDeleteModal] = useState<{
        isOpen: boolean;
        role?: Role | null;
        loading: boolean;
    }>({ isOpen: false, role: null, loading: false });
    
    const [toggleStatusModal, setToggleStatusModal] = useState<{
        isOpen: boolean;
        role?: Role | null;
        loading: boolean;
    }>({ isOpen: false, role: null, loading: false });
    
    const toast = useToast();

    const loadRoles = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await roleManagementService.getRoles({
                search: searchTerm || undefined,
            });
            setRoles(response);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load roles');
        } finally {
            setLoading(false);
        }
    };

    // Modal handlers
    const openCreateModal = () => {
        setRoleFormModal({ isOpen: true, mode: 'create', role: null });
    };
    
    const openEditModal = (role: Role) => {
        setRoleFormModal({ isOpen: true, mode: 'edit', role });
    };
    
    const closeRoleFormModal = () => {
        setRoleFormModal({ isOpen: false, mode: 'create', role: null });
    };
    
    const onRoleFormSuccess = () => {
        loadRoles();
        const action = roleFormModal.mode === 'create' ? 'created' : 'updated';
        toast.success(`Role ${action} successfully`, `Role has been ${action} successfully.`);
    };
    
    const openDeleteModal = (role: Role) => {
        setDeleteModal({ isOpen: true, role, loading: false });
    };
    
    const closeDeleteModal = () => {
        setDeleteModal({ isOpen: false, role: null, loading: false });
    };
    
    const confirmDeleteRole = async () => {
        if (!deleteModal.role) return;
        
        try {
            setDeleteModal(prev => ({ ...prev, loading: true }));
            await roleManagementService.deleteRole(deleteModal.role.id);
            toast.success('Role deleted', 'Role has been deleted successfully.');
            loadRoles();
            closeDeleteModal();
        } catch (error: any) {
            toast.error('Failed to delete role', error.response?.data?.message || 'An error occurred while deleting the role.');
            setDeleteModal(prev => ({ ...prev, loading: false }));
        }
    };
    
    const openToggleStatusModal = (role: Role) => {
        setToggleStatusModal({ isOpen: true, role, loading: false });
    };
    
    const closeToggleStatusModal = () => {
        setToggleStatusModal({ isOpen: false, role: null, loading: false });
    };
    
    const confirmToggleRoleStatus = async () => {
        if (!toggleStatusModal.role) return;
        
        try {
            setToggleStatusModal(prev => ({ ...prev, loading: true }));
            await roleManagementService.toggleRoleStatus(toggleStatusModal.role.id);
            const newStatus = toggleStatusModal.role.is_active ? 'deactivated' : 'activated';
            toast.success(`Role ${newStatus}`, `Role has been ${newStatus} successfully.`);
            loadRoles();
            closeToggleStatusModal();
        } catch (error: any) {
            toast.error('Failed to update role status', error.response?.data?.message || 'An error occurred while updating the role status.');
            setToggleStatusModal(prev => ({ ...prev, loading: false }));
        }
    };

    useEffect(() => {
        loadRoles();
    }, [searchTerm]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Role Management" />
            <div className="flex h-full flex-1 flex-col gap-8 overflow-x-auto rounded-xl p-4">
                <div className="flex flex-col space-y-4">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                                <Shield className="h-7 w-7" />
                                Role Management
                            </h1>
                            <p className="text-muted-foreground">
                                Manage roles and their permissions.
                            </p>
                        </div>
                        <button 
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
                            onClick={openCreateModal}
                        >
                            <Plus className="h-4 w-4" />
                            Add Role
                        </button>
                    </div>
                    
                    {/* Search */}
                    <div className="flex items-center space-x-2">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search roles..."
                                className="w-full pl-9 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button 
                            onClick={loadRoles}
                            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors duration-200"
                        >
                            Refresh
                        </button>
                    </div>
                    
                    {/* Content */}
                    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                        {loading ? (
                            <div className="p-8 text-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                                <p className="mt-2 text-muted-foreground">Loading roles...</p>
                            </div>
                        ) : error ? (
                            <div className="p-8 text-center">
                                <p className="text-red-600">Error: {error}</p>
                                <button 
                                    onClick={loadRoles}
                                    className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                >
                                    Retry
                                </button>
                            </div>
                        ) : !roles || roles.data.length === 0 ? (
                            <div className="p-8 text-center">
                                <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                <h3 className="text-lg font-semibold">No roles found</h3>
                                <p className="text-muted-foreground mt-2">
                                    {searchTerm ? 'No roles match your search criteria.' : 'No roles have been created yet.'}
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-muted">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                Role
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                Users
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                Permissions
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-background divide-y divide-border">
                                        {roles.data.map((role) => (
                                            <tr key={role.id} className="hover:bg-muted/50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div>
                                                        <div className="font-medium flex items-center gap-2">
                                                            <Shield className={`w-4 h-4 ${
                                                                role.name === 'admin' ? 'text-red-600' : 'text-blue-600'
                                                            }`} />
                                                            {role.name}
                                                        </div>
                                                        {role.description && (
                                                            <div className="text-sm text-muted-foreground">
                                                                {role.description}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center text-sm text-muted-foreground">
                                                        <Users className="w-4 h-4 mr-1" />
                                                        {role.users_count || 0} users
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="max-w-xs">
                                                        <div className="flex flex-wrap gap-1">
                                                            {role.permissions?.slice(0, 3).map((permission, index) => (
                                                                <span 
                                                                    key={index}
                                                                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                                                                >
                                                                    {permission}
                                                                </span>
                                                            ))}
                                                            {role.permissions && role.permissions.length > 3 && (
                                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                                    +{role.permissions.length - 3} more
                                                                </span>
                                                            )}
                                                            {(!role.permissions || role.permissions.length === 0) && (
                                                                <span className="text-sm text-muted-foreground">No permissions</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                                        role.is_active 
                                                            ? 'bg-green-100 text-green-800' 
                                                            : 'bg-gray-100 text-gray-800'
                                                    }`}>
                                                        {role.is_active ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <div className="flex items-center justify-end space-x-2">
                                                        <button 
                                                            onClick={() => openEditModal(role)}
                                                            className="text-blue-600 hover:text-blue-900 p-1 rounded"
                                                            title="Edit Role"
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </button>
                                                        <button 
                                                            onClick={() => openToggleStatusModal(role)}
                                                            className={`p-1 rounded disabled:opacity-50 disabled:cursor-not-allowed ${
                                                                role.is_active 
                                                                    ? 'text-orange-600 hover:text-orange-900' 
                                                                    : 'text-green-600 hover:text-green-900'
                                                            }`}
                                                            title={role.is_active ? 'Deactivate Role' : 'Activate Role'}
                                                            disabled={role.name === 'admin'}
                                                        >
                                                            <Power className="h-4 w-4" />
                                                        </button>
                                                        <button 
                                                            onClick={() => openDeleteModal(role)}
                                                            className="text-red-600 hover:text-red-900 p-1 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                                            title="Delete Role"
                                                            disabled={role.name === 'admin' || (role.users_count && role.users_count > 0)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                
                                {/* Pagination Info */}
                                {roles.total > roles.per_page && (
                                    <div className="px-6 py-4 bg-muted text-sm text-muted-foreground">
                                        Showing {roles.from} to {roles.to} of {roles.total} roles
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            {/* Modals */}
            <RoleFormModal
                isOpen={roleFormModal.isOpen}
                onClose={closeRoleFormModal}
                onSuccess={onRoleFormSuccess}
                role={roleFormModal.role}
                mode={roleFormModal.mode}
            />
            
            <ConfirmationModal
                isOpen={deleteModal.isOpen}
                onClose={closeDeleteModal}
                onConfirm={confirmDeleteRole}
                title="Delete Role"
                message={`Are you sure you want to delete the role "${deleteModal.role?.name}"? This action cannot be undone.`}
                confirmText="Delete Role"
                danger={true}
                loading={deleteModal.loading}
            />
            
            <ConfirmationModal
                isOpen={toggleStatusModal.isOpen}
                onClose={closeToggleStatusModal}
                onConfirm={confirmToggleRoleStatus}
                title={toggleStatusModal.role?.is_active ? 'Deactivate Role' : 'Activate Role'}
                message={`Are you sure you want to ${toggleStatusModal.role?.is_active ? 'deactivate' : 'activate'} the role "${toggleStatusModal.role?.name}"?`}
                confirmText={toggleStatusModal.role?.is_active ? 'Deactivate' : 'Activate'}
                danger={toggleStatusModal.role?.is_active}
                loading={toggleStatusModal.loading}
            />
            
            {/* Toast notifications */}
            <ToastContainer toasts={toast.toasts} onDismiss={toast.dismiss} />
        </AppLayout>
    );
}
