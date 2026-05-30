import { AppointmentStatus } from "@prisma/client";
import { AppError } from "../../shared/errors/app-error";
import {
  ClientInsights,
  ClientStatus,
  toClientResponse,
} from "../../shared/mappers/client-response";
import { buildPaginationMeta } from "../../shared/utils/pagination";
import { normalizeNumericString } from "../../shared/utils/documents";
import { userClinicContextService } from "../../shared/auth/user-clinic-context";
import {
  ClientRequestDto,
  CreateClientResponseDto,
  GetClientResponseDto,
  ListClientsResponseDto,
  UpdateClientResponseDto,
  ClientsQueryDto,
} from "./clients.dtos";
import { clientsRepository } from "./clients.repository";

type ClientActivityRecord = Awaited<
  ReturnType<typeof clientsRepository.listAppointmentActivityByClientIds>
>[number];
type ClientCreateData = Parameters<typeof clientsRepository.create>[0];
type ClientUpdateData = Parameters<typeof clientsRepository.update>[1];
type ClientRecord = NonNullable<
  Awaited<ReturnType<typeof clientsRepository.findById>>
>;

function resolveClientStatus(insights: {
  hasAppointments: boolean;
  nextAppointmentAt: Date | null;
}): ClientStatus {
  if (!insights.hasAppointments) {
    return "novo";
  }

  if (insights.nextAppointmentAt) {
    return "ativo";
  }

  return "inativo";
}

function createDefaultInsights(): ClientInsights {
  return {
    latestVisitAt: null,
    latestVisitNote: null,
    nextAppointmentAt: null,
    professional: null,
    totalSpent: 0,
    status: "novo",
  };
}

function groupAppointmentsByClient(
  appointments: ClientActivityRecord[],
): Map<string, ClientActivityRecord[]> {
  const appointmentsByClientId = new Map<string, ClientActivityRecord[]>();

  for (const appointment of appointments) {
    const current = appointmentsByClientId.get(appointment.clientId) ?? [];
    current.push(appointment);
    appointmentsByClientId.set(appointment.clientId, current);
  }

  return appointmentsByClientId;
}

function findLatestCompletedVisit(
  appointments: ClientActivityRecord[],
): ClientActivityRecord | undefined {
  return appointments.find(
    (appointment) => appointment.status === AppointmentStatus.COMPLETED,
  );
}

function findNextAppointment(
  appointments: ClientActivityRecord[],
  now: Date,
): ClientActivityRecord | null {
  return appointments.reduce<ClientActivityRecord | null>(
    (next, appointment) => {
      const isUpcoming =
        appointment.scheduledAt.getTime() >= now.getTime() &&
        appointment.status !== AppointmentStatus.CANCELED &&
        appointment.status !== AppointmentStatus.COMPLETED;

      if (!isUpcoming) {
        return next;
      }

      if (
        !next ||
        appointment.scheduledAt.getTime() < next.scheduledAt.getTime()
      ) {
        return appointment;
      }

      return next;
    },
    null,
  );
}

function calculateTotalSpent(appointments: ClientActivityRecord[]): number {
  return appointments.reduce((total, appointment) => {
    if (appointment.status !== AppointmentStatus.COMPLETED) {
      return total;
    }

    return total + Number(appointment.service.price);
  }, 0);
}

function buildClientInsights(
  clientAppointments: ClientActivityRecord[],
  now: Date,
): ClientInsights {
  const latestVisit = findLatestCompletedVisit(clientAppointments);
  const nextAppointmentRecord = findNextAppointment(clientAppointments, now);
  const nextAppointmentAt = nextAppointmentRecord?.scheduledAt ?? null;

  return {
    latestVisitAt: latestVisit?.scheduledAt ?? null,
    latestVisitNote: latestVisit
      ? latestVisit.notes?.trim() ||
        latestVisit.service.name ||
        "Atendimento concluído"
      : null,
    nextAppointmentAt,
    professional:
      nextAppointmentRecord?.professional?.name ??
      latestVisit?.professional?.name ??
      null,
    totalSpent: calculateTotalSpent(clientAppointments),
    status: resolveClientStatus({
      hasAppointments: clientAppointments.length > 0,
      nextAppointmentAt,
    }),
  };
}

function buildClientInsightsMap(
  appointments: ClientActivityRecord[],
  clientIds: string[],
  now = new Date(),
): Map<string, ClientInsights> {
  const insightsByClientId = new Map<string, ClientInsights>();

  for (const clientId of clientIds) {
    insightsByClientId.set(clientId, createDefaultInsights());
  }

  const appointmentsByClientId = groupAppointmentsByClient(appointments);

  for (const clientId of clientIds) {
    const clientAppointments = appointmentsByClientId.get(clientId) ?? [];
    insightsByClientId.set(
      clientId,
      buildClientInsights(clientAppointments, now),
    );
  }

  return insightsByClientId;
}

class ClientsService {
  private async getInsightsMap(
    clinicId: string,
    clientIds: string[],
  ): Promise<Map<string, ClientInsights>> {
    const appointments =
      await clientsRepository.listAppointmentActivityByClientIds(
        clinicId,
        clientIds,
      );
    return buildClientInsightsMap(appointments, clientIds);
  }

  private async getClientOrThrow(
    clinicId: string,
    id: string,
  ): Promise<ClientRecord> {
    const client = await clientsRepository.findById(clinicId, id);

    if (!client) {
      throw new AppError(404, "RESOURCE_NOT_FOUND", "Cliente não encontrado.");
    }

    return client;
  }

  private buildClientData(
    userId: string,
    clinicId: string,
    input: ClientRequestDto,
    cpf?: string,
  ): ClientCreateData {
    return {
      userId,
      clinicId,
      name: input.name,
      phone: input.phone,
      ...(input.email ? { email: input.email } : {}),
      ...(cpf ? { cpf } : {}),
      ...(input.notes ? { notes: input.notes } : {}),
    };
  }

  private buildClientUpdateData(
    input: ClientRequestDto,
    cpf?: string,
  ): ClientUpdateData {
    return {
      name: input.name,
      phone: input.phone,
      ...(input.email ? { email: input.email } : {}),
      ...(cpf ? { cpf } : {}),
      ...(input.notes ? { notes: input.notes } : {}),
    };
  }

  private async assertCpfUniqueness(
    clinicId: string,
    cpf: string,
    currentClientId?: string,
  ): Promise<void> {
    const existingClient = await clientsRepository.findByCpf(clinicId, cpf);

    if (!existingClient) {
      return;
    }

    if (!currentClientId || existingClient.id !== currentClientId) {
      throw new AppError(409, "CPF_ALREADY_EXISTS", "CPF já cadastrado.");
    }
  }

  async list(
    userId: string,
    query: ClientsQueryDto,
  ): Promise<ListClientsResponseDto> {
    const context = await userClinicContextService.getOrThrow(userId);

    const [clients, total] = await Promise.all([
      clientsRepository.listByUser({
        clinicId: context.clinicId,
        page: query.page,
        limit: query.limit,
        ...(query.search ? { search: query.search } : {}),
      }),
      clientsRepository.countByUser({
        clinicId: context.clinicId,
        ...(query.search ? { search: query.search } : {}),
      }),
    ]);
    const clientIds = clients.map((client) => client.id);
    const insightsMap = await this.getInsightsMap(context.clinicId, clientIds);

    return {
      data: clients.map((client) =>
        toClientResponse(client, insightsMap.get(client.id) ?? {}),
      ),
      meta: buildPaginationMeta(total, query.page, query.limit),
    };
  }

  async create(
    userId: string,
    input: ClientRequestDto,
  ): Promise<CreateClientResponseDto> {
    const context = await userClinicContextService.getOrThrow(userId);
    const cpf = input.cpf ? normalizeNumericString(input.cpf) : undefined;
    if (cpf) await this.assertCpfUniqueness(context.clinicId, cpf);

    const clientData = this.buildClientData(
      userId,
      context.clinicId,
      input,
      cpf,
    );

    const client = await clientsRepository.create(clientData);

    return toClientResponse(client);
  }

  async getById(userId: string, id: string): Promise<GetClientResponseDto> {
    const context = await userClinicContextService.getOrThrow(userId);
    const client = await this.getClientOrThrow(context.clinicId, id);
    const insightsMap = await this.getInsightsMap(context.clinicId, [id]);

    return toClientResponse(client, insightsMap.get(id) ?? {});
  }

  async update(
    userId: string,
    id: string,
    input: ClientRequestDto,
  ): Promise<UpdateClientResponseDto> {
    const context = await userClinicContextService.getOrThrow(userId);
    const currentClient = await this.getClientOrThrow(context.clinicId, id);

    const cpf = input.cpf ? normalizeNumericString(input.cpf) : undefined;
    if (cpf && cpf !== currentClient.cpf) {
      await this.assertCpfUniqueness(context.clinicId, cpf, id);
    }

    const clientData = this.buildClientUpdateData(input, cpf);

    const updatedClient = await clientsRepository.update(id, clientData);

    return toClientResponse(updatedClient);
  }

  async remove(userId: string, id: string): Promise<void> {
    const context = await userClinicContextService.getOrThrow(userId);
    await this.getClientOrThrow(context.clinicId, id);
    await clientsRepository.delete(id);
  }
}

export const clientsService = new ClientsService();
