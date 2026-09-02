import React, { useEffect, useState } from "react";
import { Redirect, router, useLocalSearchParams } from "expo-router";

import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { ScreenLoader } from "../../components/ScreenLoader";
import { useAuth } from "../../hooks/useAuth";
import { styles } from "../../styles/login.styles";
import { formatRequestError } from "../../utils/request-errors";
import { getAuthenticatedEntryRoute } from "../../utils/routes";

export default function LoginScreen() {
  const { email: registeredEmail } = useLocalSearchParams<{ email?: string }>();
  const {
    bootstrapping,
    isAuthenticated,
    onboarding,
    onboardingLoading,
    signIn,
  } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({ email: "", password: "" });
  const [requestError, setRequestError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (typeof registeredEmail === "string") {
      setEmail(registeredEmail);
    }
  }, [registeredEmail]);

  async function handleLogin() {
    const nextErrors = { email: "", password: "" };
    const normalizedEmail = email.trim();

    if (!normalizedEmail) {
      nextErrors.email = "Informe seu e-mail.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      nextErrors.email = "Informe um e-mail valido.";
    }

    if (!password) {
      nextErrors.password = "Informe sua senha.";
    } else if (password.length < 6) {
      nextErrors.password = "A senha deve ter pelo menos 6 caracteres.";
    }

    setErrors(nextErrors);

    if (nextErrors.email || nextErrors.password) {
      return;
    }

    setSubmitting(true);
    setRequestError("");

    try {
      const nextOnboarding = await signIn({
        email: normalizedEmail,
        password,
      });

      router.replace(getAuthenticatedEntryRoute(nextOnboarding?.completed));
    } catch (requestError) {
      setRequestError(
        formatRequestError(requestError, "Nao foi possivel fazer login."),
      );
    } finally {
      setSubmitting(false);
    }
  }

  function handleForgotPassword() {
    Alert.alert(
      "BellaApp",
      "O fluxo de recuperacao de senha ainda nao foi conectado no mobile.",
    );
  }

  function handleCreateAccount() {
    router.push("/cadastro");
  }

  if (bootstrapping || onboardingLoading) {
    return <ScreenLoader message="Carregando sua sessao..." />;
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
      >
        <View style={styles.header}>
          <Image
            source={require("../../assets/logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />

          <Text style={styles.title}>Bem-vinda ao BellaApp</Text>

          <Text style={styles.subtitle}>
            Gerencie seus clientes e agendamentos em um so lugar
          </Text>
        </View>

        <View style={styles.form}>
          <Input
            label="E-mail"
            placeholder="Digite seu e-mail"
            value={email}
            onChangeText={(value) => {
              setEmail(value);
              setErrors((current) => ({ ...current, email: "" }));
              setRequestError("");
            }}
            error={errors.email}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            icon="mail-outline"
          />

          <Input
            label="Senha"
            placeholder="Digite sua senha"
            value={password}
            onChangeText={(value) => {
              setPassword(value);
              setErrors((current) => ({ ...current, password: "" }));
              setRequestError("");
            }}
            error={errors.password}
            secureTextEntry={!showPassword}
            icon="lock-closed-outline"
            rightIcon={showPassword ? "eye-off-outline" : "eye-outline"}
            onPressRightIcon={() => setShowPassword((current) => !current)}
          />

          {requestError ? (
            <Text style={styles.errorMessage}>{requestError}</Text>
          ) : null}

          <TouchableOpacity
            style={styles.forgotContainer}
            onPress={handleForgotPassword}
          >
            <Text style={styles.forgot}>Esqueci minha senha</Text>
          </TouchableOpacity>

          <Button title="Entrar" onPress={handleLogin} loading={submitting} />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Ainda nao possui conta?</Text>

          <TouchableOpacity onPress={handleCreateAccount}>
            <Text style={styles.createAccount}>Criar conta</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
