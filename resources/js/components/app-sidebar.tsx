import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { dashboard, data, company, dataRuleSets, managementUsers, managementRoles } from '@/routes';
import { type NavItem, type NavGroup } from '@/types';
import { Link } from '@inertiajs/react';
import { LayoutGrid, Database, Building2, Users, Shield, Settings } from 'lucide-react';
import AppLogo from './app-logo';
import useAuth from '@/hooks/useAuth';

export function AppSidebar() {
    const { hasPermission, isAdmin } = useAuth();
    
    const platformNavItems: NavItem[] = [
        {
            title: 'Dashboard',
            href: dashboard(),
            icon: LayoutGrid,
        },
    ];
    
    // Add Data section if user has permission
    if (hasPermission('data.view')) {
        platformNavItems.push({
            title: 'Data',
            href: data(),
            icon: Database,
        });
    }
    
    // Add Rule Sets section if user has permission
    if (hasPermission('rulesets.view')) {
        platformNavItems.push({
            title: 'Rule Sets',
            href: dataRuleSets(),
            icon: Settings,
        });
    }
    
    // Add Company section if user has permission
    if (hasPermission('company.view')) {
        platformNavItems.push({
            title: 'Company',
            href: company(),
            icon: Building2,
        });
    }
    
    const managementNavItems: NavItem[] = [];
    
    // Add Management section if user is admin
    if (isAdmin()) {
        managementNavItems.push(
            {
                title: 'Users',
                href: managementUsers(),
                icon: Users,
            },
            {
                title: 'Roles',
                href: managementRoles(),
                icon: Shield,
            }
        );
    }
    
    const navGroups: NavGroup[] = [
        {
            title: 'Platform',
            items: platformNavItems,
        },
    ];
    
    // Add Management group if there are management items
    if (managementNavItems.length > 0) {
        navGroups.push({
            title: 'Management',
            items: managementNavItems,
        });
    }
    
    const footerNavItems: NavItem[] = [];

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                {navGroups.map((group) => (
                    <NavMain key={group.title} title={group.title} items={group.items} />
                ))}
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
