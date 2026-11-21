import { useState } from "react";
import { Link, Outlet } from "react-router-dom";
import { ArrowUpRight, Menu, X, UserRound } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";

const NAV = [
  { label: "Explore", to: "/explore" },
  { label: "Categories", to: "/categories" },
  { label: "Compare", to: "/compare-blueprints" },
  { label: "Help", to: "/support" },
];

function Mark() {
  return (
    <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground">
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M3.5 17.5c4 0 4.6-5.5 8.5-5.5s3.2 4 8.5 4" />
        <circle cx="3.5" cy="17.5" r="1.7" fill="currentColor" stroke="none" />
        <circle cx="20.5" cy="16" r="1.7" fill="currentColor" stroke="none" />
      </svg>
    </span>
  );
}

export default function SiteLayout() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur-md">
        <div className="wrap flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
            <Mark />
            <span className="font-display text-xl tracking-tight">BizPath</span>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            {NAV.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              to={user ? "/portal" : "/login"}
              className="hidden items-center gap-1.5 rounded-full border border-border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-secondary sm:inline-flex"
            >
              <UserRound className="h-4 w-4" /> {user ? "My portal" : "Sign in"}
            </Link>
            <Link
              to="/explore"
              className="hidden items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-transform hover:-translate-y-0.5 sm:inline-flex"
            >
              Find your business <ArrowUpRight className="h-4 w-4" />
            </Link>
            <button
              type="button"
              aria-label="Toggle navigation"
              onClick={() => setOpen((v) => !v)}
              className="grid h-10 w-10 place-items-center rounded-full border border-border md:hidden"
            >
              {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {open && (
          <div className="border-t border-border bg-background px-5 py-4 md:hidden">
            <div className="flex flex-col gap-1">
              {NAV.map((item) => (
                <Link
                  key={item.label}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-2 py-3 text-sm text-foreground/80 hover:bg-secondary"
                >
                  {item.label}
                </Link>
              ))}
              <Link
              to={user ? "/portal" : "/login"}
                onClick={() => setOpen(false)}
                className="mt-1 rounded-lg px-2 py-3 text-sm text-foreground/80 hover:bg-secondary"
              >
                {user ? "My portal" : "Sign in"}
              </Link>
              <Link
                to="/explore"
                onClick={() => setOpen(false)}
                className="mt-2 rounded-full bg-primary px-5 py-3 text-center text-sm font-medium text-primary-foreground"
              >
                Find your business
              </Link>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="mt-20 border-t border-border bg-card/60">
        <div className="wrap grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <Mark />
              <span className="font-display text-xl">BizPath</span>
            </div>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
              Blueprints, cost sheets and execution roadmaps from operators who have already built
              the business you are considering.
            </p>
          </div>

          <div>
            <p className="eyebrow">Explore</p>
            <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
              <li><Link className="hover:text-foreground" to="/explore">All blueprints</Link></li>
              <li><Link className="hover:text-foreground" to="/explore?category=Food%20%26%20Beverage">Food &amp; beverage</Link></li>
              <li><Link className="hover:text-foreground" to="/explore?category=Fitness%20%26%20Wellness">Fitness &amp; wellness</Link></li>
              <li><Link className="hover:text-foreground" to="/explore?budget=under5">Under ₹5 lakh</Link></li>
            </ul>
          </div>

          <div>
            <p className="eyebrow">Platform</p>
            <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
              <li><Link className="hover:text-foreground" to="/#how-it-works">How it works</Link></li>
              <li><Link className="hover:text-foreground" to="/#categories">Categories</Link></li>
              <li><Link className="hover:text-foreground" to="/explore?budget=50plus">Large investments</Link></li>
              <li><Link className="hover:text-foreground" to="/subscription-plans">Subscription plans</Link></li>
              <li><Link className="hover:text-foreground" to="/guidelines">Platform guidelines</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border">
          <div className="wrap flex flex-col gap-2 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <span>© {new Date().getFullYear()} BizPath. Built for people starting something real.</span>
            <span>Blueprint content is educational guidance, not a financial guarantee.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}