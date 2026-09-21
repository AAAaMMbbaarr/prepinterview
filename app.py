"""
🎯 Interview Intelligence Agent — v3
Predicts interview questions by analyzing your resume against a job description.

Clean step-by-step UX:
    Step 1: Upload resume + upload/paste JD
    Step 2: Animated analysis with countdown timer
    Step 3: Tabbed, organized results + AI Mock Interview CTA
"""

import streamlit as st
from google import genai
from google.genai import types
from pypdf import PdfReader
from dotenv import load_dotenv
import os
import time
import json
import re
import html as html_lib
import hashlib
import io
import wave
import numpy as np
import requests
import hmac

# ──────────────────────────────────────────────────────────────
# SETUP
# ──────────────────────────────────────────────────────────────

load_dotenv()

# ── Provider selection ──────────────────────────────────────────────────────
_provider_env = os.getenv("AI_PROVIDER", "")
if not _provider_env:
    try:
        _provider_env = st.secrets.get("AI_PROVIDER", "gemini")
    except Exception:
        _provider_env = "gemini"
AI_PROVIDER: str = (_provider_env or "gemini").lower().strip()

if AI_PROVIDER not in ("gemini", "groq"):
    st.error(
        f"⚠️ Invalid AI_PROVIDER value: '{AI_PROVIDER}'. "
        "Accepted values are 'gemini' or 'groq'. Check your .env or Streamlit secrets."
    )
    st.stop()

# ── Gemini client (always initialized when key is present) ─────────────────
api_key = os.getenv("GOOGLE_API_KEY")
if not api_key:
    try:
        api_key = st.secrets["GOOGLE_API_KEY"]
    except Exception:
        pass

gemini_client = None
if api_key:
    gemini_client = genai.Client(api_key=api_key)

# Legacy alias — existing code references 'client' for Gemini
client = gemini_client
MODEL = "gemini-3.5-flash"

# ── Groq client (always initialized when key is present) ───────────────────
from openai import OpenAI as _GroqOpenAIClient  # OpenAI-compatible SDK for Groq

GROQ_MODEL = "openai/gpt-oss-20b"
GROQ_BASE_URL = "https://api.groq.com/openai/v1"

groq_api_key = os.getenv("GROQ_API_KEY")
if not groq_api_key:
    try:
        groq_api_key = st.secrets["GROQ_API_KEY"]
    except Exception:
        pass

groq_client = None
if groq_api_key:
    groq_client = _GroqOpenAIClient(api_key=groq_api_key, base_url=GROQ_BASE_URL)

# ── Configuration validation (fail fast, safe messages) ────────────────────
if AI_PROVIDER == "gemini" and not gemini_client:
    st.error(
        "⚠️ AI_PROVIDER=gemini but GOOGLE_API_KEY is missing or empty. "
        "Add it to your .env file or Streamlit secrets."
    )
    st.stop()

if AI_PROVIDER == "groq" and not groq_client:
    st.error(
        "⚠️ AI_PROVIDER=groq but GROQ_API_KEY is missing or empty. "
        "Add it to your .env file or Streamlit secrets."
    )
    st.stop()

# ──────────────────────────────────────────────────────────────
# PAGE CONFIG
# ──────────────────────────────────────────────────────────────

st.set_page_config(
    page_title="Interview Intelligence",
    page_icon="🎯",
    layout="centered",
)

# Partner Verification Meta Tag (Impact / Career.io)
st.html("""
<meta name="impact-site-verification" value="84300289-b9d8-4976-a4a3-6eaea6b03315">
<div style="display:none;" id="impact-site-verification">84300289-b9d8-4976-a4a3-6eaea6b03315</div>
""")

# ──────────────────────────────────────────────────────────────
# CUSTOM CSS
# ──────────────────────────────────────────────────────────────

st.markdown("""
<style>
    /* Hide Streamlit branding, footer, deploy button, and viewer badge */
    #MainMenu {visibility: hidden; display: none !important;}
    footer {visibility: hidden; display: none !important;}
    header {visibility: hidden; display: none !important;}
    div[data-testid="stStatusWidget"] {visibility: hidden; display: none !important;}
    .stDeployButton {display: none !important;}
    [data-testid="stToolbar"] {visibility: hidden; display: none !important;}
    [data-testid="stEmbedFooter"] {display: none !important; visibility: hidden !important; height: 0 !important;}
    div[class*="viewerBadge"] {display: none !important; visibility: hidden !important;}
    div[class*="ProfileBadge"] {display: none !important; visibility: hidden !important;}
    div[class*="StatusWidget"] {display: none !important; visibility: hidden !important;}
    div[class*="stEmbedFooter"] {display: none !important; visibility: hidden !important;}
    div[data-testid="stDecoration"] {display: none !important;}

    /* Global Typography & Layout */
    html, body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important;
    }

    /* Preserve Streamlit Material Icons */
    [data-testid="stIconMaterial"], [class*="material-icons"], [class*="MaterialSymbols"], [class*="stIcon"] {
        font-family: "Material Symbols Rounded", "Material Icons" !important;
    }

    .stApp {
        background-color: #0d1117 !important;
        color: #c9d1d9 !important;
    }

    .block-container {
        padding-top: 1.5rem;
        padding-bottom: 2.5rem;
        max-width: 760px;
    }

    /* Hero */
    .hero-title {
        font-size: 2.2rem;
        font-weight: 800;
        text-align: center;
        margin-bottom: 0.35rem;
        line-height: 1.2;
        color: #f0f6fc;
        letter-spacing: -0.5px;
    }
    .hero-sub {
        text-align: center;
        color: #8b949e;
        font-size: 1rem;
        margin-bottom: 1.5rem;
        line-height: 1.5;
    }

    /* Stepper Bar */
    .step-bar-container {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 8px;
        margin-bottom: 1.5rem;
        flex-wrap: wrap;
    }
    .step-pill {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 11px;
        font-weight: 600;
        padding: 4px 12px;
        border-radius: 20px;
        background: #161b22;
        color: #8b949e;
        border: 1px solid #30363d;
    }
    .step-pill.active {
        background: #1f6feb22;
        color: #58a6ff;
        border-color: #1f6feb66;
        font-weight: 700;
    }
    .step-pill.completed {
        background: #23863622;
        color: #3fb950;
        border-color: #23863666;
    }
    .step-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #8b949e;
    }
    .step-pill.active .step-dot {
        background: #58a6ff;
        box-shadow: 0 0 6px #58a6ff;
    }
    .step-pill.completed .step-dot {
        background: #3fb950;
    }

    /* Score Pills & Status Dots */
    .prep-score-pill {
        font-size: 14px;
        font-weight: 700;
        padding: 5px 12px;
        border-radius: 8px;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        background: #161b22;
        color: #f0f6fc;
        border: 1px solid #30363d;
    }
    .prep-status-dot {
        display: inline-block;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        flex-shrink: 0;
    }
    .prep-beta-tag {
        font-size: 10px;
        font-weight: 700;
        background: #1f6feb22;
        color: #58a6ff;
        border: 1px solid #1f6feb55;
        padding: 1px 6px;
        border-radius: 10px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    /* Factor Chips */
    .prep-factor-chips-row {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        margin: 10px 0;
    }
    .prep-factor-chip {
        font-size: 12px;
        padding: 5px 10px;
        border-radius: 6px;
        background: #161b22;
        border: 1px solid #30363d;
        color: #c9d1d9;
        display: inline-flex;
        align-items: center;
        gap: 5px;
    }
    .prep-chip-pass {
        border-color: rgba(46, 160, 67, 0.4);
        color: #3fb950;
    }
    .prep-chip-gap {
        border-color: rgba(248, 81, 73, 0.4);
        color: #ff7b72;
    }
    .prep-chip-warn {
        border-color: rgba(210, 153, 34, 0.4);
        color: #d29922;
    }
    .prep-chip-neutral {
        border-color: #30363d;
        color: #8b949e;
    }

    /* Cards & Containers */
    .copilot-card {
        background: #161b22;
        border: 1px solid #30363d;
        border-radius: 10px;
        padding: 1.2rem;
        margin-bottom: 1rem;
    }

    /* Question card */
    .q-card {
        border: 1px solid #30363d;
        border-radius: 8px;
        padding: 1.1rem;
        margin-bottom: 0.75rem;
        background: #161b22;
        transition: border-color 0.2s ease;
    }
    .q-card:hover {
        border-color: #58a6ff44;
    }
    .q-prob {
        font-size: 11px;
        font-weight: 700;
        padding: 2px 8px;
        border-radius: 4px;
        display: inline-block;
        margin-bottom: 0.5rem;
    }
    .q-prob.high { background: rgba(248, 81, 73, 0.15); color: #ff7b72; border: 1px solid rgba(248, 81, 73, 0.4); }
    .q-prob.med { background: rgba(210, 153, 34, 0.15); color: #d29922; border: 1px solid rgba(210, 153, 34, 0.4); }
    .q-prob.pass { background: rgba(46, 160, 67, 0.15); color: #3fb950; border: 1px solid rgba(46, 160, 67, 0.4); }
    .q-text { font-size: 1rem; font-weight: 600; margin-bottom: 0.5rem; color: #f0f6fc; line-height: 1.4; }
    .q-meta { font-size: 0.82rem; color: #8b949e; line-height: 1.5; }

    /* Section header */
    .section-head {
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.8px;
        color: #8b949e;
        margin: 1.5rem 0 0.6rem 0;
        font-weight: 700;
    }

    /* Input labels */
    .input-label {
        font-size: 12px;
        font-weight: 600;
        color: #f0f6fc;
        margin-bottom: 0.4rem;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    /* Timer */
    .timer-text {
        text-align: center;
        font-size: 2.5rem;
        font-weight: 800;
        color: #58a6ff;
        margin: 0.5rem 0;
        font-variant-numeric: tabular-nums;
    }
    .timer-sub {
        text-align: center;
        color: #8b949e;
        font-size: 0.88rem;
        margin-bottom: 1.5rem;
    }

    /* Voice interview call screen */
    .call-screen {
        background: #161b22;
        border: 1px solid #30363d;
        border-radius: 12px;
        padding: 1.8rem;
        text-align: center;
        margin: 1rem 0;
    }
    .call-avatar {
        width: 72px;
        height: 72px;
        border-radius: 50%;
        background: #1f6feb22;
        border: 2px solid #1f6feb66;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.8rem;
        margin: 0 auto 0.8rem auto;
    }
    .call-status {
        font-size: 0.8rem;
        color: #3fb950;
        text-transform: uppercase;
        letter-spacing: 1px;
        margin-bottom: 0.5rem;
        font-weight: 600;
        animation: pulse 2s infinite;
    }
    @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
    }
    .voice-bubble {
        background: #161b22;
        border: 1px solid #30363d;
        border-radius: 8px;
        padding: 1rem 1.2rem;
        margin: 0.75rem 0;
        text-align: left;
        color: #c9d1d9;
        font-size: 0.95rem;
        line-height: 1.5;
    }
    .voice-bubble.interviewer {
        border-left: 3px solid #1f6feb;
    }
    .voice-bubble.candidate {
        border-left: 3px solid #238636;
    }
    .voice-label {
        font-size: 0.7rem;
        text-transform: uppercase;
        letter-spacing: 0.8px;
        color: #8b949e;
        margin-bottom: 0.4rem;
        font-weight: 700;
    }

    /* Streamlit UI Element Overrides */
    div.stButton > button,
    button[data-testid="baseButton-secondary"],
    button[data-testid="stBaseButton-secondary"] {
        border-radius: 6px !important;
        font-weight: 600 !important;
        font-size: 13px !important;
        background: #21262d !important;
        color: #c9d1d9 !important;
        border: 1px solid #30363d !important;
        transition: all 0.15s ease !important;
    }
    div.stButton > button:hover,
    button[data-testid="baseButton-secondary"]:hover,
    button[data-testid="stBaseButton-secondary"]:hover {
        background: #30363d !important;
        border-color: #8b949e !important;
        color: #f0f6fc !important;
    }
    div.stButton > button[kind="primary"],
    button[data-testid="baseButton-primary"],
    button[data-testid="stBaseButton-primary"],
    .st-emotion-cache-19rxjzo,
    .st-emotion-cache-1erxb11 {
        background: #1f6feb !important;
        background-color: #1f6feb !important;
        color: #ffffff !important;
        border: none !important;
        box-shadow: 0 1px 3px rgba(0,0,0,0.3) !important;
    }
    div.stButton > button[kind="primary"]:hover,
    button[data-testid="baseButton-primary"]:hover,
    button[data-testid="stBaseButton-primary"]:hover {
        background: #388bfd !important;
        background-color: #388bfd !important;
        color: #ffffff !important;
    }

    /* Expanders & Tabs */
    .streamlit-expanderHeader {
        background-color: #161b22 !important;
        color: #f0f6fc !important;
        border: 1px solid #30363d !important;
        border-radius: 6px !important;
        font-size: 13px !important;
        font-weight: 600 !important;
    }
    div[data-testid="stExpander"] {
        border: none !important;
        margin-bottom: 8px !important;
    }
    div[data-testid="stExpanderDetails"] {
        background-color: #161b22 !important;
        border: 1px solid #30363d !important;
        border-top: none !important;
        border-radius: 0 0 6px 6px !important;
        padding: 12px !important;
    }

    div[data-baseweb="tab-list"] {
        background-color: transparent !important;
        border-bottom: 1px solid #21262d !important;
        gap: 8px !important;
    }
    div[data-baseweb="tab"] {
        background-color: transparent !important;
        color: #8b949e !important;
        font-size: 13px !important;
        font-weight: 600 !important;
        border-radius: 6px 6px 0 0 !important;
        padding: 8px 14px !important;
    }
    div[aria-selected="true"][data-baseweb="tab"] {
        color: #58a6ff !important;
        border-bottom: 2px solid #1f6feb !important;
    }

    /* Text Inputs */
    textarea, input[type="text"] {
        background-color: #0d1117 !important;
        border: 1px solid #30363d !important;
        color: #f0f6fc !important;
        border-radius: 6px !important;
    }
    textarea:focus, input[type="text"]:focus {
        border-color: #58a6ff !important;
        box-shadow: 0 0 0 1px #58a6ff !important;
    }

    /* Monetization & Locking */
    .lock-card {
        background: #161b22;
        border: 1px solid #30363d;
        border-radius: 10px;
        padding: 1.2rem;
        margin: 0.5rem 0 1rem 0;
        text-align: center;
    }
    .blur-preview {
        filter: blur(4px);
        user-select: none;
        pointer-events: none;
        opacity: 0.5;
        padding: 0.25rem 0;
    }
    .pro-badge-active {
        background: #1f6feb22;
        border: 1px solid #1f6feb66;
        color: #58a6ff;
        font-weight: 700;
        font-size: 0.8rem;
        padding: 3px 8px;
        border-radius: 6px;
        display: inline-block;
        letter-spacing: 0.5px;
    }
    /* Candidate Debrief Styles */
    .debrief-card {
        background: #161b22;
        border: 1px solid #30363d;
        border-radius: 10px;
        padding: 1.4rem;
        margin: 1rem 0;
    }
    .debrief-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 1rem;
        border-bottom: 1px solid #21262d;
        padding-bottom: 1rem;
        margin-bottom: 1rem;
    }
    .readiness-badge {
        font-size: 1.8rem;
        font-weight: 800;
        padding: 4px 16px;
        border-radius: 8px;
        display: inline-block;
        letter-spacing: -0.5px;
    }
    .readiness-badge.high { background: rgba(46, 160, 67, 0.15); border: 1px solid #3fb950; color: #3fb950; }
    .readiness-badge.med { background: rgba(210, 153, 34, 0.15); border: 1px solid #d29922; color: #d29922; }
    .readiness-badge.low { background: rgba(248, 81, 73, 0.15); border: 1px solid #ff7b72; color: #ff7b72; }
    .highlight-card {
        border-radius: 8px;
        padding: 1rem;
        margin: 0.8rem 0;
    }
    .highlight-card.strong {
        background: rgba(46, 160, 67, 0.08);
        border: 1px solid rgba(46, 160, 67, 0.3);
    }
    .highlight-card.weak {
        background: rgba(248, 81, 73, 0.08);
        border: 1px solid rgba(248, 81, 73, 0.3);
    }
    .defense-script-box {
        background: #0d1117;
        border-left: 3px solid #58a6ff;
        padding: 0.8rem 1rem;
        border-radius: 0 6px 6px 0;
        font-size: 0.9rem;
        color: #c9d1d9;
        margin-top: 0.6rem;
    }
</style>
""", unsafe_allow_html=True)


# ──────────────────────────────────────────────────────────────
# HELPER FUNCTIONS
# ──────────────────────────────────────────────────────────────

def extract_pdf_text(uploaded_file) -> str:
    """Extract all text from a PDF file."""
    reader = PdfReader(uploaded_file)
    text = "\n".join(page.extract_text() or "" for page in reader.pages)
    return text


def strip_markdown(text: str) -> str:
    """Remove markdown formatting for clean TTS output."""
    text = re.sub(r'\*\*(.*?)\*\*', r'\1', text)  # bold
    text = re.sub(r'\*(.*?)\*', r'\1', text)       # italic
    text = re.sub(r'#{1,6}\s*', '', text)           # headings
    text = re.sub(r'[✅⚠️💡🎤🔥🎯🥊🔗📊🟢🟡🔴⚪]', '', text)  # emojis
    text = re.sub(r'\n{2,}', '. ', text)            # double newlines
    text = re.sub(r'\s+', ' ', text).strip()        # extra whitespace
    return text


def inject_tts(text: str):
    """Inject JavaScript to speak text aloud using browser's SpeechSynthesis."""
    clean = strip_markdown(text)
    # Escape for JS string
    clean = clean.replace("\\", "\\\\").replace("'", "\\'").replace("\n", " ").replace("\r", "")
    st.html(f"""
    <script>
    (function() {{
        if ('speechSynthesis' in window) {{
            window.speechSynthesis.cancel();
            const msg = new SpeechSynthesisUtterance('{clean}');
            msg.rate = 1.05;
            msg.pitch = 1.0;
            msg.volume = 1.0;
            // Try to find a good English voice
            const voices = window.speechSynthesis.getVoices();
            const preferred = voices.find(v => v.lang.startsWith('en') && v.name.includes('Google'));
            if (preferred) msg.voice = preferred;
            window.speechSynthesis.speak(msg);
        }}
    }})();
    </script>
    """)


def call_gemini_audio(audio_bytes: bytes, prompt: str, temperature: float = 0.7) -> str:
    """Send audio + text prompt to Gemini for transcription and evaluation.

    Voice always uses Gemini regardless of AI_PROVIDER.
    When AI_PROVIDER=groq, text goes to Groq but audio stays on Gemini.
    """
    # Voice requires Gemini - check before attempting API call
    if not gemini_client:
        raise RuntimeError(
            "Voice interview requires a Gemini API key. "
            "Add GOOGLE_API_KEY to your .env file or Streamlit secrets to enable voice mode."
        )
    models_to_try = [MODEL, "gemini-3.5-flash", "gemini-3.5-flash-lite"]
    seen = set()
    models_to_try = [m for m in models_to_try if not (m in seen or seen.add(m))]

    last_error = None
    for model_name in models_to_try:
        for attempt in range(2):
            try:
                response = client.models.generate_content(
                    model=model_name,
                    contents=[
                        types.Part.from_bytes(data=audio_bytes, mime_type="audio/wav"),
                        prompt,
                    ],
                    config={
                        "system_instruction": (
                            "You are a professional interviewer conducting a realistic job interview. "
                            "You only ever report words that are actually audible in the audio. "
                            "You never guess, infer or invent what a candidate said."
                        ),
                        "temperature": temperature,
                    },
                )
                return response.text
            except Exception as e:
                last_error = e
                error_msg = str(e)
                if any(code in error_msg for code in ["503", "429", "UNAVAILABLE"]):
                    time.sleep((attempt + 1) * 5)
                    continue
                elif "404" in error_msg or "NOT_FOUND" in error_msg:
                    break
                else:
                    raise e
    raise last_error


NO_SPEECH_MSG = (
    "We didn't hear any speech, so nothing was submitted. Check that your microphone isn't muted and the "
    "right input is selected in your browser, then record again (or switch to Type mode)."
)

NO_SPEECH_MSG = (
    "We didn't hear any speech, so nothing was submitted. Check that your microphone isn't muted and the "
    "right input is selected in your browser, then record again (or switch to Type mode)."
)


def analyze_wav(audio_bytes: bytes):
    """Cheap local silence check on 16-bit PCM WAV. Returns stats, or None if the format isn't parseable."""
    try:
        with wave.open(io.BytesIO(audio_bytes), "rb") as w:
            n_ch, sw, sr, n = w.getnchannels(), w.getsampwidth(), w.getframerate(), w.getnframes()
            raw = w.readframes(n)
        if sw != 2 or sr <= 0 or n == 0:
            return None
        x = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768.0
        if n_ch > 1:
            x = x[: (len(x) // n_ch) * n_ch].reshape(-1, n_ch).mean(axis=1)
        win = max(1, int(sr * 0.03))
        k = len(x) // win
        seconds = len(x) / sr
        peak = float(np.abs(x).max()) if len(x) else 0.0
        if k == 0:
            return {"seconds": seconds, "peak": peak, "voiced_seconds": 0.0}
        rms = np.sqrt((x[: k * win].reshape(k, win) ** 2).mean(axis=1))
        thresh = max(0.008, 3 * float(np.percentile(rms, 10)))
        return {"seconds": seconds, "peak": peak, "voiced_seconds": float((rms > thresh).sum() * 0.03)}
    except Exception:
        return None


def audio_looks_silent(stats) -> bool:
    if not stats:
        return False
    return stats["seconds"] < 0.8 or stats["peak"] < 0.02 or stats["voiced_seconds"] < 0.4


def parse_voice_response(response: str):
    """Return (transcript, interviewer_reply, error). error is None on success."""
    text = (response or "").strip()
    if not text or text.upper().startswith("NO_SPEECH_DETECTED"):
        return None, None, NO_SPEECH_MSG
    if "**You said:**" not in text:
        return None, None, "We couldn't reliably transcribe that recording, so nothing was submitted. Please record again or switch to Type mode."
    raw = text.split("**You said:**", 1)[1].strip()
    end = raw.find("\n\n")
    if end > 0:
        transcript, reply = raw[:end].strip(), raw[end:].strip()
    elif "\n" in raw:
        transcript, reply = raw.split("\n", 1)[0].strip(), raw.split("\n", 1)[1].strip()
    else:
        transcript, reply = raw[:250].strip(), ""
    transcript = transcript.strip(' "\u201c\u201d')
    if len(transcript.split()) < 3 or re.match(r"^[\[(]?\s*(silence|no speech|inaudible|unintelligible|nothing|no audio)", transcript, re.I):
        return None, None, NO_SPEECH_MSG
    return transcript, reply, None


def candidate_word_count(messages: list) -> int:
    n = 0
    for m in messages:
        if m.get("role") == "candidate":
            t = str(m.get("content", ""))
            if "[Voice answer]" in t:
                continue
            n += len(t.replace("🎙️", "").split())
    return n


# ──────────────────────────────────────────────────────────────────────────────
# GROQ TEXT PROVIDER  (used only when AI_PROVIDER=groq)
# ──────────────────────────────────────────────────────────────────────────────

_GROQ_SYSTEM_INSTRUCTION = (
    "You are an expert interviewer, recruiter, and career strategist "
    "with 20 years of experience conducting interviews at top companies."
)


def _call_groq(prompt: str, use_json: bool = False) -> str:
    """Route a text request to Groq via the OpenAI-compatible API."""
    kwargs: dict = {
        "model": GROQ_MODEL,
        "messages": [
            {"role": "system", "content": _GROQ_SYSTEM_INSTRUCTION},
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.7,
        "max_completion_tokens": 2048,
    }

    if use_json:
        kwargs["response_format"] = {"type": "json_object"}
        kwargs["extra_body"] = {
            "include_reasoning": False,
        }

    last_error = None

    for attempt in range(3):
        try:
            resp = groq_client.chat.completions.create(**kwargs)
            return resp.choices[0].message.content or ""

        except Exception as e:
            last_error = e
            error_msg = str(e).lower()

            if any(
                code in error_msg
                for code in [
                    "429",
                    "rate_limit",
                    "503",
                    "overloaded",
                    "unavailable",
                ]
            ):
                wait = (attempt + 1) * 5
                time.sleep(wait)
                continue

            elif any(
                code in error_msg
                for code in [
                    "401",
                    "403",
                    "authentication",
                    "invalid_api_key",
                ]
            ):
                raise RuntimeError(
                    "Groq authentication failed. Check your GROQ_API_KEY."
                ) from e

            elif "404" in error_msg or "model_not_found" in error_msg:
                raise RuntimeError(
                    f"Groq model '{GROQ_MODEL}' not found. "
                    "Check that the model ID is correct and available on your Groq plan."
                ) from e

            else:
                raise

    raise last_error # type: ignore[misc]


def test_groq_connection() -> dict:
    """Minimal health-check: sends a tiny request to verify Groq connectivity.

    Returns:
        {"ok": bool, "latency_ms": int | None, "error": str | None}
    """
    if not groq_client:
        return {
            "ok": False,
            "latency_ms": None,
            "error": "Groq client not initialized — GROQ_API_KEY is missing.",
        }

    _start = time.time()

    try:
        resp = groq_client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[{"role": "user", "content": "Reply with exactly: GROQ_OK"}],
            temperature=0,
            max_completion_tokens=64,
        )

        latency_ms = int((time.time() - _start) * 1000)
        content = (resp.choices[0].message.content or "").strip()

        if "GROQ_OK" in content:
            return {
                "ok": True,
                "latency_ms": latency_ms,
                "error": None,
            }

        return {
            "ok": False,
            "latency_ms": latency_ms,
            "error": f"Unexpected response (expected GROQ_OK): {content[:120]}",
        }

    except Exception as exc:
        latency_ms = int((time.time() - _start) * 1000)
        return {
            "ok": False,
            "latency_ms": latency_ms,
            "error": str(exc),
        }


ENABLE_SPONSOR_ADS = os.getenv("ENABLE_SPONSOR_ADS", "false").lower() == "true"


def run_sponsor_ad_countdown(target_type: str, target_id=None):
    """Display a 10-second sponsor ad with a real-time progress bar and clickable partner link to unlock content."""
    career_aff_url = os.getenv("AFFILIATE_CAREER_URL", "https://career.io")
    resume_aff_url = os.getenv("AFFILIATE_RESUME_URL", "https://resume.io")
    algo_aff_url = os.getenv("AFFILIATE_ALGO_URL", "https://algocamp.io")

    sponsor_ads = [
        {
            "brand": "⚡ Career.io Career Accelerator",
            "headline": "Professional Resume Optimization & Career Coaching",
            "cta": "Beat ATS scanners and increase interview callbacks by 3.5x.",
            "badge": "FEATURED CAREER PARTNER",
            "url": career_aff_url,
            "btn": "Claim Resume Review Offer",
        },
        {
            "brand": "📄 Resume.io AI Builder",
            "headline": "Land Your Dream Tech Offer with Expert Resumes",
            "cta": "Used by 15M+ candidates to land offers at Google, Meta, & startups.",
            "badge": "SPONSORED BY RESUME.IO",
            "url": resume_aff_url,
            "btn": "Build Optimized Resume",
        },
        {
            "brand": "💼 OfferNegotiator AI",
            "headline": "Candidates Secure an Average +$18,400 Higher Base Salary",
            "cta": "Use AI data models to negotiate compensation, equity, and bonuses.",
            "badge": "CAREER SPONSOR",
            "url": algo_aff_url,
            "btn": "Explore Salary Calculator",
        },
    ]
    ad = sponsor_ads[abs(hash(str(target_id or target_type))) % len(sponsor_ads)]

    slot = st.empty()
    pbar = st.progress(0)

    for sec in range(10, 0, -1):
        pct = int((10 - sec) / 10 * 100)
        pbar.progress(pct)
        slot.markdown(f"""
        <div class="sponsor-ad-card">
            <div style="font-size:0.75rem;font-weight:700;letter-spacing:1px;color:#ffd700;">
                📢 {ad['badge']} · UNLOCKING IN {sec}s...
            </div>
            <h3 style="margin:0.5rem 0;color:#fff;">{ad['brand']}</h3>
            <p style="font-size:0.95rem;color:#ddd;margin:0.25rem 0 0.4rem 0;">{ad['headline']}</p>
            <div style="font-size:0.8rem;color:#aaa;margin-bottom:0.75rem;">{ad['cta']}</div>
            <a href="{ad['url']}" target="_blank" rel="noopener noreferrer" 
               style="display:inline-block;background:#ffd700;color:#000;font-weight:800;
                      font-size:0.82rem;padding:6px 16px;border-radius:6px;text-decoration:none;">
                👉 {ad['btn']} ↗
            </a>
            <div style="font-size:0.7rem;color:#888;margin-top:0.5rem;">Your free interview strategy unlocks automatically at 0s</div>
        </div>
        """, unsafe_allow_html=True)
        time.sleep(1)

    pbar.progress(100)
    slot.empty()
    pbar.empty()

    if target_type == "question":
        if target_id not in st.session_state.unlocked_questions:
            st.session_state.unlocked_questions.append(target_id)
    elif target_type == "attacks":
        st.session_state.unlocked_attacks = True
    elif target_type == "voice":
        st.session_state.unlocked_voice = True

    st.toast("🎉 Content unlocked successfully!")
    st.rerun()


# ══════════════════════════════════════════════════════════════
# 🔑 RAZORPAY CONFIG  —  WHERE TO PUT YOUR KEY ID AND SECRET
# ──────────────────────────────────────────────────────────────
# DO NOT paste keys into this file (it is public on GitHub).
# Put them in Streamlit SECRETS instead:
#
#   • Streamlit Cloud : your app → ⋮ (menu) → Settings → Secrets
#   • Local (VS Code) : create  .streamlit/secrets.toml  (see secrets.toml.example)
#       RAZORPAY_KEY_ID     = "rzp_test_xxxxxxxxxxxx"      # ← YOUR KEY ID
#       RAZORPAY_KEY_SECRET = "xxxxxxxxxxxxxxxxxxxxxxxx"   # ← YOUR KEY SECRET
#       PRO_TOKEN           = "long-random-string"         # ← OPTIONAL temporary stopgap
#
# Use rzp_test_… keys while testing, rzp_live_… keys once Razorpay approves your website.
# Nothing unlocks Pro unless a payment is verified with Razorpay (or PRO_TOKEN matches).
# ══════════════════════════════════════════════════════════════
PASS_AMOUNT_PAISE = 4900  # ₹49 in paise. Change this if you change the price.


def get_secret(name: str) -> str:
    """Read a secret from Streamlit secrets, falling back to environment variables / .env."""
    try:
        value = st.secrets[name]
    except Exception:
        value = os.getenv(name, "")
    return str(value or "").strip()


@st.cache_resource
def _used_payments():
    return {}  # payment_id -> number of sessions unlocked (resets when the app restarts)


def verify_razorpay_payment(payment_id: str):
    """Ask Razorpay (server-side) whether this payment really happened. Returns (ok, message)."""
    payment_id = (payment_id or "").strip()
    # Razorpay's confirmation page shows the ID WITHOUT the "pay_" prefix, so accept it with or without
    if payment_id.lower().startswith("pay_"):
        payment_id = "pay_" + payment_id[4:]
    elif payment_id:
        payment_id = "pay_" + payment_id
    if not re.fullmatch(r"pay_[A-Za-z0-9]{8,30}", payment_id):
        return False, "That doesn't look like a Razorpay payment ID. Copy it exactly from your Razorpay confirmation page or receipt."
    key_id = get_secret("RAZORPAY_KEY_ID")          # 🔑 from secrets, see RAZORPAY CONFIG above
    key_secret = get_secret("RAZORPAY_KEY_SECRET")  # 🔑 from secrets, see RAZORPAY CONFIG above
    if not key_id or not key_secret:
        return False, "Payment verification isn't configured yet. Please contact support."
    try:
        r = requests.get(
            f"https://api.razorpay.com/v1/payments/{payment_id}",
            auth=(key_id, key_secret),
            timeout=10,
        )
    except requests.RequestException:
        return False, "Couldn't reach the payment provider. Try again in a minute."
    if r.status_code != 200:
        return False, "Payment not found."
    p = r.json()
    if p.get("status") != "captured" or p.get("amount") != PASS_AMOUNT_PAISE or p.get("currency") != "INR":
        return False, "This isn't a completed ₹49 payment."
    used = _used_payments()
    if used.get(payment_id, 0) >= 10:
        return False, "This payment ID has been used too many times."
    used[payment_id] = used.get(payment_id, 0) + 1
    return True, "Payment verified."


def render_pro_bar():
    """Render the Pro Pass status bar when unlocked; no intrusive banner in free mode."""
    if st.session_state.is_pro:
        st.markdown(
            '<div style="display:flex;align-items:center;justify-content:space-between;'
            'background:linear-gradient(90deg, #1f1c2c, #302b63);border:1px solid #ffd700;'
            'border-radius:10px;padding:0.75rem 1.2rem;margin-bottom:1.5rem;">'
            '<div><span class="pro-badge-active">👑 PRO PASS ACTIVE</span> '
            '<span style="color:#eee;font-size:0.9rem;margin-left:8px;">All questions, attack mode & unlimited voice unlocked</span></div>'
            '</div>',
            unsafe_allow_html=True,
        )
        with st.expander("🛠️ Pro Mode Controls (Testing)", expanded=False):
            if st.button("Switch to Free Mode (test paywall)", key="btn_switch_free"):
                st.session_state.is_pro = False
                st.session_state.unlocked_questions = [0, 1]
                st.session_state.unlocked_attacks = False
                st.session_state.unlocked_voice = False
                st.rerun()
    else:
        just_paid = "session" in st.query_params or "razorpay_payment_id" in st.query_params
        with st.expander("Already paid? Unlock with your payment ID", expanded=just_paid):
            if just_paid:
                st.caption("Just paid? Paste the Payment ID shown on Razorpay's confirmation page (or in your receipt email/SMS) to unlock Pro.")
            if st.session_state.get("pay_verify_msg"):
                st.error(st.session_state.pay_verify_msg)
            pid_in = st.text_input("Razorpay payment ID", placeholder="e.g. TeMioYSoJreLUD (with or without pay_)", key="pay_id_input")
            if st.button("Verify & unlock", key="btn_verify_pay"):
                st.session_state.pay_attempts = st.session_state.get("pay_attempts", 0) + 1
                if st.session_state.pay_attempts > 5:
                    st.error("Too many attempts. Refresh the page and try again.")
                else:
                    ok, msg = verify_razorpay_payment(pid_in)
                    if ok:
                        st.session_state.is_pro = True
                        st.session_state.pay_verify_msg = ""
                        st.rerun()
                    else:
                        st.error(msg)




@st.cache_data(ttl=300, show_spinner=False)
def get_available_models():
    """Fetch available models for the active provider. Cached for 5 minutes."""
    # Groq: return a controlled, validated list — no live discovery to avoid stale IDs
    if AI_PROVIDER == "groq":
        return [GROQ_MODEL]

    # Gemini: existing live-discovery behavior (unchanged)
    try:
        all_models = []
        for m in client.models.list():
            name = m.name.replace("models/", "")
            # Only include text generation models (not embedding, tts, etc.)
            if "gemini" in name and not any(x in name for x in [
                "embedding", "tts", "transcribe", "live", "image",
                "robotics", "computer-use", "audio", "omni", "translate",
                "customtools"
            ]):
                all_models.append(name)
        return sorted(all_models)
    except Exception:
        return ["gemini-3.5-flash", "gemini-3.5-flash-lite", "gemini-3.1-flash-lite"]


# Recommended models with labels
MODEL_LABELS = {
    "gemini-3.8-flash": "⭐ Top Rated",
    "gemini-3.7-flash": "⭐ Top Rated",
    "gemini-3.6-flash": "⭐ Recommended",
    "gemini-3.5-flash": "✅ Stable",
    "gemini-3.5-flash-lite": "⚡ Fast",
    "gemini-3.1-flash-lite": "⚡ Fast",
    "gemini-3-flash-preview": "🧪 Preview",
    "gemini-3.1-pro-preview": "🧪 Preview",
    "gemini-2.5-pro": "🧠 Advanced",
    "gemini-2.5-flash": "⚡ Fast",
}


def format_model_name(model_name: str) -> str:
    """Format model name with badge for the selectbox."""
    label = MODEL_LABELS.get(model_name, "")
    if label:
        return f"{model_name}  {label}"
    return model_name


def call_gemini(prompt: str, use_json: bool = False) -> str:
    """Call the active text AI provider (Gemini or Groq) with retry logic.

    The function name is preserved for backward compatibility with all existing
    call sites. When AI_PROVIDER=groq, requests are routed to Groq instead.
    """
    # ── Groq routing ────────────────────────────────────────────
    if AI_PROVIDER == "groq":
        return _call_groq(prompt, use_json=use_json)

    # ── Gemini (existing implementation — unchanged) ─────────────
    models_to_try = [MODEL, "gemini-3.5-flash", "gemini-3.5-flash-lite", "gemini-3.1-flash-lite"]
    seen = set()
    models_to_try = [m for m in models_to_try if not (m in seen or seen.add(m))]

    config = {
        "system_instruction": (
            "You are an expert interviewer, recruiter, and career strategist "
            "with 20 years of experience conducting interviews at top companies."
        ),
        "temperature": 0.7,
    }
    if use_json:
        config["response_mime_type"] = "application/json"

    last_error = None
    for model_name in models_to_try:
        for attempt in range(2):
            try:
                response = client.models.generate_content(
                    model=model_name, contents=prompt, config=config,
                )
                return response.text
            except Exception as e:
                last_error = e
                error_msg = str(e)
                if any(code in error_msg for code in ["503", "429", "UNAVAILABLE", "overloaded", "high demand"]):
                    time.sleep((attempt + 1) * 5)
                    continue
                elif "404" in error_msg or "NOT_FOUND" in error_msg:
                    break
                else:
                    raise e
    raise last_error


def parse_json_safe(text: str) -> dict:
    """Parse JSON from Gemini response, handling markdown code fences."""
    text = text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*\n?", "", text)
        text = re.sub(r"\n?```\s*$", "", text)
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        return None


# ──────────────────────────────────────────────────────────────
# PROMPTS
# ──────────────────────────────────────────────────────────────

def build_summary_prompt(resume_text: str, jd_text: str) -> str:
    return f"""Analyze this resume against the job description.

RESUME:
{resume_text}

JOB DESCRIPTION:
{jd_text}

Return ONLY valid JSON (no markdown, no explanation) in this exact format:
{{
  "fit_score": 75,
  "risk_level": "MEDIUM",
  "strengths": [
    "Recruitment Tech: Hands-on experience with AccioJob's two-sided hiring marketplace.",
    "AI & Automation: Shipped AI-powered voice agents and automated workflows.",
    "Startup Execution: Growth, GTM and Founder’s Office experience in fast-moving environments."
  ],
  "gaps": [
    "B2B SaaS: Limited dedicated enterprise B2B SaaS PM experience.",
    "Enterprise HR Tech: No direct experience with enterprise HRIS/payroll systems.",
    "Core PM: Less evidence of PRDs, feature architecture and traditional product ownership."
  ],
  "one_line": "Strong recruitment-tech, growth and AI experience, with a gap in traditional enterprise B2B SaaS PM experience."
}}

Rules:
- fit_score: integer 0-100 (Interview Readiness score)
- risk_level: "LOW", "MEDIUM", or "HIGH"
- strengths: exactly 3 items. MUST follow "Category: Description" format with a boldable 1-3 word category label before a colon (e.g. "Recruitment Tech: Hands-on experience...", "AI & Automation: Shipped voice agents..."). Keep descriptions concise and punchy.
- gaps: exactly 3 items. MUST follow "Category: Description" format with a boldable 1-3 word category label before a colon (e.g. "B2B SaaS: Limited dedicated enterprise...", "Core PM: Less evidence of PRDs..."). Keep descriptions concise and punchy.
- one_line: exactly one direct sentence summarizing overall fit, key strength domain, and the core gap. Do NOT start with candidate name (e.g. "Ambar is a...") or third-person preamble. Start directly with the substance (e.g. "Strong recruitment-tech, growth and AI experience, with a gap in traditional enterprise B2B SaaS PM experience.")
"""


def build_questions_prompt(resume_text: str, jd_text: str) -> str:
    return f"""Analyze this resume against the job description.

RESUME:
{resume_text}

JOB DESCRIPTION:
{jd_text}

Return ONLY valid JSON (no markdown, no explanation) in this exact format:
{{
  "questions": [
    {{
      "probability": 95,
      "category": "Resume→JD",
      "question": "The exact interview question",
      "why": "Why the interviewer will ask this",
      "testing": "What skill/trait they're evaluating",
      "answer_points": ["point 1", "point 2", "point 3"]
    }}
  ]
}}

Generate exactly 10 questions. Be SPECIFIC to this candidate, not generic.
Categories: "Resume→JD", "Resume→Suspicion", "JD→Gap", "Career Transition"
probability: integer 50-99
"""


def build_concerns_prompt(resume_text: str, jd_text: str) -> str:
    return f"""Analyze this resume against the job description.

RESUME:
{resume_text}

JOB DESCRIPTION:
{jd_text}

Return ONLY valid JSON (no markdown, no explanation) in this exact format:
{{
  "concerns": [
    {{
      "concern": "The specific concern",
      "severity": "HIGH",
      "why_it_matters": "Why this matters for this role",
      "how_to_address": "How the candidate should proactively address this"
    }}
  ]
}}

Generate 5-7 concerns. severity: "HIGH", "MEDIUM", or "LOW".
Be brutally honest but constructive. Specific to this candidate.
"""


def build_attack_prompt(resume_text: str, jd_text: str) -> str:
    return f"""You are a SKEPTICAL interviewer. Find weaknesses, exaggerations, and gaps.

RESUME:
{resume_text}

JOB DESCRIPTION:
{jd_text}

Return ONLY valid JSON (no markdown, no explanation) in this exact format:
{{
  "attacks": [
    {{
      "resume_claim": "Exact claim from the resume",
      "attack_question": "The tough question to ask",
      "what_could_go_wrong": "How the candidate might stumble",
      "defense": "How to defend this claim convincingly"
    }}
  ],
  "credibility_score": "STRONG",
  "credibility_reason": "Why this score"
}}

Generate 7-10 attacks. credibility_score: "STRONG", "SOME_RISKS", or "RED_FLAGS".
"""


def build_followup_prompt(resume_text: str, jd_text: str) -> str:
    return f"""You are an expert interviewer conducting a deep-dive interview.

RESUME:
{resume_text}

JOB DESCRIPTION:
{jd_text}

Return ONLY valid JSON (no markdown, no explanation) in this exact format:
{{
  "chains": [
    {{
      "topic": "Chain topic",
      "trigger": "What triggers this line of questioning",
      "questions": [
        {{
          "question": "The interview question",
          "listening_for": "What the interviewer wants to hear",
          "trap": "Common mistake candidates make"
        }}
      ],
      "ideal_arc": "Summary of what a great answer looks like"
    }}
  ]
}}

Generate exactly 3 chains with 5 questions each.
Chain 1: A resume achievement. Chain 2: A JD gap. Chain 3: Behavioral.
"""


def build_debrief_prompt(resume_text: str, jd_text: str, messages: list, is_single_round: bool = False) -> str:
    transcript_text = ""
    for idx, msg in enumerate(messages):
        role_label = "Interviewer" if msg["role"] == "interviewer" else "Candidate"
        transcript_text += f"\n[{role_label} Turn {idx+1}]:\n{msg['content']}\n"

    scope_instructions = (
        "This is an evaluation of Round 1 (High-Stakes Resume Claim Defense Trial)."
        if is_single_round else
        "This is a complete post-interview diagnostic debrief across all interview rounds."
    )

    return f"""You are an elite Senior Executive Hiring Bar Raiser and Principal Interview Evaluator.
Conduct an adversarial, deeply realistic, and grounded post-interview candidate debrief.

{scope_instructions}

CANDIDATE'S RESUME (SOURCE OF TRUTH):
{resume_text}

TARGET JOB DESCRIPTION:
{jd_text}

COMPLETE WORD-FOR-WORD INTERVIEW TRANSCRIPT:
{transcript_text}

CRITICAL GROUNDING REQUIREMENTS:
1. Under "weakest_answer", "strongest_answer", and "exposed_claims", you MUST cite EXACT phrases, metrics, or technologies spoken by the candidate in the transcript or written in their resume.
2. DO NOT hallucinate or invent resume claims or candidate answers that were not present. If the candidate\'s answers are missing, off-topic or too short to judge, say so plainly and score conservatively. Never credit the candidate for anything that appears only in the resume.
3. Rigorously evaluate across 3 diagnostic dimensions (0-100 each):
   - Quantitative Rigor & Baselines: Did the candidate provide baselines (e.g., from X to Y), specify sample sizes/scale, and isolate their individual contribution vs the broader team?
   - STAR Structure & Brevity: Did they keep context/situation under 20% of speaking time and spend >70% on concrete technical/strategic actions and measurable business results?
   - Resume Pressure Defense: Did they defend challenged claims with confidence and technical depth, or did they evade, waffle, or concede under skepticism?
4. Pinpoint the SINGLE most vulnerable answer where their defense cracked, and provide a concrete "recommended_rephrase" following the STAR framework.

Return ONLY valid JSON with this exact structure:
{{
  "overall_readiness_score": 76,
  "verdict": "Borderline — Vulnerable to Skeptical Interviewers",
  "executive_summary": "1-2 sentence executive assessment of candidate's interview readiness for this target JD",
  "scores": {{
    "quantitative_rigor": 62,
    "star_structure": 78,
    "pressure_defense": 68
  }},
  "strongest_answer": {{
    "question": "Exact question or claim challenged",
    "quote_or_summary": "Verbatim quote or exact summary of candidate's best response",
    "why_it_worked": "Why a senior hiring committee would score this high"
  }},
  "weakest_answer": {{
    "question": "Exact question where defense broke down",
    "claim_tested": "The specific resume bullet or metric that was challenged",
    "quote_or_gap": "Exact phrase where candidate was hand-wavy, lacked baseline, or stumbled",
    "why_it_failed": "Why a skeptical hiring manager would doubt this claim or probe deeper",
    "recommended_rephrase": "Concrete, 2-3 sentence STAR model answer that properly defends the metric with baseline and ownership"
  }},
  "exposed_resume_claims": [
    {{
      "bullet_claim": "Verbatim claim from resume that needs tighter defense",
      "risk_note": "What is risky about this claim in future interviews"
    }}
  ],
  "actionable_corrections": [
    "Specific correction 1",
    "Specific correction 2"
  ]
}}
"""


def generate_candidate_debrief(resume_text: str, jd_text: str, messages: list, is_single_round: bool = False) -> dict:
    """Generate the structured debrief. Never returns invented scores: if there is nothing to evaluate
    or the AI call fails, returns {"unavailable": True, "reason": ...} instead."""
    if candidate_word_count(messages) < 12:
        return {
            "unavailable": True,
            "reason": "We didn't capture enough of your answer to evaluate it. Please try again and answer out loud or in the text box.",
        }
    prompt = build_debrief_prompt(resume_text, jd_text, messages, is_single_round)
    try:
        raw_json = call_gemini(prompt, use_json=True)
        data = parse_json_safe(raw_json)
        if data and "overall_readiness_score" in data:
            return data
    except Exception:
        pass
    return {
        "unavailable": True,
        "reason": "We couldn't generate your evaluation this time because the AI service didn't respond. Nothing about your answers was scored. Please try again.",
    }


# ──────────────────────────────────────────────────────────────
# STEP INDICATOR
# ──────────────────────────────────────────────────────────────

def render_steps(current: int):
    steps_meta = [
        ("Target & Resume", "🎯"),
        ("AI Fit & Gaps", "📊"),
        ("Spoken Practice", "🎤")
    ]
    pills = ""
    for i, (label, icon) in enumerate(steps_meta):
        if i == current:
            cls = "step-pill active"
        elif i < current:
            cls = "step-pill completed"
        else:
            cls = "step-pill"
        pills += f'<span class="{cls}"><span class="step-dot"></span> {icon} {i+1}. {label}</span>'
    st.markdown(f'<div class="step-bar-container">{pills}</div>', unsafe_allow_html=True)


def render_candidate_debrief(debrief: dict, is_single_round: bool = False):
    if debrief.get("unavailable"):
        st.warning("📝 " + str(debrief.get("reason", "Evaluation unavailable.")))
        return
    score = debrief.get("overall_readiness_score", 70)
    verdict = debrief.get("verdict", "Evaluation Complete")
    summary = debrief.get("executive_summary", "")
    scores = debrief.get("scores", {})
    q_score = scores.get("quantitative_rigor", 60)
    s_score = scores.get("star_structure", 70)
    p_score = scores.get("pressure_defense", 65)

    badge_class = "high" if score >= 80 else ("med" if score >= 60 else "low")
    title_text = "🎯 Round 1 High-Stakes Defense Diagnostic" if is_single_round else "🎯 Complete Candidate Debrief & Readiness Diagnostic"

    # Exposed claims & vulnerability lead
    exposed = debrief.get("exposed_resume_claims", [])
    weakest = debrief.get("weakest_answer", {})
    exposed_count = len(exposed) if exposed else (1 if weakest and weakest.get("quote_or_gap") else 0)

    # 1. Lead with Vulnerability Exposure Alert
    if exposed_count > 0:
        claim_word = "claim" if exposed_count == 1 else "claims"
        st.markdown(f"""
        <div style="background:#2d1515;border:1px solid #ff7b72;border-left:4px solid #f85149;border-radius:10px;padding:12px 16px;margin-bottom:1.2rem;">
            <div style="display:flex;align-items:center;gap:8px;">
                <span style="font-size:1.25rem;">⚠️</span>
                <span style="font-weight:700;color:#ff7b72;font-size:1.02rem;">
                    You struggled to defend {exposed_count} resume {claim_word} under pressure
                </span>
            </div>
            <div style="font-size:0.85rem;color:#c9d1d9;margin-top:4px;">
                The interviewer detected unverified baselines or unclear individual ownership. Review the breakdown below and practice the recommended STAR defense formula.
            </div>
        </div>
        """, unsafe_allow_html=True)

    # 2. Progression Delta (if candidate re-drilled weak claim)
    prev_debrief = st.session_state.get("previous_debrief")
    if prev_debrief:
        prev_score = prev_debrief.get("overall_readiness_score", score)
        prev_scores = prev_debrief.get("scores", {})
        delta_score = score - prev_score
        delta_q = q_score - prev_scores.get("quantitative_rigor", q_score)
        delta_s = s_score - prev_scores.get("star_structure", s_score)
        delta_p = p_score - prev_scores.get("pressure_defense", p_score)

        def _fmt_delta(val):
            sign = "+" if val > 0 else ""
            color = "#3fb950" if val > 0 else ("#8b949e" if val == 0 else "#ff7b72")
            return f'<span style="color:{color};font-weight:700;">{sign}{val}%</span>'

        st.markdown(f"""
        <div style="background:#0d1f14;border:1px solid #238636;border-radius:10px;padding:12px 16px;margin-bottom:1.2rem;">
            <div style="font-weight:700;color:#3fb950;font-size:0.92rem;margin-bottom:6px;">
                📈 Re-drill Progression Delta (vs. Previous Attempt)
            </div>
            <div style="display:flex;flex-wrap:wrap;gap:18px;font-size:0.85rem;color:#c9d1d9;">
                <div>Overall Readiness: {_fmt_delta(delta_score)}</div>
                <div>Quantitative Rigor: {_fmt_delta(delta_q)}</div>
                <div>STAR Brevity: {_fmt_delta(delta_s)}</div>
                <div>Pressure Defense: {_fmt_delta(delta_p)}</div>
            </div>
        </div>
        """, unsafe_allow_html=True)

    st.markdown(f"""
    <div class="debrief-card">
        <div class="debrief-header">
            <div>
                <div style="font-size:1.25rem;font-weight:800;color:#fff;">{title_text}</div>
                <div style="font-size:0.9rem;color:#8b949e;margin-top:2px;">Hiring Verdict: <strong style="color:#fff;">{verdict}</strong></div>
            </div>
            <div>
                <span class="readiness-badge {badge_class}">{score}/100</span>
            </div>
        </div>
        <p style="font-size:0.95rem;color:#c9d1d9;line-height:1.6;margin-bottom:1.2rem;">
            {summary}
        </p>
    </div>
    """, unsafe_allow_html=True)

    # 3 Diagnostic Sub-Scores
    col_s1, col_s2, col_s3 = st.columns(3)
    with col_s1:
        st.metric("📊 Quantitative Rigor", f"{q_score}%")
        st.progress(max(0.0, min(1.0, q_score / 100)))
    with col_s2:
        st.metric("🎯 STAR Brevity", f"{s_score}%")
        st.progress(max(0.0, min(1.0, s_score / 100)))
    with col_s3:
        st.metric("🛡️ Pressure Defense", f"{p_score}%")
        st.progress(max(0.0, min(1.0, p_score / 100)))

    # Strongest Answer Card
    strongest = debrief.get("strongest_answer", {})
    if strongest and strongest.get("quote_or_summary"):
        st.markdown(f"""
        <div class="highlight-card strong">
            <div style="font-size:0.8rem;font-weight:700;color:#3fb950;text-transform:uppercase;letter-spacing:0.5px;">
                🏆 Standout Defense ({strongest.get('question', 'Key Claim')})
            </div>
            <div style="font-size:0.9rem;color:#e6edf3;margin:0.4rem 0;">
                <em>"{strongest.get('quote_or_summary', '')}"</em>
            </div>
            <div style="font-size:0.85rem;color:#8b949e;">
                ✅ <strong>Why this scored high:</strong> {strongest.get('why_it_worked', '')}
            </div>
        </div>
        """, unsafe_allow_html=True)

    # Weakest Answer Card with Recommended Fix
    weakest = debrief.get("weakest_answer", {})
    if weakest and weakest.get("quote_or_gap"):
        st.markdown(f"""
        <div class="highlight-card weak">
            <div style="font-size:0.8rem;font-weight:700;color:#ff7b72;text-transform:uppercase;letter-spacing:0.5px;">
                ⚠️ Most Vulnerable Defense ({weakest.get('claim_tested', 'Targeted Claim')})
            </div>
            <div style="font-size:0.9rem;color:#e6edf3;margin:0.4rem 0;">
                <em>"{weakest.get('quote_or_gap', '')}"</em>
            </div>
            <div style="font-size:0.85rem;color:#ff7b72;margin-bottom:0.4rem;">
                ❌ <strong>Where defense cracked:</strong> {weakest.get('why_it_failed', '')}
            </div>
            <div class="defense-script-box">
                <div style="font-size:0.75rem;font-weight:700;color:#58a6ff;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">
                    💡 Recommended High-Impact STAR Defense Formula:
                </div>
                {weakest.get('recommended_rephrase', '')}
            </div>
        </div>
        """, unsafe_allow_html=True)

    # Exposed claims
    exposed = debrief.get("exposed_resume_claims", [])
    if exposed:
        with st.expander("🔍 Exposed Resume Claims Flagged for Real Interviews", expanded=False):
            for item in exposed:
                st.markdown(f"- **Claim:** `{item.get('bullet_claim', '')}`\n  ⚠️ *Risk:* {item.get('risk_note', '')}")

    # Actionable corrections
    corrections = debrief.get("actionable_corrections", [])
    if corrections:
        with st.expander("🛠️ Key Tactical Corrections Before Live Interview", expanded=False):
            for c in corrections:
                st.markdown(f"• {c}")

    # The Re-drill Action & Next Steps
    st.markdown("---")
    
    # 1. Primary
    if st.button("🔥 Practice Defending Your Weakest Claim Again", type="primary", use_container_width=True):
        st.session_state.previous_debrief = debrief
        st.session_state.active_redrill = debrief.get("weakest_answer")
        st.session_state.mock_messages = []
        st.session_state.mock_debrief = None
        st.session_state.interview_concluded = False
        st.session_state.clarification_used = False
        st.session_state["last_spoken"] = -1
        st.rerun()

    # 2. Paid conversion
    if is_single_round and not st.session_state.is_pro:
        st.link_button("👑 Unlock Full 4-Round Interview & Dossier — ₹49", "https://rzp.io/rzp/vSIuH5yL", use_container_width=True)
    else:
        if st.button("🔄 Start Fresh 4-Round Interview", use_container_width=True):
            st.session_state.previous_debrief = debrief
            st.session_state.active_redrill = None
            st.session_state.mock_messages = []
            st.session_state.mock_debrief = None
            st.session_state.interview_concluded = False
            st.session_state.clarification_used = False
            st.session_state["last_spoken"] = -1
            st.rerun()

    # ── 1-Click Debrief & Action Plan Export ──
    report_lines = [
        f"# Candidate Interview Debrief & Readiness Diagnostic",
        f"**Platform:** PrepInterview AI (https://prepinterview.online)",
        f"**Overall Readiness Score:** {score}/100",
        f"**Hiring Committee Verdict:** {verdict}\n",
        f"## Executive Assessment",
        f"{summary}\n",
        f"## Diagnostic Rubrics",
        f"- **Quantitative Rigor & Baselines:** {q_score}%",
        f"- **STAR Structure & Brevity:** {s_score}%",
        f"- **Resume Pressure Defense:** {p_score}%\n",
    ]
    if strongest and strongest.get("quote_or_summary"):
        report_lines.extend([
            f"## 🏆 Standout Defense ({strongest.get('question', 'Key Claim')})",
            f"> \"{strongest.get('quote_or_summary', '')}\"\n",
            f"**Why this scored high:** {strongest.get('why_it_worked', '')}\n"
        ])
    if weakest and weakest.get("quote_or_gap"):
        report_lines.extend([
            f"## ⚠️ Most Vulnerable Defense ({weakest.get('claim_tested', 'Targeted Claim')})",
            f"> \"{weakest.get('quote_or_gap', '')}\"\n",
            f"**Where defense cracked:** {weakest.get('why_it_failed', '')}\n",
            f"### Recommended High-Impact STAR Defense Formula:",
            f"{weakest.get('recommended_rephrase', '')}\n"
        ])
    if exposed:
        report_lines.append("## 🔍 Exposed Resume Claims Flagged")
        for item in exposed:
            report_lines.append(f"- **Claim:** {item.get('bullet_claim', '')} (Risk: {item.get('risk_note', '')})")
        report_lines.append("")
    if corrections:
        report_lines.append("## 🛠️ Tactical Action Checklist Before Live Interview")
        for c in corrections:
            report_lines.append(f"- {c}")
    debrief_export_md = "\n".join(report_lines)

    # 3. Free utility
    st.download_button(
        "📥 Download Full Debrief & Prep Action Plan",
        data=debrief_export_md,
        file_name="candidate_debrief_report.md",
        mime="text/markdown",
        use_container_width=True,
    )



# ──────────────────────────────────────────────────────────────
# DEVELOPER SIDEBAR  (only visible when PREPINTERVIEW_DEV_MODE=1)
# ──────────────────────────────────────────────────────────────

if os.getenv("PREPINTERVIEW_DEV_MODE") == "1":
    with st.sidebar:
        st.markdown("---")
        st.markdown("#### 🛠️ Developer Panel")

        # Provider status — never expose keys
        provider_label = f"**Text AI:** `{AI_PROVIDER.upper()}`"
        if AI_PROVIDER == "groq":
            provider_label += f"  \n**Groq Model:** `{GROQ_MODEL}`"
        st.markdown(provider_label)

        _gemini_status = "✅ Configured" if gemini_client else "❌ No key"
        _groq_status = "✅ Configured" if groq_client else "❌ No key"
        st.markdown(
            f"**Gemini client:** {_gemini_status}  \n"
            f"**Groq client:** {_groq_status}  \n"
            f"**Voice AI:** Gemini always"
        )

        if groq_client:
            if st.button("🔌 Test Groq Connection", key="_dev_groq_test"):
                with st.spinner("Testing Groq…"):
                    _result = test_groq_connection()
                if _result["ok"]:
                    st.success(
                        f"✅ Groq connected  \n"
                        f"Model: `{GROQ_MODEL}`  \n"
                        f"Latency: {_result['latency_ms']} ms"
                    )
                else:
                    st.error(f"❌ Groq error: {_result['error']}")
        else:
            st.info("Add GROQ_API_KEY to enable Groq connection test.")

        st.markdown("---")

# ──────────────────────────────────────────────────────────────
# SESSION STATE
# ──────────────────────────────────────────────────────────────

for key, default in [
    ("step", 0), ("results", {}),
    ("resume_text", ""), ("jd_text", ""),
    ("selected_model", "gemini-3.5-flash"),
    ("elapsed_time", 0),
    ("mock_messages", []),
    ("is_pro", False),
    ("unlocked_questions", [0, 1]),
    ("unlocked_attacks", False),
    ("unlocked_voice", False),
    ("mock_debrief", None),
    ("clarification_used", False),
    ("interview_concluded", False),
    ("active_redrill", None),
]:
    if key not in st.session_state:
        st.session_state[key] = default

# ── PRO UNLOCK ──────────────────────────────────────────────
# URL flags such as ?session=paid or ?pass=... NO LONGER unlock anything.
# Pro is granted only by (a) a payment that Razorpay confirms server-side, or
# (b) the optional temporary PRO_TOKEN stopgap (secret, unguessable).
_pro_token = get_secret("PRO_TOKEN")  # 🔑 OPTIONAL: set in secrets, then use ?session=<PRO_TOKEN> as the payment-link redirect
if _pro_token and hmac.compare_digest(str(st.query_params.get("session", "")), _pro_token):
    st.session_state.is_pro = True

_pid = str(st.query_params.get("razorpay_payment_id", "") or "").strip()
if _pid and not st.session_state.is_pro:
    _checked = st.session_state.setdefault("pay_checked", {})
    if _pid not in _checked:  # verify each ID once per session (no repeated API calls on reruns)
        _checked[_pid] = verify_razorpay_payment(_pid)
    _ok, _msg = _checked[_pid]
    if _ok:
        st.session_state.is_pro = True
        st.session_state.pay_verify_msg = ""
    else:
        st.session_state.pay_verify_msg = _msg

# Apply model from session state
MODEL = st.session_state.selected_model


def clean_jd_text(text: str) -> str:
    """Strip LinkedIn UI leftovers from a job description passed in the URL (older extension versions
    leave a trailing "… more" / "see more" / "show less" toggle)."""
    t = re.sub(r"^\s*about the job\s*", "", str(text or ""), flags=re.I)
    for _ in range(3):
        t = re.sub(r"[\s\u00a0]*(?:\.{2,}|\u2026)[\s\u00a0]*(?:see[\s\u00a0]+)?more[\s\u00a0]*$", "", t, flags=re.I)
        t = re.sub(r"[\s\u00a0]*(?:see|show)[\s\u00a0]+(?:more|less)[\s\u00a0]*$", "", t, flags=re.I)
    return t.strip()


# Copilot-style arrival card + small-screen tuning (v2)
st.markdown("""
<style>
    .prep-arrival-card {
        background: #161b22;
        border: 1px solid #30363d;
        border-left: 3px solid #1f6feb;
        border-radius: 8px;
        padding: 12px 16px;
        margin: 0 0 1.2rem 0;
    }
    .prep-arrival-top { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
    .prep-arrival-brand { font-size: 12px; font-weight: 600; color: #8b949e; }
    .prep-arrival-label { font-size: 11px; color: #8b949e; text-transform: uppercase; letter-spacing: 0.5px; }
    .prep-arrival-role { font-size: 1.3rem; font-weight: 700; color: #f0f6fc; line-height: 1.25; margin-top: 2px; }
    .prep-arrival-company { font-size: 0.95rem; color: #c9d1d9; margin-top: 2px; }
    .prep-arrival-ok { font-size: 12px; font-weight: 500; color: #3fb950; margin-top: 10px; }
    @media (max-width: 640px) {
        .hero-title { font-size: 1.6rem; }
        .hero-sub { font-size: 0.92rem; }
    }
</style>
""", unsafe_allow_html=True)


# ══════════════════════════════════════════════════════════════
# STEP 0: INPUT
# ══════════════════════════════════════════════════════════════

if st.session_state.step == 0:
    render_steps(0)

    # Deep-link from the LinkedIn Copilot extension (?jd=&title=&company=)
    param_jd = clean_jd_text(st.query_params.get("jd", ""))
    param_title = (st.query_params.get("title", "") or "").strip()
    if param_title.lower() == "target role":
        param_title = ""
    param_company = (st.query_params.get("company", "") or "").strip()

    if param_jd and not st.session_state.get("prefill_jd"):
        st.session_state["prefill_jd"] = param_jd
        st.session_state["prefill_title"] = param_title
        st.session_state["prefill_company"] = param_company

    prefilled_jd = st.session_state.get("prefill_jd", "")
    prefilled_title = st.session_state.get("prefill_title", "")
    prefilled_company = st.session_state.get("prefill_company", "")
    arrived_from_copilot = bool(prefilled_jd)

    jd_placeholder = "Paste the target job description or key role requirements here..."

    if arrived_from_copilot:
        # Copilot-style arrival: one clear task (upload resume), job already known
        st.markdown('<p class="hero-title">Prepare for this interview</p>', unsafe_allow_html=True)
        st.markdown(
            '<p class="hero-sub" style="margin-bottom:1.2rem;">'
            'Upload your resume. We find the claims an interviewer is most likely to challenge for this role, '
            'then you practice defending them out loud.'
            '</p>',
            unsafe_allow_html=True,
        )
        role_txt = prefilled_title if prefilled_title and prefilled_title.lower() != "target role" else "this role"
        role_html = html_lib.escape(role_txt)  # URL params are untrusted: always escape
        company_html = (
            f'<div class="prep-arrival-company">at {html_lib.escape(prefilled_company)}</div>'
            if prefilled_company else ""
        )
        jd_words = len(prefilled_jd.split())
        # NOTE: keep this HTML free of blank lines and indentation, or Markdown renders it as a code block.
        card_html = "".join([
            '<div class="prep-arrival-card">',
            '<div class="prep-arrival-top">',
            '<span class="prep-arrival-brand">PrepInterview</span>',
            '<span class="prep-beta-tag">From LinkedIn Copilot</span>',
            '</div>',
            '<div class="prep-arrival-label">Preparing for</div>',
            f'<div class="prep-arrival-role">{role_html}</div>',
            company_html,
            f'<div class="prep-arrival-ok"><span aria-hidden="true">\u2713</span> Job description pre-filled \u00b7 {jd_words:,} words</div>',
            '</div>',
        ])
        st.markdown(card_html, unsafe_allow_html=True)
    else:
        st.markdown('<p class="hero-title">Find What Interviewers Will Challenge on Your Resume</p>', unsafe_allow_html=True)
        st.markdown(
            '<p class="hero-sub" style="margin-bottom:1.2rem;">'
            'Upload your resume and target job description. We pinpoint the exact claims an interviewer will challenge, grill you in a realistic spoken mock interview, and score your defense under pressure.'
            '</p>',
            unsafe_allow_html=True,
        )

    # ── Resume Upload ──
    st.markdown(
        f'<p class="input-label">{"Upload your resume (PDF)" if arrived_from_copilot else "1. Upload Your Resume (PDF)"}</p>',
        unsafe_allow_html=True,
    )
    resume_file = st.file_uploader(
        "Resume",
        type=["pdf"],
        label_visibility="collapsed",
        help="Upload your resume as a PDF",
    )
    if resume_file:
        st.success(f"✓ {resume_file.name}")
    st.markdown(
        '<p style="font-size:0.75rem;color:#3fb950;margin-top:-6px;margin-bottom:14px;">'
        '🔒 Not stored on our servers · Sent to an AI service only to generate your results'
        '</p>',
        unsafe_allow_html=True,
    )

    # ── Job Description ──
    if arrived_from_copilot:
        # Already known from LinkedIn: keep it out of the way, but editable
        with st.expander("Review or edit the job description", expanded=False):
            jd_input = st.text_area(
                "Job Description",
                value=prefilled_jd,
                height=160,
                placeholder=jd_placeholder,
                label_visibility="collapsed",
            )
    else:
        st.markdown('<p class="input-label">2. Target Job Description</p>', unsafe_allow_html=True)
        jd_input = st.text_area(
            "Job Description",
            value="",
            height=160,
            placeholder=jd_placeholder,
            label_visibility="collapsed",
        )

    # ── Optional Settings (Interviewer Persona) ──
    with st.expander("⚙️ Optional: Change Interviewer Persona (Default: Strategic Hiring Manager)", expanded=False):
        archetypes = [
            "🎯 Strategic Hiring Manager & Team Lead",
            "🚀 High-Velocity Startup Founder / CEO",
            "🧐 Skeptical Senior Domain Specialist",
            "🤝 Executive Bar Raiser & People Lead",
        ]
        current_arch = st.session_state.get("interviewer_archetype", archetypes[0])
        arch_idx = archetypes.index(current_arch) if current_arch in archetypes else 0
        selected_archetype = st.selectbox(
            "Interviewer Persona",
            archetypes,
            index=arch_idx,
            label_visibility="collapsed",
        )
        st.session_state["interviewer_archetype"] = selected_archetype
        archetype_notes = {
            "🎯 Strategic Hiring Manager & Team Lead": "Focuses on structured STAR thinking, execution frameworks, prioritization (RICE/MoSCoW), and cross-functional collaboration.",
            "🚀 High-Velocity Startup Founder / CEO": "Demands concrete revenue impact, speed to market, cost discipline, and extreme ownership under ambiguity.",
            "🧐 Skeptical Senior Domain Specialist": "Deep-dives into technical architecture, data integrity, statistical validity, and unverified resume metrics.",
            "🤝 Executive Bar Raiser & People Lead": "Evaluates managing difficult stakeholders, accountability in failures, ethics, and communication composure.",
        }
        st.caption(f"ℹ️ {archetype_notes.get(selected_archetype, '')}")

    # ── Instant Sample Demo & Primary CTA ──
    st.markdown("")
    col_cta1, col_cta2 = st.columns([2, 1])
    with col_cta1:
        if st.button("Analyze my fit & start free →" if arrived_from_copilot else "Scan My Resume & Start Free →", type="primary", use_container_width=True):
            if not resume_file or not jd_input.strip():
                st.error("Please upload your resume and provide the target job description.")
            else:
                resume_text = extract_pdf_text(resume_file)
                if not resume_text.strip():
                    st.error("Could not extract text from your PDF. Make sure it's not a scanned image.")
                else:
                    st.session_state.resume_text = resume_text
                    st.session_state.jd_text = jd_input.strip()
                    st.session_state.step = 1
                    st.rerun()
    with col_cta2:
        if st.button("⚡ Try 1-Click Demo", use_container_width=True, help="Test instantly with pre-loaded realistic resume and job description"):
            st.session_state.resume_text = (
                "Alex Rivera — Senior Growth & Analytics Lead\n"
                "- Led mobile web checkout redesign, boosting conversion rate by 42% across 1.2M monthly active sessions.\n"
                "- Migrated experimentation stack to GrowthBook, accelerating team velocity from 2 to 14 A/B tests per month.\n"
                "- Spearheaded user retention initiative reducing 30-day cohort churn from 11.8% to 7.4% via automated onboarding flows.\n"
                "- Built real-time analytics warehouse in PostgreSQL and Metabase serving 65+ daily cross-functional stakeholders.\n"
                "- Managed ₹18L monthly performance marketing budget with a blended ROAS of 3.1x across Meta and Google Ads."
            )
            st.session_state.jd_text = (
                "Senior Product Manager / Growth Lead\n\n"
                "About the Role:\n"
                "We are seeking a high-velocity Senior Growth PM to lead our core acquisition and conversion funnels. "
                "You will drive high-impact experimentation, partner with engineering and design to eliminate friction, "
                "and defend growth hypotheses using rigorous statistical validation.\n\n"
                "Requirements:\n"
                "- Proven track record of measurable business impact with clear personal attribution.\n"
                "- Deep expertise in A/B test design, sample sizes, and isolating seasonal confounders.\n"
                "- Strong technical understanding of product analytics and data modeling.\n"
                "- Exceptional communication and ability to defend decisions under executive skepticism."
            )
            st.session_state.step = 1
            st.rerun()

    # ── Clean Footer & Collapsed FAQ ──
    st.markdown("---")
    with st.expander("❓ Frequently Asked Questions (Who Built This, Privacy & Free Tier)"):
        st.markdown("""
        **1. Who built PrepInterview AI?**  
        PrepInterview was built independently by Ambar, a product and tech builder who kept seeing candidates (and himself) get blindsided by tough resume-defense questions in interviews. Most interview prep tools just ask generic questions like *"Tell me about yourself."* PrepInterview was built to do the uncomfortable, necessary work: testing whether you can actually defend every number and claim on your resume.

        **2. What happens to my uploaded resume and audio recordings?**  
        We do not store your resume or audio on our own servers. They are held in memory during your session and discarded afterwards. To generate your results, your content is sent to a third-party AI service. During this beta we use the provider's free tier, where the provider may use submitted content to improve its products. We never sell your data to recruiters. Please avoid uploading highly sensitive information.
        
        **3. How does Resume Attack Mode work?**  
        Unlike generic interview bots that ask textbook questions, our engine extracts the exact claims and quantitative metrics from your resume and tests whether you can defend their baselines, methodology, and trade-offs under pressure.
        
        **4. Is this only for Software Engineers?**  
        No! Our rubrics are role-aware. For Product Managers, Growth leads, and Business/MBA candidates, we probe unit economics, attribution, A/B testing rigor, and stakeholder alignment. For technical roles, we probe system architecture, edge cases, and scaling limits.
        
        **5. What is Free vs. what does the ₹49 Pro Pass include?**  
        • **100% Free:** Full resume vulnerability audit (top 5 predicted questions & claim risks), 1-click instant demo, and Round 1 of the spoken voice interview.  
        • **₹49 Pro Pass (One-Time):** Full 4-round mock interview with adaptive grilling, all written defense playbooks for every flagged claim, and downloadable Prep Dossier. Zero subscriptions.
        """)

    st.markdown("""
    <div style="text-align:center;margin:1.5rem 0 1rem 0;font-size:0.75rem;color:#6e7681;line-height:1.8;">
        <div>PrepInterview AI · Autonomous Interview Preparation for Tech & Non-Tech Roles</div>
        <div>
            <a href="https://prepinterview.online/privacy.html" target="_blank" style="color:#8b949e;text-decoration:none;margin:0 8px;">Privacy Policy</a> · 
            <a href="https://prepinterview.online/terms.html" target="_blank" style="color:#8b949e;text-decoration:none;margin:0 8px;">Terms of Service & Refund Policy</a> · 
            <a href="https://docs.google.com/forms/d/e/1FAIpQLSfP0mZBcah9TZ6qwmtVBkeFUSUX180q5E9OyDy7w2lwMSbYnw/viewform" target="_blank" style="color:#8b949e;text-decoration:none;margin:0 8px;">Support & Feedback Form</a>
        </div>
    </div>
    """, unsafe_allow_html=True)


# ══════════════════════════════════════════════════════════════
# STEP 1: ANALYZING (countdown timer + progress)
# ══════════════════════════════════════════════════════════════

elif st.session_state.step == 1:
    render_steps(1)


    resume_text = st.session_state.resume_text
    jd_text = st.session_state.jd_text
    results = {}

    # Countdown timer display
    timer_placeholder = st.empty()
    status = st.empty()
    progress = st.progress(0)
    estimate_note = st.empty()
    estimate_note.markdown(
        '<p class="timer-sub">⏱️ Estimated time: ~60–90 seconds. We\'re running 5 AI analyses on your resume.</p>',
        unsafe_allow_html=True,
    )

    start_time = time.time()

    def update_timer():
        elapsed = int(time.time() - start_time)
        mins, secs = divmod(elapsed, 60)
        timer_placeholder.markdown(
            f'<p class="timer-text">{mins:02d}:{secs:02d}</p>',
            unsafe_allow_html=True,
        )

    phases = [
        (10,  "🔍 Reading your resume and cross-referencing with the JD...",
         lambda: call_gemini(build_summary_prompt(resume_text, jd_text), use_json=True), "summary"),
        (30,  "🎯 Predicting the most likely interview questions...",
         lambda: call_gemini(build_questions_prompt(resume_text, jd_text), use_json=True), "questions"),
        (55,  "⚠️ Identifying interviewer concerns and red flags...",
         lambda: call_gemini(build_concerns_prompt(resume_text, jd_text), use_json=True), "concerns"),
        (75,  "🥊 Stress-testing your resume claims...",
         lambda: call_gemini(build_attack_prompt(resume_text, jd_text), use_json=True), "attack"),
        (90,  "🔗 Building realistic follow-up chains...",
         lambda: call_gemini(build_followup_prompt(resume_text, jd_text), use_json=True), "followups"),
    ]

    try:
        for pct, msg, fn, key in phases:
            update_timer()
            status.markdown(f"**{msg}**")
            progress.progress(pct)
            raw = fn()
            results[key] = parse_json_safe(raw)

        progress.progress(100)
        update_timer()
        elapsed = int(time.time() - start_time)
        status.markdown("✅ **Analysis complete!**")
        estimate_note.empty()
        time.sleep(0.5)

        st.session_state.results = results
        st.session_state.elapsed_time = elapsed
        st.session_state.step = 2
        st.rerun()

    except Exception as e:
        timer_placeholder.empty()
        progress.empty()
        status.empty()
        estimate_note.empty()

        elapsed = int(time.time() - start_time)
        st.error(f"Something went wrong after {elapsed}s: {str(e)[:200]}")
        st.markdown(
            "**What to try:**\n"
            "- Go back and switch to a different model in Advanced Settings\n"
            "- Wait a minute (Google's servers may be temporarily overloaded)\n"
            "- Try `gemini-3.5-flash-lite` or `gemini-3.1-flash-lite` — they're lighter and more available"
        )
        if st.button("← Go back"):
            st.session_state.step = 0
            st.rerun()


# ══════════════════════════════════════════════════════════════
# STEP 2: RESULTS
# ══════════════════════════════════════════════════════════════

elif st.session_state.step == 2:
    # ── Top Navigation & Quick Action ──
    col_nav_s2, col_cta_s2 = st.columns([1, 2])
    with col_nav_s2:
        if st.button("← Upload Different Resume", use_container_width=True, key="btn_top_new_analysis"):
            st.session_state.step = 0
            st.session_state.results = {}
            st.session_state.mock_messages = []
            st.rerun()
    with col_cta_s2:
        if st.button("🎤 Practice Spoken Defense (Live Mock) →", type="primary", use_container_width=True, key="btn_top_start_mock"):
            st.session_state.step = 3
            st.session_state.mock_messages = []
            st.session_state.mock_debrief = None
            st.session_state.interview_concluded = False
            st.session_state.active_redrill = None
            st.session_state.clarification_used = False
            st.rerun()

    render_steps(2)
    results = st.session_state.results

    # ── Elapsed time banner ──
    elapsed = st.session_state.get("elapsed_time", 0)
    if elapsed > 0:
        st.markdown(
            f'<div style="text-align:center;padding:0.6rem;background:#111;border:1px solid #2a2a2a;'
            f'border-radius:10px;margin-bottom:1.5rem;">'
            f'<span style="color:#4CAF50;font-weight:700;">✅ Full 5-step analysis took only {elapsed} seconds</span>'
            f'</div>',
            unsafe_allow_html=True,
        )

    # ── Header metrics ──
    summary = results.get("summary", {})
    if summary:
        fit = summary.get("fit_score", "?")
        risk_raw = str(summary.get("risk_level", "?")).upper()
        risk_map = {
            "LOW": ("Low", "#3fb950"),
            "MEDIUM": ("Medium", "#d29922"),
            "HIGH": ("High", "#ff7b72")
        }
        risk_label, risk_color = risk_map.get(risk_raw, (risk_raw.capitalize(), "#8b949e"))
        one_line = summary.get("one_line", "").strip()

        # Clean any legacy third-person preamble
        if one_line:
            clean_one_line = re.sub(r'^(?:[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?|The candidate)\s+is\s+(?:an?|the)\s+.*?\b(?:with|who|having)\s+', '', one_line, flags=re.IGNORECASE)
            if clean_one_line and clean_one_line != one_line:
                one_line = clean_one_line[0].upper() + clean_one_line[1:]

        target_title = html_lib.escape(st.session_state.get("prefill_title", ""))  # URL params are untrusted
        target_company = html_lib.escape(st.session_state.get("prefill_company", ""))
        context_html = ""
        if target_title:
            comp_str = f" at <strong>{target_company}</strong>" if target_company else ""
            context_html = f'<div style="font-size:12px;color:#8b949e;margin-top:6px;">Target: <strong style="color:#f0f6fc;">{target_title}</strong>{comp_str}</div>'

        st.html(f"""
        <div class="copilot-card" style="text-align:center;padding:1.4rem 1.2rem;margin-bottom:1.2rem;">
            <div style="display:inline-flex;align-items:center;gap:8px;margin-bottom:8px;">
                <span class="prep-score-pill">
                    <span class="prep-status-dot" style="background-color:{risk_color};"></span>
                    <strong>{fit}%</strong> Interview Readiness
                </span>
                <span class="prep-beta-tag">{risk_label} Risk</span>
            </div>
            {context_html}
            <div style="color:#c9d1d9;font-size:1rem;line-height:1.5;margin-top:10px;max-width:640px;margin-left:auto;margin-right:auto;">
                {one_line}
            </div>
        </div>
        """)

        def format_scannable_bullet(item: str) -> str:
            item = item.strip()
            if item.startswith("-"):
                item = item.lstrip("-").strip()
            if item.startswith("**"):
                return f"- {item}"
            if ":" in item:
                cat, desc = item.split(":", 1)
                if len(cat.strip()) <= 35:
                    return f"- **{cat.strip()}:** {desc.strip()}"
            return f"- {item}"

        col1, col2 = st.columns(2)
        with col1:
            st.html("""
            <div style="font-size:12px;font-weight:700;color:#3fb950;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.5px;">
                ✅ Why You Match (Strengths)
            </div>
            """)
            for s in summary.get("strengths", []):
                st.markdown(format_scannable_bullet(s))
        with col2:
            st.html("""
            <div style="font-size:12px;font-weight:700;color:#ff7b72;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.5px;">
                ⚠️ Gaps to Defend (Review Areas)
            </div>
            """)
            for g in summary.get("gaps", []):
                st.markdown(format_scannable_bullet(g))

    st.html("<div style='height:12px;'></div>")
    render_pro_bar()

    # ── Tabbed results ──
    tab1, tab2, tab3, tab4 = st.tabs([
        "🎯 Top Questions",
        "⚠️ Concerns",
        "🥊 Attack Mode",
        "🔗 Follow-ups",
    ])

    # ── Tab 1: Questions ──
    with tab1:
        questions_data = results.get("questions", {})
        questions = questions_data.get("questions", []) if questions_data else []

        if questions:
            for i, q in enumerate(questions):
                prob = q.get("probability", 50)
                prob_class = "high" if prob >= 80 else "med"
                category = q.get("category", "")

                st.markdown(
                    f'<div class="q-card">'
                    f'<span class="q-prob {prob_class}">🔥 {prob}%</span> '
                    f'<span style="font-size:0.75rem;color:#666;">{category}</span>'
                    f'<div class="q-text">{q.get("question", "")}</div>'
                    f'<div class="q-meta">'
                    f'<strong>Why:</strong> {q.get("why", "")}<br>'
                    f'<strong>Testing:</strong> {q.get("testing", "")}'
                    f'</div></div>',
                    unsafe_allow_html=True,
                )

                # Top 5 questions are 100% UNLOCKED with full answer strategies
                is_q_unlocked = st.session_state.is_pro or (i < 5) or (i in st.session_state.unlocked_questions)
                if is_q_unlocked:
                    with st.expander("💡 How to answer", expanded=False):
                        for point in q.get("answer_points", []):
                            st.markdown(f"- {point}")
                else:
                    with st.expander("🔒 How to answer (👑 Pro)", expanded=False):
                        st.markdown(
                            "<div style='font-size:0.85rem;color:#8b949e;padding:6px 0;'>"
                            "• <i>Detailed STAR answering frameworks, strategic trade-offs, and trap warnings for this question are unlocked with Pro Pass.</i>"
                            "</div>",
                            unsafe_allow_html=True,
                        )

            # Single, high-converting Pro banner for the remaining questions
            if not st.session_state.is_pro and len(questions) > 5:
                st.markdown("""
                <div class="lock-card" style="border:1px solid #ffd700;background:linear-gradient(135deg, #1a1608 0%, #11141c 100%);padding:1.4rem;border-radius:12px;margin-top:1.5rem;">
                    <div style="font-size:1.15rem;font-weight:800;color:#ffd700;margin-bottom:0.35rem;">
                        👑 Unlock All 10+ Question Strategies & Complete Pro Pass (₹49)
                    </div>
                    <div style="font-size:0.88rem;color:#e6edf3;line-height:1.5;margin-bottom:0.85rem;">
                        Get the complete candidate toolkit to walk into your interview with zero surprises:
                    </div>
                    <div style="background:#0e1117;border:1px solid #30363d;border-radius:8px;padding:0.85rem 1.1rem;font-size:0.83rem;color:#ccc;margin-bottom:0.9rem;text-align:left;line-height:1.7;">
                        ✅ <strong>1. Full 5-Claim Vulnerability Audit:</strong> All attack vectors & risk categories revealed.<br>
                        ✅ <strong>2. 4-Round Adaptive Voice Simulation:</strong> Multi-turn pressure grilling across your entire background.<br>
                        ✅ <strong>3. Word-for-Word Defense Playbooks:</strong> High-impact STAR formulas for every flagged claim.<br>
                        ✅ <strong>4. Comprehensive Candidate Debrief:</strong> Rigor, brevity, and pressure defense rubrics.<br>
                        ✅ <strong>5. Downloadable Prep Dossier:</strong> Markdown cheat-sheet to review 10 minutes before your real call.
                    </div>
                    <div style="background:#0e1117;border:1px solid #30363d;border-radius:8px;padding:0.75rem;margin-bottom:0.8rem;font-size:0.8rem;">
                        <div style="display:flex;justify-content:space-between;border-bottom:1px solid #21262d;padding-bottom:5px;margin-bottom:5px;">
                            <span style="color:#8b949e;">1-on-1 Human Mock Calls</span>
                            <span style="color:#f85149;font-weight:600;">₹1,500 – ₹3,000 (1 call)</span>
                        </div>
                        <div style="display:flex;justify-content:space-between;border-bottom:1px solid #21262d;padding-bottom:5px;margin-bottom:5px;">
                            <span style="color:#8b949e;">Standard AI Interview Apps</span>
                            <span style="color:#f85149;font-weight:600;">$99/mo (~₹8,200)</span>
                        </div>
                        <div style="display:flex;justify-content:space-between;font-weight:700;padding-top:2px;">
                            <span style="color:#ffd700;">PrepInterview Pro Pass</span>
                            <span style="color:#ffd700;font-size:0.88rem;">₹49 (One-Time · No Subscriptions)</span>
                        </div>
                    </div>
                    <div style="font-size:0.75rem;color:#8b949e;margin-bottom:0.4rem;">
                        ☕ <i>Less than a cup of coffee. Instant access with full 24-hour money-back guarantee.</i>
                    </div>
                </div>
                """, unsafe_allow_html=True)
                st.link_button("👑 Unlock PrepInterview Pro Pass (₹49)", "https://rzp.io/rzp/vSIuH5yL", use_container_width=True)
        else:
            st.info("Could not parse questions. Try re-running the analysis.")

    # ── Tab 2: Concerns ──
    with tab2:
        concerns_data = results.get("concerns", {})
        concerns = concerns_data.get("concerns", []) if concerns_data else []

        if concerns:
            for c in concerns:
                severity = c.get("severity", "MEDIUM")
                sev_emoji = {"HIGH": "🔴", "MEDIUM": "🟡", "LOW": "🟢"}.get(severity, "⚪")

                st.markdown(
                    f'<div class="q-card">'
                    f'<span style="font-size:0.85rem;">{sev_emoji} <strong>{c.get("concern", "")}</strong></span>'
                    f'<div class="q-meta" style="margin-top:0.5rem;">'
                    f'<strong>Why it matters:</strong> {c.get("why_it_matters", "")}<br>'
                    f'<strong>How to address:</strong> {c.get("how_to_address", "")}'
                    f'</div></div>',
                    unsafe_allow_html=True,
                )
        else:
            st.info("Could not parse concerns. Try re-running the analysis.")

    # ── Tab 3: Attack Mode ──
    with tab3:
        attack_data = results.get("attack", {})

        if attack_data:
            cred = attack_data.get("credibility_score", "?")
            cred_emoji = {"STRONG": "🟢", "SOME_RISKS": "🟡", "RED_FLAGS": "🔴"}.get(cred, "⚪")
            cred_reason = attack_data.get("credibility_reason", "")

            st.markdown(
                f'<div class="metric-box" style="margin-bottom:1rem;">'
                f'<div class="value">{cred_emoji} {cred.replace("_", " ")}</div>'
                f'<div class="label">Resume Credibility</div>'
                f'<div style="font-size:0.85rem;color:#aaa;margin-top:0.5rem;">{cred_reason}</div>'
                f'</div>',
                unsafe_allow_html=True,
            )

            attacks = attack_data.get("attacks", [])
            if attacks:
                # First attack is free sample
                first_a = attacks[0]
                claim_0 = first_a.get("resume_claim", "")
                lbl_0 = f'🎯 "{claim_0[:80]}..."' if len(claim_0) > 80 else f'🎯 "{claim_0}"'
                with st.expander(f"{lbl_0} (Sample Attack)", expanded=True):
                    st.markdown(f"**Attack question:** {first_a.get('attack_question', '')}")
                    st.markdown(f"**What could go wrong:** {first_a.get('what_could_go_wrong', '')}")
                    st.markdown(f"**Your defense:** {first_a.get('defense', '')}")

                # Remaining attacks (Transparent display: show claim & attack, gate only deep defense playbook)
                rem_attacks = attacks[1:]
                if rem_attacks:
                    is_atk_unlocked = st.session_state.is_pro or st.session_state.unlocked_attacks
                    for a in rem_attacks:
                        claim = a.get("resume_claim", "")
                        label = f'🎯 "{claim[:80]}..."' if len(claim) > 80 else f'🎯 "{claim}"'
                        with st.expander(label, expanded=False):
                            st.markdown(f"**Attack question:** {a.get('attack_question', '')}")
                            st.markdown(f"**What could go wrong:** {a.get('what_could_go_wrong', '')}")
                            if is_atk_unlocked:
                                st.markdown(f"**Your defense:** {a.get('defense', '')}")
                            else:
                                st.markdown(
                                    "<div style='background:#0e1117;border:1px solid #30363d;border-radius:6px;padding:8px 12px;font-size:0.82rem;color:#8b949e;margin-top:6px;'>"
                                    "🔒 <strong>Detailed Written Defense Playbook:</strong> Unlocked with Pro Pass (₹49)"
                                    "</div>",
                                    unsafe_allow_html=True,
                                )

                    if not is_atk_unlocked:
                        st.markdown("""
                        <div class="lock-card" style="margin-top:1.2rem;border:1px solid #ffd70044;background:linear-gradient(135deg, #1a1608 0%, #11141c 100%);">
                            <div style="font-size:0.95rem;font-weight:700;color:#ffd700;margin-bottom:0.3rem;">
                                👑 Unlock Written Defense Playbooks for All Flagged Claims
                            </div>
                            <div style="font-size:0.83rem;color:#c9d1d9;margin-bottom:0.6rem;">
                                Get the exact word-for-word counter-arguments, attribution frameworks, and metric proof points to defend every vulnerable bullet.
                            </div>
                        </div>
                        """, unsafe_allow_html=True)
                        st.link_button("👑 Unlock All Defense Strategies (₹49)", "https://rzp.io/rzp/vSIuH5yL", use_container_width=True)
        else:
            st.info("Could not parse attack analysis. Try re-running.")

    # ── Tab 4: Follow-up Chains ──
    with tab4:
        followup_data = results.get("followups", {})
        chains = followup_data.get("chains", []) if followup_data else []

        if chains:
            for ci, chain in enumerate(chains):
                st.markdown(f"### Chain {ci+1}: {chain.get('topic', '')}")
                st.caption(f"Triggered by: {chain.get('trigger', '')}")

                for qi, q in enumerate(chain.get("questions", [])):
                    st.markdown(
                        f'<div class="q-card">'
                        f'<div class="q-text">Q{qi+1}: {q.get("question", "")}</div>'
                        f'<div class="q-meta">'
                        f'<strong>They\'re listening for:</strong> {q.get("listening_for", "")}<br>'
                        f'<strong>⚠️ Trap:</strong> {q.get("trap", "")}'
                        f'</div></div>',
                        unsafe_allow_html=True,
                    )

                st.success(f"**✅ Ideal answer arc:** {chain.get('ideal_arc', '')}")
                st.markdown("---")
        else:
            st.info("Could not parse follow-up chains. Try re-running.")

    # ══════════════════════════════════════════════════════════
    # 🎤 AI MOCK INTERVIEW CTA (Zone 5)
    # ══════════════════════════════════════════════════════════

    st.html("""
    <div class="copilot-card" style="border: 1px solid #1f6feb88; background: linear-gradient(180deg, #161b22 0%, #0d1117 100%); text-align: center; padding: 1.6rem 1.4rem; margin: 2rem 0 1rem 0;">
        <div style="font-size: 1.35rem; font-weight: 800; color: #f0f6fc; margin-bottom: 0.4rem;">
            🎤 Practice This Spoken Interview
        </div>
        <div style="font-size: 0.92rem; color: #8b949e; margin-bottom: 1.2rem; max-width: 580px; margin-left: auto; margin-right: auto; line-height: 1.5;">
            You've reviewed your fit and question predictions. Now test your real-time defense under spoken pressure with our AI hiring manager.
        </div>
        <div style="display: flex; justify-content: center; gap: 8px; flex-wrap: wrap; margin-bottom: 0.6rem;">
            <span class="prep-factor-chip prep-chip-pass">🎯 Role-Specific Probes</span>
            <span class="prep-factor-chip prep-chip-warn">🥊 Pressure Grilling</span>
            <span class="prep-factor-chip prep-chip-neutral">📊 Post-Interview Debrief</span>
            <span class="prep-factor-chip prep-chip-pass">⚡ 1-Click Spoken Trial</span>
        </div>
    </div>
    """)

    if st.button("🎤 Start Spoken Mock Interview →", type="primary", use_container_width=True):
        st.session_state.step = 3
        st.session_state.mock_messages = []
        st.rerun()

    st.markdown("---")

    # ── Bottom actions ──
    col_a, col_b = st.columns(2)
    with col_a:
        if st.button("← New Analysis", use_container_width=True):
            st.session_state.step = 0
            st.session_state.results = {}
            st.session_state.mock_messages = []
            st.rerun()
    with col_b:
        report_parts = []
        if summary:
            report_parts.append(
                f"# Interview Intelligence Report\n\n"
                f"**Interview Readiness:** {summary.get('fit_score', '?')}%\n"
                f"**Risk Level:** {summary.get('risk_level', '?')}\n\n"
                f"{summary.get('one_line', '')}\n"
            )
        if questions:
            report_parts.append("## Top Questions\n")
            for q in questions:
                report_parts.append(
                    f"### [{q.get('probability', '?')}%] {q.get('question', '')}\n"
                    f"- **Why:** {q.get('why', '')}\n"
                    f"- **Testing:** {q.get('testing', '')}\n"
                    f"- **Answer points:** {', '.join(q.get('answer_points', []))}\n"
                )
        full_report = "\n".join(report_parts)
        if st.session_state.is_pro:
            st.download_button(
                "📥 Download Full Prep Dossier",
                data=full_report,
                file_name="interview_dossier.md",
                mime="text/markdown",
                use_container_width=True,
            )
        else:
            st.link_button(
                "👑 Download Full Prep Dossier (₹49)",
                "https://rzp.io/rzp/vSIuH5yL",
                use_container_width=True,
            )


# ══════════════════════════════════════════════════════════════
# STEP 3: REAL INTERVIEW MODE & SPOKEN DEFENSE
# ══════════════════════════════════════════════════════════════

elif st.session_state.step == 3:

    resume_text = st.session_state.resume_text
    jd_text = st.session_state.jd_text
    results = st.session_state.results

    # Build interviewer context
    questions_data = results.get("questions", {})
    predicted_questions = questions_data.get("questions", []) if questions_data else []
    concerns_data = results.get("concerns", {})
    concerns_list_data = concerns_data.get("concerns", []) if concerns_data else []

    q_list_str = "\n".join(
        f"- [{q.get('probability', '?')}%] {q.get('question', '')} (Testing: {q.get('testing', '')})"
        for q in predicted_questions
    )
    c_list_str = "\n".join(
        f"- {c.get('concern', '')}" for c in concerns_list_data
    )
    # ── Interviewer Archetype Persona Setup ──
    archetype = st.session_state.get("interviewer_archetype", "🎯 Strategic Hiring Manager & Team Lead")
    archetype_prompts = {
        "🎯 Strategic Hiring Manager & Team Lead": (
            "INTERVIEWER PERSONA: You are a Strategic Hiring Manager & Senior Team Lead. You evaluate structured thinking, "
            "clear STAR-method communication (Situation, Task, Action, Result), prioritization frameworks (RICE/MoSCoW), "
            "and cross-functional collaboration. You want to see how the candidate balances practical constraints with business impact."
        ),
        "🚀 High-Velocity Startup Founder / CEO": (
            "INTERVIEWER PERSONA: You are a High-Velocity Startup Founder & CEO. You care deeply about execution speed, customer obsession, and direct business ROI. "
            "You cut through academic textbook answers and demand to know: How fast did you ship? What was the revenue or user impact? "
            "How did you operate under extreme ambiguity with zero budget?"
        ),
        "🧐 Skeptical Senior Domain Specialist": (
            "INTERVIEWER PERSONA: You are a Skeptical Senior Domain Specialist. You despise vague buzzwords. "
            "For technical roles, relentlessly probe architectural edge cases, race conditions, failovers, and scaling limits. "
            "For non-technical/product roles, challenge unverified metrics, statistical significance of A/B tests, and unprovable ROI claims. "
            "Grade strictly: do not reward confident sounding fluff without concrete evidence and trade-off acknowledgment."
        ),
        "🤝 Executive Bar Raiser & People Lead": (
            "INTERVIEWER PERSONA: You are an Executive Bar Raiser and People Leader. You evaluate high-stakes behavioral scenarios, cross-functional conflict, "
            "extreme ownership in past failures, and ethical decision making. You grade how well the candidate handles pressure and admits mistakes."
        ),
    }
    persona_prompt = archetype_prompts.get(
        archetype,
        archetype_prompts["🎯 Strategic Hiring Manager & Team Lead"],
    )

    interviewer_ctx = f"""You are a professional hiring manager conducting a realistic, high-stakes job interview.

{persona_prompt}

CANDIDATE'S RESUME (GROUND TRUTH):
{resume_text}

TARGET JOB DESCRIPTION:
{jd_text}

PREDICTED HIGH-PROBABILITY QUESTIONS TO EXPLORE:
{q_list_str}

IDENTIFIED CONCERNS & VULNERABILITIES:
{c_list_str}

CRITICAL INTERVIEW RULES:
1. ACT 100% IN CHARACTER AT ALL TIMES. You are speaking directly to the candidate over a live call.
2. NEVER break character, and NEVER output mid-interview grades, scores ("Score: 7/10"), or meta-feedback lists ("Good: ... Improve: ... Tip: ...") during the conversation. Real interviewers NEVER grade a candidate out loud between questions.
3. CONVERSATIONAL TRANSITION: When the candidate answers:
   - Respond naturally in 1-2 conversational sentences.
   - If their answer was hand-wavy, lacked metrics/baselines, failed to isolate their individual contribution, or evaded the core difficulty, ask a SHARP, probing follow-up that forces them to defend the claim.
   - If their defense was sound, pivot smoothly to the next predicted high-stakes question challenging another key claim.
4. TONE & PACING: Keep your spoken responses punchy (2 to 4 sentences total). Let the candidate do 80% of the talking.
5. CONCISE & SPOKEN-FRIENDLY: The candidate will listen to your words via audio speech. Speak naturally like a senior leader on a Google Meet / Zoom call.
"""

    # ── Check if Interview Debrief is Concluded ──
    candidate_turns = sum(1 for m in st.session_state.mock_messages if m["role"] == "candidate")
    is_single_round = (not st.session_state.is_pro and not st.session_state.unlocked_voice) or bool(st.session_state.get("active_redrill"))

    if st.session_state.get("interview_concluded") and st.session_state.get("mock_debrief"):
        render_candidate_debrief(st.session_state.mock_debrief, is_single_round=is_single_round)

        with st.expander("📄 View Full Spoken Interview Transcript", expanded=False):
            for i, msg in enumerate(st.session_state.mock_messages):
                if msg["role"] == "interviewer":
                    st.markdown(f"**🎤 Interviewer:** {msg['content']}")
                else:
                    st.markdown(f"**👤 You:** {msg['content']}")

        if st.session_state.mock_debrief.get("unavailable"):
            if st.button("🎤 Try this round again", type="primary", use_container_width=True, key="btn_retry_round"):
                st.session_state.mock_messages = []
                st.session_state.mock_debrief = None
                st.session_state.interview_concluded = False
                st.rerun()

        st.markdown("---")
        col_nav1, col_nav2 = st.columns(2)
        with col_nav1:
            if st.button("← Back to Results & Dossier", use_container_width=True):
                st.session_state.step = 2
                st.rerun()
        with col_nav2:
            if st.button("↻ New Analysis", use_container_width=True):
                st.session_state.step = 0
                st.session_state.results = {}
                st.session_state.mock_messages = []
                st.session_state.mock_debrief = None
                st.session_state.interview_concluded = False
                st.session_state.active_redrill = None
                st.rerun()

    else:
        # ── Top Navigation ──
        col_top_back, col_top_space = st.columns([1, 2])
        with col_top_back:
            if st.button("← Back to Report & Questions", use_container_width=True, key="btn_top_back_report"):
                st.html("<script>window.speechSynthesis.cancel();</script>")
                st.session_state.step = 2
                st.rerun()

        # ── Call Screen Header ──
        if st.session_state.get("active_redrill"):
            drill_claim = st.session_state["active_redrill"].get("claim_tested", "Weak Claim")
            status_text = f"● Focused Remediation Drill · Claim: {drill_claim[:45]}..."
        else:
            max_r = 1 if not st.session_state.is_pro else 4
            curr_r = min(candidate_turns + 1, max_r)
            status_text = f"● Round {curr_r} of {max_r} · Realistic Hiring Simulation"

        st.markdown(f"""
        <div class="call-screen">
            <div class="call-avatar">🎤</div>
            <div style="font-size:1.15rem;font-weight:700;margin-bottom:0.25rem;">{archetype}</div>
            <div class="call-status">{status_text}</div>
        </div>
        """, unsafe_allow_html=True)
        render_pro_bar()

        # ── Initialize first message ──
        if not st.session_state.mock_messages:
            with st.spinner("Interviewer is preparing the first challenge..."):
                if st.session_state.get("active_redrill"):
                    target = st.session_state["active_redrill"]
                    redrill_prompt = (
                        interviewer_ctx
                        + f"\n\nFOCUS DRILL: You are conducting a targeted 1-on-1 remediation drill on this specific weak resume claim: '{target.get('claim_tested', '')}'.\n"
                        f"Ask a sharp, skeptical challenge targeting this exact claim: {target.get('question', '')}. Do not accept fluff."
                    )
                    first_msg = call_gemini(redrill_prompt)
                else:
                    first_msg = call_gemini(
                        interviewer_ctx
                        + "\n\nStart the interview. Greet the candidate briefly and immediately challenge their single most critical or vulnerable resume claim directly related to this target job description. Do NOT ask an easy softball or generic icebreaker like 'tell me about yourself' — dive straight into their real claims under your persona."
                    )
                st.session_state.mock_messages = [
                    {"role": "interviewer", "content": first_msg}
                ]
                st.session_state["last_spoken"] = -1
                st.rerun()

        # ── Display conversation transcript ──
        for i, msg in enumerate(st.session_state.mock_messages):
            if msg["role"] == "interviewer":
                st.markdown(
                    f'<div class="voice-bubble interviewer">'
                    f'<div class="voice-label">🎤 Interviewer</div>'
                    f'{msg["content"]}'
                    f'</div>',
                    unsafe_allow_html=True,
                )
            else:
                st.markdown(
                    f'<div class="voice-bubble candidate">'
                    f'<div class="voice-label">👤 You</div>'
                    f'{msg["content"]}'
                    f'</div>',
                    unsafe_allow_html=True,
                )

        # ── Auto-speak the latest AI message ──
        last_spoken = st.session_state.get("last_spoken", -1)
        last_ai_idx = -1
        for i, msg in enumerate(st.session_state.mock_messages):
            if msg["role"] == "interviewer":
                last_ai_idx = i

        if last_ai_idx > last_spoken:
            inject_tts(st.session_state.mock_messages[last_ai_idx]["content"])
            st.session_state["last_spoken"] = last_ai_idx

        # ── In-Interview Candidate Controls (Replay & Clarification) ──
        st.markdown("")
        col_ctrl1, col_ctrl2 = st.columns([1, 1])
        with col_ctrl1:
            if st.button("🔊 Replay Question", use_container_width=True):
                for msg in reversed(st.session_state.mock_messages):
                    if msg["role"] == "interviewer":
                        inject_tts(msg["content"])
                        break
        with col_ctrl2:
            clar_disabled = st.session_state.get("clarification_used", False)
            btn_label = "❓ Ask for Clarification (1x Max)" if not clar_disabled else "❓ Clarification Used (1x Max)"
            if st.button(btn_label, disabled=clar_disabled, use_container_width=True):
                st.session_state.clarification_used = True
                with st.spinner("Interviewer is clarifying scope..."):
                    conv = interviewer_ctx + "\n\nConversation so far:\n"
                    for msg in st.session_state.mock_messages:
                        label = "Interviewer" if msg["role"] == "interviewer" else "Candidate"
                        conv += f"\n{label}: {msg['content']}\n"
                    conv += "\nCandidate: [Asks for clarification on constraints/scope]\nInterviewer: [Clarify briefly in 1-2 sentences in-character, without giving away the answer, then re-invite the candidate to answer]"
                    clarification_reply = call_gemini(conv)
                    st.session_state.mock_messages.append({"role": "interviewer", "content": f"💡 *Clarification:* {clarification_reply}"})
                    st.rerun()

        # Pro user option to finish early and get debrief
        if st.session_state.is_pro and candidate_turns >= 1:
            if st.button("🏁 Conclude Interview & View Full Debrief Now", use_container_width=True):
                with st.spinner("Generating your candidate debrief..."):
                    debrief_data = generate_candidate_debrief(
                        resume_text, jd_text, st.session_state.mock_messages, is_single_round=False
                    )
                    st.session_state.mock_debrief = debrief_data
                    st.session_state.interview_concluded = True
                    st.rerun()

        # ── Interactive Live Workspace (Whiteboard & Scratchpad) ──
        with st.expander("✏️ Live Workspace: Framework Board & Strategy Notes", expanded=False):
            scratch_tab1, scratch_tab2 = st.tabs(["✏️ Visual Framework & Diagram Board", "📝 Strategy & STAR Notes"])
            with scratch_tab1:
                st.markdown(
                    '<p style="font-size:0.75rem;color:#8b949e;margin-bottom:8px;">'
                    '💡 Sketch customer funnels, 2x2 prioritization matrices, workflow loops, or system architectures to reference while speaking.'
                    '</p>',
                    unsafe_allow_html=True,
                )
                st.components.v1.html("""
                <div style="background:#0d1117;border:1px solid #30363d;border-radius:8px;padding:8px;font-family:-apple-system, BlinkMacSystemFont, sans-serif;">
                    <div style="display:flex;gap:6px;margin-bottom:8px;flex-wrap:wrap;align-items:center;">
                        <button onclick="setTool('pen')" id="btn-pen" style="background:#1f6feb;color:#fff;border:none;padding:5px 12px;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;">✏️ Pen</button>
                        <button onclick="setTool('rect')" id="btn-rect" style="background:#21262d;color:#c9d1d9;border:1px solid #30363d;padding:5px 12px;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;">⬜ Box / Step</button>
                        <button onclick="setTool('arrow')" id="btn-arrow" style="background:#21262d;color:#c9d1d9;border:1px solid #30363d;padding:5px 12px;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;">➔ Arrow / Flow</button>
                        <button onclick="clearCanvas()" style="background:#f8514922;color:#ff7b72;border:1px solid #f8514966;padding:5px 12px;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;">🗑️ Clear</button>
                        <span style="color:#8b949e;font-size:11px;margin-left:auto;">Canvas persists during session</span>
                    </div>
                    <canvas id="liveCanvas" width="680" height="260" style="background:#161b22;border:1px solid #30363d;border-radius:6px;cursor:crosshair;width:100%;touch-action:none;display:block;"></canvas>
                </div>
                <script>
                    const canvas = document.getElementById('liveCanvas');
                    const ctx = canvas.getContext('2d');
                    let drawing = false, tool = 'pen', startX = 0, startY = 0, snapshot;

                    function setTool(t) {
                        tool = t;
                        ['pen', 'rect', 'arrow'].forEach(id => {
                            const b = document.getElementById('btn-' + id);
                            if (b) {
                                b.style.background = (id === t) ? '#1f6feb' : '#21262d';
                                b.style.color = (id === t) ? '#ffffff' : '#c9d1d9';
                            }
                        });
                    }

                    function clearCanvas() {
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                    }

                    function getPos(e) {
                        const r = canvas.getBoundingClientRect();
                        return {
                            x: (e.clientX - r.left) * (canvas.width / r.width),
                            y: (e.clientY - r.top) * (canvas.height / r.height)
                        };
                    }

                    canvas.addEventListener('mousedown', (e) => {
                        drawing = true;
                        const p = getPos(e);
                        startX = p.x; startY = p.y;
                        snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
                        ctx.strokeStyle = '#58a6ff';
                        ctx.lineWidth = 2;
                        ctx.lineCap = 'round';
                        ctx.beginPath();
                        ctx.moveTo(startX, startY);
                    });

                    canvas.addEventListener('mousemove', (e) => {
                        if (!drawing) return;
                        const p = getPos(e);
                        if (tool === 'pen') {
                            ctx.lineTo(p.x, p.y);
                            ctx.stroke();
                        } else if (tool === 'rect') {
                            ctx.putImageData(snapshot, 0, 0);
                            ctx.strokeRect(startX, startY, p.x - startX, p.y - startY);
                        } else if (tool === 'arrow') {
                            ctx.putImageData(snapshot, 0, 0);
                            ctx.beginPath();
                            ctx.moveTo(startX, startY);
                            ctx.lineTo(p.x, p.y);
                            ctx.stroke();
                        }
                    });

                    window.addEventListener('mouseup', () => { drawing = false; });
                </script>
                """, height=340)
            with scratch_tab2:
                scratchpad_val = st.text_area(
                    "Live Strategy & Code Notes",
                    value=st.session_state.get("live_scratchpad_notes", ""),
                    placeholder="Tech: Paste/write SQL queries, data structures, or algorithmic pseudocode...\n\nNon-Tech: Write your STAR bullet points (Situation, Task, Action, Result), conversion metrics, or key numbers to reference while answering...",
                    height=200,
                    key="live_scratchpad_notes_input",
                    label_visibility="collapsed",
                )
                st.session_state["live_scratchpad_notes"] = scratchpad_val

        # ── Input Section ──
        st.markdown("")
        input_mode = st.radio(
            "How do you want to answer?",
            ["🎙️ Speak (use microphone)", "⌨️ Type"],
            horizontal=True,
            label_visibility="collapsed",
        )

        if input_mode == "🎙️ Speak (use microphone)":
            st.markdown(
                '<p style="color:#888;font-size:0.85rem;">'
                '🎙️ Click the mic below to record your answer. Click again to stop.</p>',
                unsafe_allow_html=True,
            )
            audio = st.audio_input(
                "Record your answer",
                key=f"mic_{len(st.session_state.mock_messages)}",
            )

            if audio:
                audio_bytes = audio.read()
                audio_id = hashlib.md5(audio_bytes).hexdigest()
                rejected_audio = st.session_state.setdefault("rejected_audio", {})

                if audio_id in rejected_audio:
                    # Already checked this exact recording: don't re-run (or re-bill) the AI call
                    st.warning(rejected_audio[audio_id])
                elif audio_looks_silent(analyze_wav(audio_bytes)):
                    rejected_audio[audio_id] = NO_SPEECH_MSG
                    st.warning(NO_SPEECH_MSG)
                else:
                    # Build conversation context for Gemini
                    conv = interviewer_ctx + "\n\nConversation so far:\n"
                    for msg in st.session_state.mock_messages:
                        label = "Interviewer" if msg["role"] == "interviewer" else "Candidate"
                        conv += f"\n{label}: {msg['content']}\n"
                    conv += (
                        "\nThe candidate just answered via voice (audio attached). "
                        "IMPORTANT INSTRUCTIONS:\n"
                        "0. If the audio contains no clear spoken words (silence, background noise, breathing or unintelligible speech), "
                        "reply with exactly NO_SPEECH_DETECTED and nothing else. Never guess or fill in what the candidate might have said, "
                        "and never write an answer for them from their resume.\n"
                        "1. Otherwise, listen carefully to the ENTIRE audio and transcribe EXACTLY what the candidate said, "
                        "word-for-word, using only words that are actually audible. Show the full transcription on the very first line as: "
                        "'**You said:** <the words spoken>'\n"
                        "2. Then on subsequent lines, respond in-character as the interviewer (acknowledge briefly, probe deeper if vague or ask next high-stakes question).\n"
                        "3. NEVER output grades, scores, or meta-lists."
                    )

                    with st.spinner("🎤 Listening and preparing interviewer response..."):
                        try:
                            response = call_gemini_audio(audio_bytes, conv, temperature=0.2)
                            spoken, interviewer_response, voice_error = parse_voice_response(response)

                            new_turns = candidate_turns + 1
                            turns_limit = 1 if is_single_round else 4
                            is_last_turn = new_turns >= turns_limit

                            if voice_error is None and not is_last_turn and not interviewer_response:
                                voice_error = "The interviewer's reply didn't come through, so nothing was submitted. Please record again."

                            if voice_error:
                                rejected_audio[audio_id] = voice_error
                                st.warning(voice_error)
                            else:
                                st.session_state.clarification_used = False
                                st.session_state.mock_messages.append(
                                    {"role": "candidate", "content": "🎙️ " + spoken}
                                )

                                if is_last_turn:
                                    with st.spinner("Compiling your post-interview candidate debrief..."):
                                        debrief_data = generate_candidate_debrief(
                                            resume_text, jd_text, st.session_state.mock_messages, is_single_round=is_single_round
                                        )
                                        st.session_state.mock_debrief = debrief_data
                                        st.session_state.interview_concluded = True
                                        st.rerun()
                                else:
                                    st.session_state.mock_messages.append(
                                        {"role": "interviewer", "content": interviewer_response}
                                    )
                                    st.rerun()

                        except Exception as e:
                            st.error(f"Could not process audio: {str(e)[:150]}")
                            st.info("Try switching to Type mode, or record again.")

        else:
            text_answer = st.text_area(
                "Your answer",
                placeholder="Type your answer here...",
                height=100,
                label_visibility="collapsed",
                key=f"text_{len(st.session_state.mock_messages)}",
            )
            if st.button("Submit Answer →", type="primary", use_container_width=True):
                if text_answer.strip():
                    st.session_state.clarification_used = False
                    st.session_state.mock_messages.append(
                        {"role": "candidate", "content": text_answer.strip()}
                    )

                    new_turns = candidate_turns + 1
                    turns_limit = 1 if is_single_round else 4

                    if new_turns >= turns_limit:
                        with st.spinner("Compiling your post-interview candidate debrief..."):
                            debrief_data = generate_candidate_debrief(
                                resume_text, jd_text, st.session_state.mock_messages, is_single_round=is_single_round
                            )
                            st.session_state.mock_debrief = debrief_data
                            st.session_state.interview_concluded = True
                            st.rerun()
                    else:
                        conv = interviewer_ctx + "\n\nConversation so far:\n"
                        for msg in st.session_state.mock_messages:
                            label = "Interviewer" if msg["role"] == "interviewer" else "Candidate"
                            conv += f"\n{label}: {msg['content']}\n"
                        conv += "\nInterviewer: [Respond in-character without any score, grade, or meta-list. Acknowledge briefly and probe deeper or ask the next question]"

                        with st.spinner("Interviewer is evaluating and responding..."):
                            response = call_gemini(conv)
                            st.session_state.mock_messages.append(
                                {"role": "interviewer", "content": response}
                            )
                        st.rerun()

        # ── Bottom navigation ──
        st.markdown("---")
        col1, col2 = st.columns(2)
        with col1:
            if st.button("← Back to Results", use_container_width=True):
                st.html("<script>window.speechSynthesis.cancel();</script>")
                st.session_state.step = 2
                st.rerun()
        with col2:
            if st.button("🔄 Restart Interview", use_container_width=True):
                st.html("<script>window.speechSynthesis.cancel();</script>")
                st.session_state.mock_messages = []
                st.session_state.mock_debrief = None
                st.session_state.interview_concluded = False
                st.session_state.active_redrill = None
                st.session_state.clarification_used = False
                st.session_state["last_spoken"] = -1
                st.rerun()
