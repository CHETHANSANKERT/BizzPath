import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  Download,
  Library,
  Receipt,
  Wallet,
} from "lucide-react";

import { useAuth } from "@/lib/AuthContext";

import {
  getPurchaseLibrary,
} from "@/services/purchaseService";

import PageHeader from "@/components/account/PageHeader";
import StatCard from "@/components/account/StatCard";
import EmptyState from "@/components/account/EmptyState";
import LoadingBlock from "@/components/LoadingBlock";
import BlueprintCover from "@/components/BlueprintCover";

import { downloadBlueprintPdf } from "@/lib/blueprintPdf";

import {
  formatDate,
  formatINR,
} from "@/lib/format";

export default function MyPurchases() {
  const { user } = useAuth();

  const [purchases, setPurchases] = useState([]);
  const [blueprints, setBlueprints] = useState({});

  const [loading, setLoading] = useState(true);

  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  /**
   * Load purchase history from Supabase.
   */
  useEffect(() => {
    let mounted = true;

    const loadPurchases = async () => {
      if (!user?.id) {
        setPurchases([]);
        setBlueprints({});
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const result = await getPurchaseLibrary(user.id);

        if (!mounted) return;

        setPurchases(result.purchases);
        setBlueprints(result.blueprints);

      } catch (err) {
        console.error(
          "Failed to load purchase history:",
          err
        );

        if (mounted) {
          setError(
            err.message || "Unable to load purchases."
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadPurchases();

    return () => {
      mounted = false;
    };
  }, [user?.id]);

  /**
   * Paid purchases.
   */
  const paid = purchases.filter(
    (purchase) => purchase.status === "paid"
  );

  /**
   * Total invested amount.
   */
  const invested = paid.reduce(
    (sum, purchase) =>
      sum + (Number(purchase.amount) || 0),
    0
  );

  /**
   * Download blueprint PDF.
   */
  const download = (purchase) => {
    const blueprint = blueprints[purchase.blueprint_slug];

    if (!blueprint) {
      setNote(
        "That blueprint is no longer published, so a fresh copy can't be generated."
      );

      return;
    }

    try {
      setNote("");

      downloadBlueprintPdf(blueprint);
    } catch (err) {
      console.error("PDF download failed:", err);

      setNote(
        "Unable to generate the blueprint PDF. Please try again."
      );
    }
  };

  return (
    <div className="space-y-8">

      {/* Page Header */}
      <PageHeader
        eyebrow="Library"
        title="My purchases"
        description="Every blueprint you own — reopen it any time, or download a PDF copy for offline work."
        action={
          <Link
            to="/project-budget"
            className="rounded-full border border-border px-4 py-2.5 text-sm font-medium hover:bg-secondary"
          >
            Budget my project
          </Link>
        }
      />

      {/* Loading */}
      {loading ? (

        <LoadingBlock rows={6} />

      ) : error ? (

        /* Error State */
        <div
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {error}
        </div>

      ) : purchases.length ? (

        <>

          {/* Purchase Statistics */}
          <div className="grid gap-4 sm:grid-cols-3">

            <StatCard
              label="Blueprints owned"
              value={purchases.length}
              icon={Library}
              hint="Yours for life"
            />

            <StatCard
              label="Total invested"
              value={formatINR(invested)}
              icon={Wallet}
              hint={`${paid.length} paid`}
            />

            <StatCard
              label="Latest acquisition"
              value={
                formatDate(
                  purchases[0]?.purchased_at ||
                  purchases[0]?.created_date
                ) || "—"
              }
              icon={Receipt}
              hint={purchases[0]?.blueprint_title || ""}
            />

          </div>

          {/* Notification */}
          {note && (
            <p className="rounded-xl bg-secondary px-4 py-3 text-xs text-muted-foreground">
              {note}
            </p>
          )}

          {/* Purchase Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

            {purchases.map((purchase) => {

              const blueprint =
                blueprints[purchase.blueprint_slug];

              return (

                <article
                  key={purchase.id}
                  className="overflow-hidden rounded-2xl border border-border bg-card"
                >

                  {/* Blueprint Cover */}
                  <BlueprintCover
                    category={
                      purchase.category ||
                      blueprint?.category
                    }
                    title={purchase.blueprint_title || ""}
                    className="h-28"
                  />

                  <div className="p-4">

                    {/* Blueprint Title */}
                    <Link
                      to={`/blueprint/${purchase.blueprint_slug}`}
                      className="font-display text-base leading-snug hover:text-primary"
                    >
                      {purchase.blueprint_title}
                    </Link>

                    {/* Creator and Purchase Date */}
                    <p className="mt-1 text-xs text-muted-foreground">
                      {purchase.creator_name || "BizPath"}
                      {" · "}
                      {formatDate(
                        purchase.purchased_at ||
                        purchase.created_date
                      )}
                    </p>

                    {/* Purchase Status */}
                    <div className="mt-2">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ${
                          purchase.status === "paid"
                            ? "bg-green-500/10 text-green-600"
                            : "bg-secondary text-muted-foreground"
                        }`}
                      >
                        {purchase.status || "Pending"}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="mt-4 flex items-center justify-between gap-2">

                      <Link
                        to={`/blueprint/${purchase.blueprint_slug}`}
                        className="rounded-full bg-primary px-3.5 py-2 text-xs font-medium text-primary-foreground"
                      >
                        Open blueprint
                      </Link>

                      <button
                        type="button"
                        onClick={() => download(purchase)}
                        disabled={!blueprint}
                        title={
                          !blueprint
                            ? "Blueprint is no longer available"
                            : "Download PDF"
                        }
                        className="inline-flex items-center gap-1.5 rounded-full border border-border px-3.5 py-2 text-xs font-medium hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Download className="h-3.5 w-3.5" />

                        PDF
                      </button>

                    </div>

                  </div>

                </article>

              );

            })}

          </div>

        </>

      ) : (

        /* Empty State */
        <EmptyState
          icon={Library}
          title="Your library is empty"
          description="Blueprints you buy or claim appear here with a download copy and a link back into the full plan."
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
  );
}