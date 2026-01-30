import { NextResponse } from "next/server";
import { Resend } from "resend";
import { getUser } from "@/lib/getUser.server";
import ThankYouEmail from "@/components/ThankYouEmail";
import DashboardEmail from "@/components/DashboardEmail";

const resend = new Resend(process.env.NEXT_RESEND_API_KEY);

const FROM = process.env.CONTACT_RECEPIENT!;

/** Topic (select value) → subject, optional direct CC, optional env key for more CC (comma-separated). */
const TOPIC_CONFIG: Record<
  string,
  { subject: string; cc?: string[]; ccEnvKey?: string }
> = {
  "Ho un'idea per la dashboard": {
    subject: "Feedback: Dashboard",
    cc: [
      process.env.CC_DAVIDE!,
      process.env.CC_NICOLO!,
      process.env.CC_ORLANDO!,
    ],
  },
  "Ho un'idea per il sito": {
    subject: "Feedback: Sito",
    cc: [process.env.CC_DAVIDE!, process.env.CC_ORLANDO!],
  },
  "Ho un'idea per l'app": {
    subject: "Feedback: App",
    cc: [
      process.env.CC_DAVIDE!,
      process.env.CC_FILIPPO!,
      process.env.CC_ORLANDO!,
    ],
  },
  Altro: {
    subject: "Feedback: Altro",
    cc: [],
  },
};

function getCcForTopic(topic: string): string[] {
  const config = TOPIC_CONFIG[topic];
  if (!config) return [];
  const direct = config.cc ?? [];
  const fromEnv = config.ccEnvKey
    ? (process.env[config.ccEnvKey] ?? "")
        .split(",")
        .map((e) => e.trim())
        .filter(Boolean)
    : [];
  return [...direct, ...fromEnv];
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { topic, message } = body as { topic?: string; message?: string };

    if (
      !topic ||
      typeof topic !== "string" ||
      !message ||
      typeof message !== "string"
    ) {
      return NextResponse.json(
        { error: "topic e message sono obbligatori" },
        { status: 400 }
      );
    }

    const config = TOPIC_CONFIG[topic];
    if (!config) {
      return NextResponse.json({ error: "topic non valido" }, { status: 400 });
    }

    const to = process.env.CONTACT_RECEPIENT!;
    const cc = getCcForTopic(topic);

    const user = await getUser();
    const userEmail = user?.email ?? null;

    if (userEmail) {
      const thankYou = await resend.emails.send({
        from: FROM,
        to: [userEmail],
        subject: "Grazie per il tuo feedback – Parkito",
        react: ThankYouEmail(),
      });
      if (thankYou.error) {
        console.error("Resend thank-you error:", thankYou.error);
        return NextResponse.json(
          {
            error: thankYou.error.message ?? "Invio email di conferma fallito",
          },
          { status: 500 }
        );
      }
    }

    const { data, error } = await resend.emails.send({
      from: FROM,
      to: [to],
      cc: cc.length > 0 ? cc : undefined,
      subject: config.subject,
      react: DashboardEmail(),
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json(
        { error: error.message ?? "Invio email fallito" },
        { status: 500 }
      );
    }

    return NextResponse.json({ id: data?.id, ok: true });
  } catch (e) {
    console.error("Contact API error:", e);
    return NextResponse.json({ error: "Errore interno" }, { status: 500 });
  }
}
