
import React, {
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import * as ImagePicker from 'expo-image-picker';

import {
  AIAction,
  AIConversation,
  AIMessage,
  ProductRecommendation,
  createId,
  formatCurrency,
} from '../types/smartcool';

import {
  AI_SUGGESTIONS,
  createAIConversation,
  sendAIMessage,
} from '../services/aiService';

// ==================================================
// MÀU SẮC
// ==================================================

const BLUE = '#0878E8';
const DARK_BLUE = '#075BB5';
const LIGHT_BLUE = '#EAF4FF';
const BACKGROUND = '#F5F8FC';
const WHITE = '#FFFFFF';
const TEXT = '#172B4D';
const MUTED = '#64748B';
const BORDER = '#DCE6F1';
const GREEN = '#16A34A';

// ==================================================
// KIỂU DỮ LIỆU
// ==================================================

interface AIChatScreenProps {
  conversation?: AIConversation;
  initialQuestion?: string;
  onBack: () => void;
  onAction: (action: AIAction) => void;
  onConversationChange?: (
    conversation: AIConversation
  ) => void;
  onNewConversation?: (
    conversation: AIConversation
  ) => void;
}

const ACTION_ICONS: Record<string, string> = {
  chat: '💬',
  camera: '📷',
  budget: '🛍️',
  compare: '⚖️',
  library: '📚',
  diagnosis: '🔧',
  estimate: '🧮',
  guide: '📋',
};

const QUICK_SUGGESTIONS = [
  {
    icon: '❄️',
    title: 'Tư vấn mua máy lạnh',
    description: 'Chọn thiết bị phù hợp',
    question: AI_SUGGESTIONS[0],
  },
  {
    icon: '🧮',
    title: 'Dự toán chi phí',
    description: 'Tính ngân sách cần chuẩn bị',
    question: AI_SUGGESTIONS[3],
  },
  {
    icon: '🔧',
    title: 'Chẩn đoán sự cố',
    description: 'Tìm nguyên nhân hư hỏng',
    question: AI_SUGGESTIONS[4],
  },
  {
    icon: '⚖️',
    title: 'So sánh thiết bị',
    description: 'Lựa chọn sản phẩm phù hợp',
    question: AI_SUGGESTIONS[2],
  },
  {
    icon: '⚡',
    title: 'Tiết kiệm điện',
    description: 'Tối ưu chi phí sử dụng',
    question: AI_SUGGESTIONS[6],
  },
  {
    icon: '📋',
    title: 'Hướng dẫn bảo dưỡng',
    description: 'Chăm sóc thiết bị đúng cách',
    question: AI_SUGGESTIONS[7],
  },
];

// ==================================================
// ĐỊNH DẠNG THỜI GIAN
// ==================================================

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString(
    'vi-VN',
    {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }
  );
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const today = new Date();

  if (
    date.toDateString() === today.toDateString()
  ) {
    return 'Hôm nay';
  }

  return date.toLocaleDateString('vi-VN');
}

// ==================================================
// THẺ SẢN PHẨM
// ==================================================

function ProductCard({
  product,
}: {
  product: ProductRecommendation;
}) {
  const deviceIcon =
    product.deviceType === 'air-conditioner'
      ? '❄️'
      : product.deviceType === 'refrigerator'
        ? '🧊'
        : '📦';

  return (
    <View style={styles.productCard}>
      <View style={styles.productTop}>
        <View style={styles.productIconBox}>
          <Text style={styles.productIcon}>
            {deviceIcon}
          </Text>
        </View>

        <View style={styles.productInformation}>
          <Text style={styles.productBrand}>
            {product.brand}
          </Text>

          <Text style={styles.productName}>
            {product.name}
          </Text>

          <Text style={styles.productPrice}>
            {formatCurrency(product.price)}
          </Text>
        </View>
      </View>

      <View style={styles.productTags}>
        <View style={styles.productTag}>
          <Text style={styles.productTagText}>
            {product.capacity}
          </Text>
        </View>

        {product.inverter && (
          <View style={styles.inverterTag}>
            <Text style={styles.inverterText}>
              Inverter
            </Text>
          </View>
        )}
      </View>

      <Text style={styles.productDescription}>
        {product.description}
      </Text>

      <Text style={styles.productDemoText}>
        Giá tham khảo từ dữ liệu demo
      </Text>
    </View>
  );
}

// ==================================================
// NÚT HÀNH ĐỘNG CỦA AI
// ==================================================

function ActionButton({
  action,
  onPress,
  disabled = false,
}: {
  action: AIAction;
  onPress: (action: AIAction) => void;
  disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.actionButton,
        disabled && styles.disabledButton,
      ]}
      activeOpacity={0.75}
      disabled={disabled}
      onPress={() => onPress(action)}
    >
      <View style={styles.actionIconBox}>
        <Text style={styles.actionIcon}>
          {ACTION_ICONS[action.feature] ?? '✨'}
        </Text>
      </View>

      <View style={styles.actionInformation}>
        <Text style={styles.actionLabel}>
          {action.label}
        </Text>

        {action.feature === 'compare' && (
          <Text style={styles.actionDescription}>
            {action.payload.firstProduct.name}
            {' và '}
            {action.payload.secondProduct.name}
          </Text>
        )}

        {action.feature === 'estimate' && (
          <Text style={styles.actionDescription}>
            {action.payload.productName ??
              'Chi phí theo nội dung tư vấn'}
          </Text>
        )}

        {action.feature === 'budget' && (
          <Text style={styles.actionDescription}>
            Xem các thiết bị AI đã đề xuất
          </Text>
        )}
      </View>

      <Text style={styles.actionArrow}>
        ›
      </Text>
    </TouchableOpacity>
  );
}

// ==================================================
// HIỂN THỊ TIN NHẮN
// ==================================================

function MessageBubble({
  message,
  onAction,
  disabled,
}: {
  message: AIMessage;
  onAction: (action: AIAction) => void;
  disabled?: boolean;
}) {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <View style={styles.userMessageContainer}>
        <View style={styles.userBubble}>
          {message.imageUri && (
            <Image
              source={{ uri: message.imageUri }}
              style={styles.messageImage}
              resizeMode="cover"
            />
          )}

          {!!message.content && (
            <Text style={styles.userMessageText}>
              {message.content}
            </Text>
          )}
        </View>

        <Text style={styles.userMessageTime}>
          Bạn · {formatTime(message.createdAt)}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.assistantMessageContainer}>
      <View style={styles.assistantAvatar}>
        <Text style={styles.assistantAvatarText}>
          ❄
        </Text>
      </View>

      <View style={styles.assistantMessageContent}>
        <View style={styles.assistantNameRow}>
          <Text style={styles.assistantName}>
            SmartCool AI
          </Text>

          <Text style={styles.messageTime}>
            {formatTime(message.createdAt)}
          </Text>
        </View>

        <View style={styles.assistantBubble}>
          <Text style={styles.assistantMessageText}>
            {message.content}
          </Text>

          {!!message.recommendations?.length && (
            <View style={styles.recommendationSection}>
              <Text style={styles.sectionTitle}>
                Thiết bị được đề xuất
              </Text>

              {message.recommendations.map(
                (product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                  />
                )
              )}
            </View>
          )}

          {!!message.actions?.length && (
            <View style={styles.actionsSection}>
              <Text style={styles.sectionTitle}>
                Khám phá kết quả tư vấn
              </Text>

              {message.actions.map((action) => (
                <ActionButton
                  key={action.id}
                  action={action}
                  onPress={onAction}
                  disabled={disabled}
                />
              ))}
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

// ==================================================
// GIAO DIỆN CHAT CHÍNH
// ==================================================

export default function AIChatScreen({
  conversation,
  initialQuestion,
  onBack,
  onAction,
  onConversationChange,
  onNewConversation,
}: AIChatScreenProps) {
  const [
    currentConversation,
    setCurrentConversation,
  ] = useState<AIConversation>(
    () => conversation ?? createAIConversation()
  );

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const [selectedImage, setSelectedImage] =
    useState<string | null>(null);

  const [showImageMenu, setShowImageMenu] =
    useState(false);

  const scrollRef =
    useRef<React.ComponentRef<typeof ScrollView>>(
      null
    );

  const conversationRef =
    useRef<AIConversation>(currentConversation);

  const busyRef = useRef(false);

  const initialQuestionRef =
    useRef<string | undefined>(undefined);

  const timerRef =
    useRef<ReturnType<typeof setTimeout> | null>(
      null
    );

  const callbacksRef = useRef({
    onConversationChange,
    onNewConversation,
  });

  useEffect(() => {
    callbacksRef.current = {
      onConversationChange,
      onNewConversation,
    };
  }, [
    onConversationChange,
    onNewConversation,
  ]);

  // ==================================================
  // CUỘN XUỐNG TIN NHẮN MỚI NHẤT
  // ==================================================

  function scrollToBottom(animated = true) {
    scrollRef.current?.scrollToEnd({
      animated,
    });
  }

  // ==================================================
  // CẬP NHẬT HỘI THOẠI
  // ==================================================

  function updateConversation(
    nextConversation: AIConversation
  ) {
    conversationRef.current = nextConversation;

    setCurrentConversation(nextConversation);

    callbacksRef.current.onConversationChange?.(
      nextConversation
    );
  }

  // ==================================================
  // HỦY PHẢN HỒI ĐANG CHỜ
  // ==================================================

  function cancelPendingResponse() {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    busyRef.current = false;
    setIsTyping(false);
  }

  // ==================================================
  // CHỌN ẢNH TỪ THƯ VIỆN
  // ==================================================

  async function pickImage() {
    setShowImageMenu(false);

    try {
      const result =
        await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: false,
          quality: 0.8,
          allowsMultipleSelection: false,
        });

      if (
        !result.canceled &&
        result.assets.length > 0
      ) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch {
      Alert.alert(
        'Không thể mở thư viện',
        'Bạn vui lòng thử lại.'
      );
    }
  }

  // ==================================================
  // CHỤP ẢNH TRỰC TIẾP
  // ==================================================

  async function takePhoto() {
    setShowImageMenu(false);

    try {
      const permission =
        await ImagePicker.requestCameraPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          'Cần quyền truy cập camera',
          'Vui lòng cho phép SmartCool AI sử dụng camera trong phần Cài đặt.'
        );

        return;
      }

      const result =
        await ImagePicker.launchCameraAsync({
          allowsEditing: false,
          quality: 0.8,
        });

      if (
        !result.canceled &&
        result.assets.length > 0
      ) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch {
      Alert.alert(
        'Không thể mở camera',
        'Bạn vui lòng thử lại.'
      );
    }
  }

  // ==================================================
  // GỬI TIN NHẮN VÀ HÌNH ẢNH
  // ==================================================

  function handleSend(question?: string) {
    const imageUri =
      question === undefined
        ? selectedImage ?? undefined
        : undefined;

    const typedContent =
      (question ?? input).trim();

    if (
      (!typedContent && !imageUri) ||
      busyRef.current
    ) {
      return;
    }

    const content =
      typedContent ||
      'Bạn có thể tư vấn về hình ảnh này không?';

    busyRef.current = true;

    const previousConversation =
      conversationRef.current;

    const userMessage: AIMessage = {
      id: createId(),
      role: 'user',
      content,
      imageUri,
      createdAt: Date.now(),
    };

    const hasPreviousQuestion =
      previousConversation.messages.some(
        (message) => message.role === 'user'
      );

    const pendingConversation: AIConversation = {
      ...previousConversation,

      title: hasPreviousQuestion
        ? previousConversation.title
        : content.slice(0, 45),

      updatedAt: Date.now(),

      messages: [
        ...previousConversation.messages,
        userMessage,
      ],
    };

    // Hiển thị ngay tin nhắn người dùng.
    setInput('');
    setSelectedImage(null);
    setShowImageMenu(false);
    setIsTyping(true);

    conversationRef.current = pendingConversation;
    setCurrentConversation(pendingConversation);

    {
      try {
        const generatedConversation =
          sendAIMessage(
            previousConversation,
            content
          );

        const generatedMessages =
          generatedConversation.messages;

        const generatedReply =
          generatedMessages[
            generatedMessages.length - 1
          ];

        if (
          !generatedReply ||
          generatedReply.role !== 'assistant'
        ) {
          throw new Error(
            'Không nhận được phản hồi AI'
          );
        }

        let assistantMessage: AIMessage = {
          ...generatedReply,
          id: createId(),
          createdAt: Date.now(),
        };

        if (imageUri) {
          assistantMessage = {
            ...assistantMessage,

            content:
              'Tôi đã nhận được hình ảnh của bạn.\n\n' +
              'Hiện tại SmartCool AI đang ở chế độ demo, ' +
              'chưa thể nhận diện nội dung hình ảnh thực tế. ' +
              'Tôi có thể hỗ trợ dựa trên phần mô tả bạn gửi kèm.\n\n' +
              (typedContent
                ? generatedReply.content
                : 'Bạn hãy cho tôi biết loại thiết bị, ' +
                  'thương hiệu, mã lỗi hoặc tình trạng đang gặp phải nhé.'),

            actions: typedContent
              ? generatedReply.actions
              : undefined,

            recommendations: typedContent
              ? generatedReply.recommendations
              : undefined,
          };
        }

        const nextConversation: AIConversation = {
          ...generatedConversation,

          id: pendingConversation.id,

          title: pendingConversation.title,

          updatedAt: Date.now(),

          messages: [
            ...pendingConversation.messages,
            assistantMessage,
          ],
        };

        updateConversation(nextConversation);
      } catch {
        const errorMessage: AIMessage = {
          id: createId(),
          role: 'assistant',
          content:
            'Xin lỗi, tôi chưa thể xử lý câu hỏi này. ' +
            'Bạn vui lòng thử lại nhé.',
          createdAt: Date.now(),
        };

        updateConversation({
          ...pendingConversation,
          updatedAt: Date.now(),
          messages: [
            ...pendingConversation.messages,
            errorMessage,
          ],
        });
      } finally {
        busyRef.current = false;
        setIsTyping(false);
        timerRef.current = null;
      }
    }
  }

  // ==================================================
  // NHẬN HỘI THOẠI TỪ MÀN HÌNH KHÁC
  // ==================================================

  useEffect(() => {
    if (
      conversation &&
      conversation !== conversationRef.current
    ) {
      cancelPendingResponse();

      conversationRef.current = conversation;

      setCurrentConversation(conversation);

      setInput('');
      setSelectedImage(null);
      setShowImageMenu(false);

      initialQuestionRef.current = undefined;
    }
  }, [conversation]);

  // ==================================================
  // NHẬN CÂU HỎI TỪ TRANG CHỦ
  // ==================================================

  useEffect(() => {
    const question = initialQuestion?.trim();

    if (!question) {
      return;
    }

    if (
      initialQuestionRef.current !== question &&
      !busyRef.current
    ) {
      initialQuestionRef.current = question;

      handleSend(question);
    }
  }, [initialQuestion]);

  // ==================================================
  // TỰ ĐỘNG CUỘN
  // ==================================================

  useEffect(() => {
    const timeout = setTimeout(() => {
      scrollToBottom();
    }, 100);

    return () => clearTimeout(timeout);
  }, [
    currentConversation.messages.length,
    isTyping,
  ]);

  // ==================================================
  // DỌN DẸP
  // ==================================================

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }

      busyRef.current = false;
    };
  }, []);

  // ==================================================
  // TẠO CUỘC TRÒ CHUYỆN MỚI
  // ==================================================

  function startNewConversation() {
    const createNew = () => {
      cancelPendingResponse();

      const nextConversation =
        createAIConversation();

      setInput('');
      setSelectedImage(null);
      setShowImageMenu(false);

      initialQuestionRef.current = undefined;

      updateConversation(nextConversation);

      callbacksRef.current.onNewConversation?.(
        nextConversation
      );
    };

    const hasUserMessage =
      currentConversation.messages.some(
        (message) => message.role === 'user'
      );

    if (!hasUserMessage) {
      createNew();
      return;
    }

    Alert.alert(
      'Cuộc trò chuyện mới',
      'Bạn muốn bắt đầu cuộc trò chuyện mới?',
      [
        {
          text: 'Hủy',
          style: 'cancel',
        },
        {
          text: 'Tạo mới',
          onPress: createNew,
        },
      ]
    );
  }

  // ==================================================
  // XỬ LÝ HÀNH ĐỘNG TỪ AI
  // ==================================================

  function handleAction(action: AIAction) {
    if (busyRef.current) {
      return;
    }

    if (action.feature === 'camera') {
      setShowImageMenu(true);
      return;
    }

    // Truyền toàn bộ payload gốc.
    // Không tạo lại hoặc làm mất dữ liệu AI đề xuất.
    onAction(action);
  }

  const hasUserMessage =
    currentConversation.messages.some(
      (message) => message.role === 'user'
    );

  const canSend =
    (input.trim().length > 0 ||
      selectedImage !== null) &&
    !isTyping;

  // ==================================================
  // GIAO DIỆN
  // ==================================================

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={
        Platform.OS === 'ios'
          ? 'padding'
          : undefined
      }
      keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
    >
      {/* HEADER */}

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          disabled={isTyping}
        >
          <Text style={styles.backIcon}>
            ‹
          </Text>
        </TouchableOpacity>

        <View style={styles.headerAvatar}>
          <Text style={styles.headerAvatarText}>
            ❄
          </Text>
        </View>

        <View style={styles.headerInformation}>
          <Text style={styles.headerTitle}>
            SmartCool AI
          </Text>

          <View style={styles.statusRow}>
            <View style={styles.onlineDot} />

            <Text style={styles.statusText}>
              {isTyping
                ? 'Đang phân tích...'
                : 'Sẵn sàng hỗ trợ'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.newChatButton}
          onPress={startNewConversation}
          disabled={isTyping}
        >
          <Text style={styles.newChatIcon}>
            ＋
          </Text>
        </TouchableOpacity>
      </View>

      {/* DANH SÁCH TIN NHẮN */}

      <ScrollView
        ref={scrollRef}
        style={styles.chatScroll}
        contentContainerStyle={styles.chatContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        onContentSizeChange={() => {
          scrollToBottom(false);
        }}
      >
        <View style={styles.dateContainer}>
          <Text style={styles.dateText}>
            {formatDate(
              currentConversation.messages[0]
                ?.createdAt ?? Date.now()
            )}
          </Text>
        </View>

        {!hasUserMessage && (
          <View style={styles.welcomeCard}>
            <View style={styles.welcomeIconBox}>
              <Text style={styles.welcomeIcon}>
                ❄
              </Text>
            </View>

            <Text style={styles.welcomeTitle}>
              Xin chào, tôi là SmartCool AI!
            </Text>

            <Text style={styles.welcomeDescription}>
              Trợ lý thông minh chuyên về điện lạnh.
              Tôi luôn sẵn sàng hỗ trợ bạn lựa chọn,
              sử dụng và chăm sóc thiết bị.
            </Text>

            <View style={styles.demoBadge}>
              <Text style={styles.demoBadgeText}>
                ✨ Trợ lý thông minh · Chế độ demo
              </Text>
            </View>
          </View>
        )}

        {currentConversation.messages.map(
          (message, index) => {
            const previousMessage =
              currentConversation.messages[
                index - 1
              ];

            const showDate =
              index > 0 &&
              previousMessage &&
              new Date(
                previousMessage.createdAt
              ).toDateString() !==
                new Date(
                  message.createdAt
                ).toDateString();

            return (
              <React.Fragment key={message.id}>
                {showDate && (
                  <View style={styles.dateContainer}>
                    <Text style={styles.dateText}>
                      {formatDate(
                        message.createdAt
                      )}
                    </Text>
                  </View>
                )}

                <MessageBubble
                  message={message}
                  onAction={handleAction}
                  disabled={isTyping}
                />
              </React.Fragment>
            );
          }
        )}

        {/* CÂU HỎI GỢI Ý */}

        {!hasUserMessage && (
          <View style={styles.suggestionsSection}>
            <Text style={styles.suggestionsTitle}>
              Bạn cần hỗ trợ gì hôm nay?
            </Text>

            <Text style={styles.suggestionsSubtitle}>
              Chọn một nội dung để bắt đầu
            </Text>

            <View style={styles.suggestionsGrid}>
              {QUICK_SUGGESTIONS.map((item) => (
                <TouchableOpacity
                  key={item.title}
                  style={styles.suggestionCard}
                  activeOpacity={0.75}
                  onPress={() =>
                    handleSend(item.question)
                  }
                >
                  <View
                    style={styles.suggestionIconBox}
                  >
                    <Text
                      style={styles.suggestionIcon}
                    >
                      {item.icon}
                    </Text>
                  </View>

                  <Text
                    style={styles.suggestionTitle}
                  >
                    {item.title}
                  </Text>

                  <Text
                    style={
                      styles.suggestionDescription
                    }
                  >
                    {item.description}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* AI ĐANG TRẢ LỜI */}

        {isTyping && (
          <View style={styles.typingContainer}>
            <View style={styles.assistantAvatar}>
              <Text
                style={styles.assistantAvatarText}
              >
                ❄
              </Text>
            </View>

            <View style={styles.typingBubble}>
              <ActivityIndicator
                size="small"
                color={BLUE}
              />

              <Text style={styles.typingText}>
                SmartCool AI đang phân tích...
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* MENU CHỌN HÌNH ẢNH */}

      {showImageMenu && (
        <View style={styles.imageMenu}>
          <View style={styles.imageMenuHeader}>
            <Text style={styles.imageMenuTitle}>
              Thêm hình ảnh
            </Text>

            <TouchableOpacity
              onPress={() =>
                setShowImageMenu(false)
              }
            >
              <Text style={styles.closeMenuText}>
                ✕
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.imageMenuRow}>
            <TouchableOpacity
              style={styles.imageMenuOption}
              onPress={takePhoto}
            >
              <Text style={styles.imageMenuIcon}>
                📷
              </Text>

              <Text style={styles.imageMenuLabel}>
                Chụp ảnh
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.imageMenuOption}
              onPress={pickImage}
            >
              <Text style={styles.imageMenuIcon}>
                🖼️
              </Text>

              <Text style={styles.imageMenuLabel}>
                Thư viện ảnh
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* THANH NHẬP TIN NHẮN */}

      <View style={styles.composerContainer}>
        {selectedImage && (
          <View style={styles.previewContainer}>
            <View style={styles.previewImageBox}>
              <Image
                source={{ uri: selectedImage }}
                style={styles.previewImage}
                resizeMode="cover"
              />

              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() =>
                  setSelectedImage(null)
                }
              >
                <Text style={styles.removeImageText}>
                  ✕
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.previewInformation}>
              <Text style={styles.previewTitle}>
                Hình ảnh đính kèm
              </Text>

              <Text style={styles.previewDescription}>
                Nhập câu hỏi về hình ảnh rồi gửi
                cho SmartCool AI.
              </Text>
            </View>
          </View>
        )}

        <View style={styles.composerRow}>
          <TouchableOpacity
            style={[
              styles.cameraButton,
              isTyping && styles.disabledButton,
            ]}
            onPress={() =>
              setShowImageMenu(
                (previous) => !previous
              )
            }
            disabled={isTyping}
          >
            <Text style={styles.cameraIcon}>
              📷
            </Text>
          </TouchableOpacity>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              value={input}
              onChangeText={setInput}
              placeholder={
                selectedImage
                  ? 'Hỏi về hình ảnh này...'
                  : 'Hỏi SmartCool AI...'
              }
              placeholderTextColor="#8492A6"
              selectionColor={BLUE}
              keyboardAppearance="light"
              multiline
              maxLength={4000}
              editable={!isTyping}
              textAlignVertical="center"
              onFocus={() => {
                setShowImageMenu(false);
                setTimeout(() => {
                  scrollToBottom();
                }, 250);
              }}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.sendButton,
              !canSend &&
                styles.sendButtonDisabled,
            ]}
            onPress={() => handleSend()}
            disabled={!canSend}
          >
            {isTyping ? (
              <ActivityIndicator
                size="small"
                color={WHITE}
              />
            ) : (
              <Text style={styles.sendIcon}>
                ↑
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.disclaimer}>
          SmartCool AI có thể mắc sai sót.
          Hãy kiểm tra thông tin quan trọng.
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

// ==================================================
// STYLE
// ==================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BACKGROUND,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: WHITE,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },

  backButton: {
    width: 30,
    height: 42,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },

  backIcon: {
    color: BLUE,
    fontSize: 38,
    lineHeight: 40,
  },

  headerAvatar: {
    width: 45,
    height: 45,
    borderRadius: 15,
    backgroundColor: BLUE,
    justifyContent: 'center',
    alignItems: 'center',
  },

  headerAvatarText: {
    color: WHITE,
    fontSize: 28,
    fontWeight: '700',
  },

  headerInformation: {
    flex: 1,
    marginLeft: 11,
  },

  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: TEXT,
  },

  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },

  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: GREEN,
    marginRight: 5,
  },

  statusText: {
    fontSize: 11,
    color: GREEN,
    fontWeight: '500',
  },

  newChatButton: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: LIGHT_BLUE,
    alignItems: 'center',
    justifyContent: 'center',
  },

  newChatIcon: {
    fontSize: 25,
    color: BLUE,
    fontWeight: '600',
  },

  chatScroll: {
    flex: 1,
  },

  chatContent: {
    flexGrow: 1,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 24,
  },

  dateContainer: {
    alignItems: 'center',
    marginBottom: 18,
    marginTop: 4,
  },

  dateText: {
    fontSize: 11,
    color: MUTED,
    backgroundColor: '#E8EEF5',
    paddingHorizontal: 13,
    paddingVertical: 6,
    borderRadius: 20,
    overflow: 'hidden',
  },

  welcomeCard: {
    backgroundColor: WHITE,
    borderRadius: 22,
    padding: 22,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: BORDER,
  },

  welcomeIconBox: {
    width: 76,
    height: 76,
    borderRadius: 25,
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },

  welcomeIcon: {
    fontSize: 45,
    color: WHITE,
    fontWeight: '700',
  },

  welcomeTitle: {
    color: TEXT,
    fontSize: 21,
    fontWeight: '800',
    textAlign: 'center',
  },

  welcomeDescription: {
    color: MUTED,
    fontSize: 13,
    lineHeight: 21,
    textAlign: 'center',
    marginTop: 9,
  },

  demoBadge: {
    backgroundColor: LIGHT_BLUE,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 15,
  },

  demoBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: BLUE,
  },

  // TIN NHẮN NGƯỜI DÙNG

  userMessageContainer: {
    width: '100%',
    alignItems: 'flex-end',
    marginBottom: 20,
  },

  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: DARK_BLUE,
    borderTopLeftRadius: 19,
    borderTopRightRadius: 19,
    borderBottomLeftRadius: 19,
    borderBottomRightRadius: 5,
    paddingHorizontal: 15,
    paddingVertical: 12,
    maxWidth: '85%',
    minWidth: 48,
    flexShrink: 1,
  },

  userMessageText: {
    color: '#FFFFFF',
    fontSize: 15,
    lineHeight: 23,
    fontWeight: '500',
    flexShrink: 1,
  },

  userMessageTime: {
    color: MUTED,
    fontSize: 11,
    marginTop: 5,
    marginRight: 3,
  },

  messageImage: {
    width: 220,
    maxWidth: '100%',
    height: 180,
    borderRadius: 12,
    marginBottom: 9,
    backgroundColor: LIGHT_BLUE,
  },

  // TIN NHẮN AI

  assistantMessageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 22,
    width: '100%',
  },

  assistantAvatar: {
    width: 30,
    height: 30,
    borderRadius: 11,
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },

  assistantAvatarText: {
    fontSize: 19,
    color: WHITE,
    fontWeight: '700',
  },

  assistantMessageContent: {
    flex: 1,
    minWidth: 0,
  },

  assistantNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 7,
    flexWrap: 'wrap',
  },

  assistantName: {
    color: DARK_BLUE,
    fontSize: 12,
    fontWeight: '700',
    marginRight: 8,
  },

  messageTime: {
    color: MUTED,
    fontSize: 10,
  },

  assistantBubble: {
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: BORDER,
    borderTopLeftRadius: 5,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    padding: 13,
  },

  assistantMessageText: {
    color: TEXT,
    fontSize: 14,
    lineHeight: 23,
  },

  recommendationSection: {
    marginTop: 16,
  },

  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: TEXT,
    marginBottom: 10,
  },

  productCard: {
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: '#F8FBFF',
    borderRadius: 15,
    padding: 12,
    marginBottom: 10,
  },

  productTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  productIconBox: {
    width: 46,
    height: 46,
    backgroundColor: LIGHT_BLUE,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  productIcon: {
    fontSize: 24,
  },

  productInformation: {
    flex: 1,
  },

  productBrand: {
    fontSize: 10,
    color: MUTED,
    fontWeight: '600',
    marginBottom: 3,
  },

  productName: {
    color: TEXT,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
  },

  productPrice: {
    color: BLUE,
    fontSize: 16,
    fontWeight: '800',
    marginTop: 4,
  },

  productTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
  },

  productTag: {
    backgroundColor: LIGHT_BLUE,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 7,
    marginRight: 6,
    marginBottom: 4,
  },

  productTagText: {
    color: DARK_BLUE,
    fontSize: 10,
    fontWeight: '600',
  },

  inverterTag: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 7,
    marginBottom: 4,
  },

  inverterText: {
    color: '#15803D',
    fontSize: 10,
    fontWeight: '700',
  },

  productDescription: {
    color: MUTED,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
  },

  productDemoText: {
    color: MUTED,
    fontSize: 10,
    marginTop: 7,
  },

  actionsSection: {
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },

  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: LIGHT_BLUE,
    borderWidth: 1,
    borderColor: '#C5DFFF',
    borderRadius: 13,
    padding: 10,
    marginBottom: 8,
  },

  actionIconBox: {
    width: 33,
    height: 33,
    borderRadius: 9,
    backgroundColor: WHITE,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
  },

  actionIcon: {
    fontSize: 17,
  },

  actionInformation: {
    flex: 1,
    minWidth: 0,
  },

  actionLabel: {
    color: DARK_BLUE,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
  },

  actionDescription: {
    color: MUTED,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 3,
  },

  actionArrow: {
    color: BLUE,
    fontSize: 24,
    marginLeft: 6,
  },

  disabledButton: {
    opacity: 0.5,
  },

  suggestionsSection: {
    marginTop: 3,
    marginBottom: 12,
  },

  suggestionsTitle: {
    color: TEXT,
    fontSize: 18,
    fontWeight: '800',
  },

  suggestionsSubtitle: {
    color: MUTED,
    fontSize: 12,
    marginTop: 5,
    marginBottom: 15,
  },

  suggestionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  suggestionCard: {
    width: '48.5%',
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 17,
    padding: 13,
    marginBottom: 11,
    minHeight: 132,
  },

  suggestionIconBox: {
    width: 39,
    height: 39,
    borderRadius: 12,
    backgroundColor: LIGHT_BLUE,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },

  suggestionIcon: {
    fontSize: 21,
  },

  suggestionTitle: {
    color: TEXT,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
  },

  suggestionDescription: {
    color: MUTED,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 5,
  },

  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },

  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 12,
    paddingVertical: 13,
    borderRadius: 15,
    flexShrink: 1,
  },

  typingText: {
    fontSize: 12,
    color: MUTED,
    marginLeft: 9,
    flexShrink: 1,
  },

  // MENU HÌNH ẢNH

  imageMenu: {
    backgroundColor: WHITE,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    padding: 16,
  },

  imageMenuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 13,
  },

  imageMenuTitle: {
    fontSize: 16,
    color: TEXT,
    fontWeight: '800',
  },

  closeMenuText: {
    fontSize: 20,
    color: MUTED,
    paddingHorizontal: 5,
  },

  imageMenuRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  imageMenuOption: {
    width: '48%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: LIGHT_BLUE,
    borderRadius: 17,
    paddingVertical: 18,
  },

  imageMenuIcon: {
    fontSize: 30,
    marginBottom: 8,
  },

  imageMenuLabel: {
    color: DARK_BLUE,
    fontSize: 13,
    fontWeight: '700',
  },

  // XEM TRƯỚC ẢNH

  previewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: LIGHT_BLUE,
    borderRadius: 15,
    marginBottom: 12,
  },

  previewImageBox: {
    position: 'relative',
    marginRight: 13,
  },

  previewImage: {
    width: 78,
    height: 78,
    borderRadius: 11,
  },

  removeImageButton: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
  },

  removeImageText: {
    color: WHITE,
    fontSize: 13,
    fontWeight: '700',
  },

  previewInformation: {
    flex: 1,
  },

  previewTitle: {
    color: TEXT,
    fontSize: 13,
    fontWeight: '700',
  },

  previewDescription: {
    color: MUTED,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 5,
  },

  // THANH NHẬP TIN NHẮN

  composerContainer: {
    backgroundColor: WHITE,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingHorizontal: 12,
    paddingTop: 11,
    paddingBottom: 9,
  },

  composerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },

  cameraButton: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: LIGHT_BLUE,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },

  cameraIcon: {
    fontSize: 23,
  },

  inputContainer: {
    flex: 1,
    minWidth: 0,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 20,
    minHeight: 46,
    justifyContent: 'center',
  },

  textInput: {
    width: '100%',
    color: '#172B4D',
    backgroundColor: 'transparent',
    fontSize: 16,
    fontWeight: '400',
    paddingHorizontal: 13,
    paddingTop: 12,
    paddingBottom: 12,
    minHeight: 46,
    maxHeight: 130,
    lineHeight: 22,
  },

  sendButton: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },

  sendButtonDisabled: {
    backgroundColor: '#A5C9F0',
  },

  sendIcon: {
    fontSize: 27,
    color: WHITE,
    fontWeight: '700',
  },

  disclaimer: {
    color: MUTED,
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 15,
    marginTop: 9,
  },
});
