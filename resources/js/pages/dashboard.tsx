import React from 'react';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import DashboardPage from '@/components/dashboard/DashboardPage';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
];

export default function Dashboard() {
    const [refreshTrigger, setRefreshTrigger] = React.useState(0);
    
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-8 overflow-x-auto rounded-xl p-4">
                {/* Unified Dashboard with Single Refresh */}
                <DashboardPage 
                    className="w-full"
                    autoRefreshInterval={300000} // Refresh every 5 minutes
                    onRefresh={() => setRefreshTrigger(prev => prev + 1)}
                />
            </div>
        </AppLayout>
    );
}
