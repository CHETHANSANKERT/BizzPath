import { Link } from "react-router-dom";
import {
  Users,
  CalendarClock,
  Route as RouteIcon,
  Calculator,
  BarChart3,
  Settings,
} from "lucide-react";

const ACTIONS = [
  { label: "Find a mentor", to: "/mentor-marketplace", icon: Users },
  { label: "Book a session", to: "/book-consultation", icon: CalendarClock },
  { label: "Roadmap", to: "/business-roadmap", icon: RouteIcon },
  { label: "Revenue calculator", to: "/revenue-calculator", icon: Calculator },
  { label: "Insights", to: "/marketplace-insights", icon: BarChart3 },
  { label: "Settings", to: "/account-settings", icon: Settings },
];

export default function QuickActions() {
  return (
    <section>
      <p className="eyebrow pb-2">Quick actions</p>
      <div className="no-scrollbar -mx-1 flex gap-3 overflow-x-auto px-1 pb-1 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 lg:grid-cols-6">
        {ACTIONS.map((action) => (
          <Link
            key={action.to}
            to={action.to}
            className="flex min-w-[132px] flex-col gap-2 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/30 sm:min-w-0"
          >
            <action.icon className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium leading-snug">{action.label}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}