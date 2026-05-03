"use client";
import { useEffect, useRef, useState } from "react";
import { Bell, ChevronDown, Menu, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

export default function AdminHeader({ sidebarOpen, onToggleSidebar }) {
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target)
      ) {
        setProfileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const { logout } = useAuth();

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
      <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4">
        <div className="flex items-center gap-3">
          {/* Menu Button - Visible on small and medium devices */}
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            {sidebarOpen ? (
              <X size={24} className="text-slate-700" />
            ) : (
              <Menu size={24} className="text-slate-700" />
            )}
          </button>

          {/* Page title placeholder */}
          <div className="hidden md:block">
            <h2 className="text-lg font-semibold text-slate-900">Dashboard</h2>
          </div>
        </div>

        {/* Right side - Notification and User */}
        <div className="flex items-center gap-3">
          {/* Notification Button */}
          <button className="relative p-2 hover:bg-slate-100 rounded-lg transition-colors group">
            <Bell size={20} className="text-slate-700" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>

            {/* Notification Dropdown Hint */}
            <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border border-slate-200 p-4 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity">
              <h3 className="font-semibold text-slate-900 mb-3">
                Notifications
              </h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                <div className="p-2 bg-emerald-50 rounded border border-emerald-200 text-sm">
                  <p className="text-emerald-800 font-medium">System Update</p>
                  <p className="text-emerald-700 text-xs">Dashboard updated</p>
                </div>
              </div>
            </div>
          </button>

          {/* User Profile Dropdown */}
          <div className="relative" ref={profileMenuRef}>
            <button
              type="button"
              onClick={() => setProfileMenuOpen((prev) => !prev)}
              className="flex items-center gap-2 p-2 hover:bg-slate-100 rounded-lg transition-colors"
              aria-expanded={profileMenuOpen}
              aria-haspopup="menu"
            >
              <div className="w-8 h-8 bg-slate-300 rounded-full flex items-center justify-center text-slate-600 font-semibold text-sm">
                AD
              </div>
              <span className="hidden sm:inline text-sm font-medium text-slate-700">
                Admin
              </span>
              <ChevronDown size={16} className="text-slate-500" />
            </button>

            {profileMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 p-2 z-50 inline-grid">
                <Link
                  className="w-full text-left px-3 py-2 rounded-md text-sm text-slate-700 hover:bg-slate-100 transition-colors"
                  role="a"
                  href="/admin/account"
                >
                  Account
                </Link>

                <Link
                  className="w-full text-left px-3 py-2 rounded-md text-sm text-slate-700 hover:bg-slate-100 transition-colors"
                  role="a"
                  href="/admin/security"
                >
                  Security
                </Link>
                <button
                  type="button"
                  className="w-full text-left px-3 py-2 rounded-md text-sm text-red-700 hover:bg-red-100 transition-colors"
                  onClick={async () => await logout()}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
