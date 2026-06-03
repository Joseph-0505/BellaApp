import { DoorClosed, Plus } from "lucide-react";

export default function RoomsEmptyState({ isEmptyDatabase = false, onCreateRoom }) {
  return (
    <div className="rooms-empty">
      <div className="rooms-empty-icon" aria-hidden="true">
        <DoorClosed size={26} />
      </div>

      <strong>{isEmptyDatabase ? "Nenhuma sala cadastrada." : "Nenhuma sala encontrada."}</strong>

      <span>
        {isEmptyDatabase
          ? "Cadastre a primeira sala para organizar os ambientes disponíveis para atendimento."
          : "Ajuste a busca ou o filtro para exibir resultados nesta página."}
      </span>

      <button type="button" className="btn-soft" onClick={onCreateRoom}>
        <Plus size={18} aria-hidden="true" />
        {isEmptyDatabase ? "Cadastrar primeira sala" : "Nova sala"}
      </button>
    </div>
  );
}
