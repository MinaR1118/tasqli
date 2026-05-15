export default function ClientPortalPage({
  params,
}: {
  params: { projectId: string };
}) {
  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-gray-900">Client Portal</h1>
      {/* Client portal view for project {params.projectId} goes here */}
    </div>
  );
}
