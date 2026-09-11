import { StyleSheet } from "react-native";

import { colors } from "../../global/colors";

export const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    paddingRight: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  timeColumn: { width: 52, alignItems: "flex-start" },
  time: { color: colors.text, fontSize: 14, fontWeight: "700" },
  timeLine: {
    width: 3,
    height: 22,
    borderRadius: 2,
    backgroundColor: colors.primary,
    marginTop: 8,
  },
  content: { flex: 1, marginHorizontal: 10 },
  heading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6,
  },
  client: { flex: 1, color: colors.text, fontSize: 15, fontWeight: "700" },
  status: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: "#E5F3EA",
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginRight: 4,
    backgroundColor: colors.success,
  },
  statusText: { color: colors.success, fontSize: 10, fontWeight: "600" },
  service: { color: colors.textSecondary, fontSize: 13, marginTop: 5 },
  meta: { flexDirection: "row", alignItems: "center", marginTop: 7 },
  metaText: { color: colors.textSecondary, fontSize: 12, marginLeft: 5 },
});
