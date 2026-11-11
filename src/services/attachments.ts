import * as DocumentPicker from 'expo-document-picker';
import { Directory, File, Paths } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as Sharing from 'expo-sharing';

export const MAX_TOTAL_SIZE = 20 * 1024 * 1024;

const ATTACHMENTS_DIR = 'attachments';
const MAX_IMAGE_DIMENSION = 1920;
const IMAGE_QUALITY = 0.8;
const IMAGE_MIME = 'image/jpeg';
const PDF_MIME = 'application/pdf';

export type PendingAttachment = {
  uri: string;
  name: string;
  mimeType: string;
  size: number;
};

export type PersistedAttachment = {
  file_path: string;
  file_name: string;
  mime_type: string;
  size: number;
};

function getAttachmentsDirectory(): Directory {
  const directory = new Directory(Paths.document, ATTACHMENTS_DIR);
  if (!directory.exists) {
    directory.create();
  }
  return directory;
}

function generateFileId(): string {
  const random = Math.floor(Math.random() * 0xffffffff)
    .toString(16)
    .padStart(8, '0');
  return `${Date.now().toString(16)}-${random}`;
}

function extensionFor(name: string, mimeType: string): string {
  const dotIndex = name.lastIndexOf('.');
  if (dotIndex >= 0 && name.length - dotIndex <= 6) {
    return name.slice(dotIndex).toLowerCase();
  }
  return mimeType === PDF_MIME ? '.pdf' : '.jpg';
}

async function compressImage(uri: string): Promise<{ uri: string; size: number }> {
  const context = ImageManipulator.manipulate(uri, {
    maxWidth: MAX_IMAGE_DIMENSION,
    maxHeight: MAX_IMAGE_DIMENSION,
  });
  const image = await context.renderAsync();
  const result = await image.saveAsync({
    compress: IMAGE_QUALITY,
    format: SaveFormat.JPEG,
  });
  return { uri: result.uri, size: new File(result.uri).size };
}

async function imageAssetToPending(asset: ImagePicker.ImagePickerAsset): Promise<PendingAttachment> {
  const compressed = await compressImage(asset.uri);
  const name = asset.fileName ?? `foto_${new Date().toISOString().slice(0, 10)}.jpg`;
  return {
    uri: compressed.uri,
    name,
    mimeType: IMAGE_MIME,
    size: compressed.size,
  };
}

export async function pickFromCamera(): Promise<PendingAttachment[]> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) {
    throw new Error('Se necesita permiso de cámara para tomar la foto.');
  }
  const result = await ImagePicker.launchCameraAsync({ quality: 1 });
  if (result.canceled) {
    return [];
  }
  return Promise.all(result.assets.map(imageAssetToPending));
}

export async function pickFromGallery(): Promise<PendingAttachment[]> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: true,
    selectionLimit: 10,
    quality: 1,
  });
  if (result.canceled) {
    return [];
  }
  return Promise.all(result.assets.map(imageAssetToPending));
}

export async function pickDocument(): Promise<PendingAttachment[]> {
  const result = await DocumentPicker.getDocumentAsync({
    type: PDF_MIME,
    multiple: false,
    copyToCacheDirectory: true,
  });
  if (result.canceled) {
    return [];
  }
  const asset = result.assets[0];
  const size = asset.size ?? new File(asset.uri).size;
  return [
    {
      uri: asset.uri,
      name: asset.name,
      mimeType: asset.mimeType ?? PDF_MIME,
      size,
    },
  ];
}

export function persistAttachment(pending: PendingAttachment): PersistedAttachment {
  const directory = getAttachmentsDirectory();
  const fileName = `${generateFileId()}${extensionFor(pending.name, pending.mimeType)}`;
  const source = new File(pending.uri);
  const destination = new File(directory, fileName);
  source.copySync(destination);
  return {
    file_path: destination.uri,
    file_name: pending.name,
    mime_type: pending.mimeType,
    size: destination.size || pending.size,
  };
}

export function deleteAttachmentFile(path: string): void {
  try {
    const file = new File(path);
    if (file.exists) {
      file.delete();
    }
  } catch {
    return;
  }
}

export async function openAttachment(path: string, name: string): Promise<void> {
  const file = new File(path);
  if (!file.exists) {
    throw new Error('El archivo ya no está disponible.');
  }
  if (await File.canPreview(file)) {
    await file.preview({ title: name });
    return;
  }
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, {
      dialogTitle: name,
      mimeType: file.type || undefined,
    });
    return;
  }
  throw new Error('No hay ninguna app para abrir este archivo.');
}
