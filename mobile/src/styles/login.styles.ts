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
    paddingTop: 70,
    paddingBottom: 32,

    backgroundColor: colors.background,
  },

  header: {
    alignItems: "center",
    marginBottom: 48,
  },

  logo: {
    width: 180,
    height: 100,
    marginBottom: 24,
  },

  title: {
    fontSize: 26,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
  },

  subtitle: {
    fontSize: 15,
    lineHeight: 22,

    color: colors.textSecondary,

    textAlign: "center",

    marginTop: 10,
    paddingHorizontal: 20,
  },

  form: {
    width: "100%",
  },

  forgotContainer: {
    alignSelf: "flex-end",

    marginTop: -4,
    marginBottom: 28,
  },

  errorMessage: {
    color: colors.error,
    fontSize: 13,
    marginBottom: 16,
  },

  forgot: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "500",
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

  createAccount: {
    fontSize: 14,
    fontWeight: "600",

    color: colors.primary,

    marginLeft: 5,
  },
});
