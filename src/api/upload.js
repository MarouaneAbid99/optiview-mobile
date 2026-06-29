const CLOUD_NAME = 'dqowktiqn';
const UPLOAD_PRESET = 'Optiview';

export async function uploadToCloudinary(uri) {
  const data = new FormData();
  data.append('file', { uri, name: 'upload.jpg', type: 'image/jpeg' });
  data.append('upload_preset', UPLOAD_PRESET);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: 'POST',
    body: data,
  });
  const json = await res.json();
  if (!json.secure_url) throw new Error('Upload failed');
  return json.secure_url;
}
