import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useRef } from 'react';
import { Animated, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { FeedItemType } from '../../types';
import Avatar from '../common/Avatar';

interface FeedItemProps {
  item: FeedItemType;
  onAction: (action: string) => void;
}

const FeedItem: React.FC<FeedItemProps> = ({ item, onAction }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const handleActionPress = (action: string) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onAction(action);
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'celebrate':
        return '👏';
      case 'contribute':
        return '💸';
      case 'view':
        return '📊';
      case 'details':
        return '📈';
      default:
        return '💬';
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.touchable}
      >
        <View style={styles.header}>
          <Avatar
            name={item.user.name}
            avatarUrl={item.user.avatarUrl}
            size={40}
            gradientColors={item.user.gradientColors}
          />
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{item.user.name}</Text>
            <Text style={styles.timestamp}>{item.timestamp}</Text>
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.contentText}>{item.content}</Text>
          {item.amount && (
            <Text style={styles.amount}>
              {item.type === 'expense' ? '-' : '+'}${item.amount}
            </Text>
          )}
          {item.progress && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <LinearGradient
                  colors={['#00ff88', '#00ccff']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[
                    styles.progressFill,
                    { width: `${(item.progress.current / item.progress.total) * 100}%` },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                ${item.progress.current} / ${item.progress.total}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.tags}>
          {item.tags.map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>

        <View style={styles.actions}>
          {item.actions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={styles.actionButton}
              onPress={() => handleActionPress(action.type)}
            >
              <Text style={styles.actionIcon}>{getActionIcon(action.type)}</Text>
              <Text style={styles.actionText}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  touchable: {
    backgroundColor: '#111',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#222',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  userInfo: {
    marginLeft: 12,
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  timestamp: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  content: {
    marginBottom: 12,
  },
  contentText: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20,
  },
  amount: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 8,
    color: '#00ff88',
  },
  progressContainer: {
    marginTop: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(0, 255, 136, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  tag: {
    backgroundColor: 'rgba(0, 255, 136, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#00ff88',
  },
  tagText: {
    fontSize: 12,
    color: '#00ff88',
  },
  actions: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionIcon: {
    fontSize: 16,
  },
  actionText: {
    fontSize: 14,
    color: '#666',
  },
});

export default FeedItem;
