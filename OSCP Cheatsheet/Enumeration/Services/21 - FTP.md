---
title: FTP
type: service
tab: Enum
ports: [21]
service: FTP
tools: [ftp, nc, nmap, nxc]
inputs: [Username, Password]
outputs: [Banner, Files, Password]
tags: [FTP, Enumeration]
---

# FTP

`21/tcp open ftp`

## Quick Notes

- Always try anonymous login.
- Common anonymous creds: `anonymous:anonymous`, `anonymous:<blank>`, `ftp:ftp`.

## Commands

### Quick Checks

#FTP #Enumeration
Quick anonymous and unauthenticated FTP checks.

```sh
# Interactive FTP login.
ftp <TARGET_IP>

# Grab the FTP banner quickly.
nc -vn <TARGET_IP> 21

# Open FTP in a browser.
ftp://<TARGET_IP>

# Find FTP-related Nmap scripts and run them.
ls -lh /usr/share/nmap/scripts/ | grep ftp
nmap <TARGET_IP> -p 21 -sV --script=<SCRIPT1>,<SCRIPT2>

# Fingerprint FTP with NetExec.
nxc ftp <TARGET_IP>
```

### Credentialed Checks

#Username #Password #FTP #Enumeration
Try anonymous/default credentials and validate known FTP creds.

```sh
# Common anonymous/default check.
nxc ftp <TARGET_IP> -u 'anonymous' -p ''

# Test known credentials.
nxc ftp <TARGET_IP> -u <USER> -p '<PASS>'
```

### Wordlists

#FTP #Enumeration
Default FTP credential wordlist reference.

```text
/usr/share/seclists/Passwords/Default-Credentials/ftp-betterdefaultpasslist.txt
```
