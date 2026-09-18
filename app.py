"""
🎯 Interview Intelligence Agent — v3
=====================================
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

# ──────────────────────────────────────────────────────────────
# SETUP
# ──────────────────────────────────────────────────────────────

load_dotenv()

# Support both local .env and Streamlit Cloud secrets
api_key = os.getenv("GOOGLE_API_KEY")
if not api_key:
    try:
        api_key = st.secrets["GOOGLE_API_KEY"]
    except Exception:
        pass

if not api_key:
    st.error("⚠️ No API key found. Add GOOGLE_API_KEY to your .env file or Streamlit secrets.")
    st.stop()

client = genai.Client(api_key=api_key)
MODEL = "gemini-3.5-flash"

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

    .block-container {
        padding-top: 2rem;
        padding-bottom: 2rem;
        max-width: 720px;
    }

    /* Hero */
    .hero-title {
        font-size: 2.4rem;
        font-weight: 800;
        text-align: center;
        margin-bottom: 0.25rem;
        line-height: 1.2;
    }
    .hero-sub {
        text-align: center;
        color: #888;
        font-size: 1.05rem;
        margin-bottom: 2rem;
    }

    /* Steps */
    .step-bar {
        display: flex;
        justify-content: center;
        gap: 0.5rem;
        margin-bottom: 2rem;
    }
    .step-dot {
        width: 10px; height: 10px;
        border-radius: 50%;
        background: #333; opacity: 0.25;
    }
    .step-dot.active {
        opacity: 1; background: #4CAF50;
        box-shadow: 0 0 6px #4CAF50;
    }

    /* Metric box */
    .metric-box {
        flex: 1; padding: 1.2rem;
        border-radius: 12px; text-align: center;
        border: 1px solid #2a2a2a; background: #111;
    }
    .metric-box .value { font-size: 2rem; font-weight: 800; }
    .metric-box .label {
        font-size: 0.8rem; color: #888;
        text-transform: uppercase; letter-spacing: 0.5px;
        margin-top: 0.25rem;
    }

    /* Question card */
    .q-card {
        border: 1px solid #2a2a2a; border-radius: 10px;
        padding: 1.2rem; margin-bottom: 0.75rem; background: #111;
    }
    .q-prob {
        font-size: 0.75rem; font-weight: 700;
        padding: 2px 8px; border-radius: 4px;
        display: inline-block; margin-bottom: 0.5rem;
    }
    .q-prob.high { background: #ff4444; color: white; }
    .q-prob.med { background: #ffaa00; color: black; }
    .q-text { font-size: 1.05rem; font-weight: 600; margin-bottom: 0.5rem; }
    .q-meta { font-size: 0.85rem; color: #aaa; line-height: 1.5; }

    /* Section header */
    .section-head {
        font-size: 0.8rem; text-transform: uppercase;
        letter-spacing: 1px; color: #666;
        margin: 2rem 0 0.75rem 0; font-weight: 700;
    }

    /* Input labels */
    .input-label {
        font-size: 0.85rem; font-weight: 600;
        color: #ccc; margin-bottom: 0.5rem;
        text-transform: uppercase; letter-spacing: 0.5px;
    }

    /* Timer */
    .timer-text {
        text-align: center; font-size: 2.5rem;
        font-weight: 800; color: #4CAF50;
        margin: 0.5rem 0;
        font-variant-numeric: tabular-nums;
    }
    .timer-sub {
        text-align: center; color: #888;
        font-size: 0.9rem; margin-bottom: 1.5rem;
    }

    /* CTA banner */
    .cta-banner {
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
        border: 1px solid #e94560;
        border-radius: 16px;
        padding: 2rem;
        text-align: center;
        margin: 2rem 0;
    }
    .cta-banner h2 {
        color: #e94560;
        margin: 0 0 0.5rem 0;
        font-size: 1.5rem;
    }
    .cta-banner p {
        color: #ccc;
        margin: 0 0 1rem 0;
        font-size: 0.95rem;
    }
    .cta-banner .features {
        display: flex;
        justify-content: center;
        gap: 1.5rem;
        margin: 1rem 0;
        flex-wrap: wrap;
    }
    .cta-banner .feature {
        font-size: 0.85rem;
        color: #aaa;
    }

    /* Model badge */
    .model-badge {
        display: inline-block;
        font-size: 0.7rem;
        padding: 1px 6px;
        border-radius: 3px;
        margin-left: 4px;
        font-weight: 700;
        vertical-align: middle;
    }
    .badge-recommended { background: #4CAF50; color: white; }
    .badge-fast { background: #2196F3; color: white; }
    .badge-lite { background: #666; color: white; }

    /* Voice interview call screen */
    .call-screen {
        background: #0a0a0a;
        border: 1px solid #2a2a2a;
        border-radius: 16px;
        padding: 2rem;
        text-align: center;
        margin: 1rem 0;
    }
    .call-avatar {
        width: 80px; height: 80px;
        border-radius: 50%;
        background: linear-gradient(135deg, #667eea, #764ba2);
        display: flex; align-items: center; justify-content: center;
        font-size: 2rem;
        margin: 0 auto 1rem auto;
    }
    .call-status {
        font-size: 0.85rem;
        color: #4CAF50;
        text-transform: uppercase;
        letter-spacing: 1px;
        margin-bottom: 1rem;
        animation: pulse 2s infinite;
    }
    @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
    }
    .voice-bubble {
        background: #1a1a2e;
        border: 1px solid #333;
        border-radius: 12px;
        padding: 1rem 1.2rem;
        margin: 0.75rem 0;
        text-align: left;
    }
    .voice-bubble.interviewer {
        border-left: 3px solid #667eea;
    }
    .voice-bubble.candidate {
        border-left: 3px solid #4CAF50;
    }
    .voice-label {
        font-size: 0.7rem;
        text-transform: uppercase;
        letter-spacing: 1px;
        color: #888;
        margin-bottom: 0.4rem;
    }

    /* Monetization & Locking */
    .lock-card {
        background: linear-gradient(135deg, rgba(233, 69, 96, 0.08) 0%, rgba(15, 52, 96, 0.15) 100%);
        border: 1px dashed rgba(233, 69, 96, 0.5);
        border-radius: 10px;
        padding: 1rem;
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
    .sponsor-ad-card {
        background: linear-gradient(135deg, #1e1e38 0%, #2a2250 100%);
        border: 1px solid #ffd700;
        border-radius: 12px;
        padding: 1.2rem;
        text-align: center;
        margin: 1rem 0;
    }
    .pro-badge-active {
        background: linear-gradient(90deg, #FFD700, #FFA500);
        color: #000;
        font-weight: 800;
        font-size: 0.8rem;
        padding: 4px 10px;
        border-radius: 6px;
        display: inline-block;
        letter-spacing: 0.5px;
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


def call_gemini_audio(audio_bytes: bytes, prompt: str) -> str:
    """Send audio + text prompt to Gemini for transcription and evaluation."""
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
                            "You are a professional interviewer conducting a realistic job interview."
                        ),
                        "temperature": 0.7,
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




@st.cache_data(ttl=300, show_spinner=False)
def get_available_models():
    """Fetch all available Gemini models from the API. Cached for 5 minutes."""
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
    """Call Gemini API with retry logic and automatic model fallback."""
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
  "fit_score": 78,
  "risk_level": "MEDIUM",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "gaps": ["gap 1", "gap 2", "gap 3"],
  "one_line": "Brief one-line summary of the candidate's fit"
}}

Rules:
- fit_score: integer 0-100
- risk_level: "LOW", "MEDIUM", or "HIGH"
- strengths: exactly 3 strings, specific to this resume+JD
- gaps: exactly 3 strings, specific to this resume+JD
- one_line: one sentence max
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


# ──────────────────────────────────────────────────────────────
# STEP INDICATOR
# ──────────────────────────────────────────────────────────────

def render_steps(current: int):
    dots = ""
    for i in range(3):
        active = "active" if i <= current else ""
        dots += f'<span class="step-dot {active}"></span>'
    st.markdown(f'<div class="step-bar">{dots}</div>', unsafe_allow_html=True)


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
]:
    if key not in st.session_state:
        st.session_state[key] = default

# Automatic payment unlock from checkout redirect (e.g. ?session=paid or ?pass=PRO2026)
if "session" in st.query_params and str(st.query_params["session"]).lower() in ["paid", "pro", "success"]:
    st.session_state.is_pro = True
if "pass" in st.query_params and str(st.query_params["pass"]).upper() in ["PRO2026", "VIP", "INTERVIEWPRO", "PASS"]:
    st.session_state.is_pro = True

# Apply model from session state
MODEL = st.session_state.selected_model


# ══════════════════════════════════════════════════════════════
# STEP 0: INPUT
# ══════════════════════════════════════════════════════════════

if st.session_state.step == 0:
    render_steps(0)

    st.markdown('<p class="hero-title">Defend Your Resume Under Pressure</p>', unsafe_allow_html=True)
    st.markdown(
        '<p class="hero-sub" style="margin-bottom:1.5rem;">'
        'Upload your resume and target role. We pinpoint the exact claims an interviewer will challenge and prepare you with a realistic mock interview.'
        '</p>',
        unsafe_allow_html=True,
    )

    # ── Quick Bullet Tester (Optional Expandable) ──
    with st.expander("💡 Want to test 1 resume bullet point first? (Free Live Attack Preview)", expanded=False):
        st.markdown(
            '<p style="font-size:0.82rem;color:#8b949e;margin-bottom:8px;">'
            'Paste any single bullet from your resume to see how a skeptical interviewer will challenge it.'
            '</p>',
            unsafe_allow_html=True,
        )
        col_b1, col_b2 = st.columns([4, 1])
        with col_b1:
            test_bullet_input = st.text_input(
                "Test Resume Bullet",
                placeholder='e.g., "Led migration to microservices reducing latency by 35%" or "Managed ₹15L marketing budget improving ROI by 2.4x"',
                label_visibility="collapsed",
                key="bullet_tester_input",
            )
        with col_b2:
            btn_attack_bullet = st.button("⚡ Attack Bullet", use_container_width=True, key="btn_attack_bullet")

        if btn_attack_bullet and test_bullet_input.strip():
            with st.spinner("Analyzing claim vulnerabilities..."):
                prompt = f"""You are a skeptical, elite hiring manager and interviewer analyzing a single resume bullet point.
Resume Bullet: "{test_bullet_input.strip()}"

Analyze this claim and return a JSON object with:
1. "attack_question": A razor-sharp, realistic counter-question challenging the baseline, attribution, methodology, scale, or failure mode.
2. "trap": Why an interviewer will doubt or probe this claim (e.g. missing baseline, unverified attribution, ambiguous personal ownership).
3. "defense_formula": Concrete framework formula to answer strongly (e.g., State baseline cohort -> explain isolation of variables -> quote measurable delta).

Return ONLY valid JSON:
{{"attack_question": "...", "trap": "...", "defense_formula": "..."}}"""
                res = call_gemini(prompt)
                try:
                    clean_res = res.strip()
                    if clean_res.startswith("```"):
                        clean_res = clean_res.split("```")[1]
                        if clean_res.startswith("json"):
                            clean_res = clean_res[4:]
                    data = json.loads(clean_res)
                    st.session_state["bullet_test_result"] = data
                except Exception:
                    st.session_state["bullet_test_result"] = {
                        "attack_question": "What was your specific baseline before this initiative, and how did you measure your individual contribution versus your team?",
                        "trap": "Metric lacks verified baseline and individual ownership boundaries.",
                        "defense_formula": "State pre-existing baseline -> detail your exact technical/operational decisions -> demonstrate measured business outcome."
                    }

        if st.session_state.get("bullet_test_result"):
            res_data = st.session_state["bullet_test_result"]
            st.markdown(f"""
            <div style="background:#161b22;border:1px solid #30363d;border-radius:8px;padding:12px 16px;font-size:0.86rem;line-height:1.6;margin-top:10px;">
                <div style="color:#ff7b72;font-size:0.75rem;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">🧐 Skeptical Counter-Question</div>
                <div style="color:#ffd700;margin-bottom:10px;padding-left:10px;border-left:3px solid #ff7b72;">
                    "{res_data.get('attack_question', '')}"
                </div>
                <div style="color:#f85149;font-size:0.78rem;font-weight:700;margin-bottom:2px;">⚠️ The Vulnerability Trap:</div>
                <div style="color:#8b949e;font-size:0.82rem;margin-bottom:10px;">
                    {res_data.get('trap', '')}
                </div>
                <div style="background:#0d1117;border:1px solid #23863644;border-left:3px solid #238636;border-radius:6px;padding:8px 12px;font-size:0.82rem;">
                    <strong style="color:#3fb950;">🛡️ Defense Formula:</strong>
                    <span style="color:#c9d1d9;"> {res_data.get('defense_formula', '')}</span>
                </div>
            </div>
            """, unsafe_allow_html=True)

    # Check for deep-link from LinkedIn Copilot extension
    param_jd = st.query_params.get("jd", "")
    param_title = st.query_params.get("title", "")
    param_company = st.query_params.get("company", "")

    if param_jd and not st.session_state.get("prefill_jd"):
        st.session_state["prefill_jd"] = param_jd
        st.session_state["prefill_title"] = param_title
        st.session_state["prefill_company"] = param_company

    prefilled_jd = st.session_state.get("prefill_jd", "")
    prefilled_title = st.session_state.get("prefill_title", "")
    prefilled_company = st.session_state.get("prefill_company", "")

    if prefilled_jd:
        company_label = f" at {prefilled_company}" if prefilled_company else ""
        st.markdown(
            f"""
            <div style="background:#161b22;border:1px solid #1f6feb;border-radius:8px;padding:10px 14px;margin-bottom:1rem;">
                <span style="font-weight:700;color:#58a6ff;">🎯 Imported from LinkedIn:</span>
                <span style="color:#f0f6fc;font-weight:600;"> {prefilled_title}</span>
                <span style="color:#8b949e;">{company_label}</span>
                <div style="font-size:0.75rem;color:#7ee787;margin-top:3px;">✓ Job description pre-filled below. Drop in your resume to start!</div>
            </div>
            """,
            unsafe_allow_html=True,
        )

    # ── Step 1: Resume Upload ──
    st.markdown('<p class="input-label">1. Upload Your Resume (PDF)</p>', unsafe_allow_html=True)
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
        '🔒 Processed in active memory · Never stored · Never trained on'
        '</p>',
        unsafe_allow_html=True,
    )

    # ── Step 2: Job Description ──
    st.markdown('<p class="input-label">2. Target Job Description</p>', unsafe_allow_html=True)
    jd_input = st.text_area(
        "Job Description",
        value=prefilled_jd if prefilled_jd else "",
        height=160,
        placeholder="Paste the target job description or key role requirements here...",
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

    # ── Primary CTA ──
    st.markdown("")
    if st.button("Scan My Resume & Start Free →", type="primary", use_container_width=True):
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

    # ── Clean Footer & Collapsed FAQ ──
    st.markdown("---")
    with st.expander("❓ Frequently Asked Questions (Who Built This, Privacy & Free Tier)"):
        st.markdown("""
        **1. Who built PrepInterview AI?**  
        PrepInterview was built independently by Ambar, a product and tech builder who kept seeing candidates (and himself) get blindsided by tough resume-defense questions in interviews. Most interview prep tools just ask generic questions like *"Tell me about yourself."* PrepInterview was built to do the uncomfortable, necessary work: testing whether you can actually defend every number and claim on your resume.

        **2. What happens to my uploaded resume and audio recordings?**  
        We do not store your resume or audio in our own systems. Your documents and voice recordings are processed ephemerally during your active session and are never saved to our servers, sold to recruiters, or used to train models.
        
        **3. How does Resume Attack Mode work?**  
        Unlike generic interview bots that ask textbook questions, our engine extracts the exact claims and quantitative metrics from your resume and tests whether you can defend their baselines, methodology, and trade-offs under pressure.
        
        **4. Is this only for Software Engineers?**  
        No! Our rubrics are role-aware. For Product Managers, Growth leads, and Business/MBA candidates, we probe unit economics, attribution, A/B testing rigor, and stakeholder alignment. For technical roles, we probe system architecture, edge cases, and scaling limits.
        
        **5. What is Free vs. what does the ₹49 Pro Pass include?**  
        • **100% Free:** Interactive 1-bullet live tester, full resume vulnerability audit (top 5 predicted questions & claim risks), and Round 1 of the spoken voice interview.  
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
        risk = summary.get("risk_level", "?")
        risk_emoji = {"LOW": "🟢", "MEDIUM": "🟡", "HIGH": "🔴"}.get(risk, "⚪")
        one_line = summary.get("one_line", "")

        st.markdown(f'<p class="hero-title">{fit}% Fit</p>', unsafe_allow_html=True)
        st.markdown(f'<p class="hero-sub">{risk_emoji} {risk} interview risk · {one_line}</p>', unsafe_allow_html=True)

        col1, col2 = st.columns(2)
        with col1:
            st.markdown('<p class="section-head">✅ Your Strengths</p>', unsafe_allow_html=True)
            for s in summary.get("strengths", []):
                st.markdown(f"- {s}")
        with col2:
            st.markdown('<p class="section-head">⚠️ Your Gaps</p>', unsafe_allow_html=True)
            for g in summary.get("gaps", []):
                st.markdown(f"- {g}")

    st.markdown("---")
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
                        👑 Unlock All 10+ Question Strategies & Complete Pro Pass
                    </div>
                    <div style="font-size:0.88rem;color:#e6edf3;line-height:1.5;margin-bottom:0.85rem;">
                        Get full strategic STAR frameworks for all 10 questions, complete Attack Mode defense playbooks, downloadable Prep Dossier, and unlimited mock interviews.
                    </div>
                    <div style="background:#0e1117;border:1px solid #30363d;border-radius:8px;padding:0.85rem;margin-bottom:0.9rem;font-size:0.82rem;">
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
                            <span style="color:#ffd700;font-size:0.9rem;">₹49 (One-Time · No Subscription)</span>
                        </div>
                    </div>
                    <div style="font-size:0.8rem;color:#8b949e;margin-bottom:0.5rem;">
                        ☕ <i>Less than a cup of coffee. Landing an 8–15 LPA job pays ₹40,000–₹1,00,000+ extra every month.</i>
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
    # 🎤 AI MOCK INTERVIEW CTA
    # ══════════════════════════════════════════════════════════

    st.markdown("""
    <div class="cta-banner">
        <h2>🎤 Practice with an AI Interviewer</h2>
        <p>
            You've seen the questions. Now practice answering them live.<br>
            The AI adapts to YOUR resume, this JD, and scores your responses.
        </p>
        <div class="features">
            <span class="feature">🎯 Uses your predicted questions</span>
            <span class="feature">🗣️ Real-time feedback</span>
            <span class="feature">📊 Answer scoring</span>
            <span class="feature">🔄 Keeps drilling deeper</span>
        </div>
    </div>
    """, unsafe_allow_html=True)

    if st.button("🎤 Start Mock Interview", type="primary", use_container_width=True):
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
                f"**Fit Score:** {summary.get('fit_score', '?')}%\n"
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
# STEP 3: VOICE MOCK INTERVIEW
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

    interviewer_ctx = f"""You are a professional interviewer conducting a realistic job interview.

{persona_prompt}

CANDIDATE'S RESUME:
{resume_text}

JOB DESCRIPTION:
{jd_text}

PREDICTED HIGH-PROBABILITY QUESTIONS:
{q_list_str}

IDENTIFIED CONCERNS:
{c_list_str}

RULES:
1. Start by greeting the candidate briefly and asking the FIRST predicted question.
2. After each answer, provide brief feedback matching your persona:
   **Score: X/10**
   ✅ **Good:** what they did well (1 line)
   ⚠️ **Improve:** what was missing (1 line)
   💡 **Tip:** one suggestion (1 line)
3. Then ask the NEXT question — a follow-up or next predicted question.
4. Be specific to this candidate. No generic questions.
5. After the candidate answers Question 4, conclude the mock interview with a final evaluation:
   **🎯 INTERVIEW COMPLETE: OVERALL SCORE: X/10**
   🏆 **Top Strengths:** (2 bullet points on technical/communication highlights)
   ⚠️ **Critical Gaps to Fix:** (2 bullet points on weak architecture defenses or missing specifics)
   🚀 **Next Steps:** (1 encouraging actionable sentence)
6. Keep responses concise and impactful — this is a real high-stakes interview.
"""

    # ── Call Screen Header ──
    st.markdown(f"""
    <div class="call-screen">
        <div class="call-avatar">🎤</div>
        <div style="font-size:1.15rem;font-weight:700;margin-bottom:0.25rem;">{archetype}</div>
        <div class="call-status">● Live Interview in progress · Adaptive Rubric Evaluation</div>
    </div>
    """, unsafe_allow_html=True)
    render_pro_bar()

    # ── Initialize first message ──
    if not st.session_state.mock_messages:
        with st.spinner("Interviewer is preparing the first question..."):
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

    # ── Check Voice Interview Completion (Question 1 Free Evaluation Round) ──
    candidate_turns = sum(1 for m in st.session_state.mock_messages if m["role"] == "candidate")
    can_answer_voice = st.session_state.is_pro or st.session_state.unlocked_voice or (candidate_turns < 1)

    if not can_answer_voice:
        st.markdown("""
        <div class="lock-card" style="border:1px solid #ffd700;background:linear-gradient(135deg, #1a1608 0%, #11141c 100%);padding:1.5rem;border-radius:12px;margin:1.2rem 0;">
            <div style="font-size:1.25rem;font-weight:800;color:#ffd700;margin-bottom:0.4rem;">
                🎯 Round 1 Voice Evaluation Complete!
            </div>
            <p style="font-size:0.95rem;color:#e6edf3;line-height:1.5;margin-bottom:0.75rem;">
                You've experienced how our AI interviewer challenges your claims and evaluates your spoken delivery.
                Unlock the complete 4-round mock interview with adaptive follow-ups, full written defense playbooks, and your complete candidate debrief for a single ₹49 pass.
            </p>
            <div style="background:#0e1117;padding:1rem;border-radius:8px;margin-bottom:1rem;border:1px solid #30363d;">
                <div style="font-weight:700;color:#fff;font-size:0.9rem;margin-bottom:0.4rem;">👑 What PrepInterview Pro (₹49) Unlocks:</div>
                <div style="font-size:0.85rem;color:#bbb;line-height:1.7;">
                    ✅ <strong>Unlimited Mock Interview Rounds:</strong> Practice as many full rounds as you need with fresh questions.<br>
                    ✅ <strong>All Attack Mode Defenses:</strong> Reveal every written defense playbook for your vulnerable resume claims.<br>
                    ✅ <strong>Downloadable Prep Dossier:</strong> Get your complete personalized interview cheat-sheet (Markdown/PDF).<br>
                    ✅ <strong>Zero Subscription Risk:</strong> Single ₹49 one-time pass. No auto-renew, no hidden charges.
                </div>
            </div>
            <div style="background:#0e1117;border:1px solid #30363d;border-radius:8px;padding:0.85rem;margin-bottom:0.5rem;font-size:0.82rem;">
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
                    <span style="color:#ffd700;font-size:0.9rem;">₹49 (One-Time · No Subscription)</span>
                </div>
            </div>
            <div style="font-size:0.8rem;color:#8b949e;margin-top:0.5rem;">
                ☕ <i>Less than a cup of coffee. Landing an 8–15 LPA job pays ₹40,000–₹1,00,000+ extra every month.</i>
            </div>
        </div>
        """, unsafe_allow_html=True)
        if ENABLE_SPONSOR_ADS:
            col_vt1, col_vt2 = st.columns(2)
            with col_vt1:
                if st.button("⚡ Continue Free (10s Sponsor Ad)", key="btn_ad_voice", use_container_width=True):
                    run_sponsor_ad_countdown("voice")
            with col_vt2:
                st.link_button("👑 Pro Pass (₹49)", "https://rzp.io/rzp/vSIuH5yL", use_container_width=True)
        else:
            st.link_button("👑 Unlock Unlimited Interviews & Complete Dossier (₹49)", "https://rzp.io/rzp/vSIuH5yL", use_container_width=True)
    else:
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

                # Build conversation context for Gemini
                conv = interviewer_ctx + "\n\nConversation so far:\n"
                for msg in st.session_state.mock_messages:
                    label = "Interviewer" if msg["role"] == "interviewer" else "Candidate"
                    conv += f"\n{label}: {msg['content']}\n"
                conv += (
                    "\nThe candidate just answered via voice (audio attached). "
                    "IMPORTANT INSTRUCTIONS:\n"
                    "1. FIRST, listen carefully to the ENTIRE audio and transcribe EXACTLY what the candidate said, "
                    "word-for-word. Show the full transcription as: '**You said:** [complete word-for-word transcription]'\n"
                    "2. Do NOT summarize or paraphrase — transcribe every word they spoke.\n"
                    "3. THEN provide your interviewer feedback (Score, Good, Improve, Tip).\n"
                    "4. THEN ask the next question."
                )

                with st.spinner("🎤 Listening and evaluating..."):
                    try:
                        response = call_gemini_audio(audio_bytes, conv)

                        # Try to extract what the AI transcribed
                        transcript = "🎙️ *[Voice answer]*"
                        if "**You said:**" in response:
                            parts = response.split("**You said:**", 1)
                            if len(parts) > 1:
                                # Get text until next ** or newline
                                raw = parts[1].strip()
                                end = raw.find("\n\n")
                                transcript = "🎙️ " + (raw[:end].strip() if end > 0 else raw[:200].strip())

                        st.session_state.mock_messages.append(
                            {"role": "candidate", "content": transcript}
                        )
                        st.session_state.mock_messages.append(
                            {"role": "interviewer", "content": response}
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
                    st.session_state.mock_messages.append(
                        {"role": "candidate", "content": text_answer.strip()}
                    )

                    conv = interviewer_ctx + "\n\nConversation so far:\n"
                    for msg in st.session_state.mock_messages:
                        label = "Interviewer" if msg["role"] == "interviewer" else "Candidate"
                        conv += f"\n{label}: {msg['content']}\n"
                    conv += "\nInterviewer: [Give feedback on the last answer, then ask the next question]"

                    with st.spinner("Evaluating your answer..."):
                        response = call_gemini(conv)
                        st.session_state.mock_messages.append(
                            {"role": "interviewer", "content": response}
                        )
                    st.rerun()

    # ── Replay / Stop speaking ──
    st.markdown("---")
    col_tts1, col_tts2 = st.columns(2)
    with col_tts1:
        if st.button("🔊 Replay last question", use_container_width=True):
            for msg in reversed(st.session_state.mock_messages):
                if msg["role"] == "interviewer":
                    inject_tts(msg["content"])
                    break
    with col_tts2:
        if st.button("🔇 Stop speaking", use_container_width=True):
            st.html("<script>window.speechSynthesis.cancel();</script>")

    # ── Navigation ──
    st.markdown("")
    col1, col2 = st.columns(2)
    with col1:
        if st.button("← Back to Results", use_container_width=True):
            st.html("<script>window.speechSynthesis.cancel();</script>")
            st.session_state.step = 2
            st.rerun()
    with col2:
        if st.button("🔄 Restart Interview", use_container_width=True):
            if not st.session_state.is_pro and candidate_turns >= 1:
                st.warning("💡 You've completed your free voice evaluation trial! Upgrade to Pro Pass (₹49) for unlimited 4-round mock interviews and retries.")
            else:
                st.html("<script>window.speechSynthesis.cancel();</script>")
                st.session_state.mock_messages = []
                st.session_state["last_spoken"] = -1
                st.rerun()

