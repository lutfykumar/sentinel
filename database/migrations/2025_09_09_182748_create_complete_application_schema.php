<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * This migration creates all application tables and seeds initial data
     * for fresh VPS deployment. BC20/BC30 tables are external and not included.
     */
    public function up(): void
    {
        // Create users table (if not exists)
        if (!Schema::hasTable('users')) {
            Schema::create('users', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('email')->unique();
                $table->string('username')->unique();
                $table->timestamp('email_verified_at')->nullable();
                $table->string('password');
                $table->boolean('is_active')->default(true);
                $table->rememberToken();
                $table->timestamps();
                
                $table->index(['email', 'is_active']);
                $table->index('username');
            });
        }
        
        // Create roles table (if not exists)
        if (!Schema::hasTable('roles')) {
            Schema::create('roles', function (Blueprint $table) {
                $table->id();
                $table->string('name')->unique();
                $table->string('description')->nullable();
                $table->json('permissions')->nullable();
                $table->boolean('is_active')->default(true);
                $table->timestamps();
                
                $table->index(['name', 'is_active']);
            });
        }
        
        // Create role_user pivot table (if not exists)
        if (!Schema::hasTable('role_user')) {
            Schema::create('role_user', function (Blueprint $table) {
                $table->id();
                $table->foreignId('role_id')->constrained()->onDelete('cascade');
                $table->foreignId('user_id')->constrained()->onDelete('cascade');
                $table->timestamps();
                
                $table->unique(['role_id', 'user_id']);
                $table->index('user_id');
                $table->index('role_id');
            });
        }
        
        // Create rule_sets table (if not exists)
        if (!Schema::hasTable('rule_sets')) {
            Schema::create('rule_sets', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->text('description')->nullable();
                $table->json('rules'); // Store the react-querybuilder rules JSON
                $table->foreignId('user_id')->constrained()->onDelete('cascade');
                $table->boolean('is_public')->default(false); // For sharing between users
                $table->timestamps();
                
                $table->index(['user_id', 'created_at']);
                $table->index(['is_public', 'name']);
            });
        }
        
        // Create cache table (if not exists)
        if (!Schema::hasTable('cache')) {
            Schema::create('cache', function (Blueprint $table) {
                $table->string('key')->primary();
                $table->mediumText('value');
                $table->integer('expiration');
            });
        }
        
        // Create cache_locks table (if not exists)
        if (!Schema::hasTable('cache_locks')) {
            Schema::create('cache_locks', function (Blueprint $table) {
                $table->string('key')->primary();
                $table->string('owner');
                $table->integer('expiration');
            });
        }
        
        // Create jobs table (if not exists)
        if (!Schema::hasTable('jobs')) {
            Schema::create('jobs', function (Blueprint $table) {
                $table->id();
                $table->string('queue')->index();
                $table->longText('payload');
                $table->unsignedTinyInteger('attempts');
                $table->unsignedInteger('reserved_at')->nullable();
                $table->unsignedInteger('available_at');
                $table->unsignedInteger('created_at');
            });
        }
        
        // Create job_batches table (if not exists)
        if (!Schema::hasTable('job_batches')) {
            Schema::create('job_batches', function (Blueprint $table) {
                $table->string('id')->primary();
                $table->string('name');
                $table->integer('total_jobs');
                $table->integer('pending_jobs');
                $table->integer('failed_jobs');
                $table->longText('failed_job_ids');
                $table->mediumText('options')->nullable();
                $table->integer('cancelled_at')->nullable();
                $table->integer('created_at');
                $table->integer('finished_at')->nullable();
            });
        }
        
        // Create failed_jobs table (if not exists)
        if (!Schema::hasTable('failed_jobs')) {
            Schema::create('failed_jobs', function (Blueprint $table) {
                $table->id();
                $table->string('uuid')->unique();
                $table->text('connection');
                $table->text('queue');
                $table->longText('payload');
                $table->longText('exception');
                $table->timestamp('failed_at')->useCurrent();
            });
        }
        
        // Create sessions table (if not exists)
        if (!Schema::hasTable('sessions')) {
            Schema::create('sessions', function (Blueprint $table) {
                $table->string('id')->primary();
                $table->foreignId('user_id')->nullable()->index();
                $table->string('ip_address', 45)->nullable();
                $table->text('user_agent')->nullable();
                $table->longText('payload');
                $table->integer('last_activity')->index();
            });
        }
        
        // Create password_reset_tokens table (if not exists)
        if (!Schema::hasTable('password_reset_tokens')) {
            Schema::create('password_reset_tokens', function (Blueprint $table) {
                $table->string('email')->primary();
                $table->string('token');
                $table->timestamp('created_at')->nullable();
            });
        }
        
        // Seed initial data
        $this->seedInitialData();
    }
    
    /**
     * Seed initial application data
     */
    private function seedInitialData(): void
    {
        // Create default roles if they don't exist
        if (DB::table('roles')->count() === 0) {
            DB::table('roles')->insert([
                [
                    'name' => 'admin',
                    'description' => 'System Administrator - Full Access',
                    'permissions' => json_encode([
                        'users.*',
                        'roles.*', 
                        'rulesets.*',
                        'exports.*',
                        'dashboard.*'
                    ]),
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'name' => 'user',
                    'description' => 'Regular User - Limited Access',
                    'permissions' => json_encode([
                        'dashboard.view',
                        'rulesets.view',
                        'rulesets.create',
                        'exports.basic'
                    ]),
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'name' => 'viewer',
                    'description' => 'View Only - Read Access',
                    'permissions' => json_encode([
                        'dashboard.view',
                        'rulesets.view'
                    ]),
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            ]);
        }
        
        // Create default admin user if no users exist
        if (DB::table('users')->count() === 0) {
            $adminUserId = DB::table('users')->insertGetId([
                'name' => 'Administrator',
                'email' => 'admin@customs.local',
                'username' => 'admin',
                'email_verified_at' => now(),
                'password' => Hash::make('password'), // Change this in production!
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            
            // Assign admin role to default admin user
            $adminRoleId = DB::table('roles')->where('name', 'admin')->value('id');
            if ($adminRoleId && $adminUserId) {
                DB::table('role_user')->insert([
                    'role_id' => $adminRoleId,
                    'user_id' => $adminUserId,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Drop tables in reverse order (respecting foreign key constraints)
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('sessions');
        Schema::dropIfExists('failed_jobs');
        Schema::dropIfExists('job_batches');
        Schema::dropIfExists('jobs');
        Schema::dropIfExists('cache_locks');
        Schema::dropIfExists('cache');
        Schema::dropIfExists('rule_sets');
        Schema::dropIfExists('role_user');
        Schema::dropIfExists('roles');
        Schema::dropIfExists('users');
        
        // Note: BC20/BC30 tables are external and should not be dropped
    }
};
        Schema::dropIfExists('complete_application_schema');
    }
};
