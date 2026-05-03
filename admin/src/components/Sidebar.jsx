"use client";
import { Building2, GitMerge, LayoutDashboard, ShieldCheck, Tag, Users, Wallet2, HelpCircle } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

export default function Sidebar({ onClose }) {
    const pathname = usePathname();

    const navItems = [
        { href: "/admin", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
        { href: "/admin/entities", label: "Entities", icon: <Building2 size={18} /> },
        { href: "/admin/tiers", label: "Pricing", icon: <Tag size={18} /> },
        { href: "/admin/agents", label: "Agents", icon: <Users size={18} />},
        { href: "/admin/payment-split", label: "Payment Split", icon: <GitMerge size={18} /> },
        { href: "/admin/revenue-assurance", label: "Assurance", icon: <ShieldCheck size={18} /> },
        { href: "/admin/wallet", label: "Wallet", icon: <Wallet2 size={18} /> },
        { href: "/admin/recruitment", label: "Recruitment", icon: <Users size={18} /> },
        { href: "/admin/help-center", label: "Help Center", icon: <HelpCircle size={18} /> },
    ];

    const handleNavClick = () => {
        if (onClose) onClose();
    };

    return (
        <aside className="w-64 bg-white border-r border-slate-200 h-screen sticky top-0 flex flex-col overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center gap-3">
                <div className="w-10 h-10 bg-transparent border-2 border-emerald-500 rounded-lg flex items-center justify-center text-white overflow-hidden p-1">
                    <Image
                        src="/icon.png"
                        alt="AURMS Logo"
                        width={40}
                        height={40}
                        className="w-full h-full object-cover"
                    />
                </div>
                <div>
                    <h1 className="font-bold text-slate-800 text-lg">AURMS Admin</h1>
                    <p className="text-xs text-slate-500">Revenue & Analytics</p>
                </div>
            </div>
            <nav className="flex-1 min-h-0 overflow-y-auto p-4 space-y-1">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={handleNavClick}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                                ? "bg-emerald-50 text-emerald-600 font-semibold"
                                : "text-slate-600 hover:bg-slate-50"
                                }`}
                        >
                            <span className="text-lg">{item.icon}</span>
                            <span>{item.label}</span>
                        </Link>
                    );
                })}
            </nav>
            <div className="bg-gray-100 rounded-2xl p-3 text-blue-900 font-semibold text-sm m-3">
                <span>Powered by TR3G</span>
            </div>
        </aside>
    );
}