import json,sys
T=json.load(open(__file__.replace('tl.py','timeline.json')))
def build():
    t=0; shots={}; order=[]; secs=[]
    for s in T['secs']:
        bl=60/s['bpm']; t0=t; b=0
        for sid,nb in s['shots']:
            shots[sid]=dict(id=sid,sec=s['id'],t0=t,t1=t+nb*bl,beat0=b,nb=nb,bpm=s['bpm']); order.append(sid)
            t+=nb*bl; b+=nb
        secs.append(dict(id=s['id'],name=s['name'],bpm=s['bpm'],t0=t0,t1=t,beats=b))
    caps=[dict(t0=round(shots[s]['t0']+o,3),t1=round(shots[s]['t0']+o+d,3),text=x) for s,o,d,x in T['caps']]
    return dict(secs=secs,shots=[shots[k] for k in order],caps=caps,dur=t+T['tail'])
if __name__=='__main__':
    B=build()
    for s in B['shots']: print(f"{s['id']:4} {s['t0']:7.2f}–{s['t1']:7.2f} ({s['t1']-s['t0']:.2f}s) {s['sec']}@{s['bpm']}")
    for c in B['caps']:
        need=len([ch for ch in c['text'] if '一'<=ch<='鿿'])/4.5+1.5
        print(f"{c['t0']:7.2f}–{c['t1']:7.2f} {c['t1']-c['t0']:.2f}/{need:.2f} {c['text']}")
    print('DUR',B['dur'])
