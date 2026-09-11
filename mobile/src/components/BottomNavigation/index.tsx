import React from "react";

import { Ionicons } from "@expo/vector-icons";
import { router, usePathname, type Href } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors } from "../../global/colors";
import { styles } from "./styles";
import { usePageAction } from "../../context/PageActionContext";

type AppRoute = "/agenda" | "/clientes" | "/home" | "/servicos";

interface NavigationItem {
  activeIcon: keyof typeof Ionicons.glyphMap;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  route: AppRoute;
}

const primaryItems: NavigationItem[] = [
  { activeIcon: "home", icon: "home-outline", label: "Início", route: "/home" },
  { activeIcon: "calendar", icon: "calendar-outline", label: "Agenda", route: "/agenda" },
  { activeIcon: "people", icon: "people-outline", label: "Clientes", route: "/clientes" },
  {
    activeIcon: "sparkles",
    icon: "sparkles-outline",
    label: "Serviços",
    route: "/servicos",
  },
];

function isRouteActive(pathname: string, route: AppRoute) {
  return pathname === route || pathname.startsWith(`${route}/`);
}

export function BottomNavigation() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { action } = usePageAction();
  const canOpen = !!action || pathname === "/home";

  if (pathname === "/onboarding") {
    return null;
  }

  function navigate(route: AppRoute) {
    router.replace(route as Href);
  }

  return (
    <View style={[styles.navigation, { paddingBottom: Math.max(insets.bottom, 7) }]}>
      {primaryItems.map((item, index) => {
        const active = isRouteActive(pathname, item.route);

        return (
          <React.Fragment key={item.route}>
          {index === 2 ? (
            <View style={{ flex: 1, alignItems: "center" }}>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={action?.label || "Novo agendamento"}
                accessibilityState={{ disabled: !canOpen }}
                disabled={!canOpen}
                onPress={action?.onPress || (() => router.push("/agenda?create=1" as Href))}
                style={{ backgroundColor: colors.primaryDark, opacity: canOpen ? 1 : 0.4, width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" }}
              >
                <Ionicons name={pathname === "/perfil" ? "create-outline" : "add"} size={27} color={colors.white} />
              </TouchableOpacity>
            </View>
          ) : null}
          <TouchableOpacity
            key={item.route}
            accessibilityLabel={`Ir para ${item.label}`}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            activeOpacity={0.72}
            style={styles.navigationItem}
            onPress={() => navigate(item.route)}
          >
            <View style={[styles.iconBox, active ? styles.iconBoxActive : null]}>
              <Ionicons
                name={active ? item.activeIcon : item.icon}
                size={21}
                color={active ? colors.primaryDark : colors.textSecondary}
              />
            </View>
            <Text style={[styles.navigationLabel, active ? styles.navigationLabelActive : null]}>
              {item.label}
            </Text>
          </TouchableOpacity>
          </React.Fragment>
        );
      })}
    </View>
  );
}
