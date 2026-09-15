import { desc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { tickets } from "../../../db/schema";

const allowedStatuses = new Set(["Open", "In progress", "Resolved"]);

export async function GET() {
  try { const rows = await getDb().select().from(tickets).orderBy(desc(tickets.createdAt), desc(tickets.id)).limit(100); return Response.json({ tickets: rows }); }
  catch (error) { console.error("Ticket list failed", error instanceof Error ? error.message : "Unknown database error"); return Response.json({ tickets: [] }); }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json() as { ticketId?: string; status?: string };
    if (!body.ticketId || !body.status || !allowedStatuses.has(body.status)) return Response.json({ error: "Valid ticketId and status are required." }, { status: 400 });
    const [updated] = await getDb().update(tickets).set({ status: body.status }).where(eq(tickets.ticketId, body.ticketId)).returning();
    if (!updated) return Response.json({ error: "Ticket not found." }, { status: 404 });
    return Response.json({ ticket: updated });
  } catch (error) { console.error("Ticket update failed", error instanceof Error ? error.message : "Unknown database error"); return Response.json({ error: "Ticket could not be updated." }, { status: 500 }); }
}
