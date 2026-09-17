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
    #MainMenu {visibility: hidden; display: none;}
    footer {visibility: hidden; display: none !important;}
    header {visibility: hidden; display: none !important;}
    div[data-testid="stStatusWidget"] {visibility: hidden; display: none;}
    .stDeployButton {display: none !important;}
    [data-testid="stToolbar"] {visibility: hidden; display: none !important;}
    div[class*="viewerBadge"] {display: none !important;}
    div[class*="ProfileBadge"] {display: none !important;}
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
    """Render the Pro Pass / Free Tier status bar and unlock redemption."""
    if st.session_state.is_pro:
        st.markdown(
            '<div style="display:flex;align-items:center;justify-content:space-between;'
            'background:linear-gradient(90deg, #1f1c2c, #302b63);border:1px solid #ffd700;'
            'border-radius:10px;padding:0.75rem 1.2rem;margin-bottom:1.5rem;">'
            '<div><span class="pro-badge-active">👑 PRO PASS ACTIVE</span> '
            '<span style="color:#eee;font-size:0.9rem;margin-left:8px;">All 10 questions, attack mode & unlimited voice unlocked</span></div>'
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
        st.markdown(
            '<div style="display:flex;align-items:center;justify-content:space-between;'
            'background:#161616;border:1px solid #333;border-radius:10px;'
            'padding:0.65rem 1rem;margin-bottom:1.2rem;">'
            '<div><span style="font-size:0.8rem;color:#aaa;text-transform:uppercase;font-weight:700;">Plan: Free Tier</span> '
            '<span style="color:#888;font-size:0.85rem;margin-left:6px;">(Questions 1 & 2 Free)</span></div>'
            '<span style="font-size:0.8rem;color:#ffd700;font-weight:600;">👑 Upgrade below</span>'
            '</div>',
            unsafe_allow_html=True,
        )
        with st.expander("👑 Upgrade to Pro (₹49 Instant Access)", expanded=False):
            st.markdown(
                "**Upgrade to Pro** for just **₹49** to instantly unlock all 10 question answer strategies, "
                "full resume attack mode, unlimited voice mock interview rounds, and clean report downloads."
            )
            razorpay_url = os.getenv("RAZORPAY_PAYMENT_URL", "https://rzp.io/rzp/vSIuH5yL")
            st.link_button(
                "⚡ Unlock Pro Pass (₹49 · Instant UPI & Cards)",
                razorpay_url,
                type="primary",
                help="Instant unlock with UPI, GPay, PhonePe, Paytm, or Cards",
                use_container_width=True,
            )



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

    st.markdown('<p class="hero-title">Predict what you\'ll be asked</p>', unsafe_allow_html=True)
    st.markdown('<p class="hero-sub">Upload your resume and job description.<br>We\'ll predict the exact questions, concerns, and how to prepare.</p>', unsafe_allow_html=True)

    # ── Resume Upload ──
    st.markdown('<p class="input-label">📄 Your Resume</p>', unsafe_allow_html=True)
    resume_file = st.file_uploader(
        "Resume",
        type=["pdf"],
        label_visibility="collapsed",
        help="Upload your resume as a PDF",
    )
    if resume_file:
        st.success(f"✓ {resume_file.name}")

    # ── JD Upload OR Paste ──
    st.markdown('<p class="input-label">📋 Job Description</p>', unsafe_allow_html=True)

    jd_method = st.radio(
        "How would you like to provide the job description?",
        ["Paste text", "Upload file (PDF / TXT)"],
        horizontal=True,
        label_visibility="collapsed",
    )

    jd_input = ""

    if jd_method == "Paste text":
        jd_input = st.text_area(
            "Job Description",
            height=200,
            placeholder="Paste the full job description here...",
            label_visibility="collapsed",
        )
    else:
        jd_file = st.file_uploader(
            "Upload JD",
            type=["pdf", "txt"],
            label_visibility="collapsed",
            help="Upload the job description as PDF or plain text",
            key="jd_uploader",
        )
        if jd_file:
            if jd_file.name.endswith(".pdf"):
                jd_input = extract_pdf_text(jd_file)
            else:
                jd_input = jd_file.read().decode("utf-8", errors="ignore")
            if jd_input.strip():
                st.success(f"✓ {jd_file.name}")
                with st.expander("Preview JD text", expanded=False):
                    st.text(jd_input[:1500] + ("..." if len(jd_input) > 1500 else ""))

    st.markdown("")

    # ── CTA ──
    if st.button("Analyze My Fit →", type="primary", use_container_width=True):
        if not resume_file or not jd_input.strip():
            st.error("Please upload your resume and provide the job description.")
        else:
            resume_text = extract_pdf_text(resume_file)
            if not resume_text.strip():
                st.error("Could not extract text from your PDF. Make sure it's not a scanned image.")
            else:
                st.session_state.resume_text = resume_text
                st.session_state.jd_text = jd_input.strip()
                st.session_state.step = 1
                st.rerun()

    # ── Advanced Settings ──
    st.markdown("---")
    with st.expander("⚙️ Advanced Settings"):
        st.markdown(
            "**Choose your AI model.** Different models offer different tradeoffs between "
            "speed, quality, and availability. If one model is overloaded (503 error), "
            "the app will automatically try fallback models."
        )

        available_models = get_available_models()

        # Build display names with badges
        display_names = [format_model_name(m) for m in available_models]
        model_map = dict(zip(display_names, available_models))

        # Find current model's display name
        current_display = format_model_name(st.session_state.selected_model)
        current_index = 0
        if current_display in display_names:
            current_index = display_names.index(current_display)

        selected_display = st.selectbox(
            "AI Model",
            display_names,
            index=current_index,
            help="⭐ Top Rated = best quality. ✅ Stable = reliable. ⚡ Fast = quick responses. 🧪 Preview = experimental.",
        )

        if selected_display:
            actual_model = model_map[selected_display]
            st.session_state.selected_model = actual_model
            MODEL = actual_model

        # Legend
        st.markdown("""
        <div style="font-size: 0.8rem; color: #888; margin-top: 0.5rem;">
        ⭐ <b>Top Rated</b> — Best quality, may have high demand<br>
        ✅ <b>Stable</b> — Reliable and consistently available<br>
        ⚡ <b>Fast</b> — Quick responses, lighter analysis<br>
        🧠 <b>Advanced</b> — Most powerful, may be slower<br>
        🧪 <b>Preview</b> — Experimental, may be unstable
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

                is_q_unlocked = st.session_state.is_pro or (i < 2) or (i in st.session_state.unlocked_questions)
                if is_q_unlocked:
                    with st.expander("💡 How to answer", expanded=False):
                        for point in q.get("answer_points", []):
                            st.markdown(f"- {point}")
                else:
                    st.markdown("""
                    <div class="lock-card">
                        <div style="font-size:0.85rem;font-weight:700;color:#ff6b6b;margin-bottom:0.3rem;">
                            🔒 Answer Strategy Locked
                        </div>
                        <div class="blur-preview">
                            • Structure response highlighting direct ROI and quantifiable efficiency gains<br>
                            • Preemptively clarify technical architectural decisions and edge-case handling
                        </div>
                        <div style="font-size:0.8rem;color:#aaa;margin-top:0.4rem;">
                            Unlock this answer strategy:
                        </div>
                    </div>
                    """, unsafe_allow_html=True)
                    if ENABLE_SPONSOR_ADS:
                        col_u1, col_u2 = st.columns(2)
                        with col_u1:
                            if st.button("⚡ Unlock (10s Ad)", key=f"btn_ad_q_{i}", use_container_width=True):
                                run_sponsor_ad_countdown("question", i)
                        with col_u2:
                            st.link_button("👑 Pro Pass (₹49)", "https://rzp.io/rzp/vSIuH5yL", use_container_width=True)
                    else:
                        st.link_button("👑 Unlock with Pro Pass (₹49)", "https://rzp.io/rzp/vSIuH5yL", use_container_width=True)
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

                # Remaining attacks
                rem_attacks = attacks[1:]
                if rem_attacks:
                    is_atk_unlocked = st.session_state.is_pro or st.session_state.unlocked_attacks
                    if is_atk_unlocked:
                        for a in rem_attacks:
                            claim = a.get("resume_claim", "")
                            label = f'🎯 "{claim[:80]}..."' if len(claim) > 80 else f'🎯 "{claim}"'
                            with st.expander(label):
                                st.markdown(f"**Attack question:** {a.get('attack_question', '')}")
                                st.markdown(f"**What could go wrong:** {a.get('what_could_go_wrong', '')}")
                                st.markdown(f"**Your defense:** {a.get('defense', '')}")
                    else:
                        st.markdown(f"""
                        <div class="lock-card">
                            <div style="font-size:0.95rem;font-weight:700;color:#ff6b6b;margin-bottom:0.3rem;">
                                🔒 {len(rem_attacks)} More Resume Vulnerabilities & Defense Strategies Locked
                            </div>
                            <div class="blur-preview">
                                🎯 "Engineered end-to-end data pipelines scaling to 10M daily events..."<br>
                                • Attack: How did you ensure idempotency? What failure recovery guarantees existed?<br>
                                • Defense: Anchor on checkpointing, dead-letter queues, and SLA benchmarks.
                            </div>
                            <div style="font-size:0.8rem;color:#aaa;margin-top:0.5rem;">
                                Skeptical interviewers will target these exact claims. Unlock all defense playbooks:
                            </div>
                        </div>
                        """, unsafe_allow_html=True)
                        if ENABLE_SPONSOR_ADS:
                            col_ak1, col_ak2 = st.columns(2)
                            with col_ak1:
                                if st.button("⚡ Unlock All Defenses (10s Ad)", key="btn_ad_attacks", use_container_width=True):
                                    run_sponsor_ad_countdown("attacks")
                            with col_ak2:
                                st.link_button("👑 Pro Pass (₹49)", "https://rzp.io/rzp/vSIuH5yL", use_container_width=True)
                        else:
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
        st.download_button(
            "📥 Download Report",
            data=full_report,
            file_name="interview_report.md",
            mime="text/markdown",
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

    interviewer_ctx = f"""You are a professional interviewer conducting a realistic job interview.

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
2. After each answer, provide brief feedback:
   **Score: X/10**
   ✅ **Good:** what they did well (1 line)
   ⚠️ **Improve:** what was missing (1 line)
   💡 **Tip:** one suggestion (1 line)
3. Then ask the NEXT question — a follow-up or next predicted question.
4. Be specific to this candidate. No generic questions.
5. Be professional, direct, realistic.
6. After every 3 questions, give a running performance summary.
7. Keep responses concise — this is a real interview.
"""

    # ── Call Screen Header ──
    st.markdown("""
    <div class="call-screen">
        <div class="call-avatar">🎤</div>
        <div style="font-size:1.2rem;font-weight:700;margin-bottom:0.25rem;">AI Interviewer</div>
        <div class="call-status">● Interview in progress</div>
    </div>
    """, unsafe_allow_html=True)
    render_pro_bar()

    # ── Initialize first message ──
    if not st.session_state.mock_messages:
        with st.spinner("Interviewer is preparing the first question..."):
            first_msg = call_gemini(
                interviewer_ctx
                + "\n\nStart the interview. Greet the candidate briefly and ask your first question."
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

    # ── Check Voice Interview Trial Limit ──
    candidate_turns = sum(1 for m in st.session_state.mock_messages if m["role"] == "candidate")
    can_answer_voice = st.session_state.is_pro or st.session_state.unlocked_voice or (candidate_turns < 2)

    if not can_answer_voice:
        st.markdown("""
        <div class="lock-card">
            <div style="font-size:1.1rem;font-weight:800;color:#ffd700;margin-bottom:0.4rem;">
                🎯 2-Question Free Trial Complete!
            </div>
            <p style="font-size:0.9rem;color:#ddd;margin-bottom:0.6rem;">
                Great work! You've completed your initial interview evaluation rounds. The AI interviewer has identified key technical and leadership areas to drill deeper.
            </p>
            <div style="font-size:0.85rem;color:#aaa;">
                To continue with unlimited full-length interview rounds and in-depth rubric scoring:
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
            st.link_button("👑 Unlock Unlimited Voice Interview Rounds (₹49)", "https://rzp.io/rzp/vSIuH5yL", use_container_width=True)
    else:
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
            st.html("<script>window.speechSynthesis.cancel();</script>")
            st.session_state.mock_messages = []
            st.session_state["last_spoken"] = -1
            st.rerun()

