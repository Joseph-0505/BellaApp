import React, { useEffect, useState } from "react";

import { Ionicons } from "@expo/vector-icons";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors } from "../../global/colors";
import type { UpdateCurrentUserPayload } from "../../services/user";
import type { UserProfile } from "../../types/auth";
import {
  formatCnpj,
  formatCpf,
  isValidCnpj,
  isValidCpf,
  normalizeCnpj,
  normalizeCpf,
} from "../../utils/documents";
import { formatRequestError } from "../../utils/request-errors";
import { Button } from "../Button";
import { Input } from "../Input";
import { styles } from "./styles";

interface EditProfileModalProps {
  onClose: () => void;
  onSubmit: (payload: UpdateCurrentUserPayload) => Promise<void>;
  user: UserProfile;
  visible: boolean;
}

const initialErrors = {
  businessName: "",
  cnpj: "",
  confirmPassword: "",
  cpf: "",
  name: "",
  password: "",
};

function validatePassword(value: string) {
  if (value.length < 8) return "A senha deve ter pelo menos 8 caracteres.";
  if (value.length > 72) return "A senha deve ter no máximo 72 caracteres.";
  if (!/[a-z]/.test(value) || !/[A-Z]/.test(value) || !/\d/.test(value) || !/[^A-Za-z\d]/.test(value)) {
    return "Use maiúscula, minúscula, número e símbolo.";
  }

  return "";
}

export function EditProfileModal({ onClose, onSubmit, user, visible }: EditProfileModalProps) {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState("");
  const [cpf, setCpf] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState(initialErrors);
  const [requestError, setRequestError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!visible) return;

    setName(user.name);
    setCpf(formatCpf(user.cpf));
    setBusinessName(user.businessProfile?.businessName || "");
    setCnpj(formatCnpj(user.businessProfile?.cnpj || ""));
    setPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setShowConfirmPassword(false);
    setErrors(initialErrors);
    setRequestError("");
    setSubmitting(false);
  }, [user, visible]);

  function clearError(field: keyof typeof initialErrors) {
    setErrors((current) => ({ ...current, [field]: "" }));
    setRequestError("");
  }

  function handleClose() {
    if (!submitting) onClose();
  }

  async function handleSubmit() {
    const normalizedName = name.trim();
    const normalizedCpf = normalizeCpf(cpf);
    const normalizedBusinessName = businessName.trim();
    const normalizedCnpj = normalizeCnpj(cnpj);
    const nextErrors = { ...initialErrors };

    if (!normalizedName) nextErrors.name = "Informe seu nome completo.";
    if (!isValidCpf(normalizedCpf)) nextErrors.cpf = "Informe um CPF válido.";
    if (normalizedCnpj && !isValidCnpj(normalizedCnpj)) {
      nextErrors.cnpj = "Informe um CNPJ válido.";
    }
    if (normalizedCnpj && !normalizedBusinessName) {
      nextErrors.businessName = "Informe o nome do negócio.";
    }

    nextErrors.password = validatePassword(password);

    if (!confirmPassword) {
      nextErrors.confirmPassword = "Confirme a nova senha.";
    } else if (password !== confirmPassword) {
      nextErrors.confirmPassword = "As senhas não são iguais.";
    }

    setErrors(nextErrors);

    if (Object.values(nextErrors).some(Boolean)) return;

    setSubmitting(true);
    setRequestError("");

    try {
      await onSubmit({
        name: normalizedName,
        cpf: normalizedCpf,
        password,
        ...(user.businessProfile
          ? { businessName: normalizedBusinessName, cnpj: normalizedCnpj }
          : {}),
      });
      onClose();
    } catch (error) {
      setRequestError(formatRequestError(error, "Não foi possível atualizar seu perfil."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      animationType="slide"
      onRequestClose={handleClose}
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.overlay}
      >
        <Pressable accessibilityLabel="Fechar modal" style={styles.backdrop} onPress={handleClose} />

        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 22) }]}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <Text style={styles.eyebrow}>Minha conta</Text>
              <Text style={styles.title}>Editar perfil</Text>
            </View>
            <TouchableOpacity
              accessibilityLabel="Fechar"
              disabled={submitting}
              style={styles.closeButton}
              onPress={handleClose}
            >
              <Ionicons name="close-outline" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.form}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.description}>
              O e-mail não pode ser alterado. Para salvar, informe uma nova senha segura.
            </Text>

            <Input
              autoCapitalize="words"
              autoFocus
              error={errors.name}
              icon="person-outline"
              label="Nome completo"
              placeholder="Seu nome"
              value={name}
              onChangeText={(value) => {
                setName(value);
                clearError("name");
              }}
            />
            <Input
              autoCapitalize="none"
              editable={false}
              icon="mail-outline"
              label="E-mail"
              value={user.email}
            />
            <Input
              error={errors.cpf}
              icon="card-outline"
              keyboardType="number-pad"
              label="CPF"
              maxLength={14}
              placeholder="000.000.000-00"
              value={cpf}
              onChangeText={(value) => {
                setCpf(formatCpf(value));
                clearError("cpf");
              }}
            />

            {user.businessProfile ? (
              <>
                <Input
                  autoCapitalize="words"
                  error={errors.businessName}
                  icon="business-outline"
                  label="Nome do negócio"
                  placeholder="Nome da clínica"
                  value={businessName}
                  onChangeText={(value) => {
                    setBusinessName(value);
                    clearError("businessName");
                  }}
                />
                <Input
                  error={errors.cnpj}
                  icon="document-text-outline"
                  keyboardType="number-pad"
                  label="CNPJ (opcional)"
                  maxLength={18}
                  placeholder="00.000.000/0000-00"
                  value={cnpj}
                  onChangeText={(value) => {
                    setCnpj(formatCnpj(value));
                    clearError("cnpj");
                  }}
                />
              </>
            ) : null}

            <Input
              error={errors.password}
              icon="lock-closed-outline"
              label="Nova senha"
              placeholder="Mínimo de 8 caracteres"
              rightIcon={showPassword ? "eye-off-outline" : "eye-outline"}
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={(value) => {
                setPassword(value);
                clearError("password");
              }}
              onPressRightIcon={() => setShowPassword((current) => !current)}
            />
            <Input
              error={errors.confirmPassword}
              icon="shield-checkmark-outline"
              label="Confirmar nova senha"
              placeholder="Digite a senha novamente"
              returnKeyType="done"
              rightIcon={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
              secureTextEntry={!showConfirmPassword}
              value={confirmPassword}
              onChangeText={(value) => {
                setConfirmPassword(value);
                clearError("confirmPassword");
              }}
              onPressRightIcon={() => setShowConfirmPassword((current) => !current)}
              onSubmitEditing={() => void handleSubmit()}
            />

            {requestError ? <Text style={styles.requestError}>{requestError}</Text> : null}

            <Button
              disabled={submitting}
              loading={submitting}
              title="Salvar alterações"
              onPress={() => void handleSubmit()}
            />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
