"""SFX + light bed for Daniel -> public/daniel/fx.wav (cues mirror DN in Daniel.tsx)"""
import os, numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt
SR=48000; DUR=85.38; N=int(DUR*SR); rng=np.random.default_rng(9); out=np.zeros(N)
def filt(x,k,f): return sosfilt(butter(4,f,k,fs=SR,output="sos"),x)
import json
_c=json.load(open('out/daniel3/map.json'))['cuts']
def T(t): return t-sum(min(max(t-a,0),b-a) for a,b in _c)
def put(at,x,g=1.0):
    i=int(T(at)*SR)
    if 0<=i<N: x=x[:N-i]; out[i:i+len(x)]+=g*x
def whoosh(d=.3):
    n=int(d*SR); t=np.linspace(0,1,n); return filt(rng.standard_normal(n),"band",[400,4000])*np.sin(np.pi*t)**2*.45
def pop():
    n=int(.12*SR); t=np.arange(n)/SR; return np.sin(2*np.pi*(500+900*t*8)*t)*np.exp(-t*35)*.55
def ching():
    n=int(.9*SR); t=np.arange(n)/SR; return (np.sin(2*np.pi*1568*t)+.6*np.sin(2*np.pi*2093*t)+.3*np.sin(2*np.pi*3136*t))*np.exp(-t*5)*.4
def hit():
    n=int(1.0*SR); t=np.arange(n)/SR
    return (np.sin(2*np.pi*(55*np.exp(-t*2)+30)*t)*np.exp(-t*3)+filt(rng.standard_normal(n),"low",300)*np.exp(-t*8)*.6)*.8
def tick():
    n=int(.03*SR); t=np.arange(n)/SR; return np.sin(2*np.pi*2200*t)*np.exp(-t*160)*.25
def chime(f0,d=1.4):
    n=int(d*SR); t=np.arange(n)/SR; return (np.sin(2*np.pi*f0*t)+.4*np.sin(2*np.pi*f0*2*t))*np.exp(-t*3)*.5
t=np.arange(N)/SR
# light groove bed: bass pulse at 100 bpm + soft pad
beat=60/100
bass=np.zeros(N)
for k in range(int(DUR/beat)):
    a=k*beat; n=int(.28*SR); tt=np.arange(n)/SR; f=[110,110,130.8,98][(k//4)%4]
    seg=np.sin(2*np.pi*f*tt)*np.exp(-tt*6)*.6; i=int(a*SR)
    if i+n<N: bass[i:i+n]+=seg
pad=sum(a*np.sin(2*np.pi*f*t) for f,a in [(220,.3),(277,.2),(329.6,.15)])
vol=np.interp(t,[0,3,76.59,83.02,85.38],[.12,.25,.25,.15,0])
out+=(bass*.5+filt(pad,"low",900)*.18)*vol
starts=[1.44,5.73,8.72,13.65,17.96,27.1,33.97,46.13,55.84,60.68,63.48,64.96,72.2,74.05,77.52,82.42,85.39,87.72]
for a in starts: put(a-.05,whoosh(),.5)
for a in [2.53,3.02,4.28,11.64,20.59,21.41,22.3,23.54,24.39,29.8,31.57,32.95,35.4,36.96,37.96,39.66,42.01,44.16,46.68,47.94,49.76,56.54,59.25,66.08,70.48,86.62]: put(a,pop(),.5)
for a in [16.69,25.16,27.79,52.16,56.54,59.25,62.14,66.08]: put(a,ching(),.6)
put(16.69,hit(),.6); put(62.14,hit(),.9); put(63.48,chime(220,1.8),.6)
for a in np.arange(74.5,76.3,.07): put(a,tick(),1.0)
for a in np.arange(78.0,81.9,.09): put(a,tick(),.9)
put(76.21,chime(784),.6); put(81.94,chime(880),.6); put(81.94,chime(1175),.4); put(90.92,chime(988,1.6),.6)
out=np.tanh(out*1.1)*.5
os.makedirs("public/daniel3",exist_ok=True)
wavfile.write("public/daniel3/fx.wav",SR,(np.stack([out,out],1)*32767).astype(np.int16)); print("ok",round(float(np.abs(out).max()),3))
