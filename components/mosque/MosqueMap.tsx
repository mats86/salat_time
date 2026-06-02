'use client';

interface MosqueMapProps {
  lat: number;
  lng: number;
  className?: string;
}

export function MosqueMap({ lat, lng, className }: MosqueMapProps) {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
  const src = key
    ? `https://www.google.com/maps/embed/v1/place?key=${key}&q=${lat},${lng}&zoom=15`
    : `https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed`;

  return (
    <iframe
      title="Mosque location"
      src={src}
      className={className ?? 'w-full h-48 rounded-stitch border border-outline/20'}
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
    />
  );
}
