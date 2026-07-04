import { getServerSession } from "next-auth";

import { authConfig } from "@/features/auth/server/auth-config";
import { subscribe } from "@/server/realtime/inbox-hub";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HEARTBEAT_INTERVAL_MS = 25_000;

export async function GET(request: Request) {
  const session = await getServerSession(authConfig);
  const email = session?.user?.email;

  if (!email) {
    return new Response("Unauthorized", { status: 401 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false;
      // let heartbeat: ReturnType<typeof setInterval> | undefined;
      // let unsubscribe: () => void = () => {};

      let unsubscribe: () => void = () => {};
      const cleanup = () => {
        if (closed) {
          return;
        }

        closed = true;

        clearInterval(heartbeat);
        unsubscribe();
        request.signal.removeEventListener("abort", cleanup);

        try {
          controller.close();
        } catch {
          // stream already closed
        }
      };

      const send = (payload: string) => {
        if (closed) {
          return;
        }
        try {
          controller.enqueue(encoder.encode(payload));
        } catch {
          cleanup();
        }
      };

      unsubscribe = subscribe(email, (event) => {
        send(`event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`);
      });

      const heartbeat = setInterval(() => {
        send(": heartbeat\n\n");
      }, HEARTBEAT_INTERVAL_MS);

      request.signal.addEventListener("abort", cleanup);

      send(": connected\n\n");
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
