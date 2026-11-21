import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  Bookmark,
  ListChecks,
  Receipt,
  MessageSquare,
  PenLine,
  CalendarClock,
  ArrowUpRight,
} from "lucide-react";

import { useAuth } from "@/lib/AuthContext";

import {
  getDashboardData,
} from "@/services/dashboardService";

import PageHeader from "@/components/account/PageHeader";
import StatCard from "@/components/account/StatCard";
import ProjectSummary from "@/components/account/ProjectSummary";
import EmptyState from "@/components/account/EmptyState";
import LoadingBlock from "@/components/LoadingBlock";
import QuickActions from "@/components/account/QuickActions";

import {
  formatDate,
  formatINR,
} from "@/lib/format";

export default function MyDashboard() {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);

  const [projects, setProjects] = useState([]);
  const [saved, setSaved] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [consultations, setConsultations] = useState([]);

  const [error, setError] = useState("");

  /**
   * Load dashboard information from Supabase.
   */
  useEffect(() => {
    let mounted = true;

    const loadDashboard = async () => {
      if (!user?.id) {
        setProjects([]);
        setSaved([]);
        setPurchases([]);
        setConsultations([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const data = await getDashboardData(user.id);

        if (!mounted) return;

        setProjects(data.projects);
        setSaved(data.saved);
        setPurchases(data.purchases);
        setConsultations(data.consultations);

      } catch (err) {
        console.error(
          "Dashboard loading failed:",
          err
        );

        if (mounted) {
          setError(
            err.message || "Unable to load dashboard."
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadDashboard();

    return () => {
      mounted = false;
    };
  }, [user?.id]);

  /**
   * Active projects.
   */
  const activeProjects = projects.filter(
    (project) => project.status !== "completed"
  );

  /**
   * Total amount invested in paid purchases.
   */
  const invested = purchases
    .filter(
      (purchase) => purchase.status === "paid"
    )
    .reduce(
      (sum, purchase) =>
        sum + (Number(purchase.amount) || 0),
      0
    );

  /**
   * Find next upcoming consultation.
   */
  const upcoming = consultations
    .filter(
      (item) =>
        item.scheduled_at &&
        new Date(item.scheduled_at) >= new Date()
    )
    .sort(
      (a, b) =>
        new Date(a.scheduled_at) -
        new Date(b.scheduled_at)
    )[0];

  /**
   * User's first name.
   */
  const firstName =
    (user?.full_name || "").split(" ")[0] || "there";

  return (
    <div className="space-y-8">

      {/* Dashboard Header */}
      <PageHeader
        eyebrow="Your workspace"
        title={`Welcome back, ${firstName}`}
        description="Everything you are building, saving and tracking on BizPath in one place."
        action={
          <Link
            to="/blueprint-builder"
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
          >
            <PenLine className="h-4 w-4" />
            Publish a blueprint
          </Link>
        }
      />

      {/* Quick Actions */}
      <QuickActions />

      {/* Error */}
      {error && (
        <div
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <LoadingBlock rows={6} />
      ) : (
        <>

          {/* Dashboard Statistics */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

            <StatCard
              label="Active projects"
              value={activeProjects.length}
              icon={ListChecks}
              hint={`${projects.length} in total`}
            />

            <StatCard
              label="Saved blueprints"
              value={saved.length}
              icon={Bookmark}
              hint="On your watchlist"
            />

            <StatCard
              label="Purchases"
              value={purchases.length}
              icon={Receipt}
              hint={`${formatINR(invested)} invested`}
            />

            <StatCard
              label="Consultations"
              value={consultations.length}
              icon={MessageSquare}
              hint={
                upcoming
                  ? "One scheduled"
                  : "None scheduled"
              }
            />

          </div>

          {/* Dashboard Content */}
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">

            {/* In Progress Projects */}
            <section>

              <div className="flex items-end justify-between">

                <h2 className="text-xl">
                  In progress
                </h2>

                <Link
                  to="/project-tracker"
                  className="text-sm text-primary hover:underline"
                >
                  Open tracker
                </Link>

              </div>

              <div className="mt-4 space-y-3">

                {activeProjects.length ? (

                  activeProjects
                    .slice(0, 4)
                    .map((project) => (
                      <ProjectSummary
                        key={project.id}
                        project={project}
                      />
                    ))

                ) : (

                  <EmptyState
                    icon={ListChecks}
                    title="No active projects yet"
                    description="Open a blueprint you have access to and start tracking its roadmap step by step."
                    action={
                      <Link
                        to="/explore"
                        className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                      >
                        Browse blueprints
                      </Link>
                    }
                  />

                )}

              </div>
            </section>

            {/* Right Sidebar */}
            <div className="space-y-6">

              {/* Next Consultation */}
              <section className="rounded-2xl border border-border bg-card p-5">

                <h2 className="text-base">
                  Next consultation
                </h2>

                {upcoming ? (

                  <div className="mt-3">

                    <p className="text-sm font-medium">
                      {upcoming.creator_name ||
                        "Mentor session"}
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
                      {upcoming.blueprint_title ||
                        "General guidance"}
                    </p>

                    <p className="mt-3 flex items-center gap-1.5 text-sm text-primary">

                      <CalendarClock className="h-4 w-4" />

                      {new Date(
                        upcoming.scheduled_at
                      ).toLocaleString("en-IN", {
                        day: "numeric",
                        month: "short",
                        hour: "numeric",
                        minute: "2-digit",
                      })}

                    </p>

                    <Link
                      to="/mentorship-requests"
                      className="mt-4 inline-flex items-center gap-1 text-sm text-primary hover:underline"
                    >
                      View all consultations

                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>

                  </div>

                ) : (

                  <p className="mt-2 text-sm text-muted-foreground">
                    No meetings scheduled. Book time with a creator from any blueprint page.
                  </p>

                )}

              </section>

              {/* Saved Blueprints */}
              <section className="rounded-2xl border border-border bg-card p-5">

                <div className="flex items-end justify-between">

                  <h2 className="text-base">
                    Saved for later
                  </h2>

                  <Link
                    to="/saved-blueprints"
                    className="text-xs text-primary hover:underline"
                  >
                    View all
                  </Link>

                </div>

                <ul className="mt-3 space-y-3">

                  {saved.length ? (

                    saved.map((item) => (

                      <li key={item.id}>

                        <Link
                          to={`/blueprint/${item.blueprint_slug}`}
                          className="block"
                        >

                          <p className="text-sm font-medium leading-snug hover:text-primary">
                            {item.blueprint_title}
                          </p>

                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {item.category} ·{" "}
                            {item.is_free
                              ? "Free"
                              : formatINR(item.price)}
                          </p>

                        </Link>

                      </li>

                    ))

                  ) : (

                    <li className="text-sm text-muted-foreground">
                      Nothing saved yet.
                    </li>

                  )}

                </ul>

              </section>

              {/* Last Purchase */}
              <section className="rounded-2xl border border-border bg-card p-5">

                <h2 className="text-base">
                  Last purchase
                </h2>

                {purchases[0] ? (

                  <div className="mt-2 text-sm">

                    <p className="font-medium">
                      {purchases[0].blueprint_title}
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">

                      {formatDate(
                        purchases[0].purchased_at ||
                        purchases[0].created_date
                      )}

                      {" · "}

                      {formatINR(
                        purchases[0].amount
                      )}

                    </p>

                    <Link
                      to="/purchase-history"
                      className="mt-3 inline-block text-sm text-primary hover:underline"
                    >
                      Purchase history
                    </Link>

                  </div>

                ) : (

                  <p className="mt-2 text-sm text-muted-foreground">
                    You have not purchased a blueprint yet.
                  </p>

                )}

              </section>

            </div>
          </div>

        </>
      )}

    </div>
  );
}