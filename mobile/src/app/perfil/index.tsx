import React, { useCallback, useEffect, useState } from "react";

import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { Redirect, router } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { DeleteAccountModal } from "../../components/DeleteAccountModal";
import { EditProfileModal } from "../../components/EditProfileModal";
import { ProfileInfoRow } from "../../components/ProfileInfoRow";
import { ScreenLoader } from "../../components/ScreenLoader";
import { colors } from "../../global/colors";
import { useAuth } from "../../hooks/useAuth";
import {
  deleteCurrentUserAccount,
  removeCurrentUserPhoto,
  updateCurrentUserProfile,
  uploadCurrentUserPhoto,
  type DeleteCurrentUserPayload,
  type UpdateCurrentUserPayload,
} from "../../services/user";
import { styles } from "../../styles/perfil.styles";
import type { UserProfile } from "../../types/auth";
import { formatCnpj, formatCpf } from "../../utils/documents";
import { formatRequestError } from "../../utils/request-errors";
import { getAuthenticatedEntryRoute } from "../../utils/routes";
import { resolveApiAssetUrl } from "../../services/api";

const planLabels: Record<NonNullable<UserProfile["clinic"]>["plan"], string> = {
  INDIVIDUAL: "Individual",
  TEAM: "Equipe",
  TRIAL: "Teste grátis",
};

const permissionItems: {
  key: keyof UserProfile["permissions"];
  label: string;
}[] = [
  { key: "manageProfessionals", label: "Gerenciar equipe" },
  { key: "viewAllAgenda", label: "Agenda completa" },
  { key: "viewAllCash", label: "Caixa completo" },
];

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "BA";
}

function getTrialStatus(trialEndsAt: string | null) {
  if (!trialEndsAt) return "Plano ativo";

  const endDate = new Date(trialEndsAt);

  if (Number.isNaN(endDate.getTime())) return "Período de teste";

  const days = Math.ceil((endDate.getTime() - Date.now()) / 86_400_000);

  if (days <= 0) return "Período encerrado";
  if (days === 1) return "1 dia restante";
  return `${days} dias restantes`;
}

export default function PerfilScreen() {
  const {
    bootstrapping,
    isAuthenticated,
    onboarding,
    onboardingLoading,
    refreshCurrentUser,
    signOut,
    user,
  } = useAuth();
  const [loading, setLoading] = useState(() => !user);
  const [refreshing, setRefreshing] = useState(false);
  const [requestError, setRequestError] = useState("");
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [photoLoading, setPhotoLoading] = useState(false);

  const loadProfile = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);

    setRequestError("");

    try {
      await refreshCurrentUser();
    } catch (error) {
      setRequestError(formatRequestError(error, "Não foi possível atualizar os dados do perfil."));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [refreshCurrentUser]);

  useEffect(() => {
    if (isAuthenticated && onboarding?.completed) {
      void loadProfile();
    }
  }, [isAuthenticated, loadProfile, onboarding?.completed]);

  if (bootstrapping || onboardingLoading) {
    return <ScreenLoader message="Carregando perfil..." />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  if (!onboarding?.completed) {
    return <Redirect href={getAuthenticatedEntryRoute(false)} />;
  }

  async function handleUpdateProfile(payload: UpdateCurrentUserPayload) {
    await updateCurrentUserProfile(payload);
    await refreshCurrentUser();
    Alert.alert("Perfil atualizado", "Seus dados foram salvos com sucesso.");
  }

  async function pickProfilePhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        "Acesso às fotos",
        "Permita o acesso à galeria para escolher sua foto de perfil.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      mediaTypes: ["images"],
      preferredAssetRepresentationMode:
        ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
      quality: 0.82,
    });

    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];

    if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
      Alert.alert("Imagem muito grande", "Escolha uma imagem com no máximo 5 MB.");
      return;
    }

    const extension = (asset.fileName || asset.uri).split(".").pop()?.toLowerCase();
    const inferredMimeType = extension === "png"
      ? "image/png"
      : extension === "webp"
        ? "image/webp"
        : extension === "jpg" || extension === "jpeg"
          ? "image/jpeg"
          : "";
    const mimeType = asset.mimeType || inferredMimeType;

    if (!["image/jpeg", "image/png", "image/webp"].includes(mimeType)) {
      Alert.alert("Formato não aceito", "Escolha uma imagem JPEG, PNG ou WebP.");
      return;
    }

    const canonicalExtension = mimeType === "image/png"
      ? "png"
      : mimeType === "image/webp"
        ? "webp"
        : "jpg";
    const originalNameHasValidExtension = ["jpg", "jpeg", "png", "webp"].includes(
      extension || "",
    );

    setPhotoLoading(true);

    try {
      await uploadCurrentUserPhoto({
        ...(asset.file ? { file: asset.file } : {}),
        fileName: originalNameHasValidExtension
          ? asset.fileName || `perfil.${canonicalExtension}`
          : `perfil.${canonicalExtension}`,
        mimeType,
        uri: asset.uri,
      });
    } catch (error) {
      Alert.alert(
        "Não foi possível salvar",
        formatRequestError(error, "Tente novamente em alguns instantes."),
      );
    } finally {
      setPhotoLoading(false);
    }
  }

  function confirmRemovePhoto() {
    Alert.alert("Remover foto", "Deseja voltar a usar suas iniciais no perfil?", [
      { style: "cancel", text: "Cancelar" },
      {
        style: "destructive",
        text: "Remover",
        onPress: () => {
          setPhotoLoading(true);
          void removeCurrentUserPhoto()
            .catch((error) => {
              Alert.alert(
                "Não foi possível remover",
                formatRequestError(error, "Tente novamente em alguns instantes."),
              );
            })
            .finally(() => setPhotoLoading(false));
        },
      },
    ]);
  }

  function handlePhotoPress() {
    if (!user?.avatarUrl) {
      void pickProfilePhoto();
      return;
    }

    Alert.alert("Foto de perfil", "O que deseja fazer?", [
      { text: "Trocar foto", onPress: () => void pickProfilePhoto() },
      { style: "destructive", text: "Remover foto", onPress: confirmRemovePhoto },
      { style: "cancel", text: "Cancelar" },
    ]);
  }

  async function handleDeleteAccount(payload: DeleteCurrentUserPayload) {
    await deleteCurrentUserAccount(payload);
    setDeleteModalVisible(false);
    router.replace("/login");
  }

  function handleSignOut() {
    Alert.alert("Sair da conta", "Deseja realmente encerrar sua sessão?", [
      { style: "cancel", text: "Cancelar" },
      {
        style: "destructive",
        text: "Sair",
        onPress: () => void signOut().finally(() => router.replace("/login")),
      },
    ]);
  }

  if (loading && !user) {
    return (
      <View style={styles.screen}>
        <View style={styles.loadingState}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.loadingText}>Buscando seus dados...</Text>
        </View>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.screen}>
        <View style={styles.errorState}>
          <View style={styles.errorIcon}>
            <Ionicons name="cloud-offline-outline" size={27} color={colors.error} />
          </View>
          <Text style={styles.errorTitle}>Não foi possível carregar</Text>
          <Text style={styles.errorText}>{requestError || "Tente novamente em alguns instantes."}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => void loadProfile()}>
            <Text style={styles.retryText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const isAdmin = user.membership?.role !== "PROFESSIONAL";
  const roleLabel = isAdmin ? "Administrador" : "Usuário profissional";
  const planLabel = user.clinic ? planLabels[user.clinic.plan] : "Sem plano";
  const trialStatus = user.clinic ? getTrialStatus(user.clinic.trialEndsAt) : "Clínica não vinculada";
  const businessName = user.businessProfile?.businessName || "Meu negócio";
  const avatarUri = resolveApiAssetUrl(user.avatarUrl);

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            colors={[colors.primary]}
            refreshing={refreshing}
            tintColor={colors.primary}
            onRefresh={() => void loadProfile(true)}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.pageHeader}>
          <View>
            <Text style={styles.eyebrow}>Minha conta</Text>
            <Text style={styles.title}>Perfil</Text>
          </View>
          <TouchableOpacity
            accessibilityLabel="Editar perfil"
            style={styles.headerIcon}
            onPress={() => setEditModalVisible(true)}
          >
            <Ionicons name="create-outline" size={23} color={colors.primaryDark} />
          </TouchableOpacity>
        </View>

        {requestError ? (
          <View style={styles.warningBanner}>
            <Ionicons name="alert-circle-outline" size={18} color={colors.error} />
            <Text style={styles.warningText}>{requestError}</Text>
          </View>
        ) : null}

        <View style={styles.heroCard}>
          <View style={styles.heroGlow} />
          <View style={styles.avatarWrapper}>
            <TouchableOpacity
              accessibilityLabel={avatarUri ? "Alterar foto de perfil" : "Adicionar foto de perfil"}
              activeOpacity={0.82}
              disabled={photoLoading}
              style={styles.avatar}
              onPress={handlePhotoPress}
            >
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarText}>{getInitials(user.name)}</Text>
              )}
              {photoLoading ? (
                <View style={styles.avatarLoading}>
                  <ActivityIndicator color={colors.white} size="small" />
                </View>
              ) : null}
            </TouchableOpacity>
            <View style={styles.cameraBadge} pointerEvents="none">
              <Ionicons name="camera" size={14} color={colors.white} />
            </View>
          </View>
          <Text style={styles.userName}>{user.name || "Usuário BellaApp"}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
          <View style={styles.roleBadge}>
            <Ionicons
              name={roleLabel === "Administrador" ? "shield-checkmark-outline" : "sparkles-outline"}
              size={14}
              color={colors.primaryDark}
            />
            <Text style={styles.roleText}>{roleLabel}</Text>
          </View>
          <TouchableOpacity disabled={photoLoading} onPress={handlePhotoPress}>
            <Text style={styles.photoHint}>
              {avatarUri ? "Toque para trocar a foto" : "Adicionar foto de perfil"}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.planCard}>
          <View style={styles.planIcon}>
            <Ionicons name="diamond-outline" size={22} color={colors.white} />
          </View>
          <View style={styles.planCopy}>
            <Text style={styles.planEyebrow}>Seu plano</Text>
            <Text style={styles.planName}>{planLabel}</Text>
          </View>
          <View style={styles.planStatus}>
            <View style={styles.statusDot} />
            <Text style={styles.planStatusText}>{trialStatus}</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Dados pessoais</Text>
          <Text style={styles.sectionHint}>Puxe para atualizar</Text>
        </View>
        <View style={styles.sectionCard}>
          <ProfileInfoRow icon="mail-outline" label="E-mail" value={user.email} />
          <ProfileInfoRow icon="card-outline" label="CPF" last value={formatCpf(user.cpf)} />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Negócio e vínculo</Text>
        </View>
        <View style={styles.sectionCard}>
          <ProfileInfoRow icon="business-outline" label="Negócio" value={businessName} />
          {user.businessProfile?.cnpj ? (
            <ProfileInfoRow
              icon="document-text-outline"
              label="CNPJ"
              value={formatCnpj(user.businessProfile.cnpj)}
            />
          ) : null}
          <ProfileInfoRow
            icon="people-circle-outline"
            label="Vínculo"
            last
            value={user.professional?.specialty || roleLabel}
          />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Acessos</Text>
        </View>
        <View style={styles.permissionsCard}>
          {permissionItems.map((permission) => {
            const enabled = user.permissions[permission.key];

            return (
              <View
                key={permission.key}
                style={[styles.permissionChip, enabled ? styles.permissionEnabled : null]}
              >
                <Ionicons
                  name={enabled ? "checkmark-circle" : "remove-circle-outline"}
                  size={17}
                  color={enabled ? colors.success : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.permissionText,
                    enabled ? styles.permissionTextEnabled : null,
                  ]}
                >
                  {permission.label}
                </Text>
              </View>
            );
          })}
        </View>

        <TouchableOpacity
          accessibilityRole="button"
          activeOpacity={0.78}
          style={styles.editButton}
          onPress={() => setEditModalVisible(true)}
        >
          <Ionicons name="create-outline" size={20} color={colors.white} />
          <Text style={styles.editButtonText}>Editar meus dados</Text>
        </TouchableOpacity>

        <TouchableOpacity
          accessibilityRole="button"
          activeOpacity={0.72}
          style={styles.signOutButton}
          onPress={handleSignOut}
        >
          <Ionicons name="log-out-outline" size={20} color={colors.error} />
          <Text style={styles.signOutText}>Sair da conta</Text>
        </TouchableOpacity>

        <View style={styles.dangerSection}>
          <View style={styles.dangerCopy}>
            <Text style={styles.dangerTitle}>Excluir conta</Text>
            <Text style={styles.dangerDescription}>
              Remove permanentemente seu acesso e não pode ser desfeito.
            </Text>
          </View>
          <TouchableOpacity
            accessibilityRole="button"
            style={styles.deleteButton}
            onPress={() => setDeleteModalVisible(true)}
          >
            <Ionicons name="trash-outline" size={18} color={colors.error} />
            <Text style={styles.deleteButtonText}>Excluir</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <EditProfileModal
        user={user}
        visible={editModalVisible}
        onClose={() => setEditModalVisible(false)}
        onSubmit={handleUpdateProfile}
      />
      <DeleteAccountModal
        isAdmin={isAdmin}
        visible={deleteModalVisible}
        onClose={() => setDeleteModalVisible(false)}
        onSubmit={handleDeleteAccount}
      />
    </View>
  );
}
