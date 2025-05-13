import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryImage } from './types.js';

cloudinary.config({
  cloud_name: 'dlrktdmta',
  api_key: '869216562765372',
  api_secret: '5yiiFjYBxR953c2QYvyzR7ke9Aw',
});

export async function uploadImageToCloudinary(publicId, folder, image) {

  // Subir o actualizar la imagen con el contador en el contexto
  const result = await cloudinary.uploader.upload(image, {
    public_id: publicId,
    folder: folder,
    overwrite: true,
    unique_filename: false
  });

  // Retornar la URL y los detalles de la imagen
  return new CloudinaryImage(result.secure_url, result.public_id, folder);
}


export async function uploadUserImageToCloudinary(uid, image) {
  const publicId = `user_${uid}`;
  const folder = `PS/users/${uid}/`;
  return await uploadImageToCloudinary(publicId, folder, image);
}
export async function uploadItineraryPreviewToCloudinary(uid, iid, image) {
  const publicId = `user_${uid}_itinerary_${iid}_preview`;
  const folder = `PS/users/${uid}/itineraries/${iid}/`;
  return await uploadImageToCloudinary(publicId, folder, image);
}
export async function uploadPlaceImageToCloudinary(uid, iid, image, name) {
  const publicId = `user_${uid}_itinerary_${iid}_${name}`;
  const folder = `PS/users/${uid}/itineraries/${iid}/`;
  return await uploadImageToCloudinary(publicId, folder, image);
}


export async function deleteImageFromCloudinary(folder, publicId) {
  let result = await cloudinary.uploader.destroy(`${folder}${publicId}`);
  console.log(result);
}
