<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class CheckUserStatus
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (auth()->check()) {
            $user = auth()->user();
            
            // Check if user is active
            if (!$user->isActive()) {
                Auth::logout(); // Logout inactive user immediately
                
                // Clear the session
                $request->session()->invalidate();
                $request->session()->regenerateToken();
                
                // Always redirect to login with error message for inactive users
                return redirect()->route('login')
                    ->with('error', 'Your account is inactive. Please contact an administrator.');
            }
        }
        
        return $next($request);
    }
}
