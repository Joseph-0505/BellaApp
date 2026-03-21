import AgendaSummary from "./AgendaSummary";
import AgendaSuggestions from "./AgendaSuggestions";

export default function AgendaSidebar({ livresAgora, resumoAgenda }) {
  return (
    <aside className="agenda-side">
      <AgendaSuggestions slots={livresAgora} />
      <AgendaSummary resumo={resumoAgenda} />
    </aside>
  );
}
