import { Link } from "react-router-dom";
import { Star, MapPin, BadgeCheck, Clock } from "lucide-react";
import { formatINR } from "@/lib/format";

export default function MentorCard({ mentor }) {
  const {
    name,
    slug,
    headline,
    city,
    expertise = [],
    verified,
    rating,
    review_count,
    years_experience,
    consultation_fee,
    consultation_duration,
    response_time,
  } = mentor;

  return (
    <article className="flex h-full flex-col rounded-2xl border border-border bg-card p-5">
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-secondary font-display text-lg text-secondary-foreground">
          {(name || "M").slice(0, 1)}
        </span>
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 font-medium">
            <span className="truncate">{name}</span>
            {verified && <BadgeCheck className="h-4 w-4 shrink-0 text-primary" aria-label="Verified" />}
          </p>
          <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            {headline || "Operator and blueprint creator"}
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Star className="h-3 w-3 fill-accent text-accent" />
          {(rating || 0).toFixed(1)} ({review_count || 0})
        </span>
        {city && (
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3 w-3" /> {city}
          </span>
        )}
        {years_experience ? <span>{years_experience} yrs experience</span> : null}
      </div>

      {expertise.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {expertise.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-secondary px-2 py-0.5 text-[11px] text-secondary-foreground"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="mt-auto pt-4">
        <div className="flex items-center justify-between border-t border-border pt-3 text-[12px]">
          <span className="font-medium">
            {consultation_fee
              ? `${formatINR(consultation_fee)} / ${consultation_duration || 45} min`
              : "Fee on request"}
          </span>
          {response_time && (
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <Clock className="h-3 w-3" /> {response_time}
            </span>
          )}
        </div>
        <div className="mt-3 flex gap-2">
          <Link
            to={`/creator/${slug}`}
            className="flex-1 rounded-full border border-border px-3 py-2 text-center text-xs font-medium hover:bg-secondary"
          >
            Profile
          </Link>
          <Link
            to={`/book-consultation?mentor=${slug}`}
            className="flex-1 rounded-full bg-primary px-3 py-2 text-center text-xs font-medium text-primary-foreground"
          >
            Book session
          </Link>
        </div>
      </div>
    </article>
  );
}