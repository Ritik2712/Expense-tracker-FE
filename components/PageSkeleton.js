export default function PageSkeleton({ title = "Loading", rows = 5 }) {
  return (
    <main className="shell space-y-4">
      <header className="panel space-y-3">
        <div className="skeleton h-3 w-40" />
        <div className="skeleton h-8 w-56" />
        <div className="skeleton h-4 w-72" />
      </header>

      <section className="grid gap-3 md:grid-cols-3">
        <div className="panel space-y-2">
          <div className="skeleton h-3 w-24" />
          <div className="skeleton h-8 w-28" />
        </div>
        <div className="panel space-y-2">
          <div className="skeleton h-3 w-24" />
          <div className="skeleton h-8 w-28" />
        </div>
        <div className="panel space-y-2">
          <div className="skeleton h-3 w-24" />
          <div className="skeleton h-8 w-28" />
        </div>
      </section>

      <section className="panel space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="panel-title">{title}</h2>
          <div className="skeleton h-8 w-24" />
        </div>

        <div className="space-y-2">
          {Array.from({ length: rows }).map((_, idx) => (
            <div key={idx} className="skeleton h-10 w-full" />
          ))}
        </div>
      </section>
    </main>
  );
}
