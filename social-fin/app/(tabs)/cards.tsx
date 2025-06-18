import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 40;
const CARD_HEIGHT = 220;

interface Card {
  id: string;
  type: 'physical' | 'virtual';
  last4: string;
  balance: number;
  isDefault: boolean;
  color: string[];
  brand: string;
}

const mockCards: Card[] = [
  {
    id: '1',
    type: 'physical',
    last4: '4532',
    balance: 2450.0,
    isDefault: true,
    color: ['#00ff88', '#00ccff'],
    brand: 'visa',
  },
  {
    id: '2',
    type: 'virtual',
    last4: '8921',
    balance: 150.0,
    isDefault: false,
    color: ['#ff6b6b', '#feca57'],
    brand: 'mastercard',
  },
  {
    id: '3',
    type: 'virtual',
    last4: '3847',
    balance: 500.0,
    isDefault: false,
    color: ['#a55eea', '#fd79a8'],
    brand: 'visa',
  },
];

export default function CardsScreen() {
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [cards] = useState<Card[]>(mockCards);
  const scrollX = useRef(new Animated.Value(0)).current;

  const handleCardPress = (index: number) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setActiveCardIndex(index);
  };

  const renderCard = (card: Card, index: number) => {
    const inputRange = [(index - 1) * CARD_WIDTH, index * CARD_WIDTH, (index + 1) * CARD_WIDTH];

    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.9, 1, 0.9],
      extrapolate: 'clamp',
    });

    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.5, 1, 0.5],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View
        key={card.id}
        style={[
          styles.cardContainer,
          {
            transform: [{ scale }],
            opacity,
          },
        ]}
      >
        <TouchableOpacity activeOpacity={0.9} onPress={() => handleCardPress(index)}>
          <LinearGradient
            colors={card.color as [string, string, ...string[]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.card}
          >
            <View style={styles.cardHeader}>
              <View style={styles.cardChip} />
              <Text style={styles.cardType}>
                {card.type === 'physical' ? '💳' : '📱'} {card.type}
              </Text>
            </View>

            <Text style={styles.cardNumber}>•••• •••• •••• {card.last4}</Text>

            <View style={styles.cardFooter}>
              <View>
                <Text style={styles.cardLabel}>Balance</Text>
                <Text style={styles.cardBalance}>${card.balance.toFixed(2)}</Text>
              </View>
              <Text style={styles.cardBrand}>{card.brand.toUpperCase()}</Text>
            </View>

            {card.isDefault && (
              <View style={styles.defaultBadge}>
                <Text style={styles.defaultText}>DEFAULT</Text>
              </View>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const quickActions = [
    { icon: 'lock-closed', label: 'Lock Card', color: '#ff6b6b' },
    { icon: 'settings', label: 'Card Settings', color: '#feca57' },
    { icon: 'document-text', label: 'Statements', color: '#00ccff' },
    { icon: 'shield-checkmark', label: 'Security', color: '#00ff88' },
  ];

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>My Cards</Text>
          <TouchableOpacity style={styles.addButton}>
            <LinearGradient colors={['#00ff88', '#00ccff']} style={styles.addButtonGradient}>
              <Ionicons name="add" size={24} color="#000" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <Animated.ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.cardsScrollContent}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
            useNativeDriver: true,
          })}
          scrollEventThrottle={16}
        >
          {cards.map((card, index) => renderCard(card, index))}
        </Animated.ScrollView>

        <View style={styles.dotsContainer}>
          {cards.map((_, index) => (
            <View key={index} style={[styles.dot, index === activeCardIndex && styles.activeDot]} />
          ))}
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.contentContainer}
        >
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionsGrid}>
              {quickActions.map((action, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.actionItem}
                  onPress={() => {
                    if (Platform.OS === 'ios') {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                  }}
                >
                  <View style={[styles.actionIcon, { backgroundColor: action.color + '20' }]}>
                    <Ionicons name={action.icon as any} size={24} color={action.color} />
                  </View>
                  <Text style={styles.actionLabel}>{action.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Transactions</Text>
              <TouchableOpacity>
                <Text style={styles.seeAll}>See all →</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.transactionsList}>
              {[
                { merchant: 'Spotify', amount: -14.99, time: '2 hours ago', icon: '🎵' },
                { merchant: 'Uber', amount: -23.45, time: '5 hours ago', icon: '🚗' },
                { merchant: 'Amazon', amount: -156.78, time: 'Yesterday', icon: '📦' },
                { merchant: 'Salary Deposit', amount: 3500.0, time: '2 days ago', icon: '💰' },
              ].map((transaction, index) => (
                <TouchableOpacity key={index} style={styles.transactionItem}>
                  <View style={styles.transactionIcon}>
                    <Text style={styles.transactionEmoji}>{transaction.icon}</Text>
                  </View>
                  <View style={styles.transactionDetails}>
                    <Text style={styles.transactionMerchant}>{transaction.merchant}</Text>
                    <Text style={styles.transactionTime}>{transaction.time}</Text>
                  </View>
                  <Text
                    style={[
                      styles.transactionAmount,
                      transaction.amount > 0 ? styles.positiveAmount : styles.negativeAmount,
                    ]}
                  >
                    {transaction.amount > 0 ? '+' : ''}${Math.abs(transaction.amount).toFixed(2)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: 'white',
  },
  addButton: {
    width: 40,
    height: 40,
  },
  addButtonGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardsScrollContent: {
    paddingHorizontal: 20,
  },
  cardContainer: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    marginRight: 20,
  },
  card: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    padding: 24,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardChip: {
    width: 50,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 8,
  },
  cardType: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textTransform: 'capitalize',
  },
  cardNumber: {
    fontSize: 20,
    color: 'white',
    letterSpacing: 2,
    fontWeight: '600',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  cardLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 4,
  },
  cardBalance: {
    fontSize: 24,
    color: 'white',
    fontWeight: '700',
  },
  cardBrand: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
  defaultBadge: {
    position: 'absolute',
    top: 24,
    right: 24,
    backgroundColor: 'rgba(0, 255, 136, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  defaultText: {
    fontSize: 10,
    color: '#00ff88',
    fontWeight: '600',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#333',
  },
  activeDot: {
    backgroundColor: '#00ff88',
    width: 24,
  },
  contentContainer: {
    paddingBottom: 100,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: 'white',
    marginBottom: 16,
  },
  seeAll: {
    color: '#00ff88',
    fontSize: 14,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  actionItem: {
    width: (SCREEN_WIDTH - 40 - 16) / 2,
    backgroundColor: '#111',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#222',
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionLabel: {
    fontSize: 14,
    color: '#ccc',
  },
  transactionsList: {
    backgroundColor: '#111',
    borderRadius: 20,
    padding: 4,
    borderWidth: 1,
    borderColor: '#222',
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#222',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionEmoji: {
    fontSize: 20,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionMerchant: {
    fontSize: 16,
    color: 'white',
    fontWeight: '500',
  },
  transactionTime: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  positiveAmount: {
    color: '#00ff88',
  },
  negativeAmount: {
    color: '#ff6b6b',
  },
});
