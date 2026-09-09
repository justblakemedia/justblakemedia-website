# Testimonials

`testimonials.json` is a list. It ships empty. The site renders an "In their words" section on the homepage and the case studies page only when the list has at least one entry. Nothing renders while it is empty, so nothing on the site is ever a placeholder quote.

Add one object per real, attributed quote:

```json
[
  {
    "quote": "The exact words they wrote, unedited.",
    "name": "First Last",
    "role": "Title",
    "company": "Company, or 'property management client' if anonymised",
    "link": "https://optional-url"
  }
]
```

`link` is optional. Never add a quote that was not written or approved by the person named. Commit the file and Vercel deploys it; no other change is needed.
