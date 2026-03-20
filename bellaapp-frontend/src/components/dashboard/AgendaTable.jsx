import { Link } from "react-router-dom";
import StatusBadge from "./StatusBadge";
import AppointmentActionsMenu from "../buttons/DropdownActions";
import "../../styles/dashboard/agenda-table.css";
import { getActionsByStatus } from "../../utils/appointmentActions";


export default function AgendaTable({ appointments, onAction }) {
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
              <th className="th-actions">Ações</th>
            </tr>
          </thead>

          <tbody>
            {appointments.length === 0 ? (
              <tr>
                <td colSpan="6">Sem agendamentos para hoje.</td>
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
                  <td className="td-actions">
                    <AppointmentActionsMenu
                      rowId={appt.id}
                      actions={getActionsByStatus(appt.status)}
                      onAction={(action) => onAction?.(appt, action)}
                    />
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