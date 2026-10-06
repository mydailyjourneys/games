import base64,os
import os
D=os.path.dirname(os.path.abspath(__file__))
s=open(f'{D}/src.html',encoding='utf-8').read()
f=''
for w in (500,700,800):
    b=base64.b64encode(open(f'{D}/fonts/rubik-hebrew-{w}-normal.woff2','rb').read()).decode()
    f+=f'@font-face{{font-family:Rubik;font-weight:{w};font-display:swap;src:url(data:font/woff2;base64,{b}) format("woff2")}}\n'
s=s.replace('/*FONTS*/',f)
s=s.replace('<!--MANIFEST-->','<link rel="manifest" href="manifest.json"><link rel="icon" href="icon-192.png"><link rel="apple-touch-icon" href="icon-192.png">')
gen=open(f'{D}/gen.js',encoding='utf-8').read().replace("if (typeof module !== 'undefined') module.exports = { makeLevel, norm, isBonusWord, TOFIN };",'')

s=s.replace('/*WORDS*/',open(f'{D}/words.js',encoding='utf-8').read()).replace('/*GEN*/',gen).replace('/*GAME*/',open(f'{D}/game.js',encoding='utf-8').read())

open(f'{D}/index.html','w',encoding='utf-8').write(s)
print(len(s))
