import { DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { UserInfo } from '@/components/user-info';
import { useMobileNavigation } from '@/hooks/use-mobile-navigation';
import { edit } from '@/routes/profile';
import { type User } from '@/types';
import { Link, router } from '@inertiajs/react';
import { LogOut, Settings } from 'lucide-react';

interface UserMenuContentProps {
    user: User;
}

export function UserMenuContent({ user }: UserMenuContentProps) {
    const cleanup = useMobileNavigation();

    // Helper function to clear all cookies
    const clearAllCookies = () => {
        document.cookie.split(';').forEach(cookie => {
            const eqPos = cookie.indexOf('=');
            const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
            // Clear the cookie by setting it to expire in the past
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.viruz.test`;
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
        });
    };
    
    const handleLogout = () => {
        cleanup();
        
        // Clear any cached CSRF tokens
        const csrfMetaTag = document.head.querySelector('meta[name="csrf-token"]');
        if (csrfMetaTag) {
            csrfMetaTag.setAttribute('content', '');
        }
        
        // Perform logout with proper error handling
        router.post('/logout', {}, {
            onSuccess: () => {
                // Clear all cookies before redirecting
                clearAllCookies();
                // Force a full page reload after successful logout to clear all cached data
                window.location.href = '/login';
            },
            onError: (errors) => {
                console.error('Logout error:', errors);
                // Even if there's an error, clear cookies and redirect to login
                clearAllCookies();
                window.location.href = '/login';
            }
        });
    };

    return (
        <>
            <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <UserInfo user={user} showEmail={true} />
                </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
                <DropdownMenuItem asChild>
                    <Link className="block w-full" href={edit()} as="button" prefetch onClick={cleanup}>
                        <Settings className="mr-2" />
                        Settings
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2" />
                Log out
            </DropdownMenuItem>
        </>
    );
}
