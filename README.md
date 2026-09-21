# PrepInterview AI

**Find what interviewers will challenge on your resume, then practice defending it out loud.**

- **Web app:** [prepinterview.online](https://prepinterview.online)
- **Chrome extension:** PrepInterview Copilot (Beta), a job-fit and gap analysis card for LinkedIn job pages

## What's in this repo

| Part | What it does |
|---|---|
| `app.py` | The web app (Streamlit): resume vs. job analysis, predicted interview questions, spoken mock interview and post-interview debrief |
| `index.html` | Landing page that embeds the web app |
| `extension/` | PrepInterview Copilot, a Manifest V3 Chrome extension |
| `privacy.html`, `terms.html` | Privacy Policy and Terms of Service & Refund Policy |

## PrepInterview Copilot (Chrome extension, Beta)

Shows a card on LinkedIn job pages that compares the job with your resume: skills, experience, education and location fit, your biggest gaps, and a one-click way to prepare for that interview.

### Known limitations

- Works on LinkedIn jobs pages (search results, collections and direct job postings); not active on other pages such as the feed or messaging.
- Evaluates one resume at a time (stores a single active resume).
- College tier detection covers Indian institutions only; other colleges default to a neutral fit without penalty.
- LinkedIn layout changes can temporarily misalign or break the card until the extension is updated.
- Only evaluates English job descriptions.
- Skills not explicitly named in the job text are not counted, even if they are common in the role.
- Fit estimates are heuristics based on the stated requirements, not hiring decisions or predictions.
- Relocation preference is set manually; the extension does not infer your willingness to move.

### Privacy

- The extension makes no network requests. Your resume is stored only in your browser (`chrome.storage.local`) and is never uploaded.
- If you click **Prepare for this interview**, your browser opens prepinterview.online with the job's title, company and text in the link. Your resume is never included.

## Web app (prepinterview.online)

- **Free:** resume vulnerability audit with predicted questions and claim risks, a one-click demo, and Round 1 of the spoken mock interview.
- **Pro Pass (one-time, ₹49, no subscription):** the full 4-round mock interview, all written defense playbooks and a downloadable prep dossier. Razorpay processes payments, and we verify them on the server.
- **Privacy:** we do not store your resume or audio on our servers. To generate results, content is sent to a third-party AI service. See the [Privacy Policy](https://prepinterview.online/privacy.html) for details.

## Run the web app locally

```bash
pip install -r requirements.txt
python -m streamlit run app.py
```

Add your keys to `.streamlit/secrets.toml` (or a `.env` file). **Never commit either file; both are listed in `.gitignore`.**

```toml
GOOGLE_API_KEY = "your-gemini-api-key"
RAZORPAY_KEY_ID = "rzp_test_..."       # use test keys locally
RAZORPAY_KEY_SECRET = "..."
```

## Security

Found a security issue? Please fill this form **https://forms.gle/B27beQTckduMqAmG9** instead of opening a public issue.

## License

Copyright © 2026 PrepInterview AI. All rights reserved. This repository is public for transparency; no license to copy, modify or redistribute the code is granted.
