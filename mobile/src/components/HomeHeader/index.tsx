import React, { useRef, useState } from "react";

import { Ionicons } from "@expo/vector-icons";
import { router, usePathname, type Href } from "expo-router";
import {
  Alert,
  Animated,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors } from "../../global/colors";
import { useAuth } from "../../hooks/useAuth";
import { resolveApiAssetUrl } from "../../services/api";
import { drawerColors, styles } from "./styles";

type AppRoute =
  | "/agenda"
  | "/clientes"
  | "/home"
  | "/onboarding"
  | "/perfil"
  | "/profissionais"
  | "/servicos";

interface NavigationItem {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  route: AppRoute;
}

interface NavigationSection {
  label: string;
  items: NavigationItem[];
}

const routeTitles: Record<AppRoute, string> = {
  "/agenda": "Agenda",
  "/clientes": "Clientes",
  "/home": "Início",
  "/onboarding": "Configuração inicial",
  "/perfil": "Meu perfil",
  "/profissionais": "Profissionais",
  "/servicos": "Serviços",
};

const overviewItems: NavigationItem[] = [
  { icon: "home-outline", label: "Início", route: "/home" },
  { icon: "calendar-outline", label: "Agenda", route: "/agenda" },
];

const managementItems: NavigationItem[] = [
  { icon: "people-outline", label: "Clientes", route: "/clientes" },
  { icon: "sparkles-outline", label: "Serviços", route: "/servicos" },
  {
    icon: "people-circle-outline",
    label: "Profissionais",
    route: "/profissionais",
  },
];

const accountItems: NavigationItem[] = [
  { icon: "person-outline", label: "Meu perfil", route: "/perfil" },
];

const onboardingNavigationItem: NavigationItem = {
  icon: "options-outline",
  label: "Configuração inicial",
  route: "/onboarding",
};

function isRouteActive(pathname: string, route: AppRoute) {
  return pathname === route || pathname.startsWith(`${route}/`);
}

function getRouteTitle(pathname: string) {
  const route = (Object.keys(routeTitles) as AppRoute[]).find((candidate) =>
    isRouteActive(pathname, candidate),
  );

  return route ? routeTitles[route] : "BellaApp";
}

function getInitials(name?: string) {
  return (
    String(name || "BellaApp")
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "BA"
  );
}

export function HomeHeader() {
  const { onboarding, signOut, user } = useAuth();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [menuVisible, setMenuVisible] = useState(false);
  const translateX = useRef(new Animated.Value(-width)).current;
  const drawerWidth = Math.min(width * 0.82, 340);
  const avatarUri = resolveApiAssetUrl(user?.avatarUrl);
  const roleLabel = user?.membership?.role === "PROFESSIONAL" ? "Profissional" : "Administrador";
  const navigationSections: NavigationSection[] = [
    { label: "Visão geral", items: overviewItems },
    { label: "Gestão", items: managementItems },
    {
      label: "Conta",
      items:
        onboarding?.completed === false
          ? [onboardingNavigationItem, ...accountItems]
          : accountItems,
    },
  ];

  function openMenu() {
    translateX.setValue(-width);
    setMenuVisible(true);

    requestAnimationFrame(() => {
      Animated.timing(translateX, {
        duration: 250,
        toValue: 0,
        useNativeDriver: true,
      }).start();
    });
  }

  function closeMenu() {
    Animated.timing(translateX, {
      duration: 220,
      toValue: -width,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setMenuVisible(false);
      }
    });
  }

  function navigate(route: AppRoute) {
    setMenuVisible(false);
    translateX.setValue(-width);
    router.replace(route as Href);
  }

  function handleNotifications() {
    Alert.alert("Notificações", "Você não tem novas notificações.");
  }

  function handleSignOut() {
    setMenuVisible(false);
    void signOut().finally(() => router.replace("/login"));
  }

  return (
    <>
      <View
        style={[
          styles.container,
          { height: 62 + insets.top, paddingTop: insets.top },
        ]}
      >
        <View style={styles.headerLead}>
          <TouchableOpacity
            accessibilityLabel="Abrir menu lateral"
            accessibilityRole="button"
            activeOpacity={0.68}
            style={styles.menuButton}
            onPress={openMenu}
          >
            <Ionicons name="menu-outline" size={20} color={colors.text} />
          </TouchableOpacity>
          <Text numberOfLines={1} style={styles.pageTitle}>
            {getRouteTitle(pathname)}
          </Text>
        </View>

        <TouchableOpacity
          accessibilityLabel="Notificações"
          accessibilityRole="button"
          activeOpacity={0.68}
          style={styles.notificationButton}
          onPress={handleNotifications}
        >
          <Ionicons name="notifications-outline" size={22} color={colors.text} />
          <View style={styles.notificationDot} />
        </TouchableOpacity>
      </View>

      <Modal
        animationType="none"
        onRequestClose={closeMenu}
        statusBarTranslucent
        transparent
        visible={menuVisible}
      >
        <View style={styles.modal}>
          <Animated.View
            style={[
              styles.drawer,
              {
                paddingBottom: Math.max(insets.bottom, 14),
                paddingTop: insets.top + 18,
                transform: [{ translateX }],
                width: drawerWidth,
              },
            ]}
          >
            <View style={styles.drawerHeader}>
              <View style={styles.drawerBrand}>
                <View style={styles.drawerBrandIcon}>
                  <Ionicons name="sparkles" size={19} color={drawerColors.background} />
                </View>
                <View style={styles.drawerBrandCopy}>
                  <Text numberOfLines={1} style={styles.drawerTitle}>
                    BellaApp
                  </Text>
                  <Text numberOfLines={1} style={styles.drawerEyebrow}>
                    {roleLabel}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                accessibilityLabel="Fechar menu lateral"
                accessibilityRole="button"
                activeOpacity={0.7}
                style={styles.closeButton}
                onPress={closeMenu}
              >
                <Ionicons name="close" size={20} color={drawerColors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={styles.menuList}
              showsVerticalScrollIndicator={false}
              style={styles.menuScroll}
            >
              {navigationSections.map((section) => (
                <View key={section.label} style={styles.menuSection}>
                  <Text style={styles.sectionLabel}>{section.label}</Text>
                  <View style={styles.sectionItems}>
                    {section.items.map((item) => {
                      const active = isRouteActive(pathname, item.route);

                      return (
                        <TouchableOpacity
                          key={item.route}
                          accessibilityLabel={`Ir para ${item.label}`}
                          accessibilityRole="button"
                          accessibilityState={{ selected: active }}
                          activeOpacity={0.76}
                          style={[styles.menuItem, active ? styles.menuItemActive : null]}
                          onPress={() => navigate(item.route)}
                        >
                          <View style={[styles.menuIcon, active ? styles.menuIconActive : null]}>
                            <Ionicons
                              name={item.icon}
                              size={18}
                              color={active ? drawerColors.accent : drawerColors.textMuted}
                            />
                          </View>
                          <Text style={[styles.menuItemText, active ? styles.menuItemTextActive : null]}>
                            {item.label}
                          </Text>
                          <Ionicons
                            name="chevron-forward"
                            size={15}
                            color={active ? drawerColors.accent : drawerColors.chevron}
                          />
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ))}
            </ScrollView>

            <View style={styles.accountCard}>
              <TouchableOpacity
                accessibilityLabel="Abrir meu perfil"
                accessibilityRole="button"
                activeOpacity={0.76}
                style={styles.accountProfile}
                onPress={() => navigate("/perfil")}
              >
                <View style={styles.avatar}>
                  {avatarUri ? (
                    <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
                  ) : (
                    <Text style={styles.avatarText}>{getInitials(user?.name)}</Text>
                  )}
                </View>
                <View style={styles.accountCopy}>
                  <Text numberOfLines={1} style={styles.accountName}>
                    {user?.name || "Usuário BellaApp"}
                  </Text>
                  <Text numberOfLines={1} style={styles.accountEmail}>
                    {user?.email || "Acessar meu perfil"}
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                accessibilityLabel="Sair da conta"
                accessibilityRole="button"
                activeOpacity={0.7}
                style={styles.signOutButton}
                onPress={handleSignOut}
              >
                <Ionicons name="log-out-outline" size={19} color={drawerColors.textMuted} />
              </TouchableOpacity>
            </View>
          </Animated.View>

          <Pressable
            accessibilityLabel="Fechar menu lateral"
            accessibilityRole="button"
            style={styles.backdrop}
            onPress={closeMenu}
          />
        </View>
      </Modal>
    </>
  );
}
