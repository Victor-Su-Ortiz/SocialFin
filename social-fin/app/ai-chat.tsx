import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  suggestions?: string[];
  actions?: Action[];
  chart?: ChartData;
}

interface Action {
  type: 'button' | 'link';
  label: string;
  action: string;
  style?: 'primary' | 'secondary';
}

interface ChartData {
  type: 'pie' | 'bar' | 'line';
  data: any;
}

const initialMessages: Message[] = [
  {
    id: '1',
    text: "Hey! I'm your AI financial assistant. I can help you track expenses, analyze spending patterns, and manage shared bills. What would you like to know?",
    sender: 'ai',
    timestamp: new Date(),
    suggestions: [
      "What's my spending this month?",
      'Show me my debts',
      'Help me save money',
      'Analyze my budget',
    ],
  },
];

export default function AIChatScreen() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleClose = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.back();
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;

    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = generateAIResponse(inputText);
      setMessages((prev) => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const generateAIResponse = (userInput: string): Message => {
    const lowerInput = userInput.toLowerCase();

    if (lowerInput.includes('spending') || lowerInput.includes('spent')) {
      return {
        id: Date.now().toString(),
        text: "You've spent $2,847 this month, which is 15% less than last month! 📉 Your biggest categories are:",
        sender: 'ai',
        timestamp: new Date(),
        chart: {
          type: 'pie',
          data: {
            categories: ['Food', 'Transport', 'Shopping', 'Bills'],
            values: [450, 200, 350, 800],
            colors: ['#ff6b6b', '#feca57', '#48dbfb', '#54a0ff'],
          },
        },
        actions: [
          { type: 'button', label: 'View Details', action: 'view_spending', style: 'primary' },
          { type: 'button', label: 'Set Budget Alert', action: 'set_alert', style: 'secondary' },
        ],
      };
    }

    if (lowerInput.includes('debt') || lowerInput.includes('owe')) {
      return {
        id: Date.now().toString(),
        text: "Here's your current debt summary:\n\n💚 People owe you: $940.50\n❤️ You owe: $120.00\n\nNet balance: +$820.50",
        sender: 'ai',
        timestamp: new Date(),
        actions: [
          { type: 'button', label: 'Send Reminders', action: 'send_reminders', style: 'primary' },
          { type: 'button', label: 'Settle Up', action: 'settle_up', style: 'secondary' },
        ],
      };
    }

    if (lowerInput.includes('save') || lowerInput.includes('saving')) {
      return {
        id: Date.now().toString(),
        text: 'Based on your spending patterns, here are 3 ways you could save money:\n\n1. 🍽️ Reduce dining out by 20% → Save $90/month\n2. 🚗 Use public transport 2x/week → Save $40/month\n3. 📱 Switch to annual subscriptions → Save $35/month\n\nTotal potential savings: $165/month! 💰',
        sender: 'ai',
        timestamp: new Date(),
        actions: [
          {
            type: 'button',
            label: 'Create Savings Plan',
            action: 'savings_plan',
            style: 'primary',
          },
        ],
      };
    }

    // Default response
    return {
      id: Date.now().toString(),
      text: "I can help you with that! Could you be more specific about what you'd like to know?",
      sender: 'ai',
      timestamp: new Date(),
      suggestions: ['Track an expense', 'View my budget', 'Split a bill', 'Financial insights'],
    };
  };

  const handleSuggestion = (suggestion: string) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setInputText(suggestion);
  };

  const handleAction = (action: Action) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    console.log('Action pressed:', action.action);
    // Handle navigation or actions here
  };

  const renderMessage = (message: Message) => {
    const isAI = message.sender === 'ai';

    return (
      <Animated.View
        key={message.id}
        style={[
          styles.messageContainer,
          isAI ? styles.aiMessage : styles.userMessage,
          { opacity: fadeAnim },
        ]}
      >
        {isAI && (
          <LinearGradient colors={['#00ff88', '#00ccff']} style={styles.aiAvatar}>
            <Text style={styles.aiAvatarText}>✨</Text>
          </LinearGradient>
        )}

        <View style={[styles.messageBubble, isAI ? styles.aiBubble : styles.userBubble]}>
          <Text style={[styles.messageText, isAI ? styles.aiText : styles.userText]}>
            {message.text}
          </Text>

          {message.chart && renderChart(message.chart)}

          {message.actions && (
            <View style={styles.actionsContainer}>
              {message.actions.map((action, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => handleAction(action)}
                  style={[
                    styles.actionButton,
                    action.style === 'primary' ? styles.primaryAction : styles.secondaryAction,
                  ]}
                >
                  <Text
                    style={[
                      styles.actionText,
                      action.style === 'primary'
                        ? styles.primaryActionText
                        : styles.secondaryActionText,
                    ]}
                  >
                    {action.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {message.suggestions && (
            <View style={styles.suggestionsContainer}>
              {message.suggestions.map((suggestion, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.suggestionChip}
                  onPress={() => handleSuggestion(suggestion)}
                >
                  <Text style={styles.suggestionText}>{suggestion}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {!isAI && (
          <View style={styles.userAvatar}>
            <Text style={styles.userAvatarText}>You</Text>
          </View>
        )}
      </Animated.View>
    );
  };

  const renderChart = (chart: ChartData) => {
    if (chart.type === 'pie') {
      return (
        <View style={styles.chartContainer}>
          <View style={styles.pieChart}>
            {chart.data.categories.map((category: string, index: number) => (
              <View key={index} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: chart.data.colors[index] }]} />
                <Text style={styles.legendText}>
                  {category}: ${chart.data.values[index]}
                </Text>
              </View>
            ))}
          </View>
        </View>
      );
    }
    return null;
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* Header */}
        <BlurView intensity={80} tint="dark" style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <LinearGradient colors={['#00ff88', '#00ccff']} style={styles.headerAvatar}>
              <Text style={styles.headerAvatarText}>✨</Text>
            </LinearGradient>
            <View>
              <Text style={styles.headerTitle}>AI Assistant</Text>
              <Text style={styles.headerSubtitle}>Always here to help</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.menuButton}>
            <Ionicons name="ellipsis-horizontal" size={24} color="white" />
          </TouchableOpacity>
        </BlurView>

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map(renderMessage)}

          {isTyping && (
            <View style={[styles.messageContainer, styles.aiMessage]}>
              <LinearGradient colors={['#00ff88', '#00ccff']} style={styles.aiAvatar}>
                <Text style={styles.aiAvatarText}>✨</Text>
              </LinearGradient>
              <View style={[styles.messageBubble, styles.aiBubble, styles.typingBubble]}>
                <ActivityIndicator size="small" color="#00ff88" />
              </View>
            </View>
          )}
        </ScrollView>

        {/* Quick Actions */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.quickActions}
          contentContainerStyle={styles.quickActionsContent}
        >
          {[
            { icon: 'add-circle', label: 'Add Expense' },
            { icon: 'people', label: 'Split Bill' },
            { icon: 'trending-up', label: 'Insights' },
            { icon: 'calculator', label: 'Budget' },
          ].map((action, index) => (
            <TouchableOpacity key={index} style={styles.quickAction}>
              <Ionicons name={action.icon as any} size={20} color="#00ff88" />
              <Text style={styles.quickActionText}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Input */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Ask me anything..."
                placeholderTextColor="#666"
                value={inputText}
                onChangeText={setInputText}
                multiline
                onSubmitEditing={handleSend}
              />
              <TouchableOpacity
                style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
                onPress={handleSend}
                disabled={!inputText.trim()}
              >
                <LinearGradient
                  colors={inputText.trim() ? ['#00ff88', '#00ccff'] : ['#333', '#333']}
                  style={styles.sendButtonGradient}
                >
                  <Ionicons name="send" size={20} color={inputText.trim() ? '#000' : '#666'} />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerAvatarText: {
    fontSize: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  menuButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    paddingVertical: 20,
  },
  messageContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  aiMessage: {
    justifyContent: 'flex-start',
  },
  userMessage: {
    justifyContent: 'flex-end',
  },
  aiAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  aiAvatarText: {
    fontSize: 16,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#222',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  userAvatarText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  messageBubble: {
    maxWidth: '75%',
    padding: 16,
    borderRadius: 20,
  },
  aiBubble: {
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#222',
    borderTopLeftRadius: 4,
  },
  userBubble: {
    backgroundColor: '#1a1a1a',
    borderTopRightRadius: 4,
  },
  typingBubble: {
    paddingVertical: 20,
    paddingHorizontal: 24,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  aiText: {
    color: '#fff',
  },
  userText: {
    color: '#fff',
  },
  suggestionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 8,
  },
  suggestionChip: {
    backgroundColor: 'rgba(0, 255, 136, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 136, 0.3)',
  },
  suggestionText: {
    fontSize: 14,
    color: '#00ff88',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  primaryAction: {
    backgroundColor: '#00ff88',
  },
  secondaryAction: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#00ff88',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  primaryActionText: {
    color: '#000',
  },
  secondaryActionText: {
    color: '#00ff88',
  },
  chartContainer: {
    marginTop: 12,
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
  },
  pieChart: {
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 14,
    color: '#ccc',
  },
  quickActions: {
    maxHeight: 60,
    borderTopWidth: 1,
    borderTopColor: '#222',
  },
  quickActionsContent: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
  },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
    borderWidth: 1,
    borderColor: '#222',
  },
  quickActionText: {
    fontSize: 14,
    color: '#ccc',
  },
  inputContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#222',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#111',
    borderRadius: 24,
    paddingLeft: 16,
    paddingRight: 4,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#222',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: 'white',
    paddingVertical: 12,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    marginLeft: 8,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
