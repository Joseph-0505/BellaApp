import { StyleSheet } from "react-native";

import { colors } from "../../global/colors";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    backgroundColor: colors.background,
  },
  message: {
    marginTop: 14,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
  },
});
