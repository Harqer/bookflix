/**
 * Home Screen - Enhanced with Real-Time WebSocket Updates
 * 
 * Features:
 * - Live production tracking (no polling)
 * - Real-time progress indicators
 * - Advanced production analytics
 * - Cost estimation display
 * - Consistency scoring
 */

import { useEffect, useState, useRef } from "react";
import { ScrollView, Text, View, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { useColors } from "@/hooks/use-colors";

interface ProductionStats {
  totalBooks: number;
  inProduction: number;
  completed: number;
  totalCost: number;
  avgConsistencyScore: number;
}

interface LiveProduction {
  bookId: string;
  title: string;
  stage: string;
  progress: number;
  currentAgent: string;
  eta: string;
  consistencyScore: number;
  estimatedCost: number;
}

export default function HomeScreenEnhanced() {
  const colors = useColors();
  const router = useRouter();
  const [stats, setStats] = useState<ProductionStats>({
    totalBooks: 0,
    inProduction: 0,
    completed: 0,
    totalCost: 0,
    avgConsistencyScore: 0,
  });
  const [liveProductions, setLiveProductions] = useState<LiveProduction[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  // Initialize WebSocket connection for real-time updates
  useEffect(() => {
    const connectWebSocket = () => {
      try {
        const protocol = typeof window !== "undefined" && window.location.protocol === "https:" ? "wss:" : "ws:";
        const wsUrl = `${protocol}//${typeof window !== "undefined" ? window.location.host : "localhost:3000"}/api/ws/productions`;
        
        wsRef.current = new WebSocket(wsUrl);

        wsRef.current.onopen = () => {
          console.log("[WebSocket] Connected to production updates");
          setIsConnected(true);
        };

        wsRef.current.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            if (data.type === "stats_update") {
              setStats(data.payload);
            } else if (data.type === "production_update") {
              setLiveProductions(prev => {
                const existing = prev.findIndex(p => p.bookId === data.payload.bookId);
                if (existing >= 0) {
                  const updated = [...prev];
                  updated[existing] = data.payload;
                  return updated;
                }
                return [...prev, data.payload];
              });
            }
          } catch (error) {
            console.error("[WebSocket] Failed to parse message:", error);
          }
        };

        wsRef.current.onerror = (error) => {
          console.error("[WebSocket] Error:", error);
          setIsConnected(false);
        };

        wsRef.current.onclose = () => {
          console.log("[WebSocket] Disconnected");
          setIsConnected(false);
          // Attempt reconnection after 3 seconds
          setTimeout(connectWebSocket, 3000);
        };
      } catch (error) {
        console.error("[WebSocket] Failed to connect:", error);
      }
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  // Fallback: Fetch initial data via tRPC
  const booksQuery = trpc.books.list.useQuery();

  useEffect(() => {
    if (booksQuery.data) {
      const inProd = booksQuery.data.filter(b => b.status !== "complete").length;
      const completed = booksQuery.data.filter(b => b.status === "complete").length;
      
      setStats({
        totalBooks: booksQuery.data.length,
        inProduction: inProd,
        completed,
        totalCost: inProd * 0.60,  // $0.60 per book
        avgConsistencyScore: 0.92,  // Placeholder
      });
    }
  }, [booksQuery.data]);

  const stageColors: Record<string, string> = {
    full_book_analysis: colors.primary,
    rag_indexing: colors.accent,
    consistency_check: colors.gold,
    video_generation: colors.tint,
    consistency_validation: colors.warning,
    assembly: colors.success,
  };

  const getStageLabel = (stage: string): string => {
    const labels: Record<string, string> = {
      full_book_analysis: "Analyzing Full Book",
      rag_indexing: "Building RAG Index",
      consistency_check: "Checking Consistency",
      video_generation: "Generating Videos",
      consistency_validation: "Validating Consistency",
      assembly: "Assembling Film",
    };
    return labels[stage] || stage;
  };

  return (
    <ScreenContainer className="p-6">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 gap-8">
          {/* Header */}
          <View className="items-center gap-2">
            <Text className="text-4xl font-bold text-foreground">Your Studio</Text>
            <View className="flex-row items-center gap-2">
              <View
                className={`w-3 h-3 rounded-full ${isConnected ? "bg-success" : "bg-warning"}`}
              />
              <Text className="text-sm text-muted">
                {isConnected ? "Live Updates" : "Offline Mode"}
              </Text>
            </View>
          </View>

          {/* Stats Row */}
          <View className="flex-row gap-3 justify-between">
            <View className="flex-1 bg-surface rounded-2xl p-4 border border-border">
              <Text className="text-2xl font-bold text-primary">{stats.totalBooks}</Text>
              <Text className="text-xs text-muted mt-1">Total Books</Text>
            </View>
            <View className="flex-1 bg-surface rounded-2xl p-4 border border-border">
              <Text className="text-2xl font-bold text-accent">{stats.inProduction}</Text>
              <Text className="text-xs text-muted mt-1">In Production</Text>
            </View>
            <View className="flex-1 bg-surface rounded-2xl p-4 border border-border">
              <Text className="text-2xl font-bold text-success">{stats.completed}</Text>
              <Text className="text-xs text-muted mt-1">Completed</Text>
            </View>
          </View>

          {/* Production Analytics */}
          <View className="bg-surface rounded-2xl p-6 border border-border gap-4">
            <Text className="text-lg font-semibold text-foreground">Production Analytics</Text>
            
            <View className="gap-3">
              <View className="flex-row justify-between items-center">
                <Text className="text-sm text-muted">Avg. Consistency Score</Text>
                <Text className="text-lg font-bold text-primary">
                  {(stats.avgConsistencyScore * 100).toFixed(1)}%
                </Text>
              </View>
              
              <View className="h-2 bg-border rounded-full overflow-hidden">
                <View
                  className="h-full bg-primary rounded-full"
                  style={{ width: `${stats.avgConsistencyScore * 100}%` }}
                />
              </View>
            </View>

            <View className="gap-3 mt-2">
              <View className="flex-row justify-between items-center">
                <Text className="text-sm text-muted">Total Production Cost</Text>
                <Text className="text-lg font-bold text-accent">
                  ${stats.totalCost.toFixed(2)}
                </Text>
              </View>
              <Text className="text-xs text-muted">
                ~${(stats.totalCost / Math.max(stats.inProduction + stats.completed, 1)).toFixed(2)}/book
              </Text>
            </View>
          </View>

          {/* Live Productions */}
          {liveProductions.length > 0 && (
            <View className="gap-3">
              <Text className="text-lg font-semibold text-foreground">In Production</Text>
              
              {liveProductions.map((prod) => (
                <TouchableOpacity
                  key={prod.bookId}
                  onPress={() => router.push(`/book/${prod.bookId}`)}
                  className="bg-surface rounded-xl p-4 border border-border active:opacity-70"
                >
                  <View className="gap-3">
                    <View className="flex-row justify-between items-start">
                      <View className="flex-1 gap-1">
                        <Text className="text-base font-semibold text-foreground" numberOfLines={1}>
                          {prod.title}
                        </Text>
                        <Text className="text-xs text-muted">{getStageLabel(prod.stage)}</Text>
                      </View>
                      <Text className="text-xs font-mono text-primary">{prod.progress}%</Text>
                    </View>

                    {/* Progress Bar */}
                    <View className="h-2 bg-border rounded-full overflow-hidden">
                      <View
                        className="h-full rounded-full"
                        style={{
                          width: `${prod.progress}%`,
                          backgroundColor: stageColors[prod.stage] || colors.primary,
                        }}
                      />
                    </View>

                    {/* Agent & Metrics */}
                    <View className="flex-row justify-between items-center gap-2">
                      <View className="flex-1 gap-1">
                        <Text className="text-xs text-muted">
                          {prod.currentAgent} • ETA {prod.eta}
                        </Text>
                        <Text className="text-xs text-muted">
                          Consistency: {(prod.consistencyScore * 100).toFixed(0)}% • Cost: ${prod.estimatedCost.toFixed(2)}
                        </Text>
                      </View>
                      <ActivityIndicator color={colors.primary} size="small" />
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* CTA */}
          {stats.totalBooks === 0 && (
            <View className="flex-1 items-center justify-center gap-4">
              <Text className="text-2xl font-bold text-foreground">No Productions Yet</Text>
              <Text className="text-sm text-muted text-center">
                Submit your first book and watch AI transform it into a cinematic feature film
              </Text>
              <TouchableOpacity
                onPress={() => router.push("/(tabs)/submit")}
                className="bg-primary px-6 py-3 rounded-full active:opacity-80"
              >
                <Text className="text-background font-semibold">Submit a Book</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
