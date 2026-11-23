"""Rebuild the recharge manual using the existing Entradas DOCX components."""
from pathlib import Path
from zipfile import ZipFile
from copy import deepcopy
from hashlib import sha256
from lxml import etree
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
REFERENCE = ROOT / 'docs/manual-usuario-entradas.docx'
SOURCE = ROOT / (sys.argv[1] if len(sys.argv) > 1 else 'docs/manual-usuario-recargas-telorecargo.md')
OUTPUT = SOURCE.with_suffix('.docx')
TMP = ROOT / 'tmp/docx-telorecargo'
W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
NS = {'w': W}

def q(name):
    return f'{{{W}}}{name}'

with ZipFile(REFERENCE) as package:
    entries = [(info, package.read(info.filename)) for info in package.infolist()]
    document_name = next(info.filename for info, _ in entries if info.filename.replace('\\', '/') == 'word/document.xml')
    tree = etree.fromstring(package.read(document_name))
body = tree.find('w:body', NS)
paragraphs = body.findall('w:p', NS)

def style_of(p):
    style = p.find('w:pPr/w:pStyle', NS)
    return style.get(q('val')) if style is not None else 'Normal'

patterns = {style: deepcopy(next(p for p in paragraphs if style_of(p) == style)) for style in ['Title', 'Normal', 'Heading1', 'Caption']}
capture_table = deepcopy(body.find('w:tbl', NS))
section = deepcopy(body.find('w:sectPr', NS))

def paragraph(text, style='Normal'):
    node = deepcopy(patterns[style])
    for child in list(node):
        if child.tag != q('pPr'):
            node.remove(child)
    run = etree.SubElement(node, q('r'))
    # Preserve the original caption/title run treatment exactly.
    original_run = patterns[style].find('w:r/w:rPr', NS)
    if original_run is not None:
        run.append(deepcopy(original_run))
    text_node = etree.SubElement(run, q('t'))
    text_node.set('{http://www.w3.org/XML/1998/namespace}space', 'preserve')
    text_node.text = text
    return node

for child in list(body):
    body.remove(child)
capture_count = 0
heading_count = 0
lines = SOURCE.read_text(encoding='utf-8').splitlines()
for line_index, line in enumerate(lines):
    line = line.strip()
    if not line:
        continue
    if line.startswith('# '):
        body.append(paragraph(line[2:], 'Title'))
    elif line.startswith('## '):
        heading_count += 1
        body.append(paragraph(line[3:], 'Heading1'))
    elif line.startswith('> CAPTURA '):
        capture_count += 1
        body.append(paragraph(line[2:], 'Caption'))
        body.append(deepcopy(capture_table))
        body.append(paragraph(''))
    else:
        node = paragraph(line)
        remaining = [value.strip() for value in lines[line_index+1:] if value.strip()]
        # Keep a procedure together, as well as the final two closing paragraphs.
        if (remaining and re.match(r'^\d+\. ', remaining[0])) or line.startswith(('Sustituye cada recuadro CAPTURA', 'Antes de operar con clientes', 'Sin cambiar datos de producción')):
            props = node.find('w:pPr', NS)
            if props is None:
                props = etree.Element(q('pPr'))
                node.insert(0, props)
            if props.find('w:keepNext', NS) is None:
                etree.SubElement(props, q('keepNext'))
        body.append(node)
body.append(section)
result = etree.tostring(tree, xml_declaration=True, encoding='UTF-8', standalone=True)
with ZipFile(OUTPUT, 'w') as package:
    for info, data in entries:
        package.writestr(info, result if info.filename == document_name else data)

# Prove every reference component outside the intentionally replaced body is intact.
with ZipFile(OUTPUT) as final:
    assert len(final.infolist()) == len(entries)
    for info, data in entries:
        if info.filename != document_name:
            assert final.read(info.filename) == data, info.filename
    out_tree = etree.fromstring(final.read(document_name))
    assert etree.tostring(out_tree.find('w:body/w:sectPr', NS)) == etree.tostring(section)
    assert len(out_tree.findall('w:body/w:tbl', NS)) == capture_count
    assert capture_count > 0

TMP.mkdir(parents=True, exist_ok=True)
(TMP / f'{SOURCE.stem}-artifact.md').write_text(
    '# Contrato del manual de recargas\n\n'
    f'Referencia: {REFERENCE}\nSHA256: {sha256(REFERENCE.read_bytes()).hexdigest()}\n'
    'Referencia renderizada: entradas-reference.pdf, 11 páginas.\n\n'
    'Diseño autorizado por el usuario: copiar el manual de Entradas, incluidos '
    'título y encabezados azules #123A65, Calibri 11, título de 20 puntos, '
    'Heading1 de 14 puntos, Caption cursiva de 10 puntos, A4, márgenes 1134 twips, '
    '7 puntos después de párrafo, 15 antes y 8 después de encabezado. '
    'Se conservan los colores del diseño de referencia por instrucción expresa.\n\n'
    'Capturas: clonar tabla de una celda, ancho 9200 twips, alto mínimo 2400 twips, '
    'borde dashed gris 999999 tamaño 6, fila cantSplit, alineación vertical central, '
    'leyenda gris centrada Inserta aquí tu captura de pantalla. '
    'Leyenda Caption previa con keepNext y párrafo vacío posterior.\n\n'
    f'Contenido final: {heading_count} apartados, pasos numerados como el original, '
    f'{capture_count} espacios de captura. El cuerpo es la única parte sustituida. '
    'Styles, relaciones, propiedades y restantes partes del paquete permanecen idénticas. '
    'La sección se conserva byte a byte en su XML. '
    'La vista previa se exporta con Word porque no está disponible soffice en este runtime.\n', encoding='utf-8')
print(f'{OUTPUT}\n{heading_count} apartados; {capture_count} capturas; componentes de referencia verificados.')
