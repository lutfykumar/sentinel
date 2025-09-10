<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Exception;

class RefreshDashboardViews extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'dashboard:refresh-views {--view=all : Specify which view to refresh (all, summary, monthly)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Refresh materialized views for dashboard data (bc20_jumlahdok and bc20_jumlahdok_bulan)';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $view = $this->option('view');

        try {
            switch ($view) {
                case 'summary':
                    $this->refreshDocumentSummaryView();
                    break;
                case 'monthly':
                    $this->refreshMonthlyDocumentsView();
                    break;
                case 'all':
                default:
                    $this->refreshAllViews();
                    break;
            }
            
            return Command::SUCCESS;
        } catch (Exception $e) {
            $this->error("Error refreshing materialized views: {$e->getMessage()}");
            return Command::FAILURE;
        }
    }

    /**
     * Refresh bc20_jumlahdok materialized view
     */
    protected function refreshDocumentSummaryView(): void
    {
        $this->info('Refreshing bc20_jumlahdok materialized view...');
        
        $startTime = microtime(true);
        DB::statement('REFRESH MATERIALIZED VIEW bc20_jumlahdok');
        $duration = round((microtime(true) - $startTime) * 1000, 2);
        
        $this->info("✓ bc20_jumlahdok refreshed successfully in {$duration}ms");
    }

    /**
     * Refresh bc20_jumlahdok_bulan materialized view
     */
    protected function refreshMonthlyDocumentsView(): void
    {
        $this->info('Refreshing bc20_jumlahdok_bulan materialized view...');
        
        $startTime = microtime(true);
        DB::statement('REFRESH MATERIALIZED VIEW bc20_jumlahdok_bulan');
        $duration = round((microtime(true) - $startTime) * 1000, 2);
        
        $this->info("✓ bc20_jumlahdok_bulan refreshed successfully in {$duration}ms");
    }

    /**
     * Refresh all dashboard materialized views
     */
    protected function refreshAllViews(): void
    {
        $this->info('Refreshing all dashboard materialized views...');
        
        $totalStartTime = microtime(true);
        
        // Refresh document summary view
        $this->refreshDocumentSummaryView();
        
        // Refresh monthly documents view
        $this->refreshMonthlyDocumentsView();
        
        $totalDuration = round((microtime(true) - $totalStartTime) * 1000, 2);
        
        $this->newLine();
        $this->info("🎉 All dashboard materialized views refreshed successfully!");
        $this->info("Total time: {$totalDuration}ms");
    }
}
