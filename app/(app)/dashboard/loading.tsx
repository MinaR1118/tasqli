export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-5xl animate-pulse px-6 py-8">
      {/* Header row */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="h-8 w-52 rounded-lg bg-gray-200" />
          <div className="mt-2 h-4 w-64 rounded bg-gray-100" />
        </div>
        <div className="h-10 w-36 rounded-lg bg-gray-200" />
      </div>

      {/* Stats row */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-gray-100 bg-white p-5"
          >
            <div className="h-9 w-14 rounded bg-gray-200" />
            <div className="mt-2 h-4 w-32 rounded bg-gray-100" />
          </div>
        ))}
      </div>

      {/* Recent proposals */}
      <div>
        <div className="mb-4 h-6 w-40 rounded bg-gray-200" />
        <div className="overflow-hidden rounded-xl border border-gray-100 bg-white">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between border-b border-gray-100 px-5 py-4 last:border-0"
            >
              <div>
                <div className="h-4 w-36 rounded bg-gray-200" />
                <div className="mt-1.5 h-3 w-24 rounded bg-gray-100" />
              </div>
              <div className="h-3 w-20 rounded bg-gray-100" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
