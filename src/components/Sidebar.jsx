"use client";

import { Listbox, ListboxItem } from "@nextui-org/react";
import { useRouter, usePathname } from "next/navigation";
import { LayoutDashboard, Package2, Webhook } from "lucide-react";

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();

  const menuItems = [
    {
      key: "dashboard",
      label: "Dashboard",
      icon: <LayoutDashboard size={24} />,
      path: "/",
    },
    {
      key: "mods",
      label: "Mods",
      icon: <Package2 size={24} />,
      path: "/mods",
    },
    {
      key: "webhooks",
      label: "Webhooks",
      icon: <Webhook size={24} />,
      path: "/webhooks",
    },
  ];

  return (
    <div className="w-64 h-screen border-r border-divider bg-content1">
      <div className="p-4">
        <h1 className="text-xl font-bold mb-4">Mod Tracker</h1>
        <Listbox aria-label="Navigation menu" className="p-0 gap-0 divide-y divide-divider" selectedKeys={[pathname === "/" ? "dashboard" : pathname.substring(1)]} disabledKeys={[pathname === "/" ? "dashboard" : pathname.substring(1)]}>
          {menuItems.map((item) => (
            <ListboxItem key={item.key} startContent={item.icon} className="px-4 py-3" onClick={() => router.push(item.path)}>
              {item.label}
            </ListboxItem>
          ))}
        </Listbox>
      </div>
    </div>
  );
}
