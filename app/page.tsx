"use client";

import { useState } from "react";

export default function Page() {
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  async function loadSlots() {
    if (!date) return;
    setLoading(true);
    setMessage("");
    const res = await fetch(`/api/slots?date=${date}`);
    const data = await res.json();
    setSlots(data.freeSlots || []);
    setLoading(false);
  }

  async function book(slot: string) {
    if (!name || !email) {
      alert("Pon tu nombre y email primero");
      return;
    }

    const start = new Date(slot);
    const end = new Date(start);
    end.setMinutes(start.getMinutes() + 30); // 30 minutos

    const res = await fetch("/api/book", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        start: start.toISOString(),
        end: end.toISOString(),
        name,
        email,
      }),
    });

    const data = await res.json();

    if (data.ok) {
      setMessage("Cita reservada ✅");
    } else {
      setMessage("Error al reservar ❌");
      console.log(data);
    }
  }

  return (
    <main className="w-full h-screen flex justify-center items-center">
      <div className="border border-white p-8">
          <h1>Agenda tu cita (demo muy básica)</h1>

          <div style={{ marginTop: 16, marginBottom: 16 }}>
            <label>
              Nombre:
              <input className="border border-white" value={name} onChange={(e) => setName(e.target.value)} />
            </label>
            <br />
            <label>
              Email:
              <input className="border border-white" value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
          </div>

          <div>
            <input className="border border-white"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
            <button onClick={loadSlots} disabled={!date || loading}>
              {loading ? "Cargando..." : "Ver horarios"}
            </button>
          </div>

          <div style={{ marginTop: 24 }}>
            {slots.length === 0 && !loading && <p>No hay horarios libres o no buscaste aún.</p>}
            {slots.map((slot) => {
              const d = new Date(slot);
              const label = d.toLocaleTimeString("es-CO", {
                hour: "2-digit",
                minute: "2-digit",
              });
              return (
                <button
                  key={slot}
                  style={{ display: "block", marginBottom: 8 }}
                  onClick={() => book(slot)}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {message && <p style={{ marginTop: 16 }}>{message}</p>}
      </div>
    </main>
  );
}
