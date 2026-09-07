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
import type { CreateProfessionalPayload } from "../../services/professionals";
import { formatRequestError } from "../../utils/request-errors";
import { formatPhone, normalizePhone } from "../../utils/phone";
import { Button } from "../Button";
import { Input } from "../Input";
import { styles } from "./styles";

interface NewProfessionalModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateProfessionalPayload) => Promise<void>;
}

const initialErrors = {
  name: "",
  specialty: "",
  phone: "",
  email: "",
};

export function NewProfessionalModal({
  visible,
  onClose,
  onSubmit,
}: NewProfessionalModalProps) {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState(initialErrors);
  const [requestError, setRequestError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!visible) {
      return;
    }

    setName("");
    setSpecialty("");
    setPhone("");
    setEmail("");
    setErrors(initialErrors);
    setRequestError("");
    setSubmitting(false);
  }, [visible]);

  function clearError(field: keyof typeof initialErrors) {
    setErrors((current) => ({ ...current, [field]: "" }));
    setRequestError("");
  }

  function handleClose() {
    if (!submitting) {
      onClose();
    }
  }

  async function handleSubmit() {
    const normalizedName = name.trim();
    const normalizedSpecialty = specialty.trim();
    const normalizedPhone = normalizePhone(phone);
    const normalizedEmail = email.trim().toLowerCase();
    const nextErrors = { ...initialErrors };

    if (!normalizedName) {
      nextErrors.name = "Informe o nome do profissional.";
    }

    if (!normalizedSpecialty) {
      nextErrors.specialty = "Informe a especialidade.";
    }

    if (normalizedPhone.length < 10) {
      nextErrors.phone = "Informe um telefone válido com DDD.";
    }

    if (normalizedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      nextErrors.email = "Informe um e-mail válido.";
    }

    setErrors(nextErrors);

    if (Object.values(nextErrors).some(Boolean)) {
      return;
    }

    setSubmitting(true);
    setRequestError("");

    try {
      await onSubmit({
        name: normalizedName,
        specialty: normalizedSpecialty,
        phone: normalizedPhone,
        status: "ativo",
        ...(normalizedEmail ? { email: normalizedEmail } : {}),
      });
      onClose();
    } catch (error) {
      setRequestError(formatRequestError(error, "Não foi possível cadastrar o profissional."));
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
              <Text style={styles.eyebrow}>Equipe</Text>
              <Text style={styles.title}>Novo profissional</Text>
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
            bounces={false}
            contentContainerStyle={styles.form}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.description}>
              Cadastre os dados essenciais do profissional. O perfil será criado como ativo.
            </Text>

            <Input
              autoCapitalize="words"
              autoFocus
              error={errors.name}
              icon="person-outline"
              label="Nome completo"
              placeholder="Nome do profissional"
              returnKeyType="next"
              value={name}
              onChangeText={(value) => {
                setName(value);
                clearError("name");
              }}
            />

            <Input
              autoCapitalize="sentences"
              error={errors.specialty}
              icon="briefcase-outline"
              label="Especialidade"
              placeholder="Ex: Esteticista"
              returnKeyType="next"
              value={specialty}
              onChangeText={(value) => {
                setSpecialty(value);
                clearError("specialty");
              }}
            />

            <Input
              error={errors.phone}
              icon="call-outline"
              keyboardType="phone-pad"
              label="Telefone"
              placeholder="(00) 00000-0000"
              value={phone}
              onChangeText={(value) => {
                setPhone(formatPhone(value));
                clearError("phone");
              }}
            />

            <Input
              autoCapitalize="none"
              autoCorrect={false}
              error={errors.email}
              icon="mail-outline"
              keyboardType="email-address"
              label="E-mail (opcional)"
              placeholder="profissional@email.com"
              returnKeyType="done"
              value={email}
              onChangeText={(value) => {
                setEmail(value);
                clearError("email");
              }}
              onSubmitEditing={() => void handleSubmit()}
            />

            {requestError ? <Text style={styles.requestError}>{requestError}</Text> : null}

            <Button
              disabled={submitting}
              loading={submitting}
              title="Cadastrar profissional"
              onPress={() => void handleSubmit()}
            />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
