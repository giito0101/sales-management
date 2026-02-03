"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { LogoutButton } from "@/components/LogoutButton";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/jobseekers", label: "求職者", shortLabel: "求" },
  { href: "/companies", label: "企業", shortLabel: "企" },
];

export function ListSidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(true);

  return (
    <aside
      className={cn(
        "border-r bg-muted/20 p-3 transition-all",
        isCollapsed ? "w-14" : "w-56"
      )}
    >
      <div className="flex h-full flex-col">
        <div className={cn("mb-2 flex", isCollapsed ? "justify-center" : "justify-end")}>
          <button
            type="button"
            onClick={() => setIsCollapsed((prev) => !prev)}
            className={cn(
              buttonVariants({ variant: "ghost", size: "icon-sm" }),
              "text-xs"
            )}
            aria-label={isCollapsed ? "サイドバーを開く" : "サイドバーを閉じる"}
          >
            {isCollapsed ? ">>" : "<<"}
          </button>
        </div>
        <nav className="flex flex-col gap-2">
          {navItems.map((item) => {
            const isActive = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  buttonVariants({
                    variant: isActive ? "secondary" : "ghost",
                    size: "sm",
                  }),
                  isCollapsed ? "justify-center px-0" : "justify-start"
                )}
                title={item.label}
              >
                {isCollapsed ? item.shortLabel : item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto border-t pt-3">
          <div className={cn(isCollapsed ? "flex justify-center" : "")}>
            <LogoutButton compact={isCollapsed} />
          </div>
        </div>
      </div>
    </aside>
  );
}
