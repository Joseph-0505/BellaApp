import React, { useState } from "react";

import { Ionicons } from "@expo/vector-icons";
import { router, usePathname, type Href } from "expo-router";
import { Alert, Modal, Pressable, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors } from "../../global/colors";
import { useAuth } from "../../hooks/useAuth";
import { styles } from "./styles";

type AppRoute = "/agenda" | "/clientes" | "/servicos" | "/home" | "/login" | "/cadastro" | "/onboarding";

type NavigationItem = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  route: AppRoute;
};

const navigationItems: NavigationItem[] = [
  { icon: "home-outline", label: "Inicio", route: "/home" },
  { icon: "calendar-outline", label: "Agenda", route: "/agenda" },
  { icon: "people-outline", label: "Clientes", route: "/clientes" },
  { icon: "briefcase-outline", label: "Serviços", route: "/servicos" },
  { icon: "log-in-outline", label: "Entrar", route: "/login" },
  { icon: "person-add-outline", label: "Criar conta", route: "/cadastro" },
  { icon: "sparkles-outline", label: "Configuracao inicial", route: "/onboarding" },
];

export function HomeHeader() {
  const { isAuthenticated, signOut } = useAuth();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const [menuVisible, setMenuVisible] = useState(false);

  function navigate(route: AppRoute) {
    setMenuVisible(false);
    router.replace(route as Href);
  }

  function handleNotifications() {
    Alert.alert("Notificacoes", "Voce nao tem novas notificacoes.");
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
          { height: 66 + insets.top, paddingTop: insets.top },
        ]}
      >
        <TouchableOpacity
          accessibilityLabel="Abrir menu"
          accessibilityRole="button"
          style={styles.iconButton}
          onPress={() => setMenuVisible(true)}
        >
          <Ionicons name="menu-outline" size={31} color={colors.text} />
        </TouchableOpacity>

        <TouchableOpacity
          accessibilityLabel="Notificacoes"
          accessibilityRole="button"
          style={styles.iconButton}
          onPress={handleNotifications}
        >
          <Ionicons name="notifications-outline" size={28} color={colors.text} />
          <View style={styles.notificationDot} />
        </TouchableOpacity>
      </View>

      <Modal
        transparent
        animationType="slide"
        visible={menuVisible}
        onRequestClose={() => setMenuVisible(false)}
      >
        <View style={styles.modal}>
          <Pressable
            accessibilityLabel="Fechar menu"
            style={styles.backdrop}
            onPress={() => setMenuVisible(false)}
          />
          <View style={[styles.drawer, { paddingTop: 32 + insets.top }]}>
            <View style={styles.drawerHeader}>
              <View>
                <Text style={styles.drawerEyebrow}>BellaApp</Text>
                <Text style={styles.drawerTitle}>Navegacao</Text>
              </View>
              <TouchableOpacity
                accessibilityLabel="Fechar menu"
                style={styles.closeButton}
                onPress={() => setMenuVisible(false)}
              >
                <Ionicons name="close-outline" size={25} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.menuList}>
              {navigationItems.map((item) => {
                const isActive = pathname === item.route;

                return (
                  <TouchableOpacity
                    key={item.route}
                    style={[styles.menuItem, isActive ? styles.menuItemActive : null]}
                    onPress={() => navigate(item.route)}
                  >
                    <Ionicons
                      name={item.icon}
                      size={22}
                      color={isActive ? colors.primaryDark : colors.textSecondary}
                    />
                    <Text style={[styles.menuItemText, isActive ? styles.menuItemTextActive : null]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {isAuthenticated ? (
              <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
                <Ionicons name="log-out-outline" size={21} color={colors.error} />
                <Text style={styles.signOutText}>Sair da conta</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </Modal>
    </>
  );
}
