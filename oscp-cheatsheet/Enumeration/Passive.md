---
title: Passive Enumeration
type: note
tab: Enum
tools: [google]
inputs: []
outputs: [Domains, URLs, LoginPages]
tags: [Enumeration]
---

# Passive

## Google Dorks

#Enumeration
Quick Google dork set for passive discovery and login-page hunting.

```text
# General search: combine site, title, and a keyword.
site:<SITE> intitle:"<TITLE>" "<KEYWORD>"

# Directory listing / exposed indexes.
site:<DOMAIN> intitle:"index of"

# Login pages.
site:<DOMAIN> inurl:login

# UAT / staging assets.
site:uat.* <TARGET_KEYWORD> inurl:login
```
