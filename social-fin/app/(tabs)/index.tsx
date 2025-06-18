import * as Haptics from 'expo-haptics';
import React, { useRef, useState } from 'react';
import { Animated, Platform, RefreshControl, StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AIFloatingButton from '../../components/common/AIFloatingButton';
import FeedHeader from '../../components/feed/FeedHeader';
import FeedItem from '../../components/feed/FeedItem';
import { FeedItemType } from '../../types';
import { mockFeedData } from '../../utils/mockData';

export default function FeedScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [feedData, setFeedData] = useState<FeedItemType[]>(mockFeedData);
  const scrollY = useRef(new Animated.Value(0)).current;

  const onRefresh = async () => {
    setRefreshing(true);
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setRefreshing(false);
  };

  const handleFeedAction = (itemId: string, action: string) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    console.log(`Action ${action} on item ${itemId}`);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <FeedHeader scrollY={scrollY} balance={12450} />

        <Animated.ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#00ff88"
              progressViewOffset={20}
            />
          }
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
            useNativeDriver: true,
          })}
          scrollEventThrottle={16}
        >
          <View style={styles.feedContainer}>
            {feedData.map((item) => (
              <FeedItem
                key={item.id}
                item={item}
                onAction={(action) => handleFeedAction(item.id, action)}
              />
            ))}
          </View>
        </Animated.ScrollView>

        <AIFloatingButton />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 80, // Account for header
    paddingBottom: 100, // Account for tab bar + floating button
  },
  feedContainer: {
    paddingHorizontal: 20,
  },
});
