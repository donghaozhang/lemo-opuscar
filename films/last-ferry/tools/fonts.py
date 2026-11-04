"""Subset the project's fonts to what the film uses: python tools/fonts.py (run from the project folder's parent or anywhere)
Noto Serif SC (variable) → static weights 500/700 subset to the film's characters; Cinzel 500 Latin subset. Writes fonts/*.woff2 + fonts/fonts.css"""
import os, re, sys
from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); F = os.path.join(HERE, 'fonts'); SRC = os.path.join(F, 'src')
# every string in timeline.js + ui.js + a safety set
chars = set()
for fn in ['timeline.js', 'ui.js', 'portraits.js', 'town.js']:
    p = os.path.join(HERE, fn)
    if os.path.exists(p): chars |= set(re.sub(r'[\x00-\x7f]', '', open(p, encoding='utf-8').read()))
chars |= set('最后一班渡船清晨正午黄昏夜黎明小石老周新娘伯母亲爷明天还有船吗就走桥啦吃喜糖末了嗯上师傅烧得厉害给你谢卫生所渡口一二三四五六七八九十零第章剧终，。！？、：「」…')
chars -= set(' \n\t\r')
text = ''.join(sorted(chars)) + '0123456789'
open(os.path.join(F, 'chars.txt'), 'w', encoding='utf-8').write(text)
print(len(text), 'characters')
def inst(src, wght, out):
    f = TTFont(src); f = instancer.instantiateVariableFont(f, {'wght': wght}); f.save(out)
os.makedirs(os.path.join(F, 'tmp'), exist_ok=True)
css = []
for wght, name in [(500, 'sc5'), (700, 'sc7')]:
    tmp = os.path.join(F, 'tmp', f'{name}.ttf'); inst(os.path.join(SRC, 'NotoSerifSC[wght].ttf'), wght, tmp)
    subset.main([tmp, f'--text={text}', '--flavor=woff2', f'--output-file={os.path.join(F, name + ".woff2")}', '--layout-features=*', '--no-hinting'])
    css.append(f"@font-face{{font-family:'Noto Serif SC';font-weight:{wght};font-display:block;src:url({name}.woff2) format('woff2')}}")
for wght, name, src in [(500, 'cz5', 'Cinzel[wght].ttf'), (500, 'cg5', 'CormorantGaramond[wght].ttf')]:
    tmp = os.path.join(F, 'tmp', f'{name}.ttf'); inst(os.path.join(SRC, src), wght, tmp)
    subset.main([tmp, '--unicodes=U+0020-007E,U+00B7,U+2013,U+2014,U+2018-201D,U+2026', '--flavor=woff2', f'--output-file={os.path.join(F, name + ".woff2")}', '--no-hinting'])
    fam = 'Cinzel' if name == 'cz5' else 'Cormorant Garamond'
    css.append(f"@font-face{{font-family:'{fam}';font-weight:{wght};font-display:block;src:url({name}.woff2) format('woff2')}}")
open(os.path.join(F, 'fonts.css'), 'w').write('\n'.join(css) + '\n')
import shutil; shutil.rmtree(os.path.join(F, 'tmp'))
for n in os.listdir(F): p = os.path.join(F, n); os.path.isfile(p) and print(n, os.path.getsize(p))
