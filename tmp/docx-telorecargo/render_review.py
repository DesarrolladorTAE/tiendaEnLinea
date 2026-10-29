from pathlib import Path
from pdf2image import convert_from_path
from PIL import Image, ImageOps, ImageDraw
import pdfplumber
import sys

root = Path('C:/Users/resid/Documents/MTELMX')
stem = sys.argv[1]
pdf = root / f'tmp/docx-telorecargo/{stem}.pdf'
out = root / f'tmp/docx-telorecargo/{stem}-pages'
out.mkdir(exist_ok=True)
pages = convert_from_path(pdf, dpi=110, poppler_path='C:/Users/resid/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/poppler/Library/bin')
montage = Image.new('RGB', (4 * 350, ((len(pages)+3)//4) * 510), '#dce4ed')
for i, image in enumerate(pages):
    image.save(out / f'page-{i+1}.png')
    montage.paste(ImageOps.contain(image, (330, 480)), ((i%4)*350+10, (i//4)*510+10))
    ImageDraw.Draw(montage).text(((i%4)*350+12, (i//4)*510+490), str(i+1), fill='#20334c')
montage.save(out / 'montage.png')
with pdfplumber.open(pdf) as document:
    for i, page in enumerate(document.pages):
        text = page.extract_text() or ''
        words = page.extract_words()
        assert words, f'Blank page {i+1}'
        assert min(w['x0'] for w in words) > 45
        assert max(w['x1'] for w in words) < page.width - 45
        assert max(w['bottom'] for w in words) < page.height - 40
        print(i+1, text[:65].replace('\n', ' / '), '...', text[-85:].replace('\n', ' / '))
print(f'{len(pages)} pages rendered to {out}')
