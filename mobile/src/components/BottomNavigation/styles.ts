import { StyleSheet } from "react-native";

import { colors } from "../../global/colors";

export const styles = StyleSheet.create({
  navigation: {
    alignItems: "flex-start",
    backgroundColor: colors.surface,
    borderTopColor: "#F1E3E4",
    borderTopWidth: 1,
    elevation: 12,
    flexDirection: "row",
    paddingHorizontal: 4,
    paddingTop: 7,
    shadowColor: colors.text,
    shadowOffset: { height: -3, width: 0 },
    shadowOpacity: 0.07,
    shadowRadius: 9,
  },
  navigationItem: { alignItems: "center", flex: 1, minHeight: 49 },
  iconBox: {
    alignItems: "center",
    borderRadius: 12,
    height: 29,
    justifyContent: "center",
    minWidth: 34,
    paddingHorizontal: 7,
  },
  iconBoxActive: { backgroundColor: colors.primaryLight },
  navigationLabel: {
    color: colors.textSecondary,
    fontSize: 9,
    fontWeight: "600",
    marginTop: 2,
  },
  navigationLabelActive: { color: colors.primaryDark, fontWeight: "800" },
});
