---
title: Password Guessing
type: note
tab: Initial Access
inputs: [Username]
outputs: [Password]
tags: [InitialAccess, Password, Enumeration]
---

# Password Guessing

## Quick Ideas

- Try product, vendor, manufacturer, hostname, company, and service names as username/password candidates.
- If a name is found, generate username variants: lowercase, uppercase, first initial + last name, first.last, first_last.
- Try `name:name` patterns carefully after checking lockout policy.
- Use `cewl` to build a target-specific wordlist from web content.
- Use CUPP when you have personal/contextual details.

## Examples

#Username #Password #InitialAccess
Common username variants for `John Doe`.

```text
john
John
johnd
jdoe
john.doe
j.doe
jd
```

#Password #InitialAccess
Create custom wordlist from a website.

```sh
cewl http://<TARGET> -w words.txt
```

#Password #InitialAccess
Create custom wordlist with crawl depth and minimum word length.

```sh
cewl http://<TARGET> -d 2 -m 5 -w cewl.txt
```
