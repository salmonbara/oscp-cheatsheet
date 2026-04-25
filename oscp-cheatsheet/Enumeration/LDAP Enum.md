---
title: LDAP Enum
type: note
tab: Enum
services: [LDAP]
tools: [nxc, impacket]
inputs: [Username, Password]
outputs: [Users, Groups, Hash]
tags: [LDAP, Kerberos, ActiveDirectory, Enumeration]
---

# LDAP Enum

## Purpose

- Use this when you identify LDAP and want the AD-specific workflow quickly.
- The actual LDAP command flow now lives under [[../Active Directory/Enumeration/LDAP Enum]].

## What To Check

- Anonymous bind allowed or not
- Authenticated user/group enumeration
- ASREPRoast opportunities
- Kerberoast opportunities

## Next

- Need the command flow: [[../Active Directory/Enumeration/LDAP Enum]]
- Need wider domain workflow: [[../Active Directory/Post-Creds Enum]]
- Need first credential path: [[../Active Directory/Initial Access]]
