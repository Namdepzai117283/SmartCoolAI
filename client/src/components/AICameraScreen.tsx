
import { useEffect, useRef, useState } from 'react';

import {
  ArrowLeft,
  Camera,
  ImagePlus,
  Image as ImageIcon,
  Trash2,
  Sparkles,
  CheckCircle2,
  Lightbulb,
  ShieldCheck,
  X,
  Info,
  LoaderCircle,
} from 'lucide-react';

import './AICameraScreen.css';

// ==========================================
// PROPS
// ==========================================

interface Props {
  onBack: () => void;
}

// ==========================================
// AI CAMERA SCREEN
// ==========================================

export default function AICameraScreen({
  onBack,
}: Props) {
  const [imageUri, setImageUri] =
    useState<string | null>(null);

  const [imageName, setImageName] =
    useState('');

  const [description, setDescription] =
    useState('');

  const [loading, setLoading] =
    useState(false);

  const [reading, setReading] =
    useState(false);

  const [prepared, setPrepared] =
    useState(false);

  const [error, setError] =
    useState('');

  const [cameraOpen, setCameraOpen] =
    useState(false);

  const [cameraLoading, setCameraLoading] =
    useState(false);

  const fileRef =
    useRef<HTMLInputElement>(null);

  const videoRef =
    useRef<HTMLVideoElement>(null);

  const streamRef =
    useRef<MediaStream | null>(null);

  const mountedRef = useRef(true);

  const cameraRequestRef = useRef(0);
  const imageRequestRef = useRef(0);

  const timerRef =
    useRef<ReturnType<typeof setTimeout> | null>(
      null
    );

  // ========================================
  // DỪNG CAMERA
  // ========================================

  function stopCamera() {
    cameraRequestRef.current += 1;

    streamRef.current?.getTracks().forEach(
      (track) => track.stop()
    );

    streamRef.current = null;

    setCameraOpen(false);
    setCameraLoading(false);
  }

  // ========================================
  // MỞ CAMERA
  // ========================================

  async function takePhoto() {
    setError('');

    if (!navigator.mediaDevices?.getUserMedia) {
      setError(
        'Trình duyệt không hỗ trợ camera. Hãy sử dụng localhost hoặc HTTPS.'
      );

      return;
    }

    const requestId = ++cameraRequestRef.current;

    setCameraLoading(true);

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

      setCameraOpen(true);
      setCameraLoading(false);

    } catch {
      if (
        mountedRef.current &&
        requestId === cameraRequestRef.current
      ) {
        setCameraLoading(false);

        setError(
          'Không thể mở camera. Vui lòng kiểm tra webcam và quyền truy cập camera của trình duyệt.'
        );
      }
    }
  }

  useEffect(() => {
    if (
      cameraOpen &&
      videoRef.current &&
      streamRef.current
    ) {
      videoRef.current.srcObject =
        streamRef.current;
    }
  }, [cameraOpen]);

  // ========================================
  // CHỤP ẢNH
  // ========================================

  function capturePhoto() {
    const video = videoRef.current;

    if (
      !video ||
      !video.videoWidth ||
      !video.videoHeight
    ) {
      return;
    }

    const canvas =
      document.createElement('canvas');

    const scale = Math.min(
      1,
      1200 / Math.max(
        video.videoWidth,
        video.videoHeight
      )
    );

    canvas.width = Math.max(
      1,
      Math.round(video.videoWidth * scale)
    );

    canvas.height = Math.max(
      1,
      Math.round(video.videoHeight * scale)
    );

    const context = canvas.getContext('2d');

    if (!context) {
      setError('Không thể chụp hình ảnh.');
      return;
    }

    context.drawImage(
      video,
      0,
      0,
      canvas.width,
      canvas.height
    );

    imageRequestRef.current += 1;

    setReading(false);

    setImageUri(
      canvas.toDataURL('image/jpeg', 0.8)
    );

    setImageName(
      `smartcool-${Date.now()}.jpg`
    );

    setPrepared(false);
    setError('');

    stopCamera();
  }

  // ========================================
  // CHỌN ẢNH TỪ MÁY TÍNH
  // ========================================

  function choosePhoto() {
    fileRef.current?.click();
  }

  function handleFile(file?: File) {
    if (!file) return;

    setError('');

    if (!file.type.startsWith('image/')) {
      setError(
        'Vui lòng chọn một tệp hình ảnh hợp lệ.'
      );

      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError(
        'Dung lượng hình ảnh không được vượt quá 10 MB.'
      );

      return;
    }

    const requestId = ++imageRequestRef.current;

    setReading(true);
    setPrepared(false);

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
          1200 / Math.max(
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

        const context =
          canvas.getContext('2d');

        if (!context) {
          setReading(false);
          setError(
            'Không thể xử lý hình ảnh.'
          );

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

        setImageUri(
          canvas.toDataURL(
            'image/jpeg',
            0.8
          )
        );

        setImageName(file.name);
        setReading(false);
      };

      image.onerror = () => {
        if (
          mountedRef.current &&
          requestId === imageRequestRef.current
        ) {
          setReading(false);

          setError(
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
        setReading(false);

        setError(
          'Không thể đọc tệp hình ảnh.'
        );
      }
    };

    reader.readAsDataURL(file);
  }

  // ========================================
  // XÓA HÌNH ẢNH
  // ========================================

  function removePhoto() {
    imageRequestRef.current += 1;

    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    setImageUri(null);
    setImageName('');
    setDescription('');
    setPrepared(false);
    setLoading(false);
    setReading(false);
    setError('');

    if (fileRef.current) {
      fileRef.current.value = '';
    }
  }

  // ========================================
  // CHUẨN BỊ PHÂN TÍCH
  // ========================================

  function analyzeImage() {
    if (!imageUri) {
      setError(
        'Hãy chụp ảnh hoặc chọn ảnh thiết bị trước.'
      );

      return;
    }

    if (loading || reading) return;

    setLoading(true);
    setPrepared(false);
    setError('');

    // Chỉ mô phỏng bước chuẩn bị dữ liệu.
    // Chưa gửi hình ảnh đến Backend.

    timerRef.current = setTimeout(() => {
      timerRef.current = null;

      setLoading(false);
      setPrepared(true);
    }, 700);
  }

  // ========================================
  // DỌN DẸP KHI RỜI MÀN HÌNH
  // ========================================

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;

      cameraRequestRef.current += 1;
      imageRequestRef.current += 1;

      streamRef.current?.getTracks().forEach(
        (track) => track.stop()
      );

      streamRef.current = null;

      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const busy =
    loading || reading || cameraLoading;

  // ========================================
  // GIAO DIỆN
  // ========================================

  return (
    <div className="sc-camera">

      {/* QUAY LẠI */}

      <button
        type="button"
        className="sc-camera-back"
        onClick={onBack}
      >
        <ArrowLeft size={18} />
        Quay lại
      </button>

      {/* HEADER */}

      <header className="sc-camera-header">
        <div className="sc-camera-header-icon">
          <Camera size={35} />
        </div>

        <div>
          <span className="sc-camera-eyebrow">
            CÔNG CỤ THÔNG MINH
          </span>

          <h1>AI Camera</h1>

          <p>
            Chụp ảnh hoặc tải ảnh thiết bị điện lạnh
            để chuẩn bị cho quá trình phân tích sự cố.
          </p>
        </div>
      </header>

      {/* THÔNG BÁO */}

      <div className="sc-camera-notice">
        <Info size={20} />

        <div>
          <strong>Chế độ trải nghiệm</strong>

          <p>
            Chưa kết nối AI nhận diện hình ảnh.
            Hình ảnh chưa được gửi đến máy chủ.
          </p>
        </div>
      </div>

      {/* THÔNG BÁO LỖI */}

      {error && (
        <div
          className="sc-camera-error"
          role="alert"
        >
          <span>{error}</span>

          <button
            type="button"
            onClick={() => setError('')}
            aria-label="Đóng thông báo"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* HAI CỘT NỘI DUNG */}

      <div className="sc-camera-grid">

        {/* CỘT HÌNH ẢNH */}

        <section className="sc-camera-card">
          <div className="sc-camera-card-heading">
            <span className="sc-camera-step">
              01
            </span>

            <div>
              <h2>Hình ảnh thiết bị</h2>

              <p>
                Chụp hoặc tải ảnh cần kiểm tra
              </p>
            </div>
          </div>

          {imageUri ? (
            <div className="sc-camera-preview">

              <img
                src={imageUri}
                alt="Hình ảnh thiết bị điện lạnh"
              />

              <div className="sc-camera-file">
                <ImageIcon size={18} />

                <span>{imageName}</span>
              </div>

              <button
                type="button"
                className="sc-camera-remove"
                onClick={removePhoto}
                disabled={busy}
              >
                <Trash2 size={16} />
                Xóa ảnh và chọn lại
              </button>

            </div>
          ) : (
            <button
              type="button"
              className="sc-camera-upload-area"
              onClick={choosePhoto}
              disabled={busy}
            >
              <div className="sc-camera-upload-icon">
                <ImagePlus size={40} />
              </div>

              <h3>Chưa có hình ảnh</h3>

              <p>
                Hãy chọn một hình ảnh rõ nét của
                thiết bị, màn hình mã lỗi hoặc
                vị trí gặp sự cố.
              </p>

              <span>
                Nhấn để chọn hình ảnh
              </span>

              <small>
                Tệp ảnh tối đa 10 MB
              </small>
            </button>
          )}

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(event) => {
              handleFile(
                event.target.files?.[0]
              );

              event.target.value = '';
            }}
          />

          <div className="sc-camera-button-row">

            <button
              type="button"
              className="sc-camera-primary"
              onClick={takePhoto}
              disabled={busy}
            >
              {cameraLoading ? (
                <LoaderCircle
                  size={19}
                  className="sc-camera-spin"
                />
              ) : (
                <Camera size={19} />
              )}

              {cameraLoading
                ? 'Đang mở camera'
                : 'Chụp ảnh'}
            </button>

            <button
              type="button"
              className="sc-camera-secondary"
              onClick={choosePhoto}
              disabled={busy}
            >
              {reading ? (
                <LoaderCircle
                  size={19}
                  className="sc-camera-spin"
                />
              ) : (
                <ImagePlus size={19} />
              )}

              {reading
                ? 'Đang đọc ảnh'
                : 'Chọn ảnh'}
            </button>

          </div>
        </section>

        {/* CỘT MÔ TẢ */}

        <section className="sc-camera-card">

          <div className="sc-camera-card-heading">
            <span className="sc-camera-step">
              02
            </span>

            <div>
              <h2>Mô tả tình trạng</h2>

              <p>
                Cung cấp thông tin về thiết bị
              </p>
            </div>
          </div>

          <label
            htmlFor="sc-camera-description"
            className="sc-camera-label"
          >
            Thông tin thiết bị
          </label>

          <p className="sc-camera-field-description">
            Bạn có thể ghi tên thiết bị, hãng,
            model, mã lỗi hoặc triệu chứng
            đang gặp phải.
          </p>

          <textarea
            id="sc-camera-description"
            className="sc-camera-description"
            placeholder="Ví dụ: Máy lạnh Daikin không mát, đèn báo nhấp nháy..."
            value={description}
            maxLength={1000}
            disabled={loading}
            onChange={(event) => {
              setDescription(
                event.target.value
              );

              setPrepared(false);
            }}
          />

          <div className="sc-camera-count">
            {description.length}/1000
          </div>

          <div className="sc-camera-quick-tips">
            <strong>
              Gợi ý thông tin nên cung cấp
            </strong>

            <div>
              <span>Tên thiết bị</span>
              <span>Thương hiệu</span>
              <span>Model</span>
              <span>Mã lỗi</span>
              <span>Triệu chứng</span>
            </div>
          </div>

          <button
            type="button"
            className="sc-camera-primary sc-camera-analyze"
            disabled={!imageUri || busy}
            onClick={analyzeImage}
          >
            {loading ? (
              <LoaderCircle
                size={21}
                className="sc-camera-spin"
              />
            ) : (
              <Sparkles size={21} />
            )}

            {loading
              ? 'Đang chuẩn bị dữ liệu...'
              : 'Chuẩn bị phân tích hình ảnh'}
          </button>

          <p className="sc-camera-demo-note">
            Chức năng phân tích bằng AI thật
            sẽ được kết nối ở giai đoạn tiếp theo.
          </p>

        </section>

      </div>

      {/* KẾT QUẢ CHUẨN BỊ */}

      {prepared && imageUri && (
        <section
          className="sc-camera-result"
          aria-live="polite"
        >
          <div className="sc-camera-result-heading">
            <div className="sc-camera-success-icon">
              <CheckCircle2 size={29} />
            </div>

            <div>
              <h2>Đã chuẩn bị ảnh thành công</h2>

              <p>
                Ảnh và mô tả đã sẵn sàng.
                Chưa thực hiện nhận diện bằng AI.
              </p>
            </div>
          </div>

          <div className="sc-camera-result-content">

            <img
              src={imageUri}
              alt="Ảnh đã chuẩn bị"
            />

            <div>
              <h3>Thông tin đã cung cấp</h3>

              <p>
                <strong>Tệp ảnh:</strong>
                {' '}{imageName}
              </p>

              <p>
                <strong>Mô tả:</strong>
                {' '}
                {description.trim() ||
                  'Chưa nhập mô tả tình trạng.'}
              </p>

              <span className="sc-camera-ready">
                <CheckCircle2 size={15} />
                Dữ liệu đã sẵn sàng
              </span>
            </div>

          </div>
        </section>
      )}

      {/* MẸO CHỤP ẢNH */}

      <div className="sc-camera-tips-grid">

        <section className="sc-camera-tips">
          <div className="sc-camera-tips-heading">
            <Lightbulb size={23} />
            <h3>Mẹo chụp ảnh rõ nét</h3>
          </div>

          <ul>
            <li>Chụp nơi đủ ánh sáng.</li>

            <li>
              Chụp rõ nhãn model hoặc mã lỗi.
            </li>

            <li>
              Giữ máy ảnh ổn định khi chụp.
            </li>

            <li>
              Ưu tiên hình ảnh rõ nét của thiết bị.
            </li>
          </ul>
        </section>

        <section className="sc-camera-safety">
          <div className="sc-camera-tips-heading">
            <ShieldCheck size={23} />
            <h3>Lưu ý an toàn</h3>
          </div>

          <ul>
            <li>
              Không tháo thiết bị điện để chụp ảnh.
            </li>

            <li>
              Tránh tiếp xúc thiết bị đang rò điện
              hoặc phát khói.
            </li>

            <li>
              Liên hệ kỹ thuật viên khi phát hiện
              dấu hiệu nguy hiểm.
            </li>
          </ul>
        </section>

      </div>

      {/* CAMERA MODAL */}

      {cameraOpen && (
        <div
          className="sc-camera-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Chụp ảnh thiết bị"
        >
          <div className="sc-camera-modal">

            <div className="sc-camera-modal-header">
              <div>
                <h2>Chụp ảnh thiết bị</h2>

                <p>
                  Đưa thiết bị vào khung hình
                </p>
              </div>

              <button
                type="button"
                onClick={stopCamera}
                aria-label="Đóng camera"
              >
                <X size={24} />
              </button>
            </div>

            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
            />

            <div className="sc-camera-modal-actions">

              <button
                type="button"
                className="sc-camera-secondary"
                onClick={stopCamera}
              >
                Hủy
              </button>

              <button
                type="button"
                className="sc-camera-primary"
                onClick={capturePhoto}
              >
                <Camera size={21} />
                Chụp ảnh
              </button>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
