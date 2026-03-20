import AgendaFreeSlots from "./AgendaFreeSlots";
import AgendaSummary from "./AgendaSummary";
import AgendaSuggestions from "./AgendaSuggestions";

export default function AgendaSidebar({
    livresAgora,
    resumoAgenda,
}) {
    return(
     <aside className="agenda-side">
        <AgendaFreeSlots livresAgora={livresAgora} />
        <AgendaSuggestions />
        <AgendaSummary resumo={resumoAgenda} />
     </aside>
    );
}