import { StyleSheet } from "react-native";

import { colors } from "../../global/colors";

export const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    flexDirection: "row",
    minHeight: 68,
    paddingVertical: 11,
  },
  divider: { borderBottomColor: colors.border, borderBottomWidth: 1 },
  icon: {
    alignItems: "center",
    backgroundColor: colors.primaryLight,
    borderRadius: 13,
    height: 40,
    justifyContent: "center",
    marginRight: 12,
    width: 40,
  },
  copy: { flex: 1, minWidth: 0 },
  label: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.35,
    textTransform: "uppercase",
  },
  value: { color: colors.text, fontSize: 14, fontWeight: "600", marginTop: 4 },
});
