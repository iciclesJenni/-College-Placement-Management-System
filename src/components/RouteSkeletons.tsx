/**
 * Route-level loading skeletons — obsidian/purple palette.
 *
 * The pulse layers use translucent purple on dark glass so skeletons sit
 * seamlessly inside the global black-and-purple identity. Each skeleton
 * mirrors the exact layout of the page it precedes, so navigation between
 * routes never visibly "jumps".
 */

const SHIMMER = "bg-purple-950/30";

/** Skeleton for the drive detail page. */
export function DriveDetailSkeleton() {
  return (
    <div className="p-6 md:p-10 animate-pulse">
      {/* Back link */}
      <div className={`h-8 w-32 rounded-xl ${SHIMMER} mb-6`} />
      {/* Header */}
      <div className={`h-8 w-2/3 rounded-xl ${SHIMMER} mb-2`} />
      <div className={`h-4 w-1/2 rounded-xl ${SHIMMER} mb-8`} />
      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="nb-card p-5">
            <div className={`h-3 w-20 rounded ${SHIMMER} mb-3`} />
            <div className={`h-6 w-14 rounded ${SHIMMER}`} />
          </div>
        ))}
      </div>
      {/* Content blocks */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="nb-card p-5 h-40" />
          <div className="nb-card p-5 h-32" />
        </div>
        <div className="nb-card p-5 h-72" />
      </div>
    </div>
  );
}

/** Skeleton for the applicant tracking page. */
export function ApplicantsSkeleton() {
  return (
    <div className="p-6 md:p-10 animate-pulse">
      {/* Back link */}
      <div className={`h-8 w-40 rounded-xl ${SHIMMER} mb-6`} />
      {/* Header */}
      <div className={`h-8 w-3/4 rounded-xl ${SHIMMER} mb-2`} />
      <div className={`h-4 w-1/2 rounded-xl ${SHIMMER} mb-8`} />
      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="nb-card p-3.5">
            <div className={`h-2.5 w-20 rounded ${SHIMMER} mb-2`} />
            <div className={`h-5 w-10 rounded ${SHIMMER}`} />
          </div>
        ))}
      </div>
      {/* Filter bar */}
      <div className="nb-card p-4 mb-4 flex gap-3">
        <div className={`h-9 w-80 rounded-xl ${SHIMMER}`} />
        <div className={`h-9 w-28 rounded-xl ${SHIMMER}`} />
        <div className={`h-9 w-28 rounded-xl ${SHIMMER}`} />
      </div>
      {/* Table rows */}
      <div className="nb-card overflow-hidden">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 border-b border-border last:border-0">
            <div className={`h-4 w-4 rounded ${SHIMMER}`} />
            <div className="flex-1 space-y-1.5">
              <div className={`h-3.5 w-1/4 rounded ${SHIMMER}`} />
              <div className={`h-2.5 w-1/3 rounded ${SHIMMER}`} />
            </div>
            <div className={`h-3 w-10 rounded ${SHIMMER}`} />
            <div className={`h-5 w-16 rounded-full ${SHIMMER}`} />
            <div className={`h-7 w-24 rounded-xl ${SHIMMER}`} />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Skeleton for the student drives listing. */
export function DrivesSkeleton() {
  return (
    <div className="p-6 md:p-10 animate-pulse">
      <div className={`h-8 w-56 rounded-xl ${SHIMMER} mb-2`} />
      <div className={`h-4 w-72 rounded-xl ${SHIMMER} mb-8`} />
      <div className="space-y-3">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="nb-card p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className={`h-4 w-40 rounded ${SHIMMER}`} />
              <div className={`h-5 w-16 rounded-full ${SHIMMER}`} />
            </div>
            <div className={`h-3 w-2/3 rounded ${SHIMMER} mb-3`} />
            <div className="flex gap-2">
              <div className={`h-5 w-20 rounded-full ${SHIMMER}`} />
              <div className={`h-5 w-20 rounded-full ${SHIMMER}`} />
              <div className={`h-5 w-20 rounded-full ${SHIMMER}`} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
