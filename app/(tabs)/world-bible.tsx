import { ScrollView, Text, View, TouchableOpacity, FlatList } from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAuth } from "@/hooks/use-auth";

type TabKey = "characters" | "locations" | "timeline";

export default function WorldBibleScreen() {
  const colors = useColors();
  const router = useRouter();
  const { user } = useAuth();
  const [selectedBookId, setSelectedBookId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("characters");

  // TODO: Migrate to Convex api.worldBible
  const books: any[] = [];
  const worldBible: any = null;

  const completedBooks = books?.filter((b) => b.status === "complete" || (b.chapterCount ?? 0) > 0) || [];

  const characters = worldBible?.characters as Record<string, any> || {};
  const locations = worldBible?.locations as Record<string, any> || {};
  const timeline = worldBible?.timeline as any[] || [];

  const TABS: { key: TabKey; label: string; icon: any }[] = [
    { key: "characters", label: "Characters", icon: "person.fill" },
    { key: "locations", label: "Locations", icon: "mappin.fill" as any },
    { key: "timeline", label: "Timeline", icon: "clock.fill" },
  ];

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
        <Text style={{ color: colors.foreground, fontSize: 26, fontWeight: "800", marginBottom: 4 }}>
          World Bible
        </Text>
        <Text style={{ color: colors.muted, fontSize: 14, marginBottom: 14 }}>
          Characters, locations & story continuity
        </Text>

        {/* Book selector */}
        {completedBooks.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 0 }}>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {completedBooks.map((book) => (
                <TouchableOpacity
                  key={book.id}
                  onPress={() => setSelectedBookId(book.id)}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 7,
                    borderRadius: 20,
                    backgroundColor: selectedBookId === book.id ? colors.primary : colors.background,
                    borderWidth: 1,
                    borderColor: selectedBookId === book.id ? colors.primary : colors.border,
                  }}
                >
                  <Text
                    style={{
                      color: selectedBookId === book.id ? "#FDF6EE" : colors.muted,
                      fontSize: 13,
                      fontWeight: "600",
                    }}
                    numberOfLines={1}
                  >
                    {book.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        )}
      </View>

      {!user ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
          <IconSymbol name="globe.americas.fill" size={48} color={colors.muted} />
          <Text style={{ color: colors.foreground, fontSize: 18, fontWeight: "700", marginTop: 16, textAlign: "center" }}>
            Sign In to View World Bible
          </Text>
        </View>
      ) : !selectedBookId ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
          <IconSymbol name="globe.americas.fill" size={48} color={colors.muted} />
          <Text style={{ color: colors.foreground, fontSize: 18, fontWeight: "700", marginTop: 16, textAlign: "center" }}>
            {completedBooks.length === 0 ? "No Books Yet" : "Select a Book"}
          </Text>
          <Text style={{ color: colors.muted, fontSize: 14, marginTop: 8, textAlign: "center" }}>
            {completedBooks.length === 0
              ? "Submit a book to see its World Bible populated by the AI."
              : "Choose a book above to explore its World Bible."}
          </Text>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          {/* Tab bar */}
          <View
            style={{
              flexDirection: "row",
              paddingHorizontal: 20,
              paddingVertical: 12,
              gap: 8,
              backgroundColor: colors.background,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}
          >
            {TABS.map((tab) => (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                style={{
                  flex: 1,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  paddingVertical: 8,
                  borderRadius: 10,
                  backgroundColor: activeTab === tab.key ? colors.primary + "18" : "transparent",
                  borderWidth: 1,
                  borderColor: activeTab === tab.key ? colors.primary + "44" : "transparent",
                }}
              >
                <IconSymbol name={tab.icon} size={15} color={activeTab === tab.key ? colors.primary : colors.muted} />
                <Text
                  style={{
                    color: activeTab === tab.key ? colors.primary : colors.muted,
                    fontSize: 13,
                    fontWeight: "700",
                  }}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
            {/* Characters */}
            {activeTab === "characters" && (
              <View>
                {Object.entries(characters).length === 0 ? (
                  <EmptyTabState icon="person.fill" message="No characters extracted yet. The AI will populate this as it processes your book." />
                ) : (
                  Object.entries(characters).map(([key, char]: [string, any]) => (
                    <View
                      key={key}
                      style={{
                        backgroundColor: colors.surface,
                        borderRadius: 14,
                        padding: 16,
                        marginBottom: 12,
                        borderWidth: 1,
                        borderColor: colors.border,
                      }}
                    >
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 10 }}>
                        <View
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: 22,
                            backgroundColor: colors.primary + "22",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <IconSymbol name="person.fill" size={22} color={colors.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: "700" }}>
                            {char.fullName || key}
                          </Text>
                          {char.aliases?.length > 0 && (
                            <Text style={{ color: colors.muted, fontSize: 12 }}>
                              aka {char.aliases.join(", ")}
                            </Text>
                          )}
                        </View>
                        <Text style={{ color: colors.muted, fontSize: 11 }}>
                          Ch. {char.firstChapter}
                        </Text>
                      </View>
                      {char.appearance && (
                        <BibleRow label="Appearance" value={char.appearance} colors={colors} />
                      )}
                      {char.personality && (
                        <BibleRow label="Personality" value={char.personality} colors={colors} />
                      )}
                      {char.arc && (
                        <BibleRow label="Arc" value={char.arc} colors={colors} />
                      )}
                    </View>
                  ))
                )}
              </View>
            )}

            {/* Locations */}
            {activeTab === "locations" && (
              <View>
                {Object.entries(locations).length === 0 ? (
                  <EmptyTabState icon="mappin.fill" message="No locations extracted yet. The AI will populate this as it processes your book." />
                ) : (
                  Object.entries(locations).map(([key, loc]: [string, any]) => (
                    <View
                      key={key}
                      style={{
                        backgroundColor: colors.surface,
                        borderRadius: 14,
                        padding: 16,
                        marginBottom: 12,
                        borderWidth: 1,
                        borderColor: colors.border,
                      }}
                    >
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 10 }}>
                        <View
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: 22,
                            backgroundColor: colors.accent + "22",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <IconSymbol name={"mappin.fill" as any} size={22} color={colors.accent} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: "700" }}>
                            {loc.name || key}
                          </Text>
                          {loc.mood && (
                            <Text style={{ color: colors.muted, fontSize: 12 }}>{loc.mood}</Text>
                          )}
                        </View>
                      </View>
                      {loc.description && (
                        <BibleRow label="Description" value={loc.description} colors={colors} />
                      )}
                    </View>
                  ))
                )}
              </View>
            )}

            {/* Timeline */}
            {activeTab === "timeline" && (
              <View>
                {timeline.length === 0 ? (
                  <EmptyTabState icon="clock.fill" message="No timeline events yet. The AI builds this chapter by chapter." />
                ) : (
                  timeline.map((event: any, i: number) => (
                    <View
                      key={i}
                      style={{
                        flexDirection: "row",
                        gap: 12,
                        marginBottom: 12,
                      }}
                    >
                      <View style={{ alignItems: "center" }}>
                        <View
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 16,
                            backgroundColor: colors.gold + "33",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Text style={{ color: colors.gold, fontSize: 11, fontWeight: "800" }}>
                            {event.chapter}
                          </Text>
                        </View>
                        {i < timeline.length - 1 && (
                          <View style={{ width: 2, flex: 1, backgroundColor: colors.border, marginTop: 4 }} />
                        )}
                      </View>
                      <View
                        style={{
                          flex: 1,
                          backgroundColor: colors.surface,
                          borderRadius: 12,
                          padding: 12,
                          borderWidth: 1,
                          borderColor: colors.border,
                          marginBottom: 4,
                        }}
                      >
                        <Text style={{ color: colors.muted, fontSize: 11, marginBottom: 4 }}>
                          Chapter {event.chapter}{event.date ? ` · ${event.date}` : ""}
                        </Text>
                        <Text style={{ color: colors.foreground, fontSize: 14, lineHeight: 20 }}>
                          {event.event}
                        </Text>
                      </View>
                    </View>
                  ))
                )}
              </View>
            )}
          </ScrollView>
        </View>
      )}
    </ScreenContainer>
  );
}

function BibleRow({ label, value, colors }: { label: string; value: string; colors: any }) {
  return (
    <View style={{ marginBottom: 6 }}>
      <Text style={{ color: colors.muted, fontSize: 11, fontWeight: "600", marginBottom: 2 }}>
        {label.toUpperCase()}
      </Text>
      <Text style={{ color: colors.foreground, fontSize: 13, lineHeight: 18 }} numberOfLines={3}>
        {value}
      </Text>
    </View>
  );
}

function EmptyTabState({ icon, message }: { icon: any; message: string }) {
  const colors = useColors();
  return (
    <View style={{ alignItems: "center", paddingVertical: 40 }}>
      <IconSymbol name={icon} size={40} color={colors.muted} />
      <Text style={{ color: colors.muted, fontSize: 14, textAlign: "center", marginTop: 12, lineHeight: 20 }}>
        {message}
      </Text>
    </View>
  );
}
