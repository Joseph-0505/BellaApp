import AgendaSummary from "./AgendaSummary";

export default function AgendaSidebar({ livresAgora, resumoAgenda }) {
  return (
    <aside className="agenda-side">
      <AgendaSummary resumo={resumoAgenda} />
    </aside>
  );
}
