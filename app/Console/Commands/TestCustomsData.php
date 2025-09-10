<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\BC20\BC20Header;

class TestCustomsData extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'test:customs-data';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Test customs data connection and basic functionality';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Testing BC20 database connection and models...');

        try {
            // Test basic connection
            $count = BC20Header::count();
            $this->info("Total BC20 header records: {$count}");

            if ($count > 0) {
                // Test a basic query
                $sample = BC20Header::select(['idheader', 'nomordaftar', 'tanggaldaftar', 'namaperusahaan'])
                    ->limit(5)
                    ->get();

                $this->info("Sample records:");
                foreach ($sample as $record) {
                    $this->line("- {$record->nomordaftar} | {$record->tanggaldaftar} | {$record->namaperusahaan}");
                }

                // Test relationships
                $this->info("\nTesting relationships...");
                $headerWithData = BC20Header::with('data')->first();
                if ($headerWithData && $headerWithData->data) {
                    $this->info("✓ BC20Header -> BC20Data relationship working");
                } else {
                    $this->warn("⚠ BC20Header -> BC20Data relationship has no data");
                }

                $this->info("\n✅ All tests passed! The customs data system is ready.");
            } else {
                $this->warn("⚠ No data found in bc20_header table. Please ensure your database is populated.");
            }

        } catch (\Exception $e) {
            $this->error("❌ Database connection failed: " . $e->getMessage());
            return 1;
        }

        return 0;
    }
}
