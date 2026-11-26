import React, { useEffect, useRef, useState } from 'react';

import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { authService, type AuthSession } from '../services/authService';
import { authStorage } from '../services/authStorage';
import { loadServerChats, syncChat, removeServerChat } from '../services/conversationSync';
import { ApiError } from '../services/apiService';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';

import ProfessionalHome from '../components/ProfessionalHome';
import AIChatScreen from '../components/AIChatScreen';
import AICameraScreen from '../components/AICameraScreen';
import DiagnosisScreen from '../components/DiagnosisScreen';
import BuyingAdviceScreen from '../components/BuyingAdviceScreen';
import CompareScreen from '../components/CompareScreen';
import KnowledgeLibraryScreen from '../components/KnowledgeLibraryScreen';
import CostEstimateScreen from '../components/CostEstimateScreen';
import UsageGuideScreen from '../components/UsageGuideScreen';

import type {
  AIAction,
  AIConversation,
} from '../types/smartcool';

import {
  createAIConversation,
} from '../services/aiService';

// ==================================================
// KIỂU DỮ LIỆU
// ==================================================

type Page =
  | 'home'
  | 'ai'
  | 'camera'
  | 'diagnosis'
  | 'buying'
  | 'compare'
  | 'library'
  | 'estimate'
  | 'guide'
  | 'history'
  | 'account';

type AuthMode = 'login' | 'register';

type TabItem = {
  id: Page;
  icon: string;
  label: string;
};

// ==================================================
// MÀU SẮC
// ==================================================

const BLUE = '#0878E8';
const DARK_BLUE = '#12345B';
const BACKGROUND = '#F3F8FF';
const WHITE = '#FFFFFF';
const MUTED = '#64748B';
const BORDER = '#E4EDF8';

const STORAGE_KEY = 'smartcool_mobile_chat_v2';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ==================================================
// THANH ĐIỀU HƯỚNG
// ==================================================

const TABS: TabItem[] = [
  {
    id: 'home',
    icon: '⌂',
    label: 'Trang chủ',
  },
  {
    id: 'ai',
    icon: '✦',
    label: 'Trợ lý AI',
  },
  {
    id: 'history',
    icon: '◷',
    label: 'Lịch sử',
  },
  {
    id: 'account',
    icon: '♙',
    label: 'Tài khoản',
  },
];

// ==================================================
// MÀN HÌNH CHÍNH
// ==================================================

export default function HomeScreen() {
  // TÀI KHOẢN

  const [authMode, setAuthMode] =
    useState<AuthMode>('login');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] =
    useState('');

  const [showPassword, setShowPassword] =
    useState(false);

  const [loggedIn, setLoggedIn] =
    useState(false);

  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  const [editingProfile, setEditingProfile] =
    useState(false);

  const [draftName, setDraftName] = useState('');
  const [draftPhone, setDraftPhone] = useState('');
  const [draftAddress, setDraftAddress] = useState('');

  const [savingProfile, setSavingProfile] = useState(false);

  const [userId, setUserId] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);
  const authLock = useRef(false);

  // ĐIỀU HƯỚNG

  const [page, setPage] =
    useState<Page>('home');

  const [featureReturnPage, setFeatureReturnPage] =
    useState<Page>('home');

  // BÀN PHÍM

  const [keyboardVisible, setKeyboardVisible] =
    useState(false);

  // TRỢ LÝ AI

  const [conversations, setConversations] =
    useState<AIConversation[]>([]);

  const [activeChatId, setActiveChatId] =
    useState<string | null>(null);

  const [initialQuestion, setInitialQuestion] =
    useState<string | undefined>(undefined);

  const [pendingAction, setPendingAction] =
    useState<AIAction | null>(null);

  const [buyingReturn, setBuyingReturn] = useState<{
    action: AIAction | null;
    returnPage: Page;
  } | null>(null);

  const [storageReady, setStorageReady] =
    useState(false);

  const syncQueue = useRef<Promise<void>>(Promise.resolve());
  const sessionUser = useRef<string | null>(null);
  const activeConversation = conversations.find(
    (conversation) =>
      conversation.id === activeChatId
  );

  // ==================================================
  // THEO DÕI BÀN PHÍM
  // ==================================================

  useEffect(() => {
    const showEvent =
      Platform.OS === 'ios'
        ? 'keyboardWillShow'
        : 'keyboardDidShow';

    const hideEvent =
      Platform.OS === 'ios'
        ? 'keyboardWillHide'
        : 'keyboardDidHide';

    const showSubscription = Keyboard.addListener(
      showEvent,
      () => setKeyboardVisible(true)
    );

    const hideSubscription = Keyboard.addListener(
      hideEvent,
      () => setKeyboardVisible(false)
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  // ==================================================
  // TẢI LỊCH SỬ HỘI THOẠI
  // ==================================================

  useEffect(() => {
    if (!userId) return;
    let mounted = true;
    setStorageReady(false);

    const id = userId;
    async function loadConversations() {
      let local: AIConversation[] = [];
      try {
        const saved = await AsyncStorage.getItem(`${STORAGE_KEY}_${id}`);
        const parsed: unknown = saved ? JSON.parse(saved) : [];
        if (Array.isArray(parsed)) local = parsed.filter(item => item && typeof item.id === 'string' && typeof item.title === 'string' && typeof item.updatedAt === 'number' && Array.isArray(item.messages));
      } catch (error) { console.warn('Không thể đọc lịch sử cục bộ', error); }
      try {
        const remote = await loadServerChats(id!);
        const merged = new Map(local.map(c => [c.id, c]));
        for (const c of remote) {
          const old = merged.get(c.id);
          if (!old || c.updatedAt >= old.updatedAt) {
            const images = new Map(old?.messages.map(m => [m.id, m]) ?? []);
            merged.set(c.id, {...c, messages: c.messages.map(m => ({...m, imageUri: images.get(m.id)?.imageUri, attachments: images.get(m.id)?.attachments}))});
          }
        }
        local = [...merged.values()];
      } catch (error) {
        if (mounted) Alert.alert('Chưa tải được lịch sử máy chủ', String(error));
      } finally {
        if (mounted) { setConversations(local); setStorageReady(true); }
      }
    }

    loadConversations();

    return () => {
      mounted = false;
    };
  }, [userId]);

  // ==================================================
  // LƯU LỊCH SỬ HỘI THOẠI
  // ==================================================

  useEffect(() => {
    if (!storageReady || !userId) {
      return;
    }

    AsyncStorage.setItem(
      `${STORAGE_KEY}_${userId}`,
      JSON.stringify(conversations)
    ).catch((error) => {
      console.warn(
        'Không thể lưu lịch sử hội thoại:',
        error
      );
    });
  }, [conversations, storageReady, userId]);

  // ==================================================
  // HỒ SƠ NGƯỜI DÙNG
  // ==================================================

  async function applySession(session: AuthSession) {
    await authStorage.saveTokens(session.accessToken, session.refreshToken);
    setStorageReady(false);
    setConversations([]);
    sessionUser.current = session.user.id;
    setUserId(session.user.id);
    setEmail(session.user.email);
    setName(session.user.profile?.fullName ?? '');
    setPhone(session.user.profile?.phone ?? '');
    setAddress(session.user.profile?.address ?? '');
    setPassword('');
    setConfirmPassword('');
    setPage('home');
    setLoggedIn(true);
  }

  useEffect(() => {
    async function restoreSession() {
      try {
        const tokens = await authStorage.getTokens();
        if (!tokens) return;
        let session: AuthSession;
        try {
          const user = await authService.getCurrentUser(tokens.accessToken);
          session = { ...tokens, user, tokenType: 'Bearer', expiresIn: 0, refreshExpiresAt: '' };
        } catch (error) {
          if (!(error instanceof ApiError) || error.statusCode !== 401) throw error;
          session = await authService.refresh(tokens.refreshToken);
        }
        await applySession(session);
      } catch (error) {
        if (error instanceof ApiError && [401, 403].includes(error.statusCode)) {
          await authStorage.clearTokens().catch(() => undefined);
        } else {
          Alert.alert('Thông báo', 'Không thể khôi phục phiên đăng nhập. Vui lòng kiểm tra kết nối hoặc đăng nhập lại.');
        }
      } finally {
        setAuthReady(true);
      }
    }
    void restoreSession();
  }, []);

  function openEditProfile() {
    setDraftName(name);
    setDraftPhone(phone);
    setDraftAddress(address);
    setEditingProfile(true);
  }

  function cancelEditProfile() {
    if (authLock.current) return;
    Keyboard.dismiss();
    setEditingProfile(false);
  }

  async function saveProfile() {
    if (authLock.current) return;
    const fullName = draftName.trim();
    const cleanPhone = draftPhone.trim();
    const cleanAddress = draftAddress.trim();
    if (fullName.length < 2 || fullName.length > 150) {
      Alert.alert('Thông báo', 'Họ tên phải có từ 2 đến 150 ký tự.');
      return;
    }
    if (cleanPhone && !/^(0\d{9}|\+84\d{9})$/.test(cleanPhone)) {
      Alert.alert('Thông báo', 'Số điện thoại không hợp lệ.');
      return;
    }
    if (cleanAddress.length > 500) {
      Alert.alert('Thông báo', 'Địa chỉ không được quá 500 ký tự.');
      return;
    }
    authLock.current = true;
    setSavingProfile(true);
    try {
      const tokens = await authStorage.getTokens();
      if (!tokens) throw new ApiError('Phiên đăng nhập không tồn tại. Vui lòng đăng nhập lại.', 401);
      const input = { fullName, phone: cleanPhone || null, address: cleanAddress || null };
      let user;
      try {
        user = await authService.updateProfile(tokens.accessToken, input);
      } catch (error) {
        if (!(error instanceof ApiError) || error.statusCode !== 401) throw error;
        const session = await authService.refresh(tokens.refreshToken);
        await authStorage.saveTokens(session.accessToken, session.refreshToken);
        user = await authService.updateProfile(session.accessToken, input);
      }
      setName(user.profile?.fullName ?? '');
      setPhone(user.profile?.phone ?? '');
      setAddress(user.profile?.address ?? '');
      setEditingProfile(false);
      Keyboard.dismiss();
      Alert.alert('Thành công', 'Đã cập nhật hồ sơ cá nhân.');
    } catch (error) {
      Alert.alert('Thông báo', error instanceof Error ? error.message : 'Không thể cập nhật hồ sơ.');
    } finally {
      authLock.current = false;
      setSavingProfile(false);
    }
  }

  // ==================================================
  // ĐĂNG NHẬP VÀ ĐĂNG KÝ
  // ==================================================

  async function handleLogin() {
    if (authLock.current) return;
    const cleanEmail = email.trim().toLowerCase();
    if (!EMAIL_PATTERN.test(cleanEmail) || !password.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập email hợp lệ và mật khẩu.');
      return;
    }
    if (authMode === 'register') {
      if (!name.trim()) {
        Alert.alert('Thông báo', 'Vui lòng nhập họ và tên.');
        return;
      }
      if (password.length < 8 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
        Alert.alert('Thông báo', 'Mật khẩu cần ít nhất 8 ký tự, có chữ hoa, chữ thường và chữ số.');
        return;
      }
      if (password !== confirmPassword) {
        Alert.alert('Thông báo', 'Mật khẩu xác nhận không khớp.');
        return;
      }
    }
    authLock.current = true;
    setAuthBusy(true);
    try {
      const session = authMode === 'register'
        ? await authService.register({ fullName: name.trim(), email: cleanEmail, password })
        : await authService.login({ email: cleanEmail, password });
      await applySession(session);
      Keyboard.dismiss();
    } catch (error) {
      Alert.alert('Thông báo', error instanceof Error ? error.message : 'Không thể xác thực tài khoản.');
    } finally {
      authLock.current = false;
      setAuthBusy(false);
    }
  }

  // ==================================================
  // ĐĂNG XUẤT
  // ==================================================

  function logout() {
    Alert.alert(
      'Đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất?',
      [
        {
          text: 'Hủy',
          style: 'cancel',
        },
        {
          text: 'Đăng xuất',
          style: 'destructive',
          onPress: async () => {
            if (authLock.current) return;
            authLock.current = true;
            try {
              const tokens = await authStorage.getTokens();
              if (tokens) await authService.logout(tokens.refreshToken);
            } catch (error) {
              Alert.alert('Thông báo', 'Chưa thể đăng xuất trên máy chủ. Vui lòng thử lại khi có kết nối.');
              authLock.current = false;
              return;
            }
            try {
              await authStorage.clearTokens();
            } catch {
              Alert.alert('Thông báo', 'Không thể xóa phiên trên thiết bị. Vui lòng thử lại.');
              authLock.current = false;
              return;
            }
            authLock.current = false;
            Keyboard.dismiss();
            setStorageReady(false);
            setConversations([]);
            sessionUser.current = null;
            setUserId(null);
            setLoggedIn(false);
            setBuyingReturn(null);
            setPage('home');
            setAuthMode('login');

            setActiveChatId(null);
            setInitialQuestion(undefined);
            setPendingAction(null);

            setName('');
            setEmail('');
            setPassword('');
            setConfirmPassword('');
            setPhone('');
            setAddress('');

            setShowPassword(false);
            setEditingProfile(false);
          },
        },
      ]
    );
  }

  // ==================================================
  // CẬP NHẬT HỘI THOẠI
  // ==================================================

  function updateConversation(
    conversation: AIConversation
  ) {
    setConversations((previous) => {
      const exists = previous.some(
        (item) => item.id === conversation.id
      );

      if (exists) {
        return previous.map((item) =>
          item.id === conversation.id
            ? conversation
            : item
        );
      }

      return [
        conversation,
        ...previous,
      ];
    });

    setActiveChatId(conversation.id);
    setInitialQuestion(undefined);
    if (userId && conversation.messages.some(m => m.role === 'user')) {
      const id = userId;
      syncQueue.current = syncQueue.current.then(async () => {
        if (sessionUser.current !== id) return;
        await syncChat(id, conversation);
      }).catch(error => {
        if (sessionUser.current === id) Alert.alert('Chưa đồng bộ được tin nhắn', String(error));
      });
    }
  }

  // ==================================================
  // TẠO HỘI THOẠI MỚI
  // ==================================================

  function startNewChat(question?: string) {
    setBuyingReturn(null);
    const conversation = createAIConversation();

    setConversations((previous) => [
      conversation,
      ...previous,
    ]);

    setActiveChatId(conversation.id);

    setInitialQuestion(
      question?.trim() || undefined
    );

    setPendingAction(null);
    setPage('ai');
  }

  function handleNewConversation(
    conversation: AIConversation
  ) {
    updateConversation(conversation);
    setPendingAction(null);
    setInitialQuestion(undefined);
  }

  // ==================================================
  // MỞ TRỢ LÝ AI
  // ==================================================

  function openAI() {
    setBuyingReturn(null);
    setInitialQuestion(undefined);
    setPendingAction(null);

    if (activeConversation) {
      setPage('ai');
      return;
    }

    if (conversations.length > 0) {
      const sortedConversations = [
        ...conversations,
      ].sort(
        (a, b) => b.updatedAt - a.updatedAt
      );

      setActiveChatId(
        sortedConversations[0].id
      );

      setPage('ai');
      return;
    }

    startNewChat();
  }

  function openChat(id: string) {
    setBuyingReturn(null);
    Keyboard.dismiss();

    setActiveChatId(id);
    setInitialQuestion(undefined);
    setPendingAction(null);
    setPage('ai');
  }

  // ==================================================
  // NHẬN CÂU HỎI TỪ TRANG CHỦ
  // ==================================================

  function askQuestionFromHome(question: string) {
    const content = question.trim();

    if (!content) {
      openAI();
      return;
    }

    startNewChat(content);
  }

  // ==================================================
  // ĐIỀU HƯỚNG CHỨC NĂNG
  // ==================================================

  function navigateToFeature(
    id: string,
    returnPage: Page
  ) {
    Keyboard.dismiss();

    setFeatureReturnPage(returnPage);

    switch (id) {
      case 'chat':
        openAI();
        break;

      case 'camera':
        setPage('camera');
        break;

      case 'budget':
        setPage('buying');
        break;

      case 'compare':
        setPage('compare');
        break;

      case 'library':
        setPage('library');
        break;

      case 'diagnosis':
        setPage('diagnosis');
        break;

      case 'estimate':
        setPage('estimate');
        break;

      case 'guide':
        setPage('guide');
        break;

      default:
        Alert.alert(
          'Thông báo',
          'Chức năng chưa được hỗ trợ.'
        );
        break;
    }
  }

  // ==================================================
  // MỞ CHỨC NĂNG TỪ TRANG CHỦ
  // ==================================================

  function openFeatureById(id: string) {
    setBuyingReturn(null);
    setPendingAction(null);
    setInitialQuestion(undefined);

    navigateToFeature(id, 'home');
  }

  // ==================================================
  // MỞ CHỨC NĂNG TỪ TÀI KHOẢN
  // ==================================================

  function openAccountFeature(id: string) {
    setBuyingReturn(null);
    setPendingAction(null);
    setInitialQuestion(undefined);

    navigateToFeature(id, 'account');
  }

  // ==================================================
  // NHẬN DỮ LIỆU TỪ TRỢ LÝ AI
  // ==================================================

  function handleAIAction(action: AIAction) {
    setBuyingReturn(null);
    Keyboard.dismiss();

    setInitialQuestion(undefined);

    if (action.feature === 'chat') {
      openAI();
      return;
    }

    setPendingAction(action);

    navigateToFeature(
      action.feature,
      'ai'
    );
  }

  // ==================================================
  // QUAY LẠI TỪ CHỨC NĂNG
  // ==================================================

  function handleBuyingAction(action: AIAction) {
    if (action.feature !== 'compare' && action.feature !== 'estimate') return;
    Keyboard.dismiss();
    setBuyingReturn({ action: pendingAction, returnPage: featureReturnPage });
    setPendingAction(action);
    setInitialQuestion(undefined);
    navigateToFeature(action.feature, 'buying');
  }

  function goBackFromFeature() {
    Keyboard.dismiss();
    if (featureReturnPage === 'buying' && buyingReturn) {
      setPendingAction(buyingReturn.action);
      setFeatureReturnPage(buyingReturn.returnPage);
      setBuyingReturn(null);
      setPage('buying');
      return;
    }

    setPendingAction(null);
    setInitialQuestion(undefined);
    setPage(featureReturnPage);
  }

  function returnToAI() {
    setBuyingReturn(null);
    Keyboard.dismiss();

    setPendingAction(null);
    setInitialQuestion(undefined);
    setPage('ai');
  }

  // ==================================================
  // XÓA HỘI THOẠI
  // ==================================================

  function deleteChat(id: string) {
    Alert.alert(
      'Xóa cuộc trò chuyện',
      'Bạn có chắc chắn muốn xóa cuộc trò chuyện này?',
      [
        {
          text: 'Hủy',
          style: 'cancel',
        },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            const idUser = userId;
            if (!idUser) return;
            try {
              await syncQueue.current;
              if (sessionUser.current !== idUser) return;
              await removeServerChat(idUser, id);
              if (sessionUser.current !== idUser) return;
            } catch (error) {
              Alert.alert('Không thể xóa cuộc trò chuyện', String(error));
              return;
            }
            setConversations((previous) =>
              previous.filter(
                (item) => item.id !== id
              )
            );

            if (activeChatId === id) {
              setActiveChatId(null);
              setInitialQuestion(undefined);
              setPendingAction(null);
            }
          },
        },
      ]
    );
  }

  // ==================================================
  // CHUYỂN TAB
  // ==================================================

  function handleTabPress(tab: Page) {
    setBuyingReturn(null);
    Keyboard.dismiss();

    setPendingAction(null);
    setInitialQuestion(undefined);
    setEditingProfile(false);

    if (tab === 'ai') {
      openAI();
      return;
    }

    setPage(tab);
  }

  // ==================================================
  // GIAO DIỆN ĐĂNG NHẬP / ĐĂNG KÝ
  // ==================================================

  if (!authReady || (loggedIn && !storageReady)) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={BLUE} />
        <Text style={{ marginTop: 12, color: MUTED }}>Đang tải SmartCool AI...</Text>
      </SafeAreaView>
    );
  }

  if (!loggedIn) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={
            Platform.OS === 'ios'
              ? 'padding'
              : undefined
          }
        >
          <ScrollView
            contentContainerStyle={styles.authScroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.authHeader}>
              <View style={styles.logo}>
                <Text style={styles.logoText}>
                  ❄
                </Text>
              </View>

              <Text style={styles.brandName}>
                SmartCool{' '}
                <Text style={styles.brandAI}>
                  AI
                </Text>
              </Text>

              <Text style={styles.tagline}>
                Giải pháp điện lạnh thông minh
              </Text>
            </View>

            <View style={styles.authCard}>
              <Text style={styles.authTitle}>
                {authMode === 'login'
                  ? 'Chào mừng trở lại!'
                  : 'Tạo tài khoản mới'}
              </Text>

              <Text style={styles.authSubtitle}>
                {authMode === 'login'
                  ? 'Đăng nhập để khám phá SmartCool AI'
                  : 'Đăng ký để bắt đầu trải nghiệm'}
              </Text>

              {authMode === 'register' && (
                <View style={styles.field}>
                  <Text style={styles.label}>
                    Họ và tên
                  </Text>

                  <TextInput
                    style={styles.input}
                    placeholder="Nhập họ và tên"
                    placeholderTextColor="#94A3B8"
                    value={name}
                    onChangeText={setName}
                  />
                </View>
              )}

              <View style={styles.field}>
                <Text style={styles.label}>
                  Email
                </Text>

                <TextInput
                  style={styles.input}
                  placeholder="Nhập địa chỉ email"
                  placeholderTextColor="#94A3B8"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={email}
                  onChangeText={setEmail}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>
                  Mật khẩu
                </Text>

                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Nhập mật khẩu"
                    placeholderTextColor="#94A3B8"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={password}
                    onChangeText={setPassword}
                  />

                  <TouchableOpacity
                    onPress={() =>
                      setShowPassword(!showPassword)
                    }
                  >
                    <Text style={styles.showPassword}>
                      {showPassword ? 'Ẩn' : 'Hiện'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {authMode === 'register' && (
                <View style={styles.field}>
                  <Text style={styles.label}>
                    Xác nhận mật khẩu
                  </Text>

                  <TextInput
                    style={styles.input}
                    placeholder="Nhập lại mật khẩu"
                    placeholderTextColor="#94A3B8"
                    secureTextEntry={!showPassword}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                  />
                </View>
              )}

              <TouchableOpacity
                style={styles.primaryButton}
                disabled={authBusy}
                onPress={handleLogin}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryButtonText}>
                  {authBusy ? 'Đang xử lý...' : authMode === 'login'
                    ? 'Đăng nhập'
                    : 'Đăng ký'}
                </Text>
              </TouchableOpacity>

              <View style={styles.switchRow}>
                <Text style={styles.switchText}>
                  {authMode === 'login'
                    ? 'Chưa có tài khoản? '
                    : 'Đã có tài khoản? '}
                </Text>

                <TouchableOpacity
                  disabled={authBusy}
                  onPress={() => {
                    setAuthMode(
                      authMode === 'login'
                        ? 'register'
                        : 'login'
                    );

                    setPassword('');
                    setConfirmPassword('');
                    setShowPassword(false);
                  }}
                >
                  <Text style={styles.switchLink}>
                    {authMode === 'login'
                      ? 'Đăng ký ngay'
                      : 'Đăng nhập'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.footer}>
              © 2026 SmartCool AI
            </Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ==================================================
  // GIAO DIỆN LỊCH SỬ
  // ==================================================

  function renderHistory() {
    const sortedConversations = [
      ...conversations,
    ].sort(
      (a, b) => b.updatedAt - a.updatedAt
    );

    return (
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.mainContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.historyHeading}>
          <Text style={styles.sectionTitle}>
            Lịch sử hội thoại
          </Text>

          <TouchableOpacity
            style={styles.historyNewButton}
            onPress={() => startNewChat()}
          >
            <Text style={styles.historyNewText}>
              + Tạo mới
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionSubtitle}>
          Xem lại những cuộc trò chuyện của bạn
          với SmartCool AI.
        </Text>

        {sortedConversations.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>
              🕘
            </Text>

            <Text style={styles.emptyTitle}>
              Chưa có lịch sử
            </Text>

            <Text style={styles.emptyDescription}>
              Hãy bắt đầu trò chuyện với SmartCool AI.
            </Text>

            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => startNewChat()}
            >
              <Text style={styles.emptyButtonText}>
                Bắt đầu trò chuyện
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          sortedConversations.map((conversation) => (
            <View
              key={conversation.id}
              style={styles.historyCard}
            >
              <TouchableOpacity
                style={styles.historyOpen}
                onPress={() =>
                  openChat(conversation.id)
                }
              >
                <View style={styles.historyIconBox}>
                  <Text style={styles.historyIcon}>
                    💬
                  </Text>
                </View>

                <View style={styles.flex}>
                  <Text
                    style={styles.historyTitle}
                    numberOfLines={2}
                  >
                    {conversation.title}
                  </Text>

                  <Text style={styles.historyMeta}>
                    {
                      conversation.messages.filter(
                        (message) =>
                          message.role === 'user'
                      ).length
                    }{' '}
                    câu hỏi ·{' '}
                    {new Date(
                      conversation.updatedAt
                    ).toLocaleDateString('vi-VN')}
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() =>
                  deleteChat(conversation.id)
                }
              >
                <Text style={styles.deleteText}>
                  Xóa
                </Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>
    );
  }

  // ==================================================
  // CHỈNH SỬA THÔNG TIN CÁ NHÂN
  // ==================================================

  function renderEditProfile() {
    return (
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : undefined
        }
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.mainContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity
            onPress={cancelEditProfile}
            style={styles.backButton}
          >
            <Text style={styles.backText}>
              ‹ Quay lại
            </Text>
          </TouchableOpacity>

          <Text style={styles.sectionTitle}>
            Chỉnh sửa thông tin
          </Text>

          <Text style={styles.sectionSubtitle}>
            Cập nhật hồ sơ cá nhân của bạn.
          </Text>

          <View style={styles.editProfileCard}>
            <View style={styles.editAvatar}>
              <Text style={styles.profileAvatarText}>
                👤
              </Text>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>
                Họ và tên
              </Text>

              <TextInput
                style={styles.input}
                value={draftName}
                editable={!savingProfile}
                onChangeText={setDraftName}
                placeholder="Nhập họ và tên"
                placeholderTextColor="#94A3B8"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>
                Email đăng nhập
              </Text>

              <TextInput
                style={[
                  styles.input,
                  styles.disabledInput,
                ]}
                value={email}
                editable={false}
              />

              <Text style={styles.fieldHint}>
                Email đăng nhập chưa thể thay đổi.
              </Text>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>
                Số điện thoại
              </Text>

              <TextInput
                style={styles.input}
                value={draftPhone}
                editable={!savingProfile}
                onChangeText={setDraftPhone}
                keyboardType="phone-pad"
                placeholder="Nhập số điện thoại"
                placeholderTextColor="#94A3B8"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>
                Địa chỉ
              </Text>

              <TextInput
                style={[
                  styles.input,
                  styles.addressInput,
                ]}
                value={draftAddress}
                editable={!savingProfile}
                onChangeText={setDraftAddress}
                placeholder="Nhập địa chỉ của bạn"
                placeholderTextColor="#94A3B8"
                multiline
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity
              style={[
                styles.primaryButton,
                savingProfile && styles.disabledButton,
              ]}
              onPress={saveProfile}
              disabled={savingProfile}
            >
              <Text style={styles.primaryButtonText}>
                {savingProfile
                  ? 'Đang lưu...'
                  : 'Lưu thay đổi'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={cancelEditProfile}
            >
              <Text style={styles.cancelText}>
                Hủy thay đổi
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.profileNote}>
            Thông tin hồ sơ được lưu trên máy chủ SmartCool AI.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // ==================================================
  // GIAO DIỆN TÀI KHOẢN
  // ==================================================

  function renderAccount() {
    if (editingProfile) {
      return renderEditProfile();
    }

    const totalQuestions = conversations.reduce(
      (total, conversation) =>
        total +
        conversation.messages.filter(
          (message) => message.role === 'user'
        ).length,
      0
    );

    return (
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.mainContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>
          Tài khoản
        </Text>

        <View style={styles.profileCard}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileAvatarText}>
              👤
            </Text>
          </View>

          <Text style={styles.profileName}>
            {name.trim() ||
              'Người dùng SmartCool AI'}
          </Text>

          <Text style={styles.profileEmail}>
            {email}
          </Text>

          <View style={styles.profileBadge}>
            <Text style={styles.profileBadgeText}>
              Tài khoản SmartCool AI
            </Text>
          </View>

          <TouchableOpacity
            style={styles.editProfileButton}
            onPress={openEditProfile}
          >
            <Text style={styles.editProfileButtonText}>
              ✎ Chỉnh sửa thông tin
            </Text>
          </TouchableOpacity>

          <View style={styles.statsRow}>
            <View style={styles.accountStats}>
              <Text style={styles.accountStatsNumber}>
                {conversations.length}
              </Text>

              <Text style={styles.accountStatsLabel}>
                Cuộc trò chuyện
              </Text>
            </View>

            <View style={styles.accountStats}>
              <Text style={styles.accountStatsNumber}>
                {totalQuestions}
              </Text>

              <Text style={styles.accountStatsLabel}>
                Câu hỏi đã gửi
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.accountMenu}>
          <Text style={styles.menuHeading}>
            Thông tin cá nhân
          </Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>
              Họ và tên
            </Text>

            <Text style={styles.infoValue}>
              {name || 'Chưa cập nhật'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>
              Email
            </Text>

            <Text style={styles.infoValue}>
              {email}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>
              Số điện thoại
            </Text>

            <Text style={styles.infoValue}>
              {phone || 'Chưa cập nhật'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>
              Địa chỉ
            </Text>

            <Text style={styles.infoValue}>
              {address || 'Chưa cập nhật'}
            </Text>
          </View>
        </View>

        <View style={styles.accountMenu}>
          <Text style={styles.menuHeading}>
            Hoạt động của bạn
          </Text>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() =>
              handleTabPress('history')
            }
          >
            <Text style={styles.menuIcon}>
              🕘
            </Text>

            <Text style={styles.menuLabel}>
              Lịch sử hội thoại
            </Text>

            <Text style={styles.menuArrow}>
              ›
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() =>
              openAccountFeature('library')
            }
          >
            <Text style={styles.menuIcon}>
              📚
            </Text>

            <Text style={styles.menuLabel}>
              Thư viện kiến thức
            </Text>

            <Text style={styles.menuArrow}>
              ›
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() =>
              openAccountFeature('estimate')
            }
          >
            <Text style={styles.menuIcon}>
              🧮
            </Text>

            <Text style={styles.menuLabel}>
              Dự toán chi phí
            </Text>

            <Text style={styles.menuArrow}>
              ›
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() =>
              openAccountFeature('diagnosis')
            }
          >
            <Text style={styles.menuIcon}>
              🔧
            </Text>

            <Text style={styles.menuLabel}>
              Chẩn đoán thiết bị
            </Text>

            <Text style={styles.menuArrow}>
              ›
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.noticeCard}>
          <Text style={styles.noticeTitle}>
            Thông tin tài khoản
          </Text>

          <Text style={styles.profileNote}>
            Tài khoản được xác thực qua Backend.
            Lịch sử hội thoại được lưu riêng theo tài khoản trên thiết bị, chưa đồng bộ với Web.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={logout}
        >
          <Text style={styles.logoutText}>
            Đăng xuất
          </Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>
          SmartCool AI · Phiên bản 1.0
        </Text>
      </ScrollView>
    );
  }

  // ==================================================
  // HIỂN THỊ MÀN HÌNH THEO CHỨC NĂNG
  // ==================================================

  function renderCurrentPage() {
    switch (page) {
      // TRANG CHỦ

      case 'home':
        return (
          <ProfessionalHome
            onOpenFeature={openFeatureById}
            onAskQuestion={askQuestionFromHome}
          />
        );

      // TRỢ LÝ AI

      case 'ai':
        return (
          <AIChatScreen
            key={
              activeConversation?.id ??
              'smartcool-ai'
            }
            conversation={activeConversation}
            initialQuestion={initialQuestion}
            onBack={() => {
              Keyboard.dismiss();
              setInitialQuestion(undefined);
              setPendingAction(null);
              setPage('home');
            }}
            onAction={handleAIAction}
            onConversationChange={updateConversation}
            onNewConversation={handleNewConversation}
          />
        );

      // AI CAMERA

      case 'camera':
        return (
          <AICameraScreen
            onBack={goBackFromFeature}
          />
        );

      // CHẨN ĐOÁN

      case 'diagnosis':
  return (
    <DiagnosisScreen
      key={
        pendingAction?.feature === 'diagnosis'
          ? pendingAction.id
          : 'diagnosis-manual'
      }
      onBack={goBackFromFeature}
      initialData={
        pendingAction?.feature === 'diagnosis'
          ? pendingAction.payload
          : undefined
      }
    />
  );

      // TƯ VẤN MUA THIẾT BỊ

      case 'buying':
        return null; // Render separately to preserve form state during comparison.

      // SO SÁNH THIẾT BỊ

      case 'compare':
        return (
          <CompareScreen
            key={
              pendingAction?.feature === 'compare'
                ? pendingAction.id
                : 'compare-manual'
            }
            onBack={goBackFromFeature}
            initialData={
              pendingAction?.feature === 'compare'
                ? pendingAction.payload
                : undefined
            }
          />
        );

      // THƯ VIỆN KIẾN THỨC

      case 'library':
        return (
          <KnowledgeLibraryScreen
            onBack={goBackFromFeature}
          />
        );

      // DỰ TOÁN CHI PHÍ

      case 'estimate':
        return (
          <CostEstimateScreen
            key={
              pendingAction?.feature === 'estimate'
                ? pendingAction.id
                : 'estimate-manual'
            }
            onBack={goBackFromFeature}
            initialData={
              pendingAction?.feature === 'estimate'
                ? pendingAction.payload
                : undefined
            }
          />
        );

      // HƯỚNG DẪN SỬ DỤNG

      case 'guide':
        return (
          <UsageGuideScreen
            onBack={goBackFromFeature}
          />
        );

      // LỊCH SỬ

      case 'history':
        return renderHistory();

      // TÀI KHOẢN

      case 'account':
        return renderAccount();

      default:
        return (
          <ProfessionalHome
            onOpenFeature={openFeatureById}
            onAskQuestion={askQuestionFromHome}
          />
        );
    }
  }

  // ==================================================
  // XÁC ĐỊNH TAB ĐANG HOẠT ĐỘNG
  // ==================================================

  const isMainPage =
    page === 'home' ||
    page === 'ai' ||
    page === 'history' ||
    page === 'account';

  const activeTab = isMainPage
    ? page
    : (featureReturnPage === 'buying' ? buyingReturn?.returnPage ?? 'home' : featureReturnPage);

  // ==================================================
  // GIAO DIỆN ỨNG DỤNG
  // ==================================================

  return (
    <SafeAreaView
      style={styles.container}
      edges={
        keyboardVisible
          ? ['top', 'left', 'right']
          : ['top', 'bottom', 'left', 'right']
      }
    >
      <StatusBar barStyle="dark-content" />

      {/* HEADER CHÍNH */}

      {page !== 'ai' && (
        <View style={styles.appHeader}>
          <View style={styles.headerBrand}>
            <View style={styles.smallLogo}>
              <Text style={styles.smallLogoText}>
                ❄
              </Text>
            </View>

            <View>
              <Text style={styles.headerTitle}>
                SmartCool AI
              </Text>

              <Text style={styles.headerSubtitle}>
                Trợ lý điện lạnh thông minh
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.avatarButton}
            onPress={() =>
              handleTabPress('account')
            }
          >
            <Text style={styles.avatarText}>
              👤
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* NỘI DUNG */}

      <View style={styles.flex}>
        {pendingAction && !isMainPage && featureReturnPage !== 'buying' && (
          <View style={styles.aiTransferBanner}>
            <View style={styles.transferIconBox}>
              <Text style={styles.transferIcon}>
                ✦
              </Text>
            </View>

            <View style={styles.flex}>
              <Text style={styles.transferTitle}>
                Đề xuất từ SmartCool AI
              </Text>

              <Text
                style={styles.transferDescription}
                numberOfLines={2}
              >
                {pendingAction.label}
              </Text>
            </View>

            <TouchableOpacity
              onPress={returnToAI}
            >
              <Text style={styles.transferBack}>
                Về AI
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {(page === 'buying' || buyingReturn !== null) && (
          <View style={page === 'buying' ? styles.flex : { display: 'none' }}>
            <BuyingAdviceScreen
              key={(buyingReturn ? buyingReturn.action : pendingAction)?.id ?? 'buying-manual'}
              onBack={goBackFromFeature}
              onAction={handleBuyingAction}
              initialData={(() => {
                const action = buyingReturn ? buyingReturn.action : pendingAction;
                return action?.feature === 'budget' ? action.payload : undefined;
              })()}
            />
          </View>
        )}
        {renderCurrentPage()}
      </View>

      {/* THANH ĐIỀU HƯỚNG */}

      {!keyboardVisible && (
        <View style={styles.tabBar}>
          {TABS.map((tab) => {
            const active =
              activeTab === tab.id;

            return (
              <TouchableOpacity
                key={tab.id}
                style={styles.tabItem}
                activeOpacity={0.75}
                onPress={() =>
                  handleTabPress(tab.id)
                }
                accessibilityRole="tab"
                accessibilityState={{
                  selected: active,
                }}
              >
                <View
                  style={[
                    styles.tabIconContainer,
                    active &&
                      styles.tabIconContainerActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.tabIcon,
                      active && styles.tabActiveText,
                    ]}
                  >
                    {tab.icon}
                  </Text>
                </View>

                <Text
                  style={[
                    styles.tabLabel,
                    active && styles.tabActiveText,
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </SafeAreaView>
  );
}

// ==================================================
// STYLE
// ==================================================

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },

  container: {
    flex: 1,
    backgroundColor: BACKGROUND,
  },

  // ĐĂNG NHẬP

  authScroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 36,
  },

  authHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },

  logo: {
    width: 82,
    height: 82,
    borderRadius: 24,
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },

  logoText: {
    fontSize: 46,
    color: WHITE,
    fontWeight: 'bold',
  },

  brandName: {
    fontSize: 32,
    fontWeight: '800',
    color: DARK_BLUE,
  },

  brandAI: {
    color: BLUE,
  },

  tagline: {
    marginTop: 8,
    fontSize: 14,
    color: MUTED,
    textAlign: 'center',
  },

  authCard: {
    backgroundColor: WHITE,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: BORDER,
  },

  authTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#16324F',
    textAlign: 'center',
  },

  authSubtitle: {
    marginTop: 8,
    marginBottom: 28,
    fontSize: 13,
    color: MUTED,
    textAlign: 'center',
    lineHeight: 20,
  },

  field: {
    marginBottom: 18,
  },

  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 9,
  },

  input: {
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DCE6F2',
    backgroundColor: '#FAFCFF',
    paddingHorizontal: 15,
    fontSize: 15,
    color: '#0F172A',
  },

  passwordContainer: {
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DCE6F2',
    backgroundColor: '#FAFCFF',
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },

  passwordInput: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    color: '#0F172A',
  },

  showPassword: {
    color: BLUE,
    fontWeight: '700',
    marginLeft: 10,
  },

  primaryButton: {
    height: 54,
    backgroundColor: BLUE,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },

  primaryButtonText: {
    color: WHITE,
    fontSize: 16,
    fontWeight: '700',
  },

  switchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 24,
  },

  switchText: {
    color: MUTED,
    fontSize: 13,
  },

  switchLink: {
    color: BLUE,
    fontSize: 13,
    fontWeight: '700',
  },

  footer: {
    marginTop: 30,
    textAlign: 'center',
    fontSize: 11,
    color: '#94A3B8',
  },

  // HEADER

  appHeader: {
    backgroundColor: WHITE,
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#E5EDF7',
  },

  headerBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  smallLogo: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
  },

  smallLogoText: {
    color: WHITE,
    fontSize: 27,
    fontWeight: 'bold',
  },

  headerTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: DARK_BLUE,
  },

  headerSubtitle: {
    fontSize: 10,
    color: MUTED,
    marginTop: 2,
  },

  avatarButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EAF3FF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  avatarText: {
    fontSize: 20,
  },

  // THÔNG BÁO CHUYỂN TỪ AI

  aiTransferBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAF4FF',
    borderBottomWidth: 1,
    borderBottomColor: '#C5DFFF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },

  transferIconBox: {
    width: 35,
    height: 35,
    borderRadius: 11,
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
  },

  transferIcon: {
    color: WHITE,
    fontSize: 21,
  },

  transferTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: DARK_BLUE,
  },

  transferDescription: {
    color: MUTED,
    fontSize: 11,
    marginTop: 3,
    lineHeight: 16,
  },

  transferBack: {
    color: BLUE,
    fontSize: 12,
    fontWeight: '700',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },

  // NỘI DUNG CHÍNH

  mainContent: {
    padding: 18,
    paddingBottom: 30,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: DARK_BLUE,
    marginBottom: 15,
  },

  sectionSubtitle: {
    fontSize: 12,
    color: MUTED,
    lineHeight: 19,
    marginBottom: 18,
  },

  // LỊCH SỬ

  historyHeading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },

  historyNewButton: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: '#E4F1FF',
    borderRadius: 10,
    marginBottom: 12,
  },

  historyNewText: {
    color: BLUE,
    fontWeight: '700',
    fontSize: 12,
  },

  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: WHITE,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 12,
    padding: 13,
  },

  historyOpen: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  historyIconBox: {
    width: 43,
    height: 43,
    borderRadius: 12,
    backgroundColor: '#EAF3FF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  historyIcon: {
    fontSize: 23,
  },

  historyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: DARK_BLUE,
  },

  historyMeta: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 6,
  },

  deleteButton: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },

  deleteText: {
    color: '#DC2626',
    fontWeight: '700',
    fontSize: 12,
  },

  // TRẠNG THÁI TRỐNG

  emptyCard: {
    padding: 35,
    borderRadius: 20,
    backgroundColor: WHITE,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BORDER,
  },

  emptyIcon: {
    fontSize: 45,
    marginBottom: 14,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: DARK_BLUE,
    marginBottom: 9,
    textAlign: 'center',
  },

  emptyDescription: {
    fontSize: 13,
    color: MUTED,
    lineHeight: 21,
    textAlign: 'center',
    marginTop: 6,
  },

  emptyButton: {
    backgroundColor: BLUE,
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderRadius: 12,
    marginTop: 20,
  },

  emptyButtonText: {
    color: WHITE,
    fontWeight: '700',
    fontSize: 13,
  },

  // TÀI KHOẢN

  profileCard: {
    backgroundColor: WHITE,
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BORDER,
  },

  profileAvatar: {
    width: 75,
    height: 75,
    borderRadius: 38,
    backgroundColor: '#EAF3FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },

  profileAvatarText: {
    fontSize: 35,
  },

  profileName: {
    fontSize: 19,
    fontWeight: '800',
    color: DARK_BLUE,
    textAlign: 'center',
  },

  profileEmail: {
    fontSize: 13,
    color: MUTED,
    marginTop: 6,
    textAlign: 'center',
  },

  profileBadge: {
    backgroundColor: '#EAF4FF',
    borderRadius: 20,
    paddingHorizontal: 13,
    paddingVertical: 7,
    marginTop: 12,
  },

  profileBadgeText: {
    color: BLUE,
    fontSize: 11,
    fontWeight: '600',
  },

  editProfileButton: {
    borderWidth: 1,
    borderColor: '#C5DFFF',
    backgroundColor: '#F3F8FF',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginTop: 18,
  },

  editProfileButtonText: {
    color: BLUE,
    fontSize: 13,
    fontWeight: '700',
  },

  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 23,
    width: '100%',
  },

  accountStats: {
    flex: 1,
    paddingVertical: 17,
    paddingHorizontal: 5,
    backgroundColor: BACKGROUND,
    borderRadius: 14,
    alignItems: 'center',
  },

  accountStatsNumber: {
    fontSize: 26,
    fontWeight: '800',
    color: BLUE,
  },

  accountStatsLabel: {
    fontSize: 11,
    color: MUTED,
    marginTop: 5,
    textAlign: 'center',
  },

  accountMenu: {
    backgroundColor: WHITE,
    borderRadius: 18,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: BORDER,
  },

  menuHeading: {
    color: DARK_BLUE,
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 8,
  },

  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F4F8',
  },

  menuIcon: {
    fontSize: 20,
    marginRight: 12,
  },

  menuLabel: {
    flex: 1,
    fontSize: 13,
    color: DARK_BLUE,
    fontWeight: '600',
  },

  menuArrow: {
    fontSize: 23,
    color: '#94A3B8',
  },

  infoRow: {
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F4F8',
  },

  infoLabel: {
    fontSize: 12,
    color: MUTED,
    marginBottom: 6,
  },

  infoValue: {
    fontSize: 14,
    color: DARK_BLUE,
    fontWeight: '600',
  },

  noticeCard: {
    backgroundColor: '#EAF4FF',
    borderRadius: 15,
    padding: 16,
    marginTop: 16,
  },

  noticeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: DARK_BLUE,
  },

  profileNote: {
    marginTop: 7,
    fontSize: 12,
    color: MUTED,
    lineHeight: 20,
  },

  logoutButton: {
    marginTop: 20,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
    paddingVertical: 15,
    alignItems: 'center',
  },

  logoutText: {
    color: '#DC2626',
    fontWeight: '700',
    fontSize: 14,
  },

  versionText: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 22,
  },

  // CHỈNH SỬA HỒ SƠ

  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 18,
    paddingVertical: 5,
  },

  backText: {
    fontSize: 15,
    fontWeight: '700',
    color: BLUE,
  },

  editProfileCard: {
    backgroundColor: WHITE,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 12,
  },

  editAvatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#EAF3FF',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 25,
  },

  disabledInput: {
    backgroundColor: '#F1F5F9',
    color: MUTED,
  },

  fieldHint: {
    fontSize: 11,
    color: MUTED,
    lineHeight: 17,
    marginTop: 6,
  },

  addressInput: {
    height: 95,
    paddingTop: 14,
    paddingBottom: 14,
  },

  disabledButton: {
    opacity: 0.6,
  },

  cancelButton: {
    alignItems: 'center',
    paddingVertical: 15,
    marginTop: 6,
  },

  cancelText: {
    fontSize: 13,
    color: MUTED,
    fontWeight: '600',
  },

  // THANH ĐIỀU HƯỚNG

  tabBar: {
    flexDirection: 'row',
    backgroundColor: WHITE,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingTop: 8,
    paddingBottom: 5,
    paddingHorizontal: 8,
  },

  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 3,
  },

  tabIconContainer: {
    width: 48,
    height: 31,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  tabIconContainerActive: {
    backgroundColor: '#E4F1FF',
  },

  tabIcon: {
    fontSize: 24,
    color: '#94A3B8',
  },

  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: MUTED,
    marginTop: 4,
  },

  tabActiveText: {
    color: BLUE,
    fontWeight: '800',
  },
});