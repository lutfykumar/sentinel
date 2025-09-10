import React, { useState, useEffect } from 'react';
import AppLayout from '@/layouts/app-layout';
import { managementUsers } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { userManagementService } from '@/services/userManagementService';
import { type User, type PaginatedResponse } from '@/types/management';
import { Users, Plus, Search, Edit, Trash2, Power, Shield } from 'lucide-react';
import UserFormModal from '@/components/management/user-form-modal';
import ConfirmationModal from '@/components/ui/confirmation-modal';
import ToastContainer from '@/components/ui/toast-container';
import { useToast } from '@/hooks/useToast';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Management',
        href: managementUsers(),
    },
    {
        title: 'Users',
        href: managementUsers(),
    },
];

export default function UsersPage() {
    const [users, setUsers] = useState<PaginatedResponse<User> | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Modal states
    const [userFormModal, setUserFormModal] = useState<{
        isOpen: boolean;
        mode: 'create' | 'edit';
        user?: User | null;
    }>({ isOpen: false, mode: 'create', user: null });
    
    const [deleteModal, setDeleteModal] = useState<{
        isOpen: boolean;
        user?: User | null;
        loading: boolean;
    }>({ isOpen: false, user: null, loading: false });
    
    const [toggleStatusModal, setToggleStatusModal] = useState<{
        isOpen: boolean;
        user?: User | null;
        loading: boolean;
    }>({ isOpen: false, user: null, loading: false });
    
    const toast = useToast();

    const loadUsers = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await userManagementService.getUsers({
                search: searchTerm || undefined,
            });
            setUsers(response);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    // Modal handlers
    const openCreateModal = () => {
        setUserFormModal({ isOpen: true, mode: 'create', user: null });
    };
    
    const openEditModal = (user: User) => {
        setUserFormModal({ isOpen: true, mode: 'edit', user });
    };
    
    const closeUserFormModal = () => {
        setUserFormModal({ isOpen: false, mode: 'create', user: null });
    };
    
    const onUserFormSuccess = () => {
        loadUsers();
        const action = userFormModal.mode === 'create' ? 'created' : 'updated';
        toast.success(`User ${action} successfully`, `User has been ${action} successfully.`);
    };
    
    const openDeleteModal = (user: User) => {
        setDeleteModal({ isOpen: true, user, loading: false });
    };
    
    const closeDeleteModal = () => {
        setDeleteModal({ isOpen: false, user: null, loading: false });
    };
    
    const confirmDeleteUser = async () => {
        if (!deleteModal.user) return;
        
        try {
            setDeleteModal(prev => ({ ...prev, loading: true }));
            await userManagementService.deleteUser(deleteModal.user.id);
            toast.success('User deleted', 'User has been deleted successfully.');
            loadUsers();
            closeDeleteModal();
        } catch (error: any) {
            toast.error('Failed to delete user', error.response?.data?.message || 'An error occurred while deleting the user.');
            setDeleteModal(prev => ({ ...prev, loading: false }));
        }
    };
    
    const openToggleStatusModal = (user: User) => {
        setToggleStatusModal({ isOpen: true, user, loading: false });
    };
    
    const closeToggleStatusModal = () => {
        setToggleStatusModal({ isOpen: false, user: null, loading: false });
    };
    
    const confirmToggleUserStatus = async () => {
        if (!toggleStatusModal.user) return;
        
        try {
            setToggleStatusModal(prev => ({ ...prev, loading: true }));
            await userManagementService.toggleUserStatus(toggleStatusModal.user.id);
            const newStatus = toggleStatusModal.user.is_active ? 'deactivated' : 'activated';
            toast.success(`User ${newStatus}`, `User has been ${newStatus} successfully.`);
            loadUsers();
            closeToggleStatusModal();
        } catch (error: any) {
            toast.error('Failed to update user status', error.response?.data?.message || 'An error occurred while updating the user status.');
            setToggleStatusModal(prev => ({ ...prev, loading: false }));
        }
    };

    useEffect(() => {
        loadUsers();
    }, [searchTerm]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="User Management" />
            <div className="flex h-full flex-1 flex-col gap-8 overflow-x-auto rounded-xl p-4">
                <div className="flex flex-col space-y-4">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                                <Users className="h-7 w-7" />
                                User Management
                            </h1>
                            <p className="text-muted-foreground">
                                Manage users, their roles, and permissions.
                            </p>
                        </div>
                        <button 
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
                            onClick={openCreateModal}
                        >
                            <Plus className="h-4 w-4" />
                            Add User
                        </button>
                    </div>
                    
                    {/* Search */}
                    <div className="flex items-center space-x-2">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search users..."
                                className="w-full pl-9 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button 
                            onClick={loadUsers}
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
                                <p className="mt-2 text-muted-foreground">Loading users...</p>
                            </div>
                        ) : error ? (
                            <div className="p-8 text-center">
                                <p className="text-red-600">Error: {error}</p>
                                <button 
                                    onClick={loadUsers}
                                    className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                >
                                    Retry
                                </button>
                            </div>
                        ) : !users || users.data.length === 0 ? (
                            <div className="p-8 text-center">
                                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                <h3 className="text-lg font-semibold">No users found</h3>
                                <p className="text-muted-foreground mt-2">
                                    {searchTerm ? 'No users match your search criteria.' : 'No users have been created yet.'}
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-muted">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                User
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                Roles
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                Created
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-background divide-y divide-border">
                                        {users.data.map((user) => (
                                            <tr key={user.id} className="hover:bg-muted/50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div>
                                                        <div className="font-medium flex items-center gap-2">
                                                            <Users className="w-4 h-4 text-blue-600" />
                                                            {user.name}
                                                        </div>
                                                        <div className="text-sm text-muted-foreground">
                                                            @{user.username}
                                                        </div>
                                                        <div className="text-sm text-muted-foreground">
                                                            {user.email}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="max-w-xs">
                                                        <div className="flex flex-wrap gap-1">
                                                            {user.roles?.slice(0, 3).map((role) => (
                                                                <span 
                                                                    key={role.id}
                                                                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                                                        role.name === 'admin' 
                                                                            ? 'bg-red-100 text-red-800' 
                                                                            : 'bg-blue-100 text-blue-800'
                                                                    }`}
                                                                >
                                                                    <Shield className="w-3 h-3 mr-1" />
                                                                    {role.name}
                                                                </span>
                                                            ))}
                                                            {user.roles && user.roles.length > 3 && (
                                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                                    +{user.roles.length - 3} more
                                                                </span>
                                                            )}
                                                            {(!user.roles || user.roles.length === 0) && (
                                                                <span className="text-sm text-muted-foreground">No roles</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                                        user.is_active 
                                                            ? 'bg-green-100 text-green-800' 
                                                            : 'bg-gray-100 text-gray-800'
                                                    }`}>
                                                        {user.is_active ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                                    {new Date(user.created_at).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <div className="flex items-center justify-end space-x-2">
                                                        <button 
                                                            onClick={() => openEditModal(user)}
                                                            className="text-blue-600 hover:text-blue-900 p-1 rounded"
                                                            title="Edit User"
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </button>
                                                        <button 
                                                            onClick={() => openToggleStatusModal(user)}
                                                            className={`p-1 rounded ${
                                                                user.is_active 
                                                                    ? 'text-orange-600 hover:text-orange-900' 
                                                                    : 'text-green-600 hover:text-green-900'
                                                            }`}
                                                            title={user.is_active ? 'Deactivate User' : 'Activate User'}
                                                        >
                                                            <Power className="h-4 w-4" />
                                                        </button>
                                                        <button 
                                                            onClick={() => openDeleteModal(user)}
                                                            className="text-red-600 hover:text-red-900 p-1 rounded"
                                                            title="Delete User"
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
                                {users.total > users.per_page && (
                                    <div className="px-6 py-4 bg-muted text-sm text-muted-foreground">
                                        Showing {users.from} to {users.to} of {users.total} users
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            {/* Modals */}
            <UserFormModal
                isOpen={userFormModal.isOpen}
                onClose={closeUserFormModal}
                onSuccess={onUserFormSuccess}
                user={userFormModal.user}
                mode={userFormModal.mode}
            />
            
            <ConfirmationModal
                isOpen={deleteModal.isOpen}
                onClose={closeDeleteModal}
                onConfirm={confirmDeleteUser}
                title="Delete User"
                message={`Are you sure you want to delete the user "${deleteModal.user?.name}"? This action cannot be undone.`}
                confirmText="Delete User"
                danger={true}
                loading={deleteModal.loading}
            />
            
            <ConfirmationModal
                isOpen={toggleStatusModal.isOpen}
                onClose={closeToggleStatusModal}
                onConfirm={confirmToggleUserStatus}
                title={toggleStatusModal.user?.is_active ? 'Deactivate User' : 'Activate User'}
                message={`Are you sure you want to ${toggleStatusModal.user?.is_active ? 'deactivate' : 'activate'} the user "${toggleStatusModal.user?.name}"?`}
                confirmText={toggleStatusModal.user?.is_active ? 'Deactivate' : 'Activate'}
                danger={toggleStatusModal.user?.is_active}
                loading={toggleStatusModal.loading}
            />
            
            {/* Toast notifications */}
            <ToastContainer toasts={toast.toasts} onDismiss={toast.dismiss} />
        </AppLayout>
    );
}
