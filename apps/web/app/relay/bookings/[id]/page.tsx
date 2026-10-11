import { RelayBookingClient } from './booking-client';

export default async function RelayBookingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <RelayBookingClient bookingId={id} />;
}
