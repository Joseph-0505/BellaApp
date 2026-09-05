import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Ionicons } from "@expo/vector-icons";
import { Redirect } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { ClientCard } from "../../components/ClientCard";
import { Input } from "../../components/Input";
import { NewClientModal } from "../../components/NewClientModal";
import { ScreenLoader } from "../../components/ScreenLoader";
import { colors } from "../../global/colors";
import { useAuth } from "../../hooks/useAuth";
import { createClient, listClients, type CreateClientPayload } from "../../services/clients";
import { styles } from "../../styles/clientes.styles";
import type { ClientProfile, ClientStatus } from "../../types/client";
import { formatRequestError } from "../../utils/request-errors";
import { getAuthenticatedEntryRoute } from "../../utils/routes";

type StatusFilter = "todos" | Exclude<ClientStatus, "risco">;

const filters: { label: string; value: StatusFilter }[] = [
  { label: "Todos", value: "todos" },
  { label: "Ativos", value: "ativo" },
  { label: "Novos", value: "novo" },
  { label: "Inativos", value: "inativo" },
];

export default function ClientesScreen() {
  const { bootstrapping, isAuthenticated, onboarding, onboardingLoading } = useAuth();
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<StatusFilter>("todos");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [requestError, setRequestError] = useState("");
  const [newClientModalVisible, setNewClientModalVisible] = useState(false);
  const requestIdRef = useRef(0);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(timer);
  }, [search]);

  const loadClients = useCallback(async (query: string, refresh = false) => {
    const requestId = ++requestIdRef.current;

    if (refresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setRequestError("");

    try {
      const response = await listClients({ search: query });

      if (requestId !== requestIdRef.current) {
        return;
      }

      setClients(Array.isArray(response.data) ? response.data : []);
      setTotal(response.meta?.total ?? response.data?.length ?? 0);
    } catch (error) {
      if (requestId !== requestIdRef.current) {
        return;
      }

      setRequestError(formatRequestError(error, "Não foi possível carregar os clientes."));
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && onboarding?.completed) {
      void loadClients(debouncedSearch);
    }
  }, [debouncedSearch, isAuthenticated, loadClients, onboarding?.completed]);

  const visibleClients = useMemo(
    () =>
      selectedFilter === "todos"
        ? clients
        : clients.filter((client) => client.status === selectedFilter),
    [clients, selectedFilter],
  );

  if (bootstrapping || onboardingLoading) {
    return <ScreenLoader message="Carregando clientes..." />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  if (!onboarding?.completed) {
    return <Redirect href={getAuthenticatedEntryRoute(false)} />;
  }

  function openClient(client: ClientProfile) {
    const contact = [client.phone, client.email].filter(Boolean).join("\n");
    Alert.alert(client.name, contact || "Cliente sem dados de contato.");
  }

  async function handleCreateClient(payload: CreateClientPayload) {
    await createClient(payload);
    setSearch("");
    setDebouncedSearch("");
    setSelectedFilter("todos");
    void loadClients("");
  }

  const countLabel = total === 1 ? "1 cliente cadastrado" : `${total} clientes cadastrados`;

  return (
    <View style={styles.screen}>
      <FlatList
        contentContainerStyle={styles.content}
        data={loading ? [] : visibleClients}
        keyExtractor={(client) => client.id}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            colors={[colors.primary]}
            refreshing={refreshing}
            tintColor={colors.primary}
            onRefresh={() => void loadClients(debouncedSearch, true)}
          />
        }
        renderItem={({ item }) => <ClientCard client={item} onPress={openClient} />}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            <View style={styles.pageHeader}>
              <View>
                <Text style={styles.eyebrow}>Relacionamento</Text>
                <Text style={styles.title}>Clientes</Text>
              </View>
              <View style={styles.headerIcon}>
                <Ionicons name="people-outline" size={22} color={colors.primaryDark} />
              </View>
            </View>

            <View style={styles.searchArea}>
              <Input
                accessibilityLabel="Buscar clientes"
                autoCapitalize="none"
                autoCorrect={false}
                icon="search-outline"
                placeholder="Buscar por nome, telefone ou e-mail"
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
              <Text style={styles.loadingText}>Buscando clientes...</Text>
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
                onPress={() => void loadClients(debouncedSearch)}
              >
                <Text style={styles.retryText}>Tentar novamente</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.stateCard}>
              <View style={styles.stateIcon}>
                <Ionicons
                  name={search ? "search-outline" : "people-outline"}
                  size={26}
                  color={colors.primaryDark}
                />
              </View>
              <Text style={styles.stateTitle}>
                {search || selectedFilter !== "todos" ? "Nenhum cliente encontrado" : "Sua lista está vazia"}
              </Text>
              <Text style={styles.stateText}>
                {search || selectedFilter !== "todos"
                  ? "Tente ajustar a busca ou escolher outro filtro."
                  : "Cadastre o primeiro cliente para começar a acompanhar o relacionamento."}
              </Text>
            </View>
          )
        }
      />

      <TouchableOpacity
        accessibilityLabel="Cadastrar novo cliente"
        activeOpacity={0.82}
        style={styles.floatingButton}
        onPress={() => setNewClientModalVisible(true)}
      >
        <Ionicons name="person-add-outline" size={24} color={colors.white} />
      </TouchableOpacity>

      <NewClientModal
        visible={newClientModalVisible}
        onClose={() => setNewClientModalVisible(false)}
        onSubmit={handleCreateClient}
      />
    </View>
  );
}
