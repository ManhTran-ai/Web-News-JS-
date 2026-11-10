/** Bỏ thẻ HTML và gộp khoảng trắng để lấy phần text thuần của nội dung bài viết. */
export function extractTextFromHtml(html: string): string {
  if (typeof DOMParser === 'undefined') return '';

  const doc = new DOMParser().parseFromString(html, 'text/html');
  return (doc.body.textContent ?? '').replace(/\s+/g, ' ').trim();
}
