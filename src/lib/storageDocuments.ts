import { supabase } from '@/integrations/supabase/client';

export const DOCUMENTS_BUCKET = 'documents';

const SIGNED_URL_EXPIRES_IN_SECONDS = 60 * 10;

const stripBucketPrefix = (path: string, bucket = DOCUMENTS_BUCKET) => {
  let normalizedPath = decodeURIComponent(path).replace(/^\/+/, '');

  while (normalizedPath.startsWith(`${bucket}/`)) {
    normalizedPath = normalizedPath.slice(bucket.length + 1);
  }

  return normalizedPath;
};

export const extractStorageObjectPath = (value: string, bucket = DOCUMENTS_BUCKET) => {
  if (!value) return '';

  if (!value.startsWith('http')) {
    return stripBucketPrefix(value, bucket);
  }

  try {
    const parsedUrl = new URL(value);
    const markers = [
      `/storage/v1/object/public/${bucket}/`,
      `/storage/v1/object/sign/${bucket}/`,
      `/storage/v1/object/authenticated/${bucket}/`,
      `/${bucket}/`,
    ];

    for (const marker of markers) {
      const markerIndex = parsedUrl.pathname.indexOf(marker);

      if (markerIndex >= 0) {
        return stripBucketPrefix(parsedUrl.pathname.slice(markerIndex + marker.length), bucket);
      }
    }

    return stripBucketPrefix(parsedUrl.pathname, bucket);
  } catch {
    return stripBucketPrefix(value, bucket);
  }
};

export const createDocumentSignedUrl = async (value: string) => {
  const path = extractStorageObjectPath(value);

  if (!path) {
    return { path: '', url: null, error: 'Arquivo inválido para visualização.' };
  }

  const { data, error } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .createSignedUrl(path, SIGNED_URL_EXPIRES_IN_SECONDS);

  return {
    path,
    url: data?.signedUrl ?? null,
    error: error?.message ?? null,
  };
};