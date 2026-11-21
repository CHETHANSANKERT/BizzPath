import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Receipt, FileText } from "lucide-react";

import { useAuth } from "@/lib/AuthContext";
import { getPurchaseHistory } from "@/services/purchaseHistoryService";

import PageHeader from "@/components/account/PageHeader";
import StatCard from "@/components/account/StatCard";
import EmptyState from "@/components/account/EmptyState";
import StatusBadge from "@/components/account/StatusBadge";
import InvoiceDialog from "@/components/account/InvoiceDialog";
import LoadingBlock from "@/components/LoadingBlock";

import { formatDate, formatINR } from "@/lib/format";

export default function PurchaseHistory() {
  const { user } = useAuth();

  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [invoice, setInvoice] = useState(null);
  const [error, setError] = useState("");

  /**
   * Load purchase history.
   */
  useEffect(() => {
    let active = true;

    async function loadPurchases() {
      if (!user?.id) {
        setPurchases([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const rows = await getPurchaseHistory(user.id);

        if (active) {
          setPurchases(rows);
        }
      } catch (err) {
        console.error("Purchase history error:", err);

        if (active) {
          setError(
            "Unable to load your purchase history. Please try again."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadPurchases();

    return () => {
      active = false;
    };
  }, [user?.id]);

  /**
   * Purchase statistics.
   */
  const paid = purchases.filter(
    (purchase) => purchase.status === "paid"
  );

  const pending = purchases.filter(
    (purchase) => purchase.status === "pending"
  );

  const total = paid.reduce(
    (sum, purchase) =>
      sum + (Number(purchase.amount) || 0),
    0
  );

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <PageHeader
        eyebrow="Billing"
        title="Purchase history"
        description="Every blueprint you have acquired, with payment status and a downloadable invoice for your books."
        action={
          <Link
            to="/project-tracker"
            className="rounded-full border border-border px-4 py-2.5 text-sm font-medium hover:bg-secondary"
          >
            Open project tracker
          </Link>
        }
      />

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <LoadingBlock rows={5} />
      ) : purchases.length ? (
        <>
          {/* Statistics */}
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard
              label="Total paid"
              value={formatINR(total)}
              icon={Receipt}
              hint={`${paid.length} paid purchases`}
            />

            <StatCard
              label="Awaiting payment"
              value={pending.length}
              icon={FileText}
              hint="Invoice sent separately"
            />

            <StatCard
              label="Blueprints owned"
              value={purchases.length}
              icon={Receipt}
              hint="Yours for life"
            />
          </div>

          {/* Purchase History Table */}
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            {/* Table Header */}
            <div className="hidden grid-cols-[2.2fr_1fr_1fr_1fr_auto] gap-4 border-b border-border px-5 py-3 text-[11px] uppercase tracking-[0.14em] text-muted-foreground md:grid">
              <span>Blueprint</span>
              <span>Date</span>
              <span>Invoice</span>
              <span>Amount</span>
              <span className="text-right">Status</span>
            </div>

            {/* Purchase Rows */}
            <ul className="divide-y divide-border">
              {purchases.map((purchase) => (
                <li
                  key={purchase.id}
                  className="grid gap-2 px-5 py-4 md:grid-cols-[2.2fr_1fr_1fr_1fr_auto] md:items-center md:gap-4"
                >
                  {/* Blueprint */}
                  <div className="min-w-0">
                    <Link
                      to={`/blueprint/${purchase.blueprint_slug}`}
                      className="truncate text-sm font-medium hover:text-primary"
                    >
                      {purchase.blueprint_title}
                    </Link>

                    <p className="truncate text-xs text-muted-foreground">
                      {purchase.creator_name || "BizPath"} ·{" "}
                      {purchase.category || "Blueprint"}
                    </p>
                  </div>

                  {/* Purchase Date */}
                  <span className="text-xs text-muted-foreground">
                    {formatDate(
                      purchase.purchased_at ||
                        purchase.created_date
                    )}
                  </span>

                  {/* Invoice Number */}
                  <span className="text-xs text-muted-foreground">
                    {purchase.invoice_number || "—"}
                  </span>

                  {/* Amount */}
                  <span className="text-sm font-medium">
                    {formatINR(purchase.amount)}
                  </span>

                  {/* Status and Invoice */}
                  <div className="flex items-center justify-between gap-3 md:justify-end">
                    <StatusBadge status={purchase.status} />

                    <button
                      type="button"
                      onClick={() => setInvoice(purchase)}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      View invoice
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </>
      ) : (
        /* Empty State */
        <EmptyState
          icon={Receipt}
          title="No purchases yet"
          description="When you acquire a blueprint, its invoice and payment status will be listed here."
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

      {/* Invoice Dialog */}
      <InvoiceDialog
        open={!!invoice}
        onOpenChange={(value) => !value && setInvoice(null)}
        purchase={invoice}
      />
    </div>
  );
}