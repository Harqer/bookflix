import { Text } from "react-native";
import { useColors } from "@/hooks/use-colors";

export function StatusBadge({ status }: { status: string }) {
  const colors = useColors();
  const config: Record<string, { label: string; color: string }> = {
    pending:    { label: "Queued",     color: colors.muted },
    analyzing:  { label: "Analyzing",  color: colors.warning },
    scripting:  { label: "Scripting",  color: colors.primary },
    directing:  { label: "Directing",  color: colors.accent },
    filming:    { label: "Filming",    color: colors.gold },
    assembling: { label: "Assembling", color: colors.success },
    complete:   { label: "Complete",   color: colors.success },
    error:      { label: "Error",      color: colors.error },
  };
  const c = config[status] || config.pending;
  return (
    <Text style={{ color: c.color, fontSize: 11, fontWeight: "700" }}>
      {c.label.toUpperCase()}
    </Text>
  );
}
