
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const menuItems = [
  // { name: "Dashboard", href: "/dashboard", icon: "▦" },
  {
    name: "Plant Live Transactions",
    href: "/plant-live-transactions",
    icon: "▤",
  },
  { name: "Weighbridge", href: "/weighbridge", icon: "⚖" },
  { name: "Reports", href: "/reports", icon: "▧" },
  { name: "Plant WB Configuration", href: "/settings/plant-wb-configuration", icon: "⚙" },
  { name: "Manage Users", href: "/settings/manage-users", icon: "♙" },
  {
    name: "Access Configuration",
    href: "/settings/access-configuration",
    icon: "🔐",
  },
];

export default function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-[#F6F2EA] text-[#3B2D20]">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 bg-[#3B2D20] p-5 text-white">
        <div className="mb-10">
          <h1 className="text-2xl font-bold">WEIGHCONNECT</h1>
          <p className="mt-1 text-xs tracking-wider text-[#E3D6C5]">
            PLANT OPERATIONS
          </p>
        </div>

        <p className="mb-3 text-xs font-semibold tracking-widest text-[#F6C45C]">
          MAIN MENU
        </p>

        <nav className="space-y-2">
          {menuItems.map((item) => {
            const active = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm transition ${
                  active
                    ? "bg-[#6F5038] font-semibold text-white"
                    : "text-[#E3D6C5] hover:bg-[#51402F]"
                }`}>

                <span>{item.icon}</span>
                {item.name}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main area */}
      <div className="min-w-0 flex-1">
        <header className="flex h-16 items-center justify-between border-b border-[#E3D6C5] bg-[#FFFCF8] px-8">
          <h2 className="font-semibold">Plant Operations Management</h2>
          <span className="text-sm text-[#786B5E]">User Account</span>
        </header>

        <main className="p-8">{children}</main>
      </div>
    </div>
  );
}
