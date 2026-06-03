import ProfissionalRow from "./ProfissionalRow";
import ProfissionaisEmptyState from "./ProfissionaisEmptyState";

const PROFESSIONAL_TABLE_COLUMNS = ["Profissional", "Especialidade", "Telefone", "Status", "Ações"];

export default function ProfissionaisTable({
  actions = [],
  createDisabled = false,
  createLabel,
  isEmptyDatabase = false,
  onAction,
  onCreateProfessional,
  professionals = [],
}) {
  return (
    <>
      <div className="profissionais-table-head">
        {PROFESSIONAL_TABLE_COLUMNS.map((column) => (
          <span key={column}>{column}</span>
        ))}
      </div>

      <div className="profissionais-table-body">
        {professionals.length > 0 ? (
          professionals.map((professional) => (
            <ProfissionalRow
              key={professional.id}
              actions={actions}
              onAction={onAction}
              professional={professional}
            />
          ))
        ) : (
          <ProfissionaisEmptyState
            createDisabled={createDisabled}
            createLabel={createLabel}
            isEmptyDatabase={isEmptyDatabase}
            onCreateProfessional={onCreateProfessional}
          />
        )}
      </div>
    </>
  );
}
