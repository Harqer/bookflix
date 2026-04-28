import { ScrollView, Text, View, TouchableOpacity, FlatList, Pressable, Dimensions } from "react-native";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeIn, FadeInDown, Layout } from "react-native-reanimated";

const { width } = Dimensions.get("window");

// ─── Movie Poster ─────────────────────────────────────────────────────────────

function MoviePoster({ book, index, onPress }: { book: any; index: number; onPress: () => void }) {
  const colors = useColors();
  const progress = book.status === "complete" ? 100 : Math.round((book.chapterCount / Math.max(book.chapterCount, 1)) * 100);

  return (
    <Animated.View entering={FadeInDown.delay(index * 100).duration(600)}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => ({
          width: 140,
          marginRight: 12,
          opacity: pressed ? 0.9 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        })}
      >
        <View style={{ width: 140, height: 200, borderRadius: 8, overflow: "hidden", backgroundColor: colors.surface }}>
          <Image
            source={{ uri: book.coverImageUrl || "https://images.unsplash.com/photo-1543004218-ee141104308a?auto=format&fit=crop&q=80&w=300" }}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
          />
          {book.status !== "complete" && (
            <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 4, backgroundColor: "rgba(255,255,255,0.3)" }}>
              <View style={{ height: "100%", backgroundColor: colors.primary, width: `${progress}%` }} />
            </View>
          )}
        </View>
        <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: "600", marginTop: 8 }} numberOfLines={1}>
          {book.title}
        </Text>
        <Text style={{ color: colors.muted, fontSize: 11 }} numberOfLines={1}>
          {book.author}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

// ─── Home Screen ──────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const colors = useColors();
  const router = useRouter();
  const { user } = useAuth();
  const { data: books, isLoading } = trpc.books.list.useQuery(undefined, {
    enabled: !!user,
    refetchInterval: 5000,
  });

  const inProduction = books?.filter((b) => !["complete", "error", "pending"].includes(b.status)) || [];
  const completed = books?.filter((b) => b.status === "complete") || [];

  const heroImage = "/home/shaolin/.gemini/antigravity/brain/9224514a-aaf1-48cc-8792-5132e1ea62ef/bookflix_hero_cinematic_1777332720723.png";

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero Section ── */}
        <Animated.View entering={FadeIn.duration(1200)} style={{ height: 500, width: "100%" }}>
          <Image
            source={{ uri: heroImage }}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
          />
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.6)", "#000"]}
            style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 300 }}
          />
          <View style={{ position: "absolute", bottom: 40, left: 0, right: 0, alignItems: "center", paddingHorizontal: 20 }}>
            <Animated.Text 
              entering={FadeInDown.delay(400).duration(800)}
              style={{ color: "#FFF", fontSize: 14, fontWeight: "700", letterSpacing: 2, marginBottom: 8 }}
            >
              ORIGINAL ADAPTATION
            </Animated.Text>
            <Animated.Text 
              entering={FadeInDown.delay(600).duration(800)}
              style={{ color: "#FFF", fontSize: 42, fontWeight: "900", textAlign: "center", textShadowColor: "rgba(0,0,0,0.5)", textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 10 }}
            >
              THE LOST CHRONICLES
            </Animated.Text>
            <Animated.Text 
              entering={FadeInDown.delay(800).duration(800)}
              style={{ color: "#E5E5E5", fontSize: 16, fontWeight: "600", marginTop: 12, textAlign: "center" }}
            >
              Mystery · Fantasy · Epic
            </Animated.Text>
            <Animated.View 
              entering={FadeInDown.delay(1000).duration(800)}
              style={{ flexDirection: "row", marginTop: 24, gap: 12 }}
            >
              <TouchableOpacity
                onPress={() => router.push("/submit" as any)}
                style={{ backgroundColor: "#FFF", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 4, flexDirection: "row", alignItems: "center", gap: 8 }}
              >
                <IconSymbol name="play.fill" size={20} color="#000" />
                <Text style={{ color: "#000", fontSize: 16, fontWeight: "700" }}>Play</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ backgroundColor: "rgba(80,80,80,0.8)", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 4, flexDirection: "row", alignItems: "center", gap: 8 }}
              >
                <IconSymbol name="info.circle" size={20} color="#FFF" />
                <Text style={{ color: "#FFF", fontSize: 16, fontWeight: "700" }}>More Info</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </Animated.View>

        {/* ── Content Rows ── */}
        <View style={{ marginTop: -20 }}>
          {/* Continue Watching (In Production) */}
          {inProduction.length > 0 && (
            <Animated.View layout={Layout.springify()} style={{ paddingLeft: 20, marginBottom: 28 }}>
              <Text style={{ color: "#FFF", fontSize: 18, fontWeight: "700", marginBottom: 16 }}>
                Continue Watching
              </Text>
              <FlatList
                data={inProduction}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item, index }) => (
                  <MoviePoster index={index} book={item} onPress={() => router.push(`/book/${item.id}` as any)} />
                )}
              />
            </Animated.View>
          )}

          {/* Trending Now (Completed) */}
          <Animated.View layout={Layout.springify()} style={{ paddingLeft: 20, marginBottom: 28 }}>
            <Text style={{ color: "#FFF", fontSize: 18, fontWeight: "700", marginBottom: 16 }}>
              Trending Now
            </Text>
            <FlatList
              data={books || []}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item, index }) => (
                <MoviePoster index={index} book={item} onPress={() => router.push(`/book/${item.id}` as any)} />
              )}
            />
          </Animated.View>

          {/* New Releases */}
          <Animated.View layout={Layout.springify()} style={{ paddingLeft: 20, marginBottom: 28 }}>
            <Text style={{ color: "#FFF", fontSize: 18, fontWeight: "700", marginBottom: 16 }}>
              New Releases
            </Text>
            <FlatList
              data={[...(books || [])].reverse()}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item, index }) => (
                <MoviePoster index={index} book={item} onPress={() => router.push(`/book/${item.id}` as any)} />
              )}
            />
          </Animated.View>
        </View>
      </ScrollView>
    </View>
  );
}


