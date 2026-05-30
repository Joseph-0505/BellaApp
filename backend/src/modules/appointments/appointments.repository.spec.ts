jest.mock("../../lib/prisma", () => ({
  prisma: {},
}));

import { buildConflictScopeWhere } from "./appointments.repository";

describe("buildConflictScopeWhere", () => {
  it("deve priorizar a sala quando roomId estiver informado", () => {
    expect(
      buildConflictScopeWhere({
        professionalId: "professional-1",
        roomId: "room-1",
      }),
    ).toEqual({ roomId: "room-1" });
  });

  it("deve usar o profissional quando nao houver sala informada", () => {
    expect(
      buildConflictScopeWhere({
        professionalId: "professional-1",
      }),
    ).toEqual({ professionalId: "professional-1" });
  });

  it("deve retornar escopo vazio quando nao houver profissional nem sala", () => {
    expect(buildConflictScopeWhere({})).toEqual({});
  });
});
