"use client";

import { ReactNode, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SidebarLink {
  href: string;
  label: string;
  icon: ReactNode;
  onClick?: () => void;
}

interface SidebarProps {
  links: SidebarLink[];
  isOpen?: boolean;
  toggleSidebar?: () => void;
}

export default function Sidebar({ links, isOpen = false, toggleSidebar }: SidebarProps) {
  const pathname = usePathname();

  // Close sidebar on path change (mobile)
  useEffect(() => {
    if (typeof toggleSidebar === 'function' && isOpen) {
      toggleSidebar();
    }
  }, [pathname, toggleSidebar, isOpen]);

  return (
    <div className="h-full overflow-y-auto px-3 py-4">
      <nav className="space-y-1">
        {links.map((link, index) => (
          link.onClick ? (
            <button
              key={index}
              onClick={link.onClick}
              className={`flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-violet-600`}
            >
              <span className="mr-3">{link.icon}</span>
              {link.label}
            </button>
          ) : (
            <Link
              key={index}
              href={link.href}
              className={`flex items-center rounded-lg px-3 py-2 text-sm font-medium ${
                pathname === link.href
                  ? "bg-violet-100 text-violet-600"
                  : "text-gray-700 hover:bg-gray-100 hover:text-violet-600"
              }`}
            >
              <span className="mr-3">{link.icon}</span>
              {link.label}
            </Link>
          )
        ))}
      </nav>
    </div>
  );
} 