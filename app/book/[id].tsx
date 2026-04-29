import { ScrollView, Text, View, Pressable, FlatList, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeIn, FadeInDown, Layout } from "react-native-reanimated";

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
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  
  const book = useQuery(api.studio.getBook, { id: id as Id<"books"> });
  const chapters = useQuery(api.studio.listChapters, { bookId: id as Id<"books"> });
  const isLoading = book === undefined || chapters === undefined;

  if (isLoading) {
    return (
      <View className="flex-1 bg-black justify-center items-center">
        <ActivityIndicator size="large" color="#E50914" />
        <Text className="text-muted mt-4 font-semibold tracking-widest uppercase">Initializing Agentic Hub...</Text>
      </View>
    );
  }

  if (!book) {
    return (
      <View className="flex-1 bg-black justify-center items-center px-6">
        <IconSymbol name="exclamationmark.triangle.fill" size={48} color="#E50914" />
        <Text className="text-white text-lg font-bold mt-4">Book Not Found</Text>
        <Pressable onPress={() => router.back()} className="mt-4">
          <Text className="text-primary text-base">Return to Studio</Text>
        </Pressable>
      </View>
    );
  }

  const progress = book.status === "complete" ? 100 : Math.round((book.analyzedChapters / Math.max(book.chapterCount, 1)) * 100);

  return (
    <View className="flex-1 bg-black">
      {/* Header */}
      <View className="px-5 pt-12 pb-4 border-b border-white/10 flex-row items-center space-x-3">
        <Pressable onPress={() => router.back()} className="p-1">
          <IconSymbol name="chevron.left" size={24} color="#E50914" />
        </Pressable>
        <View className="flex-1">
          <Text className="text-white text-lg font-bold" numberOfLines={1}>
            {book.title}
          </Text>
          <Text className="text-muted text-[12px] uppercase tracking-tighter">
            {book.author} · {book.genre}
          </Text>
        </View>
        <View className="bg-primary/20 px-2 py-1 rounded-full">
          <Text className="text-primary text-[10px] font-black uppercase">Directing</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        {/* ── Production Status Card ── */}
        <Animated.View entering={FadeInDown.duration(600)} className="m-4">
          <View className="bg-surface rounded-2xl p-4 border border-white/10 shadow-xl">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-white text-base font-bold">Production Status</Text>
              <Text className="text-primary text-2xl font-black">{progress}%</Text>
            </View>

            {/* Progress bar */}
            <View className="h-2 bg-white/10 rounded-full mb-6 overflow-hidden">
              <View
                className="h-full bg-primary rounded-full"
                style={{ width: `${progress}%` }}
              />
            </View>

            {/* Pipeline stages */}
            <View className="space-y-3">
              {Object.keys(STAGE_LABELS).map((stage, i) => {
                const isDone = progress === 100 || (i < 2 && book.analyzedChapters > 0);
                const isCurrent = !isDone && i === (book.analyzedChapters > 0 ? 1 : 0);
                return (
                  <View key={stage} className="flex-row items-center space-x-3">
                    <View className={`w-5 h-5 rounded-full items-center justify-center ${isDone ? 'bg-success' : isCurrent ? 'bg-primary' : 'bg-white/10'}`}>
                      {isDone ? (
                        <IconSymbol name="checkmark.circle.fill" size={14} color="#000" />
                      ) : (
                        <Text className="text-white text-[10px] font-bold">{i + 1}</Text>
                      )}
                    </View>
                    <Text className={`text-[13px] ${isDone ? 'text-success' : isCurrent ? 'text-primary font-bold' : 'text-muted'}`}>
                      {STAGE_LABELS[stage]}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        </Animated.View>

        {/* ── Chapters ── */}
        <View className="mx-4 mb-4">
          <Text className="text-white text-base font-bold mb-3">Chapters ({chapters?.length || 0})</Text>
          
          {!chapters || chapters.length === 0 ? (
            <View className="bg-surface rounded-xl p-6 items-center border border-white/5">
              <ActivityIndicator size="small" color="#E50914" />
              <Text className="text-muted text-sm mt-3 text-center">Ingesting manuscript...</Text>
            </View>
          ) : (
            chapters.map((chapter, i) => (
              <Animated.View key={chapter._id} entering={FadeInDown.delay(i * 50)}>
                <Pressable
                  onPress={() => router.push(`/chapter/${chapter._id}` as any)}
                  className="bg-surface rounded-xl p-4 mb-2 border border-white/10 flex-row items-center space-x-4 active:bg-white/5"
                >
                  <View className={`w-10 h-10 rounded-full items-center justify-center bg-white/5`}>
                    {chapter.status === "complete" ? (
                      <IconSymbol name="play.fill" size={16} color="#E50914" />
                    ) : (
                      <Text className="text-primary text-[14px] font-black">{chapter.chapterNumber}</Text>
                    )}
                  </View>
                  <View className="flex-1">
                    <Text className="text-white text-[14px] font-semibold" numberOfLines={1}>
                      {chapter.title || `Chapter ${chapter.chapterNumber}`}
                    </Text>
                    <Text className="text-muted text-[11px] mt-1">
                      {chapter.wordCount ? `${chapter.wordCount.toLocaleString()} words · ` : ""}{chapter.status}
                    </Text>
                  </View>
                  {chapter.status === "complete" && (
                    <IconSymbol name="chevron.right" size={16} color="rgba(255,255,255,0.3)" />
                  )}
                </Pressable>
              </Animated.View>
            ))
          )}
        </View>

        {/* ── Summary ── */}
        {book.summary && (
          <Animated.View entering={FadeInDown.delay(300)} className="mx-4 mb-4">
            <Text className="text-white text-base font-bold mb-3">World Ingestion Summary</Text>
            <View className="bg-surface rounded-xl p-4 border border-white/10">
              <Text className="text-gray-300 text-[13px] leading-5">
                {book.summary}
              </Text>
              {(book.era || book.tone) && (
                <View className="flex-row mt-3 pt-3 border-t border-white/5">
                  <Text className="text-primary text-[11px] font-bold uppercase tracking-wider">
                    {book.era} · {book.tone}
                  </Text>
                </View>
              )}
            </View>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}
