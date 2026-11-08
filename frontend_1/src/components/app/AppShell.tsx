import { Link, useLocation } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import {
  FileSearch,
  FileText,
  History,
  LayoutDashboard,
  Mail,
  Menu,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Sparkles,
  Sun,
  type LucideIcon,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTheme } from "./theme";
import { USE_DEMO } from "@/lib/api/services";

type NavItem = {
  to: "/" | "/analyze" | "/tailor" | "/cover-letters" | "/resumes" | "/history" | "/settings";
  label: string;
  icon: LucideIcon;
};
const live: NavItem[] = [
  { to: "/", label: "Overview", icon: LayoutDashboard },
  { to: "/analyze", label: "Analyze Resume", icon: FileSearch },
  { to: "/tailor", label: "Resume Tailoring", icon: Sparkles },
  { to: "/cover-letters", label: "Cover Letters", icon: Mail },
  { to: "/resumes", label: "My Resumes", icon: FileText },
  { to: "/history", label: "Analysis History", icon: History },
  { to: "/settings", label: "Settings", icon: Settings },
];

function Logo({ compact }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground shadow-lift">
        <FileSearch className="size-4" />
      </div>
      {!compact && <span className="text-[15px] font-semibold tracking-tight">ATS Analyzer</span>}
    </div>
  );
}

function NavList({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const { pathname } = useLocation();
  const isActive = (to: string) =>
    to === "/" ? pathname === "/" : pathname.startsWith(to) || (to === "/history" && pathname.startsWith("/results"));
  const wrap = (label: string, node: ReactNode) =>
    collapsed ? (
      <Tooltip key={label}>
        <TooltipTrigger asChild>{node}</TooltipTrigger>
        <TooltipContent side="right">{label}</TooltipContent>
      </Tooltip>
    ) : (
      <div key={label}>{node}</div>
    );
  return (
    <nav className="flex flex-col gap-1" aria-label="Main">
      {live.map(({ to, label, icon: Icon }) => {
        const active = isActive(to);
        return wrap(
          label,
          <Link
            to={to}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative flex h-9 items-center gap-3 rounded-lg px-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
            )}
          >
            {active && (
              <motion.span
                layoutId="nav-indicator"
                className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-sidebar-primary"
              />
            )}
            <Icon className="size-4 shrink-0" />
            {!collapsed && <span className="truncate">{label}</span>}
          </Link>,
        );
      })}
    </nav>
  );
}

export function AppShell({ title, children, actions }: { title: string; children: ReactNode; actions?: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, toggle } = useTheme();
  const { pathname } = useLocation();

  return (
    <TooltipProvider delayDuration={150}>
      <div className="flex min-h-screen bg-background">
        <motion.aside
          animate={{ width: collapsed ? 68 : 248 }}
          transition={{ type: "spring", stiffness: 380, damping: 36 }}
          className="sticky top-0 hidden h-screen shrink-0 flex-col border-r border-sidebar-border bg-sidebar p-3 md:flex"
        >
          <div className="flex h-10 items-center px-1.5">
            <Logo compact={collapsed} />
          </div>
          <div className="mt-6 flex-1 overflow-y-auto">
            <NavList collapsed={collapsed} />
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed((c) => !c)}
            className="justify-start gap-3 px-2.5 text-muted-foreground"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
            {!collapsed && "Collapse"}
          </Button>
        </motion.aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur md:px-8">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 bg-sidebar p-4">
                <SheetTitle className="sr-only">Navigation</SheetTitle>
                <Logo />
                <div className="mt-6">
                  <NavList collapsed={false} onNavigate={() => setMobileOpen(false)} />
                </div>
              </SheetContent>
            </Sheet>
            <h1 className="truncate text-sm font-medium text-muted-foreground">{title}</h1>
            <div className="ml-auto flex items-center gap-2">
              {USE_DEMO && (
                <span className="rounded-full border border-warning/40 bg-warning-soft px-2.5 py-0.5 text-xs font-medium text-warning">
                  Demo data
                </span>
              )}
              {actions}
              <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={theme}
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.18 }}
                  >
                    {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
                  </motion.span>
                </AnimatePresence>
              </Button>
            </div>
          </header>
          <motion.main
            key={pathname}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 md:px-8"
          >
            {children}
          </motion.main>
        </div>
      </div>
    </TooltipProvider>
  );
}
