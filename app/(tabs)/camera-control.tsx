import { ScrollView, View, Text, Pressable } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { useState } from 'react';
import { trpc } from '@/lib/trpc';

interface CameraControlState {
  zoomIntensity: number;
  panHorizontal: number;
  panVertical: number;
  tiltAngle: number;
  rollAngle: number;
  orbitAngle: number;
  orbitDirection: 'left' | 'right';
  orbitRadius: number;
  handheldIntensity: number;
  motionBlur: number;
  depthOfField: number;
  movementDuration: number;
  easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
  selectedPreset: string;
}

const DEFAULT_CAMERA_STATE: CameraControlState = {
  zoomIntensity: 0,
  panHorizontal: 0,
  panVertical: 0,
  tiltAngle: 0,
  rollAngle: 0,
  orbitAngle: 0,
  orbitDirection: 'right',
  orbitRadius: 0,
  handheldIntensity: 0,
  motionBlur: 0,
  depthOfField: 100,
  movementDuration: 2,
  easing: 'ease-in-out',
  selectedPreset: 'cinematic'
};

const CAMERA_PRESETS = [
  {
    id: 'cinematic',
    label: 'Cinematic',
    state: {
      ...DEFAULT_CAMERA_STATE,
      zoomIntensity: 30,
      tiltAngle: -15,
      handheldIntensity: 5,
      motionBlur: 20,
      depthOfField: 60,
      movementDuration: 3,
      selectedPreset: 'cinematic'
    }
  },
  {
    id: 'documentary',
    label: 'Documentary',
    state: {
      ...DEFAULT_CAMERA_STATE,
      handheldIntensity: 30,
      motionBlur: 10,
      depthOfField: 20,
      movementDuration: 1,
      easing: 'linear',
      selectedPreset: 'documentary'
    }
  },
  {
    id: 'action',
    label: 'Action',
    state: {
      ...DEFAULT_CAMERA_STATE,
      zoomIntensity: 60,
      panHorizontal: 20,
      tiltAngle: 10,
      rollAngle: 5,
      orbitAngle: 45,
      handheldIntensity: 50,
      motionBlur: 40,
      depthOfField: 40,
      movementDuration: 1.5,
      easing: 'ease-out',
      selectedPreset: 'action'
    }
  },
  {
    id: 'static',
    label: 'Static',
    state: {
      ...DEFAULT_CAMERA_STATE,
      selectedPreset: 'static'
    }
  }
];

function CameraSlider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  colors
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  colors: any;
}) {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <View className="gap-2">
      <View className="flex-row justify-between">
        <Text className="text-sm font-medium text-foreground">{label}</Text>
        <Text className="text-sm font-semibold text-primary">{value}</Text>
      </View>
      <View
        className="h-8 rounded-lg border border-border overflow-hidden"
        style={{ backgroundColor: colors.surface }}
      >
        <Pressable
          onPress={(e: any) => {
            const locationX = e.nativeEvent.locationX;
            const width = 280;
            const newValue = Math.round(
              min + ((locationX / width) * (max - min)) / step
            ) * step;
            onChange(Math.max(min, Math.min(max, newValue)));
          }}
          className="flex-1 flex-row items-center"
        >
          <View
            className="h-full bg-primary rounded-lg"
            style={{
              width: `${percentage}%`,
              backgroundColor: colors.primary
            }}
          />
        </Pressable>
      </View>
    </View>
  );
}

export default function CameraControlScreen() {
  const colors = useColors();
  const [camera, setCamera] = useState<CameraControlState>(DEFAULT_CAMERA_STATE);
  // Camera preview mutation (optional for future implementation)

  const handlePresetSelect = (preset: any) => {
    setCamera(preset.state);
    // TODO: Trigger preview update
  };

  return (
    <ScreenContainer className="bg-background">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        className="flex-1"
        showsVerticalScrollIndicator={false}
      >
        <View className="p-6 gap-6">
          {/* Header */}
          <View className="gap-2">
            <Text className="text-3xl font-bold text-foreground">Camera Control</Text>
            <Text className="text-sm text-muted">
              Adjust cinematography in real-time
            </Text>
          </View>

          {/* Presets */}
          <View className="gap-3">
            <Text className="text-sm font-semibold text-foreground">Cinematography Presets</Text>
            <View className="flex-row gap-2 flex-wrap">
              {CAMERA_PRESETS.map((preset) => (
                <Pressable
                  key={preset.id}
                  onPress={() => handlePresetSelect(preset)}
                  style={({ pressed }) => [
                    {
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 8,
                      backgroundColor:
                        camera.selectedPreset === preset.id
                          ? colors.primary
                          : colors.surface,
                      borderWidth: 1,
                      borderColor:
                        camera.selectedPreset === preset.id
                          ? colors.primary
                          : colors.border,
                      opacity: pressed ? 0.7 : 1
                    }
                  ]}
                >
                  <Text
                    className={`text-sm font-medium ${
                      camera.selectedPreset === preset.id
                        ? 'text-background'
                        : 'text-foreground'
                    }`}
                  >
                    {preset.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Zoom Control */}
          <View className="gap-3 bg-surface rounded-xl p-4">
            <Text className="text-sm font-semibold text-foreground">Movement</Text>
            <CameraSlider
              label="Zoom"
              value={camera.zoomIntensity}
              min={-100}
              max={100}
              step={5}
              onChange={(v) => setCamera({ ...camera, zoomIntensity: v })}
              colors={colors}
            />
          </View>

          {/* Pan Control */}
          <View className="gap-3 bg-surface rounded-xl p-4">
            <Text className="text-sm font-semibold text-foreground">Pan</Text>
            <CameraSlider
              label="Horizontal"
              value={camera.panHorizontal}
              min={-100}
              max={100}
              step={5}
              onChange={(v) => setCamera({ ...camera, panHorizontal: v })}
              colors={colors}
            />
            <CameraSlider
              label="Vertical"
              value={camera.panVertical}
              min={-100}
              max={100}
              step={5}
              onChange={(v) => setCamera({ ...camera, panVertical: v })}
              colors={colors}
            />
          </View>

          {/* Tilt & Roll */}
          <View className="gap-3 bg-surface rounded-xl p-4">
            <Text className="text-sm font-semibold text-foreground">Angle</Text>
            <CameraSlider
              label="Tilt"
              value={camera.tiltAngle}
              min={-90}
              max={90}
              step={5}
              onChange={(v) => setCamera({ ...camera, tiltAngle: v })}
              colors={colors}
            />
            <CameraSlider
              label="Roll (Dutch)"
              value={camera.rollAngle}
              min={-45}
              max={45}
              step={5}
              onChange={(v) => setCamera({ ...camera, rollAngle: v })}
              colors={colors}
            />
          </View>

          {/* Orbit */}
          <View className="gap-3 bg-surface rounded-xl p-4">
            <Text className="text-sm font-semibold text-foreground">Orbit</Text>
            <CameraSlider
              label="Angle"
              value={camera.orbitAngle}
              min={0}
              max={360}
              step={15}
              onChange={(v) => setCamera({ ...camera, orbitAngle: v })}
              colors={colors}
            />
            <View className="flex-row gap-2">
              {(['left', 'right'] as const).map((dir) => (
                <Pressable
                  key={dir}
                  onPress={() => setCamera({ ...camera, orbitDirection: dir })}
                  style={({ pressed }) => [
                    {
                      flex: 1,
                      paddingVertical: 10,
                      borderRadius: 8,
                      backgroundColor:
                        camera.orbitDirection === dir
                          ? colors.primary
                          : colors.background,
                      borderWidth: 1,
                      borderColor:
                        camera.orbitDirection === dir
                          ? colors.primary
                          : colors.border,
                      opacity: pressed ? 0.7 : 1
                    }
                  ]}
                >
                  <Text
                    className={`text-center text-sm font-medium capitalize ${
                      camera.orbitDirection === dir
                        ? 'text-background'
                        : 'text-foreground'
                    }`}
                  >
                    {dir}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Special Effects */}
          <View className="gap-3 bg-surface rounded-xl p-4">
            <Text className="text-sm font-semibold text-foreground">Effects</Text>
            <CameraSlider
              label="Handheld Shake"
              value={camera.handheldIntensity}
              min={0}
              max={100}
              step={5}
              onChange={(v) => setCamera({ ...camera, handheldIntensity: v })}
              colors={colors}
            />
            <CameraSlider
              label="Motion Blur"
              value={camera.motionBlur}
              min={0}
              max={100}
              step={5}
              onChange={(v) => setCamera({ ...camera, motionBlur: v })}
              colors={colors}
            />
            <CameraSlider
              label="Depth of Field"
              value={camera.depthOfField}
              min={0}
              max={100}
              step={5}
              onChange={(v) => setCamera({ ...camera, depthOfField: v })}
              colors={colors}
            />
          </View>

          {/* Timing */}
          <View className="gap-3 bg-surface rounded-xl p-4">
            <Text className="text-sm font-semibold text-foreground">Timing</Text>
            <CameraSlider
              label="Duration (s)"
              value={camera.movementDuration}
              min={0.5}
              max={10}
              step={0.5}
              onChange={(v) => setCamera({ ...camera, movementDuration: v })}
              colors={colors}
            />
          </View>

          {/* Reset Button */}
          <Pressable
            onPress={() => setCamera(DEFAULT_CAMERA_STATE)}
            style={({ pressed }) => [
              {
                paddingVertical: 12,
                borderRadius: 8,
                backgroundColor: colors.error,
                opacity: pressed ? 0.8 : 1
              }
            ]}
          >
            <Text className="text-center text-sm font-semibold text-background">
              Reset to Default
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
