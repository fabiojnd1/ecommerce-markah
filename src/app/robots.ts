import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://markah.com.br";

  const publicDisallowed = [
    "/admin/",
    "/conta/",
    "/api/",
    "/checkout/",
    "/carrinho/",
  ];

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: publicDisallowed,
      },
      // Permissões explícitas para crawlers e mecanismos de busca de Inteligência Artificial
      {
        userAgent: [
          "Google-Extended",
          "GPTBot",
          "OAI-SearchBot",
          "PerplexityBot",
          "ClaudeBot",
          "Applebot-Extended",
        ],
        allow: [
          "/",
          "/produtos",
          "/produtos/*",
          "/luminarias-de-mesa",
          "/pendentes",
          "/vasos",
          "/cachepos",
          "/plantarios",
          "/organizadores",
          "/letras-caixa",
          "/sobre",
          "/materiais",
          "/tecnologia-3d",
          "/contato",
          "/envio",
          "/trocas",
          "/termos",
          "/privacidade",
          "/llms.txt",
          "/llms-full.txt",
        ],
        disallow: publicDisallowed,
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
