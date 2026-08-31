---
date: 2026-08-28
description: Source, license, photographer, access date, and page-use credits for the local Human Systems website photography assets.
tags: [website, photography, licensing, human-systems]
---

# Human Systems Photography Credits

These local website assets support [[../../../docs/superpowers/specs/2026-08-28-jbm-human-systems-website-design|JBM Human Systems Website Design]].

| Local image | Photographer | Official Unsplash source | Reproducible download | License | Access date | Page use |
|---|---|---|---|---|---|---|
| `hero-owner.webp` | Amy Hirschi | [Man and woman talking inside office](https://unsplash.com/photos/man-and-woman-talking-inside-office-W7aXY5F2pBo) | Not recorded in pipeline | [Unsplash License](https://unsplash.com/license) | 2026-08-28 | Hero owner or marketing lead conversation |
| `paid-media.webp` | Vitaly Gariev | [Two colleagues collaborating on a project at a laptop](https://unsplash.com/photos/two-colleagues-collaborating-on-a-project-at-a-laptop-tRvuRPE8cr4) | [Official image endpoint](https://images.unsplash.com/photo-1758873268444-73528cd3ec93?auto=format&fit=max&fm=jpg&q=90&w=2400) | [Unsplash License](https://unsplash.com/license) | 2026-08-29 | Paid media strategy service story |
| `amplify-owner.webp` | atelierbyvineeth ... | [Man ordering coffee from a street vendor](https://unsplash.com/photos/man-ordering-coffee-from-a-street-vendor-Uk2eStC8TTE) | Not recorded in pipeline | [Unsplash License](https://unsplash.com/license) | 2026-08-28 | Amplify service card |
| `ai-team.webp` | Annie Spratt | [Group of people using laptop computer](https://unsplash.com/photos/group-of-people-using-laptop-computer-QckxruozjRg) | Not recorded in pipeline | [Unsplash License](https://unsplash.com/license) | 2026-08-28 | AI systems service card |

Rebuild the paid media asset from its declared licensed endpoint:

```powershell
py website/scripts/prepare-human-systems-assets.py --download paid-media --output-dir website/assets/human-systems
```
