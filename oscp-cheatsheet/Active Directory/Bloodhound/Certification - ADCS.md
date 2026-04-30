---
title: Certification - ADCS
type: note
tab: Active Directory
hidden: true
tools: [certipy, nxc]
inputs: [Username, Password, PFX, Hash]
outputs: [PFX, Hash, DA]
tags: [ActiveDirectory, Enumeration, PrivilegeEscalation, Kerberos]
---

# Certification - ADCS

## Focus

- This page is hidden from the web note list to reduce AD page noise.
- AD CS enum and exploitation commands are already covered in [[../Post-Creds Enum]] and [[../Privesc]].
- The quick mental model now lives in [[BloodHound Analysis]] under `AD CS Review`.

## Quick Mental Model

- `certipy find` = discover vulnerable templates / CA issues
- `certipy req` = request a cert that gives you access
- `certipy auth` = turn a PFX into auth material
- `nxc smb ... -H` = quickly validate the recovered hash/access

## Next

- Enumeration step: [[../Post-Creds Enum]]
- Privilege escalation step: [[../Privesc|AD Privesc To DA]]
