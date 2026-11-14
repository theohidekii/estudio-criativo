"""SFX + music for Terman x Alvarez Parte 1 -> public/terman/fx.wav.  python scripts/terman_fx.py  (cues mirror TT in Terman.tsx)"""
import os, numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt
SR = 48000; DUR = 49.2; N = int(DUR * SR); rng = np.random.default_rng(5); out = np.zeros(N)
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
def chime(f0, d=1.2):
    n = int(d * SR); t = np.arange(n) / SR
    return (np.sin(2*np.pi*f0*t) + .4*np.sin(2*np.pi*f0*2*t)) * np.exp(-t*3.2) * .5
def rumble(d=1.6):
    n = int(d * SR); t = np.linspace(0, 1, n)
    return filt(rng.standard_normal(n), "low", 160) * np.sin(np.pi*t) * 1.2
t = np.arange(N) / SR
# curious, light underscore: soft pad (D major-ish) with a gentle pulse, sadder (minor) in the rejection part, brighter at the end
pad = sum(a*np.sin(2*np.pi*f*t) for f, a in [(146.8, .4), (220, .25), (293.7, .15)])
pad2 = sum(a*np.sin(2*np.pi*f*t) for f, a in [(146.8, .4), (174.6, .25), (293.7, .15)])
mix = np.interp(t, [0, 21.5, 22.5, 32, 33, 49.2], [0, 0, 1, 1, 0, 0])
bed = filt(pad * (1 - mix) + pad2 * mix, "low", 900)
out += bed * np.interp(t, [0, 3, 22, 32, 36, 42, 49.2], [.35, .3, .35, .3, .3, .25, .3]) * .5
for a in np.arange(5.4, 44, .75): put(a, click(), .1)  # soft ticking
for a in [0.0, 0.83, 3.8, 24.44, 31.56, 37.69, 40.48]: put(a, hit(), .8)
put(0.83, thud(1.2), .7); put(24.44, thud(1.2), .7)
for a in [5.42, 7.24, 14.28, 17.92, 25.48, 32.72, 42.0, 44.85]: put(a - .05, whoosh(), .7)
for a in np.arange(11.9, 13.6, .12): put(a, click(), .5)
put(3.8, chime(880, 1.4), .6); put(37.69, chime(880, 1.4), .6); put(37.69, chime(1109, 1.4), .4)
put(16.04, click(), .8); put(18.85, thud(.8), .7)
put(22.92, chime(196, 1.0), .6)
for a in np.arange(26.38, 28.0, .08): put(a, click(), .25)
put(36.86, chime(660, 1.0), .5)
put(40.48, rumble(), .9); put(40.48, hit(), 1.0)
put(45.92, chime(523, 1.4), .7); put(45.92, chime(784, 1.4), .5); put(46.93, click(), .7)
out = np.tanh(out * 1.1) * .5
os.makedirs("public/terman", exist_ok=True)
wavfile.write("public/terman/fx.wav", SR, (np.stack([out, out], 1) * 32767).astype(np.int16)); print("ok", round(float(np.abs(out).max()), 3))
