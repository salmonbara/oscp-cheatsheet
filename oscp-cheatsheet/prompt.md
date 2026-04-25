---
title: Prompt Inbox
type: inbox
tags: [Inbox, Triage]
---

# Prompt Inbox

Drop raw commands, snippets, or notes under one of the pending sections. I will move each item into the closest topic file, normalize tags/frontmatter, and record where it went under `Moved`.

## Examples

Single command example:

```sh
nmap -sC -sV <TARGET_IP>
```

Command set / step example:

```sh
smbclient //<TARGET_IP>/<SHARE> -U '<DOMAIN>/<USER>%<PASS>'
recurse ON
prompt OFF
mget *
```

## Pending - Single Commands

<!-- Add new one-line commands below this line. -->

## Pending - Command Sets / Steps

<!-- Add new command sets below this line. -->

## Moved

### 2026-04-25

- `impacket-ntlmrelayx -tf targets.txt -smb2support` -> `Active Directory/Initial_Access.md` under `NTLM Relay With SMB Signing Disabled`.
- `impacket-wmiexec <DOMAIN>/<USER>:<PASS>@<TARGET_IP>` -> `Active Directory/Lateral_Movement.md` under `WMI Exec With Password`.
- Kerbrute password spray / bruteuser -> `Active Directory/Initial_Access.md` under `Kerbrute Password Attacks`.
- BloodHound `--dns-tcp` fallback -> `Active Directory/Post_Creds_Enum.md` under `BloodHound Collection`.
- SharpHound collector examples -> `Active Directory/Post_Creds_Enum.md` under `SharpHound Collection`.
- Rubeus Kerberos examples -> `Active Directory/Post_Creds_Enum.md` under `Rubeus Kerberos Checks`.
- PowerView domain enum examples -> `Active Directory/Post_Creds_Enum.md` under `PowerView`.
- LDAP search with valid creds -> `Active Directory/Post_Creds_Enum.md` under `LDAP Search With Credentials`.
- NetExec `gpp_password` and `spider_plus` modules -> `Active Directory/Post_Creds_Enum.md` / `Enumeration/Services/135, 445 - SMB.md`.
- BloodHound Cypher queries -> `Active Directory/Bloodhound/BloodHound Analysis.md` under `Cypher Queries`.
- Responder run modes, log review, and NetNTLMv2 cracking -> `Active Directory/Initial_Access.md` under `Responder Net-NTLMv2 Capture`.
- Authenticated `rpcclient` commands and enum4linux-ng -> `Enumeration/Services/135, 445 - SMB.md`.
- FTP anonymous mirror with `wget -m` -> `Enumeration/Services/21 - FTP.md` under `Anonymous / Default Checks`.
- Web vhost, dirsearch, Nikto, Nuclei, WhatWeb/Wappalyzer, WPScan, and CeWL items -> `Enumeration/Web.md`, `Initial Access/Online Password Attacks.md`, and `Initial Access/Password Guessing.md`.
- PDF metadata extraction with `exiftool` -> `Enumeration/Web.md` under `Metadata Extraction`.
- Hydra service, HTTP GET, HTTP POST, and HTTPS POST examples -> `Initial Access/Online Password Attacks.md`.
- Hash identifier and online crack references -> `Credentials/Hash Crack.md`.
- Metasploit useful modules and MSFvenom payload generation -> `Payloads/Reverse Shells.md`.
- Searchsploit workflow -> `Exploitation/Web Payloads.md` under `Exploit Research`.
- WinPEAS, PowerUp, Seatbelt, and accesschk review -> `Privilege Escalation/Windows Privilege Escalation.md`.
- PrintSpoofer / GodPotato / JuicyPotato examples -> `Privilege Escalation/Windows Privilege Escalation.md` and `Tools/Potato Family.md`.
- LinPEAS and pspy -> `Privilege Escalation/Linux Privilege Escalation.md` under `Automated Audit Scripts`.
- Socat and Chisel tunnel helpers -> `Pivoting/Tunnelling.md`.
- Windows `nc.exe` / `ncat.exe` usage -> `Post-Exploitation/File Transfer.md`.
- OSCP proof and tree helpers -> `Post-Exploitation/Linux Post-Exploitation.md` and `Post-Exploitation/Windows Post-Exploitation.md`.
- Skipped exact duplicates already present: AS-REP roast, Kerberoast, Kerbrute userenum, basic Evil-WinRM, core hydra SSH/FTP/SMB/RDP/WinRM, Mimikatz LSASS/SAM/DCSync basics, and existing Chisel snippets.
