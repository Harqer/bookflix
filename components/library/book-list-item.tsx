import { Text, View, TouchableOpacity, Pressable } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { StatusBadge } from "@/components/ui/status-badge";

export function BookListItem({ book, onPress, onDelete }: { book: any; onPress: () => void; onDelete: () => void }) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        opacity: pressed ? 0.85 : 1,
        backgroundColor: colors.surface,
        borderRadius: 14,
        padding: 16,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: colors.border,
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
      })}
    >
      {/* Book icon */}
      <View
        style={{
          width: 52,
          height: 68,
          borderRadius: 8,
          backgroundColor: colors.primary + "22",
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 1,
          borderColor: colors.primary + "44",
        }}
      >
        <IconSymbol name="book.fill" size={24} color={colors.primary} />
      </View>

      {/* Info */}
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.foreground, fontSize: 15, fontWeight: "700", marginBottom: 2 }} numberOfLines={1}>
          {book.title}
        </Text>
        <Text style={{ color: colors.muted, fontSize: 12, marginBottom: 6 }} numberOfLines={1}>
          {book.author} · {book.genre}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <StatusBadge status={book.status} />
          <Text style={{ color: colors.border, fontSize: 10 }}>·</Text>
          <Text style={{ color: colors.muted, fontSize: 11 }}>
            {book.chapterCount} ch · {(book.wordCount || 0).toLocaleString()} words
          </Text>
        </View>
      </View>

      {/* Actions */}
      <View style={{ flexDirection: "row", gap: 4 }}>
        <TouchableOpacity
          onPress={onDelete}
          style={{ padding: 8 }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <IconSymbol name="trash.fill" size={16} color={colors.error} />
        </TouchableOpacity>
        <IconSymbol name="chevron.right" size={18} color={colors.muted} />
      </View>
    </Pressable>
  );
}
