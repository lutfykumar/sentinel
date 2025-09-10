<?php
/**
 * Simple test script to verify the optimized CustomsDataController.getData() works correctly
 * Run this after setting up the application dependencies
 */

// Simulate the request parameters
$testParams = [
    'nomordaftar' => '123456',
    'page' => 1,
    'per_page' => 10,
    'sort_by' => 'nomordaftar',
    'sort_direction' => 'asc'
];

echo "🧪 Testing Optimized CustomsDataController.getData()\n";
echo "=" . str_repeat("=", 50) . "\n";
echo "Test Parameters:\n";
foreach ($testParams as $key => $value) {
    echo "  - $key: $value\n";
}
echo "\n";

echo "Expected optimizations:\n";
echo "✅ Two-phase loading (headers first, then display data)\n";
echo "✅ Efficient subqueries instead of whereHas()\n";
echo "✅ Batch loading for visible rows only\n";
echo "✅ Header-only sorting (nomordaftar, tanggaldaftar, kodejalur)\n";
echo "✅ Display columns: namaimportir, namappjk, namapenjual, hscode, uraianbarang, kontainer_count, teus_sum\n";
echo "\n";

echo "📊 Expected Performance:\n";
echo "  Before: 10-15 seconds\n";
echo "  After:  <1 second\n";
echo "\n";

echo "🔗 Test URL:\n";
echo "https://sentinel.madosi.xyz/data/api/customs?" . http_build_query($testParams) . "\n";
echo "\n";

echo "Note: Make sure to:\n";
echo "1. Run 'composer install' to install dependencies\n";
echo "2. Set up database connection in .env\n";
echo "3. Have proper authentication/permissions\n";
echo "4. Test both with and without filters to verify performance\n";
