---
title: Certification - ADCS
type: note
tab: Active Directory
tools: [certipy, nxc]
inputs: [Username, Password, PFX, Hash]
outputs: [PFX, Hash, DA]
tags: [ActiveDirectory, Enumeration, PrivilegeEscalation, Kerberos]
---

# Certification - ADCS

## Focus

- AD CS enum and exploitation commands are already covered in [[Post_Creds_Enum]] and [[Privesc]].
- This note keeps the attack path readable without duplicating the command blocks again.

## Quick Mental Model

- `certipy find` = discover vulnerable templates / CA issues
- `certipy req` = request a cert that gives you access
- `certipy auth` = turn a PFX into auth material
- `nxc smb ... -H` = quickly validate the recovered hash/access

## Next

- Enumeration step: [[Post_Creds_Enum]]
- Privilege escalation step: [[Privesc]]
