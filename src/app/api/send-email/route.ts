import { Resend } from 'resend';
import { NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { to, subject, html } = await request.json();

    if (!to || !subject || !html) {
      return NextResponse.json(
        { error: 'Missing required fields: to, subject, html' },
        { status: 400 }
      );
    }

    const { data, error } = await resend.emails.send({
      from: 'ThalirVerse <onboarding@resend.dev>',
      to,
      subject,
      html,
    });

    if (error) {
      console.error('[Resend Error]', error);
      return NextResponse.json({ error }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error('[Send Email Route Error]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
