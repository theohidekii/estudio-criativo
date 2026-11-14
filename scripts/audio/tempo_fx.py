"""SFX + music for "Tempo passa rapido" -> public/tempo/fx.wav.  python scripts/tempo_fx.py  (cues mirror TP in Tempo.tsx)"""
import os, numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt
SR = 48000; DUR = 53.6; N = int(DUR * SR); rng = np.random.default_rng(9); out = np.zeros(N)
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
def tick():
    n = int(.05 * SR); t = np.arange(n) / SR
    return np.sin(2*np.pi*1400*t) * np.exp(-t*90) * .7
t = np.arange(N) / SR
# warm pad: major, gets a bit wistful (minor) after "talvez"
major = sum(a*np.sin(2*np.pi*f*t) for f, a in [(130.8, .4), (164.8, .25), (196, .2), (261.6, .1)])
minor = sum(a*np.sin(2*np.pi*f*t) for f, a in [(130.8, .4), (155.6, .25), (196, .2), (261.6, .1)])
mix = np.interp(t, [0, 45, 47, 53.6], [0, 0, 1, 1])
bed = filt(major*(1-mix) + minor*mix, "low", 800)
out += bed * np.interp(t, [0, 3, 40, 47, 53.6], [.4, .3, .3, .35, .2]) * .5
for a in np.arange(2.0, 4.8, .9): put(a, click(), .5)             # calendar crosses (kid: slow)
for a in np.arange(4.9, 7.4, .12): put(a, tick(), .35)            # pages flying (adult: fast)
for a in [0.52, 2.0, 4.88, 7.42, 9.48, 11.36, 13.56, 15.24, 17.22, 20.4, 22.68, 24.64, 26.61, 31.44, 35.44, 36.92, 42.84, 46.86, 49.1]: put(a - .05, whoosh(), .6)
put(8.67, hit(), .8); put(8.67, chime(784, 1.2), .5)
put(3.81, chime(659, 1.2), .5); put(9.48, pop(), .8)
put(14.36, chime(523, 1.0), .5)
for a in [17.22, 20.4]: put(a + .1, pop(), .6)
put(23.2, whoosh(.7), .6)
for k in range(9): put(26.94 + k * .3, pop(), .5)
put(28.36, chime(880, 1.0), .6); put(29.6, chime(1175, 1.4), .4)
for k in range(5): put(31.44 + k * .4, click(), .5)
put(34.06, whoosh(.6), .8); put(34.06, hit(), .6)
put(38.19, chime(988, 1.0), .5); put(39.59, click(), .7); put(41.58, click(), .7)
put(44.27, whoosh(.6), .6); put(45.74, chime(440, 1.0), .5)
for a in np.arange(46.86, 49.1, 1.0): put(a, tick(), .8)           # steady clock
put(49.8, chime(392, 1.6), .5); put(50.38, whoosh(.8), .5); put(51.18, chime(330, 2.0), .5)
out = np.tanh(out * 1.1) * .5
os.makedirs("public/tempo", exist_ok=True)
wavfile.write("public/tempo/fx.wav", SR, (np.stack([out, out], 1) * 32767).astype(np.int16)); print("ok", round(float(np.abs(out).max()), 3))
