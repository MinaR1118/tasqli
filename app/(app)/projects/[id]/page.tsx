export default function ProjectPage({ params }: { params: { id: string } }) {
  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-gray-900">Project</h1>
      {/* Project detail for {params.id} goes here */}
    </div>
  );
}
