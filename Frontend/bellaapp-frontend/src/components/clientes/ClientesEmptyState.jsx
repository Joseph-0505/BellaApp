import "../../styles/clientes/clientes-empty-state.css";

export default function ClientesEmptyState({ isEmptyDatabase = false, onCreateClient }) {
  return (
    <div className="clientes-empty">
      <strong>{isEmptyDatabase ? "Nenhum cliente cadastrado ainda." : "Nenhum cliente encontrado."}</strong>
      <span>
        {isEmptyDatabase
          ? "Cadastre o primeiro cliente para acompanhar histórico, agenda e faturamento."
          : "Ajuste a busca ou o filtro para exibir resultados nesta página."}
      </span>

      <button type="button" className="btn-soft" onClick={onCreateClient}>
        {isEmptyDatabase ? "Cadastrar primeiro cliente" : "Novo Cliente"}
      </button>
    </div>
  );
}
