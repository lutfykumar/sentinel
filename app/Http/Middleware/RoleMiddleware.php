<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        if (!auth()->check()) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }
        
        $user = auth()->user();
        
        // Check if user is active
        if (!$user->isActive()) {
            return response()->json(['message' => 'Account is inactive'], 403);
        }
        
        // Check if user has any of the required roles
        if (!empty($roles) && !$user->hasAnyRole($roles)) {
            return response()->json(['message' => 'Insufficient permissions'], 403);
        }
        
        return $next($request);
    }
}
