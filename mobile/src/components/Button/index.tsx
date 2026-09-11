import React from "react";

import {
    ActivityIndicator,
    Text,
    TouchableOpacity,
    TouchableOpacityProps,
} from "react-native";

import { colors } from "../../global/colors";
import { styles } from "./styles";

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  loading?: boolean;
  variant?: "danger" | "primary";
}

export function Button({
  title,
  loading = false,
  variant = "primary",
  disabled,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        variant === "danger" ? styles.danger : null,
        isDisabled ? styles.disabled : null,
      ]}
      activeOpacity={0.8}
      disabled={isDisabled}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={colors.white} />
      ) : (
        <Text style={styles.title}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}
