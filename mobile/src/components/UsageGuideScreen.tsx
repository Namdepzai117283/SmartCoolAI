
import React, { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Props = {
  onBack: () => void;
};

type Category =
  | 'all'
  | 'aircon'
  | 'fridge'
  | 'freezer'
  | 'safety';

type Guide = {
  id: string;
  category: Category;
  icon: string;
  title: string;
  description: string;
  duration: string;
  steps: string[];
  warning: string;
};

type Progress = Record<string, number[]>;

const BLUE = '#0878E8';
const STORAGE_KEY = 'smartcool_guide_progress_v1';

const CATEGORIES: {
  id: Category;
  label: string;
}[] = [
  { id: 'all', label: 'Tất cả' },
  { id: 'aircon', label: 'Máy lạnh' },
  { id: 'fridge', label: 'Tủ lạnh' },
  { id: 'freezer', label: 'Tủ đông' },
  { id: 'safety', label: 'An toàn' },
];

const GUIDES: Guide[] = [
  {
    id: 'aircon-01',
    category: 'aircon',
    icon: '❄️',
    title: 'Sử dụng máy lạnh đúng cách',
    description:
      'Các bước sử dụng máy lạnh hiệu quả và tiết kiệm điện.',
    duration: '5 phút',
    steps: [
      'Kiểm tra khu vực xung quanh máy lạnh.',
      'Đóng cửa phòng để hạn chế thất thoát hơi lạnh.',
      'Nhấn nút ON/OFF trên remote.',
      'Chọn chế độ COOL để làm lạnh.',
      'Cài đặt nhiệt độ phù hợp, tham khảo 26–28°C.',
      'Điều chỉnh tốc độ quạt theo nhu cầu.',
      'Tắt máy khi không còn sử dụng.',
    ],
    warning:
      'Không sử dụng máy nếu có mùi khét, khói hoặc dấu hiệu rò điện.',
  },
  {
    id: 'aircon-02',
    category: 'aircon',
    icon: '🎛️',
    title: 'Sử dụng remote máy lạnh',
    description:
      'Tìm hiểu các nút bấm và chế độ phổ biến trên remote.',
    duration: '5 phút',
    steps: [
      'ON/OFF: Bật hoặc tắt máy lạnh.',
      'MODE: Chuyển đổi chế độ hoạt động.',
      'COOL: Chế độ làm lạnh.',
      'DRY: Chế độ giảm độ ẩm.',
      'FAN: Chế độ quạt gió.',
      'AUTO: Chế độ hoạt động tự động.',
      'TEMP: Điều chỉnh nhiệt độ.',
      'SWING: Điều chỉnh hướng gió.',
      'TIMER: Hẹn giờ bật hoặc tắt máy.',
      'SLEEP: Chế độ hỗ trợ khi ngủ, nếu có.',
    ],
    warning:
      'Tên nút và chức năng có thể khác nhau tùy hãng và model.',
  },
  {
    id: 'aircon-03',
    category: 'aircon',
    icon: '🧽',
    title: 'Vệ sinh lưới lọc máy lạnh',
    description:
      'Hướng dẫn vệ sinh bộ lọc bụi có thể tháo rời.',
    duration: '15–30 phút',
    steps: [
      'Tắt máy và ngắt nguồn điện an toàn.',
      'Đọc hướng dẫn vệ sinh của nhà sản xuất.',
      'Mở nắp ngoài theo hướng dẫn của thiết bị.',
      'Tháo lưới lọc nếu nhà sản xuất cho phép.',
      'Loại bỏ bụi bằng phương pháp được khuyến nghị.',
      'Rửa lưới lọc nếu đây là loại có thể rửa.',
      'Để lưới lọc khô hoàn toàn trong bóng râm.',
      'Lắp lại đúng vị trí và đóng nắp máy.',
      'Khôi phục nguồn điện và kiểm tra hoạt động.',
    ],
    warning:
      'Không xịt nước vào bo mạch, dây điện hoặc tự tháo dàn lạnh.',
  },
  {
    id: 'aircon-04',
    category: 'aircon',
    icon: '⚡',
    title: 'Tiết kiệm điện khi dùng máy lạnh',
    description:
      'Giảm điện năng tiêu thụ bằng thói quen sử dụng hợp lý.',
    duration: '5 phút',
    steps: [
      'Chọn nhiệt độ phù hợp với nhu cầu.',
      'Đóng kín cửa khi máy đang làm lạnh.',
      'Sử dụng rèm để giảm ánh nắng trực tiếp.',
      'Kết hợp quạt để lưu thông không khí.',
      'Sử dụng chức năng hẹn giờ khi cần.',
      'Vệ sinh lưới lọc theo khuyến nghị.',
      'Bảo dưỡng định kỳ bởi kỹ thuật viên.',
    ],
    warning:
      'Mức tiết kiệm điện thực tế phụ thuộc thiết bị và điều kiện sử dụng.',
  },
  {
    id: 'fridge-01',
    category: 'fridge',
    icon: '🧊',
    title: 'Sử dụng tủ lạnh đúng cách',
    description:
      'Bảo quản thực phẩm và duy trì hiệu quả làm lạnh.',
    duration: '5 phút',
    steps: [
      'Đặt tủ lạnh tại vị trí bằng phẳng, thông thoáng.',
      'Đảm bảo khoảng cách thông gió theo hướng dẫn.',
      'Cài đặt ngăn mát ở khoảng 1–4°C.',
      'Cài đặt ngăn đông khoảng -18°C hoặc thấp hơn.',
      'Sắp xếp thực phẩm không che kín cửa gió.',
      'Bảo quản thực phẩm trong hộp phù hợp.',
      'Hạn chế mở cửa tủ quá lâu.',
      'Kiểm tra cửa tủ đã đóng kín.',
    ],
    warning:
      'Không đặt thiết bị gần nguồn nhiệt hoặc sử dụng dây điện bị hư hỏng.',
  },
  {
    id: 'fridge-02',
    category: 'fridge',
    icon: '🧼',
    title: 'Vệ sinh tủ lạnh',
    description:
      'Quy trình làm sạch bên trong tủ lạnh an toàn.',
    duration: '30–45 phút',
    steps: [
      'Ngắt nguồn điện an toàn.',
      'Lấy thực phẩm ra và giữ lạnh phù hợp.',
      'Tháo các khay có thể tháo rời.',
      'Vệ sinh khay bằng chất làm sạch phù hợp.',
      'Lau sạch các bề mặt bên trong tủ.',
      'Vệ sinh gioăng cao su cửa tủ.',
      'Lau khô toàn bộ khu vực đã vệ sinh.',
      'Lắp lại các khay đúng vị trí.',
      'Khôi phục nguồn điện.',
      'Đưa thực phẩm trở lại khi tủ đủ lạnh.',
    ],
    warning:
      'Không sử dụng vật sắc nhọn để cạy đá hoặc hóa chất dễ cháy.',
  },
  {
    id: 'fridge-03',
    category: 'fridge',
    icon: '🌡️',
    title: 'Kiểm tra nhiệt độ tủ lạnh',
    description:
      'Kiểm tra khả năng bảo quản thực phẩm của thiết bị.',
    duration: '5 phút',
    steps: [
      'Kiểm tra mức nhiệt độ đang cài đặt.',
      'Sử dụng nhiệt kế chuyên dụng cho tủ lạnh.',
      'Đặt nhiệt kế tại vị trí phù hợp.',
      'Chờ đủ thời gian theo hướng dẫn nhiệt kế.',
      'Đọc và ghi nhận nhiệt độ.',
      'Điều chỉnh nhiệt độ nếu cần.',
      'Liên hệ kỹ thuật viên nếu tủ không đạt nhiệt độ.',
    ],
    warning:
      'Không sử dụng thực phẩm dễ hỏng nếu không bảo đảm điều kiện bảo quản an toàn.',
  },
  {
    id: 'freezer-01',
    category: 'freezer',
    icon: '🥶',
    title: 'Sử dụng tủ đông hiệu quả',
    description:
      'Bảo quản thực phẩm đông lạnh đúng cách.',
    duration: '5 phút',
    steps: [
      'Đặt tủ tại nơi thông thoáng.',
      'Kiểm tra nguồn điện phù hợp.',
      'Cài đặt nhiệt độ khoảng -18°C hoặc thấp hơn.',
      'Đóng gói thực phẩm trước khi bảo quản.',
      'Ghi ngày bảo quản trên bao bì.',
      'Sắp xếp thực phẩm theo từng nhóm.',
      'Hạn chế mở nắp tủ quá lâu.',
      'Kiểm tra nhiệt độ định kỳ.',
    ],
    warning:
      'Không tự ý thay đổi hệ thống điện hoặc hệ thống môi chất lạnh.',
  },
  {
    id: 'freezer-02',
    category: 'freezer',
    icon: '💧',
    title: 'Xả tuyết tủ đông',
    description:
      'Hướng dẫn dành cho tủ đông cần xả tuyết thủ công.',
    duration: 'Tùy thiết bị',
    steps: [
      'Đọc hướng dẫn xả tuyết của nhà sản xuất.',
      'Chuyển thực phẩm sang nơi bảo quản lạnh phù hợp.',
      'Tắt thiết bị và ngắt nguồn điện an toàn.',
      'Mở nắp tủ và để tuyết tan tự nhiên.',
      'Thu gom nước theo hướng dẫn thiết bị.',
      'Lau sạch và làm khô bên trong tủ.',
      'Khôi phục nguồn điện.',
      'Chờ tủ đạt nhiệt độ bảo quản trước khi đưa thực phẩm vào.',
    ],
    warning:
      'Không dùng dao, vật sắc nhọn, máy sấy hoặc nguồn nhiệt để làm tan đá.',
  },
  {
    id: 'safety-01',
    category: 'safety',
    icon: '⚠️',
    title: 'An toàn điện lạnh',
    description:
      'Những nguyên tắc cần nhớ khi sử dụng thiết bị.',
    duration: '5 phút',
    steps: [
      'Quan sát tình trạng dây điện và phích cắm.',
      'Không chạm thiết bị điện bằng tay ướt.',
      'Không sử dụng ổ cắm quá tải.',
      'Ngắt nguồn an toàn trước khi vệ sinh.',
      'Không tự tháo bo mạch hoặc máy nén.',
      'Không tự nạp hoặc xả môi chất lạnh.',
      'Liên hệ kỹ thuật viên khi phát hiện bất thường.',
    ],
    warning:
      'Nếu có nguy cơ điện giật hoặc cháy, tránh tiếp xúc thiết bị và gọi hỗ trợ khẩn cấp khi cần.',
  },
  {
    id: 'safety-02',
    category: 'safety',
    icon: '🛠️',
    title: 'Kiểm tra thiết bị định kỳ',
    description:
      'Danh sách kiểm tra cơ bản dành cho người sử dụng.',
    duration: '10 phút',
    steps: [
      'Quan sát bên ngoài thiết bị.',
      'Kiểm tra tiếng ồn bất thường.',
      'Kiểm tra khả năng làm lạnh.',
      'Quan sát dấu hiệu rò nước.',
      'Kiểm tra tình trạng cửa gió hoặc gioăng cửa.',
      'Ghi nhận các triệu chứng bất thường.',
      'Đặt lịch bảo dưỡng nếu cần.',
    ],
    warning:
      'Chỉ kiểm tra bên ngoài, không tự tháo các bộ phận kỹ thuật.',
  },
  {
    id: 'safety-03',
    category: 'safety',
    icon: '🚨',
    title: 'Xử lý khi thiết bị có mùi khét',
    description:
      'Nhận biết tình huống nguy hiểm và xử lý an toàn.',
    duration: 'Đọc ngay',
    steps: [
      'Ngừng sử dụng thiết bị.',
      'Giữ khoảng cách với thiết bị có dấu hiệu nguy hiểm.',
      'Ngắt nguồn điện từ vị trí an toàn nếu có thể.',
      'Không chạm vào thiết bị hoặc dây điện hư hỏng.',
      'Nếu có cháy hoặc khói nguy hiểm, rời khỏi khu vực và gọi 114.',
      'Liên hệ kỹ thuật viên có chuyên môn.',
      'Không bật lại thiết bị trước khi được xác nhận an toàn.',
    ],
    warning:
      'Không dùng nước để dập cháy thiết bị đang mang điện.',
  },
];

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd');
}

export default function UsageGuideScreen({
  onBack,
}: Props) {
  const [category, setCategory] =
    useState<Category>('all');

  const [search, setSearch] = useState('');

  const [selectedGuide, setSelectedGuide] =
    useState<Guide | null>(null);

  const [progress, setProgress] =
    useState<Progress>({});

  const [ready, setReady] = useState(false);

  const [completedOnly, setCompletedOnly] =
    useState(false);

  useEffect(() => {
    async function loadProgress() {
      try {
        const saved = await AsyncStorage.getItem(
          STORAGE_KEY
        );

        if (saved) {
          const parsed = JSON.parse(saved);

          if (
            parsed &&
            typeof parsed === 'object' &&
            !Array.isArray(parsed)
          ) {
            setProgress(parsed as Progress);
          }
        }
      } catch (error) {
        console.warn(
          'Lỗi tải tiến độ hướng dẫn:',
          error
        );
      } finally {
        setReady(true);
      }
    }

    loadProgress();
  }, []);

  useEffect(() => {
    if (!ready) return;

    AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(progress)
    ).catch((error) => {
      console.warn('Lỗi lưu tiến độ:', error);
    });
  }, [progress, ready]);

  function getCompletedSteps(id: string): number[] {
    return Array.isArray(progress[id])
      ? progress[id]
      : [];
  }

  function isCompleted(guide: Guide): boolean {
    return (
      getCompletedSteps(guide.id).length ===
      guide.steps.length
    );
  }

  function toggleStep(
    guideId: string,
    stepIndex: number
  ) {
    if (!ready) return;

    setProgress((previous) => {
      const current = Array.isArray(previous[guideId])
        ? previous[guideId]
        : [];

      const updated = current.includes(stepIndex)
        ? current.filter(
            (index) => index !== stepIndex
          )
        : [...current, stepIndex];

      return {
        ...previous,
        [guideId]: updated,
      };
    });
  }

  function resetGuide(id: string) {
    Alert.alert(
      'Đặt lại tiến độ',
      'Bạn có muốn thực hiện lại hướng dẫn này?',
      [
        {
          text: 'Hủy',
          style: 'cancel',
        },
        {
          text: 'Đặt lại',
          style: 'destructive',
          onPress: () =>
            setProgress((previous) => ({
              ...previous,
              [id]: [],
            })),
        },
      ]
    );
  }

  const completedCount = GUIDES.filter(
    isCompleted
  ).length;

  const filteredGuides = GUIDES.filter((guide) => {
    const matchesCategory =
      category === 'all' ||
      guide.category === category;

    const keyword = normalize(search.trim());

    const content = normalize(
      guide.title +
        ' ' +
        guide.description +
        ' ' +
        guide.steps.join(' ')
    );

    const matchesSearch =
      !keyword || content.includes(keyword);

    const matchesCompleted =
      !completedOnly || isCompleted(guide);

    return (
      matchesCategory &&
      matchesSearch &&
      matchesCompleted
    );
  });

  if (selectedGuide) {
    const completed = getCompletedSteps(
      selectedGuide.id
    );

    const percentage = Math.round(
      (completed.length /
        selectedGuide.steps.length) *
        100
    );

    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setSelectedGuide(null)}
        >
          <Text style={styles.backText}>
            ← Danh sách hướng dẫn
          </Text>
        </TouchableOpacity>

        <View style={styles.hero}>
          <Text style={styles.heroIcon}>
            {selectedGuide.icon}
          </Text>

          <Text style={styles.heroTitle}>
            {selectedGuide.title}
          </Text>

          <Text style={styles.heroDescription}>
            {selectedGuide.description}
          </Text>

          <Text style={styles.duration}>
            ◷ {selectedGuide.duration}
          </Text>
        </View>

        <View style={styles.progressCard}>
          <View style={styles.row}>
            <Text style={styles.sectionTitle}>
              Tiến độ thực hiện
            </Text>

            <Text style={styles.percentage}>
              {percentage}%
            </Text>
          </View>

          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${percentage}%`,
                },
              ]}
            />
          </View>

          <Text style={styles.progressDescription}>
            Đã đánh dấu {completed.length}/
            {selectedGuide.steps.length} bước
          </Text>
        </View>

        <View style={styles.warningCard}>
          <Text style={styles.warningTitle}>
            ⚠️ Lưu ý an toàn
          </Text>

          <Text style={styles.warningText}>
            {selectedGuide.warning}
          </Text>
        </View>

        <Text style={styles.sectionHeading}>
          Các bước hướng dẫn
        </Text>

        <Text style={styles.helperText}>
          Đánh dấu những bước bạn đã thực hiện.
        </Text>

        {selectedGuide.steps.map((step, index) => {
          const checked = completed.includes(index);

          return (
            <TouchableOpacity
              key={index}
              disabled={!ready}
              style={[
                styles.stepCard,
                checked && styles.stepCardChecked,
              ]}
              onPress={() =>
                toggleStep(selectedGuide.id, index)
              }
            >
              <View
                style={[
                  styles.stepNumber,
                  checked && styles.stepNumberChecked,
                ]}
              >
                <Text
                  style={[
                    styles.stepNumberText,
                    checked &&
                      styles.stepNumberTextChecked,
                  ]}
                >
                  {checked ? '✓' : index + 1}
                </Text>
              </View>

              <View style={styles.flex}>
                <Text style={styles.stepLabel}>
                  BƯỚC {index + 1}
                </Text>

                <Text
                  style={[
                    styles.stepText,
                    checked && styles.stepTextChecked,
                  ]}
                >
                  {step}
                </Text>
              </View>

              <View
                style={[
                  styles.checkbox,
                  checked && styles.checkboxChecked,
                ]}
              >
                {checked && (
                  <Text style={styles.checkmark}>
                    ✓
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          );
        })}

        {percentage === 100 && (
          <View style={styles.successCard}>
            <Text style={styles.successIcon}>
              ✓
            </Text>

            <Text style={styles.successTitle}>
              Đã hoàn thành hướng dẫn!
            </Text>

            <Text style={styles.successDescription}>
              Bạn đã đánh dấu tất cả các bước.
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.resetButton}
          disabled={!ready}
          onPress={() =>
            resetGuide(selectedGuide.id)
          }
        >
          <Text style={styles.resetText}>
            ↻ Đặt lại tiến độ
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => setSelectedGuide(null)}
        >
          <Text style={styles.primaryButtonText}>
            Quay lại danh sách
          </Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <TouchableOpacity
        style={styles.backButton}
        onPress={onBack}
      >
        <Text style={styles.backText}>
          ← Quay lại trang chủ
        </Text>
      </TouchableOpacity>

      <View style={styles.hero}>
        <Text style={styles.heroIcon}>
          📋
        </Text>

        <Text style={styles.heroTitle}>
          Hướng dẫn điện lạnh
        </Text>

        <Text style={styles.heroDescription}>
          Sử dụng, vệ sinh và bảo dưỡng thiết bị
          đúng cách với hướng dẫn từng bước.
        </Text>

        <View style={styles.heroStats}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>
              {GUIDES.length}
            </Text>

            <Text style={styles.statLabel}>
              Hướng dẫn
            </Text>
          </View>

          <View style={styles.statBox}>
            <Text style={styles.statNumber}>
              {completedCount}
            </Text>

            <Text style={styles.statLabel}>
              Đã hoàn thành
            </Text>
          </View>

          <View style={styles.statBox}>
            <Text style={styles.statNumber}>
              {Math.round(
                (completedCount / GUIDES.length) *
                  100
              )}%
            </Text>

            <Text style={styles.statLabel}>
              Tiến độ
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>
          🔍
        </Text>

        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Tìm kiếm hướng dẫn..."
          placeholderTextColor="#94A3B8"
        />

        {search.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearch('')}
          >
            <Text style={styles.clearSearch}>
              ×
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categories}
      >
        {CATEGORIES.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.categoryButton,
              category === item.id &&
                styles.categoryActive,
            ]}
            onPress={() => setCategory(item.id)}
          >
            <Text
              style={[
                styles.categoryText,
                category === item.id &&
                  styles.categoryTextActive,
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TouchableOpacity
        style={[
          styles.filterButton,
          completedOnly &&
            styles.filterButtonActive,
        ]}
        onPress={() =>
          setCompletedOnly(!completedOnly)
        }
      >
        <Text
          style={[
            styles.filterText,
            completedOnly &&
              styles.categoryTextActive,
          ]}
        >
          {completedOnly
            ? '✓ Chỉ hiện hướng dẫn đã hoàn thành'
            : '○ Chỉ hiện hướng dẫn đã hoàn thành'}
        </Text>
      </TouchableOpacity>

      <View style={styles.listHeader}>
        <Text style={styles.sectionHeading}>
          Danh sách hướng dẫn
        </Text>

        <Text style={styles.resultCount}>
          {filteredGuides.length} kết quả
        </Text>
      </View>

      {filteredGuides.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>
            🔍
          </Text>

          <Text style={styles.emptyTitle}>
            Không tìm thấy hướng dẫn
          </Text>

          <Text style={styles.emptyDescription}>
            Hãy thử từ khóa hoặc danh mục khác.
          </Text>
        </View>
      ) : (
        filteredGuides.map((guide) => {
          const count = getCompletedSteps(
            guide.id
          ).length;

          const percentage = Math.round(
            (count / guide.steps.length) * 100
          );

          return (
            <TouchableOpacity
              key={guide.id}
              style={styles.guideCard}
              onPress={() =>
                setSelectedGuide(guide)
              }
            >
              <View style={styles.guideTop}>
                <View style={styles.guideIconBox}>
                  <Text style={styles.guideIcon}>
                    {guide.icon}
                  </Text>
                </View>

                <View style={styles.flex}>
                  <Text style={styles.guideTitle}>
                    {guide.title}
                  </Text>

                  <Text
                    style={styles.guideDescription}
                  >
                    {guide.description}
                  </Text>
                </View>

                <Text style={styles.arrow}>
                  ›
                </Text>
              </View>

              <View style={styles.guideMeta}>
                <Text style={styles.metaText}>
                  ◷ {guide.duration}
                </Text>

                <Text style={styles.metaText}>
                  📋 {guide.steps.length} bước
                </Text>

                {percentage === 100 && (
                  <Text style={styles.doneText}>
                    ✓ Hoàn thành
                  </Text>
                )}
              </View>

              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${percentage}%`,
                    },
                  ]}
                />
              </View>

              <Text style={styles.guideProgress}>
                {count}/{guide.steps.length} bước
                {' · '}
                {percentage}%
              </Text>
            </TouchableOpacity>
          );
        })
      )}

      <View style={styles.warningCard}>
        <Text style={styles.warningTitle}>
          ℹ️ Thông tin
        </Text>

        <Text style={styles.warningText}>
          Nội dung mang tính hướng dẫn chung.
          Luôn ưu tiên tài liệu của nhà sản xuất
          và liên hệ kỹ thuật viên đối với công việc
          liên quan đến điện, máy nén hoặc môi chất lạnh.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#F4F8FE',
  },
  content: {
    padding: 17,
    paddingBottom: 35,
  },
  backButton: {
    marginBottom: 16,
  },
  backText: {
    color: BLUE,
    fontSize: 14,
    fontWeight: '700',
  },
  hero: {
    backgroundColor: '#E7F2FF',
    borderRadius: 22,
    padding: 22,
    marginBottom: 17,
  },
  heroIcon: {
    fontSize: 39,
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#12345B',
  },
  heroDescription: {
    fontSize: 13,
    color: '#557594',
    lineHeight: 21,
    marginTop: 9,
  },
  heroStats: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 20,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 13,
    paddingVertical: 15,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 23,
    fontWeight: '800',
    color: BLUE,
  },
  statLabel: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 6,
    textAlign: 'center',
  },
  searchContainer: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCE7F4',
    borderRadius: 14,
    paddingHorizontal: 14,
    gap: 10,
    marginBottom: 15,
  },
  searchIcon: {
    fontSize: 17,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    color: '#12345B',
  },
  clearSearch: {
    fontSize: 25,
    color: '#94A3B8',
  },
  categories: {
    gap: 8,
    paddingBottom: 14,
  },
  categoryButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 17,
    borderWidth: 1,
    borderColor: '#DCE7F4',
  },
  categoryActive: {
    backgroundColor: BLUE,
    borderColor: BLUE,
  },
  categoryText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
  },
  categoryTextActive: {
    color: '#FFFFFF',
  },
  filterButton: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#DCE7F4',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 13,
    paddingVertical: 11,
    marginBottom: 19,
  },
  filterButtonActive: {
    backgroundColor: BLUE,
    borderColor: BLUE,
  },
  filterText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 14,
  },
  sectionHeading: {
    fontSize: 17,
    color: '#193451',
    fontWeight: '800',
  },
  resultCount: {
    fontSize: 11,
    color: '#94A3B8',
  },
  guideCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E3EBF5',
    borderRadius: 18,
    padding: 16,
    marginBottom: 13,
  },
  guideTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  guideIconBox: {
    width: 53,
    height: 53,
    borderRadius: 15,
    backgroundColor: '#EAF3FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  guideIcon: {
    fontSize: 27,
  },
  guideTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#193451',
    lineHeight: 21,
  },
  guideDescription: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 19,
    marginTop: 5,
  },
  arrow: {
    fontSize: 29,
    color: BLUE,
  },
  guideMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginVertical: 15,
  },
  metaText: {
    fontSize: 11,
    color: '#64748B',
  },
  doneText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16A34A',
  },
  progressTrack: {
    height: 7,
    borderRadius: 10,
    backgroundColor: '#E8EEF6',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 10,
    backgroundColor: BLUE,
  },
  guideProgress: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 8,
  },
  duration: {
    fontSize: 12,
    color: BLUE,
    fontWeight: '700',
    marginTop: 15,
  },
  progressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    padding: 17,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E3EBF5',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#193451',
  },
  percentage: {
    fontSize: 20,
    fontWeight: '800',
    color: BLUE,
  },
  progressDescription: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 10,
  },
  warningCard: {
    backgroundColor: '#FFF8EA',
    borderRadius: 15,
    padding: 17,
    marginBottom: 18,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#956300',
    marginBottom: 8,
  },
  warningText: {
    fontSize: 12,
    lineHeight: 21,
    color: '#8A6829',
  },
  helperText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 7,
    marginBottom: 15,
  },
  stepCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 15,
    borderWidth: 1,
    borderColor: '#E3EBF5',
    marginBottom: 11,
  },
  stepCardChecked: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  stepNumber: {
    width: 35,
    height: 35,
    borderRadius: 12,
    backgroundColor: '#E7F2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberChecked: {
    backgroundColor: '#16A34A',
  },
  stepNumberText: {
    fontSize: 15,
    fontWeight: '800',
    color: BLUE,
  },
  stepNumberTextChecked: {
    color: '#FFFFFF',
  },
  stepLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    marginBottom: 5,
  },
  stepText: {
    fontSize: 13,
    lineHeight: 21,
    color: '#193451',
  },
  stepTextChecked: {
    color: '#166534',
  },
  checkbox: {
    width: 23,
    height: 23,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#16A34A',
    borderColor: '#16A34A',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  successCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    marginVertical: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  successIcon: {
    fontSize: 42,
    color: '#16A34A',
    fontWeight: '800',
  },
  successTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#166534',
    marginTop: 10,
  },
  successDescription: {
    fontSize: 12,
    color: '#15803D',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 8,
  },
  resetButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCE7F4',
    borderRadius: 13,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 13,
    marginBottom: 12,
  },
  resetText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '700',
  },
  primaryButton: {
    backgroundColor: BLUE,
    borderRadius: 13,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 30,
    alignItems: 'center',
    marginBottom: 17,
  },
  emptyIcon: {
    fontSize: 39,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    color: '#193451',
    fontWeight: '800',
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 8,
    textAlign: 'center',
  },
});
