const mockPrisma = {
  $transaction: jest.fn(),
};

const mockBillingsService = {
  ensureForCompletedAppointment: jest.fn(),
};

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
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  CONFLICT_BLOCKING_STATUSES: ["SCHEDULED", "CONFIRMED"],
}));

jest.mock("../billings/billings.service", () => ({
  billingsService: mockBillingsService,
}));

import { AppointmentStatus } from "@prisma/client";
import { appointmentsRepository } from "./appointments.repository";
import { appointmentsService } from "./appointments.service";

const mockedAppointmentsRepository = appointmentsRepository as jest.Mocked<
  typeof appointmentsRepository
>;

describe("appointmentsService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (mockPrisma.$transaction as jest.Mock).mockImplementation(
      async (callback: (transaction: unknown) => unknown) =>
        callback(mockPrisma),
    );
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
  });

  it("deve bloquear criacao de agendamento no passado", async () => {
    const pastDate = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    await expect(
      appointmentsService.create("user-1", {
        clientId: "client-1",
        serviceId: "service-1",
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
    ).toHaveBeenCalledWith({
      userId: "user-1",
      scheduledAt,
      professionalId: "professional-1",
    });
  });

  it("deve ignorar agendamentos cancelados e concluídos na validação de conflito", async () => {
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
      scheduledAt: scheduledAt.toISOString(),
      status: "SCHEDULED",
    });

    expect(mockedAppointmentsRepository.create).toHaveBeenCalledWith({
      userId: "user-1",
      clientId: "client-1",
      serviceId: "service-1",
      scheduledAt,
      status: AppointmentStatus.SCHEDULED,
    });
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
    ).toHaveBeenCalledWith({
      userId: "user-1",
      scheduledAt,
      professionalId: "professional-1",
      roomId: "room-1",
    });
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
});
