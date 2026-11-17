import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  STORAGE_KEYS,
  READER_FONT_SCALE_MAX,
  READER_FONT_SCALE_MIN,
  READER_FONT_SCALE_STEP,
} from '@/lib/constants';
import { readStorage, writeStorage } from '@/lib/storage';
import { pickVietnameseVoices } from '@/lib/speech';
import { BookmarkButton } from '@/components/article/BookmarkButton';
import type { Article } from '@/types/article';

interface ReaderToolbarProps {
  article: Article;
  /** Nội dung bài đã bóc sạch thẻ HTML — dùng cho trình đọc bằng giọng nói. */
  contentText?: string;
}

type SpeechState = 'idle' | 'speaking' | 'paused';

function readStoredScale(): number {
  const stored = readStorage<number>(STORAGE_KEYS.readerFontScale, 1);
  if (typeof stored !== 'number' || Number.isNaN(stored)) return 1;
  return Math.min(READER_FONT_SCALE_MAX, Math.max(READER_FONT_SCALE_MIN, stored));
}

export function ReaderToolbar({ article, contentText = '' }: ReaderToolbarProps) {
  const [scale, setScale] = useState(readStoredScale);
  const [speechState, setSpeechState] = useState<SpeechState>('idle');
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceName, setVoiceName] = useState<string>('');
  const [rate, setRate] = useState(1);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  // Danh sách voice thường được nạp bất đồng bộ nên phải nghe cả sự kiện
  // `voiceschanged` của trình duyệt.
  useEffect(() => {
    if (!supported) return;

    const sync = (): void => {
      setVoices(pickVietnameseVoices(window.speechSynthesis.getVoices()));
    };

    sync();
    window.speechSynthesis.addEventListener('voiceschanged', sync);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', sync);
  }, [supported]);

  // Áp dụng cỡ chữ cho phần nội dung bài viết.
  useEffect(() => {
    document.documentElement.style.setProperty('--n24-reader-scale', String(scale));
    writeStorage(STORAGE_KEYS.readerFontScale, scale);
  }, [scale]);

  // Dừng đọc khi rời trang để không phát tiếng ở nền.
  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
    };
  }, []);

  const changeScale = (delta: number): void => {
    setScale((current) =>
      Math.min(READER_FONT_SCALE_MAX, Math.max(READER_FONT_SCALE_MIN, current + delta)),
    );
  };

  const selectedVoice = useMemo(
    () => voices.find((voice) => voice.name === voiceName) ?? null,
    [voices, voiceName],
  );

  const speak = useCallback(() => {
    if (!supported) {
      setSpeechError('Trình duyệt này không hỗ trợ đọc bằng giọng nói.');
      return;
    }

    const text = contentText.trim();
    if (!text) {
      setSpeechError('Chưa có nội dung để đọc.');
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'vi-VN';
    utterance.rate = rate;

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    } else {
      // Không chọn được voice tiếng Việt — vẫn đọc bằng giọng mặc định của hệ điều hành.
      setSpeechError('Không tìm thấy giọng đọc tiếng Việt, đang dùng giọng mặc định.');
    }

    utterance.onend = () => setSpeechState('idle');
    utterance.onerror = (event) => {
      setSpeechState('idle');
      utteranceRef.current = null;
      if (event.error === 'canceled' || event.error === 'interrupted') return;
      setSpeechError('Không thể đọc nội dung bài viết.');
    };

    utteranceRef.current = utterance;
    setSpeechState('speaking');
    window.speechSynthesis.speak(utterance);
  }, [contentText, rate, selectedVoice, supported]);

  const pause = (): void => {
    if (!supported) return;
    window.speechSynthesis.pause();
    setSpeechState('paused');
  };

  const resume = (): void => {
    if (!supported) return;
    window.speechSynthesis.resume();
    setSpeechState('speaking');
  };

  const stop = (): void => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    utteranceRef.current = null;
    setSpeechState('idle');
  };

  const isSpeaking = speechState === 'speaking';

  return (
    <div className="reader-toolbar" role="toolbar" aria-label="Tiện ích đọc bài">
      <div className="reader-toolbar__group">
        <button
          type="button"
          className="btn btn-sm btn-outline-dark"
          aria-label="Giảm cỡ chữ"
          disabled={scale <= READER_FONT_SCALE_MIN}
          onClick={() => changeScale(-READER_FONT_SCALE_STEP)}
        >
          <span aria-hidden="true">A−</span>
        </button>
        <span className="reader-toolbar__scale" aria-live="polite">
          {Math.round(scale * 100)}%
        </span>
        <button
          type="button"
          className="btn btn-sm btn-outline-dark"
          aria-label="Tăng cỡ chữ"
          disabled={scale >= READER_FONT_SCALE_MAX}
          onClick={() => changeScale(READER_FONT_SCALE_STEP)}
        >
          <span aria-hidden="true">A+</span>
        </button>
      </div>

      <div className="reader-toolbar__group">
        <BookmarkButton article={article} />
      </div>

      <div className="reader-toolbar__group">
        {!isSpeaking ? (
          <button type="button" className="btn btn-sm btn-outline-dark" onClick={speak}>
            <i className="bi bi-volume-up" aria-hidden="true" />
            <span className="ms-1">
              {speechState === 'paused' ? 'Tiếp tục đọc' : 'Đọc bằng giọng nói'}
            </span>
          </button>
        ) : (
          <button type="button" className="btn btn-sm btn-outline-dark" onClick={pause}>
            <i className="bi bi-pause" aria-hidden="true" />
            <span className="ms-1">Tạm dừng</span>
          </button>
        )}

        {speechState === 'paused' && (
          <button type="button" className="btn btn-sm btn-outline-dark" onClick={resume}>
            <i className="bi bi-play" aria-hidden="true" />
            <span className="ms-1">Tiếp tục</span>
          </button>
        )}

        {speechState !== 'idle' && (
          <button type="button" className="btn btn-sm btn-outline-dark" onClick={stop}>
            <i className="bi bi-stop" aria-hidden="true" />
            <span className="ms-1">Dừng</span>
          </button>
        )}
      </div>

      {supported && (
        <div className="reader-toolbar__group reader-toolbar__group--voice">
          <label className="visually-hidden" htmlFor="reader-voice">
            Giọng đọc
          </label>
          <select
            id="reader-voice"
            className="form-select form-select-sm w-auto"
            value={voiceName}
            disabled={voices.length === 0}
            onChange={(event) => setVoiceName(event.target.value)}
          >
            <option value="">
              {voices.length === 0 ? 'Không có giọng tiếng Việt' : 'Giọng mặc định'}
            </option>
            {voices.map((voice) => (
              <option key={voice.name} value={voice.name}>
                {voice.name}
              </option>
            ))}
          </select>

          <label className="visually-hidden" htmlFor="reader-rate">
            Tốc độ đọc
          </label>
          <input
            id="reader-rate"
            className="form-range reader-toolbar__rate"
            type="range"
            min={0.5}
            max={2}
            step={0.1}
            value={rate}
            onChange={(event) => setRate(Number(event.target.value))}
          />
          <span className="reader-toolbar__scale" aria-live="polite">
            {rate.toFixed(1)}×
          </span>
        </div>
      )}

      {!supported && (
        <p className="reader-toolbar__error" role="alert">
          Trình duyệt này không hỗ trợ đọc bằng giọng nói.
        </p>
      )}

      {speechError && (
        <p className="reader-toolbar__error" role="alert">
          {speechError}
        </p>
      )}
    </div>
  );
}
