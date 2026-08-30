import { StyleSheet } from "react-native";

import { colors } from "../../global/colors";

export const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  eyebrow: { color: colors.textSecondary, fontSize: 13, marginBottom: 4 },
  title: { color: colors.text, fontSize: 23, fontWeight: "700" },
  actions: { flexDirection: "row", alignItems: "center", gap: 10 },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  notificationDot: {
    position: "absolute",
    top: 9,
    right: 10,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
  },
  avatarText: { color: colors.white, fontSize: 18, fontWeight: "700" },
});
