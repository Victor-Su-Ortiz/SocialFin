export interface User {
  id: string;
  name: string;
  avatarUrl?: string;
  gradientColors?: string[];
}

export interface FeedAction {
  type: string;
  label: string;
}

export interface FeedProgress {
  current: number;
  total: number;
}

export interface FeedItemType {
  id: string;
  user: User;
  timestamp: string;
  content: string;
  amount?: number;
  type: 'achievement' | 'group_fund' | 'insight' | 'transaction' | 'expense';
  tags: string[];
  actions: FeedAction[];
  progress?: FeedProgress;
}
