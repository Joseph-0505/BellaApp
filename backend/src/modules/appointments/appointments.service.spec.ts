const mockPrisma = {
  $transaction: jest.fn(),
};

const mockBillingsService = {
  ensureForCompletedAppointment: jest.fn(),
};

const mockPublishDomainEvent = jest.fn();

jest.mock("../../lib/prisma", () => ({
  prisma: mockPrisma,
}));

jest.mock("./appointments.repository", () => ({
  appointmentsRepository: {
    listByUser: jest.fn(),
    countByUser: jest.fn(),
    findById: jest.fn(),
    findDetailedById: jest.fn(),
    findClientById: jest.fn(),
    findServiceById: jest.fn(),
    findProfessionalById: jest.fn(),
    findRoomById: jest.fn(),
    findAppointmentsForDay: jest.fn(),
    lockScheduleResources: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    markAsCompleted: jest.fn(),
    delete: jest.fn(),
  },
  CONFLICT_BLOCKING_STATUSES: ["SCHEDULED", "CONFIRMED"],
}));

jest.mock("../billings/billings.service", () => ({
  billingsService: mockBillingsService,
}));

jest.mock("../../shared/events/domain-event-bus", () => ({
  domainEventBus: {
    publish: mockPublishDomainEvent,
  },
}));

jest.mock("../../shared/auth/user-clinic-context", () => {
  const actual = jest.requireActual("../../shared/auth/user-clinic-context");

  return {
    ...actual,
    userClinicContextService: {
      getOrThrow: jest.fn(),
    },
  };
});

import { AppointmentStatus, ClinicPlan, ClinicUserRole } from "@prisma/client";
import { userClinicContextService } from "../../shared/auth/user-clinic-context";
import { appointmentsRepository } from "./appointments.repository";
import { appointmentsService } from "./appointments.service";

const mockedAppointmentsRepository = appointmentsRepository as jest.Mocked<
  typeof appointmentsRepository
>;
const mockedUserClinicContextService = userClinicContextService as jest.Mocked<
  typeof userClinicContextService
>;

describe("appointmentsService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (mockPrisma.$transaction as jest.Mock).mockImplementation(
      async (callback: (transaction: unknown) => unknown) =>
        callback(mockPrisma),
    );
    mockedUserClinicContextService.getOrThrow.mockResolvedValue({
      userId: "user-1",
      clinicId: "user-1",
      plan: ClinicPlan.TRIAL,
      trialEndsAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      role: ClinicUserRole.ADMIN,
      professionalId: "professional-1",
    });
    mockBillingsService.ensureForCompletedAppointment.mockResolvedValue({
      id: "billing-1",
      userId: "user-1",
      appointmentId: "appointment-1",
      appointmentScheduledAt: new Date(),
      clientId: "client-1",
      clientName: "Cliente 1",
      serviceId: "service-1",
      serviceName: "Serviço 1",
      professionalId: "professional-1",
      professionalName: "Profissional 1",
      amount: 120,
      paidAmount: 0,
      remainingAmount: 120,
      status: "PENDING",
      receivedBy: "CLINIC",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    mockPublishDomainEvent.mockResolvedValue(undefined);
  });

  it("deve bloquear criacao de agendamento no passado", async () => {
    const pastDate = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    await expect(
      appointmentsService.create("user-1", {
        clientId: "client-1",
        serviceId: "service-1",
        professionalId: "professional-1",
        scheduledAt: pastDate,
        status: "SCHEDULED",
      }),
    ).rejects.toMatchObject({
      statusCode: 400,
      code: "VALIDATION_ERROR",
    });

    expect(mockedAppointmentsRepository.findClientById).not.toHaveBeenCalled();
  });

  it("deve bloquear conflito de horário ao criar agendamento", async () => {
    const scheduledAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    mockedAppointmentsRepository.findClientById.mockResolvedValue({
      id: "client-1",
      userId: "user-1",
    } as never);
    mockedAppointmentsRepository.findServiceById.mockResolvedValue({
      id: "service-1",
      userId: "user-1",
      durationMinutes: 60,
    } as never);
    mockedAppointmentsRepository.findProfessionalById.mockResolvedValue({
      id: "professional-1",
      userId: "user-1",
    } as never);
    mockedAppointmentsRepository.findAppointmentsForDay.mockResolvedValue([
      {
        id: "appointment-existing",
        userId: "user-1",
        clientId: "client-2",
        serviceId: "service-2",
        professionalId: "professional-1",
        scheduledAt: new Date(scheduledAt.getTime() + 30 * 60 * 1000),
        status: AppointmentStatus.CONFIRMED,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        service: {
          durationMinutes: 60,
        },
      },
    ] as never);

    await expect(
      appointmentsService.create("user-1", {
        clientId: "client-1",
        serviceId: "service-1",
        professionalId: "professional-1",
        scheduledAt: scheduledAt.toISOString(),
        status: "SCHEDULED",
      }),
    ).rejects.toMatchObject({
      statusCode: 409,
      code: "TIME_CONFLICT",
    });

    expect(mockedAppointmentsRepository.findClientById).toHaveBeenCalledWith(
      "user-1",
      "client-1",
    );
    expect(mockedAppointmentsRepository.findServiceById).toHaveBeenCalledWith(
      "user-1",
      "service-1",
    );
    expect(
      mockedAppointmentsRepository.findProfessionalById,
    ).toHaveBeenCalledWith("user-1", "professional-1");
    expect(
      mockedAppointmentsRepository.findAppointmentsForDay,
    ).toHaveBeenCalledWith(
      {
        clinicId: "user-1",
        scheduledAt,
        professionalId: "professional-1",
      },
      mockPrisma,
    );
    expect(mockedAppointmentsRepository.lockScheduleResources).toHaveBeenCalledWith(
      expect.objectContaining({ professionalId: "professional-1" }),
      mockPrisma,
    );
  });

  it("deve ignorar agendamentos cancelados e concluídos na validação de conflito", async () => {
    const scheduledAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    mockedAppointmentsRepository.findClientById.mockResolvedValue({
      id: "client-1",
      userId: "user-1",
      name: "Maria",
      email: "maria@example.com",
    } as never);
    mockedAppointmentsRepository.findServiceById.mockResolvedValue({
      id: "service-1",
      userId: "user-1",
      name: "Limpeza de pele",
      durationMinutes: 60,
    } as never);
    mockedAppointmentsRepository.findAppointmentsForDay.mockResolvedValue([
      {
        id: "appointment-canceled",
        userId: "user-1",
        clientId: "client-2",
        serviceId: "service-2",
        professionalId: null,
        roomId: null,
        scheduledAt,
        status: AppointmentStatus.CANCELED,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        service: {
          durationMinutes: 60,
        },
      },
      {
        id: "appointment-completed",
        userId: "user-1",
        clientId: "client-3",
        serviceId: "service-3",
        professionalId: null,
        roomId: null,
        scheduledAt,
        status: AppointmentStatus.COMPLETED,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        service: {
          durationMinutes: 60,
        },
      },
    ] as never);
    mockedAppointmentsRepository.create.mockResolvedValue({
      id: "appointment-new",
      userId: "user-1",
      clientId: "client-1",
      serviceId: "service-1",
      professionalId: null,
      roomId: null,
      scheduledAt,
      status: AppointmentStatus.SCHEDULED,
      receivedBy: "CLINIC",
      notes: null,
      billing: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never);

    const result = await appointmentsService.create("user-1", {
      clientId: "client-1",
      serviceId: "service-1",
      professionalId: "professional-1",
      scheduledAt: scheduledAt.toISOString(),
      status: "SCHEDULED",
    });

    expect(mockedAppointmentsRepository.create).toHaveBeenCalledWith(
      {
        userId: "user-1",
        clinicId: "user-1",
        clientId: "client-1",
        serviceId: "service-1",
        professionalId: "professional-1",
        scheduledAt,
        status: AppointmentStatus.SCHEDULED,
      },
      mockPrisma,
    );
    expect(result).toEqual({
      id: "appointment-new",
      clientId: "client-1",
      serviceId: "service-1",
      professionalId: null,
      roomId: null,
      scheduledAt: scheduledAt.toISOString(),
      status: AppointmentStatus.SCHEDULED,
      receivedBy: "CLINIC",
      notes: null,
      billingId: null,
      billingAmount: null,
      billingStatus: null,
      outstandingAmount: null,
    });
    expect(mockPublishDomainEvent).toHaveBeenCalledWith({
      type: "appointment.created",
      clinicId: "user-1",
      aggregateId: "appointment-new",
      actorId: "user-1",
      metadata: {
        clientId: "client-1",
        serviceId: "service-1",
        professionalId: "professional-1",
        scheduledAt: scheduledAt.toISOString(),
        status: AppointmentStatus.SCHEDULED,
        clientName: "Maria",
        clientEmail: "maria@example.com",
        serviceName: "Limpeza de pele",
        professionalName: null,
      },
    });
  });

  it("deve considerar sala e profissional ao consultar conflitos", async () => {
    const scheduledAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    mockedAppointmentsRepository.findClientById.mockResolvedValue({
      id: "client-1",
      userId: "user-1",
    } as never);
    mockedAppointmentsRepository.findServiceById.mockResolvedValue({
      id: "service-1",
      userId: "user-1",
      durationMinutes: 60,
    } as never);
    mockedAppointmentsRepository.findProfessionalById.mockResolvedValue({
      id: "professional-1",
      userId: "user-1",
    } as never);
    mockedAppointmentsRepository.findRoomById.mockResolvedValue({
      id: "room-1",
      userId: "user-1",
    } as never);
    mockedAppointmentsRepository.findAppointmentsForDay.mockResolvedValue(
      [] as never,
    );
    mockedAppointmentsRepository.create.mockResolvedValue({
      id: "appointment-room",
      userId: "user-1",
      clientId: "client-1",
      serviceId: "service-1",
      professionalId: "professional-1",
      roomId: "room-1",
      scheduledAt,
      status: AppointmentStatus.SCHEDULED,
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never);

    await appointmentsService.create("user-1", {
      clientId: "client-1",
      serviceId: "service-1",
      professionalId: "professional-1",
      roomId: "room-1",
      scheduledAt: scheduledAt.toISOString(),
      status: "SCHEDULED",
    });

    expect(
      mockedAppointmentsRepository.findAppointmentsForDay,
    ).toHaveBeenCalledWith(
      {
        clinicId: "user-1",
        scheduledAt,
        professionalId: "professional-1",
        roomId: "room-1",
      },
      mockPrisma,
    );
  });

  it("deve permitir atualizar somente status de agendamento passado sem revalidar data nem perder profissional e sala", async () => {
    const originalScheduledAt = new Date(Date.now() - 2 * 60 * 60 * 1000);

    mockedAppointmentsRepository.findById
      .mockResolvedValueOnce({
        id: "appointment-1",
        userId: "user-1",
        clientId: "client-1",
        serviceId: "service-1",
        professionalId: "professional-1",
        roomId: "room-1",
        scheduledAt: originalScheduledAt,
        status: AppointmentStatus.SCHEDULED,
        receivedBy: "CLINIC",
        notes: "Observação antiga",
        billing: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as never)
      .mockResolvedValueOnce({
        id: "appointment-1",
        userId: "user-1",
        clientId: "client-1",
        serviceId: "service-1",
        professionalId: "professional-1",
        roomId: "room-1",
        scheduledAt: originalScheduledAt,
        status: AppointmentStatus.COMPLETED,
        receivedBy: "CLINIC",
        notes: "Atendimento concluído",
        billing: {
          id: "billing-1",
          amount: 120,
          status: "PENDING",
          remainingAmount: 120,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      } as never);

    mockedAppointmentsRepository.findDetailedById.mockResolvedValue({
      id: "appointment-1",
      userId: "user-1",
      clientId: "client-1",
      serviceId: "service-1",
      professionalId: "professional-1",
      roomId: "room-1",
      scheduledAt: originalScheduledAt,
      status: AppointmentStatus.COMPLETED,
      receivedBy: "CLINIC",
      notes: "Atendimento concluído",
      client: {
        name: "Cliente 1",
      },
      service: {
        name: "Serviço 1",
        price: 120,
        durationMinutes: 60,
      },
      professional: {
        name: "Profissional 1",
      },
      billing: {
        id: "billing-1",
        amount: 120,
        status: "PENDING",
        remainingAmount: 120,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never);
    mockedAppointmentsRepository.update.mockResolvedValue({
      id: "appointment-1",
      userId: "user-1",
      clientId: "client-1",
      serviceId: "service-1",
      professionalId: "professional-1",
      roomId: "room-1",
      scheduledAt: originalScheduledAt,
      status: AppointmentStatus.COMPLETED,
      receivedBy: "CLINIC",
      notes: "Atendimento concluído",
      billing: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never);

    const result = await appointmentsService.update("user-1", "appointment-1", {
      clientId: "client-1",
      serviceId: "service-1",
      professionalId: "professional-1",
      scheduledAt: originalScheduledAt.toISOString(),
      status: "COMPLETED",
      notes: "Atendimento concluído",
    });

    expect(mockedAppointmentsRepository.findClientById).not.toHaveBeenCalled();
    expect(mockedAppointmentsRepository.findServiceById).not.toHaveBeenCalled();
    expect(
      mockedAppointmentsRepository.findProfessionalById,
    ).not.toHaveBeenCalled();
    expect(
      mockedAppointmentsRepository.findAppointmentsForDay,
    ).not.toHaveBeenCalled();
    expect(mockedAppointmentsRepository.update).toHaveBeenCalledWith(
      "appointment-1",
      {
        clientId: "client-1",
        serviceId: "service-1",
        professionalId: "professional-1",
        roomId: "room-1",
        scheduledAt: originalScheduledAt,
        status: AppointmentStatus.COMPLETED,
        notes: "Atendimento concluído",
      },
      mockPrisma,
    );
    expect(result).toEqual({
      id: "appointment-1",
      clientId: "client-1",
      serviceId: "service-1",
      professionalId: "professional-1",
      roomId: "room-1",
      scheduledAt: originalScheduledAt.toISOString(),
      status: AppointmentStatus.COMPLETED,
      receivedBy: "CLINIC",
      notes: "Atendimento concluído",
      billingId: "billing-1",
      billingAmount: 120,
      billingStatus: "PENDING",
      outstandingAmount: 120,
    });
  });

  it("deve publicar os dados do cliente ao confirmar um agendamento, para o lembrete", async () => {
    const scheduledAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    const record = {
      id: "appointment-1",
      userId: "user-1",
      clientId: "client-1",
      serviceId: "service-1",
      professionalId: "professional-1",
      roomId: null,
      scheduledAt,
      status: AppointmentStatus.SCHEDULED,
      receivedBy: "CLINIC",
      notes: null,
      billing: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockedAppointmentsRepository.findById.mockResolvedValue(record as never);
    mockedAppointmentsRepository.update.mockResolvedValue({
      ...record,
      status: AppointmentStatus.CONFIRMED,
    } as never);
    mockedAppointmentsRepository.findClientById.mockResolvedValue({
      id: "client-1",
      name: "Maria",
      email: "maria@example.com",
    } as never);
    mockedAppointmentsRepository.findServiceById.mockResolvedValue({
      id: "service-1",
      name: "Limpeza de pele",
      durationMinutes: 60,
    } as never);
    mockedAppointmentsRepository.findProfessionalById.mockResolvedValue({
      id: "professional-1",
      name: "Ana",
    } as never);

    await appointmentsService.update("user-1", "appointment-1", {
      clientId: "client-1",
      serviceId: "service-1",
      professionalId: "professional-1",
      scheduledAt: scheduledAt.toISOString(),
      status: "CONFIRMED",
    });

    expect(mockPublishDomainEvent).toHaveBeenCalledWith({
      type: "appointment.updated",
      clinicId: "user-1",
      aggregateId: "appointment-1",
      actorId: "user-1",
      metadata: {
        clientId: "client-1",
        serviceId: "service-1",
        professionalId: "professional-1",
        scheduledAt: scheduledAt.toISOString(),
        status: AppointmentStatus.CONFIRMED,
        clientName: "Maria",
        clientEmail: "maria@example.com",
        serviceName: "Limpeza de pele",
        professionalName: "Ana",
      },
    });
  });

  describe("conclusão e escopo do profissional", () => {
    const appointmentRecord = (overrides: Record<string, unknown> = {}) =>
      ({
        id: "appointment-1",
        userId: "user-1",
        clientId: "client-1",
        serviceId: "service-1",
        professionalId: "professional-1",
        roomId: null,
        scheduledAt: new Date("2026-11-20T13:00:00.000Z"),
        status: AppointmentStatus.SCHEDULED,
        receivedBy: "CLINIC",
        notes: null,
        billing: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides,
      }) as never;

    const detailedRecord = () =>
      ({
        ...(appointmentRecord({
          status: AppointmentStatus.COMPLETED,
        }) as object),
        client: { name: "Cliente 1" },
        service: { name: "Serviço 1", price: 120, durationMinutes: 60 },
        professional: { name: "Profissional 1" },
      }) as never;

    const actAsProfessional = () =>
      mockedUserClinicContextService.getOrThrow.mockResolvedValue({
        userId: "user-2",
        clinicId: "user-1",
        plan: ClinicPlan.TEAM,
        trialEndsAt: null,
        role: ClinicUserRole.PROFESSIONAL,
        professionalId: "professional-1",
      });

    it("deve concluir e solicitar a cobrança dentro da mesma transação", async () => {
      mockedAppointmentsRepository.findById
        .mockResolvedValueOnce(appointmentRecord())
        .mockResolvedValueOnce(
          appointmentRecord({ status: AppointmentStatus.COMPLETED }),
        );
      mockedAppointmentsRepository.findDetailedById.mockResolvedValue(
        detailedRecord(),
      );

      const result = await appointmentsService.complete(
        "user-1",
        "appointment-1",
        {},
      );

      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
      expect(mockedAppointmentsRepository.markAsCompleted).toHaveBeenCalledWith(
        "appointment-1",
        "CLINIC",
        mockPrisma,
      );
      expect(
        mockBillingsService.ensureForCompletedAppointment,
      ).toHaveBeenCalledTimes(1);
      expect(
        mockBillingsService.ensureForCompletedAppointment,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          clinicId: "user-1",
          db: mockPrisma,
          appointment: expect.objectContaining({
            appointmentId: "appointment-1",
            serviceName: "Serviço 1",
          }),
        }),
      );
      expect(result.billing.id).toBe("billing-1");
      expect(mockPublishDomainEvent).toHaveBeenCalledWith(
        expect.objectContaining({ type: "appointment.completed" }),
      );
    });

    it("não deve regravar o status ao repetir a conclusão", async () => {
      mockedAppointmentsRepository.findById.mockResolvedValue(
        appointmentRecord({ status: AppointmentStatus.COMPLETED }),
      );
      mockedAppointmentsRepository.findDetailedById.mockResolvedValue(
        detailedRecord(),
      );

      await appointmentsService.complete("user-1", "appointment-1", {});

      expect(
        mockedAppointmentsRepository.markAsCompleted,
      ).not.toHaveBeenCalled();
    });

    it("deve recusar a conclusão de agendamento cancelado sem gerar cobrança", async () => {
      mockedAppointmentsRepository.findById.mockResolvedValue(
        appointmentRecord({ status: AppointmentStatus.CANCELED }),
      );

      await expect(
        appointmentsService.complete("user-1", "appointment-1", {}),
      ).rejects.toMatchObject({
        statusCode: 409,
        code: "INVALID_APPOINTMENT_STATUS",
      });

      expect(
        mockedAppointmentsRepository.markAsCompleted,
      ).not.toHaveBeenCalled();
      expect(
        mockBillingsService.ensureForCompletedAppointment,
      ).not.toHaveBeenCalled();
      expect(mockPublishDomainEvent).not.toHaveBeenCalled();
    });

    it("deve impedir o profissional de concluir agendamento de outro profissional", async () => {
      actAsProfessional();
      mockedAppointmentsRepository.findById.mockResolvedValue(
        appointmentRecord({ professionalId: "professional-2" }),
      );

      await expect(
        appointmentsService.complete("user-2", "appointment-1", {}),
      ).rejects.toMatchObject({ statusCode: 403 });

      expect(
        mockedAppointmentsRepository.markAsCompleted,
      ).not.toHaveBeenCalled();
      expect(
        mockBillingsService.ensureForCompletedAppointment,
      ).not.toHaveBeenCalled();
    });

    it("deve impedir o profissional de abrir agendamento de outro profissional", async () => {
      actAsProfessional();
      mockedAppointmentsRepository.findById.mockResolvedValue(
        appointmentRecord({ professionalId: "professional-2" }),
      );

      await expect(
        appointmentsService.getById("user-2", "appointment-1"),
      ).rejects.toMatchObject({ statusCode: 403 });
    });

    it("deve recusar filtro da agenda de outro profissional", async () => {
      actAsProfessional();

      await expect(
        appointmentsService.list("user-2", {
          page: 1,
          limit: 10,
          professionalId: "professional-2",
        }),
      ).rejects.toMatchObject({ statusCode: 403 });

      expect(mockedAppointmentsRepository.listByUser).not.toHaveBeenCalled();
    });

    it("deve limitar a listagem à agenda do próprio profissional", async () => {
      actAsProfessional();
      mockedAppointmentsRepository.listByUser.mockResolvedValue([]);
      mockedAppointmentsRepository.countByUser.mockResolvedValue(0);

      await appointmentsService.list("user-2", { page: 1, limit: 10 });

      expect(mockedAppointmentsRepository.listByUser).toHaveBeenCalledWith(
        "user-1",
        expect.objectContaining({ professionalId: "professional-1" }),
      );
    });
  });
});
