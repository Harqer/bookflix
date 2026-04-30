import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import Animated, { 
  FadeIn, 
  FadeOut, 
  SlideInRight, 
  SlideOutLeft,
  useAnimatedStyle,
  withTiming,
  useSharedValue
} from "react-native-reanimated";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

import { StepIndicator } from "@/components/ui/step-indicator";
import { FormField } from "@/components/ui/form-field";

// ─── Submit Screen ────────────────────────────────────────────────────────────

const GENRES = ["Drama", "Thriller", "Romance", "Fantasy", "Sci-Fi", "Mystery", "Horror", "Adventure", "Historical", "Literary Fiction"];
const STYLES = [
  { key: "cinematic", label: "Cinematic", icon: "film" as const, desc: "Hollywood-style live action" },
  { key: "animated", label: "Animated", icon: "sparkles" as const, desc: "Animated feature style" },
  { key: "documentary", label: "Documentary", icon: "doc.text.fill" as const, desc: "Docudrama approach" },
];

export default function SubmitScreen() {
  const colors = useColors();
  const router = useRouter();
  const { user, organization } = useAuth();

  const [step, setStep] = useState(0);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [genre, setGenre] = useState("Drama");
  const [rawText, setRawText] = useState("");
  const [productionStyle, setProductionStyle] = useState<"cinematic" | "animated" | "documentary">("cinematic");
  const [tone, setTone] = useState("dramatic");
  const submitMutation = useMutation(api.studio.submitBook);
  const [isPending, setIsPending] = useState(false);

  const submitBook = {
    isPending,
    mutate: async (data: any) => {
      setIsPending(true);
      try {
        const result = await submitMutation(data);
        Alert.alert(
          "Production Started!",
          `"${title}" has been submitted. The AI pipeline is now analyzing your book.`,
          [
            {
              text: "Track Progress",
              onPress: () => router.push(`/book/${result.bookId}` as any),
            },
          ]
        );
        setStep(0);
        setTitle("");
        setAuthor("");
        setGenre("Drama");
        setRawText("");
        setProductionStyle("cinematic");
        setTone("dramatic");
      } catch (err: any) {
        Alert.alert("Submission Failed", err.message);
      } finally {
        setIsPending(false);
      }
    }
  };

  const wordCount = rawText.trim().split(/\s+/).filter(Boolean).length;

  const canProceedStep0 = rawText.trim().length >= 100;
  const canProceedStep1 = title.trim().length > 0;
  const canSubmit = canProceedStep0 && canProceedStep1;

  const handleSubmit = () => {
    if (!user) {
      Alert.alert("Sign In Required", "Please sign in to submit a book for production.");
      return;
    }
    submitBook.mutate({ 
      title, 
      author, 
      genre, 
      rawText, 
      productionStyle, 
      tone,
      // Pass organizationId to ensure submission is associated with the active studio
      organizationId: organization?.id || undefined 
    });
  };

  return (
    <ScreenContainer>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
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
            Submit Book
          </Text>
          <Text style={{ color: colors.muted, fontSize: 14, marginBottom: 14 }}>
            Transform your book into a cinematic production
          </Text>
          <StepIndicator current={step} total={3} />
          <Text style={{ color: colors.muted, fontSize: 12, marginTop: 6 }}>
            Step {step + 1} of 3 — {["Book Text", "Book Details", "Production Settings"][step]}
          </Text>
        </View>

        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Step 0: Book Text ── */}
          {step === 0 && (
            <Animated.View entering={FadeIn} exiting={FadeOut}>
              <View
                style={{
                  backgroundColor: colors.primary + "15",
                  borderRadius: 12,
                  padding: 14,
                  marginBottom: 20,
                  flexDirection: "row",
                  gap: 10,
                  borderWidth: 1,
                  borderColor: colors.primary + "30",
                }}
              >
                <IconSymbol name="sparkles" size={18} color={colors.primary} />
                <Text style={{ color: colors.foreground, fontSize: 13, lineHeight: 20, flex: 1 }}>
                  Paste your book text below. The AI will automatically detect chapters, extract characters, locations, and build a World Bible to maintain continuity throughout production.
                </Text>
              </View>

              <FormField
                label="Book Text *"
                value={rawText}
                onChangeText={setRawText}
                placeholder="Paste your full book text here... (minimum 100 characters)"
                multiline
                maxLength={500000}
              />

              {rawText.length > 0 && (
                <Animated.View
                  entering={FadeIn.delay(200)}
                  style={{
                    backgroundColor: colors.surface,
                    borderRadius: 10,
                    padding: 12,
                    marginBottom: 16,
                    flexDirection: "row",
                    justifyContent: "space-around",
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <View style={{ alignItems: "center" }}>
                    <Text style={{ color: colors.foreground, fontSize: 20, fontWeight: "800" }}>
                      {wordCount.toLocaleString()}
                    </Text>
                    <Text style={{ color: colors.muted, fontSize: 11 }}>Words</Text>
                  </View>
                  <View style={{ width: 1, backgroundColor: colors.border }} />
                  <View style={{ alignItems: "center" }}>
                    <Text style={{ color: colors.foreground, fontSize: 20, fontWeight: "800" }}>
                      ~{Math.ceil(wordCount / 3000)}
                    </Text>
                    <Text style={{ color: colors.muted, fontSize: 11 }}>Est. Chapters</Text>
                  </View>
                  <View style={{ width: 1, backgroundColor: colors.border }} />
                  <View style={{ alignItems: "center" }}>
                    <Text style={{ color: colors.foreground, fontSize: 20, fontWeight: "800" }}>
                      ~{Math.ceil(wordCount / 250)}
                    </Text>
                    <Text style={{ color: colors.muted, fontSize: 11 }}>Pages</Text>
                  </View>
                </Animated.View>
              )}
            </Animated.View>
          )}

          {/* ── Step 1: Book Details ── */}
          {step === 1 && (
            <Animated.View entering={SlideInRight} exiting={SlideOutLeft}>
              <FormField
                label="Book Title *"
                value={title}
                onChangeText={setTitle}
                placeholder="e.g. The Great Gatsby"
              />
              <FormField
                label="Author"
                value={author}
                onChangeText={setAuthor}
                placeholder="e.g. F. Scott Fitzgerald"
              />

              {/* Genre selector */}
              <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: "600", marginBottom: 10 }}>
                Genre
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
                {GENRES.map((g, idx) => (
                  <Animated.View key={g} entering={FadeIn.delay(idx * 50)}>
                    <TouchableOpacity
                      onPress={() => setGenre(g)}
                      style={{
                        paddingHorizontal: 14,
                        paddingVertical: 7,
                        borderRadius: 20,
                        backgroundColor: genre === g ? colors.primary : colors.surface,
                        borderWidth: 1,
                        borderColor: genre === g ? colors.primary : colors.border,
                      }}
                    >
                      <Text
                        style={{
                          color: genre === g ? "#FDF6EE" : colors.muted,
                          fontSize: 13,
                          fontWeight: "600",
                        }}
                      >
                        {g}
                      </Text>
                    </TouchableOpacity>
                  </Animated.View>
                ))}
              </View>
            </Animated.View>
          )}

          {/* ── Step 2: Production Settings ── */}
          {step === 2 && (
            <Animated.View entering={SlideInRight} exiting={SlideOutLeft}>
              <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: "600", marginBottom: 12 }}>
                Production Style
              </Text>
              {STYLES.map((s, idx) => (
                <Animated.View key={s.key} entering={FadeIn.delay(idx * 100)}>
                  <TouchableOpacity
                    onPress={() => setProductionStyle(s.key as any)}
                    style={{
                      backgroundColor: productionStyle === s.key ? colors.primary + "15" : colors.surface,
                      borderRadius: 14,
                      padding: 16,
                      marginBottom: 10,
                      borderWidth: 2,
                      borderColor: productionStyle === s.key ? colors.primary : colors.border,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 14,
                    }}
                  >
                    <View
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 22,
                        backgroundColor: productionStyle === s.key ? colors.primary : colors.border,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <IconSymbol name={s.icon} size={22} color={productionStyle === s.key ? "#FDF6EE" : colors.muted} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: "700" }}>{s.label}</Text>
                      <Text style={{ color: colors.muted, fontSize: 13, marginTop: 2 }}>{s.desc}</Text>
                    </View>
                    {productionStyle === s.key && (
                      <IconSymbol name="checkmark.circle.fill" size={22} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                </Animated.View>
              ))}

              <FormField
                label="Tone / Mood"
                value={tone}
                onChangeText={setTone}
                placeholder="e.g. dramatic, whimsical, dark, romantic"
              />

              {/* Summary */}
              <Animated.View
                entering={FadeIn.delay(300)}
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 14,
                  padding: 16,
                  marginTop: 8,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Text style={{ color: colors.foreground, fontSize: 15, fontWeight: "700", marginBottom: 10 }}>
                  Production Summary
                </Text>
                {[
                  { label: "Studio", value: organization ? "Active Studio" : "Personal" },
                  { label: "Title", value: title },
                  { label: "Author", value: author || "Unknown" },
                  { label: "Genre", value: genre },
                  { label: "Words", value: wordCount.toLocaleString() },
                  { label: "Est. Chapters", value: `~${Math.ceil(wordCount / 3000)}` },
                  { label: "Style", value: productionStyle },
                ].map((row) => (
                  <View key={row.label} style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
                    <Text style={{ color: colors.muted, fontSize: 13 }}>{row.label}</Text>
                    <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: "600" }}>{row.value}</Text>
                  </View>
                ))}
              </Animated.View>
            </Animated.View>
          )}

          {/* ── Navigation Buttons ── */}
          <View style={{ flexDirection: "row", gap: 12, marginTop: 24 }}>
            {step > 0 && (
              <TouchableOpacity
                onPress={() => setStep(step - 1)}
                style={{
                  flex: 1,
                  backgroundColor: colors.surface,
                  borderRadius: 14,
                  paddingVertical: 16,
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: colors.border,
                  flexDirection: "row",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                <IconSymbol name="chevron.left" size={18} color={colors.foreground} />
                <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: "700" }}>Back</Text>
              </TouchableOpacity>
            )}

            {step < 2 ? (
              <TouchableOpacity
                onPress={() => setStep(step + 1)}
                disabled={step === 0 ? !canProceedStep0 : !canProceedStep1}
                style={{
                  flex: 1,
                  backgroundColor: (step === 0 ? canProceedStep0 : canProceedStep1) ? colors.primary : colors.border,
                  borderRadius: 14,
                  paddingVertical: 16,
                  alignItems: "center",
                  flexDirection: "row",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                <Text style={{ color: "#FDF6EE", fontSize: 16, fontWeight: "700" }}>Continue</Text>
                <IconSymbol name="chevron.right" size={18} color="#FDF6EE" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={!canSubmit || submitBook.isPending}
                style={{
                  flex: 1,
                  backgroundColor: canSubmit ? colors.primary : colors.border,
                  borderRadius: 14,
                  paddingVertical: 16,
                  alignItems: "center",
                  flexDirection: "row",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                {submitBook.isPending ? (
                  <ActivityIndicator color="#FDF6EE" size="small" />
                ) : (
                  <>
                    <IconSymbol name="sparkles" size={20} color="#FDF6EE" />
                    <Text style={{ color: "#FDF6EE", fontSize: 16, fontWeight: "700" }}>
                      Start Production
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
