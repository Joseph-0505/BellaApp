import { accountInviteService } from "../auth/account-invite.service";
import { AppError } from "../../shared/errors/app-error";
import {
  assertClinicAdmin,
  isIndividualPlan,
  userClinicContextService,
} from "../../shared/auth/user-clinic-context";
import { toProfessionalResponse } from "../../shared/mappers/professional-response";
import { buildPaginationMeta } from "../../shared/utils/pagination";
import {
  CreateProfessionalRequestDto,
  CreateProfessionalResponseDto,
  GetProfessionalResponseDto,
  InviteProfessionalRequestDto,
  InviteProfessionalResponseDto,
  ListProfessionalsResponseDto,
  ProfessionalsQueryDto,
  UpdateProfessionalRequestDto,
  UpdateProfessionalResponseDto,
} from "./professionals.dtos";
import { professionalsRepository } from "./professionals.repository";

const INVITED_PROFESSIONAL_DEFAULT_SPECIALTY = "A definir";
const INVITED_PROFESSIONAL_DEFAULT_PHONE = "A definir";

class ProfessionalsService {
  private mapStatusToDatabase(
    status:
      | CreateProfessionalRequestDto["status"]
      | ProfessionalsQueryDto["status"],
  ) {
    if (status === undefined) {
      return undefined;
    }

    return status === "ativo";
  }

  private async assertPlanLimit(
    context: Awaited<ReturnType<typeof userClinicContextService.getOrThrow>>,
  ) {
    const professionalsCount = await professionalsRepository.countAllByClinic(
      context.clinicId,
    );

    if (context.plan === "TRIAL" && professionalsCount >= 1) {
      throw new AppError(
        409,
        "TRIAL_LIMIT",
        "Plano de teste permite apenas 1 profissional.",
      );
    }

    if (isIndividualPlan(context) && professionalsCount >= 1) {
      throw new AppError(
        409,
        "PLAN_LIMIT",
        "Faça upgrade para adicionar mais profissionais.",
      );
    }
  }

  async list(
    userId: string,
    query: ProfessionalsQueryDto,
  ): Promise<ListProfessionalsResponseDto> {
    const context = await userClinicContextService.getOrThrow(userId);
    const status = this.mapStatusToDatabase(query.status);

    const [professionals, total] = await Promise.all([
      professionalsRepository.listByUser({
        clinicId: context.clinicId,
        page: query.page,
        limit: query.limit,
        ...(query.search ? { search: query.search } : {}),
        ...(status !== undefined ? { status } : {}),
      }),
      professionalsRepository.countByUser({
        clinicId: context.clinicId,
        ...(query.search ? { search: query.search } : {}),
        ...(status !== undefined ? { status } : {}),
      }),
    ]);

    return {
      data: professionals.map(toProfessionalResponse),
      meta: buildPaginationMeta(total, query.page, query.limit),
    };
  }

  async create(
    userId: string,
    input: CreateProfessionalRequestDto,
  ): Promise<CreateProfessionalResponseDto> {
    const context = await userClinicContextService.getOrThrow(userId);
    assertClinicAdmin(context);
    await this.assertPlanLimit(context);

    const professionalData = {
      userId,
      clinicId: context.clinicId,
      name: input.name,
      specialty: input.specialty,
      phone: input.phone,
      status: this.mapStatusToDatabase(input.status) ?? true,
      ...(input.email ? { email: input.email } : {}),
    };

    const professional = await professionalsRepository.create(professionalData);

    return toProfessionalResponse(professional);
  }

  async invite(
    userId: string,
    input: InviteProfessionalRequestDto,
  ): Promise<InviteProfessionalResponseDto> {
    const context = await userClinicContextService.getOrThrow(userId);
    assertClinicAdmin(context);
    await this.assertPlanLimit(context);

    const existingUser = await professionalsRepository.findUserByEmail(
      input.email,
    );

    if (existingUser) {
      throw new AppError(409, "EMAIL_ALREADY_EXISTS", "Email ja cadastrado.");
    }

    const clinicSummary = await professionalsRepository.findClinicSummary(
      context.clinicId,
    );
    const clinicName =
      clinicSummary?.businessProfile?.businessName || "BellaApp";

    const professional =
      await professionalsRepository.createInvitedProfessional({
        clinicId: context.clinicId,
        email: input.email,
        invitedByUserId: userId,
        name: input.name,
        specialty: INVITED_PROFESSIONAL_DEFAULT_SPECIALTY,
        phone: INVITED_PROFESSIONAL_DEFAULT_PHONE,
        status: true,
      });

    await accountInviteService.issueProfessionalInvite({
      clinicName,
      recipientEmail: input.email,
      recipientName: input.name,
      userId: professional.userId,
    });

    const invitedProfessional = await professionalsRepository.findById(
      context.clinicId,
      professional.id,
    );

    return toProfessionalResponse(invitedProfessional ?? professional);
  }

  async resendInvite(
    userId: string,
    id: string,
  ): Promise<InviteProfessionalResponseDto> {
    const context = await userClinicContextService.getOrThrow(userId);
    assertClinicAdmin(context);

    const [professional, linkedUser, clinicSummary] = await Promise.all([
      professionalsRepository.findById(context.clinicId, id),
      professionalsRepository.findLinkedUserByProfessionalId(
        context.clinicId,
        id,
      ),
      professionalsRepository.findClinicSummary(context.clinicId),
    ]);

    if (!professional) {
      throw new AppError(
        404,
        "RESOURCE_NOT_FOUND",
        "Profissional nao encontrado.",
      );
    }

    if (!professional.email) {
      throw new AppError(
        409,
        "INVITE_EMAIL_REQUIRED",
        "Informe um email valido para reenviar o convite.",
      );
    }

    if (!linkedUser) {
      throw new AppError(
        409,
        "INVITE_NOT_AVAILABLE",
        "Esse profissional nao possui acesso vinculado.",
      );
    }

    if (linkedUser.user.passwordHash) {
      throw new AppError(
        409,
        "ACCOUNT_ALREADY_ACTIVE",
        "Esse profissional ja ativou o proprio acesso.",
      );
    }

    await accountInviteService.issueProfessionalInvite({
      clinicName: clinicSummary?.businessProfile?.businessName || "BellaApp",
      recipientEmail: professional.email,
      recipientName: professional.name,
      userId: linkedUser.userId,
    });

    const refreshedProfessional = await professionalsRepository.findById(
      context.clinicId,
      id,
    );

    return toProfessionalResponse(refreshedProfessional ?? professional);
  }

  async getById(
    userId: string,
    id: string,
  ): Promise<GetProfessionalResponseDto> {
    const context = await userClinicContextService.getOrThrow(userId);
    const professional = await professionalsRepository.findById(
      context.clinicId,
      id,
    );

    if (!professional) {
      throw new AppError(
        404,
        "RESOURCE_NOT_FOUND",
        "Profissional nao encontrado.",
      );
    }

    return toProfessionalResponse(professional);
  }

  async update(
    userId: string,
    id: string,
    input: UpdateProfessionalRequestDto,
  ): Promise<UpdateProfessionalResponseDto> {
    const context = await userClinicContextService.getOrThrow(userId);
    assertClinicAdmin(context);

    const [currentProfessional, linkedUser] = await Promise.all([
      professionalsRepository.findById(context.clinicId, id),
      professionalsRepository.findLinkedUserByProfessionalId(
        context.clinicId,
        id,
      ),
    ]);

    if (!currentProfessional) {
      throw new AppError(
        404,
        "RESOURCE_NOT_FOUND",
        "Profissional nao encontrado.",
      );
    }

    const nextEmail =
      input.email === undefined
        ? (currentProfessional.email ?? null)
        : input.email ||
          (linkedUser ? (currentProfessional.email ?? null) : null);

    if (nextEmail) {
      const existingUser =
        await professionalsRepository.findUserByEmail(nextEmail);

      if (existingUser && existingUser.id !== linkedUser?.userId) {
        throw new AppError(409, "EMAIL_ALREADY_EXISTS", "Email ja cadastrado.");
      }
    }

    const professionalData = {
      name: input.name,
      specialty: input.specialty,
      phone: input.phone,
      status:
        this.mapStatusToDatabase(input.status) ?? currentProfessional.status,
      email: nextEmail,
    };

    const updatedProfessional =
      nextEmail && linkedUser && nextEmail !== linkedUser.user.email
        ? await professionalsRepository.updateWithLinkedUserEmail({
            id,
            userId: linkedUser.userId,
            email: nextEmail,
            name: professionalData.name,
            specialty: professionalData.specialty,
            phone: professionalData.phone,
            status: professionalData.status,
          })
        : await professionalsRepository.update(id, professionalData);

    return toProfessionalResponse(updatedProfessional);
  }

  async remove(userId: string, id: string): Promise<void> {
    const context = await userClinicContextService.getOrThrow(userId);
    assertClinicAdmin(context);

    const professional = await professionalsRepository.findById(
      context.clinicId,
      id,
    );

    if (!professional) {
      throw new AppError(
        404,
        "RESOURCE_NOT_FOUND",
        "Profissional nao encontrado.",
      );
    }

    const [professionalsCount, linkedUsersCount] = await Promise.all([
      professionalsRepository.countAllByClinic(context.clinicId),
      professionalsRepository.countClinicUsersByProfessionalId(id),
    ]);

    if (professionalsCount <= 1) {
      throw new AppError(
        409,
        "LAST_PROFESSIONAL_REQUIRED",
        "A clinica precisa manter ao menos um profissional cadastrado.",
      );
    }

    if (linkedUsersCount > 0) {
      throw new AppError(
        409,
        "PROFESSIONAL_LINKED_TO_USER",
        "Esse profissional esta vinculado a um usuario da clinica e nao pode ser excluido.",
      );
    }

    await professionalsRepository.delete(id);
  }
}

export const professionalsService = new ProfessionalsService();
