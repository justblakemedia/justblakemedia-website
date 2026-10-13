# AJMN workshop page copy audit and follow-up

Date: October 12, 2026

## Scope and baseline

The deployed `https://justblakemedia.com/ai-workshop` page was inspected in Chrome and compared with the latest website source. Its HTML matched `origin/main` commit `a6485f7` after normalizing line endings. This is the redesigned page with a build chooser, hero illustration, three build guides, eight additional prompt cards, and 17 Copy buttons. The earlier audit of the former layout is not the baseline for this review.

I reviewed the hero, session details, navigation, build chooser, all headings and directions, three build and test prompts, eight additional prompts, tool map, guardrails, personal stack, deck area, contact area, and button labels. I preserved the new page layout, brand, illustration, and unrelated pages.

## Main copy findings and changes

| Area | Live baseline issue | Revision |
| --- | --- | --- |
| Entry and chooser | The page steered attendees toward safe or fictional samples, then promised a draft made in the room. It did not describe saving and reuse as part of the build. | The introduction now frames the page as a guide to creating, saving, reusing, and testing one helper with approved work. The three chooser labels identify the material to gather. |
| Email voice | The build accepted short writing samples or fictional practice paragraphs. It omitted the connected email route and put saving and connecting in an after-workshop disclosure. | Attendees can choose 3 to 5 sent emails they wrote or a permitted connected work account. The prompt checks access and scope, shows the selected messages, and waits for the attendee to approve or replace them before using the contents. Steps cover reviewing, saving, opening the saved guide, and testing it in a fresh chat. |
| Social voice | Fictional practice captions could substitute for organization posts. Saving was delayed. | Attendees select 3 to 5 actual organization posts, with platform and audience. The copied prompt has a place to add captions or screenshots, waits for missing text, then makes a guide to save and test with current facts. |
| Daily brief | The build used a fictional gala workday and could not produce a reusable brief from current sources. Scheduling was only mentioned as a later possibility. | Attendees choose permitted email, calendar, and task sources or supply manual items. The prompt waits for those sources, creates a brief from checked information, returns reusable instructions, and proposes a schedule only when the attendee selected that route. Steps require a saved schedule readback, delivery test, and separate check of the next timed run. |
| Tool map | “Where your job description lives” was vague. The ChatGPT entry implied custom GPT creation might be available across account types. | The repeated label is now “Where to keep your instructions,” with a per-chat or supported Project/Gem route. The Custom GPT creation claim was removed. Access wording and check date were refreshed against provider documentation. |
| Prompt library | Prompt 01 was a fictional donor scenario. Prompt 02 already checked access to a voice guide, but its saved-guide route and draft boundary could be clearer. Prompt 06's card described general campaign results, while its copied text asked for an email table. | Prompt 01 now requests a real, redacted brief and forbids invented gifts, outcomes, dates, quotes, and motives. Prompt 02 names the guide, asks for it when unavailable, and keeps the revision unsent. Prompt 06's visible description now names email results. The other five prompts remain available, with their draft and fact boundaries intact. |

The old “after the workshop” disclosures and fictional fallback writing were removed. Privacy, verified facts, draft review, and honest checks of available connections and scheduling remain. The prompts do not grant permission to send email replies, publish posts, or edit calendars or tasks. The one scheduled private brief route requires an exact setup confirmation.

## Prompt inventory

The deployed baseline had eight additional prompts: compare a draft before and after a voice guide, rewrite an email in your voice, one story across channels, headline brainstorm, donor stewardship story, read the numbers, check for generic copy, and make a sensitive draft clearer. The follow-up removed “Read the numbers” at Justin's request. The final page has seven additional prompts, three build prompts, and three fresh-chat test prompts. Three primary Copy buttons repeat the build prompts, producing 16 buttons for 13 distinct prompt blocks. The remaining prompt labels run from 01 through 07.

## Independent attendee review

An independent reviewer read the revised page as a first-time attendee and compared the visible directions with the copyable text. The reviewer found four actionable gaps. The connected-email prompt needed to wait for approval of its message selection. The social prompt needed an explicit place for posts and a pause for unreadable text. The daily brief needed to wait for connected or pasted sources. Prompt 06's description needed to match its email-results scope. All four were corrected in this branch. The reviewer found that the builds otherwise cover purpose, inputs, creation, saving, and a fresh-chat test.

## First review verification

- Local Chrome test of the revised page: all 17 Copy buttons returned the full corresponding prompt text. Windows clipboard line endings differed from the DOM, but all characters matched after CRLF/LF normalization. Keyboard activation of a Copy button also passed.
- All 14 disclosures opened by mouse and closed by Enter. All seven internal anchor targets existed; the hero action reached the build section. The first Tab reached “Skip to main content.”
- The illustration loaded from both the local file preview and the temporary HTTP preview. No page script errors were reported.
- Desktop and mobile checks at 1440, 768, 390, and 320 pixels showed no horizontal overflow or hidden main sections. Full-page and section screenshots were inspected at 1440 and 390 pixels.
- The eight additional prompt cards, three build guides, and six build/test prompt disclosures were counted in the rendered DOM.
- Twelve distinct external HTTPS links were checked. Nine returned a page through direct or browser checks. ChatGPT, Claude, and OpenAI's Codex page returned Cloudflare 403 to automated Chrome, so their destination content could not be verified through that test. Their URLs are preserved. The two `mailto:` links were inspected but no email was sent.
- No real AI account, email connection, schedule, delivery destination, or downstream generated brief was exercised. The page instructs attendees to verify those steps in their own approved app.

## Follow-up revision and verification

Justin requested a clearer description of how he uses Claude Code and Codex to build applications, create and update websites, and make custom automations. The Wispr Flow note now explains that dictation helps him get ideas into editable text quickly, without claiming this page began as a voice note. The contact section now asks “Looking to take your AI skills to the next level?” and describes AI workflows without paid media. The deck section links to the [AJMN slides](https://docs.google.com/presentation/d/11fMr_f0IHhKy_-08oCmlL7oS7zMXruu1/edit?usp=sharing&ouid=112393808145593159880&rtpof=true&sd=true), which returned the title `AJMN AI Workshop.pptx - Google Slides` in an unauthenticated HTTP check. The “Read the numbers” card and its copied prompt were removed, and the final two cards were renumbered.

- Final local Chrome check: 3 build guides, 7 additional prompt cards, 16 Copy buttons, and 13 disclosures. All Copy buttons matched the full intended text after normalizing Windows line endings. All disclosures, keyboard Copy, skip link, and internal anchors passed.
- At widths 1440, 768, 390, and 320 pixels, no horizontal overflow or hidden main sections appeared. The updated stack, deck, and contact sections were inspected at desktop and mobile sizes. No page script errors were reported.
- The deck anchor resolved to the exact Google Slides URL Justin supplied. The link was tested, but Google account access for every attendee cannot be established from this machine.

## Deck wording

The three build names remain exactly: “Write emails that sound like you,” “Capture your organization's social voice,” and “Get a daily brief.” Their purpose still aligns with the deck's outbox-to-email, organization-words-to-social, and daily-priorities descriptions. The page now teaches the complete saved workflow. No deck text was changed.

## Sources and guidance used

- `the-brain/brain/Voice.md` for Justin's direct, concrete tone, excluding social-post formatting and old metrics.
- `the-brain/500 - Resources/Skills/marketingskills-main/skills/copy-editing/SKILL.md` for clarity and usefulness.
- `the-brain/500 - Resources/Skills/humanizer-main/SKILL.md` for the final natural-language pass, without adding personal claims.
- `the-brain/.claude/skills/jbm-website-builder/SKILL.md` for Arch's readable presentation guidance; `the-brain/.claude/skills/skill-library/INDEX.md` was used to locate the relevant vault skill.
- Website `README.md` and `.claude/skills/jbm-website-builder/SKILL.md` for repository and page conventions.
- `the-brain/work/active/ai-workshops/deck/redesign-2026-10-12/AJMN Deck Redesign Audit 2026-10-12.md` for the three deck build names and descriptions.
- Current provider documentation checked for the tool map: [ChatGPT Projects](https://help.openai.com/en/articles/10169521-using-projects-in-chatgpt), [GPT creation availability](https://help.openai.com/en/articles/8554397-creating-a-gpt.), [Claude Projects](https://support.claude.com/en/articles/9517075-what-are-projects), [Gemini Gems](https://support.google.com/gemini/answer/15146780), [Copilot licenses](https://support.microsoft.com/en-us/microsoft-365-copilot/what-copilot-license-do-i-have), and [Grok plans](https://x.ai/pricing).

No recommended plugin was assumed to be installed. Production status requires a separate live-site check after deployment.
