import Link from 'next/link';
import { fetchMosqueById, fetchPrayerTimesForMosque } from '@/lib/directus-server';
import { MosqueBadges } from '@/components/mosque/MosqueBadges';
import { MosqueMap } from '@/components/mosque/MosqueMap';
import { Card } from '@/components/ui/Card';
import { notFound } from 'next/navigation';

export default async function MosqueDetailPage({
  params,
}: {
  params: { id: string };
}) {
  let mosque;
  try {
    mosque = await fetchMosqueById(params.id);
  } catch {
    notFound();
  }
  const prayerTimes = await fetchPrayerTimesForMosque(params.id);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-outline/20 px-4 py-4 flex items-center gap-3">
        <Link href="/" className="text-gold">
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <h1 className="font-headline text-xl text-pale">{mosque.name}</h1>
      </header>
      <main className="mx-auto max-w-lg px-4 py-6 space-y-6">
        {mosque.latitude && mosque.longitude && (
          <MosqueMap lat={mosque.latitude} lng={mosque.longitude} className="w-full h-56" />
        )}
        <Card className="p-4">
          <p className="text-on-surface-variant text-sm">{mosque.address}</p>
          <div className="mt-4">
            <MosqueBadges mosque={mosque} />
          </div>
        </Card>
        {prayerTimes && (
          <Card className="p-4">
            <h2 className="font-headline text-gold mb-3">Prayer Times</h2>
            <dl className="grid grid-cols-2 gap-2 text-sm">
              {(['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const).map((key) => (
                <div key={key} className="flex justify-between">
                  <dt className="text-on-surface-variant capitalize">{key}</dt>
                  <dd className="text-pale">{prayerTimes[key] ?? '—'}</dd>
                </div>
              ))}
            </dl>
          </Card>
        )}
      </main>
    </div>
  );
}
