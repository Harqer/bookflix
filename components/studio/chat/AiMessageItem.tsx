import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Clapperboard, Trash2 } from 'lucide-react-native';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';

interface AiMessageItemProps {
  msg: {
    _id: any;
    role: 'user' | 'ai';
    text: string;
  };
  playTap?: () => void;
}

const TypewriterText = ({ text, style, onComplete }: { text: string, style: any, onComplete?: () => void }) => {
  const [displayedText, setDisplayedText] = React.useState('');
  
  React.useEffect(() => {
    let index = 0;
    setDisplayedText('');
    const timer = setInterval(() => {
      setDisplayedText((prev) => prev + text.charAt(index));
      index++;
      if (index >= text.length) {
        clearInterval(timer);
        onComplete?.();
      }
    }, 15); // 🚀 Faster for long chat messages
    return () => clearInterval(timer);
  }, [text]);

  return <Text style={style}>{displayedText}</Text>;
};

export function AiMessageItem({ msg, playTap }: AiMessageItemProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const isAI = msg.role === 'ai';
  const shouldTruncate = isAI && msg.text.length > 300;
  const deleteMessage = useMutation(api.studio.deleteMessage);
  
  return (
    <View style={{ 
      alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', 
      width: isAI ? '100%' : 'auto',
      maxWidth: '95%',
      minWidth: msg.role === 'user' ? '70%' : 'auto',
      marginBottom: 24,
    }}>
      {isAI && (
        <View style={styles.aiLabel}>
          <View style={styles.aiIcon}>
            <Clapperboard size={10} color="white" />
          </View>
          <Text style={styles.aiLabelText}>NOLAN AI • DIRECTOR</Text>
        </View>
      )}
      <View style={{ width: '100%' }}>
        <TouchableOpacity 
          activeOpacity={isAI ? 0.9 : 1}
          onPress={() => isAI && setIsExpanded(!isExpanded)}
          style={[
            styles.bubble,
            msg.role === 'user' ? styles.userBubble : styles.aiBubble,
            { width: '100%' }
          ]}
        >
          {isAI ? (
            <TypewriterText 
              text={msg.text} 
              style={[
                styles.bubbleText,
                { color: 'rgba(255,255,255,0.9)' }
              ]} 
            />
          ) : (
            <Text style={[
              styles.bubbleText,
              { color: 'white' }
            ]}>
              {msg.text}
            </Text>
          )}
          {shouldTruncate && !isExpanded && (
            <View style={styles.expandHint}>
              <Text style={styles.expandHintText}>TAP TO EXPAND BRIEF</Text>
            </View>
          )}

          {/* 🛰️ Enterprise Surgical Delete (Right Aligned) */}
          <TouchableOpacity 
            onPress={(e) => {
              e.stopPropagation();
              console.log("🗑️ Delete pressed for message:", msg._id);
              playTap?.();
              deleteMessage({ messageId: msg._id }).catch(err => {
                console.error("❌ Surgical Delete Failed:", err);
              });
            }}
            style={styles.deleteButton}
          >
            <Trash2 color="rgba(255,255,255,0.2)" size={14} />
          </TouchableOpacity>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  aiLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
    marginLeft: 4,
  },
  aiIcon: {
    width: 20,
    height: 20,
    borderRadius: 6,
    backgroundColor: '#26619C', // 💎 Lapis Blue (Action/Trust)
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiLabelText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  bubble: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
  },
  userBubble: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderColor: 'rgba(255,255,255,0.1)',
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: 'rgba(38, 97, 156, 0.03)', // 💎 Lapis Glass Tint
    borderColor: 'rgba(38, 97, 156, 0.2)', // 💎 Lapis Blue Border
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    fontSize: 16,
    lineHeight: 26,
    fontWeight: '500',
  },
  expandHint: {
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(38, 97, 156, 0.2)', // 💎 Lapis Blue Edge (Replaced Red)
    alignItems: 'center',
  },
  expandHintText: {
    color: '#FDF6EE', // 🏛️ Marble White
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
  deleteButton: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
});
