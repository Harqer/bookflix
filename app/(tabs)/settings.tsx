import { ScrollView, Text, View, TouchableOpacity, Switch } from "react-native";
import { useState } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";
import { useRouter } from "expo-router";
import { Image } from "expo-image";

function SettingsRow({
  icon,
  label,
  value,
  onPress,
  rightElement,
  destructive,
}: {
  icon: any;
  label: string;
  value?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  destructive?: boolean;
}) {
  const colors = useColors();
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress && !rightElement}
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 14,
        paddingHorizontal: 16,
      }}
      activeOpacity={0.7}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          backgroundColor: destructive ? colors.error + "20" : colors.primary + "18",
          alignItems: "center",
          justifyContent: "center",
          marginRight: 12,
        }}
      >
        <IconSymbol name={icon} size={18} color={destructive ? colors.error : colors.primary} />
      </View>
      <Text style={{ flex: 1, color: destructive ? colors.error : colors.foreground, fontSize: 15, fontWeight: "500" }}>
        {label}
      </Text>
      {value && <Text style={{ color: colors.muted, fontSize: 14, marginRight: 8 }}>{value}</Text>}
      {rightElement}
      {onPress && !rightElement && (
        <IconSymbol name="chevron.right" size={16} color={colors.muted} />
      )}
    </TouchableOpacity>
  );
}

function SectionHeader({ title }: { title: string }) {
  const colors = useColors();
  return (
    <Text
      style={{
        color: colors.muted,
        fontSize: 12,
        fontWeight: "700",
        letterSpacing: 0.8,
        paddingHorizontal: 16,
        paddingTop: 20,
        paddingBottom: 6,
      }}
    >
      {title.toUpperCase()}
    </Text>
  );
}

function SectionCard({ children }: { children: React.ReactNode }) {
  const colors = useColors();
  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: 14,
        marginHorizontal: 16,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: "hidden",
      }}
    >
      {children}
    </View>
  );
}

function Divider() {
  const colors = useColors();
  return <View style={{ height: 1, backgroundColor: colors.border, marginLeft: 64 }} />;
}

export default function SettingsScreen() {
  const colors = useColors();
  const router = useRouter();
  const { user, organization, logout } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const handleLogout = async () => {
    await logout();
    router.replace("/" as any);
  };

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View
          style={{
            paddingHorizontal: 20,
            paddingTop: 20,
            paddingBottom: 20,
            backgroundColor: colors.surface,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          <Text style={{ color: colors.foreground, fontSize: 26, fontWeight: "800" }}>
            Settings
          </Text>
        </View>

        {/* Profile */}
        {user && (
          <>
            <SectionHeader title="Account" />
            <SectionCard>
              <View style={{ padding: 16, flexDirection: "row", alignItems: "center", gap: 14 }}>
                <View
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    backgroundColor: colors.primary,
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden"
                  }}
                >
                  {user.imageUrl ? (
                    <Image source={{ uri: user.imageUrl }} style={{ width: "100%", height: "100%" }} />
                  ) : (
                    <Text style={{ color: "#FDF6EE", fontSize: 22, fontWeight: "800" }}>
                      {(user.name || "U")[0].toUpperCase()}
                    </Text>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.foreground, fontSize: 17, fontWeight: "700" }}>
                    {user.name || "Filmmaker"}
                  </Text>
                  <Text style={{ color: colors.muted, fontSize: 13, marginTop: 2 }}>
                    {user.email || "No email"}
                  </Text>
                </View>
                <View
                  style={{
                    backgroundColor: colors.gold + "33",
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 10,
                  }}
                >
                  <Text style={{ color: colors.gold, fontSize: 11, fontWeight: "700" }}>
                    {user.role?.toUpperCase() || "USER"}
                  </Text>
                </View>
              </View>
              <Divider />
              {organization && (
                <>
                  <SettingsRow
                    icon="building.2.fill"
                    label="Active Studio"
                    value={organization.name}
                  />
                  <Divider />
                </>
              )}
              <SettingsRow
                icon="person.crop.circle.fill"
                label="Manage Account"
                onPress={() => {
                  // In a real app, this would open a browser to Clerk user profile or a native sheet
                  router.push("/(tabs)/settings" as any); // Placeholder
                }}
              />
            </SectionCard>
          </>
        )}

        {/* Production */}
        <SectionHeader title="Production" />
        <SectionCard>
          <SettingsRow
            icon="film"
            label="Default Style"
            value="Cinematic"
            onPress={() => {}}
          />
          <Divider />
          <SettingsRow
            icon="sparkles"
            label="AI Model"
            value="Gemini 2.5 Flash"
          />
          <Divider />
          <SettingsRow
            icon="bolt.fill"
            label="Processing Priority"
            value="Standard"
            onPress={() => {}}
          />
        </SectionCard>

        {/* Notifications */}
        <SectionHeader title="Notifications" />
        <SectionCard>
          <SettingsRow
            icon="bell.fill"
            label="Production Updates"
            rightElement={
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#FDF6EE"
              />
            }
          />
        </SectionCard>

        {/* About */}
        <SectionHeader title="About" />
        <SectionCard>
          <SettingsRow
            icon="book.fill"
            label="BookCinema"
            value="v1.0.0"
          />
          <Divider />
          <SettingsRow
            icon="wand.and.stars"
            label="AI Pipeline"
            value="5-Agent Orchestration"
          />
          <Divider />
          <SettingsRow
            icon="doc.text.fill"
            label="Architecture Docs"
            onPress={() => {}}
          />
        </SectionCard>

        {/* AI Architecture Info */}
        <SectionHeader title="AI Orchestration" />
        <View
          style={{
            marginHorizontal: 16,
            backgroundColor: colors.surface,
            borderRadius: 14,
            padding: 16,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          {[
            { step: "1", name: "Book Analyst", desc: "Chapter splitting + World Bible init" },
            { step: "2", name: "Continuity Supervisor", desc: "Persistent memory management" },
            { step: "3", name: "Screenwriter", desc: "Save the Cat screenplay framework" },
            { step: "4", name: "Visual Director", desc: "Scene-by-scene visual prompts" },
            { step: "5", name: "Video Producer", desc: "Keyframe generation + video queue" },
          ].map((agent, i) => (
            <View key={agent.step} style={{ flexDirection: "row", gap: 12, marginBottom: i < 4 ? 12 : 0 }}>
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: colors.primary,
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Text style={{ color: "#FDF6EE", fontSize: 12, fontWeight: "800" }}>{agent.step}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: "700" }}>{agent.name}</Text>
                <Text style={{ color: colors.muted, fontSize: 12, marginTop: 1 }}>{agent.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Sign out */}
        {user && (
          <>
            <SectionHeader title="Account Actions" />
            <SectionCard>
              <SettingsRow
                icon="xmark.circle.fill"
                label="Sign Out"
                onPress={handleLogout}
                destructive
              />
            </SectionCard>
          </>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>
    </ScreenContainer>
  );
}
