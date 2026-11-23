jest.mock("../../lib/prisma", () => ({
  prisma: {},
}));

jest.mock("./billings.repository", () => ({
  billingsRepository: {
    findByAppointmentId: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
}));

import { Prisma, ReceivedBy } from "@prisma/client";
import { billingsRepository, PrismaExecutor } from "./billings.repository";
import { billingsService } from "./billings.service";

const mockedBillingsRepository = billingsRepository as jest.Mocked<
  typeof billingsRepository
>;

describe("billingsService.ensureForCompletedAppointment", () => {
  const db = {} as PrismaExecutor;
  const args = {
    userId: "user-1",
    clinicId: "clinic-1",
    db,
    appointment: {
      appointmentId: "appointment-1",
      appointmentScheduledAt: new Date("2026-11-20T13:00:00.000Z"),
      clientId: "client-1",
      clientName: "Cliente 1",
      serviceId: "service-1",
      serviceName: "Serviço 1",
      professionalId: "professional-1",
      professionalName: "Profissional 1",
      amount: new Prisma.Decimal(120),
      receivedBy: ReceivedBy.CLINIC,
    },
  };

  const existingBilling = (overrides: Record<string, unknown> = {}) =>
    ({
      id: "billing-1",
      paidAmount: new Prisma.Decimal(0),
      receivedBy: ReceivedBy.CLINIC,
      ...overrides,
    }) as never;

  it("cria a cobrança com o valor do atendimento quando ela não existe", async () => {
    mockedBillingsRepository.findByAppointmentId.mockResolvedValue(null);
    mockedBillingsRepository.create.mockResolvedValue(existingBilling());

    await billingsService.ensureForCompletedAppointment(args);

    expect(mockedBillingsRepository.create).toHaveBeenCalledTimes(1);
    expect(mockedBillingsRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        clinicId: "clinic-1",
        appointmentId: "appointment-1",
        amount: args.appointment.amount,
        remainingAmount: args.appointment.amount,
      }),
      db,
    );
  });

  it("devolve a cobrança existente sem duplicar", async () => {
    const billing = existingBilling();
    mockedBillingsRepository.findByAppointmentId.mockResolvedValue(billing);

    await expect(
      billingsService.ensureForCompletedAppointment(args),
    ).resolves.toBe(billing);

    expect(mockedBillingsRepository.create).not.toHaveBeenCalled();
    expect(mockedBillingsRepository.update).not.toHaveBeenCalled();
  });

  it("atualiza quem recebe enquanto não há pagamento", async () => {
    mockedBillingsRepository.findByAppointmentId.mockResolvedValue(
      existingBilling({ receivedBy: ReceivedBy.PROFESSIONAL }),
    );

    await billingsService.ensureForCompletedAppointment(args);

    expect(mockedBillingsRepository.update).toHaveBeenCalledWith(
      "billing-1",
      { receivedBy: ReceivedBy.CLINIC },
      db,
    );
  });

  it("recusa trocar quem recebe depois de um pagamento", async () => {
    mockedBillingsRepository.findByAppointmentId.mockResolvedValue(
      existingBilling({
        receivedBy: ReceivedBy.PROFESSIONAL,
        paidAmount: new Prisma.Decimal(10),
      }),
    );

    await expect(
      billingsService.ensureForCompletedAppointment(args),
    ).rejects.toMatchObject({ statusCode: 409, code: "BILLING_ALREADY_PAID" });

    expect(mockedBillingsRepository.update).not.toHaveBeenCalled();
  });
});
