import { cn } from "@/lib/utils";
import { Link, useLocation } from "@tanstack/react-router";
import {
  BarChart3,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  FileText,
  LayoutDashboard,
  Menu,
  Package,
  Percent,
  Receipt,
  Settings,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";

const NAV_ITEMS = [
  { label: "Dashboard", path: "/", icon: LayoutDashboard },
  { label: "Invoices", path: "/invoices", icon: FileText },
  { label: "Bills", path: "/bills", icon: Receipt },
  { label: "P&L", path: "/pl", icon: TrendingUp },
  { label: "Expenses", path: "/expenses", icon: BarChart3 },
  { label: "Inventory", path: "/inventory", icon: Package },
  { label: "Contacts", path: "/contacts", icon: Users },
  { label: "Reports", path: "/reports", icon: BookOpen },
  { label: "VAT", path: "/vat", icon: Percent },
  { label: "Settings", path: "/settings", icon: Settings },
];

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { pathname } = useLocation();

  const isActive = (path: string) =>
    path === "/" ? pathname === "/" : pathname.startsWith(path);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
          onKeyDown={(e) => e.key === "Escape" && setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:relative z-50 flex flex-col h-full bg-sidebar border-r border-sidebar-border transition-smooth",
          collapsed ? "w-16" : "w-60",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        {/* Brand */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-sidebar-border min-h-[65px]">
          <div className="w-8 h-8 rounded-md bg-sidebar-primary flex items-center justify-center shrink-0">
            <span className="text-sidebar-primary-foreground font-display font-bold text-sm">
              G
            </span>
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-sidebar-foreground font-display font-bold text-sm leading-tight truncate">
                Glow &amp; Co.
              </p>
              <p className="text-muted-foreground text-[11px] truncate">
                Finance Dashboard
              </p>
            </div>
          )}
        </div>

        {/* Nav links */}
        <nav
          className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5"
          data-ocid="sidebar-nav"
        >
          {NAV_ITEMS.map(({ label, path, icon: Icon }) => (
            <Link
              key={path}
              to={path}
              onClick={() => setMobileOpen(false)}
              data-ocid={`nav-${label.toLowerCase().replace(/[^a-z0-9]/g, "-")}`}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-smooth group",
                isActive(path)
                  ? "bg-sidebar-primary/20 text-sidebar-primary"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
              title={collapsed ? label : undefined}
            >
              <Icon
                className={cn(
                  "w-[18px] h-[18px] shrink-0",
                  isActive(path)
                    ? "text-sidebar-primary"
                    : "text-muted-foreground group-hover:text-sidebar-accent-foreground",
                )}
              />
              {!collapsed && <span className="truncate">{label}</span>}
              {isActive(path) && !collapsed && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-sidebar-primary shrink-0" />
              )}
            </Link>
          ))}
        </nav>

        {/* Collapse toggle (desktop) */}
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex items-center justify-center p-3 border-t border-sidebar-border text-muted-foreground hover:text-sidebar-foreground transition-smooth"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar (mobile) */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-card border-b border-border">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-smooth"
            aria-label="Open navigation"
            data-ocid="mobile-menu-btn"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xs">
                G
              </span>
            </div>
            <span className="font-display font-bold text-sm text-foreground">
              Glow &amp; Co.
            </span>
          </div>
          {mobileOpen && (
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="ml-auto p-2 rounded-md text-muted-foreground hover:text-foreground"
              aria-label="Close navigation"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </header>

        {/* Page content */}
        <main
          className="flex-1 overflow-y-auto bg-background"
          data-ocid="main-content"
        >
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-card border-t border-border px-6 py-3 text-xs text-muted-foreground flex items-center justify-between shrink-0">
          <span>
            © {new Date().getFullYear()} Glow &amp; Co. Finance Dashboard
          </span>
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors"
          >
            Built with love using caffeine.ai
          </a>
        </footer>
      </div>
    </div>
  );
}
