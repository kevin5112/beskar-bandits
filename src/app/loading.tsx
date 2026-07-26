export default function Loading() {
  return (
    <div className="pb-10">
      <div className="mt-8 space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-steel-800" />
        <div className="h-32 animate-pulse rounded-lg border border-steel-700 bg-steel-900" />
        <div className="h-32 animate-pulse rounded-lg border border-steel-700 bg-steel-900" />
      </div>
    </div>
  );
}
