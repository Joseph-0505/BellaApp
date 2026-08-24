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
import { router } from "expo-router";

import { Button } from "../../components/Button";
import { Input } from "../../components/Input";

import { styles } from "../../styles/cadastro.styles";

export default function CadastroScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);
  const [errors, setErrors] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [successMessage, setSuccessMessage] = useState("");

  function handleCreateAccount() {
    const nextErrors = {
      name: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
    };
    const normalizedEmail = email.trim();
    const phoneDigits = phone.replace(/\D/g, "");

    if (!name.trim()) nextErrors.name = "Informe seu nome completo.";
    if (!normalizedEmail) {
      nextErrors.email = "Informe seu e-mail.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      nextErrors.email = "Informe um e-mail válido.";
    }
    if (phoneDigits.length < 10) {
      nextErrors.phone = "Informe um telefone válido.";
    }
    if (!password) {
      nextErrors.password = "Informe uma senha.";
    } else if (password.length < 6) {
      nextErrors.password = "A senha deve ter pelo menos 6 caracteres.";
    }
    if (!confirmPassword) {
      nextErrors.confirmPassword = "Confirme sua senha.";
    } else if (password !== confirmPassword) {
      nextErrors.confirmPassword = "As senhas não são iguais.";
    }

    setErrors(nextErrors);

    if (Object.values(nextErrors).some(Boolean)) {
      setSuccessMessage("");
      return;
    }

    setSuccessMessage("Cadastro validado com sucesso!");
  }

  function formatPhone(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 2) return digits.length ? `(${digits}` : "";
    if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length === 10) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    }
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }

  function clearFieldError(field: keyof typeof errors) {
    setErrors((current) => ({ ...current, [field]: "" }));
    setSuccessMessage("");
  }

  function handleBack() {
    router.back();
  }

  function handleLogin() {
    router.replace("/login");
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
          <Ionicons
            name="arrow-back-outline"
            size={26}
          />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>
            Criar conta
          </Text>

          <Text style={styles.subtitle}>
            Preencha seus dados para começar a usar o BellaApp
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
            label="Telefone"
            placeholder="(00) 00000-0000"
            value={phone}
            onChangeText={(value) => {
              setPhone(formatPhone(value));
              clearFieldError("phone");
            }}
            error={errors.phone}
            icon="call-outline"
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
            rightIcon={
              showPassword
                ? "eye-off-outline"
                : "eye-outline"
            }
            onPressRightIcon={() =>
              setShowPassword((current) => !current)
            }
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
              showConfirmPassword
                ? "eye-off-outline"
                : "eye-outline"
            }
            onPressRightIcon={() =>
              setShowConfirmPassword((current) => !current)
            }
          />

          {successMessage ? (
            <Text style={styles.successMessage}>{successMessage}</Text>
          ) : null}

          <Button
            title="Criar conta"
            onPress={handleCreateAccount}
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Já possui uma conta?
          </Text>

          <TouchableOpacity onPress={handleLogin}>
            <Text style={styles.loginText}>
              Entrar
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}