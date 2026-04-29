---
title: Blacklog
type: inbox
tags: [Inbox, Triage]
---

# Blacklog

Older raw backlog items are cleared after triage. Add new rough commands or method notes below if they should be reviewed later.

## Pending

<!-- Add rough backlog items below this line. -->

## Moved

### 2026-04-29

- Winlogon AutoLogon credential check -> `Privilege Escalation/Windows Privilege Escalation.md` under `Winlogon Saved Credentials`.
- PowerView user-description credential hunting -> `Active Directory/Post-Creds Enum.md` under `PowerView`.
- NetExec relay target-list generation -> `Active Directory/Initial Access.md` under `NTLM Relay With SMB Signing Disabled`.
- Silver Ticket prep commands for SID lookup and service-account hash discovery -> `Active Directory/Post-DA.md` under `Silver Tickets`.
- LAPS installed check, LDAP `ms-Mcs-AdmPwd` query, and recovered local admin validation with example output -> `Active Directory/Post-Creds Enum.md` under `LAPS Query`.

## Skipped / Already Covered

- Linux initial enumeration, sudo, SUID/SGID, capabilities, writable paths, cron, pspy, Docker, kernel checks, and memory trick are already covered in `Privilege Escalation/Linux Privilege Escalation.md`.
- Linux cron persistence is already covered in `Post-Exploitation/Persistence.md`.
- Windows quick checks, AlwaysInstallElevated, unquoted service paths, UAC/Fodhelper, add local admin, audit scripts, accesschk, and service hijack paths are already covered in `Privilege Escalation/Windows Privilege Escalation.md`.
- Windows local MySQL with empty root password is already covered in `Post-Exploitation/Windows Post-Exploitation.md` under `Local Databases`.
- Windows SAM/SYSTEM dumping and Mimikatz SAM dumping are already covered in `Post-Exploitation/Windows Post-Exploitation.md` under `Credential Dumping`.
- Mimikatz overpass-the-hash is already covered in `Active Directory/Lateral Movement.md`.
- Kerberoasting, AS-REP roasting, AD CS ESC1, and NTLM relay execution are already covered in Active Directory notes.
