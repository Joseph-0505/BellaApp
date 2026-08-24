import { StyleSheet } from "react-native";

import { colors } from "../../global/colors";

export const styles = StyleSheet.create({
  button: {
    width: "100%",
    height: 56,

    backgroundColor: colors.primary,

    borderRadius: 16,

    alignItems: "center",
    justifyContent: "center",
  },

  title: {
    color: colors.white,
    fontSize: 17,
    fontWeight: "600",
  },

  disabled: {
    opacity: 0.6,
  },
});
