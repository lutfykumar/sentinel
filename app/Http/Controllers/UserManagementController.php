<?php

namespace App\Http\Controllers;

use App\Models\Role;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rules\Password;

class UserManagementController extends Controller
{
    /**
     * Display a listing of users with pagination and search.
     */
    public function index(Request $request): JsonResponse
    {
        $query = User::with('roles');
        
        // Search functionality
        if ($request->filled('search')) {
            $searchTerm = $request->get('search');
            $query->where(function ($q) use ($searchTerm) {
                $q->where('name', 'like', "%{$searchTerm}%")
                  ->orWhere('username', 'like', "%{$searchTerm}%")
                  ->orWhere('email', 'like', "%{$searchTerm}%");
            });
        }
        
        // Filter by role
        if ($request->filled('role')) {
            $query->whereHas('roles', function ($q) use ($request) {
                $q->where('name', $request->get('role'));
            });
        }
        
        // Filter by status
        if ($request->filled('status')) {
            $isActive = $request->get('status') === 'active';
            $query->where('is_active', $isActive);
        }
        
        // Sorting
        $sortField = $request->get('sort', 'created_at');
        $sortDirection = $request->get('direction', 'desc');
        $query->orderBy($sortField, $sortDirection);
        
        $users = $query->paginate($request->get('per_page', 15));
        
        return response()->json($users);
    }
    
    /**
     * Store a newly created user.
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'username' => 'required|string|max:255|unique:users',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => ['required', Password::defaults()],
            'role_ids' => 'required|array|min:1',
            'role_ids.*' => 'exists:roles,id',
            'is_active' => 'boolean',
            'google2fa_enabled' => 'boolean',
        ]);
        
        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }
        
        $user = User::create([
            'name' => $request->name,
            'username' => $request->username,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'is_active' => $request->get('is_active', true),
            'google2fa_enabled' => $request->get('google2fa_enabled', false), // Default 2FA to disabled for new users
        ]);
        
        // Attach roles
        $user->roles()->attach($request->role_ids);
        
        $user->load('roles');
        
        return response()->json([
            'message' => 'User created successfully',
            'user' => $user
        ], 201);
    }
    
    /**
     * Display the specified user.
     */
    public function show(User $user): JsonResponse
    {
        $user->load('roles');
        return response()->json($user);
    }
    
    /**
     * Update the specified user.
     */
    public function update(Request $request, User $user): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'username' => 'required|string|max:255|unique:users,username,' . $user->id,
            'email' => 'required|string|email|max:255|unique:users,email,' . $user->id,
            'password' => ['nullable', Password::defaults()],
            'role_ids' => 'required|array|min:1',
            'role_ids.*' => 'exists:roles,id',
            'is_active' => 'boolean',
            'google2fa_enabled' => 'boolean',
        ]);
        
        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }
        
        $userData = [
            'name' => $request->name,
            'username' => $request->username,
            'email' => $request->email,
            'is_active' => $request->get('is_active', true),
            'google2fa_enabled' => $request->get('google2fa_enabled', false),
        ];
        
        if ($request->filled('password')) {
            $userData['password'] = Hash::make($request->password);
        }
        
        $user->update($userData);
        
        // Sync roles
        $user->roles()->sync($request->role_ids);
        
        $user->load('roles');
        
        return response()->json([
            'message' => 'User updated successfully',
            'user' => $user
        ]);
    }
    
    /**
     * Remove the specified user.
     */
    public function destroy(User $user): JsonResponse
    {
        // Prevent deleting the last admin user
        if ($user->hasRole('admin')) {
            $adminCount = User::whereHas('roles', function ($query) {
                $query->where('name', 'admin');
            })->where('is_active', true)->count();
            
            if ($adminCount <= 1) {
                return response()->json([
                    'message' => 'Cannot delete the last admin user'
                ], 422);
            }
        }
        
        $user->roles()->detach();
        $user->delete();
        
        return response()->json([
            'message' => 'User deleted successfully'
        ]);
    }
    
    /**
     * Toggle user status (active/inactive).
     */
    public function toggleStatus(User $user): JsonResponse
    {
        // Prevent deactivating the last admin user
        if ($user->hasRole('admin') && $user->is_active) {
            $activeAdminCount = User::whereHas('roles', function ($query) {
                $query->where('name', 'admin');
            })->where('is_active', true)->count();
            
            if ($activeAdminCount <= 1) {
                return response()->json([
                    'message' => 'Cannot deactivate the last admin user'
                ], 422);
            }
        }
        
        $user->update(['is_active' => !$user->is_active]);
        $user->load('roles');
        
        return response()->json([
            'message' => 'User status updated successfully',
            'user' => $user
        ]);
    }
    
    /**
     * Get available roles for user assignment.
     */
    public function getRoles(): JsonResponse
    {
        $roles = Role::active()->get(['id', 'name', 'description']);
        return response()->json($roles);
    }
}
