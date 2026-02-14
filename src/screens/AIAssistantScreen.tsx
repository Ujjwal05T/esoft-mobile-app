import React, {useState, useRef} from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import Svg, {Rect, Path as SvgPath} from 'react-native-svg';

interface Message {
  id: string;
  type: 'user' | 'ai';
  text: string;
}

const AI_RESPONSES: Record<string, string> = {
  'inquiry raise karo': 'Theek hai. Inquiry bana rahe hain. Kaunse vehicle ke liye?',
  hello: 'Hello! How can I help you today?',
  hi: 'Hi there! What would you like to do?',
};

// ── Inline SVG Icons ──────────────────────────────────────────────────────────

function ArrowLeftIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <SvgPath
        d="M19 12H5M5 12l7-7M5 12l7 7"
        stroke="#2b2b2b"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function KeyboardIcon({color}: {color: string}) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill={color}>
      <SvgPath d="M20 5H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm-9 3h2v2h-2V8zm0 3h2v2h-2v-2zM8 8h2v2H8V8zm0 3h2v2H8v-2zm-1 2H5v-2h2v2zm0-3H5V8h2v2zm9 7H8v-2h8v2zm0-4h-2v-2h2v2zm0-3h-2V8h2v2zm3 3h-2v-2h2v2zm0-3h-2V8h2v2z" />
    </Svg>
  );
}

function MicIcon({color}: {color: string}) {
  return (
    <Svg width={28} height={28} viewBox="0 0 24 24" fill={color}>
      <SvgPath d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1 1.93c-3.94-.49-7-3.85-7-7.93h2c0 3.31 2.69 6 6 6s6-2.69 6-6h2c0 4.08-3.06 7.44-7 7.93V20h4v2H8v-2h4v-4.07z" />
    </Svg>
  );
}

function ScanIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#e5383b" strokeWidth={2}>
      <Rect x={3} y={3} width={7} height={7} rx={1} />
      <Rect x={14} y={3} width={7} height={7} rx={1} />
      <Rect x={3} y={14} width={7} height={7} rx={1} />
      <SvgPath d="M14 14h7v3.5a3.5 3.5 0 01-3.5 3.5H14v-7z" />
    </Svg>
  );
}

function SendIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <SvgPath
        d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"
        stroke="white"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function UserIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 20 20" fill="#666">
      <SvgPath d="M10 10a4 4 0 100-8 4 4 0 000 8zm0 2c-4 0-8 2-8 4v2h16v-2c0-2-4-4-8-4z" />
    </Svg>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function AIAssistantScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<Message[]>([
    {id: '1', type: 'ai', text: 'Hello! How can I assist you?'},
  ]);
  const [inputMode, setInputMode] = useState<'idle' | 'keyboard'>('idle');
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const scrollToBottom = () => {
    setTimeout(() => scrollRef.current?.scrollToEnd({animated: true}), 100);
  };

  const handleSend = (text: string) => {
    if (!text.trim()) {return;}
    const userMsg: Message = {id: Date.now().toString(), type: 'user', text: text.trim()};
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    scrollToBottom();
    setTimeout(() => {
      const lower = text.toLowerCase().trim();
      const response = AI_RESPONSES[lower] || 'I understand. How else can I help you?';
      setMessages(prev => [...prev, {id: (Date.now() + 1).toString(), type: 'ai', text: response}]);
      scrollToBottom();
    }, 1000);
  };

  const bottomBarHeight = 90 + insets.bottom;
  const headerHeight = insets.top + 56;

  return (
    <View style={styles.container}>
      {/* ── Animated Background ──────────────────────────────────────── */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {/* Top white fade */}
        <LinearGradient
          colors={['#ffffff', '#ffffff', 'rgba(255,255,255,0)']}
          style={[styles.topFade, {height: headerHeight + 80}]}
        />

        {/* Gradient section */}
        <View style={styles.gradientSection}>
          <LinearGradient
            colors={['#ffeaec', '#f8b4b8', '#e5383b']}
            start={{x: 0, y: 0}}
            end={{x: 0, y: 1}}
            style={StyleSheet.absoluteFill}
          />
        </View>

        {/* Bottom white fade */}
        <LinearGradient
          colors={['rgba(255,255,255,0)', '#ffffff', '#ffffff']}
          style={[styles.bottomFade, {height: bottomBarHeight + 60}]}
        />
      </View>

      {/* ── Header ───────────────────────────────────────────────────── */}
      <View style={[styles.header, {paddingTop: insets.top + 8}]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          activeOpacity={0.7}>
          <ArrowLeftIcon />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI Assistant</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* ── Messages ─────────────────────────────────────────────────── */}
      <KeyboardAvoidingView
        style={styles.flex1}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={bottomBarHeight}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={[
            styles.messagesContent,
            {
              paddingTop: headerHeight + 20,
              paddingBottom: bottomBarHeight + (inputMode === 'keyboard' ? 72 : 16),
            },
          ]}
          showsVerticalScrollIndicator={false}>
          {messages.map(msg => (
            <View
              key={msg.id}
              style={[styles.messageRow, msg.type === 'user' && styles.messageRowReverse]}>
              {msg.type === 'ai' ? (
                <View style={styles.aiAvatar}>
                  <Text style={styles.aiAvatarLine1}>ETNA</Text>
                  <Text style={styles.aiAvatarLine2}>SPARES</Text>
                </View>
              ) : (
                <View style={styles.userAvatar}>
                  <UserIcon />
                </View>
              )}
              <View style={styles.messageBubble}>
                <Text style={styles.messageText}>{msg.text}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Keyboard Text Input ───────────────────────────────────────── */}
      {inputMode === 'keyboard' && (
        <View style={[styles.keyboardInput, {bottom: bottomBarHeight + 8}]}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type your message..."
            placeholderTextColor="#999"
            autoFocus
            returnKeyType="send"
            onSubmitEditing={() => {
              handleSend(inputText);
              setInputMode('idle');
            }}
          />
          <TouchableOpacity
            style={styles.sendBtn}
            activeOpacity={0.8}
            onPress={() => {
              handleSend(inputText);
              setInputMode('idle');
            }}>
            <SendIcon />
          </TouchableOpacity>
        </View>
      )}

      {/* ── Bottom Input Bar ──────────────────────────────────────────── */}
      <View style={[styles.bottomBar, {paddingBottom: insets.bottom + 16}]}>
        <TouchableOpacity
          style={[styles.iconBtn, inputMode === 'keyboard' && styles.iconBtnActive]}
          activeOpacity={0.8}
          onPress={() => setInputMode(inputMode === 'keyboard' ? 'idle' : 'keyboard')}>
          <KeyboardIcon color={inputMode === 'keyboard' ? '#ffffff' : '#e5383b'} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.micBtn, isListening && styles.micBtnActive]}
          activeOpacity={0.8}
          onPress={() => setIsListening(!isListening)}>
          <MicIcon color={isListening ? '#ffffff' : '#e5383b'} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.iconBtn} activeOpacity={0.8}>
          <ScanIcon />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#ffffff'},
  flex1: {flex: 1},
  // Background
  topFade: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 2,
  },
  gradientSection: {
    position: 'absolute',
    top: 80,
    left: 0,
    right: 0,
    bottom: 80,
    borderRadius: 40,
    overflow: 'hidden',
  },
  bottomFade: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 2,
  },
  // Header
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: '#2b2b2b',
  },
  headerSpacer: {width: 40},
  // Messages
  messagesContent: {
    paddingHorizontal: 16,
    maxWidth: 500,
    alignSelf: 'center',
    width: '100%',
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 24,
  },
  messageRowReverse: {flexDirection: 'row-reverse'},
  aiAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  aiAvatarLine1: {color: '#e5383b', fontSize: 9, fontWeight: '700', lineHeight: 11},
  aiAvatarLine2: {color: '#e5383b', fontSize: 6, fontWeight: '400', lineHeight: 8},
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#e8e8e8',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  messageBubble: {flex: 1, maxWidth: '75%'},
  messageText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    lineHeight: 28,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: {width: 0, height: 2},
    textShadowRadius: 8,
  },
  // Keyboard input
  keyboardInput: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 20,
    backgroundColor: '#ffffff',
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  textInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#2b2b2b',
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e5383b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Bottom bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    paddingTop: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    maxWidth: 500,
    alignSelf: 'center',
    width: '100%',
  },
  iconBtn: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#fce4e6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnActive: {backgroundColor: '#e5383b'},
  micBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#fce4e6',
    shadowColor: '#e5383b',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  micBtnActive: {backgroundColor: '#e5383b', borderColor: '#e5383b'},
});
