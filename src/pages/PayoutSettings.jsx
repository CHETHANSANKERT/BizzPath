import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { Wallet, PenLine } from "lucide-react";

import { useAuth } from "@/lib/AuthContext";

import {
  getPayoutDashboard,
  savePayoutAccount,
} from "@/services/payoutService";

import PageHeader from "@/components/account/PageHeader";
import StatCard from "@/components/account/StatCard";
import EmptyState from "@/components/account/EmptyState";
import StatusBadge from "@/components/account/StatusBadge";
import LoadingBlock from "@/components/LoadingBlock";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  formatDate,
  formatINR,
} from "@/lib/format";

import { cn } from "@/lib/utils";

const EMPTY_FORM = {
  method: "upi",
  upi_id: "",
  account_name: "",
  account_number: "",
  ifsc: "",
};

export default function PayoutSettings() {
  const { user } = useAuth();

  const [creator, setCreator] = useState(null);
  const [account, setAccount] = useState(null);

  const [payouts, setPayouts] = useState([]);

  const [earned, setEarned] = useState(0);

  const [form, setForm] = useState(EMPTY_FORM);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  /**
   * Load creator payout information.
   */
  useEffect(() => {
    let mounted = true;

    const loadPayoutData = async () => {
      if (!user?.id) {
        setCreator(null);
        setAccount(null);
        setPayouts([]);
        setEarned(0);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const result = await getPayoutDashboard(user.id);

        if (!mounted) return;

        setCreator(result.creator);
        setAccount(result.account);
        setPayouts(result.payouts);
        setEarned(result.earned);

        /**
         * Populate existing payout details.
         */
        if (result.account) {
          setForm({
            method: result.account.method || "upi",
            upi_id: result.account.upi_id || "",
            account_name: result.account.account_name || "",
            account_number: result.account.account_number || "",
            ifsc: result.account.ifsc || "",
          });
        } else {
          setForm(EMPTY_FORM);
        }
      } catch (err) {
        console.error("Payout loading failed:", err);

        if (mounted) {
          setError(
            err.message || "Unable to load payout information."
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadPayoutData();

    return () => {
      mounted = false;
    };
  }, [user?.id]);

  /**
   * Calculate total amount already paid.
   */
  const paidOut = payouts
    .filter((payout) => payout.status === "paid")
    .reduce(
      (sum, payout) =>
        sum + (Number(payout.amount) || 0),
      0
    );

  /**
   * Calculate available balance.
   */
  const balance = Math.max(earned - paidOut, 0);

  /**
   * Update form fields.
   */
  const updateForm = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  /**
   * Validate payout details.
   */
  const validateForm = () => {
    if (form.method === "upi") {
      if (!form.upi_id.trim()) {
        return "Add the UPI ID where we should send your payouts.";
      }

      // Basic UPI ID validation.
      const upiRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$/;

      if (!upiRegex.test(form.upi_id.trim())) {
        return "Enter a valid UPI ID.";
      }
    }

    if (form.method === "bank") {
      if (
        !form.account_number.trim() ||
        !form.ifsc.trim() ||
        !form.account_name.trim()
      ) {
        return "Add the account holder name, account number and IFSC code.";
      }

      const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;

      if (!ifscRegex.test(form.ifsc.trim().toUpperCase())) {
        return "Enter a valid IFSC code.";
      }
    }

    return null;
  };

  /**
   * Save payout details to Supabase.
   */
  const save = async () => {
    setError("");
    setMessage("");

    if (!creator) {
      setError("Creator account not found.");
      return;
    }

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);

    try {
      const payload = {
        creator_id: creator.id,
        creator_name: creator.name,

        method: form.method,

        upi_id:
          form.method === "upi"
            ? form.upi_id.trim()
            : "",

        account_name:
          form.method === "bank"
            ? form.account_name.trim()
            : "",

        account_number:
          form.method === "bank"
            ? form.account_number.trim()
            : "",

        ifsc:
          form.method === "bank"
            ? form.ifsc.trim().toUpperCase()
            : "",

        updated_on: new Date().toISOString(),
      };

      const savedAccount = await savePayoutAccount({
        accountId: account?.id,
        payload,
      });

      setAccount(savedAccount);

      setMessage(
        "Payout details saved. We verify new details within one working day."
      );
    } catch (err) {
      console.error("Payout save failed:", err);

      setError(
        err.message || "Unable to save payout details."
      );
    } finally {
      setSaving(false);
    }
  };

  /**
   * Mask bank account number for display.
   */
  const maskAccountNumber = (number) => {
    if (!number) return "";

    const value = String(number);

    return value.length > 4
      ? `•••• ${value.slice(-4)}`
      : value;
  };

  /**
   * Loading state.
   */
  if (loading) {
    return (
      <div className="space-y-8">
        <PageHeader
          eyebrow="Creator studio"
          title="Payout settings"
        />

        <LoadingBlock rows={5} />
      </div>
    );
  }

  /**
   * Creator account not found.
   */
  if (!creator) {
    return (
      <div className="space-y-8">

        <PageHeader
          eyebrow="Creator studio"
          title="Payout settings"
        />

        <EmptyState
          icon={Wallet}
          title="No creator account yet"
          description="Publish a blueprint first — payouts are linked to your creator profile."
          action={
            <Link
              to="/blueprint-builder"
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              <PenLine className="h-4 w-4" />
              Create a blueprint
            </Link>
          }
        />

        {error && (
          <p className="text-sm text-destructive">
            {error}
          </p>
        )}

      </div>
    );
  }

  return (
    <div className="space-y-8">

      {/* Page Header */}
      <PageHeader
        eyebrow={`Creator studio · ${creator.name}`}
        title="Payout settings"
        description="Tell us where to send your blueprint earnings, and follow every payout we make."
        action={
          <StatusBadge
            status={account?.status || "pending"}
            label={
              account
                ? `Details ${account.status}`
                : "Details missing"
            }
          />
        }
      />

      {/* Earnings Statistics */}
      <div className="grid gap-4 sm:grid-cols-3">

        <StatCard
          label="Total earnings"
          value={formatINR(earned)}
          icon={Wallet}
          hint="Paid blueprint sales"
        />

        <StatCard
          label="Paid out"
          value={formatINR(paidOut)}
          hint={`${payouts.length} payout runs`}
        />

        <StatCard
          label="Available balance"
          value={formatINR(balance)}
          hint="Released on the next payout run"
        />

      </div>

      {/* Payout Method */}
      <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">

        <h2 className="text-lg">
          Payout method
        </h2>

        <p className="mt-1 text-sm text-muted-foreground">
          Choose one destination. Changes take effect after verification.
        </p>

        {/* Payment Method Selector */}
        <div className="mt-5 flex gap-2">

          {[
            {
              value: "upi",
              label: "UPI",
            },
            {
              value: "bank",
              label: "Bank account",
            },
          ].map((option) => (

            <button
              key={option.value}
              type="button"
              onClick={() => {
                updateForm("method", option.value);
                setError("");
                setMessage("");
              }}
              className={cn(
                "rounded-full border px-4 py-2 text-sm",
                form.method === option.value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground"
              )}
            >
              {option.label}
            </button>

          ))}

        </div>

        {/* Existing Payout Destination */}
        {account && (

          <p className="mt-4 rounded-xl bg-secondary/60 px-4 py-3 text-xs text-muted-foreground">

            Current destination:{" "}

            <span className="font-medium text-foreground">

              {account.method === "upi"
                ? account.upi_id
                : `${maskAccountNumber(account.account_number)} · ${account.ifsc}`}

            </span>

          </p>

        )}

        {/* Payout Form */}
        <div className="mt-5 grid gap-4 sm:grid-cols-2">

          {form.method === "upi" ? (

            /* UPI Details */
            <div className="sm:col-span-2">

              <Label htmlFor="upi">
                UPI ID
              </Label>

              <Input
                id="upi"
                value={form.upi_id}
                onChange={(event) =>
                  updateForm("upi_id", event.target.value)
                }
                placeholder="yourname@bank"
                className="mt-1.5"
                autoComplete="off"
              />

            </div>

          ) : (

            /* Bank Details */
            <>

              <div>

                <Label htmlFor="holder">
                  Account holder name
                </Label>

                <Input
                  id="holder"
                  value={form.account_name}
                  onChange={(event) =>
                    updateForm("account_name", event.target.value)
                  }
                  className="mt-1.5"
                  autoComplete="off"
                />

              </div>

              <div>

                <Label htmlFor="number">
                  Account number
                </Label>

                <Input
                  id="number"
                  type="password"
                  value={form.account_number}
                  onChange={(event) =>
                    updateForm("account_number", event.target.value)
                  }
                  className="mt-1.5"
                  autoComplete="off"
                />

              </div>

              <div>

                <Label htmlFor="ifsc">
                  IFSC code
                </Label>

                <Input
                  id="ifsc"
                  value={form.ifsc}
                  onChange={(event) =>
                    updateForm(
                      "ifsc",
                      event.target.value.toUpperCase()
                    )
                  }
                  placeholder="HDFC0001234"
                  className="mt-1.5"
                  autoComplete="off"
                  maxLength={11}
                />

              </div>

            </>

          )}

        </div>

        {/* Error */}
        {error && (
          <p
            role="alert"
            className="mt-4 text-sm text-destructive"
          >
            {error}
          </p>
        )}

        {/* Success */}
        {message && (
          <p
            role="status"
            className="mt-4 text-sm text-primary"
          >
            {message}
          </p>
        )}

        {/* Save */}
        <Button
          className="mt-5 rounded-full"
          onClick={save}
          disabled={saving}
        >
          {saving ? "Saving…" : "Save payout details"}
        </Button>

      </section>

      {/* Payout History */}
      <section>

        <h2 className="text-lg">
          Payout history
        </h2>

        <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-card">

          {payouts.length ? (

            <ul className="divide-y divide-border">

              {payouts.map((payout) => (

                <li
                  key={payout.id}
                  className="flex items-center justify-between gap-4 px-5 py-4"
                >

                  <div>

                    <p className="text-sm font-medium">
                      {payout.period ||
                        formatDate(payout.created_date)}
                    </p>

                    <p className="mt-0.5 text-xs text-muted-foreground">

                      {payout.reference ||
                        "Reference pending"}

                      {payout.paid_date
                        ? ` · paid ${formatDate(payout.paid_date)}`
                        : ""}

                    </p>

                  </div>

                  <div className="flex items-center gap-4">

                    <span className="text-sm font-medium">
                      {formatINR(payout.amount)}
                    </span>

                    <StatusBadge status={payout.status} />

                  </div>

                </li>

              ))}

            </ul>

          ) : (

            <p className="px-5 py-8 text-sm text-muted-foreground">
              No payouts yet. Earnings accumulate until the monthly payout run.
            </p>

          )}

        </div>

      </section>

    </div>
  );
}