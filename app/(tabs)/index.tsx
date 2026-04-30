import { View, Text, ScrollView, Image } from "react-native";
import { Button } from "@/components/ui/Button";
import { Play, Info } from "lucide-react-native";

export default function HomeFeed() {
  return (
    <ScrollView className="flex-1 bg-black">
      {/* Hero Section */}
      <View className="relative w-full h-[550px]">
        {/* Placeholder for cinematic Hero Image */}
        <Image
          source={{ uri: "https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?q=80&w=2070&auto=format&fit=crop" }}
          className="absolute w-full h-full opacity-60"
          resizeMode="cover"
        />
        
        {/* Gradient Overlay for Netflix fade effect */}
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
              // icon={<Play size={20} color="white" />} // Icon support can be added
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
        {[
          "Trending Now",
          "Comedy",
          "Romance",
          "Science Fiction",
          "Documentary",
        ].map((category, index) => (
          <View key={category}>
            <Text className="text-white text-xl font-bold mb-3 tracking-tight">
              {category}
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="space-x-3"
            >
              {[1, 2, 3, 4, 5].map((item) => (
                <View
                  key={item}
                  className="w-28 h-40 bg-zinc-800 rounded-md overflow-hidden mr-3"
                >
                  <Image
                    source={{
                      uri: `https://images.unsplash.com/photo-1616530940355-351fabd9524b?q=80&w=600&auto=format&fit=crop&sig=${
                        index * 10 + item
                      }`,
                    }}
                    className="w-full h-full opacity-80"
                    resizeMode="cover"
                  />
                </View>
              ))}
            </ScrollView>
          </View>
        ))}

        {/* Uploaded Processing Queue */}
        <View className="pt-4">
          <Text className="text-white text-xl font-bold mb-3 tracking-tight">
            Your Generated Movies
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="space-x-3"
          >
            {[1, 2, 3].map((i) => (
              <View
                key={i}
                className="w-28 h-40 bg-zinc-900 rounded-md border border-zinc-800 flex items-center justify-center mr-3"
              >
                <Text className="text-zinc-500 font-medium text-xs">
                  Processing...
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </ScrollView>
  );
}
