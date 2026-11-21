import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  CalendarClock,
  MessageSquare,
  ArrowUpRight,
  Video,
} from "lucide-react";

import {
  getMyConsultations,
} from "@/services/consultationService";

import PageHeader from "@/components/account/PageHeader";
import EmptyState from "@/components/account/EmptyState";
import StatusBadge from "@/components/account/StatusBadge";
import LoadingBlock from "@/components/LoadingBlock";

import MessageMentorDialog from "@/components/mentors/MessageMentorDialog";

const TABS = [
  {
    id: "upcoming",
    label: "Upcoming",
  },
  {
    id: "requested",
    label: "Requested",
  },
  {
    id: "past",
    label: "Past",
  },
];

/**
 * Format consultation date and time.
 */
const formatSlot = (value) =>
  new Date(value).toLocaleString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });

/**
 * Format requested date.
 */
const formatRequestedDate = (value) =>
  new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });

export default function MyConsultations() {
  const [items, setItems] = useState([]);

  const [tab, setTab] = useState("upcoming");

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [messageTarget, setMessageTarget] = useState(null);

  /**
   * Load consultations from Supabase.
   */
  useEffect(() => {
    let mounted = true;

    const loadConsultations = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getMyConsultations();

        if (!mounted) return;

        setItems(data);
      } catch (err) {
        console.error(
          "Error loading consultations:",
          err
        );

        if (mounted) {
          setError(
            err.message || "Unable to load consultations."
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadConsultations();

    return () => {
      mounted = false;
    };
  }, []);

  /**
   * Categorize consultations.
   */
  const now = new Date();

  const upcoming = items
    .filter(
      (item) =>
        item.scheduled_at &&
        new Date(item.scheduled_at) >= now
    )
    .sort(
      (a, b) =>
        new Date(a.scheduled_at) -
        new Date(b.scheduled_at)
    );

  const past = items
    .filter(
      (item) =>
        item.scheduled_at &&
        new Date(item.scheduled_at) < now
    )
    .sort(
      (a, b) =>
        new Date(b.scheduled_at) -
        new Date(a.scheduled_at)
    );

  const requested = items.filter(
    (item) => !item.scheduled_at
  );

  /**
   * Current tab data.
   */
  const visible =
    tab === "upcoming"
      ? upcoming
      : tab === "past"
        ? past
        : requested;

  /**
   * Tab count.
   */
  const getTabCount = (id) => {
    switch (id) {
      case "upcoming":
        return upcoming.length;

      case "past":
        return past.length;

      case "requested":
        return requested.length;

      default:
        return 0;
    }
  };

  /**
   * Empty state content.
   */
  const getEmptyState = () => {
    switch (tab) {
      case "past":
        return {
          title: "No past sessions yet",
          description:
            "Your completed mentor sessions will appear here.",
        };

      case "requested":
        return {
          title: "Nothing awaiting a slot",
          description:
            "Your consultation requests will appear here while waiting for a mentor to schedule them.",
        };

      default:
        return {
          title: "No upcoming meetings",
          description:
            "Request a session with a mentor from their profile and it will show up here.",
        };
    }
  };

  const emptyState = getEmptyState();

  return (
    <div className="space-y-8">

      {/* Page header */}
      <PageHeader
        eyebrow="Mentorship"
        title="Consultation bookings"
        description="Your sessions with business mentors — upcoming meetings, open requests and everything already completed."
        action={
          <Link
            to="/book-consultation"
            className="rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
          >
            Book a session
          </Link>
        }
      />

      {/* Error message */}
      {error && (
        <div
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1">

        {TABS.map((entry) => {
          const count = getTabCount(entry.id);

          return (
            <button
              key={entry.id}
              type="button"
              onClick={() => setTab(entry.id)}
              className={`shrink-0 rounded-full border px-4 py-2 text-sm transition-colors ${
                tab === entry.id
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:bg-secondary"
              }`}
            >
              {entry.label}

              <span className="ml-1 text-xs opacity-70">
                {count}
              </span>
            </button>
          );
        })}

      </div>

      {/* Loading */}
      {loading ? (
        <LoadingBlock rows={5} />
      ) : visible.length ? (

        /* Consultation cards */
        <div className="grid gap-4 sm:grid-cols-2">

          {visible.map((item) => (

            <article
              key={item.id}
              className="rounded-2xl border border-border bg-card p-5"
            >

              {/* Mentor details */}
              <div className="flex items-start justify-between gap-3">

                <div className="min-w-0">

                  <p className="truncate font-medium">
                    {item.creator_name || "BizPath mentor"}
                  </p>

                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {item.blueprint_title ||
                      "General business guidance"}
                  </p>

                </div>

                <StatusBadge status={item.status} />

              </div>

              {/* Scheduled date */}
              {item.scheduled_at ? (

                <p className="mt-4 flex items-center gap-1.5 text-sm text-primary">

                  <CalendarClock className="h-4 w-4" />

                  {formatSlot(item.scheduled_at)}

                </p>

              ) : (

                <p className="mt-4 text-sm text-muted-foreground">

                  Requested{" "}

                  {formatRequestedDate(item.created_date)}

                  {" "}· waiting on the mentor

                </p>

              )}

              {/* Consultation message */}
              {item.message && (

                <p className="mt-3 line-clamp-2 text-xs text-muted-foreground">
                  “{item.message}”
                </p>

              )}

              {/* Actions */}
              <div className="mt-4 flex flex-wrap items-center gap-3">

                {/* Join meeting */}
                {item.meeting_link && (

                  <a
                    href={item.meeting_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-2 text-xs font-medium text-primary-foreground"
                  >

                    <Video className="h-3.5 w-3.5" />

                    Join meeting

                  </a>

                )}

                {/* Message mentor */}
                <button
                  type="button"
                  onClick={() => setMessageTarget(item)}
                  className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >

                  <MessageSquare className="h-3.5 w-3.5" />

                  Message mentor

                </button>

                {/* Creator profile */}
                {item.creator_slug && (

                  <Link
                    to={`/creator/${item.creator_slug}`}
                    className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                  >

                    Profile

                    <ArrowUpRight className="h-3 w-3" />

                  </Link>

                )}

              </div>

            </article>

          ))}

        </div>

      ) : (

        /* Empty state */
        <EmptyState
          icon={MessageSquare}
          title={emptyState.title}
          description={emptyState.description}
          action={
            <Link
              to="/mentor-marketplace"
              className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              Find a mentor
            </Link>
          }
        />

      )}

      {/* Message mentor dialog */}
      <MessageMentorDialog
        open={Boolean(messageTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setMessageTarget(null);
          }
        }}
        request={messageTarget}
      />

    </div>
  );
}