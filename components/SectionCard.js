export default function SectionCard({ title, children }) {
  return (
    <section className="panel">
      <h2 className="panel-title mb-4">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}
