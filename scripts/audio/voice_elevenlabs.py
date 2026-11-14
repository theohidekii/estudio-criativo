"""Narration for a short with ElevenLabs: voice.mp3 + voice.wav (48 kHz mono) + words.json (word timings).

  python scripts/voice_elevenlabs.py --list-voices
  python scripts/voice_elevenlabs.py SCRIPT.txt out/<name>/voice --voice <voice_id> [--model ...] [--speed 1.0]
  python scripts/voice_elevenlabs.py --selftest          (no key, no network: checks the word grouping)

The API key is read from the ELEVENLABS_API_KEY environment variable, or from a `.env` file in the current
folder or the project root (a line `ELEVENLABS_API_KEY=...`; `.env` is git-ignored). It is never printed.

words.json is a list of {"w": word, "s": start_seconds, "e": end_seconds}: the shape the sound scripts read
(mix.py uses "s" and "e"). The timings come from the API's own character alignment, so no speech-to-text is
needed; hand-check them against the audio before timing shots to them.
"""
import argparse
import base64
import json
import os
import shutil
import subprocess
import sys
import urllib.error
import urllib.request

API = "https://api.elevenlabs.io"
KEY_NAME = "ELEVENLABS_API_KEY"


def api_key():
    key = os.environ.get(KEY_NAME, "").strip()
    here = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    for folder in (os.getcwd(), here):
        if key:
            break
        path = os.path.join(folder, ".env")
        if os.path.isfile(path):
            for line in open(path, encoding="utf-8"):
                name, _, value = line.strip().partition("=")
                if name.strip() == KEY_NAME:
                    key = value.strip().strip("\"'")
    if not key:
        sys.exit(f"No API key: set {KEY_NAME} in the environment or in a .env file in the project root.")
    return key


def call(method, path, body=None):
    data = None if body is None else json.dumps(body).encode("utf-8")
    req = urllib.request.Request(API + path, data=data, method=method)
    req.add_header("xi-api-key", api_key())
    req.add_header("Accept", "application/json")
    if data is not None:
        req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req, timeout=300) as r:
            return json.load(r)
    except urllib.error.HTTPError as e:
        detail = e.read().decode("utf-8", "replace")[:600]
        sys.exit(f"ElevenLabs returned HTTP {e.code} for {method} {path.split('?')[0]}: {detail}")
    except urllib.error.URLError as e:
        sys.exit(f"Could not reach ElevenLabs: {e.reason}")


def words_from_alignment(al):
    """character timings -> one entry per spoken word (whitespace separated; pure punctuation is dropped)"""
    chars = al["characters"]
    starts = al["character_start_times_seconds"]
    ends = al["character_end_times_seconds"]
    out, cur, s, e = [], "", None, None

    def flush():
        nonlocal cur, s, e
        w = cur.strip(".,;:!?\"'()[]{}<>-–—…“”‘’")
        if any(c.isalnum() for c in w):
            out.append({"w": w, "s": round(float(s), 3), "e": round(float(e), 3)})
        cur, s, e = "", None, None

    for c, a, b in zip(chars, starts, ends):
        if c.isspace():
            if cur:
                flush()
            continue
        if not cur:
            s = a
        cur += c
        e = b
    if cur:
        flush()
    return out


def selftest():
    text = "Seventy-four soldiers — yes, 74 — knocked it down."
    al = {"characters": list(text),
          "character_start_times_seconds": [i * 0.05 for i in range(len(text))],
          "character_end_times_seconds": [(i + 1) * 0.05 for i in range(len(text))]}
    ws = words_from_alignment(al)
    got = [w["w"] for w in ws]
    want = ["Seventy-four", "soldiers", "yes", "74", "knocked", "it", "down"]
    assert got == want, got
    assert ws[0]["s"] == 0.0 and ws[0]["e"] == 0.6, ws[0]
    assert all(a["e"] <= b["s"] for a, b in zip(ws, ws[1:])), "words overlap"
    assert ws[-1]["e"] <= round(len(text) * 0.05, 3)
    print("selftest ok:", got)


def list_voices():
    for v in call("GET", "/v1/voices").get("voices", []):
        labels = v.get("labels") or {}
        tags = ", ".join(str(labels[k]) for k in ("gender", "age", "accent", "description", "use_case") if labels.get(k))
        print(f"{v.get('voice_id')}  {v.get('name')}  [{v.get('category', '')}]  {tags}")


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("script", nargs="?", help="text file with the narration (UTF-8)")
    p.add_argument("outdir", nargs="?", help="folder for voice.mp3, voice.wav, words.json")
    p.add_argument("--voice", help="ElevenLabs voice_id (see --list-voices)")
    p.add_argument("--model", default="eleven_multilingual_v2")
    p.add_argument("--speed", type=float, default=1.0)
    p.add_argument("--stability", type=float, default=0.6, help="higher = steadier tone")
    p.add_argument("--similarity", type=float, default=0.75)
    p.add_argument("--style", type=float, default=0.0)
    p.add_argument("--seed", type=int, default=None)
    p.add_argument("--list-voices", action="store_true")
    p.add_argument("--selftest", action="store_true")
    a = p.parse_args()

    if a.selftest:
        return selftest()
    if a.list_voices:
        return list_voices()
    if not (a.script and a.outdir and a.voice):
        p.error("need SCRIPT, OUTDIR and --voice (or --list-voices / --selftest)")

    text = " ".join(open(a.script, encoding="utf-8").read().split())
    if not text:
        sys.exit("The script file is empty.")
    body = {"text": text, "model_id": a.model,
            "voice_settings": {"stability": a.stability, "similarity_boost": a.similarity, "style": a.style, "speed": a.speed}}
    if a.seed is not None:
        body["seed"] = a.seed
    print(f"{len(text)} characters, {len(text.split())} words -> voice {a.voice}, model {a.model}")
    res = call("POST", f"/v1/text-to-speech/{a.voice}/with-timestamps?output_format=mp3_44100_128", body)

    os.makedirs(a.outdir, exist_ok=True)
    mp3, wav = os.path.join(a.outdir, "voice.mp3"), os.path.join(a.outdir, "voice.wav")
    with open(mp3, "wb") as f:
        f.write(base64.b64decode(res["audio_base64"]))
    al = res.get("alignment") or res.get("normalized_alignment")
    if not al:
        sys.exit(f"Saved {mp3}, but the API returned no alignment, so words.json was not written.")
    with open(os.path.join(a.outdir, "alignment.json"), "w", encoding="utf-8") as f:
        json.dump(al, f)
    ws = words_from_alignment(al)
    with open(os.path.join(a.outdir, "words.json"), "w", encoding="utf-8") as f:
        json.dump(ws, f, ensure_ascii=False, indent=0)

    ffmpeg = shutil.which("ffmpeg")
    if ffmpeg:
        subprocess.run([ffmpeg, "-y", "-loglevel", "error", "-i", mp3, "-ar", "48000", "-ac", "1", "-c:a", "pcm_s16le", wav], check=True)
    else:
        print("ffmpeg not found on PATH: voice.wav not written (voice.mp3 is there).")
    dur = ws[-1]["e"] if ws else 0.0
    rate = len(ws) / dur if dur else 0.0
    print(f"wrote {a.outdir}: voice.mp3{', voice.wav' if ffmpeg else ''}, words.json ({len(ws)} words, {dur:.2f} s, {rate:.2f} words/s)")


if __name__ == "__main__":
    main()
