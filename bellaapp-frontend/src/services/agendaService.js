import {
  createAppointment,
  getAgendaData as loadAgendaData,
  updateAppointment,
} from "./appointmentService";

export async function getAgendaData(referenceDate) {
  return loadAgendaData(referenceDate);
}

export async function createAgendaAppointment(input) {
  return createAppointment(input);
}

export async function updateAgendaAppointment(currentAppointment, changes) {
  return updateAppointment(currentAppointment, changes);
}
