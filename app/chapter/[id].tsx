import { ScrollView, Text, View, TouchableOpacity, Image, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

type ViewMode = "screenplay" | "scenes";

export default function ChapterScreen() {
  const colors = useColors();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const chapterId = id as string;
  const [viewMode, setViewMode] = useState<ViewMode>("screenplay");

  const data = useQuery(api.studio.getChapterById, chapterId ? { id: chapterId as any } : "skip");
  const isLoading = data === undefined;

  if (isLoading) {
    return (
      <ScreenContainer>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  if (!data) {
    return (
      <ScreenContainer>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
          <Text style={{ color: colors.foreground, fontSize: 18, fontWeight: "700" }}>Chapter Not Found</Text>
          <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 12 }}>
            <Text style={{ color: colors.primary }}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  const { chapter, scenes } = data;

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      {/* Header */}
      <View
        style={{
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 12,
          backgroundColor: colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
            <IconSymbol name="chevron.left" size={22} color={colors.primary} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.muted, fontSize: 12 }}>Chapter {chapter.chapterNumber}</Text>
            <Text style={{ color: colors.foreground, fontSize: 17, fontWeight: "700" }} numberOfLines={1}>
              {chapter.title}
            </Text>
          </View>
        </View>

        {/* View mode toggle */}
        <View
          style={{
            flexDirection: "row",
            backgroundColor: colors.background,
            borderRadius: 10,
            padding: 3,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          {(["screenplay", "scenes"] as ViewMode[]).map((mode) => (
            <TouchableOpacity
              key={mode}
              onPress={() => setViewMode(mode)}
              style={{
                flex: 1,
                paddingVertical: 7,
                borderRadius: 8,
                alignItems: "center",
                backgroundColor: viewMode === mode ? colors.primary : "transparent",
              }}
            >
              <Text
                style={{
                  color: viewMode === mode ? "#FDF6EE" : colors.muted,
                  fontSize: 13,
                  fontWeight: "700",
                  textTransform: "capitalize",
                }}
              >
                {mode === "screenplay" ? "Screenplay" : "Visual Scenes"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* ── Screenplay View ── */}
        {viewMode === "screenplay" && (
          <View>
            {chapter.screenplay ? (
              <View
                style={{
                  backgroundColor: "#FEFCF7",
                  borderRadius: 12,
                  padding: 20,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Text
                  style={{
                    color: "#2D1B0E",
                    fontSize: 13,
                    lineHeight: 22,
                    fontFamily: "monospace",
                  }}
                >
                  {chapter.screenplay}
                </Text>
              </View>
            ) : (
              <View style={{ alignItems: "center", paddingVertical: 48 }}>
                <IconSymbol name="doc.text.fill" size={40} color={colors.muted} />
                <Text style={{ color: colors.muted, fontSize: 15, marginTop: 12, textAlign: "center" }}>
                  {chapter.status === "pending"
                    ? "Screenplay not yet written. The AI will generate it during production."
                    : "Screenplay is being written..."}
                </Text>
                {chapter.status !== "pending" && (
                  <ActivityIndicator color={colors.primary} style={{ marginTop: 12 }} />
                )}
              </View>
            )}
          </View>
        )}

        {/* ── Visual Scenes View ── */}
        {viewMode === "scenes" && (
          <View>
            {scenes.length === 0 ? (
              <View style={{ alignItems: "center", paddingVertical: 48 }}>
                <IconSymbol name="photo.fill" size={40} color={colors.muted} />
                <Text style={{ color: colors.muted, fontSize: 15, marginTop: 12, textAlign: "center" }}>
                  Visual scenes will appear after the screenplay is written and directed.
                </Text>
              </View>
            ) : (
              scenes.map((scene) => (
                <View
                  key={scene.id}
                  style={{
                    backgroundColor: colors.surface,
                    borderRadius: 14,
                    overflow: "hidden",
                    marginBottom: 16,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  {/* Keyframe image */}
                  {scene.keyframeImageUrl ? (
                    <Image
                      source={{ uri: scene.keyframeImageUrl }}
                      style={{ width: "100%", height: 200 }}
                      resizeMode="cover"
                    />
                  ) : (
                    <View
                      style={{
                        width: "100%",
                        height: 160,
                        backgroundColor: colors.border,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {scene.status === "generating_keyframe" ? (
                        <ActivityIndicator color={colors.primary} />
                      ) : (
                        <IconSymbol name="photo.fill" size={32} color={colors.muted} />
                      )}
                    </View>
                  )}

                  <View style={{ padding: 14 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                      <Text style={{ color: colors.primary, fontSize: 12, fontWeight: "700" }}>
                        SCENE {scene.sceneNumber}
                      </Text>
                      <Text style={{ color: colors.muted, fontSize: 11 }}>
                        {scene.status?.toUpperCase()}
                      </Text>
                    </View>

                    {scene.slugline && (
                      <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: "700", marginBottom: 6, fontFamily: "monospace" }}>
                        {scene.slugline}
                      </Text>
                    )}

                    {scene.actionLines && (
                      <Text style={{ color: colors.muted, fontSize: 13, lineHeight: 19, marginBottom: 8 }} numberOfLines={4}>
                        {scene.actionLines}
                      </Text>
                    )}

                    {scene.dialogue && (
                      <View
                        style={{
                          backgroundColor: colors.primary + "12",
                          borderLeftWidth: 3,
                          borderLeftColor: colors.primary,
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                          borderRadius: 4,
                        }}
                      >
                        <Text style={{ color: colors.foreground, fontSize: 13, fontStyle: "italic", lineHeight: 19 }} numberOfLines={3}>
                          {scene.dialogue}
                        </Text>
                      </View>
                    )}

                    {scene.visualPrompt && (
                      <View style={{ marginTop: 10 }}>
                        <Text style={{ color: colors.muted, fontSize: 11, fontWeight: "600", marginBottom: 4 }}>
                          VISUAL PROMPT
                        </Text>
                        <Text style={{ color: colors.muted, fontSize: 12, lineHeight: 17 }} numberOfLines={3}>
                          {scene.visualPrompt}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
