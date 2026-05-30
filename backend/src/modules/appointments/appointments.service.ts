import { AppointmentStatus, Prisma, ReceivedBy } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../shared/errors/app-error";
import {
  assertProfessionalOwnership,
  resolveScopedProfessionalId,
  userClinicContextService,
} from "../../shared/auth/user-clinic-context";
import { toAppointmentResponse } from "../../shared/mappers/appointment-response";
import { toBillingResponse } from "../../shared/mappers/billing-response";
import { buildPaginationMeta } from "../../shared/utils/pagination";
import { billingsService } from "../billings/billings.service";
import {
  AppointmentRequestDto,
  AppointmentsQueryDto,
  CompleteAppointmentRequestDto,
  CompleteAppointmentResponseDto,
  CreateAppointmentResponseDto,
  GetAppointmentResponseDto,
  ListAppointmentsResponseDto,
  UpdateAppointmentResponseDto,
} from "./appointments.dtos";
import {
  AppointmentListQuery,
  AppointmentRecord,
  AppointmentDetailedRecord,
  appointmentsRepository,
  CONFLICT_BLOCKING_STATUSES,
} from "./appointments.repository";

const CONFLICT_BLOCKING_STATUS_SET = new Set<AppointmentStatus>(
  CONFLICT_BLOCKING_STATUSES,
);

type AppointmentRelationsInput = {
  clientId: string;
  serviceId: string;
  professionalId?: string | null;
  roomId?: string | null;
};

type AppointmentCreateData = Parameters<
  typeof appointmentsRepository.create
>[0];
type AppointmentUpdateData = Parameters<
  typeof appointmentsRepository.update
>[1];
type AppointmentScope = {
  professionalId: string | null;
  roomId: string | null;
};

type AppointmentUpdateContext = AppointmentScope & {
  scheduledAt: Date;
};

type AppointmentConflictInput = {
  clinicId: string;
  scheduledAt: Date;
  relations: AppointmentRelationsInput;
  excludeId?: string;
};

class AppointmentsService {
  private buildBillingSnapshot(
    appointment: AppointmentDetailedRecord,
    receivedBy: ReceivedBy,
  ) {
    return {
      appointmentId: appointment.id,
      appointmentScheduledAt: appointment.scheduledAt,
      clientId: appointment.clientId,
      clientName: appointment.client.name,
      serviceId: appointment.serviceId,
      serviceName: appointment.service.name,
      professionalId: appointment.professionalId ?? null,
      professionalName: appointment.professional?.name ?? null,
      amount: new Prisma.Decimal(appointment.service.price),
      receivedBy,
    };
  }

  private hasTimeConflict(
    scheduledAt: Date,
    durationMinutes: number,
    appointments: Array<
      Prisma.AppointmentGetPayload<{
        include: {
          service: {
            select: {
              durationMinutes: true;
            };
          };
        };
      }>
    >,
  ): boolean {
    const start = scheduledAt.getTime();
    const end = start + durationMinutes * 60 * 1000;

    return appointments.some((appointment) => {
      if (!CONFLICT_BLOCKING_STATUS_SET.has(appointment.status)) {
        return false;
      }

      const candidateStart = appointment.scheduledAt.getTime();
      const candidateEnd =
        candidateStart + appointment.service.durationMinutes * 60 * 1000;
      return start < candidateEnd && candidateStart < end;
    });
  }

  private assertFutureDate(date: Date): void {
    if (Number.isNaN(date.getTime()) || date.getTime() < Date.now()) {
      throw new AppError(
        400,
        "VALIDATION_ERROR",
        "Data do agendamento não pode estar no passado.",
      );
    }
  }

  private async assertAppointmentRelations(
    clinicId: string,
    input: AppointmentRelationsInput,
  ) {
    const [client, service, professional, room] = await Promise.all([
      appointmentsRepository.findClientById(clinicId, input.clientId),
      appointmentsRepository.findServiceById(clinicId, input.serviceId),
      input.professionalId
        ? appointmentsRepository.findProfessionalById(
            clinicId,
            input.professionalId,
          )
        : Promise.resolve(null),
      input.roomId
        ? appointmentsRepository.findRoomById(clinicId, input.roomId)
        : Promise.resolve(null),
    ]);

    if (
      !client ||
      !service ||
      (input.professionalId && !professional) ||
      (input.roomId && !room)
    ) {
      throw new AppError(
        404,
        "RESOURCE_NOT_FOUND",
        input.professionalId || input.roomId
          ? "Cliente, serviço, profissional ou sala não encontrado."
          : "Cliente ou serviço não encontrado.",
      );
    }

    return { service };
  }

  private buildFilters(query: AppointmentsQueryDto): AppointmentListQuery {
    return {
      page: query.page,
      limit: query.limit,
      ...(query.status ? { status: query.status as AppointmentStatus } : {}),
      ...(query.date ? { date: query.date } : {}),
      ...(query.clientId ? { clientId: query.clientId } : {}),
      ...(query.serviceId ? { serviceId: query.serviceId } : {}),
      ...(query.professionalId ? { professionalId: query.professionalId } : {}),
      ...(query.roomId ? { roomId: query.roomId } : {}),
    };
  }

  private toRelationsInput(
    input: { clientId: string; serviceId: string } & AppointmentScope,
  ): AppointmentRelationsInput {
    return {
      clientId: input.clientId,
      serviceId: input.serviceId,
      ...(input.professionalId ? { professionalId: input.professionalId } : {}),
      ...(input.roomId ? { roomId: input.roomId } : {}),
    };
  }

  private buildCreateData(
    userId: string,
    clinicId: string,
    input: AppointmentRequestDto,
  ): AppointmentCreateData {
    return {
      userId,
      clinicId,
      clientId: input.clientId,
      serviceId: input.serviceId,
      ...(input.professionalId ? { professionalId: input.professionalId } : {}),
      ...(input.roomId ? { roomId: input.roomId } : {}),
      scheduledAt: new Date(input.scheduledAt),
      status: input.status as AppointmentStatus,
      ...(input.notes ? { notes: input.notes } : {}),
    };
  }

  private buildUpdateData(
    input: AppointmentRequestDto,
    context: AppointmentUpdateContext,
  ): AppointmentUpdateData {
    const updateData: AppointmentUpdateData = {
      clientId: input.clientId,
      serviceId: input.serviceId,
      scheduledAt: context.scheduledAt,
      status: input.status as AppointmentStatus,
      ...(input.notes ? { notes: input.notes } : {}),
    };

    if (context.professionalId)
      updateData.professionalId = context.professionalId;
    if (context.roomId) updateData.roomId = context.roomId;

    return updateData;
  }

  private async getAppointmentOrThrow(
    clinicId: string,
    id: string,
    db?: Prisma.TransactionClient,
  ): Promise<AppointmentRecord> {
    const appointment = await appointmentsRepository.findById(
      clinicId,
      id,
      db ?? prisma,
    );
    if (!appointment)
      throw new AppError(
        404,
        "RESOURCE_NOT_FOUND",
        "Agendamento não encontrado.",
      );
    return appointment;
  }

  private async getDetailedAppointmentOrThrow(
    clinicId: string,
    id: string,
    db?: Prisma.TransactionClient,
  ): Promise<AppointmentDetailedRecord> {
    const appointment = await appointmentsRepository.findDetailedById(
      clinicId,
      id,
      db ?? prisma,
    );
    if (!appointment) {
      throw new AppError(
        404,
        "RESOURCE_NOT_FOUND",
        "Agendamento não encontrado.",
      );
    }

    return appointment;
  }

  private buildUpdateContext(
    input: AppointmentRequestDto,
    currentAppointment: AppointmentRecord,
  ): AppointmentUpdateContext {
    return {
      scheduledAt: new Date(input.scheduledAt),
      professionalId:
        input.professionalId ?? currentAppointment.professionalId ?? null,
      roomId: input.roomId ?? currentAppointment.roomId ?? null,
    };
  }

  private isOnlyStatusOrNotesChange(
    input: AppointmentRequestDto,
    currentAppointment: AppointmentRecord,
    context: AppointmentUpdateContext,
  ): boolean {
    return (
      context.scheduledAt.getTime() ===
        currentAppointment.scheduledAt.getTime() &&
      input.clientId === currentAppointment.clientId &&
      input.serviceId === currentAppointment.serviceId &&
      context.professionalId === (currentAppointment.professionalId ?? null) &&
      context.roomId === (currentAppointment.roomId ?? null)
    );
  }

  private assertCompletionAllowed(appointment: AppointmentRecord): void {
    if (appointment.status === AppointmentStatus.CANCELED) {
      throw new AppError(
        409,
        "INVALID_APPOINTMENT_STATUS",
        "Agendamentos cancelados não podem ser concluídos.",
      );
    }
  }

  private assertCompletedAppointmentEditable(
    input: AppointmentRequestDto,
    currentAppointment: AppointmentRecord,
    updateContext: AppointmentUpdateContext,
  ): void {
    if (
      currentAppointment.status !== AppointmentStatus.COMPLETED &&
      !currentAppointment.billing
    ) {
      return;
    }

    if (input.status !== AppointmentStatus.COMPLETED) {
      throw new AppError(
        409,
        "COMPLETED_APPOINTMENT_LOCKED",
        "Atendimentos concluídos não podem voltar para outro status.",
      );
    }

    if (
      this.shouldValidateScheduleChange(
        input,
        currentAppointment,
        updateContext,
      )
    ) {
      throw new AppError(
        409,
        "COMPLETED_APPOINTMENT_LOCKED",
        "Atendimentos concluídos não podem alterar cliente, serviço, horário, profissional ou sala.",
      );
    }
  }

  private async syncCompletedAppointment(args: {
    userId: string;
    id: string;
    receivedBy: ReceivedBy;
    transaction: Prisma.TransactionClient;
  }): Promise<CompleteAppointmentResponseDto> {
    const { id, receivedBy, transaction, userId } = args;
    const context = await userClinicContextService.getOrThrow(
      userId,
      transaction,
    );
    const detailedAppointment = await this.getDetailedAppointmentOrThrow(
      context.clinicId,
      id,
      transaction,
    );
    const billing = await billingsService.ensureForCompletedAppointment({
      userId,
      clinicId: context.clinicId,
      appointment: this.buildBillingSnapshot(detailedAppointment, receivedBy),
      db: transaction,
    });
    const appointment = await this.getAppointmentOrThrow(
      context.clinicId,
      id,
      transaction,
    );

    return {
      appointment: toAppointmentResponse(appointment),
      billing: toBillingResponse(billing),
    };
  }

  private async ensureNoConflict(
    input: AppointmentConflictInput,
  ): Promise<void> {
    const { clinicId, scheduledAt, relations, excludeId } = input;
    const { service } = await this.assertAppointmentRelations(
      clinicId,
      relations,
    );

    const appointmentsForDay =
      await appointmentsRepository.findAppointmentsForDay({
        clinicId,
        scheduledAt,
        ...(excludeId ? { excludeId } : {}),
        ...(relations.professionalId
          ? { professionalId: relations.professionalId }
          : {}),
        ...(relations.roomId ? { roomId: relations.roomId } : {}),
      });

    if (
      this.hasTimeConflict(
        scheduledAt,
        service.durationMinutes,
        appointmentsForDay,
      )
    ) {
      throw new AppError(
        409,
        "TIME_CONFLICT",
        "Já existe um agendamento nesse horário.",
      );
    }
  }

  private shouldValidateScheduleChange(
    input: AppointmentRequestDto,
    currentAppointment: AppointmentRecord,
    updateContext: AppointmentUpdateContext,
  ): boolean {
    return !this.isOnlyStatusOrNotesChange(
      input,
      currentAppointment,
      updateContext,
    );
  }

  private async validateScheduleChange(
    clinicId: string,
    id: string,
    input: AppointmentRequestDto,
    updateContext: AppointmentUpdateContext,
  ): Promise<void> {
    this.assertFutureDate(updateContext.scheduledAt);
    await this.ensureNoConflict({
      clinicId,
      scheduledAt: updateContext.scheduledAt,
      relations: this.toRelationsInput({
        clientId: input.clientId,
        serviceId: input.serviceId,
        professionalId: updateContext.professionalId,
        roomId: updateContext.roomId,
      }),
      excludeId: id,
    });
  }

  async list(
    userId: string,
    query: AppointmentsQueryDto,
  ): Promise<ListAppointmentsResponseDto> {
    const context = await userClinicContextService.getOrThrow(userId);
    const filters = this.buildFilters({
      ...query,
      professionalId: resolveScopedProfessionalId(
        context,
        query.professionalId,
      ),
    });
    const [appointments, total] = await Promise.all([
      appointmentsRepository.listByUser(context.clinicId, filters),
      appointmentsRepository.countByUser(context.clinicId, filters),
    ]);

    return {
      data: appointments.map(toAppointmentResponse),
      meta: buildPaginationMeta(total, query.page, query.limit),
    };
  }

  async create(
    userId: string,
    input: AppointmentRequestDto,
  ): Promise<CreateAppointmentResponseDto> {
    const context = await userClinicContextService.getOrThrow(userId);
    const professionalId = resolveScopedProfessionalId(
      context,
      input.professionalId,
    );

    if (!professionalId) {
      throw new AppError(
        400,
        "VALIDATION_ERROR",
        "Profissional é obrigatório para criar um agendamento.",
      );
    }

    const appointmentData = this.buildCreateData(userId, context.clinicId, {
      ...input,
      professionalId,
    });
    this.assertFutureDate(appointmentData.scheduledAt);

    await this.ensureNoConflict({
      clinicId: context.clinicId,
      scheduledAt: appointmentData.scheduledAt,
      relations: this.toRelationsInput({
        clientId: appointmentData.clientId,
        serviceId: appointmentData.serviceId,
        professionalId: appointmentData.professionalId ?? null,
        roomId: appointmentData.roomId ?? null,
      }),
    });

    if (appointmentData.status === AppointmentStatus.COMPLETED) {
      const result = await prisma.$transaction(async (transaction) => {
        const appointment = await appointmentsRepository.create(
          appointmentData,
          transaction,
        );

        return this.syncCompletedAppointment({
          userId,
          id: appointment.id,
          receivedBy: appointment.receivedBy,
          transaction,
        });
      });

      return result.appointment;
    }

    const appointment = await appointmentsRepository.create(appointmentData);
    return toAppointmentResponse(appointment);
  }

  async getById(
    userId: string,
    id: string,
  ): Promise<GetAppointmentResponseDto> {
    const context = await userClinicContextService.getOrThrow(userId);
    const appointment = await this.getAppointmentOrThrow(context.clinicId, id);
    assertProfessionalOwnership(
      context,
      appointment.professionalId,
      "Você só pode acessar seus próprios agendamentos.",
    );
    return toAppointmentResponse(appointment);
  }

  async update(
    userId: string,
    id: string,
    input: AppointmentRequestDto,
  ): Promise<UpdateAppointmentResponseDto> {
    const context = await userClinicContextService.getOrThrow(userId);
    const currentAppointment = await this.getAppointmentOrThrow(
      context.clinicId,
      id,
    );
    assertProfessionalOwnership(
      context,
      currentAppointment.professionalId,
      "Você só pode alterar seus próprios agendamentos.",
    );

    const requestedProfessionalId =
      resolveScopedProfessionalId(context, input.professionalId) ??
      currentAppointment.professionalId ??
      null;

    if (!requestedProfessionalId) {
      throw new AppError(
        400,
        "VALIDATION_ERROR",
        "Profissional é obrigatório para atualizar um agendamento.",
      );
    }

    const normalizedInput: AppointmentRequestDto = {
      ...input,
      professionalId: requestedProfessionalId,
    };

    const updateContext = this.buildUpdateContext(
      normalizedInput,
      currentAppointment,
    );

    this.assertCompletedAppointmentEditable(
      normalizedInput,
      currentAppointment,
      updateContext,
    );

    if (
      this.shouldValidateScheduleChange(
        normalizedInput,
        currentAppointment,
        updateContext,
      )
    ) {
      await this.validateScheduleChange(
        context.clinicId,
        id,
        normalizedInput,
        updateContext,
      );
    }

    if (normalizedInput.status === AppointmentStatus.COMPLETED) {
      const result = await prisma.$transaction(async (transaction) => {
        await appointmentsRepository.update(
          id,
          this.buildUpdateData(normalizedInput, updateContext),
          transaction,
        );

        return this.syncCompletedAppointment({
          userId,
          id,
          receivedBy: currentAppointment.receivedBy,
          transaction,
        });
      });

      return result.appointment;
    }

    const updatedAppointment = await appointmentsRepository.update(
      id,
      this.buildUpdateData(normalizedInput, updateContext),
    );
    return toAppointmentResponse(updatedAppointment);
  }

  async complete(
    userId: string,
    id: string,
    input: CompleteAppointmentRequestDto,
  ): Promise<CompleteAppointmentResponseDto> {
    return prisma.$transaction(async (transaction) => {
      const context = await userClinicContextService.getOrThrow(
        userId,
        transaction,
      );
      const currentAppointment = await this.getAppointmentOrThrow(
        context.clinicId,
        id,
        transaction,
      );
      assertProfessionalOwnership(
        context,
        currentAppointment.professionalId,
        "Você só pode concluir seus próprios agendamentos.",
      );
      this.assertCompletionAllowed(currentAppointment);

      const receivedBy = input.receivedBy ?? currentAppointment.receivedBy;

      if (
        currentAppointment.status !== AppointmentStatus.COMPLETED ||
        currentAppointment.receivedBy !== receivedBy
      ) {
        await appointmentsRepository.markAsCompleted(
          id,
          receivedBy,
          transaction,
        );
      }

      return this.syncCompletedAppointment({
        userId,
        id,
        receivedBy,
        transaction,
      });
    });
  }

  async remove(userId: string, id: string): Promise<void> {
    const context = await userClinicContextService.getOrThrow(userId);
    const appointment = await this.getAppointmentOrThrow(context.clinicId, id);
    assertProfessionalOwnership(
      context,
      appointment.professionalId,
      "Você só pode remover seus próprios agendamentos.",
    );

    if (appointment.billing) {
      throw new AppError(
        409,
        "COMPLETED_APPOINTMENT_LOCKED",
        "Agendamentos com cobrança não podem ser excluídos.",
      );
    }

    await appointmentsRepository.delete(id);
  }
}

export const appointmentsService = new AppointmentsService();
