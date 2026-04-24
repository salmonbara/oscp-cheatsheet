---
title: Web Enumeration
type: note
tab: Enum
services: [HTTP, DNS]
tools: [ffuf, gobuster, dnsrecon, dig, feroxbuster, nikto]
inputs: []
outputs: [Subdomains, Directories, Files, Findings]
tags: [HTTP, DNS, Enumeration]
---

# Web

## Subdomain Discovery

#DNS #HTTP #Enumeration
Quick subdomain and vhost discovery reference.

```sh
# DNS brute force with gobuster.
gobuster dns -d <DOMAIN> -w subdomains-top1million-110000.txt

# Virtual host fuzzing with ffuf.
ffuf -w subdomains.txt -u http://<DOMAIN>/ -H "Host: FUZZ.<DOMAIN>"

# Vhost discovery with gobuster.
gobuster vhost -u http://<DOMAIN>/ -w <WORDLIST>

# DNS brute force with dnsrecon.
dnsrecon -d <DOMAIN> -D /usr/share/seclists/Discovery/DNS/namelist.txt -t brt

# Ask a known DNS server for current records.
dig <DOMAIN> ANY +noall +answer @<DNS_IP>
```

## Directory Discovery

#HTTP #Enumeration
Quick directory and file discovery reference.

```sh
# Quick feroxbuster pass.
feroxbuster -u http://<TARGET_IP>

# Custom wordlist with feroxbuster.
feroxbuster -u http://<TARGET_IP> -w <WORDLIST>

# Directory fuzzing with ffuf.
ffuf -u http://<TARGET_IP>/FUZZ -w /usr/share/wordlists/dirb/big.txt

# Directory fuzzing with extensions.
ffuf -w <WORDLIST> -u http://<TARGET_IP>/FUZZ -e .aspx,.html,.php,.txt

# Gobuster directory scan.
gobuster dir -u http://<TARGET_IP>/ -w raft-medium-words.txt
```

## Vulnerability Scan

#HTTP #Enumeration
Basic web vulnerability scan.

```sh
nikto -h http://<TARGET_IP>
```
