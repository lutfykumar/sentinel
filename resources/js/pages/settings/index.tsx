import Heading from '@/components/heading';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { Head } from '@inertiajs/react';

export default function SettingsIndex() {
    return (
        <AppLayout>
            <Head title="Settings" />
            <SettingsLayout>
                <div className="space-y-6">
                    <div>
                        <h3 className="text-lg font-medium">Welcome to Settings</h3>
                        <p className="text-sm text-muted-foreground">
                            Use the navigation on the left to manage your profile, password, two-factor authentication, and appearance settings.
                        </p>
                    </div>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
