import { apiGet } from "./api";

const USE_MOCK_WHEN_API_FAILS = true;

const mockDashboard = {
  resumo: {
    agendamentosHoje: 18,
    confirmados: 11,
    pendentes: 5,
    cancelados: 2,
    taxaOcupacao: 78,
    faturamentoPrevisto: 2450,
    faturamentoRecebido: 1890,
    atualizadoEm: new Date().toISOString(),
  },
  agendaHoje: [
    {
      id: 1,
      hora: "09:00",
      clienteNome: "Mariana Costa",
      servicoNome: "Limpeza de Pele",
      profissionalNome: "Dra. Ana",
      status: "confirmado",
    },
    {
      id: 2,
      hora: "09:40",
      clienteNome: "Beatriz Lima",
      servicoNome: "Depilacao a Laser",
      profissionalNome: "Dra. Ana",
      status: "pendente",
    },
    {
      id: 3,
      hora: "10:20",
      clienteNome: "Camila Souza",
      servicoNome: "Botox",
      profissionalNome: "Dra. Rafaela",
      status: "confirmado",
    },
    {
      id: 4,
      hora: "11:00",
      clienteNome: "Juliana Melo",
      servicoNome: "Preenchimento Labial",
      profissionalNome: "Dra. Rafaela",
      status: "cancelado",
    },
    {
      id: 5,
      hora: "11:40",
      clienteNome: "Patricia Nunes",
      servicoNome: "Drenagem Linfatica",
      profissionalNome: "Dra. Ana",
      status: "em_atendimento",
    },
  ],
  alertas: [
    {
      id: "a1",
      tipo: "pendencia",
      mensagem: "5 agendamentos pendentes de confirmação.",
      prioridade: "alta",
    },
    {
      id: "a2",
      tipo: "retorno",
      mensagem: "2 clientes sem retorno ha mais de 45 dias.",
      prioridade: "media",
    },
    {
      id: "a3",
      tipo: "ociosidade",
      mensagem: "Horário ocioso entre 14:00 e 15:00.",
      prioridade: "baixa",
    },
  ],
  topServicos: [
    { servicoNome: "Limpeza de Pele", quantidade: 24, percentual: 90 },
    { servicoNome: "Depilacao a Laser", quantidade: 19, percentual: 70 },
    { servicoNome: "Botox", quantidade: 15, percentual: 58 },
    { servicoNome: "Drenagem Linfatica", quantidade: 10, percentual: 38 },
  ],
};

function normalize(data) {
  return {
    resumo: data?.resumo || {},
    agendaHoje: data?.agendaHoje || [],
    alertas: data?.alertas || [],
    topServicos: data?.topServicos || [],
  };
}

export async function getDashboardData() {
  if (USE_MOCK_WHEN_API_FAILS && !import.meta.env.VITE_API_URL) {
    return normalize(mockDashboard);
  }

  try {
    const data = await apiGet("/dashboard");
    return normalize(data);
  } catch (error) {
    if (USE_MOCK_WHEN_API_FAILS) {
      return normalize(mockDashboard);
    }
    throw error;
  }
}