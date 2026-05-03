import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

/**
 * 🎬 Cinematic Story Submission Screen
 * Purpose: Entry point for starting the narrative-to-cinematic production cycle.
 */
export default function SubmitScreen() {
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  // We call the HTTP endpoint for secure global submission
  // Or we can use the convex mutation if we aren't worried about IP spoofing in dev
  const submitBook = useMutation(api.studio.submitBookInternal);

  const handleLaunch = async () => {
    if (!title || !text) {
      Alert.alert("Incomplete Narrative", "Every cinematic masterpiece needs a title and a story.");
      return;
    }

    setLoading(true);
    try {
      // In a production enterprise app, we'd use fetch() to our /submit HTTP endpoint
      // For immediate dev testing, we'll trigger the internal mutation
      await submitBook({
        userId: "clerk-id-placeholder", // Identity handled by Convex Auth
        title,
        author: author || "Unknown Author",
        rawText: text,
      });

      Alert.alert("🚀 Production Fired", "Your story has been dispatched to the AI Studio fleet.", [
        { text: "View Pipeline", onPress: () => router.push("/videos") }
      ]);
      
      setTitle("");
      setAuthor("");
      setText("");
    } catch (err) {
      Alert.alert("Orchestration Error", String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={["#0D0D0D", "#1A1A1A"]} style={{ flex: 1 }}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={{ 
            paddingTop: insets.top + 20, 
            paddingBottom: insets.bottom + 100,
            paddingHorizontal: 24 
          }}
        >
          <View style={{ marginBottom: 32 }}>
            <Text style={{ color: colors.foreground, fontSize: 34, fontWeight: "800", letterSpacing: -1 }}>
              Start Production
            </Text>
            <Text style={{ color: colors.muted, fontSize: 16, marginTop: 4 }}>
              Dispatch your narrative to the cinematic fleet.
            </Text>
          </View>

          {/* Form HUD */}
          <View style={{ gap: 20 }}>
            <View>
              <Text style={{ color: colors.primary, fontSize: 13, fontWeight: "700", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>
                Project Title
              </Text>
              <TextInput
                placeholder="The Last Horizon..."
                placeholderTextColor="rgba(255,255,255,0.2)"
                value={title}
                onChangeText={setTitle}
                style={{
                  backgroundColor: "rgba(255,255,255,0.05)",
                  borderRadius: 16,
                  padding: 16,
                  color: colors.foreground,
                  fontSize: 16,
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.1)"
                }}
              />
            </View>

            <View>
              <Text style={{ color: colors.primary, fontSize: 13, fontWeight: "700", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>
                Narrative Voice / Author
              </Text>
              <TextInput
                placeholder="Elias Thorne"
                placeholderTextColor="rgba(255,255,255,0.2)"
                value={author}
                onChangeText={setAuthor}
                style={{
                  backgroundColor: "rgba(255,255,255,0.05)",
                  borderRadius: 16,
                  padding: 16,
                  color: colors.foreground,
                  fontSize: 16,
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.1)"
                }}
              />
            </View>

            <View>
              <Text style={{ color: colors.primary, fontSize: 13, fontWeight: "700", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>
                Full Screenplay / Story
              </Text>
              <TextInput
                placeholder="In a world where light is a currency..."
                placeholderTextColor="rgba(255,255,255,0.2)"
                value={text}
                onChangeText={setText}
                multiline
                numberOfLines={10}
                textAlignVertical="top"
                style={{
                  backgroundColor: "rgba(255,255,255,0.05)",
                  borderRadius: 20,
                  padding: 16,
                  color: colors.foreground,
                  fontSize: 16,
                  minHeight: 200,
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.1)"
                }}
              />
            </View>
          </View>

          {/* Launch Button */}
          <TouchableOpacity
            onPress={handleLaunch}
            disabled={loading}
            style={{
              marginTop: 40,
              backgroundColor: colors.primary,
              height: 64,
              borderRadius: 32,
              alignItems: "center",
              justifyContent: "center",
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.3,
              shadowRadius: 12,
              elevation: 8,
              flexDirection: "row",
              gap: 12
            }}
          >
            {loading ? (
              <ActivityIndicator color="#FDF6EE" />
            ) : (
              <>
                <Text style={{ color: "#FDF6EE", fontSize: 18, fontWeight: "800" }}>Launch Production</Text>
                <IconSymbol name="paperplane.fill" size={20} color="#FDF6EE" />
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}
