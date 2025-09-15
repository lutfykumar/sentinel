<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    /**
     * Show the login page.
     */
    public function create(Request $request): Response
    {
        return Inertia::render('auth/login', [
            'status' => $request->session()->get('status'),
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        $request->authenticate(); // This now includes user status check
        
        $user = Auth::user();
        
        // If user has 2FA enabled, logout and redirect to 2FA verification
        if ($user->google2fa_enabled) {
            Auth::logout();
            
            // Store user ID and remember flag in session for 2FA verification
            $request->session()->put([
                '2fa_user_id' => $user->id,
                '2fa_remember' => $request->boolean('remember'),
            ]);
            
            return redirect()->route('2fa.verify');
        }

        $request->session()->regenerate();

        return redirect()->intended(route('dashboard', absolute: false));
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        // Clear the user's authentication
        Auth::guard('web')->logout();

        // Invalidate the session to prevent session fixation
        $request->session()->invalidate();
        
        // Regenerate the CSRF token
        $request->session()->regenerateToken();
        
        // Clear all session data
        $request->session()->flush();
        
        // Create a fresh session with a success message
        $request->session()->flash('status', 'You have been logged out successfully.');

        return redirect()->route('login');
    }
}
