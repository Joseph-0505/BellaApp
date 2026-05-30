import { Prisma } from "@prisma/client";

export const professionalResponseInclude = {
  user: {
    select: {
      passwordHash: true,
      inviteTokens: {
        where: {
          usedAt: null,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
        select: {
          expiresAt: true,
        },
      },
    },
  },
  clinicUser: {
    select: {
      user: {
        select: {
          passwordHash: true,
          inviteTokens: {
            where: {
              usedAt: null,
            },
            orderBy: {
              createdAt: "desc",
            },
            take: 1,
            select: {
              expiresAt: true,
            },
          },
        },
      },
    },
  },
} satisfies Prisma.ProfessionalInclude;

type ProfessionalRecord = {
  id: string;
  name: string;
  specialty: string;
  email: string | null;
  phone: string;
  status: boolean;
  user?: {
    passwordHash: string | null;
    inviteTokens?: Array<{ expiresAt: Date }>;
  } | null;
  clinicUser?: {
    user?: {
      passwordHash: string | null;
      inviteTokens?: Array<{ expiresAt: Date }>;
    } | null;
  } | null;
};

type ProfessionalStatusResponse = "ativo" | "inativo";
type ProfessionalTone = "rose" | "sand" | "sage" | "mist";
type ProfessionalAccessStatus =
  | "active"
  | "invite_pending"
  | "invite_expired"
  | "no_access";

export type ProfessionalResponse = {
  id: string;
  name: string;
  specialty: string;
  email: string | null;
  phone: string;
  status: ProfessionalStatusResponse;
  initials: string;
  tone: ProfessionalTone;
  accessStatus: ProfessionalAccessStatus;
  inviteExpiresAt: string | null;
};

const professionalTones: ProfessionalTone[] = ["rose", "sand", "sage", "mist"];

// Usa as duas primeiras palavras do nome para montar as iniciais exibidas na interface.
function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

// Escolhe uma tonalidade fixa a partir do nome para manter consistencia visual.
function pickTone(name: string): ProfessionalTone {
  const score = String(name)
    .split("")
    .reduce((total, char) => total + char.charCodeAt(0), 0);

  return professionalTones[score % professionalTones.length] ?? "rose";
}

function resolveAccessStatus(professional: ProfessionalRecord): {
  accessStatus: ProfessionalAccessStatus;
  inviteExpiresAt: string | null;
} {
  const linkedUser = professional.user ?? professional.clinicUser?.user;
  const latestInvite = linkedUser?.inviteTokens?.[0] ?? null;

  if (!linkedUser) {
    return {
      accessStatus: "no_access",
      inviteExpiresAt: null,
    };
  }

  if (linkedUser.passwordHash) {
    return {
      accessStatus: "active",
      inviteExpiresAt: null,
    };
  }

  if (!latestInvite) {
    return {
      accessStatus: "no_access",
      inviteExpiresAt: null,
    };
  }

  const inviteExpiry =
    latestInvite.expiresAt instanceof Date ? latestInvite.expiresAt : null;

  if (!inviteExpiry || Number.isNaN(inviteExpiry.getTime())) {
    return {
      accessStatus: "no_access",
      inviteExpiresAt: null,
    };
  }

  return {
    accessStatus:
      inviteExpiry.getTime() > Date.now() ? "invite_pending" : "invite_expired",
    inviteExpiresAt: inviteExpiry.toISOString(),
  };
}

// Adapta o registro do banco para o formato retornado pela API.
export function toProfessionalResponse(
  professional: ProfessionalRecord,
): ProfessionalResponse {
  const access = resolveAccessStatus(professional);

  return {
    id: professional.id,
    name: professional.name,
    specialty: professional.specialty,
    email: professional.email ?? null,
    phone: professional.phone,
    status: professional.status ? "ativo" : "inativo",
    initials: getInitials(professional.name),
    tone: pickTone(professional.name),
    accessStatus: access.accessStatus,
    inviteExpiresAt: access.inviteExpiresAt,
  };
}
