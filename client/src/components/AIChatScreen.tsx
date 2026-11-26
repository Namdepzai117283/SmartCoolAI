
import { useEffect, useRef, useState } from 'react';

import {
  Snowflake,
  Plus,
  Send,
  ImagePlus,
  Camera,
  X,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  MessageSquare,
  Calculator,
  Wrench,
  Scale,
  Zap,
  BookOpen,
  ShoppingCart,
  LoaderCircle,
} from 'lucide-react';

import type {
  AIAction,
  AIConversation,
  AIMessage,
  ProductRecommendation,
} from '../types/smartcool';

import {
  createId,
  formatCurrency,
} from '../types/smartcool';

import {
  createAIConversation,
  sendAIMessage,
  AI_SUGGESTIONS,
} from '../services/aiService';

import './AIChatScreen.css';

// ==========================================
// KIỂU DỮ LIỆU
// ==========================================

interface Props {
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

// ==========================================
// CÂU HỎI GỢI Ý
// ==========================================

const QUICK_SUGGESTIONS = [
  {
    icon: ShoppingCart,
    title: 'Tư vấn mua máy lạnh',
    description: 'Chọn thiết bị phù hợp',
    question: AI_SUGGESTIONS[0],
  },
  {
    icon: Calculator,
    title: 'Dự toán chi phí',
    description: 'Tính ngân sách cần chuẩn bị',
    question: AI_SUGGESTIONS[3],
  },
  {
    icon: Wrench,
    title: 'Chẩn đoán sự cố',
    description: 'Tìm nguyên nhân hư hỏng',
    question: AI_SUGGESTIONS[4],
  },
  {
    icon: Scale,
    title: 'So sánh thiết bị',
    description: 'Lựa chọn sản phẩm phù hợp',
    question: AI_SUGGESTIONS[2],
  },
  {
    icon: Zap,
    title: 'Tiết kiệm điện',
    description: 'Tối ưu chi phí sử dụng',
    question: AI_SUGGESTIONS[6],
  },
  {
    icon: BookOpen,
    title: 'Hướng dẫn bảo dưỡng',
    description: 'Chăm sóc thiết bị đúng cách',
    question: AI_SUGGESTIONS[7],
  },
];

const ACTION_ICONS = {
  chat: MessageSquare,
  camera: Camera,
  budget: ShoppingCart,
  compare: Scale,
  library: BookOpen,
  diagnosis: Wrench,
  estimate: Calculator,
  guide: BookOpen,
};

// ==========================================
// ĐỊNH DẠNG THỜI GIAN
// ==========================================

function formatTime(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString(
    'vi-VN',
    {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }
  );
}

// ==========================================
// THẺ SẢN PHẨM
// ==========================================

function ProductCard({
  product,
}: {
  product: ProductRecommendation;
}) {
  return (
    <div className="sc-chat-product">
      <div className="sc-chat-product-top">
        <div className="sc-chat-product-icon">
          {product.deviceType === 'air-conditioner'
            ? '❄️'
            : product.deviceType === 'refrigerator'
              ? '🧊'
              : '📦'}
        </div>

        <div>
          <span className="sc-chat-product-brand">
            {product.brand}
          </span>

          <h4>{product.name}</h4>

          <strong className="sc-chat-product-price">
            {formatCurrency(product.price)}
          </strong>
        </div>
      </div>

      <div className="sc-chat-product-tags">
        <span>{product.capacity}</span>

        {product.inverter && (
          <span className="sc-chat-inverter">
            Inverter
          </span>
        )}
      </div>

      <p>{product.description}</p>

      {product.suitableRoomArea && (
        <p>
          Diện tích phù hợp: {product.suitableRoomArea}
        </p>
      )}

      <small>Giá tham khảo từ dữ liệu demo</small>
    </div>
  );
}

// ==========================================
// NÚT CHUYỂN CHỨC NĂNG
// ==========================================

function ActionButton({
  action,
  onAction,
  disabled,
}: {
  action: AIAction;
  onAction: (action: AIAction) => void;
  disabled: boolean;
}) {
  const Icon = ACTION_ICONS[action.feature];

  return (
    <button
      type="button"
      className="sc-chat-action"
      disabled={disabled}
      onClick={() => onAction(action)}
    >
      <span className="sc-chat-action-icon">
        <Icon size={20} />
      </span>

      <span className="sc-chat-action-info">
        <strong>{action.label}</strong>

        {action.feature === 'compare' && (
          <small>
            {action.payload.firstProduct.name}
            {' và '}
            {action.payload.secondProduct.name}
          </small>
        )}

        {action.feature === 'estimate' && (
          <small>
            {action.payload.productName ??
              'Chi phí theo nội dung tư vấn'}
          </small>
        )}

        {action.feature === 'budget' && (
          <small>
            Xem thiết bị AI đã đề xuất
          </small>
        )}
      </span>

      <ArrowRight size={18} />
    </button>
  );
}

// ==========================================
// HIỂN THỊ TIN NHẮN
// ==========================================

function MessageBubble({
  message,
  onAction,
  disabled,
}: {
  message: AIMessage;
  onAction: (action: AIAction) => void;
  disabled: boolean;
}) {
  const isUser = message.role === 'user';

  const images = Array.from(
    new Set([
      ...(message.attachments ?? []).map(
        (attachment) => attachment.uri
      ),
      ...(message.imageUri
        ? [message.imageUri]
        : []),
    ])
  );

  return (
    <div
      className={`sc-chat-message ${
        isUser ? 'sc-chat-user' : 'sc-chat-assistant'
      }`}
    >
      {!isUser && (
        <div className="sc-chat-avatar">
          <Snowflake size={22} />
        </div>
      )}

      <div className="sc-chat-message-body">
        <div className="sc-chat-message-meta">
          <strong>
            {isUser ? 'Bạn' : 'SmartCool AI'}
          </strong>

          <span>
            {formatTime(message.createdAt)}
          </span>
        </div>

        <div className="sc-chat-bubble">
          {images.map((uri) => (
            <img
              key={uri}
              src={uri}
              alt="Hình ảnh đính kèm"
              className="sc-chat-message-image"
            />
          ))}

          {message.content && (
            <div className="sc-chat-message-text">
              {message.content}
            </div>
          )}

          {!!message.recommendations?.length && (
            <div className="sc-chat-recommendations">
              <h4>Thiết bị được đề xuất</h4>

              <div className="sc-chat-product-grid">
                {message.recommendations.map(
                  (product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                    />
                  )
                )}
              </div>
            </div>
          )}

          {!!message.actions?.length && (
            <div className="sc-chat-actions">
              <h4>Khám phá kết quả tư vấn</h4>

              {message.actions.map((action) => (
                <ActionButton
                  key={action.id}
                  action={action}
                  onAction={onAction}
                  disabled={disabled}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// MÀN HÌNH AI CHAT
// ==========================================

export default function AIChatScreen({
  conversation,
  initialQuestion,
  onBack,
  onAction,
  onConversationChange,
  onNewConversation,
}: Props) {
  const [currentConversation, setCurrentConversation] =
    useState<AIConversation>(
      () => conversation ?? createAIConversation()
    );

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const [selectedImage, setSelectedImage] =
    useState<string | null>(null);

  const [imageError, setImageError] = useState('');
  const [showImageMenu, setShowImageMenu] =
    useState(false);

  const [isCameraOpen, setIsCameraOpen] =
    useState(false);

  const conversationRef = useRef(currentConversation);
  const busyRef = useRef(false);
  const readingRef = useRef(false);

  const timerRef =
    useRef<ReturnType<typeof setTimeout> | null>(
      null
    );

  const initialQuestionRef =
    useRef<string | undefined>(undefined);

  const messagesEndRef =
    useRef<HTMLDivElement>(null);

  const fileInputRef =
    useRef<HTMLInputElement>(null);

  const textareaRef =
    useRef<HTMLTextAreaElement>(null);

  const videoRef =
    useRef<HTMLVideoElement>(null);

  const streamRef =
    useRef<MediaStream | null>(null);

  const mountedRef = useRef(true);
  const cameraRequestRef = useRef(0);
  const imageRequestRef = useRef(0);

  const callbacksRef = useRef({
    onConversationChange,
    onNewConversation,
  });

  useEffect(() => {
    callbacksRef.current = {
      onConversationChange,
      onNewConversation,
    };
  }, [onConversationChange, onNewConversation]);

  // ========================================
  // CẬP NHẬT HỘI THOẠI
  // ========================================

  function updateConversation(
    next: AIConversation
  ) {
    conversationRef.current = next;
    setCurrentConversation(next);

    callbacksRef.current
      .onConversationChange?.(next);
  }

  function cancelPendingResponse() {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    busyRef.current = false;
    setIsTyping(false);
  }

  function clearImage() {
    imageRequestRef.current += 1;
    readingRef.current = false;
    setSelectedImage(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  // ========================================
  // GỬI TIN NHẮN
  // ========================================

  function handleSend(question?: string) {
    if (busyRef.current || readingRef.current) {
      return;
    }

    const content = (question ?? input).trim();

    const imageUri =
      question === undefined
        ? selectedImage ?? undefined
        : undefined;

    if (!content && !imageUri) return;

    const base = conversationRef.current;

    const attachments = imageUri
      ? [
          {
            id: createId(),
            uri: imageUri,
            source: 'library' as const,
            createdAt: Date.now(),
          },
        ]
      : [];

    let next: AIConversation;

    try {
      next = sendAIMessage(base, {
        content,
        imageUri,
        attachments,
      });
    } catch {
      setImageError(
        'Không thể xử lý câu hỏi. Vui lòng thử lại.'
      );
      return;
    }

    if (next === base) return;

    busyRef.current = true;

    setInput('');
    clearImage();
    setImageError('');
    setShowImageMenu(false);

    // Lưu một lần toàn bộ lượt hỏi đáp, không lưu bản xem trước.
    updateConversation(next);
    busyRef.current = false;
    setIsTyping(false);
  }

  // ========================================
  // TẠO CUỘC TRÒ CHUYỆN MỚI
  // ========================================

  function startNewConversation() {
    cancelPendingResponse();
    closeCamera();

    const next = createAIConversation();

    setInput('');
    clearImage();
    setImageError('');
    setShowImageMenu(false);

    conversationRef.current = next;
    setCurrentConversation(next);
    if (callbacksRef.current.onNewConversation) callbacksRef.current.onNewConversation(next);
    else callbacksRef.current.onConversationChange?.(next);

    textareaRef.current?.focus();
  }

  // ========================================
  // CHỌN HÌNH ẢNH
  // ========================================

  function handleImageFile(file?: File) {
    if (!file || busyRef.current) return;

    if (!file.type.startsWith('image/')) {
      setImageError(
        'Vui lòng chọn một file hình ảnh.'
      );
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setImageError(
        'Hình ảnh không được vượt quá 10 MB.'
      );
      return;
    }

    const requestId = ++imageRequestRef.current;

    readingRef.current = true;

    setImageError('');
    setShowImageMenu(false);

    const reader = new FileReader();

    reader.onload = () => {
      if (
        !mountedRef.current ||
        requestId !== imageRequestRef.current
      ) return;

      const image = new window.Image();

      image.onload = () => {
        if (
          !mountedRef.current ||
          requestId !== imageRequestRef.current
        ) return;

        const scale = Math.min(
          1,
          1000 / Math.max(
            image.width,
            image.height
          )
        );

        const canvas =
          document.createElement('canvas');

        canvas.width = Math.max(
          1,
          Math.round(image.width * scale)
        );

        canvas.height = Math.max(
          1,
          Math.round(image.height * scale)
        );

        const context = canvas.getContext('2d');

        if (!context) {
          readingRef.current = false;
          setImageError('Không thể xử lý hình ảnh.');
          return;
        }

        context.fillStyle = '#ffffff';

        context.fillRect(
          0,
          0,
          canvas.width,
          canvas.height
        );

        context.drawImage(
          image,
          0,
          0,
          canvas.width,
          canvas.height
        );

        setSelectedImage(
          canvas.toDataURL('image/jpeg', 0.72)
        );

        readingRef.current = false;
      };

      image.onerror = () => {
        if (
          mountedRef.current &&
          requestId === imageRequestRef.current
        ) {
          readingRef.current = false;
          setImageError(
            'Không thể đọc định dạng hình ảnh này.'
          );
        }
      };

      image.src = String(reader.result);
    };

    reader.onerror = () => {
      if (
        mountedRef.current &&
        requestId === imageRequestRef.current
      ) {
        readingRef.current = false;
        setImageError('Không thể đọc hình ảnh.');
      }
    };

    reader.readAsDataURL(file);
  }

  // ========================================
  // CAMERA WEBSITE
  // ========================================

  async function openCamera() {
    setShowImageMenu(false);
    setImageError('');

    if (!navigator.mediaDevices?.getUserMedia) {
      setImageError(
        'Camera không được hỗ trợ. Hãy sử dụng localhost hoặc HTTPS.'
      );
      return;
    }

    const requestId = ++cameraRequestRef.current;

    try {
      const stream =
        await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: {
              ideal: 'environment',
            },
          },
          audio: false,
        });

      if (
        !mountedRef.current ||
        requestId !== cameraRequestRef.current
      ) {
        stream.getTracks().forEach(
          (track) => track.stop()
        );
        return;
      }

      streamRef.current?.getTracks().forEach(
        (track) => track.stop()
      );

      streamRef.current = stream;

      setIsCameraOpen(true);
    } catch {
      if (
        mountedRef.current &&
        requestId === cameraRequestRef.current
      ) {
        setImageError(
          'Không thể mở camera. Hãy kiểm tra thiết bị và quyền truy cập.'
        );
      }
    }
  }

  useEffect(() => {
    if (
      isCameraOpen &&
      videoRef.current &&
      streamRef.current
    ) {
      videoRef.current.srcObject =
        streamRef.current;
    }
  }, [isCameraOpen]);

  function closeCamera() {
    cameraRequestRef.current += 1;

    streamRef.current?.getTracks().forEach(
      (track) => track.stop()
    );

    streamRef.current = null;
    setIsCameraOpen(false);
  }

  function capturePhoto() {
    const video = videoRef.current;

    if (!video?.videoWidth) return;

    const canvas =
      document.createElement('canvas');

    const scale = Math.min(
      1,
      1000 / video.videoWidth
    );

    canvas.width = Math.round(
      video.videoWidth * scale
    );

    canvas.height = Math.round(
      video.videoHeight * scale
    );

    const context = canvas.getContext('2d');

    if (!context) return;

    context.drawImage(
      video,
      0,
      0,
      canvas.width,
      canvas.height
    );

    clearImage();

    setSelectedImage(
      canvas.toDataURL('image/jpeg', 0.72)
    );

    closeCamera();
  }

  // ========================================
  // ĐỒNG BỘ CUỘC TRÒ CHUYỆN
  // ========================================

  useEffect(() => {
    if (
      conversation &&
      conversation.id !== conversationRef.current.id
    ) {
      cancelPendingResponse();

      conversationRef.current = conversation;
      setCurrentConversation(conversation);

      setInput('');
      clearImage();
      setImageError('');
      closeCamera();

      initialQuestionRef.current = undefined;
    }
  }, [conversation]);

  // ========================================
  // CÂU HỎI TỪ TRANG CHỦ
  // ========================================

  useEffect(() => {
    if (
      initialQuestion &&
      initialQuestion !== initialQuestionRef.current
    ) {
      initialQuestionRef.current = initialQuestion;

      handleSend(initialQuestion);
    }
  }, [initialQuestion]);

  // ========================================
  // TỰ ĐỘNG CUỘN
  // ========================================

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'end',
    });
  }, [
    currentConversation.messages.length,
    isTyping,
  ]);

  // ========================================
  // DỌN DẸP KHI RỜI MÀN HÌNH
  // ========================================

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;

      cameraRequestRef.current += 1;
      imageRequestRef.current += 1;

      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      busyRef.current = false;

      streamRef.current?.getTracks().forEach(
        (track) => track.stop()
      );

      streamRef.current = null;
    };
  }, []);

  const hasUserMessage =
    currentConversation.messages.some(
      (message) => message.role === 'user'
    );

  // ========================================
  // GIAO DIỆN
  // ========================================

  return (
    <div className="sc-chat">

      {/* HEADER */}

      <header className="sc-chat-header">
        <button
          type="button"
          className="sc-chat-icon-button"
          onClick={onBack}
          disabled={isTyping}
          aria-label="Quay lại"
        >
          <ArrowLeft size={21} />
        </button>

        <div className="sc-chat-header-avatar">
          <Snowflake size={26} />
        </div>

        <div className="sc-chat-header-info">
          <h2>SmartCool AI</h2>

          <p>
            Trợ lý điện lạnh thông minh · Demo
          </p>
        </div>

        <button
          type="button"
          className="sc-chat-new-button"
          onClick={startNewConversation}
          disabled={isTyping}
        >
          <Plus size={18} />
          Cuộc trò chuyện mới
        </button>
      </header>

      {/* NỘI DUNG CHAT */}

      <main className="sc-chat-messages">

        {!hasUserMessage && (
          <section className="sc-chat-welcome">
            <div className="sc-chat-welcome-logo">
              <Sparkles size={36} />
            </div>

            <h1>
              Hôm nay bạn cần hỗ trợ gì?
            </h1>

            <p>
              Khám phá các tiện ích điện lạnh
              cùng SmartCool AI.
            </p>
          </section>
        )}

        {currentConversation.messages.map(
          (message) => (
            <MessageBubble
              key={message.id}
              message={message}
              onAction={onAction}
              disabled={isTyping}
            />
          )
        )}

        {!hasUserMessage && (
          <section className="sc-chat-suggestions">

            {QUICK_SUGGESTIONS.map((item) => {
              const Icon = item.icon;

              return (
                <button
                  type="button"
                  key={item.title}
                  onClick={() =>
                    handleSend(item.question)
                  }
                  disabled={
                    isTyping || !item.question
                  }
                >
                  <span>
                    <Icon size={22} />
                  </span>

                  <div>
                    <strong>{item.title}</strong>

                    <small>
                      {item.description}
                    </small>
                  </div>

                  <ArrowRight size={16} />
                </button>
              );
            })}

          </section>
        )}

        {isTyping && (
          <div className="sc-chat-typing">
            <div className="sc-chat-avatar">
              <Snowflake size={22} />
            </div>

            <div className="sc-chat-typing-bubble">
              <span />
              <span />
              <span />

              <small>
                SmartCool AI đang xử lý...
              </small>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />

      </main>

      {/* KHU VỰC NHẬP TIN NHẮN */}

      <footer className="sc-chat-footer">

        {imageError && (
          <div
            className="sc-chat-error"
            role="alert"
          >
            {imageError}

            <button
              type="button"
              onClick={() => setImageError('')}
              aria-label="Đóng thông báo"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {selectedImage && (
          <div className="sc-chat-image-preview">
            <img
              src={selectedImage}
              alt="Ảnh xem trước"
            />

            <button
              type="button"
              onClick={clearImage}
              aria-label="Xóa ảnh"
            >
              <X size={15} />
            </button>
          </div>
        )}

        <div className="sc-chat-input-box">

          <div className="sc-chat-attachment">

            <button
              type="button"
              className="sc-chat-icon-button"
              disabled={isTyping}
              onClick={() =>
                setShowImageMenu(!showImageMenu)
              }
              aria-label="Đính kèm hình ảnh"
              aria-expanded={showImageMenu}
            >
              <Plus size={25} />
            </button>

            {showImageMenu && (
              <div className="sc-chat-image-menu">
                <button
                  type="button"
                  onClick={() => {
                    setShowImageMenu(false);
                    fileInputRef.current?.click();
                  }}
                >
                  <ImagePlus size={19} />
                  Chọn hình ảnh
                </button>

                <button
                  type="button"
                  onClick={openCamera}
                >
                  <Camera size={19} />
                  Chụp ảnh
                </button>
              </div>
            )}

          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(event) => {
              handleImageFile(
                event.target.files?.[0]
              );

              event.target.value = '';
            }}
          />

          <textarea
            ref={textareaRef}
            value={input}
            rows={1}
            maxLength={4000}
            placeholder="Hỏi SmartCool AI..."
            aria-label="Nhập câu hỏi"
            onChange={(event) =>
              setInput(event.target.value)
            }
            onKeyDown={(event) => {
              if (
                event.key === 'Enter' &&
                !event.shiftKey &&
                !event.nativeEvent.isComposing
              ) {
                event.preventDefault();
                handleSend();
              }
            }}
          />

          <button
            type="button"
            className="sc-chat-send"
            disabled={
              isTyping ||
              (!input.trim() && !selectedImage)
            }
            onClick={() => handleSend()}
            aria-label="Gửi tin nhắn"
          >
            {isTyping ? (
              <LoaderCircle
                size={21}
                className="sc-chat-spin"
              />
            ) : (
              <Send size={21} />
            )}
          </button>

        </div>

        <p className="sc-chat-disclaimer">
          Phản hồi demo · Không thay thế tư vấn
          kỹ thuật chuyên môn.
        </p>

      </footer>

      {/* CAMERA MODAL */}

      {isCameraOpen && (
        <div
          className="sc-chat-camera-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Chụp ảnh thiết bị"
        >
          <div className="sc-chat-camera-modal">
            <div className="sc-chat-camera-heading">
              <h3>Chụp ảnh thiết bị</h3>

              <button
                type="button"
                className="sc-chat-icon-button"
                onClick={closeCamera}
                aria-label="Đóng camera"
              >
                <X size={23} />
              </button>
            </div>

            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
            />

            <button
              type="button"
              className="sc-chat-capture"
              onClick={capturePhoto}
            >
              <Camera size={21} />
              Chụp ảnh
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
