import { ScrollView, Text, View, Pressable, FlatList } from "react-native";
import { useRouter } from "expo-router";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeIn, FadeInDown, Layout } from "react-native-reanimated";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

// ─── Movie Poster ─────────────────────────────────────────────────────────────

function MoviePoster({ book, index, onPress }: { book: any; index: number; onPress: () => void }) {
  const progress = book.status === "complete" ? 100 : Math.round((book.analyzedChapters / Math.max(book.chapterCount, 1)) * 100);

  return (
    <Animated.View entering={FadeInDown.delay(index * 100).duration(600)}>
      <Pressable
        onPress={onPress}
        className="w-[140px] mr-3 active:scale-95 transition-transform"
      >
        <View className="w-[140px] h-[200px] rounded-lg overflow-hidden bg-surface">
          <Image
            source={{ uri: book.coverImageUrl || "https://images.unsplash.com/photo-1543004218-ee141104308a?auto=format&fit=crop&q=80&w=300" }}
            className="w-full h-full"
            contentFit="cover"
          />
          {book.status !== "complete" && (
            <View className="absolute bottom-0 left-0 right-0 h-1 bg-white/30">
              <View 
                className="h-full bg-primary" 
                style={{ width: `${progress}%` }} 
              />
            </View>
          )}
        </View>
        <Text className="text-foreground text-[13px] font-semibold mt-2" numberOfLines={1}>
          {book.title}
        </Text>
        <Text className="text-muted text-[11px]" numberOfLines={1}>
          {book.author}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

// ─── Home Screen ──────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const router = useRouter();
  const books = useQuery(api.studio.listBooks);
  const isLoading = books === undefined;

  const inProduction = books?.filter((b) => !["complete", "error", "pending"].includes(b.status)) || [];
  const completed = books?.filter((b) => b.status === "complete") || [];

  const heroImage = "https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?auto=format&fit=crop&q=80&w=1200";

  if (isLoading) {
    return (
      <View className="flex-1 bg-black justify-center items-center">
        <Animated.View entering={FadeIn.duration(1000)} className="items-center">
          <View className="w-12 h-12 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <Text className="text-muted mt-4 font-semibold tracking-widest">INGESTING REALITY...</Text>
        </Animated.View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero Section ── */}
        <Animated.View entering={FadeIn.duration(1200)} className="h-[500px] w-full">
          <Image
            source={{ uri: heroImage }}
            className="w-full h-full"
            contentFit="cover"
          />
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.6)", "#000"]}
            className="absolute bottom-0 left-0 right-0 h-[300px]"
          />
          <View className="absolute bottom-10 left-0 right-0 items-center px-5">
            <Animated.Text 
              entering={FadeInDown.delay(400).duration(800)}
              className="text-white text-[14px] font-bold tracking-[2px] mb-2"
            >
              ORIGINAL ADAPTATION
            </Animated.Text>
            <Animated.Text 
              entering={FadeInDown.delay(600).duration(800)}
              className="text-white text-[42px] font-black text-center shadow-lg"
            >
              THE LOST CHRONICLES
            </Animated.Text>
            <Animated.Text 
              entering={FadeInDown.delay(800).duration(800)}
              className="text-gray-300 text-[16px] font-semibold mt-3 text-center"
            >
              Mystery · Fantasy · Epic
            </Animated.Text>
            <Animated.View 
              entering={FadeInDown.delay(1000).duration(800)}
              className="flex-row mt-6 space-x-3"
            >
              <Pressable
                onPress={() => router.push("/submit" as any)}
                className="bg-white px-6 py-3 rounded-sm flex-row items-center space-x-2 active:bg-gray-200"
              >
                <IconSymbol name="play.fill" size={20} color="#000" />
                <Text className="text-black text-[16px] font-bold">Play</Text>
              </Pressable>
              <Pressable
                className="bg-gray-600/80 px-6 py-3 rounded-sm flex-row items-center space-x-2 active:bg-gray-700"
              >
                <IconSymbol name="info.circle" size={20} color="#FFF" />
                <Text className="text-white text-[16px] font-bold">More Info</Text>
              </Pressable>
            </Animated.View>
          </View>
        </Animated.View>

        {/* ── Content Rows ── */}
        <View className="mt-[-20px]">
          {/* Continue Watching (In Production) */}
          {inProduction.length > 0 && (
            <Animated.View layout={Layout.springify()} className="pl-5 mb-7">
              <Text className="text-white text-[18px] font-bold mb-4">
                Continue Watching
              </Text>
              <FlatList
                data={inProduction}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item._id}
                renderItem={({ item, index }) => (
                  <MoviePoster index={index} book={item} onPress={() => router.push(`/book/${item._id}` as any)} />
                )}
              />
            </Animated.View>
          )}

          {/* Trending Now */}
          <Animated.View layout={Layout.springify()} className="pl-5 mb-7">
            <Text className="text-white text-[18px] font-bold mb-4">
              Trending Now
            </Text>
            <FlatList
              data={books || []}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item._id}
              renderItem={({ item, index }) => (
                <MoviePoster index={index} book={item} onPress={() => router.push(`/book/${item._id}` as any)} />
              )}
            />
          </Animated.View>

          {/* New Releases */}
          <Animated.View layout={Layout.springify()} className="pl-5 mb-7">
            <Text className="text-white text-[18px] font-bold mb-4">
              New Releases
            </Text>
            <FlatList
              data={[...(books || [])].reverse()}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item._id}
              renderItem={({ item, index }) => (
                <MoviePoster index={index} book={item} onPress={() => router.push(`/book/${item._id}` as any)} />
              )}
            />
          </Animated.View>
        </View>
      </ScrollView>
    </View>
  );
}


