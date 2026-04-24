---
title: BloodHound Analysis
type: note
tab: Active Directory
tools:
  - nxc
  - bloodhound
inputs:
  - Username
  - Password
outputs:
  - Paths
tags:
  - ActiveDirectory
  - Enumeration
---

# BloodHound Analysis

## Focus

- BloodHound collection commands now live in [[Post_Creds_Enum]].
- This note is for what to look at after the data is loaded.

## What To Review

- Shortest path to `Domain Admins`
- Sessions on admin workstations / servers
- Local admin edges on member servers
- ACL abuse paths such as `GenericAll`, `WriteDACL`, `ForceChangePassword`
- Delegation and AD CS shortcuts

## Next

- Collection flow: [[Post_Creds_Enum]]
- Edge abuse: [[Edges Privilege]]
- AD CS abuse: [[Certification - ADCS]]
- Full privesc pathing: [[Privesc]]
