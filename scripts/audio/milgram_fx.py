"""Synthesized SFX + tension music for Milgram Parte 1 -> public/milgram/fx.wav (48 kHz stereo, 56.9 s).
Cue times mirror T / ZAPS in src/videos/milgram/Milgram.tsx.  python scripts/milgram_fx.py"""
import os
import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt

SR = 48000
DUR = 56.9
N = int(DUR * SR)
rng = np.random.default_rng(7)
out = np.zeros(N)

T = dict(pessoas=1.97, choques=3.58, so=5.41, mandou=6.94, ad=7.6, quatro=11.71, voce=13.58, vira=15.24, outro=16.48, amarrado=18.91,
         antes=21.18, doi=24.24, cada=25.08, v15=28.03, v75=29.24, v150=30.61, grita=32.14, olha=33.33, cont=36.42, v300=37.36,
         bang=39.12, silence=40.36, exige=42.32, cont2=44.23, vote=45.16, aperta=46.4, optA=48.2, optB=50.2, coment=51.46, part2=52.37)
ZAPS = [(T["choques"], .9, 1), (T["doi"], .75, .8), (T["v15"] + .15, .35, .35), (T["v75"] + .15, .5, .6), (T["v150"] + .12, 1.4, 1), (T["v300"] + .5, 1.2, 1)]
PRESSES = [1.2, T["v15"], T["v75"], T["v150"], T["v300"]]


def filt(x, kind, f):
    return sosfilt(butter(4, f, kind, fs=SR, output="sos"), x)


def put(at, x, gain=1.0):
    i = int(at * SR)
    if i >= N:
        return
    x = x[: N - i]
    out[i:i + len(x)] += gain * x


def env(n, a, r):
    e = np.ones(n)
    na, nr = int(a * SR), int(r * SR)
    e[:na] = np.linspace(0, 1, na) if na else 1
    if nr:
        e[-nr:] *= np.linspace(1, 0, nr)
    return e


def zap(d, k):
    n = int(d * SR); t = np.arange(n) / SR
    buzz = np.sign(np.sin(2 * np.pi * 120 * t)) * 0.5 + np.sign(np.sin(2 * np.pi * 180 * t + 1)) * 0.3
    crackle = rng.standard_normal(n) * (rng.random(n) < 0.03) * 3
    hiss = filt(rng.standard_normal(n), "high", 3000) * 0.3
    am = 0.6 + 0.4 * (rng.random(n // 400 + 1).repeat(400)[:n] > 0.4)
    return (buzz + crackle + hiss) * am * env(n, 0.005, 0.08) * k


def click():
    n = int(0.08 * SR); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * 1800 * t) * np.exp(-t * 90) + filt(rng.standard_normal(n), "high", 2000) * np.exp(-t * 120)) * 0.9


def thud(g=1.0):
    n = int(0.6 * SR); t = np.arange(n) / SR
    f = 70 * np.exp(-t * 6) + 40
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7)
    knock = filt(rng.standard_normal(n), "low", 900) * np.exp(-t * 30)
    return (body * 1.2 + knock * 0.8) * g


def whoosh(d=0.35):
    n = int(d * SR); t = np.linspace(0, 1, n)
    x = filt(rng.standard_normal(n), "band", [400, 4000]) * np.sin(np.pi * t) ** 2
    return x * 0.5


def hit():  # low cinematic boom on punch words
    n = int(1.4 * SR); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * (55 * np.exp(-t * 2) + 30) * t) * np.exp(-t * 3) + filt(rng.standard_normal(n), "low", 300) * np.exp(-t * 8) * 0.6) * 0.9


def stamp():
    return thud(0.6) + np.concatenate([click()[:2000] * 0.6, np.zeros(int(0.6 * SR) - 2000)])


def tick():
    n = int(0.06 * SR); t = np.arange(n) / SR
    return np.sin(2 * np.pi * 1200 * t) * np.exp(-t * 80) * 0.6


def heartbeat():
    n = int(0.5 * SR); t = np.arange(n) / SR
    b = np.sin(2 * np.pi * 50 * t) * np.exp(-t * 18)
    sh = np.zeros(n); k = int(0.22 * SR); sh[k:] = b[: n - k] * 0.7
    return (b + sh) * 1.1


# ---- music: low drone in D minor + pulsing ticking that speeds up; cut to silence at the silence beat ----
t = np.arange(N) / SR
drone = sum(a * np.sin(2 * np.pi * f * t + p) for f, a, p in [(73.4, .5, 0), (110, .25, 1), (146.8, .12, 2), (174.6, .08, .5)])
drone = filt(drone, "low", 600)
inten = np.interp(t, [0, 7, 7.6, 25, 33, 40.3, 40.36, 42.3, 45, 52.3, 52.4, 56.9], [.55, .6, .35, .45, .7, 1, 0, 0, .6, .75, 0, 0])
music = drone * inten * 0.35
# pulse (clock-like tick) every beat, tempo rising from 90 to 140 bpm
bpm = np.interp(t, [0, 25, 40, 52], [90, 100, 140, 120])
phase = np.cumsum(bpm / 60 / SR)
beat_on = np.diff(np.floor(phase), prepend=0) > 0
idx = np.nonzero(beat_on)[0]
for i in idx:
    at = i / SR
    if 7.6 <= at < 52.3 and not (40.36 <= at < 42.6):
        put(at, tick(), 0.25 * float(np.interp(at, [7.6, 40, 52], [.4, 1, .7])))
out += music

for a, d, k in ZAPS:
    put(a, zap(d, k), 0.55)
for a in PRESSES:
    put(a, click(), 0.8)
for a in [T["bang"], T["bang"] + 0.35]:
    put(a, thud(1.4), 0.9)
for a in [T["ad"], T["voce"], T["antes"], T["olha"], T["vote"]]:
    put(a - 0.05, whoosh(), 0.8)
for a in [0.0, T["mandou"], T["cont"], T["cont2"], T["part2"]]:
    put(a, hit(), 0.8)
put(T["quatro"], stamp(), 0.7)
for a in [T["optA"], T["optB"], T["coment"]]:
    put(a, click(), 0.5)
for a in np.arange(T["olha"], T["silence"], 0.8):
    put(a, heartbeat(), 0.45)
for a in np.arange(T["vote"], T["part2"], 0.75):
    put(a, heartbeat(), 0.5)

out = np.tanh(out * 1.1) * 0.5  # soft clip, keep well under the voice
st = np.stack([out, out], 1)
os.makedirs("public/milgram", exist_ok=True)
wavfile.write("public/milgram/fx.wav", SR, (st * 32767).astype(np.int16))
print("wrote public/milgram/fx.wav", round(DUR, 2), "s, peak", round(float(np.abs(out).max()), 3))
