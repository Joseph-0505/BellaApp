import React from "react";

import {
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";

import { colors } from "../../global/colors";
import { styles } from "./styles";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;

  icon?: keyof typeof Ionicons.glyphMap;

  rightIcon?: keyof typeof Ionicons.glyphMap;
  onPressRightIcon?: () => void;
}

export function Input({
  label,
  error,
  icon,
  rightIcon,
  onPressRightIcon,
  editable = true,
  ...rest
}: InputProps) {
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View style={[styles.inputContainer, error ? styles.inputError : null]}>
        {icon && (
          <Ionicons
            name={icon}
            size={21}
            color={colors.primary}
            style={styles.icon}
          />
        )}

        <TextInput
          {...rest}
          style={styles.input}
          placeholderTextColor={colors.placeholder}
          editable={editable}
        />

        {rightIcon && (
          <TouchableOpacity onPress={onPressRightIcon} activeOpacity={0.7}>
            <Ionicons name={rightIcon} size={22} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}
