import { FeedItemType } from '../types';

export const mockFeedData: FeedItemType[] = [
  {
    id: '1',
    user: {
      id: 'u1',
      name: 'Sarah Chen',
      gradientColors: ['#00ff88', '#00ccff'],
    },
    timestamp: 'just now',
    content: 'Just hit my savings goal! 🎉',
    amount: 5000,
    type: 'achievement',
    tags: ['💰 Savings Goal', '🤖 AI Advised'],
    actions: [
      { type: 'celebrate', label: 'Celebrate' },
      { type: 'comment', label: 'Comment' },
      { type: 'share', label: 'Share' },
    ],
  },
  {
    id: '2',
    user: {
      id: 'u2',
      name: 'Mike Johnson',
      gradientColors: ['#ff6b6b', '#feca57'],
    },
    timestamp: '2 hours ago',
    content: "Started a group fund for our Europe trip! Who's in?",
    type: 'group_fund',
    tags: ['👥 Group Fund', '✈️ Travel'],
    actions: [
      { type: 'contribute', label: 'Contribute' },
      { type: 'view', label: 'View Progress' },
      { type: 'share', label: 'Share' },
    ],
    progress: {
      current: 250,
      total: 3000,
    },
  },
  {
    id: '3',
    user: {
      id: 'ai',
      name: 'AI Assistant',
      gradientColors: ['#00ff88', '#00ccff'],
    },
    timestamp: 'Insight for you',
    content: "You're spending 23% less on dining this month! 📉",
    amount: 142,
    type: 'insight',
    tags: ['🤖 AI Insight', '📊 Analytics'],
    actions: [
      { type: 'details', label: 'View Details' },
      { type: 'goal', label: 'Set New Goal' },
    ],
  },
  {
    id: '4',
    user: {
      id: 'u3',
      name: 'Emma Wilson',
      gradientColors: ['#a55eea', '#fd79a8'],
    },
    timestamp: '5 hours ago',
    content: 'Split the bill at Nobu last night',
    amount: 45,
    type: 'transaction',
    tags: ['🍽️ Dining', '💸 Split'],
    actions: [
      { type: 'paid', label: 'Mark Paid' },
      { type: 'remind', label: 'Send Reminder' },
    ],
  },
  {
    id: '5',
    user: {
      id: 'u4',
      name: 'James Park',
      gradientColors: ['#00d2d3', '#54a0ff'],
    },
    timestamp: '1 day ago',
    content: 'Monthly rent and utilities split',
    amount: 850,
    type: 'expense',
    tags: ['🏠 Housing', '📅 Recurring'],
    actions: [
      { type: 'paid', label: 'Paid' },
      { type: 'history', label: 'View History' },
    ],
  },
];
