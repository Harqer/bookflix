import { ScrollView, Text, View, TouchableOpacity, FlatList, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { trpc } from "@/lib/trpc";

const STAGE_LABELS: Record<string, string> = {
  book_analysis: "Analyzing Book",
  world_bible_init: "Building World Bible",
  screenplay_generation: "Writing Screenplays",
  visual_direction: "Visual Direction",
  video_production: "Generating Keyframes",
  final_assembly: "Final Assembly",
};

const CHAPTER_STATUS_COLOR: Record<string, string> = {
  pending: "#8B6E52",
  scripting: "#C2703A",
  directing: "#8B4513",
  filming: "#D4AF37",
  complete: "#5C8A4A",
  error: "#C04040",
};

export default function BookDetailScreen() {
  const colors = useColors();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const bookId = parseInt(id || "0");

  const { data, isLoading, refetch } = trpc.books.getById.useQuery(
    { id: bookId },
    { refetchInterval: 4000 },
  );

  const { data: processingData } = trpc.processing.getStatus.useQuery(
    { bookId },
    { refetchInterval: 3000 },
  );

  const cancelJob = trpc.processing.cancel.useMutation({
    onSuccess: () => refetch(),
  });

  if (isLoading) {
    return (
      <ScreenContainer>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ color: colors.muted, marginTop: 12 }}>Loading production...</Text>
        </View>
      </ScreenContainer>
    );
  }

  if (!data) {
    return (
      <ScreenContainer>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
          <IconSymbol name="exclamationmark.triangle.fill" size={48} color={colors.error} />
          <Text style={{ color: colors.foreground, fontSize: 18, fontWeight: "700", marginTop: 16 }}>
            Book Not Found
          </Text>
          <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
            <Text style={{ color: colors.primary, fontSize: 15 }}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  const { book, chapters, worldBible } = data;
  const job = processingData?.job;
  const isActive = job?.isActive;
  const progress = job?.overallProgress || (book.status === "complete" ? 100 : 0);
  const currentStage = job?.currentStage;
  const logs = (job?.logs as any[]) || [];

  const PIPELINE_STAGES = [
    "book_analysis",
    "world_bible_init",
    "screenplay_generation",
    "visual_direction",
    "video_production",
    "final_assembly",
  ];

  const currentStageIdx = currentStage ? PIPELINE_STAGES.indexOf(currentStage) : -1;

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      {/* Header */}
      <View
        style={{
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 16,
          backgroundColor: colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
        }}
      >
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <IconSymbol name="chevron.left" size={22} color={colors.primary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.foreground, fontSize: 17, fontWeight: "700" }} numberOfLines={1}>
            {book.title}
          </Text>
          <Text style={{ color: colors.muted, fontSize: 12 }}>
            {book.author} · {book.genre}
          </Text>
        </View>
        {isActive && (
          <View
            style={{
              backgroundColor: colors.warning + "22",
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 10,
            }}
          >
            <Text style={{ color: colors.warning, fontSize: 11, fontWeight: "700" }}>LIVE</Text>
          </View>
        )}
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        {/* ── Production Status Card ── */}
        <View style={{ margin: 16 }}>
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 16,
              padding: 16,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: "700" }}>
                Production Status
              </Text>
              <Text style={{ color: colors.primary, fontSize: 22, fontWeight: "800" }}>
                {progress}%
              </Text>
            </View>

            {/* Progress bar */}
            <View style={{ height: 8, backgroundColor: colors.border, borderRadius: 4, marginBottom: 12 }}>
              <View
                style={{
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: book.status === "complete" ? colors.success : colors.primary,
                  width: `${Math.min(progress, 100)}%`,
                }}
              />
            </View>

            {/* Pipeline stages */}
            <View style={{ gap: 8 }}>
              {PIPELINE_STAGES.map((stage, i) => {
                const isDone = i < currentStageIdx || book.status === "complete";
                const isCurrent = i === currentStageIdx && isActive;
                return (
                  <View key={stage} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                    <View
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 11,
                        backgroundColor: isDone ? colors.success : isCurrent ? colors.primary : colors.border,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {isDone ? (
                        <IconSymbol name="checkmark.circle.fill" size={14} color="#FDF6EE" />
                      ) : isCurrent ? (
                        <ActivityIndicator size="small" color="#FDF6EE" />
                      ) : (
                        <Text style={{ color: colors.muted, fontSize: 10, fontWeight: "700" }}>{i + 1}</Text>
                      )}
                    </View>
                    <Text
                      style={{
                        color: isDone ? colors.success : isCurrent ? colors.primary : colors.muted,
                        fontSize: 13,
                        fontWeight: isCurrent ? "700" : "500",
                      }}
                    >
                      {STAGE_LABELS[stage]}
                    </Text>
                  </View>
                );
              })}
            </View>

            {/* Cancel button */}
            {isActive && job && (
              <TouchableOpacity
                onPress={() => cancelJob.mutate({ jobId: job.id })}
                style={{
                  marginTop: 14,
                  paddingVertical: 10,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: colors.error,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: colors.error, fontSize: 14, fontWeight: "600" }}>
                  Cancel Production
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ── Live Agent Log ── */}
        {logs.length > 0 && (
          <View style={{ marginHorizontal: 16, marginBottom: 16 }}>
            <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: "700", marginBottom: 10 }}>
              Agent Activity
            </Text>
            <View
              style={{
                backgroundColor: "#1A1208",
                borderRadius: 12,
                padding: 12,
                maxHeight: 200,
              }}
            >
              <ScrollView showsVerticalScrollIndicator={false}>
                {logs.slice(-20).reverse().map((entry: any, i: number) => (
                  <View key={i} style={{ flexDirection: "row", gap: 8, marginBottom: 4 }}>
                    <Text style={{ color: entry.level === "error" ? "#E06060" : entry.level === "success" ? "#7AB060" : entry.level === "warning" ? "#F0B050" : "#A08060", fontSize: 11, fontFamily: "monospace", minWidth: 60 }}>
                      [{entry.agent?.slice(0, 8)}]
                    </Text>
                    <Text style={{ color: "#F5E6D0", fontSize: 11, flex: 1, fontFamily: "monospace" }} numberOfLines={2}>
                      {entry.message}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          </View>
        )}

        {/* ── Chapters ── */}
        <View style={{ marginHorizontal: 16, marginBottom: 16 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: "700" }}>
              Chapters ({chapters.length})
            </Text>
          </View>

          {chapters.length === 0 ? (
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: 12,
                padding: 20,
                alignItems: "center",
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <IconSymbol name="hourglass" size={28} color={colors.muted} />
              <Text style={{ color: colors.muted, fontSize: 14, marginTop: 8, textAlign: "center" }}>
                Chapters will appear as the AI analyzes your book.
              </Text>
            </View>
          ) : (
            chapters.map((chapter) => (
              <TouchableOpacity
                key={chapter.id}
                onPress={() => router.push(`/chapter/${chapter.id}` as any)}
                activeOpacity={0.8}
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 12,
                  padding: 14,
                  marginBottom: 8,
                  borderWidth: 1,
                  borderColor: colors.border,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: (CHAPTER_STATUS_COLOR[chapter.status] || colors.muted) + "22",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {chapter.status === "complete" ? (
                    <IconSymbol name="play.fill" size={16} color={CHAPTER_STATUS_COLOR[chapter.status]} />
                  ) : (
                    <Text style={{ color: CHAPTER_STATUS_COLOR[chapter.status] || colors.muted, fontSize: 13, fontWeight: "800" }}>
                      {chapter.chapterNumber}
                    </Text>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: "600" }} numberOfLines={1}>
                    {chapter.title}
                  </Text>
                  <Text style={{ color: colors.muted, fontSize: 12, marginTop: 2 }}>
                    {(chapter.wordCount || 0).toLocaleString()} words · {chapter.status}
                  </Text>
                </View>
                {chapter.status === "complete" && (
                  <IconSymbol name="chevron.right" size={16} color={colors.muted} />
                )}
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* ── World Bible Summary ── */}
        {worldBible && (
          <View style={{ marginHorizontal: 16 }}>
            <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: "700", marginBottom: 10 }}>
              World Bible
            </Text>
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: 14,
                padding: 16,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <View style={{ flexDirection: "row", gap: 16, marginBottom: 12 }}>
                {[
                  { label: "Characters", value: Object.keys(worldBible.characters as any || {}).length, icon: "person.fill" as const },
                  { label: "Locations", value: Object.keys(worldBible.locations as any || {}).length, icon: "globe.americas.fill" as const },
                  { label: "Events", value: (worldBible.timeline as any[] || []).length, icon: "clock.fill" as const },
                ].map((stat) => (
                  <View key={stat.label} style={{ flex: 1, alignItems: "center" }}>
                    <IconSymbol name={stat.icon} size={20} color={colors.primary} />
                    <Text style={{ color: colors.foreground, fontSize: 20, fontWeight: "800", marginTop: 4 }}>
                      {stat.value}
                    </Text>
                    <Text style={{ color: colors.muted, fontSize: 11 }}>{stat.label}</Text>
                  </View>
                ))}
              </View>
              {worldBible.era && (
                <Text style={{ color: colors.muted, fontSize: 13 }}>
                  <Text style={{ fontWeight: "600" }}>Era: </Text>{worldBible.era}
                  {worldBible.tone ? `  ·  Tone: ${worldBible.tone}` : ""}
                </Text>
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
