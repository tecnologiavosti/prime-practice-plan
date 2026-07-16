export function slugify(text: string): string {
  return (text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

const UUID_RE = /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;

export function makeProfessionalSlug(id: string, name: string): string {
  const s = slugify(name);
  return s ? `${s}-${id}` : id;
}

export function extractUuidFromSlug(slug: string): string | null {
  if (!slug) return null;
  const m = slug.match(UUID_RE);
  if (m) return m[1];
  // fallback: slug is exactly a UUID
  if (/^[0-9a-f-]{36}$/i.test(slug)) return slug;
  return null;
}
