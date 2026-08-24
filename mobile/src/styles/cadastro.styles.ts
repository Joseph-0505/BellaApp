import { StyleSheet } from "react-native";

import { colors } from "../global/colors";

export const styles = StyleSheet.create({
  keyboard: {
    flex: 1,
    backgroundColor: colors.background,
  },

  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 25,
    paddingBottom: 40,
    backgroundColor: colors.background,
  },

  backButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    marginBottom: 15,
  },

  header: {
    alignItems: "center",
    marginBottom: 32,
  },

  title: {
    fontSize: 30,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
  },

  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 8,
    paddingHorizontal: 20,
  },

  form: {
    width: "100%",
  },

  successMessage: {
    color: colors.success,
    fontSize: 13,
    marginBottom: 16,
  },

  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 28,
  },

  footerText: {
    fontSize: 14,
    color: colors.textSecondary,
  },

  loginText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
    marginLeft: 5,
  },
});
