import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Avatar from '../../components/common/Avatar';

interface Friend {
  id: string;
  name: string;
  avatarUrl?: string;
  balance: number;
  lastActivity: string;
  gradientColors?: string[];
}

interface Group {
  id: string;
  name: string;
  icon: string;
  members: number;
  totalBalance: number;
  color: string[];
}

interface Activity {
  id: string;
  type: 'payment' | 'expense' | 'settlement';
  description: string;
  amount: number;
  user: string;
  time: string;
  participants: string[];
}

const friends: Friend[] = [
  {
    id: '1',
    name: 'Sarah Chen',
    balance: -45.5,
    lastActivity: 'Owes you for dinner',
    gradientColors: ['#00ff88', '#00ccff'],
  },
  {
    id: '2',
    name: 'Mike Johnson',
    balance: 120.0,
    lastActivity: 'You owe for concert tickets',
    gradientColors: ['#ff6b6b', '#feca57'],
  },
  {
    id: '3',
    name: 'Emma Wilson',
    balance: 0,
    lastActivity: 'Settled up',
    gradientColors: ['#a55eea', '#fd79a8'],
  },
  {
    id: '4',
    name: 'James Park',
    balance: -850.0,
    lastActivity: 'Owes you for rent',
    gradientColors: ['#00d2d3', '#54a0ff'],
  },
];

const groups: Group[] = [
  {
    id: '1',
    name: 'House Expenses',
    icon: '🏠',
    members: 4,
    totalBalance: -250.0,
    color: ['#ff6b6b', '#ff9ff3'],
  },
  {
    id: '2',
    name: 'Europe Trip',
    icon: '✈️',
    members: 6,
    totalBalance: 450.0,
    color: ['#00ff88', '#00ccff'],
  },
  {
    id: '3',
    name: 'Birthday Party',
    icon: '🎉',
    members: 8,
    totalBalance: 0,
    color: ['#feca57', '#ff6b6b'],
  },
];

const recentActivity: Activity[] = [
  {
    id: '1',
    type: 'expense',
    description: 'Dinner at Nobu',
    amount: 250.0,
    user: 'You',
    time: '2 hours ago',
    participants: ['Sarah', 'Mike', 'Emma'],
  },
  {
    id: '2',
    type: 'payment',
    description: 'Sarah paid you',
    amount: 45.5,
    user: 'Sarah Chen',
    time: '5 hours ago',
    participants: ['You'],
  },
  {
    id: '3',
    type: 'settlement',
    description: 'Settled up with Emma',
    amount: 0,
    user: 'Emma Wilson',
    time: 'Yesterday',
    participants: ['You'],
  },
];

export default function FriendsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'friends' | 'groups' | 'activity'>('friends');

  const totalOwedToYou = friends.reduce(
    (sum, friend) => (friend.balance < 0 ? sum + Math.abs(friend.balance) : sum),
    0
  );
  const totalYouOwe = friends.reduce(
    (sum, friend) => (friend.balance > 0 ? sum + friend.balance : sum),
    0
  );
  const netBalance = totalOwedToYou - totalYouOwe;

  const handleTabChange = (tab: 'friends' | 'groups' | 'activity') => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setActiveTab(tab);
  };

  const renderFriendItem = (friend: Friend) => (
    <TouchableOpacity
      key={friend.id}
      style={styles.friendItem}
      onPress={() => {
        if (Platform.OS === 'ios') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      }}
    >
      <Avatar
        name={friend.name}
        avatarUrl={friend.avatarUrl}
        size={48}
        gradientColors={friend.gradientColors as [string, string, ...string[]] | undefined}
      />
      <View style={styles.friendInfo}>
        <Text style={styles.friendName}>{friend.name}</Text>
        <Text style={styles.friendActivity}>{friend.lastActivity}</Text>
      </View>
      <View style={styles.friendBalance}>
        {friend.balance !== 0 && (
          <>
            <Text
              style={[styles.balanceAmount, friend.balance < 0 ? styles.owesYou : styles.youOwe]}
            >
              ${Math.abs(friend.balance).toFixed(2)}
            </Text>
            <Text style={styles.balanceLabel}>{friend.balance < 0 ? 'owes you' : 'you owe'}</Text>
          </>
        )}
        {friend.balance === 0 && (
          <View style={styles.settledBadge}>
            <Text style={styles.settledText}>Settled</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderGroupItem = (group: Group) => (
    <TouchableOpacity
      key={group.id}
      style={styles.groupItem}
      onPress={() => {
        if (Platform.OS === 'ios') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      }}
    >
      <LinearGradient
        colors={group.color as [string, string, ...string[]]}
        style={styles.groupIcon}
      >
        <Text style={styles.groupEmoji}>{group.icon}</Text>
      </LinearGradient>
      <View style={styles.groupInfo}>
        <Text style={styles.groupName}>{group.name}</Text>
        <Text style={styles.groupMembers}>{group.members} members</Text>
      </View>
      <View style={styles.groupBalance}>
        <Text
          style={[styles.balanceAmount, group.totalBalance < 0 ? styles.owesYou : styles.youOwe]}
        >
          ${Math.abs(group.totalBalance).toFixed(2)}
        </Text>
        {group.totalBalance !== 0 && (
          <Text style={styles.balanceLabel}>
            {group.totalBalance < 0 ? 'total owed' : 'you owe'}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderActivityItem = (activity: Activity) => (
    <View key={activity.id} style={styles.activityItem}>
      <View style={styles.activityIcon}>
        {activity.type === 'expense' && <Text>💸</Text>}
        {activity.type === 'payment' && <Text>💰</Text>}
        {activity.type === 'settlement' && <Text>✅</Text>}
      </View>
      <View style={styles.activityInfo}>
        <Text style={styles.activityDescription}>{activity.description}</Text>
        <Text style={styles.activityDetails}>
          {activity.user} • {activity.participants.join(', ')}
        </Text>
      </View>
      <View style={styles.activityAmount}>
        {activity.amount > 0 && (
          <Text style={styles.activityAmountText}>${activity.amount.toFixed(2)}</Text>
        )}
        <Text style={styles.activityTime}>{activity.time}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>Friends</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerButton}>
              <Ionicons name="person-add-outline" size={24} color="white" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton}>
              <Ionicons name="add-circle-outline" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Balance Overview */}
        <View style={styles.balanceOverview}>
          <View style={styles.balanceItem}>
            <Text style={styles.balanceItemLabel}>They owe you</Text>
            <Text style={[styles.balanceItemAmount, styles.owesYou]}>
              ${totalOwedToYou.toFixed(2)}
            </Text>
          </View>
          <View style={styles.balanceDivider} />
          <View style={styles.balanceItem}>
            <Text style={styles.balanceItemLabel}>You owe</Text>
            <Text style={[styles.balanceItemAmount, styles.youOwe]}>${totalYouOwe.toFixed(2)}</Text>
          </View>
          <View style={styles.balanceDivider} />
          <View style={styles.balanceItem}>
            <Text style={styles.balanceItemLabel}>Net balance</Text>
            <Text
              style={[styles.balanceItemAmount, netBalance >= 0 ? styles.owesYou : styles.youOwe]}
            >
              ${Math.abs(netBalance).toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search friends or groups..."
            placeholderTextColor="#666"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          {(['friends', 'groups', 'activity'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.activeTab]}
              onPress={() => handleTabChange(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Content */}
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          {activeTab === 'friends' && (
            <View style={styles.listContainer}>{friends.map(renderFriendItem)}</View>
          )}

          {activeTab === 'groups' && (
            <View style={styles.listContainer}>
              {groups.map(renderGroupItem)}
              <TouchableOpacity style={styles.createGroupButton}>
                <LinearGradient
                  colors={['rgba(0, 255, 136, 0.1)', 'rgba(0, 204, 255, 0.1)']}
                  style={styles.createGroupGradient}
                >
                  <Ionicons name="add-circle-outline" size={32} color="#00ff88" />
                  <Text style={styles.createGroupText}>Create New Group</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {activeTab === 'activity' && (
            <View style={styles.listContainer}>{recentActivity.map(renderActivityItem)}</View>
          )}

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.quickActionButton}>
              <LinearGradient colors={['#00ff88', '#00ccff']} style={styles.quickActionGradient}>
                <Ionicons name="add" size={24} color="#000" />
                <Text style={styles.quickActionText}>Add Expense</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionButton}>
              <LinearGradient colors={['#ff6b6b', '#feca57']} style={styles.quickActionGradient}>
                <Ionicons name="swap-horizontal" size={24} color="#000" />
                <Text style={styles.quickActionText}>Settle Up</Text>
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
  headerActions: {
    flexDirection: 'row',
    gap: 16,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  balanceOverview: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#111',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#222',
  },
  balanceItem: {
    flex: 1,
    alignItems: 'center',
  },
  balanceItemLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  balanceItemAmount: {
    fontSize: 18,
    fontWeight: '600',
  },
  balanceDivider: {
    width: 1,
    backgroundColor: '#333',
    marginHorizontal: 16,
  },
  owesYou: {
    color: '#00ff88',
  },
  youOwe: {
    color: '#ff6b6b',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#111',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#222',
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: 'white',
  },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#222',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#00ff88',
  },
  content: {
    paddingBottom: 100,
  },
  listContainer: {
    paddingHorizontal: 20,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#222',
  },
  friendInfo: {
    flex: 1,
    marginLeft: 12,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '500',
    color: 'white',
  },
  friendActivity: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  friendBalance: {
    alignItems: 'flex-end',
  },
  balanceAmount: {
    fontSize: 18,
    fontWeight: '600',
  },
  balanceLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  settledBadge: {
    backgroundColor: 'rgba(0, 255, 136, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#00ff88',
  },
  settledText: {
    fontSize: 12,
    color: '#00ff88',
    fontWeight: '500',
  },
  groupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#222',
  },
  groupIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupEmoji: {
    fontSize: 24,
  },
  groupInfo: {
    flex: 1,
    marginLeft: 12,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '500',
    color: 'white',
  },
  groupMembers: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  groupBalance: {
    alignItems: 'flex-end',
  },
  createGroupButton: {
    marginTop: 8,
    marginBottom: 20,
  },
  createGroupGradient: {
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 136, 0.3)',
  },
  createGroupText: {
    fontSize: 16,
    color: '#00ff88',
    marginTop: 8,
    fontWeight: '500',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#222',
  },
  activityIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#222',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityInfo: {
    flex: 1,
    marginLeft: 12,
  },
  activityDescription: {
    fontSize: 16,
    color: 'white',
    fontWeight: '500',
  },
  activityDetails: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  activityAmount: {
    alignItems: 'flex-end',
  },
  activityAmountText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  activityTime: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 20,
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
  },
  quickActionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  quickActionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
});
