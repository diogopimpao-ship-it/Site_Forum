/* Últimas publicações do Instagram do núcleo, via API oficial da Meta ("Instagram API with Instagram Login").
   Gratuita. Corre no Netlify (plano grátis) em /api/instagram; o site lê daqui e, se falhar, usa data/noticias.json.

   Configuração: variável de ambiente INSTAGRAM_TOKEN no Netlify (token gerado no painel da app Meta).
   O token dura 60 dias; esta função renova-o sozinha (de 7 em 7 dias) e guarda o novo no Netlify Blobs.
   O token nunca chega ao browser. */
import { getStore } from "@netlify/blobs";

const API = "https://graph.instagram.com";
const FIELDS = "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp";
const DAY = 86400000;
const LIMIT = 12;

const reply = (body, status = 200, cdnSeconds = 1800) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=300",
      // a CDN do Netlify guarda a resposta: o Instagram é consultado no máximo de 30 em 30 min
      "Netlify-CDN-Cache-Control": `public, s-maxage=${cdnSeconds}, stale-while-revalidate=86400`,
    },
  });

async function getJson(url) {
  const r = await fetch(url);
  const d = await r.json().catch(() => ({}));
  if (!r.ok || d.error) throw new Error((d.error && d.error.message) || `HTTP ${r.status}`);
  return d;
}

// Token atual: o renovado (Blobs) ou, se o INSTAGRAM_TOKEN do Netlify foi trocado entretanto, o novo.
async function currentToken(store) {
  const seed = process.env.INSTAGRAM_TOKEN;
  if (!seed) return null;
  let saved = null;
  try { saved = await store.get("token", { type: "json" }); } catch { /* sem Blobs: usa o token da variável */ }
  if (!saved || saved.seed !== seed) {
    saved = { token: seed, seed, refreshedAt: Date.now() };
    await store.setJSON("token", saved).catch(() => {});
  }
  if (Date.now() - saved.refreshedAt > 7 * DAY) {
    try {
      const d = await getJson(`${API}/refresh_access_token?grant_type=ig_refresh_token&access_token=${encodeURIComponent(saved.token)}`);
      saved = { ...saved, token: d.access_token, refreshedAt: Date.now() };
      await store.setJSON("token", saved);
    } catch (e) {
      console.warn("Instagram: não foi possível renovar o token:", e.message);
    }
  }
  return saved.token;
}

export default async () => {
  const store = getStore("instagram");
  const token = await currentToken(store);
  if (!token) return reply({ error: "Falta configurar INSTAGRAM_TOKEN no Netlify." }, 503, 60);

  const url = (fields) => `${API}/me/media?fields=${fields}&limit=${LIMIT}&access_token=${encodeURIComponent(token)}`;
  let data;
  try {
    data = await getJson(url(FIELDS));
  } catch (e) {
    // se algum campo não estiver disponível para esta conta, tenta sem a legenda
    try { data = await getJson(url(FIELDS.replace("caption,", ""))); }
    catch (e2) {
      console.error("Instagram:", e2.message);
      return reply({ error: "Não foi possível ler o Instagram." }, 502, 60);
    }
  }

  const posts = (data.data || [])
    .map((m) => ({
      id: m.id,
      type: m.media_type, // IMAGE | VIDEO | CAROUSEL_ALBUM
      image: m.media_type === "VIDEO" ? m.thumbnail_url || m.media_url : m.media_url || m.thumbnail_url,
      caption: m.caption || "",
      url: m.permalink,
      date: m.timestamp,
    }))
    .filter((p) => p.image && p.url);

  return reply({ posts });
};

export const config = { path: "/api/instagram" };
