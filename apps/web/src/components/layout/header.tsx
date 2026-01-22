'use client';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';

interface HeaderProps {
  title: string;
  description?: string;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function Header({ title, description }: HeaderProps) {
  const { user, logout } = useAuth();

  const userName = user?.name || 'User';
  const userEmail = user?.email || '';
  const initials = getInitials(userName);

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="flex items-center justify-between h-16 px-6 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm">
      {/* Page Title */}
      <div>
        <h1 className="text-xl font-semibold text-white">{title}</h1>
        {description && <p className="text-sm text-zinc-400">{description}</p>}
      </div>

      {/* Right Side Actions */}
      <div className="">
        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative h-9 w-9 rounded-full ring-2 ring-zinc-800 hover:ring-violet-500/50 transition-all"
            >
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-gradient-to-br from-violet-500 to-indigo-600 text-white text-sm font-medium">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-56 bg-zinc-900 border-zinc-800 text-white"
            align="end"
            forceMount
          >
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium text-white">{userName}</p>
                <p className="text-xs text-zinc-400">{userEmail}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-zinc-800" />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-red-400 focus:bg-zinc-800 focus:text-red-400 cursor-pointer"
            >
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
