# Site Fórum Mecânica (NEMIST)

Site estático (HTML + CSS + JS, sem build) para alojar no Netlify gratuito.

## Estrutura

```
site/
  index.html, equipa.html, mecanist.html, oportunidades.html, drive.html
  css/style.css        estilos de todo o site
  js/config.js         ligações a serviços externos (Supabase, Instagram, redes sociais)
  js/site.js           cabeçalho, rodapé, ícones e utilitários partilhados
  js/pages.js          lógica de cada página
  data/*.json          conteúdos editáveis (publicações, oportunidades, MecanIST, índice da Drive)
tools/atualizar_drive.py   gera site/data/drive-index.json a partir da Google Drive do curso
netlify/functions/instagram.mjs   função do Netlify que lê o Instagram (API oficial da Meta)
netlify.toml, package.json        configuração do Netlify e dependência da função
```

## Ver localmente

```bash
python -m http.server 8765 --directory site
```

Abrir http://localhost:8765 (abrir os ficheiros diretamente com duplo clique não funciona, porque os dados são lidos por `fetch`).

## Publicar no Netlify

- **Recomendado (necessário para o Instagram ao vivo):** pôr esta pasta inteira num repositório GitHub e, em app.netlify.com → *Add new site* → *Import an existing project*, escolher esse repositório. O `netlify.toml` já diz tudo ao Netlify (pasta `site` + função do Instagram); cada `git push` publica automaticamente.
- **Rápido:** *Add new site* → *Deploy manually* → arrastar a pasta `site`. Funciona, mas sem a função: a secção do Instagram mostra as publicações guardadas em `data/noticias.json`.

Depois é só apontar o domínio `forummecanica.com` para o Netlify (Domain settings).

## Atualizar conteúdos

| O quê | Onde |
|---|---|
| Publicações na página inicial ("Eventos e novidades") | `site/data/noticias.json` (a primeira da lista é a mais recente; só aparecem as 10 primeiras) |
| Fotos dos cartões dos pelouros (Equipa) | lista `GROUPS` em `site/js/pages.js` |
| Oportunidades | `site/data/oportunidades.json` |
| Programa e oradores do MecanIST | `site/data/mecanist.json` |
| Empresas e patrocinadores do MecanIST | `site/data/mecanist-empresas.json` |
| Drive (pastas e ficheiros) | correr `python tools/atualizar_drive.py` (ver abaixo) |

### Oportunidades — campos

```json
{ "empresa": "Empresa X", "tipo": "estagio", "logo": "https://.../logo.png",
  "titulo": "Estágio de verão em CFD", "area": "energia",
  "descricao": "Texto curto.", "local": "Lisboa", "prazo": "2027-01-31", "url": "https://..." }
```

Só `empresa` e `tipo` são obrigatórios. `tipo`: `emprego`, `estagio`, `tese`, `embaixadores`, `bolsa`.
`area`: `energia`, `producao`, `sistemas`, `multidisciplinar` — o filtro por área aparece sozinho assim que alguma oportunidade tiver este campo.
Sem `url`, o botão do card passa a "Pedir informação" (email para o núcleo).

## Drive de Mecânica (explorador + leitor)

A página `drive.html` mostra as pastas e os ficheiros da Google Drive do curso **dentro do site**: navega-se por ano → semestre → cadeira → pastas, há pesquisa por cadeira ou nome de ficheiro, e os documentos (PDF, imagens, Word, Excel, PowerPoint…) abrem num leitor próprio, sem ir para a Drive.

Como funciona:

- O site não fala com a Drive em tempo real. Lê `site/data/drive-index.json`, uma lista de todas as pastas e ficheiros.
- Essa lista é gerada pelo script `tools/atualizar_drive.py`, que percorre as duas pastas públicas (Licenciatura e Mestrado, definidas em `ROOTS` no topo do script). Não precisa de conta Google nem de chave.
- O leitor usa a pré-visualização da própria Google (`drive.google.com/file/d/…/preview`) dentro de uma janela do site.

**Sempre que forem adicionados materiais à Drive**, atualizar o índice e voltar a publicar:

```bash
python tools/atualizar_drive.py
```

Regras para a Drive continuar a aparecer bem no site:

- A estrutura tem de ser `Licenciatura / <ano> / <semestre> / <cadeira>` e `Mestrado / <ramo> / <ano> / <semestre> / <cadeira>`. As pastas chamadas "1º Ano", "2º Semestre", etc. são tratadas como níveis de organização; tudo o resto é cadeira.
- As pastas e os ficheiros têm de estar partilhados como "qualquer pessoa com o link". Pastas privadas são ignoradas pelo script (ele avisa quais) e ficheiros privados não abrem no leitor.

## Membros a partir do Supabase

Por omissão a lista vem do `members.json` do GitHub (igual ao site antigo). Para usar o Supabase:

1. Criar a tabela (SQL Editor):

```sql
create table public.members (
  id bigint generated always as identity primary key,
  name text not null,
  image_link text,
  team text,              -- DEEM, FC, IT, Marketing, MecanIST, RD, REI, CFD, MAG, Presidência, 11o
  is_coordinator boolean default false,
  is_management boolean default false,
  role text,
  email text,
  linkedin text
);
alter table public.members enable row level security;
create policy "leitura publica" on public.members for select to anon using (true);
```

2. Importar os membros atuais: *Table Editor → Insert → Import data from CSV* (converter o `members.json` para CSV) ou colar as linhas à mão.
3. Em `site/js/config.js`, preencher `supabaseUrl` e `supabaseAnonKey` (*Project Settings → API*). Usar só a chave **anon**; nunca a `service_role`.

Tudo o que estiver nesta tabela fica público (nomes, emails, LinkedIn), tal como já está hoje.

## Instagram ao vivo (API oficial da Meta, grátis)

A página inicial mostra as últimas 12 publicações do `@forummecanicaist`, lidas pela **Instagram API with Instagram Login** da Meta, que é gratuita. Quem lê a API é uma função do Netlify (`netlify/functions/instagram.mjs`, em `/api/instagram`), para o token nunca ficar visível no site. A resposta fica em cache 30 minutos, por isso o Instagram é consultado poucas vezes e o plano grátis do Netlify chega. Se a função não estiver disponível ou falhar, o site mostra as publicações de `data/noticias.json`.

Configuração (uma vez, ~15 min, feita por quem gere o Instagram do núcleo):

1. **Conta profissional:** na app do Instagram → Definições → *Tipo de conta e ferramentas* → mudar para conta **Profissional** (Criador ou Empresa). É grátis e não precisa de página do Facebook.
2. **App na Meta:** em https://developers.facebook.com → *My Apps* → *Create App* → tipo **Business**. Na app, adicionar o produto **Instagram**.
3. **Token:** no menu da app, *Instagram* → *API setup with Instagram business login* → *Generate token* ao lado da conta do núcleo → entrar no Instagram → copiar o token. Este token dura 60 dias; a função renova-o sozinha.
4. **Netlify:** no site do Netlify → *Site configuration* → *Environment variables* → *Add a variable*: nome `INSTAGRAM_TOKEN`, valor = o token. Depois *Deploys* → *Trigger deploy*.
5. Abrir `https://<o-vosso-site>/api/instagram`: deve aparecer uma lista `posts`. A página inicial passa a usá-la sozinha.

Notas:
- O token é como uma palavra-passe só de leitura: não o ponham em ficheiros do site nem no GitHub, só na variável do Netlify.
- A função renova o token de 7 em 7 dias (guarda o novo no Netlify Blobs). Se o site estiver mais de 60 dias sem visitas, o token expira: basta gerar outro (passo 3) e substituir a variável (passo 4).
- Se um dia trocarem o token na variável, a função passa a usar o novo automaticamente.

## Equipa (pop-ups)

A página Equipa mostra um cartão por órgão social e por pelouro; ao carregar num cartão abre um pop-up com os membros (foto, cargo, email, LinkedIn). Cada pop-up tem um endereço próprio para partilhar, por exemplo `equipa.html#rei` ou `equipa.html#direcao`.

## Animações

As animações (entrada do título, números a contar, secções a aparecer com o scroll, parallax nas fotos, barra de progresso no topo) usam a biblioteca GSAP, carregada do cdnjs. Se não carregar, ou se o visitante tiver "reduzir movimento" ativo no sistema, o site aparece normalmente, sem animações.

## A saber

- As imagens (logótipos, fotos das notícias, logo do núcleo) continuam alojadas no Wix (`static.wixstatic.com`). **Se a conta Wix for cancelada, deixam de aparecer** — antes disso é preciso copiá-las para `site/img/` e atualizar os caminhos.
- As fotos dos membros estão no Imgur, como no site antigo.
- A versão em inglês do site antigo ainda não foi portada.
