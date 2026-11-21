import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Wallet, PiggyBank, Receipt } from "lucide-react";

import { useAuth } from "@/lib/AuthContext";

import {
  getMyProjects,
  getMyProjectBudgets,
  saveProjectBudget,
} from "@/services/projectBudgetService";

import PageHeader from "@/components/account/PageHeader";
import StatCard from "@/components/account/StatCard";
import EmptyState from "@/components/account/EmptyState";
import LoadingBlock from "@/components/LoadingBlock";
import BudgetSetup from "@/components/budget/BudgetSetup";
import ExpenseTracker from "@/components/budget/ExpenseTracker";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { formatINR } from "@/lib/format";

const spentOf = (rows) =>
  rows.reduce(
    (sum, expense) => sum + (Number(expense.amount) || 0),
    0
  );

export default function ProjectBudget() {
  const { user } = useAuth();

  const [projects, setProjects] = useState([]);
  const [budgets, setBudgets] = useState([]);

  const [projectId, setProjectId] = useState("");

  const [capital, setCapital] = useState("");
  const [expectedRevenue, setExpectedRevenue] = useState("");
  const [expenses, setExpenses] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [savedId, setSavedId] = useState("");
  const [error, setError] = useState("");

  /**
   * Load projects and budgets.
   */
  useEffect(() => {
    let active = true;

    async function loadData() {
      if (!user?.id) {
        setProjects([]);
        setBudgets([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const [projectRows, budgetRows] = await Promise.all([
          getMyProjects(user.id),
          getMyProjectBudgets(user.id),
        ]);

        if (!active) return;

        setProjects(projectRows);
        setBudgets(budgetRows);

        const initial = budgetRows[0];

        if (initial) {
          setProjectId(initial.project_id || "");
          setCapital(String(initial.capital ?? ""));
          setExpectedRevenue(
            String(initial.expected_monthly_revenue ?? "")
          );
          setExpenses(initial.expenses || []);
          setSavedId(initial.id);
        } else if (projectRows[0]) {
          setProjectId(projectRows[0].id);

          setExpectedRevenue(
            String(projectRows[0].monthly_revenue_potential ?? "")
          );
        }
      } catch (err) {
        console.error("Error loading project budgets:", err);

        if (active) {
          setError("Unable to load your project budgets. Please try again.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      active = false;
    };
  }, [user?.id]);

  /**
   * Selected project.
   */
  const project =
    projects.find((item) => item.id === projectId) || null;

  /**
   * Budget associated with selected project.
   */
  const budget =
    budgets.find((item) => item.project_id === projectId) || null;

  /**
   * Financial calculations.
   */
  const spent = spentOf(expenses);

  const remaining = (Number(capital) || 0) - spent;

  /**
   * Change selected project and load its budget.
   */
  const chooseProject = (id) => {
    setProjectId(id);
    setError("");

    const found = budgets.find(
      (item) => item.project_id === id
    );

    const picked = projects.find(
      (item) => item.id === id
    );

    setCapital(String(found?.capital ?? ""));

    setExpectedRevenue(
      String(
        found?.expected_monthly_revenue ??
          picked?.monthly_revenue_potential ??
          ""
      )
    );

    setExpenses(found?.expenses || []);
    setSavedId(found?.id || "");
  };

  /**
   * Save project budget.
   */
  const save = async () => {
    if (!user?.id) {
      setError("Please log in to save your budget.");
      return;
    }

    if (!projectId) {
      setError("Please select a project first.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const payload = {
        project_id: project?.id || projectId,

        project_title:
          project?.blueprint_title ||
          budget?.project_title ||
          "My project",

        blueprint_title:
          project?.blueprint_title ||
          budget?.blueprint_title ||
          "",

        category:
          project?.category ||
          budget?.category ||
          "",

        capital: Number(capital) || 0,

        expected_monthly_revenue:
          Number(expectedRevenue) || 0,

        expenses,
      };

      const record = await saveProjectBudget({
        budgetId: budget?.id || savedId || null,
        userId: user.id,
        payload,
      });

      setBudgets((previous) => {
        const exists = previous.some(
          (item) => item.id === record.id
        );

        if (exists) {
          return previous.map((item) =>
            item.id === record.id ? record : item
          );
        }

        return [record, ...previous];
      });

      setSavedId(record.id);
    } catch (err) {
      console.error("Error saving project budget:", err);

      setError(
        err.message || "Unable to save your project budget."
      );
    } finally {
      setSaving(false);
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
          title="Project budget"
          description="Loading your budgets…"
        />

        <LoadingBlock rows={6} />
      </div>
    );
  }

  /**
   * Empty state.
   */
  if (!projects.length && !budgets.length) {
    return (
      <div className="space-y-8">
        <PageHeader
          eyebrow="Execution"
          title="Project budget"
        />

        {error && (
          <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        )}

        <EmptyState
          icon={Wallet}
          title="Start a project first"
          description="Budgets are attached to a business project. Open a blueprint you own to start tracking it, then come back here."
          action={
            <Link
              to="/my-purchases"
              className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              View my blueprints
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <PageHeader
        eyebrow="Execution"
        title="Project budget"
        description="Enter the capital you have, log what you spend, and watch what is left before you launch."
        action={
          <Link
            to="/investment-analytics"
            className="rounded-full border border-border px-4 py-2.5 text-sm font-medium hover:bg-secondary"
          >
            Investment analytics
          </Link>
        }
      />

      {/* Error */}
      {error && (
        <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}

      {/* Project Selector */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <label className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
          Project
        </label>

        <Select
          value={projectId}
          onValueChange={chooseProject}
        >
          <SelectTrigger className="mt-2 w-full sm:max-w-sm">
            <SelectValue placeholder="Choose a project" />
          </SelectTrigger>

          <SelectContent>
            {projects.map((item) => (
              <SelectItem
                key={item.id}
                value={item.id}
              >
                {item.blueprint_title ||
                  item.project_title ||
                  "Project"}
              </SelectItem>
            ))}

            {budgets
              .filter(
                (item) =>
                  !projects.some(
                    (entry) => entry.id === item.project_id
                  )
              )
              .filter((item) => Boolean(item.project_id))
              .map((item) => (
                <SelectItem
                  key={item.id}
                  value={item.project_id}
                >
                  {item.project_title ||
                    item.blueprint_title ||
                    "Budget"}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      {/* Financial Statistics */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Capital"
          value={formatINR(Number(capital) || 0)}
          icon={PiggyBank}
          hint="Committed to this business"
        />

        <StatCard
          label="Spent so far"
          value={formatINR(spent)}
          icon={Receipt}
          hint={`${expenses.length} expenses logged`}
        />

        <StatCard
          label="Remaining"
          value={formatINR(remaining)}
          icon={Wallet}
          hint={
            Number(capital)
              ? `${Math.round(
                  (spent / Number(capital)) * 100
                )}% of capital used`
              : "Add capital to track"
          }
        />
      </div>

      {/* Budget Setup */}
      <BudgetSetup
        capital={capital}
        expectedRevenue={expectedRevenue}
        onCapital={setCapital}
        onExpectedRevenue={setExpectedRevenue}
        onSave={save}
        saving={saving}
        hasSaved={Boolean(savedId)}
      />

      {/* Expense Tracker */}
      <ExpenseTracker
        expenses={expenses}
        spent={spent}
        onAdd={(expense) =>
          setExpenses((previous) => [
            ...previous,
            expense,
          ])
        }
        onRemove={(index) =>
          setExpenses((previous) =>
            previous.filter((_, i) => i !== index)
          )
        }
      />

      <p className="text-xs text-muted-foreground">
        Expense changes are saved when you press Update budget.
      </p>
    </div>
  );
}