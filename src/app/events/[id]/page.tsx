import { notFound } from "next/navigation";
import { getEventById } from "@/lib/events/actions";
import { EventDetailClient } from "./event-detail-client";

interface EventDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const { id } = await params;
  const event = await getEventById(id);

  if (!event) {
    notFound();
  }

  return <EventDetailClient initialEvent={event} />;
}
