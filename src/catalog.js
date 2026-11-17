export function galleryPages(items) {
  return Array.from({ length: Math.ceil(items.length / 6) }, (_, index) => items.slice(index * 6, index * 6 + 6));
}

export function previewFor(item) {
  if (item.mediaType === 'image' && item.media) return item.media;
  return item.poster || item.referenceImage || (item.referenceVideo ? item.referenceVideo.replace('.mp4', '.jpg') : 'assets/icon.svg');
}
