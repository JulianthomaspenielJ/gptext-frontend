import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { NotificationCenter } from "./NotificationCenter";
import { QuickSearch } from "./QuickSearch";
import {
  Bell,
  Settings,
  LogOut,
  User as UserIcon,
  Menu,
  Search,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import Proceaselogo from "../../public/assets/Procease_Logo_PNG.png";

interface HeaderProps {
  toggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };

    document.addEventListener("keydown", handleKeyboard);
    return () => document.removeEventListener("keydown", handleKeyboard);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 h-16 border-b bg-white px-3 xs:px-4 md:px-6 flex items-center justify-between z-50">
      <div className="flex items-center space-x-3 xs:space-x-4 min-w-0 flex-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="h-8 w-8 xs:h-10 xs:w-10 shrink-0"
        >
          <Menu className="h-4 w-4 xs:h-5 xs:w-5" />
        </Button>
        <img
          // src="https://cdn.builder.io/api/v1/image/assets%2F70d3db38063a473b8175d0ca5e5fc053%2F8b64343d72054b81a6144258981e3541?format=webp&width=800"
          // src="https://gpt.procease.co/Procease_Logo_PNG.png"
          src={Proceaselogo}
          alt="Textile"
          className="h-8 xs:h-8 w-auto shrink-0"
        />
        <div className="hidden sm:block min-w-0">
          <h1 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
            Textile Production ERP
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 truncate">
            Production Management System
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-1 xs:space-x-2 sm:space-x-4 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsSearchOpen(true)}
          title="Search (Ctrl+K)"
          className="h-8 w-8 xs:h-10 xs:w-10 hidden xs:flex"
        >
          <Search className="h-4 w-4 xs:h-5 xs:w-5" />
        </Button>
        <div className="hidden xs:block">
          <NotificationCenter />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center space-x-1 xs:space-x-2 px-1 xs:px-3"
            >
              <Avatar className="h-6 w-6 xs:h-8 xs:w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs xs:text-sm">
                  {user?.name
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("") || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium">{user?.name}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem>
              <UserIcon className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-red-600">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <QuickSearch isOpen={isSearchOpen} setIsOpen={setIsSearchOpen} />
    </header>
  );
};
