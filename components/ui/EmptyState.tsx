export function EmptyState({ title, message, action }: { title?: string; message: string; action?: React.ReactNode }) {
  return (
    <div className="border-l-2 border-line py-3 pl-4 text-sm leading-6 text-muted">
      {title ? <p className="font-semibold text-ink">{title}</p> : null}
      <p>{message}</p>
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}
