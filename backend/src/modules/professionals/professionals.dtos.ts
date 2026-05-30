import { z } from "zod";
import { ProfessionalResponse } from "../../shared/mappers/professional-response";
import {
  inviteProfessionalBodySchema,
  professionalBodySchema,
  professionalParamsSchema,
  professionalsQuerySchema,
} from "./professionals.schemas";

export type CreateProfessionalRequestDto = z.infer<typeof professionalBodySchema>;
export type UpdateProfessionalRequestDto = z.infer<typeof professionalBodySchema>;
export type InviteProfessionalRequestDto = z.infer<typeof inviteProfessionalBodySchema>;
export type ProfessionalParamsDto = z.infer<typeof professionalParamsSchema>;
export type ProfessionalsQueryDto = z.infer<typeof professionalsQuerySchema>;

export type CreateProfessionalResponseDto = ProfessionalResponse;
export type GetProfessionalResponseDto = ProfessionalResponse;
export type UpdateProfessionalResponseDto = ProfessionalResponse;
export type InviteProfessionalResponseDto = ProfessionalResponse;
export type ListProfessionalsResponseDto = {
  data: ProfessionalResponse[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};
