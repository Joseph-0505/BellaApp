import { Link } from "react-router-dom";
import StatusBadge from "./StatusBadge";
import "../../styles/dashboard/agenda-table.css";

export default function AgendaTable({ appointments }) {
  return (
    <article className="panel">
      <div className="panel-header">
        <h2>Agenda de hoje</h2>
        <Link to="/agenda" className="panel-link">
          Ver agenda completa
        </Link>
      </div>

      <div className="agenda-table-wrap">
        <table className="agenda-table">
          <thead>
            <tr>
              <th>Hora</th>
              <th>Cliente</th>
              <th>Servico</th>
              <th>Profissional</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {appointments.length === 0 ? (
              <tr>
                <td colSpan="5">Sem agendamentos para hoje.</td>
              </tr>
            ) : (
              appointments.map((appt) => (
                <tr key={appt.id}>
                  <td>{appt.hora}</td>
                  <td>{appt.clienteNome}</td>
                  <td>{appt.servicoNome}</td>
                  <td>{appt.profissionalNome}</td>
                  <td>
                    <StatusBadge status={appt.status} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </article>
  );
}
