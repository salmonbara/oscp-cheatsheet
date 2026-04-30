---
title: BloodHound Edges Privilege
type: note
tab: Active Directory
hidden: true
inputs: [Username, Password]
outputs: [Password, Access]
tags: [ActiveDirectory, PrivilegeEscalation, SMB]
---

# BloodHound Edges Privilege

## Focus

- This page is hidden from the web note list to reduce AD page noise.
- The actual abuse commands now live in [[../Privesc|AD Privesc To DA]].
- The same quick reminder now lives in [[BloodHound Analysis]] under `Edge Cheat Sheet`.

## Common Edges

- `GenericAll` on group: add yourself or another principal to the target group
- `ForceChangePassword`: reset the target password, then validate access
- `WriteDACL`: grant yourself stronger rights such as DCSync
- `AddMember`: add yourself into a privileged group path

## Next

- Abuse commands: [[../Privesc|AD Privesc To DA]]
- Validate access and move laterally: [[../Lateral Movement]]
