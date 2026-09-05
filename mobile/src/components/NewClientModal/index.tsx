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

import type { CreateClientPayload } from "../../services/clients";
import { Button } from "../Button";
import { Input } from "../Input";
import { colors } from "../../global/colors";
import { formatRequestError } from "../../utils/request-errors";
import { styles } from "./styles";

interface NewClientModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateClientPayload) => Promise<void>;
}

const initialErrors = {
  name: "",
  phone: "",
  email: "",
};

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);

  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function NewClientModal({ visible, onClose, onSubmit }: NewClientModalProps) {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState("");
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
    const normalizedPhone = phone.replace(/\D/g, "");
    const normalizedEmail = email.trim().toLowerCase();
    const nextErrors = { ...initialErrors };

    if (!normalizedName) {
      nextErrors.name = "Informe o nome do cliente.";
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
        phone: normalizedPhone,
        ...(normalizedEmail ? { email: normalizedEmail } : {}),
      });
      onClose();
    } catch (error) {
      setRequestError(formatRequestError(error, "Não foi possível cadastrar o cliente."));
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
              <Text style={styles.eyebrow}>Cadastro rápido</Text>
              <Text style={styles.title}>Novo cliente</Text>
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
              Preencha os dados essenciais. Você poderá completar o perfil depois.
            </Text>

            <Input
              autoCapitalize="words"
              autoFocus
              error={errors.name}
              icon="person-outline"
              label="Nome completo"
              placeholder="Nome do cliente"
              returnKeyType="next"
              value={name}
              onChangeText={(value) => {
                setName(value);
                clearError("name");
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
              placeholder="cliente@email.com"
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
              title="Cadastrar cliente"
              onPress={() => void handleSubmit()}
            />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
