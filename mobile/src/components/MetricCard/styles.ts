import { StyleSheet } from "react-native";

import { colors } from "../../global/colors";

export const styles = StyleSheet.create({
  card: {
    width: "48%",
    minHeight: 122,
    padding: 14,
    marginBottom: 12,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  icon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  primaryIcon: { backgroundColor: colors.primaryLight },
  greenIcon: { backgroundColor: "#E5F3EA" },
  neutralIcon: { backgroundColor: "#F1F1F1" },
  value: { color: colors.text, fontSize: 24, fontWeight: "700" },
  label: { color: colors.textSecondary, fontSize: 12, marginTop: 3 },
});
