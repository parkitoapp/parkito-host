import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";
import type { UserWithDriver } from "@/types";

type FileItem = { name: string; key: string };

type DashboardEmailProps = {
  user: UserWithDriver | null;
  topic: string;
  message: string;
  files?: FileItem[];
};

export default function DashboardEmail({
  user,
  topic,
  message,
  files = [],
}: DashboardEmailProps) {
  const fromLabel =
    [user?.driver?.name, user?.driver?.surname].filter(Boolean).join(" ") ||
    "Anonimo";
  const fromEmail = user?.email ?? user?.driver?.email ?? "—";
  const userId = user?.id ?? "—";
  const hasFiles = files.length > 0;

  return (
    <Tailwind>
      <Html>
        <Head />
        <Body className="mx-0 my-0 bg-white font-sans text-[#1C1C1C] text-lg antialiased">
          <Container className="mx-auto max-w-[600px] px-4 py-4">
            <Section className="rounded-[30px] bg-[#E5EFFF] px-6 py-8 shadow-[0_6px_16px_rgba(0,0,0,0.06)] sm:px-8 sm:py-8">
              <Heading className="m-0 mb-5 text-[22px] font-black leading-tight text-[#0D1C73] sm:text-[28px]">
                Nuovo feedback
              </Heading>

              <Section className="space-y-1">
                <Text className="m-0 text-xs font-semibold uppercase tracking-wide text-[#6b7280]">
                  Da
                </Text>
                <Text className="m-0 mb-4 text-[#121212] text-base leading-relaxed sm:text-lg">
                  {fromLabel}
                </Text>

                <Text className="m-0 text-xs font-semibold uppercase tracking-wide text-[#6b7280]">
                  Email
                </Text>
                <Text className="m-0 mb-4 text-[#121212] text-base leading-relaxed sm:text-lg">
                  <Link
                    href={fromEmail !== "—" ? `mailto:${fromEmail}` : "#"}
                    className="text-[#0061D3] no-underline"
                  >
                    {fromEmail}
                  </Link>
                </Text>

                <Text className="m-0 text-xs font-semibold uppercase tracking-wide text-[#6b7280]">
                  ID utente
                </Text>
                <Text className="m-0 mb-4 text-[#121212] text-base leading-relaxed sm:text-lg">
                  {userId}
                </Text>

                <Text className="m-0 text-xs font-semibold uppercase tracking-wide text-[#6b7280]">
                  Argomento
                </Text>
                <Text className="m-0 mb-4 text-[#121212] text-base leading-relaxed sm:text-lg">
                  {topic}
                </Text>

                <Text className="m-0 text-xs font-semibold uppercase tracking-wide text-[#6b7280]">
                  Messaggio
                </Text>
                <Text className="m-0 mb-4 whitespace-pre-wrap text-[#121212] text-base leading-relaxed sm:text-lg">
                  {message}
                </Text>

                {hasFiles && (
                  <>
                    <Text className="m-0 text-xs font-semibold uppercase tracking-wide text-[#6b7280]">
                      Allegati ({files.length})
                    </Text>
                    <Section className="rounded-[20px] bg-[#0D1C73] px-4 py-3">
                      <Text className="m-0 text-white text-base leading-relaxed sm:text-lg">
                        {files.map((f) => f.name).join(", ")}
                      </Text>
                    </Section>
                  </>
                )}
              </Section>

              <Hr className="my-6 border-0 border-t border-black/10" />

              <Text className="m-0 text-center text-sm text-[#666666]">
                Inviato tramite form contatto Parkito Host.
              </Text>
            </Section>
          </Container>
        </Body>
      </Html>
    </Tailwind>
  );
}
