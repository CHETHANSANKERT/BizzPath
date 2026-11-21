import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bookmark,
  Trash2,
  ArrowUpRight,
} from "lucide-react";

import { useAuth } from "@/lib/AuthContext";

import {
  getMySavedBlueprints,
  removeSavedBlueprint,
} from "@/services/savedBlueprintService";

import PageHeader from "@/components/account/PageHeader";
import EmptyState from "@/components/account/EmptyState";
import LoadingBlock from "@/components/LoadingBlock";

import { formatINR } from "@/lib/format";

export default function SavedBlueprints() {
  const { user } = useAuth();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState("");
  const [error, setError] = useState("");

  /**
   * Load saved blueprints.
   */
  useEffect(() => {
    let active = true;

    async function loadSavedBlueprints() {
      if (!user?.id) {
        setItems([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const rows = await getMySavedBlueprints(user.id);

        if (active) {
          setItems(rows);
        }
      } catch (err) {
        console.error("Saved blueprints loading error:", err);

        if (active) {
          setError(
            "Unable to load your saved blueprints. Please try again."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadSavedBlueprints();

    return () => {
      active = false;
    };
  }, [user?.id]);

  /**
   * Remove a saved blueprint.
   */
  const remove = async (id) => {
    if (!user?.id || removing) return;

    setRemoving(id);
    setError("");

    try {
      await removeSavedBlueprint(id, user.id);

      setItems((list) =>
        list.filter((item) => item.id !== id)
      );
    } catch (err) {
      console.error("Remove saved blueprint error:", err);

      setError(
        err.message || "Unable to remove this saved blueprint."
      );
    } finally {
      setRemoving("");
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <PageHeader
        eyebrow="Watchlist"
        title="Saved blueprints"
        description="The ideas you are keeping an eye on. Compare them, or open one to review the numbers again."
        action={
          <Link
            to="/compare-blueprints"
            className="rounded-full border border-border px-4 py-2.5 text-sm font-medium hover:bg-secondary"
          >
            Compare saved ideas
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
      ) : items.length ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map((item) => (
            <article
              key={item.id}
              className="flex flex-col rounded-2xl border border-border bg-card p-5"
            >
              {/* Category */}
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                {item.category || "Business idea"}
              </p>

              {/* Blueprint Title */}
              <h2 className="mt-2 text-lg leading-snug">
                {item.blueprint_title}
              </h2>

              {/* Price */}
              <p className="mt-1 text-sm text-muted-foreground">
                {item.is_free
                  ? "Free blueprint"
                  : `${formatINR(item.price)} to unlock`}
              </p>

              {/* Note */}
              {item.note && (
                <p className="mt-3 text-sm text-muted-foreground">
                  {item.note}
                </p>
              )}

              {/* Actions */}
              <div className="mt-auto flex items-center justify-between gap-3 pt-6">
                <Link
                  to={`/blueprint/${item.blueprint_slug}`}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                >
                  Open blueprint

                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>

                <button
                  type="button"
                  onClick={() => remove(item.id)}
                  disabled={removing === item.id || Boolean(removing)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />

                  {removing === item.id ? "Removing…" : "Remove"}
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        /* Empty State */
        <EmptyState
          icon={Bookmark}
          title="Nothing saved yet"
          description="Save a blueprint from any detail page and it will appear here for later."
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