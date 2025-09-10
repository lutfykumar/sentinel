<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use PragmaRX\Google2FA\Google2FA;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'username',
        'email',
        'password',
        'google2fa_secret',
        'google2fa_enabled',
        'is_active',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
        'google2fa_secret',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'google2fa_enabled' => 'boolean',
            'is_active' => 'boolean',
        ];
    }
    
    /**
     * Generate a new 2FA secret with ultra-enhanced security (64-byte)
     */
    public function generateGoogle2faSecret(): string
    {
        $google2fa = new Google2FA();
        
        try {
            // Use 64 bytes for maximum security (512-bit) - same as playground
            $secret = $google2fa->generateSecretKey(64);
        } catch (Exception $e) {
            // Fallback to 32 bytes if 64-byte fails
            $secret = $google2fa->generateSecretKey(32);
        }
        
        $this->update(['google2fa_secret' => $secret]);
        return $secret;
    }
    
    /**
     * Get the 2FA QR code URL
     */
    public function getGoogle2faQrCodeUrl(): string
    {
        $google2fa = new Google2FA();
        $issuerName = config('app.name');  // App name (shows as issuer)
        $accountIdentifier = $this->username;  // User's username (shows as account)
        
        return $google2fa->getQRCodeUrl(
            $issuerName,
            $accountIdentifier,
            $this->google2fa_secret
        );
    }
    
    /**
     * Verify a 2FA token with extended window for better user experience
     */
    public function verifyGoogle2faToken(string $token): bool
    {
        if (!$this->google2fa_secret) {
            return false;
        }
        
        $google2fa = new Google2FA();
        
        // Use window of 4 (allows ±2 minutes tolerance)
        // This gives users more time to enter the code while maintaining security
        return $google2fa->verifyKey($this->google2fa_secret, $token, 4);
    }
    
    /**
     * Get the roles that belong to the user.
     */
    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class);
    }
    
    /**
     * Check if the user has a specific role.
     */
    public function hasRole(string $roleName): bool
    {
        return $this->roles()->where('name', $roleName)->exists();
    }
    
    /**
     * Check if the user has any of the given roles.
     */
    public function hasAnyRole(array $roles): bool
    {
        return $this->roles()->whereIn('name', $roles)->exists();
    }
    
    /**
     * Check if the user has a specific permission.
     */
    public function hasPermission(string $permission): bool
    {
        return $this->roles()->get()->some(function ($role) use ($permission) {
            return $role->hasPermission($permission);
        });
    }
    
    /**
     * Assign a role to the user.
     */
    public function assignRole(string|Role $role): self
    {
        if (is_string($role)) {
            $role = Role::where('name', $role)->firstOrFail();
        }
        
        $this->roles()->syncWithoutDetaching($role);
        
        return $this;
    }
    
    /**
     * Remove a role from the user.
     */
    public function removeRole(string|Role $role): self
    {
        if (is_string($role)) {
            $role = Role::where('name', $role)->firstOrFail();
        }
        
        $this->roles()->detach($role);
        
        return $this;
    }
    
    /**
     * Get the user's primary role (first role).
     */
    public function getPrimaryRole(): ?Role
    {
        return $this->roles()->first();
    }
    
    /**
     * Check if the user is active.
     */
    public function isActive(): bool
    {
        return $this->is_active;
    }
    
    /**
     * Scope a query to only include active users.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
