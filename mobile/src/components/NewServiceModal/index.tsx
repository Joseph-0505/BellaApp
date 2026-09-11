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
import type { CreateServicePayload } from "../../services/services";
import { formatRequestError } from "../../utils/request-errors";
import { Button } from "../Button";
import { Input } from "../Input";
import { styles } from "./styles";

import type { ServiceProfile } from "../../types/service";

interface NewServiceModalProps {
  service?: ServiceProfile | null;
  visible: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateServicePayload) => Promise<void>;
}

const initialErrors = {
  name: "",
  price: "",
  duration: "",
};

function formatPrice(value: string) {
  const digits = value.replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  return new Intl.NumberFormat("pt-BR", {
    currency: "BRL",
    style: "currency",
  }).format(Number(digits) / 100);
}

function parsePrice(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits ? Number(digits) / 100 : 0;
}

export function NewServiceModal({ visible, onClose, onSubmit, service }: NewServiceModalProps) {
  const insets = useSafeAreaInsets();
  const [active, setActive] = useState(true);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("60");
  const [errors, setErrors] = useState(initialErrors);
  const [requestError, setRequestError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!visible) {
      return;
    }

    setActive(service?.active ?? true);
    setName(service?.name || "");
    setPrice(service ? formatPrice(String(Math.round(service.price * 100))) : "");
    setDuration(String(service?.durationMinutes || 60));
    setErrors(initialErrors);
    setRequestError("");
    setSubmitting(false);
  }, [visible, service]);

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
    const normalizedPrice = parsePrice(price);
    const normalizedDuration = Number(duration);
    const nextErrors = { ...initialErrors };

    if (!normalizedName) {
      nextErrors.name = "Informe o nome do serviço.";
    }

    if (normalizedPrice <= 0) {
      nextErrors.price = "Informe um preço maior que zero.";
    }

    if (!Number.isInteger(normalizedDuration) || normalizedDuration <= 0) {
      nextErrors.duration = "Informe uma duração válida.";
    }

    setErrors(nextErrors);

    if (Object.values(nextErrors).some(Boolean)) {
      return;
    }

    setSubmitting(true);
    setRequestError("");

    try {
      await onSubmit({
        active,
        description: service?.description || undefined,
        icon: service?.icon,
        durationMinutes: normalizedDuration,
        name: normalizedName,
        price: normalizedPrice,
        risk: service?.risk || "baixo",
      });
      onClose();
    } catch (error) {
      setRequestError(formatRequestError(error, "Não foi possível cadastrar o serviço."));
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
              <Text style={styles.eyebrow}>Catálogo</Text>
              <Text style={styles.title}>{service ? "Editar serviço" : "Novo serviço"}</Text>
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
              Informe os dados essenciais. O serviço será criado como ativo e de baixo risco.
            </Text>

            <Input
              autoCapitalize="sentences"
              autoFocus
              error={errors.name}
              icon="sparkles-outline"
              label="Nome do serviço"
              placeholder="Ex: Limpeza de pele"
              returnKeyType="next"
              value={name}
              onChangeText={(value) => {
                setName(value);
                clearError("name");
              }}
            />

            <Input
              error={errors.price}
              icon="cash-outline"
              keyboardType="number-pad"
              label="Preço"
              placeholder="R$ 0,00"
              value={price}
              onChangeText={(value) => {
                setPrice(formatPrice(value));
                clearError("price");
              }}
            />

            <Input
              error={errors.duration}
              icon="time-outline"
              keyboardType="number-pad"
              label="Duração em minutos"
              maxLength={3}
              placeholder="60"
              returnKeyType="done"
              value={duration}
              onChangeText={(value) => {
                setDuration(value.replace(/\D/g, ""));
                clearError("duration");
              }}
              onSubmitEditing={() => void handleSubmit()}
            />

            <TouchableOpacity accessibilityRole="switch" accessibilityState={{ checked: active }} onPress={() => setActive(value => !value)}><Text style={styles.description}>{active ? "✓ Serviço ativo" : "Serviço inativo"} — toque para alterar</Text></TouchableOpacity>
            {requestError ? <Text style={styles.requestError}>{requestError}</Text> : null}

            <Button
              disabled={submitting}
              loading={submitting}
              title={service ? "Salvar alterações" : "Cadastrar serviço"}
              onPress={() => void handleSubmit()}
            />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
