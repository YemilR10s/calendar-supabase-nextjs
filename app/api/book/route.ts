// app/api/book/route.ts
import { NextResponse } from "next/server";
import { getAccessToken } from "@/app/lib/google-calendar";

const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || "primary";
const TIMEZONE = process.env.GOOGLE_CALENDAR_TIMEZONE || "America/Bogota";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { start, end, name, email } = body;

    if (!start || !end || !name || !email) {
      return NextResponse.json(
        { error: "Faltan campos: start, end, name, email" },
        { status: 400 }
      );
    }

    const eventBody = {
      summary: `Cita con ${name}`,
      description: `Reservado desde la landing.\nEmail: ${email}`,
      start: { dateTime: start, timeZone: TIMEZONE },
      end: { dateTime: end, timeZone: TIMEZONE },
      attendees: [{ email }],
    };

    const accessToken = await getAccessToken();

    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${CALENDAR_ID}/events`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventBody),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      console.error("Error creando evento", data);
      return NextResponse.json({ error: "Error creando evento", data }, { status: 500 });
    }

    return NextResponse.json({ ok: true, eventId: data.id, link: data.htmlLink });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

