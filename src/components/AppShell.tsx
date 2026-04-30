"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: "📊" },
  { name: "Tasks", href: "/tasks", icon: "✅" },
  { name: "Projects", href: "/projects", icon: "📁" },
  { name: "Board", href: "/board", icon: "📋" },
  { name: "Team", href: "/team", icon: "👥" },
  { name: "KPIs", href: "/kpis", icon: "📈" },
  { name: "Chat", href: "/chat", icon: "💬" },
  { name: "Reports", href: "/reports", icon: "📄" },
  { name: "Settings", href: "/settings/workspace", icon: "⚙️" },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen bg-[#060809] text-[#ECF1EE]">
      <aside className="flex w-[226px] flex-col border-r border-[rgba(255,255,255,0.055)] bg-[#0A0D0E]">
        <div className="flex h-[47px] items-center px-4 font-bold">WorkPulse</div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navigation.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                  isActive ? "bg-[#16B87A]/10 text-[#16B87A] border-l-2 border-[#16B87A]" : "text-[#8AA39A] hover:bg-[#101514] hover:text-[#ECF1EE]"
                }`}
              >
                <span>{item.icon}</span> {item.name}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="flex h-[52px] items-center justify-between border-b border-[rgba(255,255,255,0.055)] bg-[#0A0D0E] px-6">
          <h1 className="text-sm font-bold text-[#ECF1EE]">
            {pathname.charAt(1).toUpperCase() + pathname.slice(2) || "Dashboard"}
          </h1>
        </header>
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}