export default function ProposalsLoading() {
  return (
    <div className="mx-auto max-w-3xl animate-pulse px-6 py-8">
      {/* Page title + action */}
      <div className="mb-8 flex items-center justify-between">
        <div className="h-8 w-40 rounded-lg bg-gray-200" />
        <div className="h-10 w-36 rounded-lg bg-gray-200" />
      </div>

      {/* Proposal rows */}
      <div className="space-y-3">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="flex items-center justify-between rounded-xl border border-gray-100 bg-white px-5 py-4"
          >
            <div>
              <div className="h-4 w-40 rounded bg-gray-200" />
              <div className="mt-1.5 h-3 w-28 rounded bg-gray-100" />
            </div>
            <div className="h-3 w-20 rounded bg-gray-100" />
          </div>
        ))}
      </div>
    </div>
  );
}
