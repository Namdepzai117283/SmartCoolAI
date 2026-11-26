
import { useMemo, useState } from 'react';

import {
  Sparkles,
  Camera,
  Wrench,
  ShoppingCart,
  Scale,
  BookOpen,
  Calculator,
  ClipboardList,
  Search,
  X,
  ArrowRight,
  ChevronRight,
  Snowflake,
  Zap,
  ShieldCheck,
  Refrigerator,
} from 'lucide-react';

import type { FeatureId } from '../types/smartcool';

import './ProfessionalHome.css';

// ==========================================
// PROPS
// ==========================================

interface Props {
  onOpenFeature: (id: FeatureId) => void;
  onAskQuestion: (question: string) => void;
}

// ==========================================
// DANH SÁCH CHỨC NĂNG
// ==========================================

const FEATURES = [
  {
    id: 'chat',
    icon: Sparkles,
    title: 'Trợ lý AI',
    subtitle: 'Giải đáp 24/7',
    color: '#0878E8',
    background: '#E8F3FF',
  },
  {
    id: 'camera',
    icon: Camera,
    title: 'AI Camera',
    subtitle: 'Nhận diện thiết bị',
    color: '#8057D8',
    background: '#F1EBFF',
  },
  {
    id: 'diagnosis',
    icon: Wrench,
    title: 'Chẩn đoán',
    subtitle: 'Kiểm tra sự cố',
    color: '#E66A24',
    background: '#FFF0E5',
  },
  {
    id: 'budget',
    icon: ShoppingCart,
    title: 'Tư vấn mua',
    subtitle: 'Chọn thiết bị tốt',
    color: '#159A77',
    background: '#E5F8F1',
  },
  {
    id: 'compare',
    icon: Scale,
    title: 'So sánh',
    subtitle: 'Đối chiếu thiết bị',
    color: '#C28B16',
    background: '#FFF7DC',
  },
  {
    id: 'library',
    icon: BookOpen,
    title: 'Thư viện',
    subtitle: 'Kiến thức điện lạnh',
    color: '#2A8DA8',
    background: '#E5F6FB',
  },
  {
    id: 'estimate',
    icon: Calculator,
    title: 'Dự toán',
    subtitle: 'Ước tính chi phí',
    color: '#D25475',
    background: '#FFF0F4',
  },
  {
    id: 'guide',
    icon: ClipboardList,
    title: 'Hướng dẫn',
    subtitle: 'Sử dụng an toàn',
    color: '#5268BB',
    background: '#EAF0FF',
  },
] as const;

// ==========================================
// CÂU HỎI THƯỜNG GẶP
// ==========================================

const COMMON_QUESTIONS = [
  {
    icon: Snowflake,
    title: 'Máy lạnh không mát',
    subtitle: 'Nguyên nhân và cách kiểm tra',
    question: 'Máy lạnh không mát phải làm sao?',
  },
  {
    icon: Refrigerator,
    title: 'Tủ lạnh không đông đá',
    subtitle: 'Kiểm tra các lỗi thường gặp',
    question: 'Tủ lạnh không đông đá',
  },
  {
    icon: Zap,
    title: 'Tiết kiệm điện',
    subtitle: 'Mẹo sử dụng điều hòa hiệu quả',
    question: 'Cách tiết kiệm điện khi dùng máy lạnh',
  },
];

// ==========================================
// CHUẨN HÓA TÌM KIẾM
// ==========================================

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .trim();
}

// ==========================================
// TRANG CHỦ
// ==========================================

export default function ProfessionalHome({
  onOpenFeature,
  onAskQuestion,
}: Props) {
  const [search, setSearch] = useState('');

  const filteredFeatures = useMemo(() => {
    const keyword = normalizeText(search);

    if (!keyword) {
      return FEATURES;
    }

    return FEATURES.filter((feature) =>
      normalizeText(
        `${feature.title} ${feature.subtitle}`
      ).includes(keyword)
    );
  }, [search]);

  return (
    <div className="sc-home">

      {/* LỜI CHÀO */}

      <section className="sc-home-welcome">
        <div>
          <div className="sc-home-greeting">
            Xin chào! 👋
          </div>

          <h1>
            Hôm nay bạn cần hỗ trợ gì?
          </h1>

          <p>
            Chuyên gia điện lạnh trong tầm tay
          </p>
        </div>

        <div className="sc-home-welcome-icon">
          <Snowflake size={34} />
        </div>
      </section>

      {/* TÌM KIẾM */}

      <div className="sc-home-search">
        <Search size={21} />

        <input
          type="text"
          aria-label="Tìm chức năng điện lạnh"
          placeholder="Tìm chức năng điện lạnh..."
          value={search}
          onChange={(event) =>
            setSearch(event.target.value)
          }
        />

        {search && (
          <button
            type="button"
            aria-label="Xóa tìm kiếm"
            onClick={() => setSearch('')}
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* BANNER AI */}

      <section className="sc-home-hero">

        <div className="sc-home-hero-content">

          <div className="sc-home-ai-status">
            <span />
            TRỢ LÝ ĐIỆN LẠNH
          </div>

          <h2>
            Có SmartCool AI,
            <br />
            mọi vấn đề dễ dàng hơn.
          </h2>

          <p>
            Hỏi đáp sự cố, tư vấn thiết bị và khám phá
            kiến thức điện lạnh ngay trên SmartCool AI.
          </p>

          <button
            type="button"
            className="sc-home-ai-button"
            onClick={() => onOpenFeature('chat')}
          >
            <Sparkles size={19} />

            Trò chuyện với AI

            <ArrowRight size={19} />
          </button>

          <div className="sc-home-demo">
            Phiên bản trải nghiệm
          </div>
        </div>

        <div
          className="sc-home-hero-decoration"
          aria-hidden="true"
        >
          <div className="sc-home-decoration-ring" />
          <Snowflake size={170} strokeWidth={1.3} />
        </div>

      </section>

      {/* CÔNG CỤ THÔNG MINH */}

      <section className="sc-home-section">

        <div className="sc-home-section-heading">
          <div>
            <h2>Công cụ thông minh</h2>

            <p>
              Khám phá các tiện ích dành cho bạn
            </p>
          </div>

          <span className="sc-home-count">
            {filteredFeatures.length} công cụ
          </span>
        </div>

        <div className="sc-home-feature-grid">

          {filteredFeatures.map((feature) => {
            const Icon = feature.icon;

            return (
              <button
                type="button"
                key={feature.id}
                className="sc-home-feature-card"
                onClick={() =>
                  onOpenFeature(feature.id)
                }
              >
                <div className="sc-home-feature-top">

                  <div
                    className="sc-home-feature-icon"
                    style={{
                      color: feature.color,
                      background: feature.background,
                    }}
                  >
                    <Icon size={25} />
                  </div>

                  <ArrowRight
                    size={18}
                    className="sc-home-feature-arrow"
                  />

                </div>

                <h3>{feature.title}</h3>

                <p>{feature.subtitle}</p>

              </button>
            );
          })}

        </div>

        {filteredFeatures.length === 0 && (
          <div className="sc-home-empty">
            <Search size={35} />

            <h3>Không tìm thấy chức năng</h3>

            <p>
              Thử tìm với từ khóa khác nhé.
            </p>
          </div>
        )}

      </section>

      {/* VẤN ĐỀ THƯỜNG GẶP */}

      <section className="sc-home-section">

        <div className="sc-home-section-heading">
          <div>
            <h2>Vấn đề thường gặp</h2>

            <p>
              Chọn để nhận tư vấn nhanh
            </p>
          </div>
        </div>

        <div className="sc-home-question-grid">

          {COMMON_QUESTIONS.map((item) => {
            const Icon = item.icon;

            return (
              <button
                type="button"
                key={item.title}
                className="sc-home-question-card"
                onClick={() =>
                  onAskQuestion(item.question)
                }
              >
                <div className="sc-home-question-icon">
                  <Icon size={23} />
                </div>

                <div className="sc-home-question-info">
                  <h3>{item.title}</h3>
                  <p>{item.subtitle}</p>
                </div>

                <ChevronRight
                  size={20}
                  className="sc-home-question-arrow"
                />
              </button>
            );
          })}

        </div>

      </section>

      {/* CẢNH BÁO AN TOÀN */}

      <section className="sc-home-safety">

        <div className="sc-home-safety-icon">
          <ShieldCheck size={27} />
        </div>

        <div>
          <h3>An toàn là ưu tiên hàng đầu</h3>

          <p>
            Với sự cố điện, cháy nổ hoặc rò rỉ môi chất
            lạnh, hãy liên hệ kỹ thuật viên có chuyên môn.
          </p>
        </div>

      </section>

      <footer className="sc-home-footer">
        SmartCool AI · Giải pháp điện lạnh thông minh
      </footer>

    </div>
  );
}
