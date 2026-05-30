import bcrypt from "bcrypt";
import { AppError } from "../../shared/errors/app-error";
import { toUserResponse } from "../../shared/mappers/user-response";
import { normalizeNumericString } from "../../shared/utils/documents";
import {
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
}

export const usersService = new UsersService();
