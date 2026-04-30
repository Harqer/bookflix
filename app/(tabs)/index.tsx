import { View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator } from "react-native";
import { Button } from "@/components/ui/Button";
import { Play, Info } from "lucide-react-native";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "expo-router";

export default function HomeFeed() {
  const router = useRouter();
  const books = useQuery(api.studio.listBooks) || [];
  const inProduction = books.filter(b => b.status !== 'complete');
  const masterpieces = books.filter(b => b.status === 'complete');

  return (
    <ScrollView className="flex-1 bg-black">
      {/* Hero Section */}
      <View className="relative w-full h-[550px]">
        <Image
          source={{ uri: "https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?q=80&w=2070&auto=format&fit=crop" }}
          className="absolute w-full h-full opacity-60"
          resizeMode="cover"
        />
        
        <View className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

        <View className="absolute bottom-0 w-full px-6 pb-10 items-center">
          <Text className="text-white text-5xl font-extrabold tracking-tighter mb-2 text-center shadow-lg">
            THE BOOKFLIX
          </Text>
          <Text className="text-zinc-300 text-sm font-medium mb-6 text-center max-w-[280px]">
            Cinematic AI Masterpiece • Sci-Fi • 4K HDR
          </Text>

          <View className="flex flex-row space-x-4 w-full justify-center">
            <Button
              label="Play Movie"
              variant="default"
              className="flex-1 max-w-[160px]"
              onPress={() => masterpieces[0] && router.push(`/book/${masterpieces[0]._id}` as any)}
            />
            <Button
              label="More Info"
              variant="secondary"
              className="flex-1 max-w-[160px]"
            />
          </View>
        </View>
      </View>

      {/* Horizontal Carousels */}
      <View className="px-4 py-8 pb-20 space-y-8">
        {/* Your Masterpieces */}
        {masterpieces.length > 0 && (
          <View>
            <Text className="text-white text-xl font-bold mb-3 tracking-tight">
              Your Masterpieces
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {masterpieces.map((book) => (
                <TouchableOpacity
                  key={book._id}
                  onPress={() => router.push(`/book/${book._id}` as any)}
                  className="w-28 h-40 bg-zinc-800 rounded-md overflow-hidden mr-3"
                >
                  <Image
                    source={{
                      uri: `https://images.unsplash.com/photo-1616530940355-351fabd9524b?q=80&w=600&auto=format&fit=crop&sig=${book._id}`,
                    }}
                    className="w-full h-full opacity-80"
                    resizeMode="cover"
                  />
                  <View className="absolute bottom-0 w-full bg-black/60 p-1">
                    <Text className="text-white text-[10px] font-bold" numberOfLines={1}>{book.title}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Global Trending (Mocks for catalog feel) */}
        {[
          "Trending Now",
          "Science Fiction",
        ].map((category, index) => (
          <View key={category}>
            <Text className="text-white text-xl font-bold mb-3 tracking-tight">
              {category}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {[1, 2, 3, 4, 5].map((item) => (
                <View key={item} className="w-28 h-40 bg-zinc-800 rounded-md overflow-hidden mr-3">
                  <Image
                    source={{
                      uri: `https://images.unsplash.com/photo-1616530940355-351fabd9524b?q=80&w=600&auto=format&fit=crop&sig=${index * 10 + item}`,
                    }}
                    className="w-full h-full opacity-80"
                    resizeMode="cover"
                  />
                </View>
              ))}
            </ScrollView>
          </View>
        ))}

        {/* In Production Queue */}
        <View className="pt-4">
          <Text className="text-white text-xl font-bold mb-3 tracking-tight">
            In Production
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {inProduction.length > 0 ? (
              inProduction.map((book) => (
                <View
                  key={book._id}
                  className="w-28 h-40 bg-zinc-900 rounded-md border border-zinc-800 flex items-center justify-center mr-3 p-2"
                >
                  <ActivityIndicator size="small" color="#E50914" />
                  <Text className="text-zinc-300 font-bold text-[10px] mt-2 text-center" numberOfLines={2}>
                    {book.title}
                  </Text>
                  <Text className="text-zinc-500 font-medium text-[8px] mt-1 uppercase">
                    {book.status}
                  </Text>
                </View>
              ))
            ) : (
              <View className="w-full items-center py-4">
                <Text className="text-zinc-600 text-xs italic">No movies currently in production</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </ScrollView>
  );
}
