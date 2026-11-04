"""Subset the OFL CJK fonts to the characters the film uses (src/ holds the full downloads, not committed)."""
import os, sys
from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
HERE = os.path.dirname(os.path.abspath(__file__))
CHARS = "江户猫追鱼记一二三四五六七八九十晨市骤雨雪寺稻田山岭怒涛暮归站住终鸢·—！，。、 "
def sub(src, out, inst=None):
    f = TTFont(os.path.join(HERE, 'src', src))
    if inst: f = instancer.instantiateVariableFont(f, inst)
    o = subset.Options(); o.layout_features = ['*']
    s = subset.Subsetter(o); s.populate(text=CHARS); s.subset(f)
    f.save(os.path.join(HERE, out)); print(out, os.path.getsize(os.path.join(HERE, out)))
sub('MaShanZheng-Regular.ttf', 'brush.ttf')
sub('NotoSerifSC.ttf', 'serif-600.ttf', {'wght': 600})
