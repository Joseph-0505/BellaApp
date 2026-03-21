import AgendaSummary from "./AgendaSummary";
import AgendaSuggestions from "./AgendaSuggestions";

export default function AgendaSidebar({
    
    resumoAgenda,
}) {
    return(
     <aside className="agenda-side">

        <AgendaSuggestions />
        <AgendaSummary resumo={resumoAgenda} />
     </aside>
    );
}