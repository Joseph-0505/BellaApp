import React, { useState } from "react";

import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { Redirect, router } from "expo-router";

import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { ScreenLoader } from "../../components/ScreenLoader";
import { useAuth } from "../../hooks/useAuth";
import { register } from "../../services/auth";

import { styles } from "../../styles/cadastro.styles";
import { formatCpf, isValidCpf, normalizeCpf } from "../../utils/documents";
import { formatRequestError } from "../../utils/request-errors";
import { getAuthenticatedEntryRoute } from "../../utils/routes";

export default function CadastroScreen() {
  const {
    bootstrapping,
    isAuthenticated,
    onboarding,
    onboardingLoading,
  } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({
    name: "",
    email: "",
    cpf: "",
    password: "",
    confirmPassword: "",
  });
  const [requestError, setRequestError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function validatePassword(value: string) {
    if (!value) {
      return "Informe uma senha.";
    }

    if (value.length < 8) {
      return "A senha deve ter pelo menos 8 caracteres.";
    }

    if (
      !/[a-z]/.test(value)
      || !/[A-Z]/.test(value)
      || !/\d/.test(value)
      || !/[^A-Za-z\d]/.test(value)
    ) {
      return "Use maiuscula, minuscula, número e símbolo.";
    }

    return "";
  }

  async function handleCreateAccount() {
    const nextErrors = {
      name: "",
      email: "",
      cpf: "",
      password: "",
      confirmPassword: "",
    };
    const normalizedEmail = email.trim();
    const normalizedCpf = normalizeCpf(cpf);

    if (!name.trim()) {
      nextErrors.name = "Informe seu nome completo.";
    }

    if (!normalizedEmail) {
      nextErrors.email = "Informe seu e-mail.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      nextErrors.email = "Informe um e-mail válido.";
    }

    if (!isValidCpf(normalizedCpf)) {
      nextErrors.cpf = "Informe um CPF válido.";
    }

    nextErrors.password = validatePassword(password);

    if (!confirmPassword) {
      nextErrors.confirmPassword = "Confirme sua senha.";
    } else if (password !== confirmPassword) {
      nextErrors.confirmPassword = "As senhas não são iguais.";
    }

    setErrors(nextErrors);

    if (Object.values(nextErrors).some(Boolean)) {
      return;
    }

    setSubmitting(true);
    setRequestError("");

    try {
      await register({
        name: name.trim(),
        email: normalizedEmail,
        cpf: normalizedCpf,
        password,
      });
    } catch (requestError) {
      setRequestError(
        formatRequestError(
          requestError,
          "Não foi possível criar sua conta.",
        ),
      );
      setSubmitting(false);
      return;
    }

    router.replace({
      pathname: "/login",
      params: { email: normalizedEmail },
    });
  }

  function clearFieldError(field: keyof typeof errors) {
    setErrors((current) => ({ ...current, [field]: "" }));
    setRequestError("");
  }

  function handleBack() {
    router.back();
  }

  function handleLogin() {
    router.replace("/login");
  }

  if (bootstrapping || onboardingLoading) {
    return <ScreenLoader message="Carregando..." />;
  }

  if (isAuthenticated) {
    return <Redirect href={getAuthenticatedEntryRoute(onboarding?.completed)} />;
  }

  return (
    <KeyboardAvoidingView
      style={styles.keyboard}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back-outline" size={26} />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>Criar conta</Text>

          <Text style={styles.subtitle}>
            Crie sua conta e siga para a configuração inicial da clinica
          </Text>
        </View>

        <View style={styles.form}>
          <Input
            label="Nome completo"
            placeholder="Digite seu nome"
            value={name}
            onChangeText={(value) => {
              setName(value);
              clearFieldError("name");
            }}
            error={errors.name}
            icon="person-outline"
            autoCapitalize="words"
          />

          <Input
            label="E-mail"
            placeholder="Digite seu e-mail"
            value={email}
            onChangeText={(value) => {
              setEmail(value);
              clearFieldError("email");
            }}
            error={errors.email}
            icon="mail-outline"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Input
            label="CPF"
            placeholder="000.000.000-00"
            value={cpf}
            onChangeText={(value) => {
              setCpf(formatCpf(value));
              clearFieldError("cpf");
            }}
            error={errors.cpf}
            icon="card-outline"
            keyboardType="numeric"
          />


          <Input
            label="Senha"
            placeholder="Digite sua senha"
            value={password}
            onChangeText={(value) => {
              setPassword(value);
              clearFieldError("password");
            }}
            error={errors.password}
            icon="lock-closed-outline"
            secureTextEntry={!showPassword}
            rightIcon={showPassword ? "eye-off-outline" : "eye-outline"}
            onPressRightIcon={() => setShowPassword((current) => !current)}
          />

          <Input
            label="Confirmar senha"
            placeholder="Digite sua senha novamente"
            value={confirmPassword}
            onChangeText={(value) => {
              setConfirmPassword(value);
              clearFieldError("confirmPassword");
            }}
            error={errors.confirmPassword}
            icon="lock-closed-outline"
            secureTextEntry={!showConfirmPassword}
            rightIcon={
              showConfirmPassword ? "eye-off-outline" : "eye-outline"
            }
            onPressRightIcon={() =>
              setShowConfirmPassword((current) => !current)
            }
          />

          {requestError ? (
            <Text style={styles.errorMessage}>{requestError}</Text>
          ) : null}

          <Button
            title="Criar conta"
            onPress={handleCreateAccount}
            loading={submitting}
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Ja possui uma conta?</Text>

          <TouchableOpacity onPress={handleLogin}>
            <Text style={styles.loginText}>Entrar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
