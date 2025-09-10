import TwoFactorController from '@/actions/App/Http/Controllers/Auth/TwoFactorController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { Form, Head } from '@inertiajs/react';
import { LoaderCircle, Shield, ShieldCheck } from 'lucide-react';

interface TwoFactorProps {
    qrCodeUrl: string;
    secret: string;
    enabled: boolean;
    issuerName: string;
    username: string;
}

export default function TwoFactor({ qrCodeUrl, secret, enabled, issuerName, username }: TwoFactorProps) {
    return (
        <AppLayout>
            <Head title="Two-Factor Authentication" />
            <SettingsLayout>
                <div className="space-y-6">
                    <Heading>Two-Factor Authentication</Heading>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            {enabled ? (
                                <ShieldCheck className="h-5 w-5 text-green-600" />
                            ) : (
                                <Shield className="h-5 w-5 text-gray-400" />
                            )}
                            Google 2FA
                        </CardTitle>
                        <CardDescription>
                            {enabled 
                                ? 'Two-factor authentication is currently enabled for your account.'
                                : 'Add an extra layer of security to your account by enabling two-factor authentication.'
                            }
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-6">
                        {!enabled && (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <h4 className="font-medium">Step 1: Scan QR Code</h4>
                                    <p className="text-sm text-muted-foreground">
                                        Scan this QR code with your Google Authenticator app or any compatible TOTP app. It will appear as "{issuerName}: {username}" in your authenticator.
                                    </p>
                                    <div className="flex justify-center p-4 bg-white rounded-lg border">
                                        <img 
                                            src="/settings/two-factor/qr-code" 
                                            alt="2FA QR Code" 
                                            className="block"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <h4 className="font-medium">Step 2: Enter Secret Key (Optional)</h4>
                                    <p className="text-sm text-muted-foreground">
                                        If you can't scan the QR code, you can manually enter this secret key:
                                    </p>
                                    <code className="block p-2 bg-gray-100 rounded text-sm font-mono break-all">
                                        {secret}
                                    </code>
                                </div>

                                <div className="space-y-2">
                                    <h4 className="font-medium">Step 3: Verify Setup</h4>
                                    <p className="text-sm text-muted-foreground">
                                        Enter the 6-digit code from your authenticator app to enable 2FA:
                                    </p>
                                    
                                    <Form {...TwoFactorController.enable.form()}>
                                        {({ processing, errors }) => (
                                            <div className="flex gap-3">
                                                <div className="flex-1">
                                                    <Input
                                                        type="text"
                                                        name="token"
                                                        placeholder="000000"
                                                        maxLength={6}
                                                        className="text-center tracking-widest"
                                                        autoComplete="off"
                                                    />
                                                    <InputError message={errors.token} className="mt-1" />
                                                </div>
                                                <Button type="submit" disabled={processing}>
                                                    {processing && <LoaderCircle className="h-4 w-4 animate-spin mr-2" />}
                                                    Enable 2FA
                                                </Button>
                                            </div>
                                        )}
                                    </Form>
                                </div>
                            </div>
                        )}

                        {enabled && (
                            <div className="space-y-4">
                                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <ShieldCheck className="h-5 w-5 text-green-600" />
                                        <span className="font-medium text-green-800">2FA is enabled</span>
                                    </div>
                                    <p className="text-sm text-green-700 mt-1">
                                        Your account is protected with two-factor authentication.
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <h4 className="font-medium">Disable Two-Factor Authentication</h4>
                                    <p className="text-sm text-muted-foreground">
                                        Enter a code from your authenticator app to disable 2FA:
                                    </p>
                                    
                                    <Form {...TwoFactorController.disable.form()}>
                                        {({ processing, errors }) => (
                                            <div className="flex gap-3">
                                                <div className="flex-1">
                                                    <Input
                                                        type="text"
                                                        name="token"
                                                        placeholder="000000"
                                                        maxLength={6}
                                                        className="text-center tracking-widest"
                                                        autoComplete="off"
                                                    />
                                                    <InputError message={errors.token} className="mt-1" />
                                                </div>
                                                <Button type="submit" variant="destructive" disabled={processing}>
                                                    {processing && <LoaderCircle className="h-4 w-4 animate-spin mr-2" />}
                                                    Disable 2FA
                                                </Button>
                                            </div>
                                        )}
                                    </Form>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
