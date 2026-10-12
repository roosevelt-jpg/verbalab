import { NextResponse } from 'next/server';
import { fileSupportTicket } from '@/lib/support-store';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  let body: {
    email?: string;
    subject?: string;
    category?: string;
    message?: string;
    orgId?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: { message: 'Invalid JSON' } }, { status: 400 });
  }

  const message = typeof body.message === 'string' ? body.message.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const subject = typeof body.subject === 'string' ? body.subject.trim() : '';
  if (!message) {
    return NextResponse.json({ error: { message: 'message required' } }, { status: 400 });
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: { message: 'valid email required' } }, { status: 400 });
  }

  const ticket = await fileSupportTicket({
    message,
    email,
    subject: subject || 'Support message',
    category: body.category,
    orgId: body.orgId,
    reason: 'support_page_message',
    source: 'support_page',
  });

  return NextResponse.json({
    ok: true,
    ticketId: ticket.id,
    status: ticket.status,
    reply:
      'Message received. A Lugemi human will follow up by email. Your ticket id is below — keep it for reference.',
  });
}
