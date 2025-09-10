<?php

namespace Database\Seeders;

use App\Models\Role;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create Admin Role
        Role::firstOrCreate(
            ['name' => 'admin'],
            [
                'description' => 'Administrator with full access to all system features',
                'permissions' => Role::getDefaultPermissions('admin'),
                'is_active' => true,
            ]
        );
        
        // Create User Role
        Role::firstOrCreate(
            ['name' => 'user'],
            [
                'description' => 'Regular user with limited access to system features',
                'permissions' => Role::getDefaultPermissions('user'),
                'is_active' => true,
            ]
        );
        
        $this->command->info('Default roles created successfully!');
    }
}
