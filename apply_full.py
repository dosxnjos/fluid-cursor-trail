#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Re-tematiza (índigo -> quente) e injeta o fluido (config escolhida) nos DOIS apps.
Sempre parte do backup pristino (pre-fluido) -> idempotente e reversível.
"""
import re, os, glob, shutil, time

HERE = os.path.dirname(os.path.abspath(__file__))
def read(p):
    with open(p, "r", encoding="utf-8", newline="") as f: return f.read()
def write(p, s):
    with open(p, "w", encoding="utf-8", newline="") as f: f.write(s)

TEMPLATE = read(os.path.join(HERE, "fluid_inject_enhanced.txt"))
B64 = read(os.path.join(HERE, "wfe-index.umd.b64")).strip()

TARGETS = [
    (r"C:\Users\Gabriel dos Anjos\coletor-fotos\coletor_fotos.py", "PAGINA_HTML", "coletor_fotos"),
    (r"G:\Meu Drive\Merchan\Obsidian\Produto\Pastas\CADERNOS\GABRIEL\Catalogador\catalogador_interativo.py", "HTML_UI", "catalogador_interativo"),
]

# índigo -> quente (rgba primeiro p/ preservar o alpha; depois hex)
THEME = [
    ("rgba(99, 102, 241",  "rgba(255, 123, 0"),
    ("rgba(99,102,241",    "rgba(255,123,0"),
    ("rgba(129, 140, 248", "rgba(255, 123, 0"),
    ("rgba(129,140,248",   "rgba(255,123,0"),
    ("rgba(165, 180, 252", "rgba(255, 158, 44"),
    ("rgba(165,180,252",   "rgba(255,158,44"),
    ("#6366f1", "#FF7B00"),   # --accent
    ("#4f46e5", "#FF5100"),   # --accent-hover
    ("#8b5cf6", "#FF5100"),   # violeta em gradiente
    ("#818cf8", "#FF7B00"),   # índigo médio
    ("#a5b4fc", "#FFD600"),   # índigo claro -> dourado
    ("#c7d2fe", "#FFD600"),   # índigo muito claro -> dourado
    ("#312e81", "#7c2d12"),   # glow índigo profundo -> âmbar profundo
]

stamp = time.strftime("%Y%m%d-%H%M%S")

for path, var, name in TARGETS:
    if not os.path.exists(path):
        print("!! NAO ENCONTRADO:", path); continue
    folder = os.path.dirname(path)
    baks = sorted(glob.glob(os.path.join(folder, name + ".BACKUP-pre-fluido-*.py")))
    if not baks:
        print("!! sem backup pristino, pulando:", path); continue
    pristine = baks[0]

    # backup do estado ATUAL antes de sobrescrever (não perde nada)
    shutil.copy2(path, os.path.join(folder, name + ".BACKUP-antes-warm-" + stamp + ".py"))
    # restaura o pristino
    shutil.copy2(pristine, path)
    src = read(path)

    # 1) re-tema
    n = 0
    for a, b in THEME:
        c = src.count(a); n += c; src = src.replace(a, b)

    # 1b) seleção de texto (::selection) nas cores quentes
    if "::selection" not in src:
        src = src.replace("</style>",
            "::selection{background:#FF5100;color:#fff;}"
            "::-moz-selection{background:#FF5100;color:#fff;}</style>", 1)

    # 2) injeta o fluido após a string HTML
    m = re.search(r'(?m)^' + re.escape(var) + r'\s*=\s*r?"""', src)
    open_end = m.end(); close_idx = src.index('"""', open_end); insert_at = close_idx + 3
    block = TEMPLATE.replace("__B64__", B64).replace("__VARNAME__", var)
    crlf = src.count("\r\n") > (src.count("\n") - src.count("\r\n"))
    nl = "\r\n" if crlf else "\n"
    block = block.replace("\r\n", "\n").replace("\n", nl)
    src = src[:insert_at] + nl + nl + block + nl + src[insert_at:]

    write(path, src)
    print("OK ->", name, "| substituicoes de cor:", n)
    print("   pristino:", os.path.basename(pristine))
