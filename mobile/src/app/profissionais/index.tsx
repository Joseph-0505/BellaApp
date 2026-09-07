import React, { useCallback, useEffect, useRef, useState } from "react";

import { Ionicons } from "@expo/vector-icons";
import { Redirect } from "expo-router";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Input } from "../../components/Input";
import { NewProfessionalModal } from "../../components/NewProfessionalModal";
import { ProfessionalCard } from "../../components/ProfessionalCard";
import { ProfessionalDetailsModal } from "../../components/ProfessionalDetailsModal";
import { ScreenLoader } from "../../components/ScreenLoader";
import { colors } from "../../global/colors";
import { useAuth } from "../../hooks/useAuth";
import {
  createProfessional,
  listProfessionals,
  type CreateProfessionalPayload,
} from "../../services/professionals";
import { styles } from "../../styles/profissionais.styles";
import type { ProfessionalProfile, ProfessionalStatus } from "../../types/professional";
import { formatRequestError } from "../../utils/request-errors";
import { getAuthenticatedEntryRoute } from "../../utils/routes";

type ProfessionalFilter = "todos" | ProfessionalStatus;

const filters: { label: string; value: ProfessionalFilter }[] = [
  { label: "Todos", value: "todos" },
  { label: "Ativos", value: "ativo" },
  { label: "Inativos", value: "inativo" },
];

export default function ProfissionaisScreen() {
  const { bootstrapping, isAuthenticated, onboarding, onboardingLoading, user } = useAuth();
  const [professionals, setProfessionals] = useState<ProfessionalProfile[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<ProfessionalFilter>("todos");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [requestError, setRequestError] = useState("");
  const [newProfessionalModalVisible, setNewProfessionalModalVisible] = useState(false);
  const [selectedProfessional, setSelectedProfessional] = useState<ProfessionalProfile | null>(
    null,
  );
  const requestIdRef = useRef(0);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(timer);
  }, [search]);

  const loadProfessionals = useCallback(
    async (query: string, filter: ProfessionalFilter, refresh = false) => {
      const requestId = ++requestIdRef.current;

      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setRequestError("");

      try {
        const response = await listProfessionals({
          search: query,
          status: filter === "todos" ? undefined : filter,
        });

        if (requestId !== requestIdRef.current) {
          return;
        }

        setProfessionals(Array.isArray(response.data) ? response.data : []);
        setTotal(response.meta?.total ?? response.data?.length ?? 0);
      } catch (error) {
        if (requestId !== requestIdRef.current) {
          return;
        }

        setRequestError(formatRequestError(error, "Não foi possível carregar os profissionais."));
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    if (isAuthenticated && onboarding?.completed) {
      void loadProfessionals(debouncedSearch, selectedFilter);
    }
  }, [debouncedSearch, isAuthenticated, loadProfessionals, onboarding?.completed, selectedFilter]);

  if (bootstrapping || onboardingLoading) {
    return <ScreenLoader message="Carregando profissionais..." />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  if (!onboarding?.completed) {
    return <Redirect href={getAuthenticatedEntryRoute(false)} />;
  }

  function openProfessional(professional: ProfessionalProfile) {
    setSelectedProfessional(professional);
  }

  async function handleCreateProfessional(payload: CreateProfessionalPayload) {
    await createProfessional(payload);
    setSearch("");
    setDebouncedSearch("");
    setSelectedFilter("todos");
    void loadProfessionals("", "todos");
  }

  const canManageProfessionals = Boolean(user?.permissions.manageProfessionals);
  const countLabel =
    total === 1 ? "1 profissional encontrado" : `${total} profissionais encontrados`;

  return (
    <View style={styles.screen}>
      <FlatList
        contentContainerStyle={styles.content}
        data={loading ? [] : professionals}
        keyExtractor={(professional) => professional.id}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            colors={[colors.primary]}
            refreshing={refreshing}
            tintColor={colors.primary}
            onRefresh={() => void loadProfessionals(debouncedSearch, selectedFilter, true)}
          />
        }
        renderItem={({ item }) => (
          <ProfessionalCard professional={item} onPress={openProfessional} />
        )}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            <View style={styles.pageHeader}>
              <View>
                <Text style={styles.eyebrow}>Equipe</Text>
                <Text style={styles.title}>Profissionais</Text>
              </View>
              <View style={styles.headerIcon}>
                <Ionicons name="people-circle-outline" size={24} color={colors.primaryDark} />
              </View>
            </View>

            <View style={styles.searchArea}>
              <Input
                accessibilityLabel="Buscar profissionais"
                autoCapitalize="none"
                autoCorrect={false}
                icon="search-outline"
                placeholder="Buscar por nome ou especialidade"
                returnKeyType="search"
                rightIcon={search ? "close-circle" : undefined}
                value={search}
                onChangeText={setSearch}
                onPressRightIcon={() => setSearch("")}
              />
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.count}>{countLabel}</Text>
              <Text style={styles.hint}>Puxe para atualizar</Text>
            </View>

            <FlatList
              horizontal
              contentContainerStyle={styles.filters}
              data={filters}
              keyExtractor={(filter) => filter.value}
              renderItem={({ item }) => {
                const selected = selectedFilter === item.value;

                return (
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    style={[styles.filterChip, selected ? styles.filterChipSelected : null]}
                    onPress={() => setSelectedFilter(item.value)}
                  >
                    <Text style={[styles.filterText, selected ? styles.filterTextSelected : null]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              }}
              showsHorizontalScrollIndicator={false}
            />
          </>
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.stateCard}>
              <ActivityIndicator color={colors.primary} size="large" />
              <Text style={styles.loadingText}>Buscando profissionais...</Text>
            </View>
          ) : requestError ? (
            <View style={styles.stateCard}>
              <View style={[styles.stateIcon, styles.errorIcon]}>
                <Ionicons name="cloud-offline-outline" size={25} color={colors.error} />
              </View>
              <Text style={styles.stateTitle}>Não foi possível carregar</Text>
              <Text style={styles.stateText}>{requestError}</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => void loadProfessionals(debouncedSearch, selectedFilter)}
              >
                <Text style={styles.retryText}>Tentar novamente</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.stateCard}>
              <View style={styles.stateIcon}>
                <Ionicons
                  name={search || selectedFilter !== "todos" ? "search-outline" : "people-outline"}
                  size={26}
                  color={colors.primaryDark}
                />
              </View>
              <Text style={styles.stateTitle}>
                {search || selectedFilter !== "todos"
                  ? "Nenhum profissional encontrado"
                  : "Sua equipe está vazia"}
              </Text>
              <Text style={styles.stateText}>
                {search || selectedFilter !== "todos"
                  ? "Tente ajustar a busca ou escolher outro filtro."
                  : "Cadastre o primeiro profissional para começar a organizar sua equipe."}
              </Text>
            </View>
          )
        }
      />

      {canManageProfessionals ? (
        <TouchableOpacity
          accessibilityLabel="Cadastrar novo profissional"
          activeOpacity={0.82}
          style={styles.floatingButton}
          onPress={() => setNewProfessionalModalVisible(true)}
        >
          <Ionicons name="person-add-outline" size={25} color={colors.white} />
        </TouchableOpacity>
      ) : null}

      <NewProfessionalModal
        visible={newProfessionalModalVisible}
        onClose={() => setNewProfessionalModalVisible(false)}
        onSubmit={handleCreateProfessional}
      />

      <ProfessionalDetailsModal
        professional={selectedProfessional}
        onClose={() => setSelectedProfessional(null)}
      />
    </View>
  );
}
