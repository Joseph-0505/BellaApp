import { StyleSheet } from "react-native";

import { colors } from "../../global/colors";

export const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginBottom: 18,
  },

  label: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.text,
    marginBottom: 8,
  },

  inputContainer: {
    width: "100%",
    height: 56,

    flexDirection: "row",
    alignItems: "center",

    backgroundColor: colors.surface,

    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,

    paddingHorizontal: 16,
  },

  input: {
    flex: 1,
    height: "100%",

    fontSize: 16,
    color: colors.text,

    paddingHorizontal: 10,
  },

  icon: {
    marginRight: 2,
  },

  inputError: {
    borderColor: colors.error,
  },

  error: {
    fontSize: 12,
    color: colors.error,
    marginTop: 5,
  },
});
