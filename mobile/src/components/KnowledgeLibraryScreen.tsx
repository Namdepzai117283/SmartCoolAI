
import React, { useEffect, useMemo, useState } from 'react';
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
  | 'maintenance'
  | 'safety';

type Article = {
  id: string;
  title: string;
  category: Exclude<Category, 'all'>;
  icon: string;
  summary: string;
  readingMinutes: number;
  sections: {
    heading: string;
    content: string;
  }[];
};

const BLUE = '#0878E8';
const STORAGE_KEY = 'smartcool_library_favorites_v1';

const CATEGORIES: {
  id: Category;
  label: string;
  icon: string;
}[] = [
  { id: 'all', label: 'Tất cả', icon: '📚' },
  { id: 'aircon', label: 'Máy lạnh', icon: '❄️' },
  { id: 'fridge', label: 'Tủ lạnh', icon: '🧊' },
  { id: 'maintenance', label: 'Bảo dưỡng', icon: '🛠️' },
  { id: 'safety', label: 'An toàn', icon: '🛡️' },
];

const ARTICLES: Article[] = [
  {
    id: 'a1',
    title: 'Máy lạnh Inverter là gì?',
    category: 'aircon',
    icon: '❄️',
    summary:
      'Tìm hiểu nguyên lý cơ bản và ưu điểm của máy lạnh Inverter.',
    readingMinutes: 4,
    sections: [
      {
        heading: '1. Khái niệm',
        content:
          'Máy lạnh Inverter sử dụng công nghệ điều khiển tốc độ máy nén để điều chỉnh năng suất làm lạnh theo nhu cầu thực tế.',
      },
      {
        heading: '2. Ưu điểm',
        content:
          'Công nghệ này có thể giúp giảm dao động nhiệt độ, vận hành ổn định và tiết kiệm điện trong điều kiện sử dụng phù hợp.',
      },
      {
        heading: '3. Khi nào nên chọn?',
        content:
          'Máy lạnh Inverter thường đáng cân nhắc khi thiết bị được sử dụng nhiều giờ mỗi ngày. Hiệu quả tiết kiệm điện còn phụ thuộc công suất, nhiệt độ cài đặt, cách nhiệt và điều kiện vận hành.',
      },
    ],
  },
  {
    id: 'a2',
    title: 'Chọn công suất máy lạnh theo diện tích phòng',
    category: 'aircon',
    icon: '🏠',
    summary:
      'Tham khảo cách chọn máy lạnh 1 HP, 1.5 HP hoặc 2 HP.',
    readingMinutes: 5,
    sections: [
      {
        heading: '1. Mức công suất tham khảo',
        content:
          'Phòng khoảng 15 m² trở xuống có thể tham khảo máy 1 HP; phòng 15–20 m² tham khảo 1.5 HP; phòng 20–30 m² tham khảo 2 HP.',
      },
      {
        heading: '2. Các yếu tố ảnh hưởng',
        content:
          'Cần xem xét chiều cao trần, số người sử dụng, hướng nắng, diện tích cửa kính, mức độ cách nhiệt và các thiết bị tỏa nhiệt trong phòng.',
      },
      {
        heading: '3. Lời khuyên',
        content:
          'Không nên chỉ dựa vào diện tích để chọn công suất. Với không gian có tải nhiệt lớn, nên nhờ đơn vị kỹ thuật tính toán phù hợp.',
      },
    ],
  },
  {
    id: 'a3',
    title: 'Vì sao máy lạnh không mát?',
    category: 'aircon',
    icon: '🌡️',
    summary:
      'Những nguyên nhân phổ biến và cách kiểm tra an toàn.',
    readingMinutes: 5,
    sections: [
      {
        heading: '1. Sai chế độ hoạt động',
        content:
          'Kiểm tra điều khiển và bảo đảm máy đang ở chế độ làm lạnh COOL, thay vì FAN hoặc chế độ khác.',
      },
      {
        heading: '2. Lưới lọc bẩn',
        content:
          'Bụi bẩn có thể cản trở luồng không khí, khiến hiệu quả làm lạnh giảm. Vệ sinh lưới lọc theo hướng dẫn của nhà sản xuất.',
      },
      {
        heading: '3. Những nguyên nhân cần kỹ thuật viên',
        content:
          'Quạt hỏng, cảm biến lỗi hoặc sự cố hệ thống môi chất lạnh có thể khiến máy làm lạnh kém. Không tự tháo đường ống hoặc xử lý môi chất lạnh.',
      },
    ],
  },
  {
    id: 'a4',
    title: 'Cách sử dụng máy lạnh tiết kiệm điện',
    category: 'aircon',
    icon: '⚡',
    summary:
      'Các thói quen sử dụng giúp giảm điện năng tiêu thụ.',
    readingMinutes: 4,
    sections: [
      {
        heading: '1. Chọn nhiệt độ phù hợp',
        content:
          'Có thể tham khảo mức 26–28°C tùy điều kiện thời tiết và sự thoải mái. Tránh đặt nhiệt độ quá thấp không cần thiết.',
      },
      {
        heading: '2. Hạn chế thất thoát nhiệt',
        content:
          'Đóng cửa khi sử dụng máy lạnh, che nắng hợp lý và hạn chế nguồn nhiệt không cần thiết trong phòng.',
      },
      {
        heading: '3. Bảo dưỡng định kỳ',
        content:
          'Lưới lọc sạch và thiết bị vận hành đúng cách góp phần duy trì hiệu quả làm lạnh.',
      },
    ],
  },
  {
    id: 'a5',
    title: 'Nguyên lý hoạt động của tủ lạnh',
    category: 'fridge',
    icon: '🧊',
    summary:
      'Tìm hiểu các bộ phận chính trong hệ thống làm lạnh.',
    readingMinutes: 5,
    sections: [
      {
        heading: '1. Chu trình làm lạnh',
        content:
          'Tủ lạnh sử dụng hệ thống làm lạnh để chuyển nhiệt từ bên trong khoang tủ ra môi trường bên ngoài.',
      },
      {
        heading: '2. Các bộ phận chính',
        content:
          'Hệ thống thường có máy nén, dàn ngưng, bộ phận tiết lưu và dàn bay hơi.',
      },
      {
        heading: '3. Điều khiển nhiệt độ',
        content:
          'Cảm biến và bộ điều khiển giúp duy trì nhiệt độ theo mức cài đặt. Cấu tạo cụ thể thay đổi theo từng dòng tủ.',
      },
    ],
  },
  {
    id: 'a6',
    title: 'Tủ lạnh không đông đá: Kiểm tra những gì?',
    category: 'fridge',
    icon: '🥶',
    summary:
      'Các nguyên nhân thường gặp khi ngăn đông hoạt động kém.',
    readingMinutes: 4,
    sections: [
      {
        heading: '1. Kiểm tra cài đặt',
        content:
          'Xác nhận mức nhiệt độ đang phù hợp và cửa tủ đã đóng kín.',
      },
      {
        heading: '2. Kiểm tra thực phẩm',
        content:
          'Không xếp thực phẩm che kín đường lưu thông không khí bên trong tủ.',
      },
      {
        heading: '3. Khi nào cần sửa chữa?',
        content:
          'Nếu tủ không đạt nhiệt độ sau khi kiểm tra những yếu tố cơ bản, nên liên hệ kỹ thuật viên để kiểm tra quạt, cảm biến hoặc hệ thống làm lạnh.',
      },
    ],
  },
  {
    id: 'a7',
    title: 'Cách bảo quản thực phẩm trong tủ lạnh',
    category: 'fridge',
    icon: '🥬',
    summary:
      'Một số nguyên tắc giúp bảo quản thực phẩm tốt hơn.',
    readingMinutes: 4,
    sections: [
      {
        heading: '1. Nhiệt độ bảo quản',
        content:
          'Ngăn mát thường nên duy trì khoảng 4°C hoặc thấp hơn, ngăn đông khoảng -18°C để bảo quản thực phẩm đông lạnh.',
      },
      {
        heading: '2. Phân loại thực phẩm',
        content:
          'Để thực phẩm sống riêng với thực phẩm đã chế biến và sử dụng hộp đựng phù hợp.',
      },
      {
        heading: '3. Tránh quá tải',
        content:
          'Không nhồi nhét quá nhiều thực phẩm làm cản trở luồng không khí lạnh.',
      },
    ],
  },
  {
    id: 'a8',
    title: 'Vệ sinh lưới lọc máy lạnh đúng cách',
    category: 'maintenance',
    icon: '🧽',
    summary:
      'Các bước cơ bản để vệ sinh lưới lọc an toàn.',
    readingMinutes: 5,
    sections: [
      {
        heading: '1. Chuẩn bị',
        content:
          'Tắt máy và ngắt nguồn điện theo hướng dẫn của nhà sản xuất trước khi vệ sinh.',
      },
      {
        heading: '2. Tháo lưới lọc',
        content:
          'Chỉ tháo bộ phận lưới lọc mà nhà sản xuất cho phép người dùng tự vệ sinh. Không tác động vào bộ phận điện.',
      },
      {
        heading: '3. Làm sạch và lắp lại',
        content:
          'Vệ sinh bằng phương pháp phù hợp với hướng dẫn sử dụng, để khô hoàn toàn và lắp đúng vị trí trước khi vận hành.',
      },
    ],
  },
  {
    id: 'a9',
    title: 'Dấu hiệu thiết bị cần bảo dưỡng',
    category: 'maintenance',
    icon: '🔧',
    summary:
      'Nhận biết các biểu hiện bất thường của thiết bị điện lạnh.',
    readingMinutes: 4,
    sections: [
      {
        heading: '1. Hiệu quả làm lạnh giảm',
        content:
          'Thiết bị mất nhiều thời gian hơn để đạt nhiệt độ mong muốn hoặc làm lạnh không đều.',
      },
      {
        heading: '2. Tiếng ồn bất thường',
        content:
          'Tiếng rung, tiếng va đập hoặc âm thanh khác thường có thể là dấu hiệu cần kiểm tra.',
      },
      {
        heading: '3. Rò nước hoặc mùi lạ',
        content:
          'Nước chảy bất thường, mùi khét hoặc dấu hiệu chập điện cần được xử lý thận trọng. Với dấu hiệu nguy hiểm, ngừng sử dụng và gọi người có chuyên môn.',
      },
    ],
  },
  {
    id: 'a10',
    title: 'An toàn điện khi sử dụng máy lạnh',
    category: 'safety',
    icon: '🛡️',
    summary:
      'Những nguyên tắc quan trọng để hạn chế rủi ro điện.',
    readingMinutes: 5,
    sections: [
      {
        heading: '1. Sử dụng nguồn điện phù hợp',
        content:
          'Thiết bị cần được lắp đặt theo thông số kỹ thuật và hướng dẫn của nhà sản xuất, với các biện pháp bảo vệ điện phù hợp.',
      },
      {
        heading: '2. Khi có dấu hiệu rò điện',
        content:
          'Không chạm vào thiết bị nếu nghi ngờ có điện rò. Ngắt nguồn điện từ vị trí an toàn nếu có thể và liên hệ người có chuyên môn.',
      },
      {
        heading: '3. Không tự sửa chữa',
        content:
          'Không tự mở hộp điện, thay linh kiện điện hoặc can thiệp hệ thống khi chưa được đào tạo.',
      },
    ],
  },
  {
    id: 'a11',
    title: 'Cần làm gì khi máy lạnh có mùi khét?',
    category: 'safety',
    icon: '🚨',
    summary:
      'Hướng dẫn xử lý ban đầu khi thiết bị có dấu hiệu nguy hiểm.',
    readingMinutes: 3,
    sections: [
      {
        heading: '1. Ngừng sử dụng',
        content:
          'Dừng thiết bị ngay. Nếu có thể thực hiện an toàn, ngắt điện tại cầu dao phù hợp.',
      },
      {
        heading: '2. Tránh tiếp xúc nguy hiểm',
        content:
          'Không chạm vào dây điện hư hỏng hoặc thiết bị có dấu hiệu chập cháy. Không dùng nước để xử lý đám cháy điện.',
      },
      {
        heading: '3. Liên hệ hỗ trợ',
        content:
          'Gọi kỹ thuật viên đủ chuyên môn. Nếu có cháy hoặc khói lan rộng, sơ tán và liên hệ lực lượng cứu hỏa.',
      },
    ],
  },
  {
    id: 'a12',
    title: 'Tìm hiểu mã lỗi điều hòa',
    category: 'maintenance',
    icon: '🔍',
    summary:
      'Vì sao cùng một mã lỗi có thể khác nhau giữa các hãng?',
    readingMinutes: 4,
    sections: [
      {
        heading: '1. Mã lỗi là gì?',
        content:
          'Mã lỗi là thông tin do hệ thống điều khiển hiển thị nhằm hỗ trợ nhận biết tình trạng hoạt động của thiết bị.',
      },
      {
        heading: '2. Không suy luận chỉ từ mã',
        content:
          'Mã E1, E2 hoặc các mã tương tự có thể mang ý nghĩa khác nhau tùy hãng và model.',
      },
      {
        heading: '3. Cách tra cứu',
        content:
          'Ghi lại hãng, model và mã lỗi chính xác. Đối chiếu tài liệu chính thức hoặc nhờ kỹ thuật viên kiểm tra.',
      },
    ],
  },
];

function categoryName(category: Article['category']): string {
  return (
    CATEGORIES.find((item) => item.id === category)?.label ??
    'Kiến thức'
  );
}

export default function KnowledgeLibraryScreen({
  onBack,
}: Props) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<Category>('all');
  const [selectedArticle, setSelectedArticle] =
    useState<Article | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function loadFavorites() {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed: unknown = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setFavorites(
              parsed.filter(
                (value): value is string =>
                  typeof value === 'string'
              )
            );
          }
        }
      } catch (error) {
        console.warn('Không thể tải bài viết yêu thích:', error);
      } finally {
        setReady(true);
      }
    }

    loadFavorites();
  }, []);

  useEffect(() => {
    if (!ready) return;

    AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(favorites)
    ).catch((error) => {
      console.warn('Không thể lưu bài viết yêu thích:', error);
    });
  }, [favorites, ready]);

  const filteredArticles = useMemo(() => {
    const keyword = query.trim().toLocaleLowerCase('vi-VN');

    return ARTICLES.filter((article) => {
      if (
        category !== 'all' &&
        article.category !== category
      ) {
        return false;
      }

      if (onlyFavorites && !favorites.includes(article.id)) {
        return false;
      }

      if (!keyword) return true;

      const searchableText = [
        article.title,
        article.summary,
        categoryName(article.category),
        ...article.sections.flatMap((section) => [
          section.heading,
          section.content,
        ]),
      ]
        .join(' ')
        .toLocaleLowerCase('vi-VN');

      return searchableText.includes(keyword);
    });
  }, [query, category, onlyFavorites, favorites]);

  function toggleFavorite(id: string) {
    setFavorites((previous) =>
      previous.includes(id)
        ? previous.filter((item) => item !== id)
        : [...previous, id]
    );
  }

  if (selectedArticle) {
    const isFavorite = favorites.includes(selectedArticle.id);

    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setSelectedArticle(null)}
        >
          <Text style={styles.backText}>
            ← Quay lại thư viện
          </Text>
        </TouchableOpacity>

        <View style={styles.articleDetail}>
          <Text style={styles.detailIcon}>
            {selectedArticle.icon}
          </Text>

          <Text style={styles.detailCategory}>
            {categoryName(selectedArticle.category)}
            {' · '}
            {selectedArticle.readingMinutes} phút đọc
          </Text>

          <Text style={styles.detailTitle}>
            {selectedArticle.title}
          </Text>

          <Text style={styles.detailSummary}>
            {selectedArticle.summary}
          </Text>

          <TouchableOpacity
            style={[
              styles.favoriteDetailButton,
              isFavorite && styles.favoriteDetailActive,
            ]}
            onPress={() => toggleFavorite(selectedArticle.id)}
          >
            <Text
              style={[
                styles.favoriteDetailText,
                isFavorite && styles.favoriteDetailTextActive,
              ]}
            >
              {isFavorite
                ? '★ Đã lưu vào yêu thích'
                : '☆ Lưu bài viết yêu thích'}
            </Text>
          </TouchableOpacity>

          <View style={styles.articleDivider} />

          {selectedArticle.sections.map((section) => (
            <View
              key={section.heading}
              style={styles.articleSection}
            >
              <Text style={styles.articleHeading}>
                {section.heading}
              </Text>

              <Text style={styles.articleParagraph}>
                {section.content}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.warningCard}>
          <Text style={styles.warningTitle}>
            ℹ️ Lưu ý
          </Text>
          <Text style={styles.warningText}>
            Nội dung mang tính tham khảo và học tập.
            Khi thiết bị có dấu hiệu nguy hiểm hoặc cần
            can thiệp kỹ thuật, hãy liên hệ người có
            chuyên môn.
          </Text>
        </View>
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
        <Text style={styles.heroIcon}>📚</Text>

        <Text style={styles.heroTitle}>
          Thư viện kiến thức
        </Text>

        <Text style={styles.heroDescription}>
          Khám phá kiến thức về máy lạnh, tủ lạnh,
          bảo dưỡng và sử dụng thiết bị điện lạnh
          an toàn.
        </Text>

        <View style={styles.heroStats}>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>
              {ARTICLES.length}
            </Text>
            <Text style={styles.statLabel}>
              Bài viết
            </Text>
          </View>

          <View style={styles.stat}>
            <Text style={styles.statNumber}>
              {CATEGORIES.length - 1}
            </Text>
            <Text style={styles.statLabel}>
              Danh mục
            </Text>
          </View>

          <View style={styles.stat}>
            <Text style={styles.statNumber}>
              {favorites.length}
            </Text>
            <Text style={styles.statLabel}>
              Đã lưu
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.searchCard}>
        <Text style={styles.searchTitle}>
          🔎 Tìm kiếm kiến thức
        </Text>

        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder="Ví dụ: máy lạnh không mát..."
          placeholderTextColor="#94A3B8"
          returnKeyType="search"
        />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryRow}
        >
          {CATEGORIES.map((item) => {
            const active = category === item.id;

            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.categoryButton,
                  active && styles.categoryButtonActive,
                ]}
                onPress={() => setCategory(item.id)}
              >
                <Text
                  style={[
                    styles.categoryText,
                    active && styles.categoryTextActive,
                  ]}
                >
                  {item.icon} {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <TouchableOpacity
          style={[
            styles.favoriteFilter,
            onlyFavorites && styles.favoriteFilterActive,
          ]}
          onPress={() => setOnlyFavorites(!onlyFavorites)}
        >
          <Text
            style={[
              styles.favoriteFilterText,
              onlyFavorites && styles.favoriteFilterTextActive,
            ]}
          >
            {onlyFavorites
              ? '★ Đang xem bài yêu thích'
              : '☆ Chỉ xem bài yêu thích'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.listHeading}>
        <Text style={styles.listTitle}>
          Danh sách bài viết
        </Text>
        <Text style={styles.listCount}>
          {filteredArticles.length} bài
        </Text>
      </View>

      {filteredArticles.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>🔎</Text>

          <Text style={styles.emptyTitle}>
            Không tìm thấy bài viết
          </Text>

          <Text style={styles.emptyDescription}>
            Hãy thử từ khóa khác hoặc thay đổi bộ lọc.
          </Text>

          <TouchableOpacity
            style={styles.resetButton}
            onPress={() => {
              setQuery('');
              setCategory('all');
              setOnlyFavorites(false);
            }}
          >
            <Text style={styles.resetText}>
              Xóa bộ lọc
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        filteredArticles.map((article) => {
          const isFavorite = favorites.includes(article.id);

          return (
            <View key={article.id} style={styles.articleCard}>
              <TouchableOpacity
                style={styles.articleOpen}
                onPress={() => setSelectedArticle(article)}
              >
                <View style={styles.articleIconBox}>
                  <Text style={styles.articleIcon}>
                    {article.icon}
                  </Text>
                </View>

                <View style={styles.articleInfo}>
                  <Text style={styles.articleCategory}>
                    {categoryName(article.category)}
                    {' · '}
                    {article.readingMinutes} phút đọc
                  </Text>

                  <Text style={styles.articleTitle}>
                    {article.title}
                  </Text>

                  <Text
                    style={styles.articleSummary}
                    numberOfLines={3}
                  >
                    {article.summary}
                  </Text>

                  <Text style={styles.readMore}>
                    Đọc bài viết →
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.favoriteButton}
                onPress={() => toggleFavorite(article.id)}
                accessibilityLabel={
                  isFavorite
                    ? 'Bỏ lưu bài viết'
                    : 'Lưu bài viết'
                }
              >
                <Text
                  style={[
                    styles.favoriteIcon,
                    isFavorite && styles.favoriteIconActive,
                  ]}
                >
                  {isFavorite ? '★' : '☆'}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })
      )}

      <View style={styles.warningCard}>
        <Text style={styles.warningTitle}>
          💡 Kiến thức SmartCool AI
        </Text>

        <Text style={styles.warningText}>
          Thư viện hiện sử dụng nội dung biên soạn
          sẵn phục vụ đồ án. Bài viết yêu thích được
          lưu trên điện thoại và chưa đồng bộ với Web.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F8FE',
  },
  content: {
    padding: 17,
    paddingBottom: 35,
  },
  backButton: {
    marginBottom: 17,
  },
  backText: {
    color: BLUE,
    fontSize: 14,
    fontWeight: '700',
  },
  hero: {
    backgroundColor: '#E7F2FF',
    borderRadius: 20,
    padding: 23,
    marginBottom: 17,
  },
  heroIcon: {
    fontSize: 35,
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 23,
    fontWeight: '800',
    color: '#12345B',
  },
  heroDescription: {
    color: '#557594',
    fontSize: 13,
    lineHeight: 21,
    marginTop: 9,
  },
  heroStats: {
    flexDirection: 'row',
    marginTop: 22,
    backgroundColor: '#FFFFFF',
    borderRadius: 13,
    paddingVertical: 14,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    color: BLUE,
    fontSize: 21,
    fontWeight: '800',
  },
  statLabel: {
    color: '#71839C',
    fontSize: 10,
    marginTop: 4,
  },
  searchCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E3EBF5',
    borderRadius: 18,
    padding: 16,
    marginBottom: 21,
  },
  searchTitle: {
    color: '#193451',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 12,
  },
  searchInput: {
    height: 49,
    borderWidth: 1,
    borderColor: '#DCE7F4',
    backgroundColor: '#FAFCFF',
    borderRadius: 12,
    paddingHorizontal: 14,
    color: '#193451',
    fontSize: 14,
    marginBottom: 15,
  },
  categoryRow: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 4,
  },
  categoryButton: {
    borderWidth: 1,
    borderColor: '#DFEAF6',
    borderRadius: 20,
    backgroundColor: '#FAFCFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  categoryButtonActive: {
    backgroundColor: '#E7F2FF',
    borderColor: BLUE,
  },
  categoryText: {
    color: '#667E99',
    fontSize: 11,
    fontWeight: '700',
  },
  categoryTextActive: {
    color: BLUE,
  },
  favoriteFilter: {
    marginTop: 14,
    paddingVertical: 11,
    alignItems: 'center',
    borderRadius: 11,
    backgroundColor: '#F5F8FC',
  },
  favoriteFilterActive: {
    backgroundColor: '#FFF3D6',
  },
  favoriteFilterText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  favoriteFilterTextActive: {
    color: '#A66B00',
  },
  listHeading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 13,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#12345B',
  },
  listCount: {
    color: '#8293A8',
    fontSize: 12,
  },
  articleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E3EBF5',
    padding: 15,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  articleOpen: {
    flex: 1,
    flexDirection: 'row',
    gap: 12,
  },
  articleIconBox: {
    width: 47,
    height: 47,
    borderRadius: 13,
    backgroundColor: '#EAF4FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  articleIcon: {
    fontSize: 25,
  },
  articleInfo: {
    flex: 1,
  },
  articleCategory: {
    color: BLUE,
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 7,
  },
  articleTitle: {
    color: '#193451',
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 20,
  },
  articleSummary: {
    color: '#71839C',
    fontSize: 11,
    lineHeight: 18,
    marginTop: 7,
  },
  readMore: {
    color: BLUE,
    fontSize: 11,
    fontWeight: '800',
    marginTop: 11,
  },
  favoriteButton: {
    paddingLeft: 8,
    paddingVertical: 3,
  },
  favoriteIcon: {
    color: '#A3B1C2',
    fontSize: 26,
  },
  favoriteIconActive: {
    color: '#E9A600',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    padding: 27,
    alignItems: 'center',
    marginBottom: 18,
  },
  emptyIcon: {
    fontSize: 35,
    marginBottom: 12,
  },
  emptyTitle: {
    color: '#193451',
    fontSize: 15,
    fontWeight: '800',
  },
  emptyDescription: {
    color: '#8293A8',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 19,
    marginTop: 8,
  },
  resetButton: {
    backgroundColor: BLUE,
    borderRadius: 10,
    paddingHorizontal: 17,
    paddingVertical: 11,
    marginTop: 17,
  },
  resetText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  articleDetail: {
    backgroundColor: '#FFFFFF',
    borderRadius: 19,
    padding: 21,
    borderWidth: 1,
    borderColor: '#E3EBF5',
    marginBottom: 17,
  },
  detailIcon: {
    fontSize: 43,
    marginBottom: 13,
  },
  detailCategory: {
    color: BLUE,
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 10,
  },
  detailTitle: {
    color: '#193451',
    fontSize: 23,
    fontWeight: '800',
    lineHeight: 31,
  },
  detailSummary: {
    color: '#71839C',
    fontSize: 13,
    lineHeight: 21,
    marginTop: 12,
  },
  favoriteDetailButton: {
    marginTop: 20,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: '#DCE7F4',
    backgroundColor: '#F7FAFE',
    alignItems: 'center',
    paddingVertical: 13,
  },
  favoriteDetailActive: {
    borderColor: '#F0D38C',
    backgroundColor: '#FFF6DF',
  },
  favoriteDetailText: {
    color: '#557594',
    fontSize: 12,
    fontWeight: '800',
  },
  favoriteDetailTextActive: {
    color: '#A66B00',
  },
  articleDivider: {
    height: 1,
    backgroundColor: '#E9EFF7',
    marginVertical: 22,
  },
  articleSection: {
    marginBottom: 22,
  },
  articleHeading: {
    color: '#193451',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 10,
  },
  articleParagraph: {
    color: '#506781',
    fontSize: 13,
    lineHeight: 23,
  },
  warningCard: {
    backgroundColor: '#FFF8EA',
    borderRadius: 15,
    padding: 17,
  },
  warningTitle: {
    color: '#956300',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 9,
  },
  warningText: {
    color: '#9C7A3B',
    fontSize: 11,
    lineHeight: 19,
  },
});
