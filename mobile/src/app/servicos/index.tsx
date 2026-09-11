import React, { useCallback, useEffect, useRef, useState } from "react";

import { Ionicons } from "@expo/vector-icons";
import { PageAction } from "../../context/PageActionContext";
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
import { NewServiceModal } from "../../components/NewServiceModal";
import { ScreenLoader } from "../../components/ScreenLoader";
import { ServiceCard } from "../../components/ServiceCard";
import { ServiceDetailsModal } from "../../components/ServiceDetailsModal";
import { colors } from "../../global/colors";
import { useAuth } from "../../hooks/useAuth";
import {
  createService,
  updateService,
  deleteService,
  listServices,
  type CreateServicePayload,
} from "../../services/services";
import { styles } from "../../styles/servicos.styles";
import type { ServiceProfile } from "../../types/service";
import { formatRequestError } from "../../utils/request-errors";
import { getAuthenticatedEntryRoute } from "../../utils/routes";

type ServiceFilter = "todos" | "ativos" | "inativos" | "alto";

const filters: { label: string; value: ServiceFilter }[] = [
  { label: "Todos", value: "todos" },
  { label: "Ativos", value: "ativos" },
  { label: "Inativos", value: "inativos" },
  { label: "Alto risco", value: "alto" },
];

function getApiFilters(filter: ServiceFilter) {
  if (filter === "ativos") return { active: true };
  if (filter === "inativos") return { active: false };
  if (filter === "alto") return { risk: "alto" as const };
  return {};
}

export default function ServicosScreen() {
  const { bootstrapping, isAuthenticated, onboarding, onboardingLoading, user } = useAuth();
  const canManageServices = user?.membership?.role === "ADMIN";
  const [services, setServices] = useState<ServiceProfile[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<ServiceFilter>("todos");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [requestError, setRequestError] = useState("");
  const [newServiceModalVisible, setNewServiceModalVisible] = useState(false);
  const [selectedService, setSelectedService] = useState<ServiceProfile | null>(null);
  const [editingService, setEditingService] = useState<ServiceProfile | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(timer);
  }, [search]);

  const loadServices = useCallback(
    async (query: string, filter: ServiceFilter, refresh = false) => {
      const requestId = ++requestIdRef.current;

      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setRequestError("");

      try {
        const response = await listServices({
          search: query,
          ...getApiFilters(filter),
        });

        if (requestId !== requestIdRef.current) {
          return;
        }

        setServices(Array.isArray(response.data) ? response.data : []);
        setTotal(response.meta?.total ?? response.data?.length ?? 0);
      } catch (error) {
        if (requestId !== requestIdRef.current) {
          return;
        }

        setRequestError(formatRequestError(error, "Não foi possível carregar os serviços."));
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
      void loadServices(debouncedSearch, selectedFilter);
    }
  }, [debouncedSearch, isAuthenticated, loadServices, onboarding?.completed, selectedFilter]);

  if (bootstrapping || onboardingLoading) {
    return <ScreenLoader message="Carregando serviços..." />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  if (!onboarding?.completed) {
    return <Redirect href={getAuthenticatedEntryRoute(false)} />;
  }

  function openService(service: ServiceProfile) {
    setSelectedService(service);
  }

  async function handleCreateService(payload: CreateServicePayload) {
    if (editingService) await updateService(editingService.id, payload);
    else await createService(payload);
    setEditingService(null);
    setSearch("");
    setDebouncedSearch("");
    setSelectedFilter("todos");
    void loadServices("", "todos");
  }

  const countLabel = total === 1 ? "1 serviço encontrado" : `${total} serviços encontrados`;

  return (
    <View style={styles.screen}>
      <FlatList
        contentContainerStyle={styles.content}
        data={loading ? [] : services}
        keyExtractor={(service) => service.id}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            colors={[colors.primary]}
            refreshing={refreshing}
            tintColor={colors.primary}
            onRefresh={() => void loadServices(debouncedSearch, selectedFilter, true)}
          />
        }
        renderItem={({ item }) => <ServiceCard service={item} onPress={openService} />}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            <View style={styles.pageHeader}>
              <View>
                <Text style={styles.eyebrow}>Catálogo</Text>
                <Text style={styles.title}>Serviços</Text>
              </View>
              <View style={styles.headerIcon}>
                <Ionicons name="sparkles-outline" size={22} color={colors.primaryDark} />
              </View>
            </View>

            <View style={styles.searchArea}>
              <Input
                accessibilityLabel="Buscar serviços"
                autoCapitalize="none"
                autoCorrect={false}
                icon="search-outline"
                placeholder="Buscar por nome ou descrição"
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
              <Text style={styles.loadingText}>Buscando serviços...</Text>
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
                onPress={() => void loadServices(debouncedSearch, selectedFilter)}
              >
                <Text style={styles.retryText}>Tentar novamente</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.stateCard}>
              <View style={styles.stateIcon}>
                <Ionicons
                  name={search || selectedFilter !== "todos" ? "search-outline" : "sparkles-outline"}
                  size={26}
                  color={colors.primaryDark}
                />
              </View>
              <Text style={styles.stateTitle}>
                {search || selectedFilter !== "todos" ? "Nenhum serviço encontrado" : "Seu catálogo está vazio"}
              </Text>
              <Text style={styles.stateText}>
                {search || selectedFilter !== "todos"
                  ? "Tente ajustar a busca ou escolher outro filtro."
                  : "Cadastre o primeiro serviço para começar a organizar seu catálogo."}
              </Text>
            </View>
          )
        }
      />

      {canManageServices ? (
        <PageAction
        label="Cadastrar novo serviço"
        onPress={() => { setEditingService(null); setNewServiceModalVisible(true); }}
        />
      ) : null}

      <NewServiceModal
        service={editingService}
        visible={newServiceModalVisible}
        onClose={() => setNewServiceModalVisible(false)}
        onSubmit={handleCreateService}
      />

      <ServiceDetailsModal
        onEdit={canManageServices ? () => { setEditingService(selectedService); setSelectedService(null); setNewServiceModalVisible(true); } : undefined}
        onDelete={canManageServices ? async () => { if (!selectedService) return; await deleteService(selectedService.id); setSelectedService(null); await loadServices(debouncedSearch, selectedFilter); } : undefined}
        service={selectedService}
        onClose={() => setSelectedService(null)}
      />
    </View>
  );
}
