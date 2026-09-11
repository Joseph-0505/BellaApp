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
import type { DeleteCurrentUserPayload } from "../../services/user";
import { formatRequestError } from "../../utils/request-errors";
import { Button } from "../Button";
import { Input } from "../Input";
import { styles } from "./styles";

interface DeleteAccountModalProps {
  isAdmin: boolean;
  onClose: () => void;
  onSubmit: (payload: DeleteCurrentUserPayload) => Promise<void>;
  visible: boolean;
}

export function DeleteAccountModal({
  isAdmin,
  onClose,
  onSubmit,
  visible,
}: DeleteAccountModalProps) {
  const insets = useSafeAreaInsets();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [confirmationError, setConfirmationError] = useState("");
  const [requestError, setRequestError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!visible) return;

    setPassword("");
    setConfirmation("");
    setShowPassword(false);
    setPasswordError("");
    setConfirmationError("");
    setRequestError("");
    setSubmitting(false);
  }, [visible]);

  function handleClose() {
    if (!submitting) onClose();
  }

  async function handleSubmit() {
    const nextPasswordError = password ? "" : "Informe sua senha atual.";
    const nextConfirmationError = confirmation === "EXCLUIR"
      ? ""
      : "Digite EXCLUIR para confirmar.";

    setPasswordError(nextPasswordError);
    setConfirmationError(nextConfirmationError);

    if (nextPasswordError || nextConfirmationError) return;

    setSubmitting(true);
    setRequestError("");

    try {
      await onSubmit({ confirmation: "EXCLUIR", password });
    } catch (error) {
      setRequestError(formatRequestError(error, "Não foi possível excluir sua conta."));
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
            <View style={styles.dangerIcon}>
              <Ionicons name="warning-outline" size={24} color={colors.error} />
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
            <Text style={styles.eyebrow}>Zona de perigo</Text>
            <Text style={styles.title}>Excluir minha conta</Text>
            <Text style={styles.description}>
              {isAdmin
                ? "Essa ação remove sua conta e, se você for o único usuário, todos os dados da clínica. Contas com equipe exigem transferência ou remoção dos demais acessos."
                : "Essa ação remove permanentemente seu acesso. Os registros históricos da clínica serão preservados com o administrador."}
            </Text>

            <View style={styles.notice}>
              <Ionicons name="information-circle-outline" size={19} color={colors.error} />
              <Text style={styles.noticeText}>Esta ação não pode ser desfeita.</Text>
            </View>

            <Input
              autoCapitalize="none"
              error={passwordError}
              icon="lock-closed-outline"
              label="Senha atual"
              placeholder="Digite sua senha"
              rightIcon={showPassword ? "eye-off-outline" : "eye-outline"}
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={(value) => {
                setPassword(value);
                setPasswordError("");
                setRequestError("");
              }}
              onPressRightIcon={() => setShowPassword((current) => !current)}
            />

            <Input
              autoCapitalize="characters"
              autoCorrect={false}
              error={confirmationError}
              icon="trash-outline"
              label="Confirmação"
              placeholder="Digite EXCLUIR"
              returnKeyType="done"
              value={confirmation}
              onChangeText={(value) => {
                setConfirmation(value.toUpperCase());
                setConfirmationError("");
                setRequestError("");
              }}
              onSubmitEditing={() => void handleSubmit()}
            />

            {requestError ? <Text style={styles.requestError}>{requestError}</Text> : null}

            <Button
              disabled={submitting}
              loading={submitting}
              title="Excluir permanentemente"
              variant="danger"
              onPress={() => void handleSubmit()}
            />
            <TouchableOpacity disabled={submitting} style={styles.cancelButton} onPress={handleClose}>
              <Text style={styles.cancelText}>Manter minha conta</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
