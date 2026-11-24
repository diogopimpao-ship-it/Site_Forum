/* Configuração do site — é aqui que se ligam os serviços externos. */
window.FM_CONFIG = {
  email: "geral@fmec.tecnico.ulisboa.pt",

  social: {
    instagram: "https://www.instagram.com/forummecanicaist",
    tiktok: "https://www.tiktok.com/@forum.mecanica",
    linkedin: "https://www.linkedin.com/company/f%C3%B3rum-mec%C3%A2nica",
    spotify: "https://open.spotify.com/show/19CFmMdyFE7EVvdEIpD2Dc",
  },

  /* MEMBROS
     Se supabaseUrl + supabaseAnonKey estiverem preenchidos, a lista vem da tabela indicada
     (REST do Supabase, só leitura). Caso contrário usa o members.json do GitHub, como o site antigo.
     Colunas esperadas: name, image_link, team, is_coordinator, is_management, role, email, linkedin.
     A chave "anon" é pública por natureza; NUNCA colocar aqui a service_role key. */
  members: {
    supabaseUrl: "",          // ex.: "https://abcdefgh.supabase.co"
    supabaseAnonKey: "",      // ex.: "eyJhbGciOi..."
    table: "members",
    fallbackUrl: "https://raw.githubusercontent.com/forummecanica/membros/refs/heads/main/members.json",
  },

  /* INSTAGRAM
     Publicações ao vivo pela API oficial da Meta, através da função do Netlify (netlify/functions/instagram.mjs).
     Se a função não existir (pré-visualização local, deploy arrastando a pasta) ou falhar,
     a página inicial mostra as publicações guardadas em data/noticias.json. Ver README. */
  instagram: {
    endpoint: "/api/instagram",
  },

  /* DRIVE
     A página "Drive" lê site/data/drive-index.json, gerado por tools/atualizar_drive.py a partir
     das pastas públicas da Google Drive do curso. Para atualizar: correr o script e voltar a publicar. */

  docs: {
    informacoes: "https://drive.google.com/drive/folders/1AZD9-xWX1x9xYEFOC2dHCnRKAdkIaYYc?usp=sharing",
    regulamento: "https://drive.google.com/drive/folders/1Wxvgnmf2uuoS2AMCKvuaDD8kKsaWN5qR?usp=sharing",
  },
};
