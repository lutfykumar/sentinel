<?php

namespace App\Http\Controllers;

use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class RoleManagementController extends Controller
{
    /**
     * Display a listing of roles.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Role::withCount('users');
        
        // Search functionality
        if ($request->filled('search')) {
            $searchTerm = $request->get('search');
            $query->where(function ($q) use ($searchTerm) {
                $q->where('name', 'like', "%{$searchTerm}%")
                  ->orWhere('description', 'like', "%{$searchTerm}%");
            });
        }
        
        // Filter by status
        if ($request->filled('status')) {
            $isActive = $request->get('status') === 'active';
            $query->where('is_active', $isActive);
        }
        
        // Sorting
        $sortField = $request->get('sort', 'name');
        $sortDirection = $request->get('direction', 'asc');
        $query->orderBy($sortField, $sortDirection);
        
        $roles = $query->paginate($request->get('per_page', 15));
        
        return response()->json($roles);
    }
    
    /**
     * Store a newly created role.
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255|unique:roles,name',
            'description' => 'nullable|string|max:500',
            'permissions' => 'required|array|min:1',
            'permissions.*' => 'string',
            'is_active' => 'boolean',
        ]);
        
        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }
        
        $role = Role::create([
            'name' => $request->name,
            'description' => $request->description,
            'permissions' => $request->permissions,
            'is_active' => $request->get('is_active', true),
        ]);
        
        $role->loadCount('users');
        
        return response()->json([
            'message' => 'Role created successfully',
            'role' => $role
        ], 201);
    }
    
    /**
     * Display the specified role.
     */
    public function show(Role $role): JsonResponse
    {
        $role->loadCount('users');
        return response()->json($role);
    }
    
    /**
     * Update the specified role.
     */
    public function update(Request $request, Role $role): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255|unique:roles,name,' . $role->id,
            'description' => 'nullable|string|max:500',
            'permissions' => 'required|array|min:1',
            'permissions.*' => 'string',
            'is_active' => 'boolean',
        ]);
        
        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }
        
        $role->update([
            'name' => $request->name,
            'description' => $request->description,
            'permissions' => $request->permissions,
            'is_active' => $request->get('is_active', true),
        ]);
        
        $role->loadCount('users');
        
        return response()->json([
            'message' => 'Role updated successfully',
            'role' => $role
        ]);
    }
    
    /**
     * Remove the specified role.
     */
    public function destroy(Role $role): JsonResponse
    {
        // Prevent deleting roles that have users assigned
        if ($role->users()->count() > 0) {
            return response()->json([
                'message' => 'Cannot delete role that has users assigned to it'
            ], 422);
        }
        
        // Prevent deleting admin role
        if (strtolower($role->name) === 'admin') {
            return response()->json([
                'message' => 'Cannot delete the admin role'
            ], 422);
        }
        
        $role->delete();
        
        return response()->json([
            'message' => 'Role deleted successfully'
        ]);
    }
    
    /**
     * Toggle role status (active/inactive).
     */
    public function toggleStatus(Role $role): JsonResponse
    {
        // Prevent deactivating admin role
        if (strtolower($role->name) === 'admin' && $role->is_active) {
            return response()->json([
                'message' => 'Cannot deactivate the admin role'
            ], 422);
        }
        
        $role->update(['is_active' => !$role->is_active]);
        $role->loadCount('users');
        
        return response()->json([
            'message' => 'Role status updated successfully',
            'role' => $role
        ]);
    }
    
    /**
     * Get available permissions.
     */
    public function getAvailablePermissions(): JsonResponse
    {
        $permissions = [
            'dashboard.view' => 'View Dashboard',
            'data.view' => 'View Customs Data',
            'data.export' => 'Export Customs Data',
            'users.view' => 'View Users',
            'users.create' => 'Create Users',
            'users.update' => 'Update Users',
            'users.delete' => 'Delete Users',
            'roles.view' => 'View Roles',
            'roles.create' => 'Create Roles',
            'roles.update' => 'Update Roles',
            'roles.delete' => 'Delete Roles',
        ];
        
        return response()->json($permissions);
    }
}
