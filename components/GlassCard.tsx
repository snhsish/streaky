import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useColorScheme } from './useColorScheme';

export default function GlassCard({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const scheme = useColorScheme();
  const dark = scheme === 'dark';
  return (
    <View style={[styles.wrap, { shadowColor: dark ? '#fff' : '#000' }, style]}>
      <BlurView intensity={dark ? 50 : 70} tint={dark ? 'dark' : 'light'} style={styles.blur}>
        <LinearGradient
          colors={dark ? ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.02)'] : ['rgba(255,255,255,0.7)', 'rgba(255,255,255,0.25)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        {children}
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(128,128,128,0.28)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 2,
  },
  blur: {
    padding: 16,
    overflow: 'hidden',
  },
});
