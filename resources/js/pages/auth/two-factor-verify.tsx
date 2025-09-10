import TwoFactorController from '@/actions/App/Http/Controllers/Auth/TwoFactorController';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';
import { Form, Head } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';

export default function TwoFactorVerify() {
    return (
        <AuthLayout title="Two-Factor Authentication" description="Enter the 6-digit code from your authenticator app">
            <Head title="Two-Factor Authentication" />

            <Form {...TwoFactorController.verifyToken.form()} className="flex flex-col gap-6">
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="token">Authentication Code</Label>
                                <Input
                                    id="token"
                                    type="text"
                                    name="token"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="off"
                                    placeholder="000000"
                                    maxLength={6}
                                    className="text-center tracking-widest"
                                />
                                <InputError message={errors.token} />
                            </div>

                            <Button type="submit" className="mt-4 w-full" tabIndex={2} disabled={processing}>
                                {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                                Verify Code
                            </Button>
                        </div>

                        <div className="text-center text-sm text-muted-foreground">
                            Enter the 6-digit code from your Google Authenticator app
                        </div>
                    </>
                )}
            </Form>
        </AuthLayout>
    );
}
