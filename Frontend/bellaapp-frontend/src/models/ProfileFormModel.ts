import { formatCnpj, formatCpf } from "../utils/formatters";
import {
  validateCnpj,
  validateCpf,
  validatePassword,
  validatePasswordConfirmation,
} from "../utils/userValidation";
import type { UserProfile } from "../types/entities";
import type {
  ProfileFormData,
  ProfileFormFieldName,
  UpdateCurrentUserProfileInput,
} from "../types/profile";

function createFormDataFromUser(user: Nullable<UserProfile>): ProfileFormData {
  return {
    businessName: user?.businessProfile?.businessName || "",
    cnpj: formatCnpj(user?.businessProfile?.cnpj || ""),
    confirmPassword: "",
    cpf: formatCpf(user?.cpf || ""),
    email: user?.email || "",
    name: user?.name || "",
    password: "",
  };
}

export default class ProfileFormModel {
  readonly formData: ProfileFormData;

  constructor(formData: ProfileFormData) {
    this.formData = formData;
  }

  static fromUser(user: Nullable<UserProfile>): ProfileFormModel {
    return new ProfileFormModel(createFormDataFromUser(user));
  }

  withField(name: ProfileFormFieldName, value: string): ProfileFormModel {
    switch (name) {
      case "cpf":
        return new ProfileFormModel({
          ...this.formData,
          cpf: formatCpf(value),
        });
      case "cnpj":
        return new ProfileFormModel({
          ...this.formData,
          cnpj: formatCnpj(value),
        });
      case "businessName":
        return new ProfileFormModel({
          ...this.formData,
          businessName: value,
        });
      case "confirmPassword":
        return new ProfileFormModel({
          ...this.formData,
          confirmPassword: value,
        });
      case "email":
        return new ProfileFormModel({
          ...this.formData,
          email: value,
        });
      case "name":
        return new ProfileFormModel({
          ...this.formData,
          name: value,
        });
      case "password":
        return new ProfileFormModel({
          ...this.formData,
          password: value,
        });
      default:
        return this;
    }
  }

  clearPasswords(): ProfileFormModel {
    return new ProfileFormModel({
      ...this.formData,
      confirmPassword: "",
      password: "",
    });
  }

  validate(): string {
    if (!this.formData.name.trim()) {
      return "Nome é obrigatório.";
    }

    const cpfError = validateCpf(this.formData.cpf);
    if (cpfError) {
      return cpfError;
    }

    const cnpjError = validateCnpj(this.formData.cnpj);
    if (cnpjError) {
      return cnpjError;
    }

    if (this.formData.cnpj.trim() && !this.formData.businessName.trim()) {
      return "Informe o nome do negócio ao preencher o CNPJ.";
    }

    const passwordError = validatePassword(this.formData.password);
    if (passwordError) {
      return passwordError;
    }

    const confirmPasswordError = validatePasswordConfirmation(
      this.formData.password,
      this.formData.confirmPassword,
    );

    if (confirmPasswordError) {
      return confirmPasswordError;
    }

    return "";
  }

  toPayload(): UpdateCurrentUserProfileInput {
    return {
      businessName: this.formData.businessName.trim(),
      cnpj: this.formData.cnpj,
      cpf: this.formData.cpf,
      name: this.formData.name.trim(),
      password: this.formData.password,
    };
  }
}
