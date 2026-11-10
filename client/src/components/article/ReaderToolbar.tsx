import { useCallback, useEffect, useRef, useState } from 'react';
import {
  STORAGE_KEYS,
  READER_FONT_SCALE_MAX,
  READER_FONT_SCALE_MIN,
  READER_FONT_SCALE_STEP,
} from '@/lib/constants';
import { readStorage, writeStorage } from '@/lib/storage';
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
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

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

  const speak = useCallback(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
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
    const voice = window.speechSynthesis.getVoices().find((item) =>
      item.lang.toLowerCase().startsWith('vi'),
    );
    if (voice) utterance.voice = voice;

    utterance.onend = () => setSpeechState('idle');
    utterance.onerror = () => {
      setSpeechState('idle');
      setSpeechError('Không thể đọc nội dung bài viết.');
    };

    utteranceRef.current = utterance;
    setSpeechError(null);
    setSpeechState('speaking');
    window.speechSynthesis.speak(utterance);
  }, [contentText]);

  const pause = (): void => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.pause();
    setSpeechState('paused');
  };

  const resume = (): void => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.resume();
    setSpeechState('speaking');
  };

  const stop = (): void => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
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

      {speechError && (
        <p className="reader-toolbar__error" role="alert">
          {speechError}
        </p>
      )}
    </div>
  );
}
