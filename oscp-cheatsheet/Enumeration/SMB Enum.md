---
title: SMB Enum
type: note
tab: Enum
services: [SMB, RPC]
tools: [nxc, smbclient, rpcclient]
inputs: [Username, Password]
outputs: [Shares, Users, Groups, PasswordPolicy]
tags: [SMB, RPC, ActiveDirectory, Enumeration]
---

# SMB Enum

## Purpose

- Use this when SMB on a DC or domain member looks relevant and you want the AD-specific path.
- The actual command flow now lives under [[../Active Directory/Enumeration/SMB Enum]] and [[Services/135, 445 - SMB]].

## What To Check

- Null session / anonymous share access
- SYSVOL access
- User and group enumeration
- Password policy
- RPC lookups

## Next

- AD-focused SMB commands: [[../Active Directory/Enumeration/SMB Enum]]
- Service-level SMB workflow: [[Services/135, 445 - SMB]]
- If you have creds already: [[../Active Directory/Post-Creds Enum]]
