import Header from "../layout/Header";
import "../../styles/botoes/novo-cliente.css";
import "../../styles/layout/header.css";

export default function ClientesHeader({ onNewClient }) {
  const actions = (
    <>
      <button type="button" className="btn-soft" onClick={onNewClient}>
        Novo Cliente
      </button>
    </>
  );

  return <Header title="Clientes" actions={actions} />;
}

