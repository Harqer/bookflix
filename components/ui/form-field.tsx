import { Text, TextInput } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useColors } from "@/hooks/use-colors";

export function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
  maxLength,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  maxLength?: number;
  keyboardType?: "default" | "email-address";
}) {
  const colors = useColors();
  return (
    <Animated.View entering={FadeIn.duration(400)} style={{ marginBottom: 16 }}>
      <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: "600", marginBottom: 6 }}>
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        multiline={multiline}
        maxLength={maxLength}
        keyboardType={keyboardType}
        returnKeyType={multiline ? "default" : "done"}
        style={{
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 12,
          paddingHorizontal: 14,
          paddingVertical: 12,
          color: colors.foreground,
          fontSize: 15,
          minHeight: multiline ? 160 : undefined,
          textAlignVertical: multiline ? "top" : "center",
        }}
      />
      {maxLength && (
        <Text style={{ color: colors.muted, fontSize: 11, textAlign: "right", marginTop: 4 }}>
          {value.length.toLocaleString()} / {maxLength.toLocaleString()}
        </Text>
      )}
    </Animated.View>
  );
}
