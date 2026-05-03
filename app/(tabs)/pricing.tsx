import { ScrollView, Text, View, TouchableOpacity } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAuth } from "@/hooks/use-auth";
import { LinearGradient } from "expo-linear-gradient";

function PricingCard({ 
  title, 
  price, 
  features, 
  isPopular, 
  onPress 
}: { 
  title: string; 
  price: string; 
  features: string[]; 
  isPopular?: boolean;
  onPress: () => void;
}) {
  const colors = useColors();
  
  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: 20,
        padding: 24,
        marginBottom: 20,
        borderWidth: isPopular ? 2 : 1,
        borderColor: isPopular ? colors.primary : colors.border,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {isPopular && (
        <LinearGradient
          colors={[colors.primary, colors.primary + "CC"]}
          style={{
            position: 'absolute',
            top: 12,
            right: -30,
            paddingHorizontal: 40,
            paddingVertical: 4,
            transform: [{ rotate: '45deg' }],
          }}
        >
          <Text style={{ color: "#FDF6EE", fontSize: 10, fontWeight: "900", letterSpacing: 1 }}>POPULAR</Text>
        </LinearGradient>
      )}

      <Text style={{ color: colors.muted, fontSize: 14, fontWeight: "700", letterSpacing: 1, marginBottom: 8 }}>{title.toUpperCase()}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', marginBottom: 20 }}>
        <Text style={{ color: colors.foreground, fontSize: 36, fontWeight: "800" }}>{price}</Text>
        <Text style={{ color: colors.muted, fontSize: 16 }}>/month</Text>
      </View>

      <View style={{ gap: 12, marginBottom: 24 }}>
        {features.map((feature, i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <IconSymbol name="checkmark.circle.fill" size={18} color={isPopular ? colors.primary : colors.muted} />
            <Text style={{ color: colors.foreground, fontSize: 15 }}>{feature}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity
        onPress={onPress}
        style={{
          backgroundColor: isPopular ? colors.primary : colors.background,
          paddingVertical: 16,
          borderRadius: 14,
          alignItems: 'center',
          borderWidth: isPopular ? 0 : 1,
          borderColor: colors.border,
        }}
      >
        <Text style={{ color: isPopular ? "#FDF6EE" : colors.foreground, fontSize: 16, fontWeight: "700" }}>
          Get Started
        </Text>
      </TouchableOpacity>
    </View>
  );
}

export default function PricingScreen() {
  const colors = useColors();
  const { user } = useAuth();

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <View style={{ marginBottom: 32, marginTop: 10 }}>
          <Text style={{ color: colors.foreground, fontSize: 28, fontWeight: "800", marginBottom: 8 }}>
            Choose Your Plan
          </Text>
          <Text style={{ color: colors.muted, fontSize: 16 }}>
            Scale your cinematic studio from indie to enterprise.
          </Text>
        </View>

        <PricingCard
          title="Free"
          price="$0"
          features={[
            "10 AI Video Scenes / month",
            "720p Resolution",
            "Standard Ingestion",
            "Community Support"
          ]}
          onPress={() => {}}
        />

        <PricingCard
          title="Pro"
          price="$29"
          isPopular
          features={[
            "1,000 AI Video Scenes / month",
            "4K High-Res Renders",
            "Priority GPU Workers",
            "Advanced World Bible Access",
            "Sovereign Secret Vault"
          ]}
          onPress={() => {}}
        />

        <PricingCard
          title="Studio"
          price="$199"
          features={[
            "Unlimited Video Scenes",
            "Private GPU Worker Pool",
            "Multi-Agent Orchestration",
            "White-label Exports",
            "24/7 Dedicated Support"
          ]}
          onPress={() => {}}
        />
      </ScrollView>
    </ScreenContainer>
  );
}
