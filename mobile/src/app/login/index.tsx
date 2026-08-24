import React, { useState } from "react";
import { router } from "expo-router";

import {
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
import { styles } from "../../styles/login.styles";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({ email: "", password: "" });
  const [successMessage, setSuccessMessage] = useState("");

  function handleLogin() {
    const nextErrors = { email: "", password: "" };
    const normalizedEmail = email.trim();

    if (!normalizedEmail) {
      nextErrors.email = "Informe seu e-mail.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      nextErrors.email = "Informe um e-mail válido.";
    }

    if (!password) {
      nextErrors.password = "Informe sua senha.";
    } else if (password.length < 6) {
      nextErrors.password = "A senha deve ter pelo menos 6 caracteres.";
    }

    setErrors(nextErrors);

    if (nextErrors.email || nextErrors.password) {
      setSuccessMessage("");
      return;
    }

    setSuccessMessage("Dados válidos. Login pronto para ser conectado ao backend.");
  }

  function handleForgotPassword() {
    console.log("Esqueci minha senha");
  }

  function handleCreateAccount() {
    router.push("/cadastro"); 
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
            Gerencie seus clientes e agendamentos em um só lugar
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
              setSuccessMessage("");
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
              setSuccessMessage("");
            }}
            error={errors.password}
            secureTextEntry={!showPassword}
            icon="lock-closed-outline"
            rightIcon={showPassword ? "eye-off-outline" : "eye-outline"}
            onPressRightIcon={() => setShowPassword(!showPassword)}
          />
          {successMessage ? (
            <Text style={styles.successMessage}>{successMessage}</Text>
          ) : null}
          <TouchableOpacity
            style={styles.forgotContainer}
            onPress={handleForgotPassword}
          >
            <Text style={styles.forgot}>Esqueci minha senha</Text>
          </TouchableOpacity>

          <Button title="Entrar" onPress={handleLogin} />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Ainda não possui conta?</Text>

          <TouchableOpacity onPress={handleCreateAccount}>
            <Text style={styles.createAccount}>Criar conta</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
