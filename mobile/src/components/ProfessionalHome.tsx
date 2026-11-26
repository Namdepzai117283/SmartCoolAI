
import React, { useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

type FeatureId =
  | 'chat'
  | 'camera'
  | 'budget'
  | 'compare'
  | 'library'
  | 'diagnosis'
  | 'estimate'
  | 'guide';

type Feature = {
  id: FeatureId;
  icon: string;
  title: string;
  subtitle: string;
  color: string;
  background: string;
};

type Props = {
  onOpenFeature: (id: FeatureId) => void;
  onAskQuestion: (question: string) => void;
};

const BLUE = '#0878E8';

const features: Feature[] = [
  {
    id: 'chat',
    icon: '✦',
    title: 'Trợ lý AI',
    subtitle: 'Giải đáp 24/7',
    color: '#0878E8',
    background: '#E8F3FF',
  },
  {
    id: 'camera',
    icon: '📷',
    title: 'AI Camera',
    subtitle: 'Nhận diện thiết bị',
    color: '#8057D8',
    background: '#F1EBFF',
  },
  {
    id: 'diagnosis',
    icon: '🔧',
    title: 'Chẩn đoán',
    subtitle: 'Kiểm tra sự cố',
    color: '#E66A24',
    background: '#FFF0E5',
  },
  {
    id: 'budget',
    icon: '🛒',
    title: 'Tư vấn mua',
    subtitle: 'Chọn thiết bị tốt',
    color: '#159A77',
    background: '#E5F8F1',
  },
  {
    id: 'compare',
    icon: '⚖️',
    title: 'So sánh',
    subtitle: 'Đối chiếu thiết bị',
    color: '#C28B16',
    background: '#FFF7DC',
  },
  {
    id: 'library',
    icon: '📚',
    title: 'Thư viện',
    subtitle: 'Kiến thức điện lạnh',
    color: '#2A8DA8',
    background: '#E5F6FB',
  },
  {
    id: 'estimate',
    icon: '🧮',
    title: 'Dự toán',
    subtitle: 'Ước tính chi phí',
    color: '#D25475',
    background: '#FFF0F4',
  },
  {
    id: 'guide',
    icon: '📋',
    title: 'Hướng dẫn',
    subtitle: 'Sử dụng an toàn',
    color: '#5268BB',
    background: '#EAF0FF',
  },
];

const commonQuestions = [
  {
    icon: '❄️',
    title: 'Máy lạnh không mát',
    subtitle: 'Nguyên nhân và cách kiểm tra',
    question: 'Máy lạnh không mát phải làm sao?',
  },
  {
    icon: '🧊',
    title: 'Tủ lạnh không đông đá',
    subtitle: 'Kiểm tra các lỗi thường gặp',
    question: 'Tủ lạnh không đông đá',
  },
  {
    icon: '⚡',
    title: 'Tiết kiệm điện',
    subtitle: 'Mẹo sử dụng điều hòa hiệu quả',
    question: 'Cách tiết kiệm điện khi dùng máy lạnh',
  },
];

export default function ProfessionalHome({
  onOpenFeature,
  onAskQuestion,
}: Props) {
  const [search, setSearch] = useState('');

  const filteredFeatures = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return features;

    return features.filter((feature) =>
      `${feature.title} ${feature.subtitle}`
        .toLowerCase()
        .includes(keyword)
    );
  }, [search]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.welcomeRow}>
        <View style={styles.welcomeLeft}>
          <Text style={styles.greeting}>
            Xin chào 👋
          </Text>
          <Text style={styles.welcomeTitle}>
            Hôm nay bạn cần hỗ trợ gì?
          </Text>
          <Text style={styles.welcomeSubtitle}>
            Chuyên gia điện lạnh trong tầm tay
          </Text>
        </View>
        <View style={styles.welcomeSymbol}>
          <Text style={styles.welcomeSymbolText}>❄️</Text>
        </View>
      </View>

      <View style={styles.searchBox}>
        <Text style={styles.searchIcon}>⌕</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm chức năng điện lạnh..."
          placeholderTextColor="#94A3B8"
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearch('')}
            style={styles.clearButton}
          >
            <Text style={styles.clearText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.aiHero}>
        <View style={styles.aiHeroTop}>
          <View style={styles.aiStatus}>
            <View style={styles.statusDot} />
            <Text style={styles.aiStatusText}>
              TRỢ LÝ ĐIỆN LẠNH
            </Text>
          </View>
          <Text style={styles.aiDecoration}>✳</Text>
        </View>

        <Text style={styles.aiHeroTitle}>
          Có SmartCool AI,{'\n'}mọi vấn đề dễ dàng hơn.
        </Text>

        <Text style={styles.aiHeroDescription}>
          Hỏi đáp sự cố, tư vấn thiết bị và khám phá
          kiến thức điện lạnh ngay trên điện thoại.
        </Text>

        <TouchableOpacity
          style={styles.aiButton}
          onPress={() => onOpenFeature('chat')}
          activeOpacity={0.85}
        >
          <Text style={styles.aiButtonText}>
            ✦  Trò chuyện với AI
          </Text>
          <Text style={styles.aiButtonArrow}>→</Text>
        </TouchableOpacity>

        <Text style={styles.demoLabel}>
          Phiên bản trải nghiệm
        </Text>
      </View>

      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>
            Công cụ thông minh
          </Text>
          <Text style={styles.sectionSubtitle}>
            Khám phá các tiện ích dành cho bạn
          </Text>
        </View>
        <View style={styles.sectionCount}>
          <Text style={styles.sectionCountText}>
            {filteredFeatures.length} công cụ
          </Text>
        </View>
      </View>

      <View style={styles.featureGrid}>
        {filteredFeatures.map((feature) => (
          <TouchableOpacity
            key={feature.id}
            style={styles.featureCard}
            onPress={() => onOpenFeature(feature.id)}
            activeOpacity={0.75}
          >
            <View
              style={[
                styles.featureIconBox,
                { backgroundColor: feature.background },
              ]}
            >
              <Text
                style={[
                  styles.featureIcon,
                  { color: feature.color },
                ]}
              >
                {feature.icon}
              </Text>
            </View>

            <Text style={styles.featureTitle}>
              {feature.title}
            </Text>
            <Text style={styles.featureSubtitle}>
              {feature.subtitle}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {filteredFeatures.length === 0 && (
        <View style={styles.noResults}>
          <Text style={styles.noResultsIcon}>🔎</Text>
          <Text style={styles.noResultsTitle}>
            Không tìm thấy chức năng
          </Text>
          <Text style={styles.noResultsSubtitle}>
            Thử tìm với từ khóa khác nhé.
          </Text>
        </View>
      )}

      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>
            Vấn đề thường gặp
          </Text>
          <Text style={styles.sectionSubtitle}>
            Chọn để nhận tư vấn nhanh
          </Text>
        </View>
      </View>

      {commonQuestions.map((item) => (
        <TouchableOpacity
          key={item.title}
          style={styles.questionCard}
          onPress={() => onAskQuestion(item.question)}
          activeOpacity={0.8}
        >
          <View style={styles.questionIconBox}>
            <Text style={styles.questionIcon}>
              {item.icon}
            </Text>
          </View>

          <View style={styles.questionContent}>
            <Text style={styles.questionTitle}>
              {item.title}
            </Text>
            <Text style={styles.questionSubtitle}>
              {item.subtitle}
            </Text>
          </View>

          <Text style={styles.questionArrow}>›</Text>
        </TouchableOpacity>
      ))}

      <View style={styles.safetyCard}>
        <Text style={styles.safetyIcon}>🛡️</Text>
        <View style={styles.safetyContent}>
          <Text style={styles.safetyTitle}>
            An toàn là ưu tiên hàng đầu
          </Text>
          <Text style={styles.safetyDescription}>
            Với sự cố điện, cháy nổ hoặc rò rỉ môi chất
            lạnh, hãy liên hệ kỹ thuật viên có chuyên môn.
          </Text>
        </View>
      </View>

      <Text style={styles.footer}>
        SmartCool AI · Giải pháp điện lạnh thông minh
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F8FD',
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 24,
    paddingBottom: 35,
  },
  welcomeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 22,
  },
  welcomeLeft: {
    flex: 1,
    paddingRight: 10,
  },
  greeting: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 7,
  },
  welcomeTitle: {
    fontSize: 23,
    fontWeight: '800',
    color: '#142D4C',
    lineHeight: 30,
  },
  welcomeSubtitle: {
    marginTop: 7,
    color: '#7C8CA2',
    fontSize: 12,
  },
  welcomeSymbol: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: '#E5F1FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomeSymbolText: {
    fontSize: 30,
  },
  searchBox: {
    height: 54,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 23,
    borderWidth: 1,
    borderColor: '#E7EDF5',
  },
  searchIcon: {
    fontSize: 27,
    color: '#879BB3',
    marginRight: 11,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    color: '#173553',
  },
  clearButton: {
    padding: 7,
  },
  clearText: {
    color: '#94A3B8',
    fontSize: 13,
  },
  aiHero: {
    backgroundColor: '#0878E8',
    borderRadius: 24,
    padding: 23,
    marginBottom: 29,
    overflow: 'hidden',
  },
  aiHeroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  aiStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#A8FFD4',
    marginRight: 7,
  },
  aiStatusText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.7,
  },
  aiDecoration: {
    fontSize: 45,
    color: '#8CCBFF',
  },
  aiHeroTitle: {
    color: '#FFFFFF',
    fontSize: 23,
    fontWeight: '800',
    lineHeight: 32,
    marginTop: 8,
  },
  aiHeroDescription: {
    fontSize: 13,
    color: '#D8EBFF',
    lineHeight: 21,
    marginTop: 12,
    marginBottom: 20,
  },
  aiButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 13,
    paddingHorizontal: 16,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  aiButtonText: {
    color: BLUE,
    fontSize: 14,
    fontWeight: '800',
  },
  aiButtonArrow: {
    color: BLUE,
    fontSize: 21,
    fontWeight: '700',
  },
  demoLabel: {
    color: '#BBDFFF',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 17,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#142D4C',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#8796AA',
    marginTop: 5,
  },
  sectionCount: {
    backgroundColor: '#E8F3FF',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  sectionCountText: {
    color: BLUE,
    fontSize: 10,
    fontWeight: '700',
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  featureCard: {
    width: '48%',
    minHeight: 144,
    backgroundColor: '#FFFFFF',
    borderRadius: 19,
    borderWidth: 1,
    borderColor: '#E9EEF6',
    padding: 16,
    marginBottom: 13,
  },
  featureIconBox: {
    width: 47,
    height: 47,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 13,
  },
  featureIcon: {
    fontSize: 24,
    fontWeight: '700',
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#193451',
  },
  featureSubtitle: {
    fontSize: 11,
    color: '#8B9AAF',
    marginTop: 6,
  },
  noResults: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  noResultsIcon: {
    fontSize: 35,
  },
  noResultsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#334155',
    marginTop: 10,
  },
  noResultsSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 5,
  },
  questionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 11,
    borderWidth: 1,
    borderColor: '#E9EEF6',
  },
  questionIconBox: {
    width: 45,
    height: 45,
    borderRadius: 13,
    backgroundColor: '#F0F6FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  questionIcon: {
    fontSize: 23,
  },
  questionContent: {
    flex: 1,
    marginLeft: 13,
  },
  questionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#203951',
  },
  questionSubtitle: {
    fontSize: 11,
    color: '#8B9AAF',
    marginTop: 5,
  },
  questionArrow: {
    color: '#9FB0C5',
    fontSize: 27,
    paddingHorizontal: 5,
  },
  safetyCard: {
    backgroundColor: '#EAF4FF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    marginTop: 13,
  },
  safetyIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  safetyContent: {
    flex: 1,
  },
  safetyTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#185C9A',
  },
  safetyDescription: {
    color: '#557895',
    fontSize: 11,
    lineHeight: 18,
    marginTop: 6,
  },
  footer: {
    textAlign: 'center',
    fontSize: 11,
    color: '#A3B0C0',
    marginTop: 26,
  },
});
