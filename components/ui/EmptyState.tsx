export function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-md border border-dashed border-line bg-neutral-50 p-4 text-sm text-muted">
      {message}
    </div>
  );
}
