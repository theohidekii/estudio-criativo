"""Sober SFX+bed for Maniaco -> public/maniaco/fx.wav (cues mirror MN in Maniaco.tsx)"""
import os, numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt
SR=48000; DUR=57.4; N=int(DUR*SR); rng=np.random.default_rng(5); out=np.zeros(N)
def filt(x,k,f): return sosfilt(butter(4,f,k,fs=SR,output="sos"),x)
def put(at,x,g=1.0):
    i=int(at*SR)
    if 0<=i<N: x=x[:N-i]; out[i:i+len(x)]+=g*x
def whoosh(d=.3):
    n=int(d*SR); t=np.linspace(0,1,n); return filt(rng.standard_normal(n),"band",[400,3500])*np.sin(np.pi*t)**2*.4
def hit():
    n=int(1.2*SR); t=np.arange(n)/SR
    return (np.sin(2*np.pi*(55*np.exp(-t*2)+30)*t)*np.exp(-t*3)+filt(rng.standard_normal(n),"low",300)*np.exp(-t*8)*.6)*.8
def pop():
    n=int(.12*SR); t=np.arange(n)/SR; return np.sin(2*np.pi*(500+900*t*8)*t)*np.exp(-t*35)*.5
def toll(f0,d=2.0):
    n=int(d*SR); t=np.arange(n)/SR; return (np.sin(2*np.pi*f0*t)+.3*np.sin(2*np.pi*f0*2.76*t))*np.exp(-t*2.2)*.5
t=np.arange(N)/SR
pad=sum(a*np.sin(2*np.pi*f*t) for f,a in [(73.4,.5),(110,.3),(138.6,.15),(146.8,.1)])
pulse=.6+.4*np.sin(2*np.pi*.25*t)
out+=filt(pad,"low",500)*pulse*np.interp(t,[0,10,30,48,57.4],[.25,.3,.4,.5,.3])*.5
for a in [3.25,5.16,6.06,20.65,25.31,32.21,41.32,51.52]: put(a-.05,whoosh(),.5)
put(3.65,hit(),.8); put(6.06,toll(196),.6); put(22.68,hit(),1.0); put(23.65,toll(147),.6)
for a in [8.85,12.05,13.44,14.84,18.42,19.39,28.53,29.81,30.92]: put(a,pop(),.4)
put(34.21,toll(130),.6); put(39.2,hit(),.8); put(40.36,toll(98,2.5),.7)
put(45.75,hit(),.7); put(50.88,toll(82,3.0),.8); put(55.66,hit(),.6)
out=np.tanh(out*1.1)*.5
os.makedirs("public/maniaco",exist_ok=True)
wavfile.write("public/maniaco/fx.wav",SR,(np.stack([out,out],1)*32767).astype(np.int16)); print("ok",round(float(np.abs(out).max()),3))
