/** Lọc ra các giọng đọc hỗ trợ tiếng Việt trong danh sách voice của trình duyệt. */
export function pickVietnameseVoices(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice[] {
  return voices.filter((voice) => voice.lang.toLowerCase().startsWith('vi'));
}
