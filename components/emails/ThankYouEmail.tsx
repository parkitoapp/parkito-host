import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";
import type { UserWithDriver } from "@/types";

type ThankYouEmailProps = {
  user: UserWithDriver;
};

const socialLinks = [
  {
    href: "https://www.instagram.com/parkito.app/",
    src: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/95/Instagram_logo_2022.svg/1200px-Instagram_logo_2022.svg.png",
    alt: "Instagram",
  },
  {
    href: "https://www.facebook.com/parkito.parking",
    src: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/Facebook_f_logo_%282019%29.svg/1024px-Facebook_f_logo_%282019%29.svg.png",
    alt: "Facebook",
  },
  {
    href: "https://www.linkedin.com/company/parkito/",
    src: "https://userimg-assets-eu.customeriomail.com/images/client-env-175495/1737471075798_linkedin_01JJ4NH9P2R088ZCM485EADQGT.png",
    alt: "LinkedIn",
  },
  {
    href: "https://www.tiktok.com/@parkito.app",
    src: "https://userimg-assets-eu.customeriomail.com/images/client-env-175495/1739804525969_tiktok-svgrepo-com_01JMA6WJHE03P9Z95SK3C40VT9.png",
    alt: "TikTok",
  },
];

export default function ThankYouEmail({ user }: ThankYouEmailProps) {
  const displayName =
    [user.driver?.name, user.driver?.surname].filter(Boolean).join(" ") ||
    "utente";

  return (
    <Tailwind>
      <Html>
        <Head />
        <Body
          className="mx-0 my-0 bg-white font-sans text-[18px] text-[#1C1C1C] antialiased"
          style={{ colorScheme: "light dark" }}
        >
          <Container className="mx-auto max-w-[600px] px-4 py-4">
            <Section className="rounded-[30px] bg-[#E5EFFF] px-[30px] py-[30px] shadow-[0_6px_16px_rgba(0,0,0,0.06)] sm:px-8 sm:py-8">
              <Heading className="m-0 mb-5 text-center text-[28px] font-black leading-tight text-[#0D1C73] sm:text-[32px]">
                Grazie per il tuo feedback
              </Heading>

              <Text className="m-0 mb-3 text-[18px] leading-normal text-[#121212] sm:text-lg">
                Ciao{displayName !== "utente" ? ` ${displayName}` : ""},
              </Text>
              <Text className="m-0 mb-3 text-[18px] leading-normal text-[#121212] sm:text-lg">
                Abbiamo ricevuto il tuo messaggio e ti ringraziamo per averci
                scritto. Il nostro team lo leggerà e ti risponderà al più presto.
              </Text>

              <Section className="my-5 rounded-[20px] bg-[#0D1C73] px-4 py-4">
                <Text className="m-0 text-[18px] leading-relaxed text-white sm:text-lg">
                  <strong>Il team Parkito</strong>
                </Text>
              </Section>
            </Section>

            <Hr className="my-[18px] border-0 border-t border-[rgba(0,0,0,0.08)]" />

            <Section className="text-center">
              <Text className="m-0 mb-3 text-[14px] text-[#666666]">
                © 2025 Parkito®. Tutti i diritti riservati.
              </Text>
              <Section className="flex justify-center gap-3">
                {socialLinks.map(({ href, src, alt }) => (
                  <Link
                    key={href}
                    href={href}
                    target="_blank"
                    className="inline-block"
                  >
                    <Img
                      src={src}
                      alt={alt}
                      width={24}
                      height={24}
                      className="block"
                    />
                  </Link>
                ))}
              </Section>
            </Section>
          </Container>
        </Body>
      </Html>
    </Tailwind>
  );
}
