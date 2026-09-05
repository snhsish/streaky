import { BlurView } from 'expo-blur';
import { useColorScheme } from 'react-native';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

export default function GlassCard({ children }: { children: ReactNode }) {
  const scheme = useColorScheme();
  return (
    <View style={styles.wrap}>
      <BlurView
        intensity={scheme === 'dark' ? 40 : 60}
        tint={scheme === 'dark' ? 'dark' : 'light'}
        style={styles.blur}
      >
        {children}
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(128,128,128,0.25)',
  },
  blur: {
    padding: 14,
  },
});
