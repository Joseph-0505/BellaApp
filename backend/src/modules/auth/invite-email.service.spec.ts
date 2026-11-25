import { inviteEmailService } from "./invite-email.service";

const input = {
  activationUrl: "http://localhost:5173/ativar-conta?token=abc",
  clinicName: "Clinica <Bella>",
  recipientEmail: "pro@example.com",
  recipientName: "Ana",
};

describe("inviteEmailService", () => {
  const fetchMock = jest.spyOn(global, "fetch");

  afterAll(() => fetchMock.mockRestore());

  it("entrega o convite ao notification-service como e-mail", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 202 }));

    await inviteEmailService.sendProfessionalInvite(input);

    const [url, init] = fetchMock.mock.calls[0]!;
    expect(String(url)).toBe("http://localhost:3001/api/v1/notifications");
    expect(init?.method).toBe("POST");
    const body = JSON.parse(String(init?.body));
    expect(body).toMatchObject({
      channel: "email",
      recipient: "pro@example.com",
      metadata: { source: "professional-invite" },
    });
    expect(body.message).toContain(input.activationUrl);
    expect(body.html).toContain("Clinica &lt;Bella&gt;");
  });

  it("falha quando o notification-service recusa, para a rota não dizer que enviou", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 400 }));

    await expect(inviteEmailService.sendProfessionalInvite(input)).rejects.toThrow("HTTP 400");
  });
});
