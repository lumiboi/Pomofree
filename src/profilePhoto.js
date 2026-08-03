export const MAX_PROFILE_PHOTO_LENGTH = 100000;
const MAX_PROFILE_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const IMAGE_DATA_URL = /^data:image\/(?:jpeg|png|webp);base64,[a-z0-9+/]+={0,2}$/i;

export const normalizeProfilePhoto = value => {
  const photo = String(value || '').trim();
  if (!photo) return '';
  if (IMAGE_DATA_URL.test(photo)) {
    if (photo.length > MAX_PROFILE_PHOTO_LENGTH) throw new Error('image-too-large');
    return photo;
  }
  if (photo.length > 2048) throw new Error('invalid-image-url');

  let url;
  try {
    url = new URL(photo);
  } catch {
    throw new Error('invalid-image-url');
  }
  if (url.protocol !== 'https:' || url.username || url.password) throw new Error('invalid-image-url');
  return photo;
};

export const safeProfilePhoto = value => {
  try {
    return normalizeProfilePhoto(value);
  } catch {
    return '';
  }
};

export const validateProfileFile = file => {
  if (!file || !ALLOWED_IMAGE_TYPES.includes(file.type)) throw new Error('invalid-image-type');
  if (file.size > MAX_PROFILE_FILE_SIZE) throw new Error('image-too-large');
};

export const resizeProfilePhoto = file => {
  validateProfileFile(file);
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('image-read-failed'));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error('image-read-failed'));
      image.onload = () => {
        const size = 128;
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) return reject(new Error('image-read-failed'));
        canvas.width = size;
        canvas.height = size;
        const crop = Math.min(image.naturalWidth, image.naturalHeight);
        context.drawImage(
          image,
          (image.naturalWidth - crop) / 2,
          (image.naturalHeight - crop) / 2,
          crop,
          crop,
          0,
          0,
          size,
          size
        );
        try {
          resolve(normalizeProfilePhoto(canvas.toDataURL('image/webp', 0.72)));
        } catch (error) {
          reject(error);
        }
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
};
