<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
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
            if ($request->expectsJson() || $request->header('X-Inertia')) {
                return response()->json(['message' => 'Unauthenticated'], 401);
            }
            return redirect()->route('login');
        }
        
        $user = auth()->user();
        
        // Check if user is active
        if (!$user->isActive()) {
            Auth::logout(); // Logout inactive user
            
            if ($request->expectsJson() || $request->header('X-Inertia')) {
                return redirect()->route('login')
                    ->with('error', 'Your account is inactive. Please contact an administrator.');
            }
            return redirect()->route('login')
                ->with('error', 'Your account is inactive. Please contact an administrator.');
        }
        
        // Check if user has any of the required roles
        if (!empty($roles) && !$user->hasAnyRole($roles)) {
            if ($request->expectsJson() || $request->header('X-Inertia')) {
                return redirect()->route('dashboard')
                    ->with('error', 'You do not have permission to access this page.');
            }
            return redirect()->route('dashboard')
                ->with('error', 'You do not have permission to access this page.');
        }
        
        return $next($request);
    }
}
