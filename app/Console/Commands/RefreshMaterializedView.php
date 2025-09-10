<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class RefreshMaterializedView extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'materialized-view:refresh 
                           {view? : The name of the materialized view to refresh}
                           {--schema=customs : The schema containing the materialized view}
                           {--all : Refresh all materialized views in the schema}';

    /**
     * The console command description.
     */
    protected $description = 'Refresh PostgreSQL materialized views';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $schema = $this->option('schema');
        $viewName = $this->argument('view');
        $refreshAll = $this->option('all');

        try {
            if ($refreshAll) {
                $this->refreshAllViews($schema);
            } elseif ($viewName) {
                $this->refreshSingleView($schema, $viewName);
            } else {
                // Default to refreshing the bc20_globe view
                $this->refreshSingleView($schema, 'bc20_globe');
            }

            return Command::SUCCESS;
        } catch (\Exception $e) {
            $this->error('Error refreshing materialized view: ' . $e->getMessage());
            Log::error('Materialized view refresh failed: ' . $e->getMessage());
            return Command::FAILURE;
        }
    }

    /**
     * Refresh a single materialized view
     */
    private function refreshSingleView(string $schema, string $viewName): void
    {
        $fullViewName = "{$schema}.{$viewName}";
        
        $this->info("Refreshing materialized view: {$fullViewName}");
        
        $startTime = microtime(true);
        
        // Check if the view exists
        $viewExists = DB::select("
            SELECT 1 FROM pg_matviews 
            WHERE schemaname = ? AND matviewname = ?
        ", [$schema, $viewName]);

        if (empty($viewExists)) {
            throw new \Exception("Materialized view {$fullViewName} not found");
        }

        // Refresh the materialized view
        DB::statement("REFRESH MATERIALIZED VIEW {$fullViewName}");
        
        $endTime = microtime(true);
        $duration = round(($endTime - $startTime), 2);
        
        $this->info("✅ Materialized view {$fullViewName} refreshed successfully in {$duration} seconds");
        
        // Get view statistics
        $stats = DB::select("
            SELECT 
                schemaname,
                matviewname,
                CASE 
                    WHEN ispopulated THEN 'populated' 
                    ELSE 'not populated' 
                END as status,
                pg_size_pretty(pg_total_relation_size(schemaname||'.'||matviewname)) as size
            FROM pg_matviews 
            WHERE schemaname = ? AND matviewname = ?
        ", [$schema, $viewName]);

        if (!empty($stats)) {
            $stat = $stats[0];
            $this->table(
                ['Schema', 'View', 'Status', 'Size'],
                [[$stat->schemaname, $stat->matviewname, $stat->status, $stat->size]]
            );
        }

        Log::info("Materialized view {$fullViewName} refreshed successfully in {$duration} seconds");
    }

    /**
     * Refresh all materialized views in a schema
     */
    private function refreshAllViews(string $schema): void
    {
        $this->info("Refreshing all materialized views in schema: {$schema}");
        
        // Get all materialized views in the schema
        $views = DB::select("
            SELECT matviewname 
            FROM pg_matviews 
            WHERE schemaname = ?
            ORDER BY matviewname
        ", [$schema]);

        if (empty($views)) {
            $this->warn("No materialized views found in schema: {$schema}");
            return;
        }

        $this->info("Found " . count($views) . " materialized views to refresh");

        $totalStartTime = microtime(true);
        $refreshedCount = 0;

        foreach ($views as $view) {
            try {
                $this->refreshSingleView($schema, $view->matviewname);
                $refreshedCount++;
            } catch (\Exception $e) {
                $this->error("Failed to refresh {$schema}.{$view->matviewname}: " . $e->getMessage());
            }
        }

        $totalEndTime = microtime(true);
        $totalDuration = round(($totalEndTime - $totalStartTime), 2);

        $this->info("✅ Refreshed {$refreshedCount} out of " . count($views) . " materialized views in {$totalDuration} seconds");
    }
}
