export default function Loading() {
  return (
    <div className="flex-1 p-4 md:p-8 flex flex-col gap-6 max-w-7xl mx-auto w-full animate-pulse">
      {/* Header skeleton */}
      <div className="flex flex-col gap-2">
        <div className="h-3 w-20 bg-white/10 rounded-full" />
        <div className="h-8 w-48 bg-white/10 rounded-2xl" />
        <div className="h-4 w-72 bg-white/[0.06] rounded-full" />
      </div>

      {/* KPI cards skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white/[0.04] rounded-3xl p-5 border border-white/[0.06] flex flex-col gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/[0.07]" />
            <div className="h-8 w-16 bg-white/[0.07] rounded-xl" />
            <div className="h-3 w-24 bg-white/[0.05] rounded-full" />
          </div>
        ))}
      </div>

      {/* Table/card area skeleton */}
      <div className="bg-white/[0.03] rounded-3xl border border-white/[0.06] overflow-hidden">
        <div className="p-6 border-b border-white/[0.06] flex justify-between items-center">
          <div className="h-5 w-32 bg-white/[0.07] rounded-xl" />
          <div className="h-9 w-32 bg-white/[0.07] rounded-full" />
        </div>
        <div className="divide-y divide-white/[0.04]">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="px-6 py-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-white/[0.07] shrink-0" />
              <div className="flex-1 flex flex-col gap-2">
                <div className="h-4 w-40 bg-white/[0.07] rounded-full" />
                <div className="h-3 w-28 bg-white/[0.05] rounded-full" />
              </div>
              <div className="h-6 w-16 bg-white/[0.06] rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
