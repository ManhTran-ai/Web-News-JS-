import { describe, expect, it } from 'vitest';
import { pickVietnameseVoices } from './speech';

function makeVoice(name: string, lang: string): SpeechSynthesisVoice {
  return { name, lang, default: false, localService: true, voiceURI: name } as SpeechSynthesisVoice;
}

describe('pickVietnameseVoices', () => {
  it('giữ lại các giọng có lang bắt đầu bằng "vi"', () => {
    const voices = [
      makeVoice('Lê Huy', 'vi-VN'),
      makeVoice('Nam', 'vi'),
      makeVoice('Google US English', 'en-US'),
    ];

    expect(pickVietnameseVoices(voices).map((voice) => voice.name)).toEqual(['Lê Huy', 'Nam']);
  });

  it('không phân biệt hoa thường trong lang', () => {
    const voices = [makeVoice('Lê Huy', 'VI-VN')];

    expect(pickVietnameseVoices(voices)).toHaveLength(1);
  });

  it('trả về mảng rỗng khi không có giọng tiếng Việt', () => {
    expect(pickVietnameseVoices([makeVoice('Google US English', 'en-US')])).toEqual([]);
  });
});
