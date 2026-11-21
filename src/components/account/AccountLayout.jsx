import { useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  Bookmark,
  ListChecks,
  Receipt,
  GitCompare,
  PenLine,
  TrendingUp,
  Wallet,
  ShieldCheck,
  LifeBuoy,
  ArrowLeft,
  Library,
  Users,
  BarChart3,
  CalendarClock,
  Calculator,
  MessagesSquare,
  Settings,
  Menu,
  LogOut,
  Route as RouteIcon,
  ShoppingBag,
  PiggyBank,
  LineChart,
  CreditCard,
  Ticket,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useAuth } from "@/lib/AuthContext";
import { useProfile } from "@/lib/ProfileContext";
import { portalLabel } from "@/lib/portal";
import { cn } from "@/lib/utils";

const seekerGroups = [
  {
    label: "Workspace",
    items: [
      { label: "My dashboard", to: "/my-dashboard", icon: LayoutDashboard },
      { label: "Saved blueprints", to: "/saved-blueprints", icon: Bookmark },
      { label: "My purchases", to: "/my-purchases", icon: ShoppingBag },
      { label: "Purchase history", to: "/purchase-history", icon: Receipt },
    ],
  },
  {
    label: "Discover",
    items: [
      { label: "Blueprint library", to: "/blueprints", icon: Library },
      { label: "Marketplace insights", to: "/marketplace-insights", icon: BarChart3 },
      { label: "Compare blueprints", to: "/blueprint-comparison", icon: GitCompare },
    ],
  },
  {
    label: "Mentorship",
    items: [
      { label: "Mentor marketplace", to: "/mentor-marketplace", icon: Users },
      { label: "Book a consultation", to: "/book-consultation", icon: CalendarClock },
      { label: "My consultations", to: "/my-consultations", icon: CalendarClock },
      { label: "Mentorship requests", to: "/mentorship-requests", icon: MessagesSquare },
    ],
  },
  {
    label: "Execution",
    items: [
      { label: "Milestone manager", to: "/milestone-manager", icon: ListChecks },
      { label: "Business roadmap", to: "/business-roadmap", icon: RouteIcon },
      { label: "Project budget", to: "/project-budget", icon: PiggyBank },
      { label: "Investment analytics", to: "/investment-analytics", icon: LineChart },
      { label: "Revenue calculator", to: "/revenue-calculator", icon: Calculator },
    ],
  },
];

const creatorNav = [
  { label: "Creator dashboard", to: "/creator-dashboard", icon: PenLine },
  { label: "Blueprint builder", to: "/blueprint-builder", icon: PenLine },
  { label: "Creator analytics", to: "/creator-analytics", icon: LineChart },
  { label: "Earnings", to: "/creator-earnings", icon: TrendingUp },
  { label: "Payout settings", to: "/payout-settings", icon: Wallet },
];

const adminNav = [
  { label: "Admin console", to: "/admin-console", icon: ShieldCheck },
  { label: "Admin moderation", to: "/admin-moderation", icon: ShieldCheck },
];

const accountNav = [
  { label: "Account settings", to: "/account-settings", icon: Settings },
  { label: "Subscription plans", to: "/subscription-plans", icon: CreditCard },
  { label: "Support tickets", to: "/support-tickets", icon: Ticket },
  { label: "Help center", to: "/help-center", icon: LifeBuoy },
];

const bottomNav = [
  { label: "Home", to: "/my-dashboard", icon: LayoutDashboard },
  { label: "Library", to: "/blueprints", icon: Library },
  { label: "Mentors", to: "/mentor-marketplace", icon: Users },
  { label: "Projects", to: "/milestone-manager", icon: ListChecks },
];

export default function AccountLayout() {
  const { user, logout } = useAuth();
  const { profile, role } = useProfile();
  const [menuOpen, setMenuOpen] = useState(false);

  const groups = [...seekerGroups];
  if (role === "creator" || role === "admin") {
    groups.push({ label: "Creator studio", items: creatorNav });
  }
  if (role === "admin") {
    groups.push({ label: "Operations", items: adminNav });
  }
  groups.push({ label: "Account", items: accountNav });

  // Signing out clears the session and lands on the login screen, from any portal.
  const signOut = () => {
    logout(false);
    window.location.href = "/login";
  };

  const displayName = profile?.full_name || user?.full_name || profile?.username || "Your account";

  const linkClass = ({ isActive }) =>
    cn(
      "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition-colors",
      isActive
        ? "bg-primary text-primary-foreground"
        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
    );

  return (
    <div className="wrap pb-28 pt-6 sm:pt-8 lg:pb-12">
      <div className="grid gap-8 lg:grid-cols-[236px_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          {/* Mobile identity bar */}
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3 lg:hidden">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{displayName}</p>
              <p className="truncate text-xs text-muted-foreground">{portalLabel(role)}</p>
            </div>
            <button
              type="button"
              onClick={signOut}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground"
            >
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </button>
          </div>

          {/* Desktop sidebar */}
          <div className="hidden rounded-2xl border border-border bg-card p-3 lg:block">
            <div className="px-2 pb-3 pt-1">
              <p className="truncate text-sm font-medium">{displayName}</p>
              <p className="truncate text-xs text-muted-foreground">{portalLabel(role)}</p>
            </div>

            <div className="flex flex-col gap-4">
              {groups.map((group) => (
                <div key={group.label}>
                  <p className="eyebrow px-2 pb-2">{group.label}</p>
                  <nav className="flex flex-col gap-0.5">
                    {group.items.map((item) => (
                      <NavLink key={item.to} to={item.to} className={linkClass}>
                        <item.icon className="h-4 w-4 shrink-0" />
                        {item.label}
                      </NavLink>
                    ))}
                  </nav>
                </div>
              ))}

              <div className="space-y-0.5 border-t border-border pt-3">
                <Link
                  to="/"
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
                >
                  <ArrowLeft className="h-4 w-4" /> Back to site
                </Link>
                <button
                  type="button"
                  onClick={signOut}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
                >
                  <LogOut className="h-4 w-4" /> Sign out
                </button>
              </div>
            </div>
          </div>
        </aside>

        <div className="min-w-0">
          <Outlet />
        </div>
      </div>

      {/* Mobile bottom navigation */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur-md lg:hidden">
        <div className="mx-auto flex max-w-lg items-stretch justify-between px-2 pb-[max(0.4rem,env(safe-area-inset-bottom))] pt-1.5">
          {bottomNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "flex flex-1 flex-col items-center gap-1 rounded-lg py-1.5 text-[10px] font-medium transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )
              }
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </NavLink>
          ))}

          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                className="flex flex-1 flex-col items-center gap-1 rounded-lg py-1.5 text-[10px] font-medium text-muted-foreground"
              >
                <Menu className="h-5 w-5" />
                More
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl pb-8">
              <SheetHeader className="text-left">
                <SheetTitle className="font-display text-xl">Portal menu</SheetTitle>
                <p className="text-xs text-muted-foreground">
                  {displayName} · {portalLabel(role)}
                </p>
              </SheetHeader>

              <div className="mt-5 space-y-5">
                {groups.map((group) => (
                  <div key={group.label}>
                    <p className="eyebrow pb-2">{group.label}</p>
                    <div className="grid grid-cols-2 gap-2">
                      {group.items.map((item) => (
                        <NavLink
                          key={item.to}
                          to={item.to}
                          onClick={() => setMenuOpen(false)}
                          className={({ isActive }) =>
                            cn(
                              "flex items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-medium",
                              isActive
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border text-foreground"
                            )
                          }
                        >
                          <item.icon className="h-4 w-4 shrink-0" />
                          <span className="truncate">{item.label}</span>
                        </NavLink>
                      ))}
                    </div>
                  </div>
                ))}

                <div className="space-y-2 border-t border-border pt-4">
                  <Link
                    to="/"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 rounded-xl border border-border px-3 py-2.5 text-xs font-medium"
                  >
                    <ArrowLeft className="h-4 w-4" /> Back to site
                  </Link>
                  <button
                    type="button"
                    onClick={signOut}
                    className="flex w-full items-center gap-2 rounded-xl bg-primary px-3 py-2.5 text-xs font-medium text-primary-foreground"
                  >
                    <LogOut className="h-4 w-4" /> Sign out
                  </button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </div>
  );
}