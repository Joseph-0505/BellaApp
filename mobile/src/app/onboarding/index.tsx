import React, { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Redirect, router } from "expo-router";
import {
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
import { colors } from "../../global/colors";
import { useAuth } from "../../hooks/useAuth";
import { styles } from "../../styles/onboarding.styles";

const DEFAULT_SCHEDULE = {
  mondayToFriday: { start: "08:00", end: "18:00" },
  saturday: { start: "08:00", end: "12:00" },
  sunday: { closed: true },
};

const completionItems = [
  "Nome da clinica aplicado ao painel",
  "Profissional inicial vinculado a sua conta",
  "Agenda padrao das 08h as 18h para comecar a operar",
  "Checklist progressiva no dashboard para servicos, clientes e agendamentos",
];

const nextItems = [
  "Criar o primeiro servico",
  "Cadastrar o primeiro cliente",
  "Montar o primeiro agendamento",
];

export default function OnboardingScreen() {
  const {
    bootstrapping,
    completeInitialOnboarding,
    isAuthenticated,
    onboarding,
    onboardingLoading,
    signOut,
    user,
  } = useAuth();
  const [businessName, setBusinessName] = useState("");
  const [requestError, setRequestError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const defaultSchedule = onboarding?.defaultSchedule || DEFAULT_SCHEDULE;
  const displayName = user?.name || "sua conta";

  useEffect(() => {
    const initialBusinessName =
      onboarding?.businessName || user?.businessProfile?.businessName || "";

    setBusinessName((current) => current || initialBusinessName);
  }, [onboarding?.businessName, user?.businessProfile?.businessName]);

  async function handleFinish() {
    if (!businessName.trim() || submitting) {
      if (!businessName.trim()) {
        setRequestError("Informe o nome da clinica para continuar.");
      }

      return;
    }

    setSubmitting(true);
    setRequestError("");

    try {
      await completeInitialOnboarding({
        businessName,
      });

      router.replace("/home");
    } catch (requestError) {
      setRequestError(
        requestError instanceof Error
          ? requestError.message
          : "Nao foi possivel concluir a configuracao inicial.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSignOut() {
    await signOut();
    router.replace("/login");
  }

  if (bootstrapping || onboardingLoading) {
    return <ScreenLoader message="Carregando configuracao inicial..." />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  if (onboarding?.completed) {
    return <Redirect href="/home" />;
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
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.topBarButton}
            onPress={() => {
              void handleSignOut();
            }}
          >
            <Text style={styles.topBarButtonText}>Trocar conta</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.brandPanel}>
          <Text style={styles.chip}>Configuracao inicial</Text>
          <Text style={styles.heroTitle}>
            Vamos colocar sua clinica no ar em menos de um minuto.
          </Text>
          <Text style={styles.heroDescription}>
            Oi, {displayName}. Defina so o nome da clinica agora. O restante do
            setup segue dentro do dashboard com uma checklist guiada.
          </Text>

          <View style={styles.featureList}>
            <View style={styles.featureCard}>
              <View style={styles.featureIcon}>
                <Ionicons
                  name="sparkles-outline"
                  size={18}
                  color={colors.primaryDark}
                />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Setup minimo</Text>
                <Text style={styles.featureDescription}>
                  Um unico passo para liberar o produto rapidamente.
                </Text>
              </View>
            </View>

            <View style={styles.featureCard}>
              <View style={styles.featureIcon}>
                <Ionicons
                  name="time-outline"
                  size={18}
                  color={colors.primaryDark}
                />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Agenda base</Text>
                <Text style={styles.featureDescription}>
                  Seg a sex {defaultSchedule.mondayToFriday.start} -{" "}
                  {defaultSchedule.mondayToFriday.end}, sab{" "}
                  {defaultSchedule.saturday.start} -{" "}
                  {defaultSchedule.saturday.end}.
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryCardTitle}>
              O que fica pronto ao finalizar
            </Text>
            <View style={styles.bulletList}>
              {completionItems.map((item) => (
                <View key={item} style={styles.bulletRow}>
                  <View style={styles.bulletDot} />
                  <Text style={styles.bulletText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.formCard}>
          <View style={styles.progressPill}>
            <Text style={styles.progressIndex}>1</Text>
            <Text style={styles.progressText}>Nome da clinica</Text>
          </View>

          <Text style={styles.eyebrow}>Passo unico</Text>
          <Text style={styles.title}>
            Como sua clinica deve aparecer no sistema?
          </Text>
          <Text style={styles.description}>
            Use o nome principal do negocio. Voce pode continuar os cadastros
            essenciais direto do dashboard.
          </Text>

          <Input
            label="Nome da clinica"
            placeholder="Ex: Bella Estetica"
            value={businessName}
            onChangeText={(value) => {
              setBusinessName(value);
              setRequestError("");
            }}
            icon="business-outline"
            autoCapitalize="words"
            maxLength={80}
          />

          {requestError ? (
            <Text style={styles.errorMessage}>{requestError}</Text>
          ) : null}

          <View style={styles.helperCard}>
            <Text style={styles.helperTitle}>Depois voce podera:</Text>
            <View style={styles.bulletList}>
              {nextItems.map((item) => (
                <View key={item} style={styles.bulletRow}>
                  <View style={styles.bulletDot} />
                  <Text style={styles.bulletText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>

          <Button
            title="Ir para a home"
            onPress={handleFinish}
            loading={submitting}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
