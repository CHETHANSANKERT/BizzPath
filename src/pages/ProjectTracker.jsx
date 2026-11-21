import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ListChecks,
  Plus,
  Trash2,
  ExternalLink,
} from "lucide-react";

import { useAuth } from "@/lib/AuthContext";

import {
  getMyProjects,
  getMyPaidPurchases,
  getBlueprintById,
  ensureProject,
  updateProject,
  deleteProject,
} from "@/services/projectTrackerService";

import {
  groupByPhase,
  milestoneCounts,
  projectProgress,
} from "@/lib/projects";

import PageHeader from "@/components/account/PageHeader";
import EmptyState from "@/components/account/EmptyState";
import LoadingBlock from "@/components/LoadingBlock";

import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { formatDate } from "@/lib/format";

const STATUS_OPTIONS = [
  "planning",
  "active",
  "paused",
  "completed",
];

export default function ProjectTracker() {
  const { user } = useAuth();

  const [projects, setProjects] = useState([]);
  const [purchased, setPurchased] = useState([]);

  const [loading, setLoading] = useState(true);

  const [activeId, setActiveId] = useState("");
  const [pickId, setPickId] = useState("");

  const [showPicker, setShowPicker] = useState(false);
  const [newStep, setNewStep] = useState("");

  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  /**
   * Load projects and purchases.
   */
  const load = async () => {
    if (!user?.id) {
      setProjects([]);
      setPurchased([]);
      setLoading(false);
      return [];
    }

    const [projectRows, purchaseRows] = await Promise.all([
      getMyProjects(user.id),
      getMyPaidPurchases(user.id),
    ]);

    setProjects(projectRows);
    setPurchased(purchaseRows);

    setLoading(false);

    return projectRows;
  };

  /**
   * Initial loading.
   */
  useEffect(() => {
    let active = true;

    async function initialize() {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const [projectRows, purchaseRows] = await Promise.all([
          getMyProjects(user.id),
          getMyPaidPurchases(user.id),
        ]);

        if (!active) return;

        setProjects(projectRows);
        setPurchased(purchaseRows);

        const initial = new URLSearchParams(
          window.location.search
        ).get("project") || "";

        const match =
          projectRows.find((project) => project.id === initial) ||
          projectRows[0];

        if (match) {
          setActiveId(match.id);
        }
      } catch (err) {
        console.error("Error loading project tracker:", err);

        if (active) {
          setError("Unable to load your projects. Please try again.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    initialize();

    return () => {
      active = false;
    };
  }, [user?.id]);

  /**
   * Active project.
   */
  const active =
    projects.find((project) => project.id === activeId) ||
    projects[0] ||
    null;

  const milestones = active?.milestones || [];

  const progress = projectProgress(active);
  const counts = milestoneCounts(active);

  /**
   * Update project with optimistic UI.
   */
  const patch = async (changes) => {
    if (!active || !user?.id || saving) return;

    const previousProjects = projects;

    const updatedProject = {
      ...active,
      ...changes,
    };

    setProjects((list) =>
      list.map((project) =>
        project.id === active.id
          ? updatedProject
          : project
      )
    );

    setSaving(true);
    setError("");

    try {
      const savedProject = await updateProject(
        active.id,
        user.id,
        changes
      );

      setProjects((list) =>
        list.map((project) =>
          project.id === savedProject.id
            ? savedProject
            : project
        )
      );
    } catch (err) {
      console.error("Error updating project:", err);

      setProjects(previousProjects);

      setError(
        err.message || "Unable to update the project."
      );
    } finally {
      setSaving(false);
    }
  };

  /**
   * Toggle milestone completion.
   */
  const toggleStep = (id) => {
    const updated = milestones.map((item) =>
      item.id === id
        ? {
            ...item,
            done: !item.done,
          }
        : item
    );

    patch({
      milestones: updated,
    });
  };

  /**
   * Add a custom milestone.
   */
  const addStep = async () => {
    const title = newStep.trim();

    if (!title || !active || saving) return;

    const id = `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 6)}`;

    await patch({
      milestones: [
        ...milestones,
        {
          id,
          phase: "My own steps",
          title,
          done: false,
        },
      ],
    });

    setNewStep("");
  };

  /**
   * Start tracking a purchased blueprint.
   */
  const startProject = async () => {
    if (!user?.id || !pickId || busy) return;

    const purchase = purchased.find(
      (item) => item.blueprint_id === pickId
    );

    if (!purchase) {
      setError("Please select a blueprint you have purchased.");
      return;
    }

    setBusy(true);
    setError("");

    try {
      const blueprint = await getBlueprintById(
        purchase.blueprint_id
      );

      const project = await ensureProject(
        blueprint,
        user.id
      );

      const list = await load();

      setActiveId(project.id);

      // Ensure the newly created project is selected immediately.
      if (!list.some((item) => item.id === project.id)) {
        setProjects((previous) => [
          project,
          ...previous,
        ]);
      }

      setPickId("");
      setShowPicker(false);
    } catch (err) {
      console.error("Error creating project:", err);

      setError(
        err.message || "Unable to create the project."
      );
    } finally {
      setBusy(false);
    }
  };

  /**
   * Remove project.
   */
  const removeProject = async () => {
    if (!active || !user?.id) return;

    const confirmed = window.confirm(
      `Stop tracking "${active.blueprint_title}"? This removes its checked steps.`
    );

    if (!confirmed) return;

    setBusy(true);
    setError("");

    try {
      await deleteProject(active.id, user.id);

      const list = await load();

      setActiveId(list[0]?.id || "");
    } catch (err) {
      console.error("Error deleting project:", err);

      setError(
        err.message || "Unable to remove this project."
      );
    } finally {
      setBusy(false);
    }
  };

  /**
   * Loading state.
   */
  if (loading) {
    return (
      <div className="space-y-8">
        <PageHeader
          eyebrow="Execution"
          title="Project tracker"
          description="Loading your projects…"
        />

        <LoadingBlock rows={6} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <PageHeader
        eyebrow="Execution"
        title="Project tracker"
        description="Turn a blueprint into a checklist and work through each milestone at your own pace."
        action={
          <Button
            className="rounded-full"
            onClick={() =>
              setShowPicker((value) => !value)
            }
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Track a blueprint
          </Button>
        }
      />

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Blueprint Picker */}
      {showPicker && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-sm font-medium">
            Which business are you starting?
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            We will set up every roadmap step from the blueprint
            as a checklist.
          </p>

          {purchased.length ? (
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <Select
                value={pickId}
                onValueChange={setPickId}
              >
                <SelectTrigger className="sm:w-80">
                  <SelectValue placeholder="Choose a blueprint you own" />
                </SelectTrigger>

                <SelectContent>
                  {purchased
                    .filter((purchase) => purchase.blueprint_id)
                    .map((purchase) => (
                      <SelectItem
                        key={purchase.id}
                        value={purchase.blueprint_id}
                      >
                        {purchase.blueprint_title}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>

              <Button
                onClick={startProject}
                disabled={!pickId || busy}
              >
                {busy ? "Setting up…" : "Create project"}
              </Button>
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">
              You need blueprint access first.{" "}
              <Link
                to="/explore"
                className="text-primary hover:underline"
              >
                Find a business to start
              </Link>.
            </p>
          )}
        </div>
      )}

      {/* Project Content */}
      {active ? (
        <div className="space-y-6">
          {/* Project Tabs */}
          <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1">
            {projects.map((project) => (
              <button
                key={project.id}
                type="button"
                onClick={() => setActiveId(project.id)}
                className={`shrink-0 rounded-full border px-3.5 py-2 text-xs ${
                  project.id === active.id
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground"
                }`}
              >
                {project.blueprint_title}
              </button>
            ))}
          </div>

          {/* Main Project Card */}
          <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-xl">
                  {active.blueprint_title}
                </h2>

                <p className="mt-1 text-xs text-muted-foreground">
                  Started{" "}
                  {formatDate(
                    active.start_date || active.created_date
                  )}{" "}
                  · {counts.done} of {counts.total} steps done
                </p>
              </div>

              <div className="flex items-center gap-2">
                {/* Status */}
                <Select
                  value={active.status || "planning"}
                  onValueChange={(value) =>
                    patch({ status: value })
                  }
                  disabled={saving}
                >
                  <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    {STATUS_OPTIONS.map((status) => (
                      <SelectItem
                        key={status}
                        value={status}
                        className="capitalize"
                      >
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Open Blueprint */}
                <Link
                  to={`/blueprint/${active.blueprint_slug}`}
                  className="grid h-9 w-9 place-items-center rounded-md border border-input text-muted-foreground hover:text-foreground"
                  aria-label="Open blueprint"
                >
                  <ExternalLink className="h-4 w-4" />
                </Link>

                {/* Remove Project */}
                <button
                  type="button"
                  onClick={removeProject}
                  disabled={busy || saving}
                  className="grid h-9 w-9 place-items-center rounded-md border border-input text-muted-foreground hover:text-destructive disabled:opacity-50"
                  aria-label="Remove project"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Progress */}
            <div className="mt-5">
              <Progress
                value={progress}
                className="h-2"
              />

              <p className="mt-2 text-xs text-muted-foreground">
                {progress}% complete
              </p>
            </div>

            {/* Milestones */}
            <div className="mt-6 space-y-6">
              {groupByPhase(milestones).map((group) => (
                <div key={group.phase}>
                  <p className="eyebrow">
                    {group.phase}
                  </p>

                  <ul className="mt-3 space-y-1">
                    {group.items.map((item) => (
                      <li
                        key={item.id}
                        className="flex items-start gap-3 rounded-lg px-2 py-2 hover:bg-secondary/60"
                      >
                        <Checkbox
                          checked={item.done}
                          onCheckedChange={() =>
                            toggleStep(item.id)
                          }
                          disabled={saving}
                          className="mt-0.5"
                        />

                        <span
                          className={`text-sm leading-relaxed ${
                            item.done
                              ? "text-muted-foreground line-through"
                              : ""
                          }`}
                        >
                          {item.title}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}

              {!milestones.length && (
                <p className="text-sm text-muted-foreground">
                  This blueprint has no roadmap steps yet —
                  add your own below.
                </p>
              )}
            </div>

            {/* Add Custom Milestone */}
            <div className="mt-6 flex flex-col gap-2 border-t border-border pt-5 sm:flex-row">
              <Input
                value={newStep}
                onChange={(event) =>
                  setNewStep(event.target.value)
                }
                onKeyDown={(event) =>
                  event.key === "Enter" && addStep()
                }
                placeholder="Add your own step…"
                disabled={saving}
              />

              <Button
                variant="outline"
                onClick={addStep}
                disabled={!newStep.trim() || saving}
              >
                Add step
              </Button>
            </div>
          </div>

          {/* Project Notes */}
          <div className="rounded-2xl border border-border bg-secondary/40 p-5">
            <p className="text-sm font-medium">
              Notes for this project
            </p>

            <textarea
              value={active.notes || ""}
              onChange={(event) =>
                patch({ notes: event.target.value })
              }
              placeholder="Site visits, supplier contacts, licence numbers…"
              rows={3}
              className="mt-3 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
        </div>
      ) : (
        /* Empty State */
        <EmptyState
          icon={ListChecks}
          title="No projects yet"
          description="Start tracking a blueprint and every roadmap step becomes a checklist you can tick off."
          action={
            <Button
              className="rounded-full"
              onClick={() => setShowPicker(true)}
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Track a blueprint
            </Button>
          }
        />
      )}
    </div>
  );
}