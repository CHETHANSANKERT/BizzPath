export function projectProgress(project) {
  const milestones = project?.milestones || [];
  if (!milestones.length) return 0;
  const done = milestones.filter((item) => item.done).length;
  return Math.round((done / milestones.length) * 100);
}

export function milestoneCounts(project) {
  const milestones = project?.milestones || [];
  return {
    total: milestones.length,
    done: milestones.filter((item) => item.done).length,
  };
}

export function milestonesFromRoadmap(roadmap) {
  const milestones = [];
  (roadmap || []).forEach((phase, phaseIndex) => {
    (phase.actions || []).forEach((action, actionIndex) => {
      milestones.push({
        id: `p${phaseIndex}-a${actionIndex}`,
        phase: phase.phase || `Phase ${phaseIndex + 1}`,
        title: action,
        done: false,
      });
    });
  });
  return milestones;
}

export function groupByPhase(milestones) {
  const groups = [];
  (milestones || []).forEach((item) => {
    const phase = item.phase || "Steps";
    const existing = groups.find((group) => group.phase === phase);
    if (existing) existing.items.push(item);
    else groups.push({ phase, items: [item] });
  });
  return groups;
}

export function nextMilestone(project) {
  return (project?.milestones || []).find((item) => !item.done) || null;
}