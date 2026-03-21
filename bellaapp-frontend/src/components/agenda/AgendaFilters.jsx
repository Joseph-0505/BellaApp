export default function AgendaFilters({
  term,
  setTerm,
  status,
  setStatus,
}) {
  return (
    <div className="agenda-filters">
      <input
        className="agenda-input"
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        placeholder="Buscar cliente ou servico"
      />

      <select
        className="agenda-select"
        value={status}
        onChange={(e) => setStatus(e.target.value)}
      >
        <option value="todos">Todos status</option>
        <option value="confirmado">Confirmado</option>
        <option value="pendente">Pendente</option>
        <option value="em_atendimento">Em atendimento</option>
        <option value="cancelado">Cancelado</option>
        <option value="concluido">Concluido</option>
      </select>
    </div>
  );
}
