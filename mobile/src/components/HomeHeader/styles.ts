import { StyleSheet } from "react-native";

import { colors } from "../../global/colors";

export const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    backgroundColor: colors.surface,
    flexDirection: "row",
    height: 66,
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  iconButton: {
    alignItems: "center",
    height: 46,
    justifyContent: "center",
    position: "relative",
    width: 46,
  },
  notificationDot: {
    backgroundColor: "#6E45D7",
    borderColor: colors.surface,
    borderRadius: 7,
    borderWidth: 2,
    height: 14,
    position: "absolute",
    right: 6,
    top: 5,
    width: 14,
  },
  modal: {
    flex: 1,
    flexDirection: "row",
  },
  backdrop: {
    backgroundColor: "rgba(37, 37, 37, 0.3)",
    flex: 1,
  },
  drawer: {
    backgroundColor: colors.surface,
    justifyContent: "space-between",
    paddingBottom: 34,
    paddingHorizontal: 18,
    paddingTop: 58,
    width: "78%",
  },
  drawerHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 36,
  },
  drawerEyebrow: {
    color: colors.primaryDark,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  drawerTitle: {
    color: colors.text,
    fontSize: 25,
    fontWeight: "700",
    marginTop: 3,
  },
  closeButton: {
    alignItems: "center",
    backgroundColor: colors.primaryLight,
    borderRadius: 18,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  menuList: {
    gap: 8,
    paddingBottom: 4,
  },
  menuScroll: { flex: 1 },
  menuItem: {
    alignItems: "center",
    borderRadius: 14,
    flexDirection: "row",
    gap: 13,
    minHeight: 52,
    paddingHorizontal: 14,
  },
  menuItemActive: {
    backgroundColor: colors.primaryLight,
  },
  menuItemText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "600",
  },
  menuItemTextActive: {
    color: colors.primaryDark,
  },
  signOutButton: {
    alignItems: "center",
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
    paddingHorizontal: 14,
    paddingTop: 20,
  },
  signOutText: {
    color: colors.error,
    fontSize: 15,
    fontWeight: "700",
  },
});
