import { notFound } from 'next/navigation';
import {
  fetchMosqueById,
  fetchMosqueEvents,
  fetchPrayerTimesForMosque,
} from '@/lib/directus-server';
import { MosqueDetailClient } from '@/components/mosque/MosqueDetailClient';

export default async function MosqueDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let mosque;
  try {
    mosque = await fetchMosqueById(id);
  } catch {
    notFound();
  }

  if (!mosque || mosque.status !== 'published') {
    notFound();
  }

  const [prayerTimes, events] = await Promise.all([
    fetchPrayerTimesForMosque(id),
    fetchMosqueEvents(id),
  ]);

  return (
    <MosqueDetailClient
      mosque={mosque}
      mosquePrayerTimes={prayerTimes}
      events={events}
    />
  );
}
