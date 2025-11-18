import { NextResponse } from "next/server";
import { getAccessToken } from "@/app/lib/google-calendar";

const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || "primary";
const TIMEZONE = process.env.GOOGLE_CALENDAR_TIMEZONE || "America/Bogota";

type BusyTime = { start: string; end: string };

function generateSlots(date: string): Date[] {
  const slots: Date[] = [];
  const base = new Date(`${date}T14:00:00`);

  for (let hour = 14; hour < 19; hour++) {
    for (const minute of [0, 30]) {
      const d = new Date(base);
      d.setHours(hour, minute, 0, 0);
      slots.push(d);
    }
  }

  return slots;
}

function isSlotBusy(slot: Date, busy: BusyTime[]): boolean {
  return busy.some((b) => {
    const start = new Date(b.start);
    const end = new Date(b.end);
    return slot >= start && slot < end;
  });
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");

    if (!date) {
      return NextResponse.json(
        { error: "Falta el parámetro date (YYYY-MM-DD)" },
        { status: 400 }
      );
    }

    const timeMin = new Date(`${date}T00:00:00`);
    const timeMax = new Date(`${date}T23:59:59`);

    const body = {
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      timeZone: TIMEZONE,
      items: [{ id: CALENDAR_ID }],
    };

    const accessToken = await getAccessToken(); // 👈 aquí

    const res = await fetch(
      "https://www.googleapis.com/calendar/v3/freeBusy",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      console.error("Error freeBusy:", data);
      return NextResponse.json(
        { error: "Error leyendo freeBusy", data },
        { status: 500 }
      );
    }

    const busy = (data.calendars?.[CALENDAR_ID]?.busy || []) as BusyTime[];

    const allSlots = generateSlots(date);
    const freeSlots = allSlots.filter((slot) => !isSlotBusy(slot, busy));

    return NextResponse.json({
      date,
      freeSlots: freeSlots.map((d: Date) => d.toISOString()),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
