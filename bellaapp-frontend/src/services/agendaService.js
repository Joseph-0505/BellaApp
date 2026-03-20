

const DAYS = [
  { key: "seg", label: "Seg 22" },
  { key: "ter", label: "Ter 23" },
  { key: "qua", label: "Qua 24" },
  { key: "qui", label: "Qui 25" },
  { key: "sex", label: "Sex 26" },
];

const HOURS = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"];

const MOCK_APPOINTMENTS = [
  {
    id: 1,
    day: "seg",
    hour: "09:00",
    cliente: "Mariana Costa",
    servico: "Limpeza de Pele",
    profissional: "Dra. Ana",
    status: "confirmado",
    recurso: "Cabine 1",
    riscoNoShow: "baixo",
    valorEstimado: 250,
    duracaoMin: 60,
  },
  {
    id: 2,
    day: "qua",
    hour: "12:00",
    cliente: "Beatriz Lima",
    servico: "Depilacao a Laser",
    profissional: "Dra. Ana",
    status: "pendente",
    recurso: "Laser Soprano",
    riscoNoShow: "alto",
    valorEstimado: 480,
    duracaoMin: 60,
  },
  {
    id: 3,
    day: "seg",
    hour: "13:00",
    cliente: "Camila Souza",
    servico: "Botox",
    profissional: "Dra. Rafaela",
    status: "confirmado",
    recurso: "Cabine 2",
    riscoNoShow: "medio",
    valorEstimado: 900,
    duracaoMin: 60,
  },
  {
    id: 4,
    day: "seg",
    hour: "15:00",
    cliente: "Patricia Nunes",
    servico: "Drenagem Linfatica",
    profissional: "Dra. Ana",
    status: "em_atendimento",
    recurso: "Cabine 3",
    riscoNoShow: "baixo",
    valorEstimado: 180,
    duracaoMin: 60,
  },
];

function normalize(data){
    return{
        days: data?.days || [],
        hours: data?.hours || [],
        appointments: data?.appointments || [],
    };
}

export async function getAgendaData() {
  const mockAgendaData = {
    days: DAYS,
    hours: HOURS,
    appointments: MOCK_APPOINTMENTS,
  };
  return normalize(mockAgendaData);
}