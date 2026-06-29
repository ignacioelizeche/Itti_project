"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Search,
  Building2,
  Sparkles,
  Database,
  Layers,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/discover", label: "Descubrir", icon: Sparkles },
  { href: "/search", label: "Búsqueda", icon: Search },
  { href: "/companies", label: "Empresas", icon: Building2 },
  { href: "/scoring", label: "Scoring", icon: Database },
  { href: "/enrichment", label: "Decisiones", icon: Layers },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-ueno-dark text-white flex flex-col">
      <div className="p-6 border-b border-white/10">
        <h1 className="text-xl font-bold">
          <span className="text-ueno-blue">ueno</span> alliances
        </h1>
        <p className="text-xs text-white/50 mt-1">Buscador Inteligente</p>
      </div>
      <nav className="flex-1 p-4" aria-label="Navegación principal">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-colors ${
                isActive
                  ? "bg-ueno-blue text-white"
                  : "text-white/60 hover:bg-white/10 hover:text-white"
              }`}
            >
              <item.icon size={20} />
              <span className="text-sm">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-white/10">
        <p className="text-xs text-white/30 text-center">Itti © 2026</p>
      </div>
    </aside>
  );
}
