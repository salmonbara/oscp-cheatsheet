---
title: BloodHound Edges Privilege
type: note
tab: Active Directory
inputs: [Username, Password]
outputs: [Password, Access]
tags: [ActiveDirectory, PrivilegeEscalation, SMB]
---

# BloodHound Edges Privilege

## Focus

- The actual abuse commands now live in [[Privesc]].
- This note is just a reminder of what each common edge usually means.

## Common Edges

- `GenericAll` on group: add yourself or another principal to the target group
- `ForceChangePassword`: reset the target password, then validate access
- `WriteDACL`: grant yourself stronger rights such as DCSync
- `AddMember`: add yourself into a privileged group path

## Next

- Abuse commands: [[Privesc]]
- Validate access and move laterally: [[../Lateral Movement]]
