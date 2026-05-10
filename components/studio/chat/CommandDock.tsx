import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Platform, Text, Animated } from 'react-native';
import { PlusCircle, Send, Clapperboard, Tv } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { Button } from '../../ui/Button';

interface CommandDockProps {
  prompt: string;
  setPrompt: (text: string) => void;
  handleSend: () => void;
  handlePickFile: () => void;
  selectedFile: any;
  isSubmitting: boolean;
  insets: any;
  isFocused: boolean;
  setIsFocused: (focused: boolean) => void;
  productionMode: 'movie' | 'series';
  setProductionMode: (mode: 'movie' | 'series') => void;
}

export function CommandDock({
  prompt,
  setPrompt,
  handleSend,
  handlePickFile,
  selectedFile,
  isSubmitting,
  insets,
  isFocused,
  setIsFocused,
  productionMode,
  setProductionMode,
}: CommandDockProps) {
  return (
    <View 
      pointerEvents="box-none"
      style={[styles.inputDock, { paddingBottom: insets.bottom + 10 }]}
    >
      <View style={[
        styles.inputContainer,
        isFocused && styles.inputContainerFocused
      ]}>
        <View style={styles.intentGroup}>
          <TouchableOpacity onPress={handlePickFile} style={styles.attachButton}>
            <PlusCircle color={selectedFile ? '#FDF6EE' : 'rgba(255,255,255,0.4)'} size={22} />
          </TouchableOpacity>
          
          <View style={styles.modeToggle}>
            <Animated.View 
              pointerEvents="none"
              style={[
                styles.sliderThumb,
                {
                  transform: [{
                    translateX: productionMode === 'series' ? 44 : 0
                  }]
                }
              ]} 
            />
            <TouchableOpacity 
              onPress={() => setProductionMode('movie')}
              style={[styles.modeButton, { flex: 1, zIndex: 100 }]}
            >
              <Text style={[styles.modeText, productionMode === 'movie' && styles.modeTextActive]}>MOVIE</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => setProductionMode('series')}
              style={[styles.modeButton, { flex: 1, zIndex: 100 }]}
            >
              <Text style={[styles.modeText, productionMode === 'series' && styles.modeTextActive]}>T.V.</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TextInput
          style={[
            styles.input, 
            Platform.OS === 'web' && { cursor: 'text', userSelect: 'text', outline: 'none' } as any
          ]}
          placeholder={productionMode === 'movie' ? "Direct your movie..." : "Script your series..."}
          placeholderTextColor="rgba(255,255,255,0.3)"
          value={prompt}
          onChangeText={setPrompt}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          editable={true}
          multiline={true}
          textAlignVertical="top"
        />
        <Button
          variant="sovereign"
          size="icon"
          onPress={handleSend}
          disabled={!prompt.trim() && !selectedFile}
          className="rounded-xl ml-2"
        >
          <Send color="white" size={18} strokeWidth={2.5} />
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  inputDock: {
    paddingHorizontal: 20,
    paddingTop: 32,
    backgroundColor: '#1C1C1E',
    borderTopWidth: 1,
    borderTopColor: '#121214', // 🌑 Near black for sharp separation
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: '#2C2C2E', // 🩶 Slightly lighter for the input field
    borderRadius: 32,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#3A3A3C', // 💎 Milled metal border
  },
  inputContainerFocused: {
    borderColor: '#3F00FF', // 💎 Ultramarine (High Trust)
    shadowColor: '#3F00FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  intentGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 138, 0, 0.05)', // ⚡ Electric Orange Translucency
    borderRadius: 20,
    padding: 2,
    borderWidth: 0.5,
    borderColor: '#FF8A00', // ⚡ Electric Orange Filigree
    width: 92,
    height: 32,
    position: 'relative',
    overflow: 'hidden',
  },
  sliderThumb: {
    position: 'absolute',
    top: 2,
    left: 2,
    width: 44,
    height: 28,
    backgroundColor: '#FF8A00', // ⚡ Electric Orange (Action)
    borderRadius: 18,
    zIndex: 1,
    shadowColor: '#FF8A00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
  },
  modeButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10, // 🏛️ Elevated to capture taps over the thumb
  },
  modeText: {
    fontSize: 8,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.3)',
    letterSpacing: 1,
  },
  modeTextActive: {
    color: '#000000', // 🏛️ High Contrast on Amber
  },
  attachButton: {
    padding: 4,
  },
  input: {
    flex: 1,
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
    paddingVertical: 12,
    minHeight: 44,
    maxHeight: 150,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
