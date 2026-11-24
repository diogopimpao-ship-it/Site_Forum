#!/usr/bin/env python3
"""Atualiza o índice da Drive usado pelo explorador do site.

Percorre as pastas PÚBLICAS da Google Drive do curso (as pastas-raiz indicadas em ROOTS)
e escreve site/data/drive-index.json com todas as pastas e ficheiros. A página "Drive" do
site lê esse ficheiro: sempre que forem adicionados materiais à Drive, corre este script
e volta a publicar o site.

    python tools/atualizar_drive.py

Não precisa de conta nem de chave: usa a mesma vista pública do "incorporar pasta" da Drive.
Só usa a biblioteca padrão do Python (3.8+).
"""
import concurrent.futures as cf
import datetime
import html
import json
import pathlib
import re
import sys
import time
import unicodedata
import urllib.error
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "site" / "data" / "drive-index.json"

# Pastas-raiz da Drive do curso. A estrutura esperada é:
#   Licenciatura / <ano> / <semestre> / <cadeira> / ...
#   Mestrado / <ramo> / <ano> / <semestre> / <cadeira> / ...
ROOTS = {
    "1Z1_1NTjJjcReMviIHQYnkPIPkeKiJkUc": "Licenciatura",
    "1TMMnf2yCNDgvnJB-Akzg47hrBJaCMo5g": "Mestrado",
}
WORKERS = 6
VIEW = "https://drive.google.com/embeddedfolderview?id={}"

ENTRY = re.compile(r'<div class="flip-entry" id="entry-([^"]+)"(.*?)(?=<div class="flip-entry" id="entry-|</body>)', re.S)
HREF = re.compile(r'<a href="([^"]+)"')
NAME = re.compile(r'<div class="flip-entry-title">(.*?)</div>', re.S)
DATE = re.compile(r'<div class="flip-entry-last-modified"><div>(.*?)</div>', re.S)
MIME = re.compile(r'googleusercontent\.com/\d+/type/([^"?]+)')

EXT_KIND = {
    "pdf": "pdf", "doc": "doc", "docx": "doc", "odt": "doc", "rtf": "doc", "txt": "txt", "md": "txt",
    "xls": "xls", "xlsx": "xls", "xlsm": "xls", "csv": "xls", "ods": "xls", "ppt": "ppt", "pptx": "ppt", "odp": "ppt",
    "png": "img", "jpg": "img", "jpeg": "img", "gif": "img", "webp": "img", "heic": "img", "bmp": "img",
    "mp4": "vid", "mov": "vid", "mkv": "vid", "avi": "vid", "mp3": "aud", "m4a": "aud", "wav": "aud",
    "zip": "zip", "rar": "zip", "7z": "zip", "m": "code", "py": "code", "c": "code", "cpp": "code",
    "ipynb": "code", "tex": "code", "mlx": "code", "slx": "code",
    "sldprt": "cad", "sldasm": "cad", "slddrw": "cad", "step": "cad", "stp": "cad", "dwg": "cad",
}


class Indisponivel(Exception):
    """Pasta privada ou apagada (não vale a pena repetir o pedido)."""


def kind_of(href: str, mime: str, name: str) -> str:
    if "/drive/folders/" in href:
        return "d"
    if "docs.google.com/document" in href:
        return "gdoc"
    if "docs.google.com/spreadsheets" in href:
        return "gsheet"
    if "docs.google.com/presentation" in href:
        return "gslides"
    ext = name.rsplit(".", 1)[-1].lower() if "." in name else ""
    if ext in EXT_KIND:
        return EXT_KIND[ext]
    if mime == "application/pdf":
        return "pdf"
    if mime.startswith("image/"):
        return "img"
    if mime.startswith("video/"):
        return "vid"
    return "file"


MONTHS = {m: i for i, m in enumerate("Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(), 1)}


def iso_date(text: str) -> str:
    """Data da vista em inglês -> 'AAAA-MM-DD'. Devolve '' se não reconhecer.

    A Drive mostra '12/6/24' (mês/dia/ano) para anos anteriores, 'Oct 19' para o ano
    corrente e uma hora ('3:45 PM') para alterações de hoje.
    """
    text = text.strip()
    today = datetime.date.today()
    try:
        m = re.fullmatch(r"(\d{1,2})/(\d{1,2})/(\d{2,4})", text)
        if m:
            mo, d, y = (int(x) for x in m.groups())
            if y < 100:  # '79' é 1979 (ficheiros vindos de arquivos .zip trazem datas de 1979/1980)
                y += 1900 if y >= 70 else 2000
            return datetime.date(y, mo, d).isoformat()
        m = re.fullmatch(r"([A-Z][a-z]{2}) (\d{1,2})", text)
        if m and m.group(1) in MONTHS:
            return datetime.date(today.year, MONTHS[m.group(1)], int(m.group(2))).isoformat()
        if re.fullmatch(r"\d{1,2}:\d{2}\s*[AP]M", text):
            return today.isoformat()
    except ValueError:
        pass
    return ""


def fetch(folder_id: str):
    """Devolve [[id, nome, tipo, data], ...] de uma pasta pública."""
    req = urllib.request.Request(VIEW.format(folder_id), headers={"User-Agent": "Mozilla/5.0", "Accept-Language": "en-US"})
    last = None
    for attempt in range(5):
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                page = r.read().decode("utf-8", "replace")
            if "flip-contents" not in page:
                raise RuntimeError("resposta inesperada")
            break
        except urllib.error.HTTPError as e:
            if e.code in (401, 403, 404):
                raise Indisponivel(f"HTTP {e.code}") from e
            last = e
        except (urllib.error.URLError, RuntimeError, TimeoutError) as e:
            last = e
        time.sleep(2 * (attempt + 1))
    else:
        raise RuntimeError(str(last))
    items = []
    for m in ENTRY.finditer(page):
        fid, body = m.group(1), m.group(2)
        href = HREF.search(body)
        name = NAME.search(body)
        if not href or not name:
            continue
        nm = html.unescape(re.sub(r"<[^>]+>", "", name.group(1))).strip()
        mime = MIME.search(body)
        date = DATE.search(body)
        items.append([fid, nm, kind_of(html.unescape(href.group(1)), mime.group(1) if mime else "", nm), iso_date(date.group(1)) if date else ""])
    return items


def natural(s: str):
    """Chave de ordenação: sem acentos (Álgebra antes de Cálculo) e com números por valor (Teste 2 < Teste 10)."""
    s = "".join(c for c in unicodedata.normalize("NFD", s) if not unicodedata.combining(c))
    return [int(p) if p.isdigit() else p.casefold() for p in re.split(r"(\d+)", s)]


def main() -> int:
    folders, privadas, erros = {}, [], []
    seen = set(ROOTS)
    with cf.ThreadPoolExecutor(WORKERS) as pool:
        pending = {pool.submit(fetch, fid): (fid, name, None) for fid, name in ROOTS.items()}
        while pending:
            done, _ = cf.wait(pending, return_when=cf.FIRST_COMPLETED)
            for fut in done:
                fid, name, parent = pending.pop(fut)
                try:
                    items = fut.result()
                except Indisponivel as e:
                    privadas.append((fid, name, str(e)))
                    continue
                except Exception as e:  # noqa: BLE001
                    erros.append((fid, name, str(e)))
                    continue
                items.sort(key=lambda it: (it[2] != "d", natural(it[1])))
                folders[fid] = {"n": name, "p": parent, "c": items}
                for it in items:
                    if it[2] == "d" and it[0] not in seen:
                        seen.add(it[0])
                        pending[pool.submit(fetch, it[0])] = (it[0], it[1], fid)
                if len(folders) % 100 == 0:
                    print(f"  {len(folders)} pastas…", flush=True)

    if erros:
        print(f"ERRO: {len(erros)} pastas não puderam ser lidas (falha temporária?). O índice NÃO foi alterado.")
        for fid, name, err in erros:
            print(f"  - {name} ({fid}): {err}")
        return 1

    # pastas privadas/apagadas: retirar das listagens para não aparecerem no site
    gone = {fid for fid, _, _ in privadas}
    for f in folders.values():
        f["c"] = [it for it in f["c"] if it[0] not in gone]

    n_files = sum(1 for f in folders.values() for it in f["c"] if it[2] != "d")
    OUT.write_text(json.dumps({"gerado": datetime.date.today().isoformat(), "pastas": folders}, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"{len(folders)} pastas, {n_files} ficheiros -> {OUT.relative_to(ROOT)} ({OUT.stat().st_size // 1024} KB)")
    if privadas:
        print(f"Aviso: {len(privadas)} pastas privadas ou apagadas foram ignoradas:")
        for fid, name, err in privadas:
            print(f"  - {name} ({fid}): {err}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
