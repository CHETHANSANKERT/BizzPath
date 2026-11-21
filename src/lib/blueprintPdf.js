import { jsPDF } from "jspdf";
import { formatINR, formatRange } from "@/lib/format";

function writeSection(doc, state, title, body) {
  if (!body) return;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  if (state.y > 740) {
    doc.addPage();
    state.y = 64;
  }
  doc.text(title, 48, state.y);
  state.y += 18;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const lines = doc.splitTextToSize(String(body), 500);
  lines.forEach((line) => {
    if (state.y > 780) {
      doc.addPage();
      state.y = 64;
    }
    doc.text(line, 48, state.y);
    state.y += 14;
  });
  state.y += 12;
}

export function downloadBlueprintPdf(blueprint) {
  if (!blueprint) return;
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const state = { y: 64 };

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text(String(blueprint.title || "Blueprint"), 48, state.y);
  state.y += 26;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  if (blueprint.tagline) {
    doc.text(doc.splitTextToSize(blueprint.tagline, 500), 48, state.y);
    state.y += 20;
  }
  doc.setFontSize(10);
  doc.text(
    `${blueprint.category || "Blueprint"} · ${blueprint.difficulty || "—"} · Setup ${formatRange(
      blueprint.setup_cost_min,
      blueprint.setup_cost_max
    )} · Payback ${blueprint.payback_months || "—"} months`,
    48,
    state.y
  );
  state.y += 26;

  writeSection(doc, state, "Summary", blueprint.summary);
  writeSection(doc, state, "Overview", blueprint.overview);
  writeSection(doc, state, "Target customer", blueprint.target_customer);
  writeSection(doc, state, "Market demand", blueprint.market_demand);

  if ((blueprint.investment_breakdown || []).length) {
    const rows = blueprint.investment_breakdown
      .map((row) => `${row.item}: ${formatINR(row.amount)}${row.note ? ` — ${row.note}` : ""}`)
      .join("\n");
    writeSection(doc, state, "Investment breakdown", rows);
  }
  if ((blueprint.equipment || []).length) {
    writeSection(doc, state, "Equipment", blueprint.equipment.join("\n"));
  }
  if ((blueprint.licenses || []).length) {
    writeSection(doc, state, "Licences & permits", blueprint.licenses.join("\n"));
  }
  if ((blueprint.staff_roles || []).length) {
    const rows = blueprint.staff_roles
      .map((role) => `${role.role} × ${role.count || 1} · ${formatINR(role.salary)}/month`)
      .join("\n");
    writeSection(doc, state, "Team", rows);
  }
  if ((blueprint.roadmap || []).length) {
    const rows = blueprint.roadmap
      .map((phase) => `${phase.phase} (${phase.duration || "—"})\n- ${(phase.actions || []).join("\n- ")}`)
      .join("\n\n");
    writeSection(doc, state, "Launch roadmap", rows);
  }
  if ((blueprint.revenue_streams || []).length) {
    writeSection(doc, state, "Revenue streams", blueprint.revenue_streams.join("\n"));
  }
  writeSection(doc, state, "Revenue model", blueprint.revenue_model);
  writeSection(doc, state, "Marketing plan", blueprint.marketing_plan);
  if ((blueprint.risks || []).length) {
    const rows = blueprint.risks.map((risk) => `${risk.risk}\nMitigation: ${risk.mitigation || "—"}`).join("\n\n");
    writeSection(doc, state, "Risks & mitigations", rows);
  }
  writeSection(doc, state, "Expansion", blueprint.expansion_strategy);

  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(
    `BizPath · ${blueprint.creator_name || "BizPath creator"} · Educational guidance, not a financial guarantee.`,
    48,
    812
  );

  const name = String(blueprint.title || "blueprint").replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  doc.save(`bizpath-${name}.pdf`);
}