import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ShieldCheck,
  CheckCircle2,
  RotateCcw,
  BadgeCheck,
  Inbox,
  Users,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import { useProfile } from "@/lib/ProfileContext";

import RejectDialog from "@/components/admin/RejectDialog";
import PageHeader from "@/components/account/PageHeader";
import StatusBadge from "@/components/account/StatusBadge";
import LoadingBlock from "@/components/LoadingBlock";

import { Button } from "@/components/ui/button";
import { formatDate, formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "blueprints", label: "Blueprint approvals", icon: ShieldCheck },
  { key: "creators", label: "Creator verification", icon: BadgeCheck },
  { key: "enquiries", label: "Enquiries", icon: Inbox },
];

export default function AdminConsole() {
  const { role } = useProfile();

  const isAdmin = role === "admin";

  const [tab, setTab] = useState("blueprints");

  const [blueprints, setBlueprints] = useState([]);
  const [creators, setCreators] = useState([]);
  const [enquiries, setEnquiries] = useState([]);

  const [loading, setLoading] = useState(true);
  const [rejecting, setRejecting] = useState(null);

  const [error, setError] = useState("");

  // -----------------------------------------
  // FETCH ADMIN DATA
  // -----------------------------------------

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }

    let active = true;

    const fetchAdminData = async () => {
      setLoading(true);
      setError("");

      try {
        const [
          blueprintResponse,
          creatorResponse,
          enquiryResponse,
        ] = await Promise.all([
          supabase
            .from("blueprints")
            .select("*")
            .order("updated_at", { ascending: false })
            .limit(100),

          supabase
            .from("creators")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(100),

          supabase
            .from("enquiries")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(50),
        ]);

        if (blueprintResponse.error) throw blueprintResponse.error;
        if (creatorResponse.error) throw creatorResponse.error;
        if (enquiryResponse.error) throw enquiryResponse.error;

        if (!active) return;

        setBlueprints(blueprintResponse.data || []);
        setCreators(creatorResponse.data || []);
        setEnquiries(enquiryResponse.data || []);
      } catch (err) {
        console.error("Admin data fetch error:", err);

        if (active) {
          setError(err.message || "Unable to load admin data.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchAdminData();

    return () => {
      active = false;
    };
  }, [isAdmin]);

  // -----------------------------------------
  // ACCESS CONTROL
  // -----------------------------------------

  if (!isAdmin) {
    return (
      <div className="space-y-8">
        <PageHeader eyebrow="Internal" title="Admin console" />

        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <span className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-secondary">
            <ShieldCheck className="h-5 w-5 text-muted-foreground" />
          </span>

          <h2 className="mt-4 text-lg">
            Administrator access required
          </h2>

          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            This area is for the BizPath team. Ask a workspace admin
            to upgrade your account if you need access.
          </p>

          <Link
            to="/my-dashboard"
            className="mt-5 inline-block rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  // -----------------------------------------
  // UPDATE LOCAL BLUEPRINT STATE
  // -----------------------------------------

  const applyStatus = (blueprint, patch) => {
    setBlueprints((list) =>
      list.map((item) =>
        item.id === blueprint.id
          ? { ...item, ...patch }
          : item
      )
    );
  };

  // -----------------------------------------
  // APPROVE BLUEPRINT
  // -----------------------------------------

  const approveBlueprint = async (blueprint) => {
    try {
      const { error } = await supabase
        .from("blueprints")
        .update({
          status: "published",
          review_note: "",
          updated_at: new Date().toISOString(),
        })
        .eq("id", blueprint.id);

      if (error) throw error;

      applyStatus(blueprint, {
        status: "published",
        review_note: "",
      });
    } catch (err) {
      console.error("Blueprint approval error:", err);
      setError(err.message || "Unable to publish blueprint.");
    }
  };

  // -----------------------------------------
  // REJECT BLUEPRINT
  // -----------------------------------------

  const rejectBlueprint = async (blueprint, note) => {
    try {
      const { error } = await supabase
        .from("blueprints")
        .update({
          status: "rejected",
          review_note: note,
          updated_at: new Date().toISOString(),
        })
        .eq("id", blueprint.id);

      if (error) throw error;

      applyStatus(blueprint, {
        status: "rejected",
        review_note: note,
      });

      setRejecting(null);
    } catch (err) {
      console.error("Blueprint rejection error:", err);
      setError(err.message || "Unable to reject blueprint.");
    }
  };

  // -----------------------------------------
  // UNPUBLISH BLUEPRINT
  // -----------------------------------------

  const unpublishBlueprint = async (blueprint) => {
    try {
      const { error } = await supabase
        .from("blueprints")
        .update({
          status: "draft",
          updated_at: new Date().toISOString(),
        })
        .eq("id", blueprint.id);

      if (error) throw error;

      applyStatus(blueprint, {
        status: "draft",
      });
    } catch (err) {
      console.error("Blueprint unpublish error:", err);
      setError(err.message || "Unable to unpublish blueprint.");
    }
  };

  // -----------------------------------------
  // VERIFY CREATOR
  // -----------------------------------------

  const toggleVerified = async (creator) => {
    const verified = !creator.verified;

    try {
      const { error } = await supabase
        .from("creators")
        .update({
          verified,
          updated_at: new Date().toISOString(),
        })
        .eq("id", creator.id);

      if (error) throw error;

      setCreators((list) =>
        list.map((item) =>
          item.id === creator.id
            ? { ...item, verified }
            : item
        )
      );
    } catch (err) {
      console.error("Creator verification error:", err);
      setError(err.message || "Unable to update creator verification.");
    }
  };

  // -----------------------------------------
  // UPDATE ENQUIRY STATUS
  // -----------------------------------------

  const setEnquiryStatus = async (enquiry, status) => {
    try {
      const { error } = await supabase
        .from("enquiries")
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", enquiry.id);

      if (error) throw error;

      setEnquiries((list) =>
        list.map((item) =>
          item.id === enquiry.id
            ? { ...item, status }
            : item
        )
      );
    } catch (err) {
      console.error("Enquiry status update error:", err);
      setError(err.message || "Unable to update enquiry.");
    }
  };

  // -----------------------------------------
  // COUNTS
  // -----------------------------------------

  const unverified = creators.filter(
    (creator) => !creator.verified
  ).length;

  const openEnquiries = enquiries.filter(
    (enquiry) => enquiry.status === "new"
  ).length;

  const pendingCount = blueprints.filter(
    (blueprint) => blueprint.status === "pending"
  ).length;

  // -----------------------------------------
  // UI
  // -----------------------------------------

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Internal"
        title="Admin console"
        description="Approve new blueprints, verify the operators behind them, and work through incoming enquiries."
      />

      {error && (
        <div className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* TABS */}

      <div className="flex flex-wrap gap-2">
        {TABS.map((item) => {
          const count =
            item.key === "blueprints"
              ? pendingCount
              : item.key === "creators"
                ? unverified
                : openEnquiries;

          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setTab(item.key)}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm",
                tab === item.key
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />

              {item.label}

              {count > 0 && (
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10px]",
                    tab === item.key
                      ? "bg-primary-foreground/20"
                      : "bg-secondary"
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* CONTENT */}

      {loading ? (
        <LoadingBlock rows={5} />
      ) : (
        <div className="space-y-3">

          {/* BLUEPRINT APPROVALS */}

          {tab === "blueprints" &&
            (blueprints.length ? (
              blueprints.map((blueprint) => (
                <article
                  key={blueprint.id}
                  className="rounded-2xl border border-border bg-card p-5"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-base font-medium">
                          {blueprint.title}
                        </h2>

                        <StatusBadge
                          status={blueprint.status}
                          label={
                            blueprint.status === "pending"
                              ? "Awaiting review"
                              : blueprint.status === "rejected"
                                ? "Sent back"
                                : blueprint.status === "published"
                                  ? "Live"
                                  : "Draft"
                          }
                        />
                      </div>

                      <p className="mt-1 text-xs text-muted-foreground">
                        {blueprint.creator_name || "Unknown creator"} ·{" "}
                        {blueprint.category} ·{" "}
                        {blueprint.is_free
                          ? "Free"
                          : formatINR(blueprint.price)}{" "}
                        · submitted{" "}
                        {formatDate(
                          blueprint.created_at || blueprint.created_date
                        )}
                      </p>

                      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                        {blueprint.summary}
                      </p>

                      {blueprint.review_note && (
                        <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
                          <span className="font-medium">
                            Feedback sent:{" "}
                          </span>
                          {blueprint.review_note}
                        </p>
                      )}

                      <p className="mt-3 text-xs text-muted-foreground">
                        {blueprint.roadmap?.length || 0} roadmap phases ·{" "}
                        {blueprint.investment_breakdown?.length || 0} cost
                        lines · {blueprint.licenses?.length || 0} licences
                      </p>
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-2">
                      {blueprint.status !== "published" && (
                        <Button
                          size="sm"
                          className="rounded-full"
                          onClick={() => approveBlueprint(blueprint)}
                        >
                          <CheckCircle2 className="mr-1.5 h-4 w-4" />
                          Publish
                        </Button>
                      )}

                      {blueprint.status === "pending" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-full"
                          onClick={() => setRejecting(blueprint)}
                        >
                          <RotateCcw className="mr-1.5 h-4 w-4" />
                          Send back
                        </Button>
                      )}

                      {blueprint.status === "published" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-full"
                          onClick={() => unpublishBlueprint(blueprint)}
                        >
                          Unpublish
                        </Button>
                      )}
                    </div>
                  </div>

                  <Link
                    to={`/blueprint/${blueprint.slug}`}
                    className="mt-3 inline-block text-xs font-medium text-primary hover:underline"
                  >
                    Preview submission
                  </Link>
                </article>
              ))
            ) : (
              <p className="rounded-2xl border border-dashed border-border px-5 py-10 text-center text-sm text-muted-foreground">
                No blueprints yet.
              </p>
            ))}

          {/* CREATOR VERIFICATION */}

          {tab === "creators" &&
            (creators.length ? (
              creators.map((creator) => (
                <article
                  key={creator.id}
                  className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base font-medium">
                        {creator.name}
                      </h2>

                      <StatusBadge
                        status={
                          creator.verified ? "verified" : "pending"
                        }
                        label={
                          creator.verified ? "Verified" : "Unverified"
                        }
                      />

                      {creator.user_id && (
                        <StatusBadge
                          status="active"
                          label="Account linked"
                        />
                      )}
                    </div>

                    <p className="mt-1 text-xs text-muted-foreground">
                      {creator.headline || "No headline"} ·{" "}
                      {creator.city || "Location not set"}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <Link
                      to={`/creator/${creator.slug}`}
                      className="rounded-full border border-border px-3.5 py-2 text-xs font-medium hover:bg-secondary"
                    >
                      View profile
                    </Link>

                    <Button
                      size="sm"
                      variant={
                        creator.verified ? "outline" : "default"
                      }
                      className="rounded-full"
                      onClick={() => toggleVerified(creator)}
                    >
                      {creator.verified
                        ? "Remove verification"
                        : "Verify creator"}
                    </Button>
                  </div>
                </article>
              ))
            ) : (
              <p className="rounded-2xl border border-dashed border-border px-5 py-10 text-center text-sm text-muted-foreground">
                No creators yet.
              </p>
            ))}

          {/* ENQUIRIES */}

          {tab === "enquiries" &&
            (enquiries.length ? (
              enquiries.map((enquiry) => (
                <article
                  key={enquiry.id}
                  className="rounded-2xl border border-border bg-card p-5"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-base font-medium">
                          {enquiry.name}
                        </h2>

                        <StatusBadge status={enquiry.status} />

                        <span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                          {String(enquiry.type || "").replace(/-/g, " ")}
                        </span>
                      </div>

                      <p className="mt-1 text-xs text-muted-foreground">
                        {enquiry.email}
                        {enquiry.phone ? ` · ${enquiry.phone}` : ""} ·{" "}
                        {formatDate(
                          enquiry.created_at || enquiry.created_date
                        )}
                      </p>

                      {enquiry.blueprint_title && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          About: {enquiry.blueprint_title}
                        </p>
                      )}

                      {enquiry.message && (
                        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                          {enquiry.message}
                        </p>
                      )}
                    </div>

                    <div className="flex shrink-0 gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-full"
                        disabled={enquiry.status === "contacted"}
                        onClick={() =>
                          setEnquiryStatus(enquiry, "contacted")
                        }
                      >
                        Mark contacted
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        className="rounded-full"
                        disabled={enquiry.status === "closed"}
                        onClick={() =>
                          setEnquiryStatus(enquiry, "closed")
                        }
                      >
                        Close
                      </Button>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <p className="rounded-2xl border border-dashed border-border px-5 py-10 text-center text-sm text-muted-foreground">
                No enquiries yet.
              </p>
            ))}
        </div>
      )}

      {/* REJECT DIALOG */}

      <RejectDialog
        open={Boolean(rejecting)}
        blueprint={rejecting}
        onOpenChange={(open) =>
          setRejecting(open ? rejecting : null)
        }
        onReject={rejectBlueprint}
      />

      {/* FOOTER */}

      <div className="rounded-2xl border border-border bg-secondary/40 p-5 text-sm text-muted-foreground">
        <Users className="mb-2 h-4 w-4" />

        Payout runs and creator payouts are managed from the Payout
        records; creators see their own history under Payout settings.
      </div>
    </div>
  );
}