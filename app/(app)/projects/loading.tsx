export default function ProjectsLoading() {
  return (
    <div className="mx-auto max-w-5xl animate-pulse px-6 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div className="h-8 w-28 rounded-lg bg-gray-200" />
        <div className="h-10 w-36 rounded-lg bg-gray-200" />
      </div>

      {/* Project cards grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-gray-100 bg-white p-5"
          >
            <div className="h-5 w-40 rounded bg-gray-200" />
            <div className="mt-3 h-4 w-full rounded bg-gray-100" />
            <div className="mt-1.5 h-4 w-3/4 rounded bg-gray-100" />
            <div className="mt-5 h-3 w-24 rounded bg-gray-100" />
          </div>
        ))}
      </div>
    </div>
  );
}
