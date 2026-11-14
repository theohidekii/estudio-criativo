"""SFX + music for Milgram Parte 2 -> public/milgram2/fx.wav.  python scripts/milgram2_fx.py  (cues mirror T2 in Milgram2.tsx)"""
import os, numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt
SR = 48000; DUR = 32.0; N = int(DUR * SR); rng = np.random.default_rng(11); out = np.zeros(N)
T = dict(psi=1.01, dots=2.32, mil=2.86, erra=4.12, res=5.46, f26=5.79, pct=7.08, ult=8.69, suav=10.36, ped=12.06, cont=13.21, ator=14.28, zero=16.22,
         det=17.44, peers=19.81, rec=21.34, ten=22.27, ten2=22.93, nao2=24.8, grupo=25.32, cta=26.59, faca=28.67, bio=29.71)
def filt(x, k, f): return sosfilt(butter(4, f, k, fs=SR, output="sos"), x)
def put(at, x, g=1.0):
    i = int(at * SR)
    if i < N: x = x[:N - i]; out[i:i + len(x)] += g * x
def click():
    n = int(.08 * SR); t = np.arange(n) / SR
    return (np.sin(2*np.pi*1800*t)*np.exp(-t*90) + filt(rng.standard_normal(n), "high", 2000)*np.exp(-t*120)) * .9
def thud(g=1.):
    n = int(.6 * SR); t = np.arange(n) / SR
    return (np.sin(2*np.pi*np.cumsum(70*np.exp(-t*6)+40)/SR)*np.exp(-t*7)*1.2 + filt(rng.standard_normal(n), "low", 900)*np.exp(-t*30)*.8) * g
def hit():
    n = int(1.4 * SR); t = np.arange(n) / SR
    return (np.sin(2*np.pi*(55*np.exp(-t*2)+30)*t)*np.exp(-t*3) + filt(rng.standard_normal(n), "low", 300)*np.exp(-t*8)*.6) * .9
def whoosh(d=.35):
    n = int(d * SR); t = np.linspace(0, 1, n)
    return filt(rng.standard_normal(n), "band", [400, 4000]) * np.sin(np.pi*t)**2 * .5
def heartbeat():
    n = int(.5 * SR); t = np.arange(n) / SR; b = np.sin(2*np.pi*50*t)*np.exp(-t*18)
    sh = np.zeros(n); k = int(.22 * SR); sh[k:] = b[:n-k]*.7; return (b + sh) * 1.1
def chime(f0, d=1.2):
    n = int(d * SR); t = np.arange(n) / SR
    return (np.sin(2*np.pi*f0*t) + .4*np.sin(2*np.pi*f0*2*t)) * np.exp(-t*3.2) * .5
t = np.arange(N) / SR
drone = filt(sum(a*np.sin(2*np.pi*f*t+p) for f, a, p in [(73.4, .5, 0), (110, .25, 1), (146.8, .12, 2), (174.6, .08, .5)]), "low", 600)
inten = np.interp(t, [0, 4, 7, 14, 17.4, 21, 24.8, 26.6, 32], [.5, .55, .7, .55, .4, .5, .3, .45, .35])
out += drone * inten * .3
for a in [0, T["erra"], T["pct"], T["nao2"]]: put(a, hit(), .8)
put(T["erra"], thud(1.2), .8)
for a in [T["psi"], T["dots"], T["res"], T["ult"], T["ator"], T["det"], T["peers"], T["cta"]]: put(a - .05, whoosh(), .7)
for i in range(26): put(T["f26"] + i * .05, click(), .35)
for i in range(4): put(T["ten"] + .1 + i * .15, click(), .6)
put(T["mil"], chime(880, 1.0), .6)
put(9.5, click(), .8); put(9.5, thud(.8), .6)
for a in np.arange(T["suav"], T["cont"], .7): put(a, heartbeat(), .5)
put(T["zero"], chime(660, 1.0), .5)
for a in [T["rec"], T["rec"] + .25]: put(a, click(), .6)
put(T["faca"], chime(523, 1.4), .7); put(T["faca"], chime(784, 1.4), .5); put(T["bio"], click(), .7)
out = np.tanh(out * 1.1) * .5
os.makedirs("public/milgram2", exist_ok=True)
wavfile.write("public/milgram2/fx.wav", SR, (np.stack([out, out], 1) * 32767).astype(np.int16)); print("ok", round(float(np.abs(out).max()), 3))
