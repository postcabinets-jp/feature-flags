"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

interface OrgMember {
  organizations: { id: string; name: string; slug: string } | null;
  role: string;
}

interface SidebarProps {
  orgs: OrgMember[];
}

export default function Sidebar({ orgs }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const currentOrg = orgs[0]?.organizations;

  const navItems = currentOrg
    ? [
        {
          label: "Dashboard",
          href: "/dashboard",
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
          ),
        },
        {
          label: "Settings",
          href: `/${currentOrg.slug}/settings`,
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          ),
        },
      ]
    : [{ label: "Dashboard", href: "/dashboard", icon: null }];

  return (
    <aside
      className={`${
        collapsed ? "w-16" : "w-56"
      } bg-white border-r border-gray-200 flex flex-col transition-all duration-200 shrink-0`}
    >
      {/* Logo */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-gray-200">
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gray-900 rounded-lg flex items-center justify-center shrink-0">
              <span className="text-white text-xs font-bold">FF</span>
            </div>
            <span className="font-semibold text-sm text-gray-900">feature-flags</span>
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={collapsed ? "M9 5l7 7-7 7" : "M15 19l-7-7 7-7"} />
          </svg>
        </button>
      </div>

      {/* Organization selector */}
      {!collapsed && currentOrg && (
        <div className="px-3 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-gray-50">
            <div className="w-6 h-6 bg-gray-200 rounded flex items-center justify-center shrink-0">
              <span className="text-gray-600 text-xs font-semibold">
                {currentOrg.name[0]}
              </span>
            </div>
            <span className="text-xs font-medium text-gray-700 truncate">{currentOrg.name}</span>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? "bg-gray-900 text-white"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
              title={collapsed ? item.label : undefined}
            >
              {item.icon}
              {!collapsed && item.label}
            </Link>
          );
        })}
      </nav>

      {/* Projects list */}
      {!collapsed && currentOrg && (
        <div className="px-3 pb-3">
          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-2 text-xs text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            ホームに戻る
          </Link>
        </div>
      )}
    </aside>
  );
}
