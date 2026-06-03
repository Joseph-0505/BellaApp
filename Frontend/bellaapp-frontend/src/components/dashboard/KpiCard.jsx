import "../../styles/dashboard/kpi-card.css";

export default function KpiCard({ label, value, trend }) {
  return (
    <article className="kpi-card">
      <h3>{label}</h3>
      <strong>{value}</strong>
      <span>{trend}</span>
    </article>
  );
}
