import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import StatusBadge from "@/components/account/StatusBadge";
import { milestoneCounts, nextMilestone, projectProgress } from "@/lib/projects";

export default function ProjectSummary({ project }) {
  const progress = projectProgress(project);
  const counts = milestoneCounts(project);
  const next = nextMilestone(project);

  return (
    <Link
      to={`/project-tracker?project=${project.id}`}
      className="block rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/30"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-medium">{project.blueprint_title}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {project.category || "Project"} · {counts.done} of {counts.total} steps done
          </p>
        </div>
        <StatusBadge status={project.status} />
      </div>

      <Progress value={progress} className="mt-4 h-1.5" />

      <div className="mt-3 flex items-end justify-between gap-3">
        <p className="min-w-0 text-xs text-muted-foreground">
          {next ? (
            <>
              <span className="text-foreground/70">Next:</span> {next.title}
            </>
          ) : (
            "Every step is checked off."
          )}
        </p>
        <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-primary">
          {progress}% <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </Link>
  );
}