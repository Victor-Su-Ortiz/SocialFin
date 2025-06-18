import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Image, StyleSheet, Text } from 'react-native';

interface AvatarProps {
  name: string;
  avatarUrl?: string;
  size?: number;
  gradientColors?: readonly [string, string, ...string[]];
}

const Avatar: React.FC<AvatarProps> = ({
  name,
  avatarUrl,
  size = 40,
  gradientColors = ['#ff00ff', '#00ccff'] as const,
}) => {
  const initials = name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  if (avatarUrl) {
    return (
      <Image
        source={{ uri: avatarUrl }}
        style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]}
      />
    );
  }

  return (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.container, { width: size, height: size, borderRadius: size / 2 }]}
    >
      <Text style={[styles.initials, { fontSize: size * 0.4 }]}>{initials}</Text>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    backgroundColor: '#222',
  },
  initials: {
    color: 'white',
    fontWeight: '600',
  },
});

export default Avatar;
