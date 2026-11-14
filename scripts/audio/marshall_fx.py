"""SFX + music for Marshall -> public/marshall/fx.wav.  python scripts/marshall_fx.py  (cues mirror MC in Marshall.tsx)"""
import os, numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt
SR = 48000; DUR = 51.5; N = int(DUR * SR); rng = np.random.default_rng(3); out = np.zeros(N)
def filt(x, k, f): return sosfilt(butter(4, f, k, fs=SR, output="sos"), x)
def put(at, x, g=1.0):
    i = int(at * SR)
    if 0 <= i < N: x = x[:N - i]; out[i:i + len(x)] += g * x
def click():
    n = int(.08 * SR); t = np.arange(n) / SR
    return (np.sin(2*np.pi*1800*t)*np.exp(-t*90) + filt(rng.standard_normal(n), "high", 2000)*np.exp(-t*120)) * .9
def pop():
    n = int(.12 * SR); t = np.arange(n) / SR
    return np.sin(2*np.pi*(500+900*t*8)*t) * np.exp(-t*35) * .8
def whoosh(d=.35):
    n = int(d * SR); t = np.linspace(0, 1, n)
    return filt(rng.standard_normal(n), "band", [400, 4000]) * np.sin(np.pi*t)**2 * .5
def chime(f0, d=1.2):
    n = int(d * SR); t = np.arange(n) / SR
    return (np.sin(2*np.pi*f0*t) + .4*np.sin(2*np.pi*f0*2*t)) * np.exp(-t*3.2) * .5
def hit():
    n = int(1.2 * SR); t = np.arange(n) / SR
    return (np.sin(2*np.pi*(55*np.exp(-t*2)+30)*t)*np.exp(-t*3) + filt(rng.standard_normal(n), "low", 300)*np.exp(-t*8)*.6) * .8
def thud(g=1.):
    n = int(.6 * SR); t = np.arange(n) / SR
    return (np.sin(2*np.pi*np.cumsum(70*np.exp(-t*6)+40)/SR)*np.exp(-t*7)*1.2 + filt(rng.standard_normal(n), "low", 900)*np.exp(-t*30)*.8) * g
def gulp():
    n = int(.5 * SR); t = np.arange(n) / SR
    return np.sin(2*np.pi*(180-120*t)*t) * np.exp(-t*7) * 1.2
def heartbeat():
    n = int(.5 * SR); t = np.arange(n) / SR; b = np.sin(2*np.pi*50*t)*np.exp(-t*18)
    sh = np.zeros(n); k = int(.22 * SR); sh[k:] = b[:n-k]*.7; return (b + sh) * 1.1
def retch():
    n = int(.7 * SR); t = np.linspace(0, 1, n)
    return filt(rng.standard_normal(n), "band", [120, 900]) * np.sin(np.pi*t) * 1.3
t = np.arange(N) / SR
pad = sum(a*np.sin(2*np.pi*f*t) for f, a in [(98, .5), (146.8, .25), (185, .15), (233, .08)])
pad_up = sum(a*np.sin(2*np.pi*f*t) for f, a in [(130.8, .4), (164.8, .25), (196, .2), (261.6, .1)])
mix = np.interp(t, [0, 39.2, 40.2, 51.5], [0, 0, 1, 1])
out += filt(pad*(1-mix) + pad_up*mix, "low", 800) * np.interp(t, [0, 12, 27, 31, 39, 42, 51.5], [.35, .3, .4, .5, .5, .35, .25]) * .5
for a in [0.21, 4.78, 5.66, 44.87]: put(a, hit(), .8)
put(4.78, thud(1.2), .6)
for a in [2.35, 5.66, 8.56, 12.08, 16.26, 20.0, 23.24, 26.16, 31.34, 35.44, 39.72, 41.95, 46.08]: put(a - .05, whoosh(), .6)
for a in [0.21, 1.36, 13.65, 15.2, 17.76, 18.56]: put(a, pop(), .5)
for a in np.arange(20.37, 22.7, .17): put(a, click(), .3)
put(24.2, hit(), .9); put(24.2, chime(784, 1.0), .4)
for a in np.arange(24.5, 28.9, .9): put(a, heartbeat(), .5)
put(28.93, gulp(), .9); put(29.54, gulp(), .9); put(30.2, gulp(), .8)
for a in [33.22, 33.84, 34.51]: put(a, retch(), .6)
for a in [33.22, 33.84, 34.51]: put(a, pop(), .5)
put(36.52, chime(440, 1.0), .5); put(38.16, hit(), .8)
put(39.72, chime(659, 1.2), .6); put(39.72, chime(988, 1.2), .4)
put(41.95, chime(523, 1.2), .5); put(44.87, chime(880, 1.6), .6); put(44.87, chime(1109, 1.6), .4)
put(47.36, chime(392, 1.6), .5)
out = np.tanh(out * 1.1) * .5
os.makedirs("public/marshall", exist_ok=True)
wavfile.write("public/marshall/fx.wav", SR, (np.stack([out, out], 1) * 32767).astype(np.int16)); print("ok", round(float(np.abs(out).max()), 3))
