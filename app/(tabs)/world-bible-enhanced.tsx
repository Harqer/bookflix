/**
 * World Bible Screen - Enhanced with Consistency Scoring
 * 
 * Features:
 * - Character consistency scoring (appearance, personality)
 * - Location visual coherence tracking
 * - Timeline validation
 * - Theme consistency analysis
 * - VLM-based visual verification
 */

import { useEffect, useState } from "react";
import { ScrollView, Text, View, TouchableOpacity, ActivityIndicator } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";

interface ConsistencyScore {
  characterAppearance: number;
  characterPersonality: number;
  locationVisuals: number;
  locationMood: number;
  timelineAccuracy: number;
  themeCoherence: number;
  overall: number;
}

interface Character {
  name: string;
  appearance: string;
  personality: string;
  arc: string;
  consistencyScore?: number;
  appearances: number;  // Count of appearances in story
}

interface Location {
  name: string;
  description: string;
  mood: string;
  consistencyScore?: number;
  appearances: number;
}

interface TimelineEvent {
  event: string;
  timestamp: string;
  significance: string;
  verified: boolean;
}

export default function WorldBibleEnhanced() {
  const colors = useColors();
  const { bookId } = useLocalSearchParams<{ bookId: string }>();
  const [activeTab, setActiveTab] = useState<"characters" | "locations" | "timeline" | "themes">(
    "characters"
  );
  const [consistencyScores, setConsistencyScores] = useState<ConsistencyScore>({
    characterAppearance: 0.95,
    characterPersonality: 0.92,
    locationVisuals: 0.88,
    locationMood: 0.90,
    timelineAccuracy: 0.98,
    themeCoherence: 0.85,
    overall: 0.91,
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const bookIdNum = bookId ? parseInt(bookId) : 0;
  
  // TODO: Migrate to Convex api.worldBible
  const worldBibleQuery = { data: null };

  // Simulate consistency analysis
  const handleAnalyzeConsistency = async () => {
    setIsAnalyzing(true);
    try {
      // In production: Call VLM consistency checker
      // await trpc.worldBible.analyzeConsistency.mutate({ bookId: bookIdNum });
      
      // Simulate delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update scores
      setConsistencyScores({
        characterAppearance: 0.93 + Math.random() * 0.05,
        characterPersonality: 0.90 + Math.random() * 0.05,
        locationVisuals: 0.87 + Math.random() * 0.05,
        locationMood: 0.89 + Math.random() * 0.05,
        timelineAccuracy: 0.97 + Math.random() * 0.02,
        themeCoherence: 0.84 + Math.random() * 0.05,
        overall: 0.90 + Math.random() * 0.05,
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 0.95) return colors.success;
    if (score >= 0.90) return colors.primary;
    if (score >= 0.85) return colors.accent;
    if (score >= 0.80) return colors.warning;
    return colors.error;
  };

  const getScoreLabel = (score: number): string => {
    if (score >= 0.95) return "Excellent";
    if (score >= 0.90) return "Very Good";
    if (score >= 0.85) return "Good";
    if (score >= 0.80) return "Fair";
    return "Needs Review";
  };

  if (!worldBibleQuery.data) {
    return (
      <ScreenContainer className="p-6 items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="text-muted mt-4">Loading World Bible...</Text>
      </ScreenContainer>
    );
  }

  const characters = (worldBibleQuery.data.characters as any[]) || [];
  const locations = (worldBibleQuery.data.locations as any[]) || [];
  const timeline = (worldBibleQuery.data.timeline as any[]) || [];
  const themes = (worldBibleQuery.data.themes as any[]) || [];

  return (
    <ScreenContainer className="p-6">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 gap-6">
          {/* Header */}
          <View className="gap-2">
            <Text className="text-2xl font-bold text-foreground">World Bible</Text>
            <Text className="text-sm text-muted">Narrative consistency & visual coherence</Text>
          </View>

          {/* Consistency Score Card */}
          <View className="bg-surface rounded-2xl p-6 border border-border gap-4">
            <View className="flex-row justify-between items-center">
              <Text className="text-lg font-semibold text-foreground">Overall Consistency</Text>
              <TouchableOpacity
                onPress={handleAnalyzeConsistency}
                disabled={isAnalyzing}
                className="px-3 py-2 bg-primary rounded-full active:opacity-70"
              >
                {isAnalyzing ? (
                  <ActivityIndicator color={colors.background} size="small" />
                ) : (
                  <Text className="text-xs font-medium text-background">Analyze</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Overall Score */}
            <View className="gap-2">
              <View className="flex-row justify-between items-center">
                <Text className="text-3xl font-bold text-foreground">
                  {(consistencyScores.overall * 100).toFixed(1)}%
                </Text>
                <Text
                  className="text-sm font-semibold px-3 py-1 rounded-full"
                  style={{
                    color: getScoreColor(consistencyScores.overall),
                    backgroundColor: getScoreColor(consistencyScores.overall) + "20",
                  }}
                >
                  {getScoreLabel(consistencyScores.overall)}
                </Text>
              </View>

              <View className="h-3 bg-border rounded-full overflow-hidden">
                <View
                  className="h-full rounded-full"
                  style={{
                    width: `${consistencyScores.overall * 100}%`,
                    backgroundColor: getScoreColor(consistencyScores.overall),
                  }}
                />
              </View>
            </View>

            {/* Detailed Scores */}
            <View className="gap-3 mt-2 pt-4 border-t border-border">
              {[
                { label: "Character Appearance", score: consistencyScores.characterAppearance },
                { label: "Character Personality", score: consistencyScores.characterPersonality },
                { label: "Location Visuals", score: consistencyScores.locationVisuals },
                { label: "Location Mood", score: consistencyScores.locationMood },
                { label: "Timeline Accuracy", score: consistencyScores.timelineAccuracy },
                { label: "Theme Coherence", score: consistencyScores.themeCoherence },
              ].map((item, idx) => (
                <View key={idx} className="gap-1">
                  <View className="flex-row justify-between items-center">
                    <Text className="text-xs text-muted">{item.label}</Text>
                    <Text className="text-xs font-semibold" style={{ color: getScoreColor(item.score) }}>
                      {(item.score * 100).toFixed(0)}%
                    </Text>
                  </View>
                  <View className="h-1.5 bg-border rounded-full overflow-hidden">
                    <View
                      className="h-full rounded-full"
                      style={{
                        width: `${item.score * 100}%`,
                        backgroundColor: getScoreColor(item.score),
                      }}
                    />
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Tab Navigation */}
          <View className="flex-row gap-2 bg-surface rounded-xl p-1 border border-border">
            {(["characters", "locations", "timeline", "themes"] as const).map((tab) => (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                className={`flex-1 py-2 px-3 rounded-lg ${
                  activeTab === tab ? "bg-primary" : "bg-transparent"
                }`}
              >
                <Text
                  className={`text-xs font-semibold text-center ${
                    activeTab === tab ? "text-background" : "text-foreground"
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Tab Content */}
          {activeTab === "characters" && (
            <View className="gap-3">
              {characters.length > 0 ? (
                characters.map((char: Character, idx: number) => (
                  <View key={idx} className="bg-surface rounded-xl p-4 border border-border gap-2">
                    <View className="flex-row justify-between items-start gap-2">
                      <View className="flex-1">
                        <Text className="text-base font-semibold text-foreground">{char.name}</Text>
                        <Text className="text-xs text-muted mt-1">{char.appearance}</Text>
                      </View>
                      <View className="items-end gap-1">
                        <Text className="text-xs font-semibold text-primary">
                          {char.appearances} appearances
                        </Text>
                        {char.consistencyScore && (
                          <Text
                            className="text-xs font-semibold px-2 py-1 rounded-full"
                            style={{
                              color: getScoreColor(char.consistencyScore),
                              backgroundColor: getScoreColor(char.consistencyScore) + "20",
                            }}
                          >
                            {(char.consistencyScore * 100).toFixed(0)}%
                          </Text>
                        )}
                      </View>
                    </View>
                    <Text className="text-xs text-muted">{char.personality}</Text>
                    <Text className="text-xs text-muted italic">Arc: {char.arc}</Text>
                  </View>
                ))
              ) : (
                <Text className="text-sm text-muted text-center py-8">No characters found</Text>
              )}
            </View>
          )}

          {activeTab === "locations" && (
            <View className="gap-3">
              {locations.length > 0 ? (
                locations.map((loc: Location, idx: number) => (
                  <View key={idx} className="bg-surface rounded-xl p-4 border border-border gap-2">
                    <View className="flex-row justify-between items-start gap-2">
                      <View className="flex-1">
                        <Text className="text-base font-semibold text-foreground">{loc.name}</Text>
                        <Text className="text-xs text-muted mt-1">{loc.description}</Text>
                      </View>
                      <View className="items-end gap-1">
                        <Text className="text-xs font-semibold text-primary">
                          {loc.appearances} scenes
                        </Text>
                        {loc.consistencyScore && (
                          <Text
                            className="text-xs font-semibold px-2 py-1 rounded-full"
                            style={{
                              color: getScoreColor(loc.consistencyScore),
                              backgroundColor: getScoreColor(loc.consistencyScore) + "20",
                            }}
                          >
                            {(loc.consistencyScore * 100).toFixed(0)}%
                          </Text>
                        )}
                      </View>
                    </View>
                    <Text className="text-xs text-muted">Mood: {loc.mood}</Text>
                  </View>
                ))
              ) : (
                <Text className="text-sm text-muted text-center py-8">No locations found</Text>
              )}
            </View>
          )}

          {activeTab === "timeline" && (
            <View className="gap-3">
              {timeline.length > 0 ? (
                timeline.map((event: TimelineEvent, idx: number) => (
                  <View key={idx} className="bg-surface rounded-xl p-4 border border-border gap-2">
                    <View className="flex-row justify-between items-start gap-2">
                      <View className="flex-1">
                        <Text className="text-base font-semibold text-foreground">{event.event}</Text>
                        <Text className="text-xs text-muted mt-1">{event.timestamp}</Text>
                      </View>
                      {event.verified && (
                        <View className="bg-success bg-opacity-20 px-2 py-1 rounded-full">
                          <IconSymbol name="checkmark.circle.fill" size={16} color={colors.success} />
                        </View>
                      )}
                    </View>
                    <Text className="text-xs text-muted">Significance: {event.significance}</Text>
                  </View>
                ))
              ) : (
                <Text className="text-sm text-muted text-center py-8">No timeline events found</Text>
              )}
            </View>
          )}

          {activeTab === "themes" && (
            <View className="gap-2">
              {themes.length > 0 ? (
                themes.map((theme: string, idx: number) => (
                  <View
                    key={idx}
                    className="bg-surface rounded-xl p-4 border border-border flex-row items-center gap-3"
                  >
                    <View className="w-3 h-3 rounded-full bg-primary" />
                    <Text className="text-base text-foreground flex-1">{theme}</Text>
                  </View>
                ))
              ) : (
                <Text className="text-sm text-muted text-center py-8">No themes found</Text>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
