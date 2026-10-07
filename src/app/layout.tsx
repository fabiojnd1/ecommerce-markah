import { WHATSAPP_NUMBER, getSiteUrl, getSiteMetadataBase } from "@/lib/site-config";
import type { Metadata } from "next";
import { Inter, Sora } from "next/font/google";
import { JsonLd } from "@/components/loja/json-ld";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});

const sora = Sora({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-sora",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Markah Brasil — Decoração e Design em Impressão 3D",
    template: "%s | Markah Brasil",
  },
  description:
    "Loja virtual própria da Markah Brasil. Luminárias de mesa, pendentes, vasos e objetos decorativos exclusivos impressos em 3D de alta precisão. 5% de desconto no Pix e frete grátis acima de R$ 200.",
  keywords: [
    "impressão 3d",
    "decoração sustentável",
    "luminárias 3d",
    "luminária de mesa",
    "pendente origami",
    "vasos 3d",
    "design autoral",
    "markah brasil",
    "letras-caixa",
    "filamento pla",
    "iluminação contemporânea",
  ],
  authors: [{ name: "Markah Brasil", url: "https://markah.com.br" }],
  creator: "Markah Brasil",
  publisher: "Markah Brasil",
  metadataBase: getSiteMetadataBase(),
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/brand/favicon-32.png", type: "image/png", sizes: "32x32" },
      { url: "/brand/icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/brand/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: { url: "/brand/apple-touch-icon.png", sizes: "180x180" },
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "https://markah.com.br",
    siteName: "Markah Brasil",
    title: "Markah Brasil — Decoração e Design em Impressão 3D",
    description:
      "Peças decorativas autorais impressas em 3D no Brasil. 5% de desconto no Pix, até 3x sem juros no cartão e frete grátis acima de R$ 200.",
    images: [
      {
        url: "/brand/markah-og.png",
        width: 1200,
        height: 630,
        alt: "Markah Brasil — Design Autoral em Impressão 3D",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Markah Brasil — Decoração e Design em Impressão 3D",
    description:
      "Luminárias, pendentes e vasos autorais impressos em 3D. 5% de desconto no Pix e frete grátis acima de R$ 200.",
    images: ["/brand/markah-og.png"],
    creator: "@markah_br",
  },
};

const baseUrl = getSiteUrl();

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${baseUrl}/#organization`,
  name: "Markah Brasil",
  url: baseUrl,
  logo: `${baseUrl}/brand/markah-logo.png`,
  description:
    "Estúdio brasileiro de design autoral e fabricação digital em impressão 3D sustentável.",
  sameAs: [
    "https://instagram.com/markah_br",
    `https://wa.me/${WHATSAPP_NUMBER}`,
  ],
  contactPoint: {
    "@type": "ContactPoint",
    telephone: `+${WHATSAPP_NUMBER}`,
    contactType: "customer service",
    areaServed: "BR",
    availableLanguage: "Portuguese",
  },
};

const webSiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${baseUrl}/#website`,
  url: baseUrl,
  name: "Markah Brasil",
  description: "Loja virtual de iluminação contemporânea e decoração em impressão 3D.",
  publisher: {
    "@id": `${baseUrl}/#organization`,
  },
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${baseUrl}/produtos?search={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

const storeSchema = {
  "@context": "https://schema.org",
  "@type": "OnlineStore",
  "@id": `${baseUrl}/#store`,
  name: "Markah Brasil",
  url: baseUrl,
  priceRange: "$$",
  currenciesAccepted: "BRL",
  paymentAccepted: "Credit Card, Pix",
  parentOrganization: {
    "@id": `${baseUrl}/#organization`,
  },
};

// FAQ Schema estruturado para captura em IA Search (Google Gemini Overviews, Perplexity e ChatGPT)
const storeFaqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "O que é a Markah Brasil e como as peças são fabricadas?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "A Markah Brasil é uma marca brasileira de design autoral e decoração que produz luminárias, pendentes, vasos e objetos decorativos por meio de impressão 3D de alta precisão (manufatura aditiva), utilizando filamentos ecológicos sob demanda.",
      },
    },
    {
      "@type": "Question",
      name: "Quais materiais são utilizados nos produtos da Markah?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Utilizamos filamentos PLA (bioplástico biodegradável de fontes vegetais renováveis como amido de milho) e PETG (polímero de alta resistência mecânica e térmica 100% reciclável).",
      },
    },
    {
      "@type": "Question",
      name: "Qual é o prazo de confecção e entrega dos pedidos?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Como as peças são impressas sob demanda para garantir acabamento perfeito e sem desperdício de estoque, o prazo padrão de produção é de 3 dias úteis, somado ao prazo de frete dos Correios (SEDEX/PAC) ou transportadora.",
      },
    },
    {
      "@type": "Question",
      name: "Quais são as condições de pagamento e frete grátis?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Oferecemos 5% de desconto automático para pagamentos via Pix com aprovação imediata e parcelamento em até 3x sem juros no cartão de crédito. Pedidos com valor a partir de R$ 200,00 contam com Frete Grátis para todo o território nacional.",
      },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${sora.variable}`}>
      <head>
        <JsonLd schema={organizationSchema} />
        <JsonLd schema={webSiteSchema} />
        <JsonLd schema={storeSchema} />
        <JsonLd schema={storeFaqSchema} />
      </head>
      <body className="min-h-screen bg-bg text-text font-sans antialiased flex flex-col selection:bg-magenta/20 selection:text-ink">
        {children}
      </body>
    </html>
  );
}
