import { ClinicUserRole } from "@prisma/client";
import bcrypt from "bcrypt";
import { AppError } from "../../shared/errors/app-error";
import { toUserResponse } from "../../shared/mappers/user-response";
import {
  assertStoredProfileImageIsValid,
  removeStoredProfileImage,
  type UploadedProfileImage,
} from "../../shared/uploads/profile-image";
import { normalizeNumericString } from "../../shared/utils/documents";
import {
  DeleteCurrentUserRequestDto,
  GetCurrentUserResponseDto,
  UpdateCurrentUserRequestDto,
  UpdateCurrentUserResponseDto,
} from "./users.dtos";
import { usersRepository } from "./users.repository";

class UsersService {
  async getCurrentUser(userId: string): Promise<GetCurrentUserResponseDto> {
    const user = await usersRepository.findById(userId);

    if (!user) {
      throw new AppError(404, "RESOURCE_NOT_FOUND", "Usuário não encontrado.");
    }

    return toUserResponse(user);
  }

  async updateCurrentUser(
    userId: string,
    input: UpdateCurrentUserRequestDto,
  ): Promise<UpdateCurrentUserResponseDto> {
    const currentUser = await usersRepository.findById(userId);

    if (!currentUser) {
      throw new AppError(404, "RESOURCE_NOT_FOUND", "Usuário não encontrado.");
    }

    const cpf = normalizeNumericString(input.cpf);
    const cnpj = input.cnpj ? normalizeNumericString(input.cnpj) : undefined;

    if (
      input.businessName
      && currentUser.clinicUsers?.[0]?.role === ClinicUserRole.PROFESSIONAL
    ) {
      throw new AppError(
        403,
        "FORBIDDEN",
        "Apenas administradores podem alterar os dados do negócio.",
      );
    }

    if (cpf !== currentUser.cpf) {
      const anotherUser = await usersRepository.findByCpf(cpf);

      if (anotherUser && anotherUser.id !== userId) {
        throw new AppError(409, "CPF_ALREADY_EXISTS", "CPF já cadastrado.");
      }
    }

    if (cnpj) {
      const businessProfile = await usersRepository.findBusinessProfileByCnpj(cnpj);

      if (businessProfile && businessProfile.userId !== userId) {
        throw new AppError(409, "CNPJ_ALREADY_EXISTS", "CNPJ já cadastrado.");
      }
    }

    const passwordHash = await bcrypt.hash(input.password, 10);

    const updatePayload = {
      userId,
      name: input.name,
      cpf,
      passwordHash,
      ...(input.businessName
        ? {
          businessProfile: {
            businessName: input.businessName,
            cnpj: cnpj ?? null,
          },
        }
        : {}),
    };

    const updatedUser = await usersRepository.updateCurrentUser(updatePayload);

    return toUserResponse(updatedUser);
  }

  async updateCurrentUserAvatar(
    userId: string,
    file: UploadedProfileImage,
  ): Promise<UpdateCurrentUserResponseDto> {
    try {
      await assertStoredProfileImageIsValid(file);
      const currentUser = await usersRepository.findById(userId);

      if (!currentUser) {
        throw new AppError(404, "RESOURCE_NOT_FOUND", "Usuário não encontrado.");
      }

      const updatedUser = await usersRepository.updateAvatarFileName(userId, file.filename);

      await removeStoredProfileImage(currentUser.avatarFileName);
      return toUserResponse(updatedUser);
    } catch (error) {
      await removeStoredProfileImage(file.filename);
      throw error;
    }
  }

  async removeCurrentUserAvatar(userId: string): Promise<UpdateCurrentUserResponseDto> {
    const currentUser = await usersRepository.findById(userId);

    if (!currentUser) {
      throw new AppError(404, "RESOURCE_NOT_FOUND", "Usuário não encontrado.");
    }

    if (!currentUser.avatarFileName) {
      return toUserResponse(currentUser);
    }

    const updatedUser = await usersRepository.updateAvatarFileName(userId, null);
    await removeStoredProfileImage(currentUser.avatarFileName);

    return toUserResponse(updatedUser);
  }

  async deleteCurrentUser(
    userId: string,
    input: DeleteCurrentUserRequestDto,
  ): Promise<void> {
    const currentUser = await usersRepository.findById(userId);

    if (!currentUser) {
      throw new AppError(404, "RESOURCE_NOT_FOUND", "Usuário não encontrado.");
    }

    if (!currentUser.passwordHash) {
      throw new AppError(409, "ACCOUNT_NOT_ACTIVATED", "A conta ainda não possui senha ativa.");
    }

    const passwordMatches = await bcrypt.compare(input.password, currentUser.passwordHash);

    if (!passwordMatches) {
      throw new AppError(401, "INVALID_CREDENTIALS", "Senha atual incorreta.");
    }

    const membership = currentUser.clinicUsers[0] ?? null;

    if (!membership) {
      await usersRepository.deleteUser(userId);
      await removeStoredProfileImage(currentUser.avatarFileName);
      return;
    }

    if (membership.role === ClinicUserRole.ADMIN) {
      const otherMembers = await usersRepository.countOtherClinicMembers(
        membership.clinicId,
        userId,
      );

      if (otherMembers > 0) {
        throw new AppError(
          409,
          "ADMIN_TRANSFER_REQUIRED",
          "Remova os demais usuários ou transfira a administração antes de excluir sua conta.",
        );
      }

      await usersRepository.deleteSoleAdminAccount(userId, membership.clinicId);
    } else {
      const clinicAdmin = await usersRepository.findClinicAdmin(
        membership.clinicId,
        userId,
      );

      if (!clinicAdmin) {
        throw new AppError(
          409,
          "CLINIC_ADMIN_REQUIRED",
          "A clínica precisa ter um administrador antes desta conta ser excluída.",
        );
      }

      await usersRepository.deleteProfessionalAccount(userId, clinicAdmin.userId);
    }

    await removeStoredProfileImage(currentUser.avatarFileName);
  }
}

export const usersService = new UsersService();
