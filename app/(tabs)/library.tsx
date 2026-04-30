import { FlatList, Text, View, TouchableOpacity, Pressable, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

import { useAuth } from "@/hooks/use-auth";
import { StatusBadge } from "@/components/ui/status-badge";
import { BookListItem } from "@/components/library/book-list-item";

export default function LibraryScreen() {
  const colors = useColors();
  const router = useRouter();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "complete">("all");

  const books = useQuery(api.studio.listBooks) || [];
  const isLoading = books === undefined;
  const deleteMutation = useMutation(api.studio.deleteBook);
  const deleteBook = { mutate: ({ id }: { id: string }) => deleteMutation({ id: id as any }) };

  const filtered = (books || []).filter((b) => {
    const matchSearch = !search || b.title.toLowerCase().includes(search.toLowerCase()) || (b.author || "").toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === "all" ||
      (filter === "active" && !["complete", "error", "pending"].includes(b.status)) ||
      (filter === "complete" && b.status === "complete");
    return matchSearch && matchFilter;
  });

  const FILTERS = [
    { key: "all", label: "All" },
    { key: "active", label: "In Progress" },
    { key: "complete", label: "Complete" },
  ] as const;

  return (
    <ScreenContainer>
      {/* Header */}
      <View
        style={{
          paddingHorizontal: 20,
          paddingTop: 20,
          paddingBottom: 16,
          backgroundColor: colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <Text style={{ color: colors.foreground, fontSize: 26, fontWeight: "800", marginBottom: 14 }}>
          My Library
        </Text>

        {/* Search */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: colors.background,
            borderRadius: 12,
            paddingHorizontal: 12,
            paddingVertical: 10,
            borderWidth: 1,
            borderColor: colors.border,
            marginBottom: 12,
            gap: 8,
          }}
        >
          <IconSymbol name="magnifyingglass" size={16} color={colors.muted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search books..."
            placeholderTextColor={colors.muted}
            style={{ flex: 1, color: colors.foreground, fontSize: 15 }}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <IconSymbol name="xmark" size={14} color={colors.muted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter pills */}
        <View style={{ flexDirection: "row", gap: 8 }}>
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f.key}
              onPress={() => setFilter(f.key)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 6,
                borderRadius: 20,
                backgroundColor: filter === f.key ? colors.primary : colors.background,
                borderWidth: 1,
                borderColor: filter === f.key ? colors.primary : colors.border,
              }}
            >
              <Text
                style={{
                  color: filter === f.key ? "#FDF6EE" : colors.muted,
                  fontSize: 13,
                  fontWeight: "600",
                }}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Book list */}
      {!user ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
          <IconSymbol name="person.fill" size={48} color={colors.muted} />
          <Text style={{ color: colors.foreground, fontSize: 18, fontWeight: "700", marginTop: 16, textAlign: "center" }}>
            Sign In to View Library
          </Text>
          <Text style={{ color: colors.muted, fontSize: 14, marginTop: 8, textAlign: "center" }}>
            Your book productions are saved to your account.
          </Text>
        </View>
      ) : isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <IconSymbol name="hourglass" size={32} color={colors.muted} />
          <Text style={{ color: colors.muted, fontSize: 15, marginTop: 12 }}>Loading library...</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
          <IconSymbol name="books.vertical.fill" size={48} color={colors.muted} />
          <Text style={{ color: colors.foreground, fontSize: 18, fontWeight: "700", marginTop: 16, textAlign: "center" }}>
            {search ? "No Results" : "Library Empty"}
          </Text>
          <Text style={{ color: colors.muted, fontSize: 14, marginTop: 8, textAlign: "center" }}>
            {search ? "Try a different search term." : "Submit your first book to get started."}
          </Text>
          {!search && (
            <TouchableOpacity
              onPress={() => router.push("/submit" as any)}
              style={{
                marginTop: 20,
                backgroundColor: colors.primary,
                paddingHorizontal: 24,
                paddingVertical: 12,
                borderRadius: 12,
              }}
            >
              <Text style={{ color: "#FDF6EE", fontWeight: "700", fontSize: 15 }}>Submit a Book</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item._id)}
          renderItem={({ item }) => (
            <BookListItem
              book={item}
              onPress={() => router.push(`/book/${item._id}` as any)}
              onDelete={() => deleteBook.mutate({ id: item._id })}
            />
          )}
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </ScreenContainer>
  );
}
