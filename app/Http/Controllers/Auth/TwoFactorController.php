<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use PragmaRX\Google2FA\Google2FA;
use BaconQrCode\Renderer\ImageRenderer;
use BaconQrCode\Renderer\Image\SvgImageBackEnd;
use BaconQrCode\Renderer\RendererStyle\RendererStyle;
use BaconQrCode\Writer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class TwoFactorController extends Controller
{
    /**
     * Show the 2FA setup page
     */
    public function show()
    {
        $user = Auth::user();
        
        if (!$user->google2fa_secret) {
            $user->generateGoogle2faSecret();
        }
        
        $qrCodeUrl = $user->getGoogle2faQrCodeUrl();
        
        return Inertia::render('settings/two-factor', [
            'qrCodeUrl' => $qrCodeUrl,
            'secret' => $user->google2fa_secret,
            'enabled' => $user->google2fa_enabled,
            'issuerName' => config('app.name'),
            'username' => $user->username,
        ]);
    }
    
    /**
     * Generate QR code image
     */
    public function qrCode()
    {
        $user = Auth::user();
        
        if (!$user->google2fa_secret) {
            $user->generateGoogle2faSecret();
        }
        
        // Get the QR code URL from Google2FA
        $qrCodeUrl = $user->getGoogle2faQrCodeUrl();
        
        // Generate QR code using BaconQRCode as recommended in documentation
        $writer = new Writer(
            new ImageRenderer(
                new RendererStyle(400),
                new SvgImageBackEnd()
            )
        );
        
        $qrCodeSvg = $writer->writeString($qrCodeUrl);
        
        return response($qrCodeSvg)
            ->header('Content-Type', 'image/svg+xml');
    }
    
    /**
     * Enable 2FA with enhanced security validation
     */
    public function enable(Request $request)
    {
        $request->validate([
            'token' => 'required|string|min:6|max:6',
        ]);
        
        $user = Auth::user();
        
        // Ensure user has a secret key
        if (!$user->google2fa_secret) {
            return back()->withErrors([
                'token' => 'No 2FA secret found. Please refresh the page and try again.'
            ]);
        }
        
        // Verify with extended window for initial setup
        if (!$user->verifyGoogle2faToken($request->token)) {
            return back()->withErrors([
                'token' => 'The provided token is invalid. Please ensure your authenticator app is synced and try again.'
            ]);
        }
        
        $user->update(['google2fa_enabled' => true]);
        
        return redirect()->back()->with('success', '2FA has been enabled successfully with enhanced security features.');
    }
    
    /**
     * Disable 2FA with security confirmation
     */
    public function disable(Request $request)
    {
        $request->validate([
            'token' => 'required|string|min:6|max:6',
        ]);
        
        $user = Auth::user();
        
        if (!$user->verifyGoogle2faToken($request->token)) {
            return back()->withErrors([
                'token' => 'The provided token is invalid. Please ensure your authenticator app is synced.'
            ]);
        }
        
        $user->update([
            'google2fa_enabled' => false,
            'google2fa_secret' => null,
        ]);
        
        return redirect()->back()->with('success', '2FA has been disabled. Your account security has been reduced.');
    }
    
    /**
     * Show 2FA verification page during login
     */
    public function verify()
    {
        if (!session('2fa_user_id')) {
            return redirect()->route('login');
        }
        
        return Inertia::render('auth/two-factor-verify');
    }
    
    /**
     * Verify 2FA token during login
     */
    public function verifyToken(Request $request)
    {
        $request->validate([
            'token' => 'required|string|min:6|max:6',
        ]);
        
        $userId = session('2fa_user_id');
        if (!$userId) {
            return redirect()->route('login');
        }
        
        $user = \App\Models\User::find($userId);
        
        if (!$user || !$user->verifyGoogle2faToken($request->token)) {
            return back()->withErrors([
                'token' => 'The provided token is invalid.'
            ]);
        }
        
        // Complete the login
        Auth::login($user, session('2fa_remember', false));
        session()->forget(['2fa_user_id', '2fa_remember']);
        
        return redirect()->intended(route('dashboard'));
    }
    
    /**
     * Regenerate 2FA secret with enhanced security (for existing users)
     */
    public function regenerateSecret(Request $request)
    {
        $user = Auth::user();
        
        // If 2FA is currently enabled, require current token to regenerate
        if ($user->google2fa_enabled) {
            $request->validate([
                'current_token' => 'required|string|min:6|max:6',
            ]);
            
            if (!$user->verifyGoogle2faToken($request->current_token)) {
                return back()->withErrors([
                    'current_token' => 'Current 2FA token is invalid.'
                ]);
            }
        }
        
        // Generate new secure secret
        $user->generateGoogle2faSecret();
        
        // Disable 2FA since they need to set it up again with new secret
        $user->update(['google2fa_enabled' => false]);
        
        return redirect()->back()->with('success', 'New 2FA secret generated. Please set up your authenticator app again.');
    }
}
