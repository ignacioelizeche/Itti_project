"use client";

import { Search } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export function Header() {
  const [query, setQuery] = useState("");
  const [apiOnline, setApiOnline] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch("/api/scores/health");
        setApiOnline(res.ok);
      } catch {
        setApiOnline(false);
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <header className="h-16 bg-white border-b flex items-center px-6 gap-4">
      <form onSubmit={handleSearch} className="flex-1 max-w-xl">
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar cafeterías populares en Asunción..."
            aria-label="Buscar en el sistema"
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ueno-blue/50 focus:border-ueno-blue"
          />
        </div>
      </form>
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <div className={`w-2 h-2 rounded-full ${apiOnline ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
        <span>{apiOnline ? "API conectada" : "API desconectada"}</span>
      </div>
    </header>
  );
}
