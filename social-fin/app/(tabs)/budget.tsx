import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Category {
  name: string;
  icon: string;
  spent: number;
  budget: number;
  color: string;
}

interface SpendingTrend {
  month: string;
  amount: number;
}

const categories: Category[] = [
  { name: 'Food & Dining', icon: '🍽️', spent: 450, budget: 600, color: '#ff6b6b' },
  { name: 'Transport', icon: '🚗', spent: 200, budget: 300, color: '#feca57' },
  { name: 'Shopping', icon: '🛍️', spent: 350, budget: 400, color: '#48dbfb' },
  { name: 'Entertainment', icon: '🎬', spent: 150, budget: 200, color: '#ff9ff3' },
  { name: 'Bills', icon: '📱', spent: 800, budget: 850, color: '#54a0ff' },
  { name: 'Healthcare', icon: '🏥', spent: 100, budget: 150, color: '#00ff88' },
];

const spendingTrends: SpendingTrend[] = [
  { month: 'Jan', amount: 2400 },
  { month: 'Feb', amount: 2100 },
  { month: 'Mar', amount: 2800 },
  { month: 'Apr', amount: 2300 },
  { month: 'May', amount: 2500 },
  { month: 'Jun', amount: 2200 },
];

export default function BudgetScreen() {
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');
  const totalBudget = categories.reduce((sum, cat) => sum + cat.budget, 0);
  const totalSpent = categories.reduce((sum, cat) => sum + cat.spent, 0);
  const remainingBudget = totalBudget - totalSpent;
  const spentPercentage = (totalSpent / totalBudget) * 100;

  const handlePeriodChange = (period: 'week' | 'month' | 'year') => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedPeriod(period);
  };

  const renderProgressBar = (spent: number, budget: number, color: string) => {
    const percentage = Math.min((spent / budget) * 100, 100);
    const isOverBudget = spent > budget;

    return (
      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${percentage}%`,
              backgroundColor: isOverBudget ? '#ff4444' : color,
            },
          ]}
        />
      </View>
    );
  };

  const maxTrend = Math.max(...spendingTrends.map((t) => t.amount));
  const chartHeight = 150;

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.title}>Budget</Text>
            <TouchableOpacity>
              <Ionicons name="settings-outline" size={24} color="white" />
            </TouchableOpacity>
          </View>

          {/* Period Selector */}
          <View style={styles.periodSelector}>
            {(['week', 'month', 'year'] as const).map((period) => (
              <TouchableOpacity
                key={period}
                style={[
                  styles.periodButton,
                  selectedPeriod === period && styles.periodButtonActive,
                ]}
                onPress={() => handlePeriodChange(period)}
              >
                <Text
                  style={[styles.periodText, selectedPeriod === period && styles.periodTextActive]}
                >
                  {period.charAt(0).toUpperCase() + period.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Budget Overview Card */}
          <LinearGradient colors={['#111', '#1a1a1a']} style={styles.overviewCard}>
            <View style={styles.overviewHeader}>
              <Text style={styles.overviewTitle}>This {selectedPeriod}</Text>
              <Text style={styles.overviewPercentage}>{spentPercentage.toFixed(0)}%</Text>
            </View>

            <View style={styles.overviewAmounts}>
              <View>
                <Text style={styles.amountLabel}>Spent</Text>
                <Text style={styles.amountValue}>${totalSpent.toLocaleString()}</Text>
              </View>
              <View style={styles.amountDivider} />
              <View>
                <Text style={styles.amountLabel}>Budget</Text>
                <Text style={styles.amountValue}>${totalBudget.toLocaleString()}</Text>
              </View>
              <View style={styles.amountDivider} />
              <View>
                <Text style={styles.amountLabel}>Remaining</Text>
                <Text style={[styles.amountValue, { color: '#00ff88' }]}>
                  ${remainingBudget.toLocaleString()}
                </Text>
              </View>
            </View>

            <View style={styles.overviewProgressBar}>
              <LinearGradient
                colors={spentPercentage > 80 ? ['#ff6b6b', '#ff4444'] : ['#00ff88', '#00ccff']}
                style={[styles.overviewProgressFill, { width: `${spentPercentage}%` }]}
              />
            </View>
          </LinearGradient>

          {/* Spending Trends */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Spending Trends</Text>
            <View style={styles.chart}>
              <View style={styles.chartBars}>
                {spendingTrends.map((trend, index) => {
                  const height = (trend.amount / maxTrend) * chartHeight;
                  return (
                    <TouchableOpacity
                      key={index}
                      style={styles.chartBarContainer}
                      onPress={() => {
                        if (Platform.OS === 'ios') {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        }
                      }}
                    >
                      <Text style={styles.chartValue}>${trend.amount}</Text>
                      <View style={[styles.chartBar, { height }]}>
                        <LinearGradient
                          colors={['#00ff88', '#00ccff']}
                          style={styles.chartBarGradient}
                        />
                      </View>
                      <Text style={styles.chartLabel}>{trend.month}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>

          {/* Categories */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Categories</Text>
              <TouchableOpacity>
                <Text style={styles.seeAll}>Edit budgets →</Text>
              </TouchableOpacity>
            </View>

            {categories.map((category, index) => (
              <TouchableOpacity
                key={index}
                style={styles.categoryItem}
                onPress={() => {
                  if (Platform.OS === 'ios') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                }}
              >
                <View style={styles.categoryHeader}>
                  <View style={styles.categoryInfo}>
                    <Text style={styles.categoryIcon}>{category.icon}</Text>
                    <Text style={styles.categoryName}>{category.name}</Text>
                  </View>
                  <View style={styles.categoryAmounts}>
                    <Text style={styles.categorySpent}>${category.spent}</Text>
                    <Text style={styles.categoryBudget}>/ ${category.budget}</Text>
                  </View>
                </View>
                {renderProgressBar(category.spent, category.budget, category.color)}
                {category.spent > category.budget && (
                  <Text style={styles.overBudgetWarning}>
                    Over budget by ${(category.spent - category.budget).toFixed(2)}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* AI Insights */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>AI Insights</Text>
            <TouchableOpacity style={styles.insightCard}>
              <LinearGradient
                colors={['rgba(0, 255, 136, 0.1)', 'rgba(0, 204, 255, 0.1)']}
                style={styles.insightGradient}
              >
                <View style={styles.insightHeader}>
                  <Text style={styles.insightEmoji}>💡</Text>
                  <Text style={styles.insightTitle}>Savings Opportunity</Text>
                </View>
                <Text style={styles.insightText}>
                  You could save $85/month by reducing dining expenses to match last month&apos;s
                  average.
                </Text>
                <Text style={styles.insightAction}>View suggestions →</Text>
              </LinearGradient>
            </TouchableOpacity>
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
  periodSelector: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 4,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  periodButtonActive: {
    backgroundColor: '#222',
  },
  periodText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  periodTextActive: {
    color: '#00ff88',
  },
  overviewCard: {
    marginHorizontal: 20,
    marginBottom: 32,
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#222',
  },
  overviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  overviewTitle: {
    fontSize: 18,
    color: '#ccc',
  },
  overviewPercentage: {
    fontSize: 24,
    fontWeight: '700',
    color: '#00ff88',
  },
  overviewAmounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  amountLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 20,
    fontWeight: '600',
    color: 'white',
  },
  amountDivider: {
    width: 1,
    backgroundColor: '#333',
  },
  overviewProgressBar: {
    height: 8,
    backgroundColor: '#222',
    borderRadius: 4,
    overflow: 'hidden',
  },
  overviewProgressFill: {
    height: '100%',
    borderRadius: 4,
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
  chart: {
    height: 200,
    backgroundColor: '#111',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#222',
  },
  chartBars: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: '100%',
  },
  chartBarContainer: {
    flex: 1,
    alignItems: 'center',
  },
  chartBar: {
    width: '60%',
    borderRadius: 4,
    overflow: 'hidden',
    marginVertical: 8,
  },
  chartBarGradient: {
    width: '100%',
    height: '100%',
  },
  chartValue: {
    fontSize: 10,
    color: '#666',
    marginBottom: 4,
  },
  chartLabel: {
    fontSize: 12,
    color: '#666',
  },
  categoryItem: {
    backgroundColor: '#111',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#222',
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  categoryName: {
    fontSize: 16,
    color: 'white',
    fontWeight: '500',
  },
  categoryAmounts: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  categorySpent: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  categoryBudget: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#222',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  overBudgetWarning: {
    fontSize: 12,
    color: '#ff4444',
    marginTop: 8,
  },
  insightCard: {
    marginBottom: 100,
  },
  insightGradient: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 136, 0.3)',
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  insightEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  insightText: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20,
    marginBottom: 12,
  },
  insightAction: {
    fontSize: 14,
    color: '#00ff88',
    fontWeight: '500',
  },
});
