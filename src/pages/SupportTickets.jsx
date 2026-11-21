import { useEffect, useState } from "react";
import { LifeBuoy, Plus, ChevronRight } from "lucide-react";

import { useAuth } from "@/lib/AuthContext";
import { getMySupportTickets } from "@/services/supportTicketService";

import PageHeader from "@/components/account/PageHeader";
import EmptyState from "@/components/account/EmptyState";
import StatusBadge from "@/components/account/StatusBadge";
import LoadingBlock from "@/components/LoadingBlock";
import NewTicketDialog, {
  TICKET_CATEGORIES,
} from "@/components/support/NewTicketDialog";
import TicketThread from "@/components/support/TicketThread";

import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "open", label: "Open" },
  { id: "in-progress", label: "In progress" },
  { id: "resolved", label: "Resolved" },
];

export default function SupportTickets() {
  const { user } = useAuth();

  const [tickets, setTickets] = useState([]);
  const [filter, setFilter] = useState("all");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [composing, setComposing] = useState(false);
  const [active, setActive] = useState(null);

  // Fetch logged-in user's tickets.
  useEffect(() => {
    let alive = true;

    const fetchTickets = async () => {
      if (!user?.id) {
        setTickets([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const records = await getMySupportTickets(user.id);

        if (alive) {
          setTickets(records);
        }
      } catch (err) {
        console.error("Failed to load support tickets:", err);

        if (alive) {
          setError(err?.message || "Unable to load your support tickets.");
        }
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    };

    fetchTickets();

    return () => {
      alive = false;
    };
  }, [user?.id]);

  // Filter tickets.
  const visible =
    filter === "all"
      ? tickets
      : tickets.filter((ticket) => ticket.status === filter);

  // Count tickets awaiting a response.
  const openCount = tickets.filter(
    (ticket) => ticket.status !== "resolved" && ticket.status !== "closed",
  ).length;

  // Add newly created ticket.
  const handleTicketCreated = (record) => {
    setTickets((previous) => [
      record,
      ...previous.filter((ticket) => ticket.id !== record.id),
    ]);

    setComposing(false);
  };

  // Update ticket after a reply.
  const handleTicketReplied = (record) => {
    setTickets((previous) =>
      previous.map((ticket) => (ticket.id === record.id ? record : ticket)),
    );

    setActive(record);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <PageHeader
        eyebrow="Support"
        title="Support tickets"
        description="Track every question you have raised, follow its status, and reply on the same thread."
        action={
          <Button className="rounded-full" onClick={() => setComposing(true)}>
            <Plus className="h-4 w-4" />
            New ticket
          </Button>
        }
      />

      {/* Filters */}
      <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1">
        {FILTERS.map((entry) => (
          <button
            key={entry.id}
            type="button"
            onClick={() => setFilter(entry.id)}
            className={`shrink-0 rounded-full border px-4 py-2 text-sm transition-colors ${
              filter === entry.id
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:bg-secondary"
            }`}
          >
            {entry.label}
          </button>
        ))}

        <span className="ml-auto shrink-0 self-center text-xs text-muted-foreground">
          {openCount} awaiting a reply
        </span>
      </div>

      {/* Ticket List */}
      {loading ? (
        <LoadingBlock rows={5} />
      ) : error ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5">
          <p className="text-sm text-destructive">{error}</p>

          <Button
            variant="outline"
            className="mt-3 rounded-full"
            onClick={() => {
              setLoading(true);
              setError("");

              getMySupportTickets(user?.id)
                .then(setTickets)
                .catch((err) =>
                  setError(err?.message || "Unable to load tickets."),
                )
                .finally(() => setLoading(false));
            }}
          >
            Retry
          </Button>
        </div>
      ) : visible.length ? (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <ul className="divide-y divide-border">
            {visible.map((ticket) => (
              <li key={ticket.id}>
                <button
                  type="button"
                  onClick={() => setActive(ticket)}
                  className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-secondary/60"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {ticket.subject}
                    </p>

                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {TICKET_CATEGORIES.find(
                        (entry) => entry.value === ticket.category,
                      )?.label || "General"}
                      {" · "}
                      {formatDate(ticket.created_date || ticket.created_at)}
                      {" · "}
                      {(ticket.replies || []).length} replies
                    </p>
                  </div>

                  <StatusBadge status={ticket.status} />

                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <EmptyState
          icon={LifeBuoy}
          title={filter === "all" ? "No tickets yet" : "Nothing in this view"}
          description="Raise a ticket for a payment, an access problem or anything else — we answer on the thread."
          action={
            <Button className="rounded-full" onClick={() => setComposing(true)}>
              <Plus className="h-4 w-4" />
              New ticket
            </Button>
          }
        />
      )}

      {/* Create Ticket Dialog */}
      <NewTicketDialog
        open={composing}
        onOpenChange={setComposing}
        onCreated={handleTicketCreated}
      />

      {/* Ticket Conversation */}
      <TicketThread
        ticket={active}
        open={Boolean(active)}
        onOpenChange={(value) => {
          if (!value) setActive(null);
        }}
        onReplied={handleTicketReplied}
      />
    </div>
  );
}
