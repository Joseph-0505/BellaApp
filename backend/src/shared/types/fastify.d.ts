import "@fastify/jwt";

// Expande os tipos do plugin JWT para refletir o payload padrão usado pelo projeto.
declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: {
      userId: string;
      sessionId: string;
      type: "access" | "refresh";
    };
    user: {
      userId: string;
      sessionId: string;
      type: "access" | "refresh";
    };
  }
}
