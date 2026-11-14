"""Cut pauses from Daniel voice, write out/daniel3/voice.mp3 + map.json (old->new time)."""
import json, re, subprocess, numpy as np, os
from scipy.io import wavfile
src="out/daniel2/voice/voice.wav"; os.makedirs("out/daniel3",exist_ok=True)
r=subprocess.run(["ffmpeg","-i",src,"-af","silencedetect=noise=-35dB:d=0.14","-f","null","-"],capture_output=True,text=True).stderr
st=[float(x) for x in re.findall(r"silence_start: ([0-9.]+)",r)]; en=[float(x) for x in re.findall(r"silence_end: ([0-9.]+)",r)]
sil=[(a,b) for a,b in zip(st,en)]
sr,x=wavfile.read(src); x=x.astype(np.int16)
KEEP=0.06
cuts=[]  # (cut_from, cut_to) removed intervals in old time
for a,b in sil:
    L=b-a
    if L>KEEP+0.05: cuts.append((a+KEEP/2,b-KEEP/2))
segs=[]; prev=0.0
for a,b in cuts: segs.append((prev,a)); prev=b
dur=len(x)/sr; segs.append((prev,dur))
parts=[x[int(a*sr):int(b*sr)] for a,b in segs]
y=np.concatenate(parts)
wavfile.write("out/daniel3/voice.wav",sr,y)
subprocess.run(["ffmpeg","-y","-loglevel","error","-i","out/daniel3/voice.wav","-codec:a","libmp3lame","-q:a","3","out/daniel3/voice.mp3"],check=True)
json.dump({"cuts":cuts,"old_dur":dur,"new_dur":len(y)/sr},open("out/daniel3/map.json","w"))
print("cuts",len(cuts),"removed",round(sum(b-a for a,b in cuts),2),"new dur",round(len(y)/sr,2))
