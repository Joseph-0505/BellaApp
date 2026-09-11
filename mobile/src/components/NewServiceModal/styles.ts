import { StyleSheet } from "react-native";

import { colors } from "../../global/colors";

export const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end" },
  backdrop: {
    backgroundColor: "rgba(37, 37, 37, 0.34)",
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: "90%",
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  handle: {
    alignSelf: "center",
    backgroundColor: colors.border,
    borderRadius: 3,
    height: 5,
    marginBottom: 18,
    width: 44,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  headerCopy: { flex: 1 },
  eyebrow: {
    color: colors.primaryDark,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  title: { color: colors.text, fontSize: 24, fontWeight: "700", marginTop: 3 },
  closeButton: {
    alignItems: "center",
    backgroundColor: colors.primaryLight,
    borderRadius: 18,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  form: { paddingBottom: 6, paddingTop: 7 },
  description: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 20,
  },
  requestError: {
    color: colors.error,
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 14,
    marginTop: -4,
    textAlign: "center",
  },
});
