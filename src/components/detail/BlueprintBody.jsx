import InvestmentTable from "@/components/detail/InvestmentTable";
import Roadmap from "@/components/detail/Roadmap";
import { formatINR } from "@/lib/format";

function Section({ title, kicker, children }) {
  return (
    <section className="border-t border-border pt-9">
      {kicker && <p className="eyebrow">{kicker}</p>}
      <h2 className="mt-2 text-xl sm:text-2xl">{title}</h2>
      <div className="mt-4 space-y-4 text-[14px] leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}

export default function BlueprintBody({ blueprint }) {
  const totalSetup = (blueprint.investment_breakdown || []).reduce(
    (acc, item) => acc + (Number(item.amount) || 0),
    0
  );

  return (
    <div className="space-y-9">
      <Section kicker="The business" title="Overview">
        <p className="text-[15px] text-foreground/80">{blueprint.overview || blueprint.summary}</p>
      </Section>

      <Section kicker="Evidence" title="Market demand">
        <p>{blueprint.market_demand}</p>
        {blueprint.target_customer && (
          <div className="rounded-xl border border-border bg-secondary/40 p-4">
            <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Who pays you</p>
            <p className="mt-1.5 text-[13px] text-foreground/80">{blueprint.target_customer}</p>
          </div>
        )}
      </Section>

      <Section kicker="Money" title="Investment breakdown">
        <p>
          Itemised setup cost of <strong className="font-medium text-foreground">{formatINR(totalSetup)}</strong> plus
          three months of working capital. Costs reflect {blueprint.city || "Indian metro"} rates on a{" "}
          {blueprint.space_requirement || "compact"} footprint.
        </p>
        <InvestmentTable
          items={blueprint.investment_breakdown}
          workingCapital={blueprint.working_capital}
        />
      </Section>

      {(blueprint.equipment?.length || blueprint.infrastructure) && (
        <Section kicker="Build-out" title="Equipment & infrastructure">
          {blueprint.infrastructure && <p>{blueprint.infrastructure}</p>}
          {blueprint.equipment?.length ? (
            <div className="flex flex-wrap gap-2">
              {blueprint.equipment.map((item) => (
                <span key={item} className="rounded-full border border-border px-3 py-1.5 text-xs text-foreground/75">
                  {item}
                </span>
              ))}
            </div>
          ) : null}
        </Section>
      )}

      {blueprint.licenses?.length ? (
        <Section kicker="Compliance" title="Licenses & registrations">
          <ul className="grid gap-2 sm:grid-cols-2">
            {blueprint.licenses.map((license) => (
              <li key={license} className="flex gap-2 rounded-xl border border-border px-3.5 py-3 text-[13px] text-foreground/75">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                {license}
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {blueprint.staff_roles?.length ? (
        <Section kicker="People" title="Team & job descriptions">
          <div className="divide-y divide-border overflow-hidden rounded-xl border border-border">
            {blueprint.staff_roles.map((role) => (
              <div key={role.role} className="flex flex-col gap-1.5 bg-card px-4 py-3.5 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                <div>
                  <p className="text-[13px] font-medium text-foreground">
                    {role.role}
                    {role.count ? <span className="ml-1.5 text-muted-foreground">× {role.count}</span> : null}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{role.description}</p>
                </div>
                {role.salary ? (
                  <p className="shrink-0 text-xs text-muted-foreground">
                    {formatINR(role.salary)}<span className="text-[10px]"> / month</span>
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      {blueprint.roadmap?.length ? (
        <Section kicker="Execution" title="Roadmap">
          <Roadmap phases={blueprint.roadmap} />
        </Section>
      ) : null}

      <Section kicker="Economics" title="Revenue model">
        <p>{blueprint.revenue_model}</p>
        <div className="grid gap-2 sm:grid-cols-3">
          {[
            { label: "Monthly revenue potential", value: formatINR(blueprint.monthly_revenue_potential) },
            { label: "Gross margin", value: blueprint.gross_margin ? `${blueprint.gross_margin}%` : "—" },
            { label: "Payback", value: blueprint.payback_months ? `${blueprint.payback_months} months` : "—" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl bg-secondary/50 px-4 py-3">
              <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{stat.label}</p>
              <p className="mt-1 text-sm font-medium text-foreground">{stat.value}</p>
            </div>
          ))}
        </div>
        {blueprint.revenue_streams?.length ? (
          <ul className="space-y-1.5">
            {blueprint.revenue_streams.map((stream) => (
              <li key={stream} className="flex gap-2 text-[13px]">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-muted-foreground/50" />
                {stream}
              </li>
            ))}
          </ul>
        ) : null}
      </Section>

      {blueprint.marketing_plan && (
        <Section kicker="Demand" title="Marketing plan">
          <p>{blueprint.marketing_plan}</p>
        </Section>
      )}

      {blueprint.risks?.length ? (
        <Section kicker="Honest look" title="Risks & how creators handled them">
          <div className="space-y-3">
            {blueprint.risks.map((item) => (
              <div key={item.risk} className="rounded-xl border border-border p-4">
                <p className="text-[13px] font-medium text-foreground">{item.risk}</p>
                <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
                  <span className="text-primary">Mitigation · </span>
                  {item.mitigation}
                </p>
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      {blueprint.expansion_strategy && (
        <Section kicker="What's next" title="Expansion strategy">
          <p>{blueprint.expansion_strategy}</p>
        </Section>
      )}
    </div>
  );
}