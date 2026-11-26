
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';

type Props = {
  onBack: () => void;
};

const BLUE = '#0878E8';

export default function AICameraScreen({ onBack }: Props) {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  async function takePhoto() {
    try {
      const permission =
        await ImagePicker.requestCameraPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          'Cần quyền Camera',
          'Vui lòng cho phép SmartCool AI sử dụng camera trong Cài đặt iPhone.'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets.length > 0) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Lỗi', 'Không thể mở camera.');
    }
  }

  async function choosePhoto() {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          'Cần quyền truy cập ảnh',
          'Vui lòng cho phép SmartCool AI truy cập ảnh trong Cài đặt iPhone.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets.length > 0) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Lỗi', 'Không thể mở thư viện ảnh.');
    }
  }

  function analyzeImage() {
    if (!imageUri) {
      Alert.alert(
        'Chưa có ảnh',
        'Hãy chụp ảnh hoặc chọn ảnh thiết bị trước.'
      );
      return;
    }

    setLoading(true);

    // Chưa có backend AI để gửi ảnh phân tích.
    setLoading(false);

    Alert.alert(
      'Đã chuẩn bị ảnh',
      'Ảnh và mô tả đã sẵn sàng. Chức năng phân tích bằng AI thật sẽ được kết nối ở giai đoạn backend.'
    );
  }

  function removePhoto() {
    setImageUri(null);
    setDescription('');
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <TouchableOpacity
        style={styles.backButton}
        onPress={onBack}
      >
        <Text style={styles.backText}>← Quay lại</Text>
      </TouchableOpacity>

      <View style={styles.header}>
        <View style={styles.iconBox}>
          <Text style={styles.headerIcon}>📷</Text>
        </View>

        <Text style={styles.title}>AI Camera</Text>

        <Text style={styles.subtitle}>
          Chụp ảnh hoặc tải ảnh thiết bị điện lạnh để
          chuẩn bị cho quá trình phân tích sự cố.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>
          Hình ảnh thiết bị
        </Text>

        {imageUri ? (
          <View>
            <Image
              source={{ uri: imageUri }}
              style={styles.previewImage}
              resizeMode="contain"
            />

            <TouchableOpacity
              style={styles.removeButton}
              onPress={removePhoto}
            >
              <Text style={styles.removeText}>
                ✕ Xóa ảnh và chọn lại
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.uploadArea}>
            <Text style={styles.uploadIcon}>📸</Text>
            <Text style={styles.uploadTitle}>
              Chưa có hình ảnh
            </Text>
            <Text style={styles.uploadSubtitle}>
              Hãy chọn một hình ảnh rõ nét của thiết bị,
              màn hình mã lỗi hoặc vị trí gặp sự cố.
            </Text>
          </View>
        )}

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.cameraButton}
            onPress={takePhoto}
          >
            <Text style={styles.cameraButtonText}>
              📷 Chụp ảnh
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.galleryButton}
            onPress={choosePhoto}
          >
            <Text style={styles.galleryButtonText}>
              🖼️ Chọn ảnh
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>
          Mô tả tình trạng
        </Text>

        <Text style={styles.fieldDescription}>
          Bạn có thể ghi tên thiết bị, hãng, model,
          mã lỗi hoặc triệu chứng đang gặp phải.
        </Text>

        <TextInput
          style={styles.descriptionInput}
          placeholder={
            'Ví dụ: Máy lạnh Daikin không mát, đèn báo nhấp nháy...'
          }
          placeholderTextColor="#94A3B8"
          value={description}
          onChangeText={setDescription}
          multiline
          textAlignVertical="top"
          maxLength={1000}
        />

        <Text style={styles.characterCount}>
          {description.length}/1000
        </Text>

        <TouchableOpacity
          style={[
            styles.analyzeButton,
            (!imageUri || loading) && styles.disabledButton,
          ]}
          disabled={!imageUri || loading}
          onPress={analyzeImage}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.analyzeText}>
              ✦ Chuẩn bị phân tích hình ảnh
            </Text>
          )}
        </TouchableOpacity>

        <Text style={styles.demoNote}>
          Chưa kết nối AI nhận diện hình ảnh. Ảnh chưa
          được gửi đến máy chủ.
        </Text>
      </View>

      <View style={styles.tipsCard}>
        <Text style={styles.tipsTitle}>
          💡 Mẹo chụp ảnh rõ nét
        </Text>

        <Text style={styles.tipText}>
          • Chụp nơi đủ ánh sáng.
        </Text>
        <Text style={styles.tipText}>
          • Chụp rõ nhãn model hoặc mã lỗi.
        </Text>
        <Text style={styles.tipText}>
          • Không tháo thiết bị điện để chụp ảnh.
        </Text>
        <Text style={styles.tipText}>
          • Tránh tiếp xúc thiết bị đang rò điện hoặc phát khói.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F8FD',
  },
  content: {
    padding: 18,
    paddingBottom: 40,
  },
  backButton: {
    marginBottom: 18,
  },
  backText: {
    color: BLUE,
    fontSize: 14,
    fontWeight: '700',
  },
  header: {
    alignItems: 'center',
    marginBottom: 25,
  },
  iconBox: {
    width: 75,
    height: 75,
    borderRadius: 23,
    backgroundColor: '#E8F3FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  headerIcon: {
    fontSize: 37,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#142D4C',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 21,
    marginTop: 10,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 17,
    borderWidth: 1,
    borderColor: '#E7EDF5',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#193451',
    marginBottom: 15,
  },
  uploadArea: {
    minHeight: 195,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#C5DDF7',
    borderRadius: 16,
    backgroundColor: '#F5FAFF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  uploadIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  uploadTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#334155',
  },
  uploadSubtitle: {
    fontSize: 12,
    color: '#8796AA',
    textAlign: 'center',
    lineHeight: 19,
    marginTop: 8,
  },
  previewImage: {
    width: '100%',
    height: 270,
    borderRadius: 14,
    backgroundColor: '#F3F8FF',
  },
  removeButton: {
    alignSelf: 'center',
    padding: 12,
  },
  removeText: {
    color: '#DC2626',
    fontWeight: '700',
    fontSize: 13,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 17,
  },
  cameraButton: {
    flex: 1,
    backgroundColor: BLUE,
    paddingVertical: 15,
    borderRadius: 13,
    alignItems: 'center',
  },
  cameraButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  galleryButton: {
    flex: 1,
    backgroundColor: '#E8F3FF',
    paddingVertical: 15,
    borderRadius: 13,
    alignItems: 'center',
  },
  galleryButtonText: {
    color: BLUE,
    fontWeight: '800',
    fontSize: 13,
  },
  fieldDescription: {
    fontSize: 12,
    lineHeight: 20,
    color: '#64748B',
    marginBottom: 13,
  },
  descriptionInput: {
    height: 125,
    borderWidth: 1,
    borderColor: '#DCE6F2',
    borderRadius: 13,
    backgroundColor: '#FAFCFF',
    padding: 13,
    fontSize: 14,
    color: '#193451',
  },
  characterCount: {
    textAlign: 'right',
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 7,
  },
  analyzeButton: {
    backgroundColor: BLUE,
    paddingVertical: 16,
    borderRadius: 13,
    alignItems: 'center',
    marginTop: 15,
  },
  disabledButton: {
    backgroundColor: '#B9D3F1',
  },
  analyzeText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  demoNote: {
    color: '#94A3B8',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 17,
  },
  tipsCard: {
    backgroundColor: '#EAF4FF',
    padding: 18,
    borderRadius: 17,
  },
  tipsTitle: {
    color: '#185C9A',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 11,
  },
  tipText: {
    color: '#557895',
    fontSize: 12,
    lineHeight: 22,
  },
});

