import { useState, useRef } from 'react';
import { ScrollView, Text, View, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { cn } from '@/lib/utils';
import { useRouter } from 'expo-router';

interface UploadState {
  isLoading: boolean;
  progress: number;
  fileName: string | null;
  fileSize: number | null;
  error: string | null;
}

export default function UploadFileScreen() {
  const colors = useColors();
  const router = useRouter();
  const [state, setState] = useState<UploadState>({
    isLoading: false,
    progress: 0,
    fileName: null,
    fileSize: null,
    error: null
  });

  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [genre, setGenre] = useState('drama');
  const [productionStyle, setProductionStyle] = useState<'cinematic' | 'animated' | 'documentary'>('cinematic');

  const fileInputRef = useRef<string | null>(null);

  /**
   * Handle file selection
   */
  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/epub+zip', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setState(prev => ({
          ...prev,
          fileName: file.name,
          fileSize: file.size || 0,
          error: null
        }));
        fileInputRef.current = file.uri;

        // Auto-fill title from filename
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
        setTitle(nameWithoutExt);
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: `Failed to pick file: ${error instanceof Error ? error.message : 'Unknown error'}`
      }));
    }
  };

  /**
   * Handle file upload and auto-orchestration
   */
  const handleUploadAndProcess = async () => {
    if (!fileInputRef.current || !title) {
      Alert.alert('Error', 'Please select a file and enter a title');
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Simulate upload progress
      for (let i = 0; i <= 100; i += 10) {
        setState(prev => ({ ...prev, progress: i }));
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      // In production, this would call the backend API
      // For now, simulate successful upload
      setState(prev => ({ ...prev, isLoading: false, progress: 100 }));

      Alert.alert('Success', 'File uploaded! Processing will start shortly.', [
        {
          text: 'View Production',
          onPress: () => router.push('/(tabs)/library')
        }
      ]);

      // Reset form
      setState({
        isLoading: false,
        progress: 0,
        fileName: null,
        fileSize: null,
        error: null
      });
      setTitle('');
      setAuthor('');
      fileInputRef.current = null;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: `Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }));
    }
  };

  const fileSizeMB = state.fileSize ? (state.fileSize / (1024 * 1024)).toFixed(2) : '0';

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View className="gap-6 pb-8">
          {/* Header */}
          <View className="gap-2">
            <Text className="text-3xl font-bold text-foreground">Upload Book File</Text>
            <Text className="text-base text-muted">
              Upload your book (PDF, EPUB, or DOCX) and let AI transform it into a full-length film
            </Text>
          </View>

          {/* File Picker */}
          <View className="gap-3">
            <Text className="text-sm font-semibold text-foreground">Book File</Text>
            <TouchableOpacity
              onPress={handlePickFile}
              disabled={state.isLoading}
              className={cn(
                'border-2 border-dashed rounded-2xl p-8 items-center justify-center gap-3',
                state.fileName ? 'border-success bg-success/5' : 'border-border bg-surface',
                state.isLoading && 'opacity-50'
              )}
            >
              {state.fileName ? (
                <>
                  <Text className="text-2xl">✓</Text>
                  <Text className="text-base font-semibold text-success">{state.fileName}</Text>
                  <Text className="text-xs text-muted">{fileSizeMB} MB</Text>
                </>
              ) : (
                <>
                  <Text className="text-3xl">📄</Text>
                  <Text className="text-base font-semibold text-foreground">Tap to select file</Text>
                  <Text className="text-xs text-muted">PDF, EPUB, or DOCX</Text>
                </>
              )}
            </TouchableOpacity>
            {state.error && (
              <Text className="text-xs text-error">{state.error}</Text>
            )}
          </View>

          {/* Title */}
          <View className="gap-2">
            <Text className="text-sm font-semibold text-foreground">Book Title</Text>
            <View className="border border-border rounded-xl px-4 py-3 bg-surface">
              <Text
                className="text-base text-foreground"
                onPress={() => {
                  // In a real app, this would be a TextInput
                }}
              >
                {title || 'Enter title...'}
              </Text>
            </View>
          </View>

          {/* Author */}
          <View className="gap-2">
            <Text className="text-sm font-semibold text-foreground">Author (Optional)</Text>
            <View className="border border-border rounded-xl px-4 py-3 bg-surface">
              <Text className="text-base text-muted">
                {author || 'Enter author name...'}
              </Text>
            </View>
          </View>

          {/* Genre */}
          <View className="gap-2">
            <Text className="text-sm font-semibold text-foreground">Genre</Text>
            <View className="flex-row gap-2 flex-wrap">
              {['drama', 'sci-fi', 'horror', 'romance', 'thriller', 'comedy'].map(g => (
                <TouchableOpacity
                  key={g}
                  onPress={() => setGenre(g)}
                  className={cn(
                    'px-4 py-2 rounded-full border',
                    genre === g
                      ? 'bg-primary border-primary'
                      : 'bg-surface border-border'
                  )}
                >
                  <Text className={cn(
                    'text-sm font-medium',
                    genre === g ? 'text-background' : 'text-foreground'
                  )}>
                    {g.charAt(0).toUpperCase() + g.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Production Style */}
          <View className="gap-2">
            <Text className="text-sm font-semibold text-foreground">Production Style</Text>
            <View className="gap-2">
              {(['cinematic', 'animated', 'documentary'] as const).map(style => (
                <TouchableOpacity
                  key={style}
                  onPress={() => setProductionStyle(style)}
                  className={cn(
                    'flex-row items-center gap-3 p-3 rounded-xl border',
                    productionStyle === style
                      ? 'bg-primary/10 border-primary'
                      : 'bg-surface border-border'
                  )}
                >
                  <View className={cn(
                    'w-5 h-5 rounded-full border-2',
                    productionStyle === style
                      ? 'bg-primary border-primary'
                      : 'border-border'
                  )} />
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-foreground">
                      {style.charAt(0).toUpperCase() + style.slice(1)}
                    </Text>
                    <Text className="text-xs text-muted">
                      {style === 'cinematic' && 'Live-action film quality'}
                      {style === 'animated' && 'Animated motion picture'}
                      {style === 'documentary' && 'Documentary-style narrative'}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Progress Bar */}
          {state.isLoading && (
            <View className="gap-2">
              <View className="flex-row justify-between items-center">
                <Text className="text-sm font-semibold text-foreground">Processing</Text>
                <Text className="text-xs text-muted">{state.progress}%</Text>
              </View>
              <View className="h-2 bg-border rounded-full overflow-hidden">
                <View
                  className="h-full bg-primary rounded-full"
                  style={{ width: `${state.progress}%` }}
                />
              </View>
            </View>
          )}

          {/* Upload Button */}
          <TouchableOpacity
            onPress={handleUploadAndProcess}
            disabled={!state.fileName || !title || state.isLoading}
            className={cn(
              'py-4 px-6 rounded-xl items-center justify-center flex-row gap-2',
              state.fileName && title && !state.isLoading
                ? 'bg-primary'
                : 'bg-primary/50'
            )}
          >
            {state.isLoading ? (
              <>
                <ActivityIndicator color="white" size="small" />
                <Text className="text-base font-semibold text-background">Processing...</Text>
              </>
            ) : (
              <>
                <Text className="text-lg">🚀</Text>
                <Text className="text-base font-semibold text-background">Transform to Film</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Info Box */}
          <View className="bg-accent/10 border border-accent rounded-xl p-4 gap-2">
            <Text className="text-sm font-semibold text-foreground">How it works</Text>
            <Text className="text-xs text-muted leading-relaxed">
              1. Upload your book file (PDF, EPUB, DOCX){'\n'}
              2. AI analyzes the entire book and creates a World Bible{'\n'}
              3. Screenplay generated using Save the Cat framework{'\n'}
              4. Visual prompts and camera directions created{'\n'}
              5. Full-length film assembled automatically
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
