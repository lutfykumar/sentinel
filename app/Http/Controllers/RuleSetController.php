<?php

namespace App\Http\Controllers;

use App\Models\RuleSet;
use App\Models\BC20\BC20Header;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class RuleSetController extends Controller
{
    /**
     * Display the Rule Set page
     */
    public function index()
    {
        return Inertia::render('data/RuleSet');
    }

    /**
     * Get user's accessible rule sets
     */
    public function getRuleSets(Request $request): JsonResponse
    {
        $userId = Auth::id();
        
        $ruleSets = RuleSet::accessibleByUser($userId)
            ->orderBy('created_at', 'desc')
            ->get();
            
        return response()->json($ruleSets);
    }

    /**
     * Store a new rule set
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'rules' => 'required|array',
            'is_public' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $ruleSet = RuleSet::create([
            'name' => $request->name,
            'description' => $request->description,
            'rules' => $request->rules,
            'user_id' => Auth::id(),
            'is_public' => $request->get('is_public', false),
        ]);

        return response()->json([
            'message' => 'Rule set created successfully',
            'rule_set' => $ruleSet
        ], 201);
    }

    /**
     * Get a specific rule set
     */
    public function show(RuleSet $ruleset): JsonResponse
    {
        $userId = Auth::id();
        
        // Check if user can access this rule set
        if ($ruleset->user_id !== $userId && !$ruleset->is_public) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json($ruleset);
    }

    /**
     * Update a rule set
     */
    public function update(Request $request, RuleSet $ruleset): JsonResponse
    {
        $userId = Auth::id();
        
        // Only owner can update
        if ($ruleset->user_id !== $userId) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'rules' => 'required|array',
            'is_public' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $ruleset->update([
            'name' => $request->name,
            'description' => $request->description,
            'rules' => $request->rules,
            'is_public' => $request->get('is_public', $ruleset->is_public),
        ]);

        return response()->json([
            'message' => 'Rule set updated successfully',
            'rule_set' => $ruleset
        ]);
    }

    /**
     * Delete a rule set
     */
    public function destroy(RuleSet $ruleset): JsonResponse
    {
        $userId = Auth::id();
        
        // Only owner can delete
        if ($ruleset->user_id !== $userId) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $ruleset->delete();

        return response()->json([
            'message' => 'Rule set deleted successfully'
        ]);
    }

    /**
     * Get all rule sets (admin only)
     */
    public function adminIndex(Request $request): JsonResponse
    {
        $ruleSets = RuleSet::forAdmin()
            ->orderBy('created_at', 'desc')
            ->paginate($request->get('per_page', 15));
            
        return response()->json($ruleSets);
    }
    
    /**
     * Execute a query for RuleSet page (use dedicated RuleSetQueryController)
     */
    public function executeQuery(Request $request)
    {
        // Delegate to dedicated RuleSetQueryController for advanced query builder
        $rulesetQueryController = new \App\Http\Controllers\RuleSetQueryController();
        return $rulesetQueryController->executeQuery($request);
    }
    
    /**
     * Get detail for a specific record (use dedicated RuleSetQueryController)
     */
    public function getDetail($idheader)
    {
        // Delegate to dedicated RuleSetQueryController
        $rulesetQueryController = new \App\Http\Controllers\RuleSetQueryController();
        return $rulesetQueryController->getDetail($idheader);
    }
}
