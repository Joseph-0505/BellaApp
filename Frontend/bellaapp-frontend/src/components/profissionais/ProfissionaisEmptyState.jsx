import { Lock, Plus, Users } from "lucide-react";

export default function ProfissionaisEmptyState({
  isEmptyDatabase = false,
  onCreateProfessional,
  createDisabled = false,
  createLabel,
}) {
  return (
    <div className="profissionais-empty">
      <div className="profissionais-empty-icon" aria-hidden="true">
        <Users size={26} />
      </div>

      <strong>{isEmptyDatabase ? "Nenhum profissional cadastrado ainda." : "Nenhum profissional encontrado."}</strong>

      <span>
        {isEmptyDatabase
          ? "Cadastre o primeiro profissional para organizar equipe, contatos e especialidades."
          : "Ajuste a busca ou o filtro para exibir resultados nesta página."}
      </span>

      <button type="button" className="btn-soft" onClick={onCreateProfessional} disabled={createDisabled}>
        {createDisabled ? <Lock size={18} aria-hidden="true" /> : <Plus size={18} aria-hidden="true" />}
        {createLabel || (isEmptyDatabase ? "Cadastrar primeiro profissional" : "Novo profissional")}
      </button>
    </div>
  );
}
