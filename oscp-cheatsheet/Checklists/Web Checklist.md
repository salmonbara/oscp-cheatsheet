---
title: Web Checklist
type: checklist
tab: Checklists
target: Web
tags: [HTTP, Web, Checklist, Enumeration]
---

# Web Checklist

## Goal

Move from an exposed HTTP/HTTPS service to useful findings: hidden paths, source leaks, login surfaces, framework/CMS clues, and injectable inputs.

## Flow

- [ ] Run directory brute force.
- [ ] Check common discovery files and leak paths.
- [ ] Identify login surfaces and safe default credential opportunities.
- [ ] Fingerprint CMS/framework/version.
- [ ] Test input fields.
- [ ] Review HTML source and comments.
- [ ] Retry with extensions, recursion, subdirectories, or vhost brute force if the first pass is dry.

## If You See Web / HTTP / HTTPS

- [ ] Run directory brute force with `gobuster`, `feroxbuster`, or `ffuf`.
- [ ] Check `robots.txt`, `sitemap.xml`, `/.git`, `/.env`, and `/web.config`.
- [ ] Find login pages and try safe/default credentials when appropriate.
- [ ] Identify CMS/framework/version, then search for known exploits.
- [ ] Test input fields for SQLi, LFI, SSTI, command injection, and file upload.
- [ ] Review HTML source and comments.
- [ ] Try common extensions: `.php`, `.bak`, `.old`, `.txt`, `.zip`, `.tar.gz`.

## If Directory Brute Force Finds Nothing

- [ ] Try a larger or different wordlist.
- [ ] Add extensions such as `.php`, `.asp`, `.aspx`, `.jsp`.
- [ ] Enable recursive scanning.
- [ ] Scan interesting subdirectories separately.
- [ ] Try vhost brute force.

```sh
# Recursive feroxbuster.
feroxbuster -u http://<TARGET_IP> -w /usr/share/seclists/Discovery/Web-Content/raft-medium-directories.txt -x php,txt,html,bak,zip -r

# LFI tests.
curl "http://<TARGET_IP>/page.php?file=../../../../etc/passwd"
curl "http://<TARGET_IP>/page.php?file=php://filter/convert.base64-encode/resource=index.php"

# SQLi quick tests.
curl "http://<TARGET_IP>/page.php?id=1'"
curl "http://<TARGET_IP>/page.php?id=1 AND 1=1--"

# SSTI test. Look for `49` in the response.
curl "http://<TARGET_IP>/search?q={{7*7}}"
```

## Done When

- You know the tech stack, interesting paths/files, login surfaces, and candidate vulnerability classes.
- You have either a likely exploit path or a reason to move to service-specific enum.
