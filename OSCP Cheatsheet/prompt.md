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

- Netcat blind/reverse shells and Bash TCP fallback -> `Payloads/Reverse Shells.md`
- Netcat file transfer to/from target -> `Post-Exploitation/File Transfer.md`
- Hydra SSH, Telnet, and database brute-force examples -> `Initial Access/Online Password Attacks.md`
- LinPEAS download and audit modes -> `Privilege Escalation/Linux Privilege Escalation.md`
- Linux capabilities discovery, dangerous capabilities, Python/Perl/Tar abuse, and OpenSSL engine abuse -> `Privilege Escalation/Linux Privilege Escalation.md`
- `chkrootkit 0.49` cron/root execution abuse -> `Privilege Escalation/Linux Privilege Escalation.md`
- MySQL running as root and MySQL shell command execution -> `Privilege Escalation/Linux Privilege Escalation.md`
- Shadow copy NTDS/SYSTEM collection, SMB exfil, and `impacket-secretsdump -ntds` offline parsing -> `Active Directory/Post_DA.md`
- Golden Ticket flow with `krbtgt` dump, Mimikatz ticket creation, and PsExec usage -> `Active Directory/Post_DA.md`
- DCOM MMC20 remote execution -> `Active Directory/Lateral_Movement.md`
- Pass-the-ticket export/inject/access flow -> `Active Directory/Lateral_Movement.md`
- Overpass-the-hash with Mimikatz and PsExec follow-up -> `Active Directory/Lateral_Movement.md`
- MSSQL `xp_cmdshell` command execution in AD context -> `Active Directory/Lateral_Movement.md`
- Writable `/etc/passwd`, `/etc/shadow`, and `/etc/sudoers` abuse -> `Privilege Escalation/Linux Privilege Escalation.md`
- Basic Linux system enumeration, bash history, pcap credential checks, and SSH key hunting -> `Privilege Escalation/Linux Privilege Escalation.md`
- SSH private key login and `ssh2john` cracking flow -> `Privilege Escalation/Linux Privilege Escalation.md`
- Sudo triage, GTFOBins references, sudo CVE reminders, and `LD_PRELOAD` abuse -> `Privilege Escalation/Linux Privilege Escalation.md`
- SUID/SGID discovery, PATH hijack, `systemctl`, and `cp` examples -> `Privilege Escalation/Linux Privilege Escalation.md`
- Cron writable script/file overwrite and tar wildcard checkpoint abuse -> `Privilege Escalation/Linux Privilege Escalation.md`
- Kernel exploit last-resort checklist -> `Privilege Escalation/Linux Privilege Escalation.md`
- `icacls "C:\xampp\mysql\bin\mysqld.exe"` and the SeShutdownPriv binary hijack flow -> `Privilege Escalation/Windows Privilege Escalation.md`
- Hydra SSH / HTTP GET / HTTP POST login attacks -> `Initial Access/Online Password Attacks.md`
- Hash mutation rules, custom John rules, and Kerberoast rule-based cracking -> `Credentials/Hash Crack.md`
- BloodHound collection / GUI launch / PowerView commands -> `Active Directory/Post_Creds_Enum.md`
- Responder capture and NTLM relay flow -> `Active Directory/Initial_Access.md`
- psexec with password, subnet reuse checks, RDP enable, secretsdump with hash, lsassy/nanodump sweeps -> `Active Directory/Lateral_Movement.md`
- NetExec `--ntds` variants, NTDS log filtering, and Silver Ticket flow -> `Active Directory/Post_DA.md`
- SAM/SYSTEM save + SMB exfil + Mimikatz SAM/LSASS dumping -> `Post-Exploitation/Windows Post-Exploitation.md`
- SigmaPotato add-user flow -> covered already in `Tools/Potato Family.md`
- Net-NTLMv2 cracking -> covered already in `Credentials/Hash Crack.md`
- Kerberoast service-account dump basics -> covered already in `Active Directory/Post_Creds_Enum.md`
