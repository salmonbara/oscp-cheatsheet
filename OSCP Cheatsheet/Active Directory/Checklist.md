---
title: AD Checklist
type: checklist
tab: Active Directory
tags: [ActiveDirectory]
---

# AD Checklist

- [ ] Identify DC and domain: [[Recon]]
- [ ] Scan AD ports: [[Recon]]
- [ ] Try null SMB/RPC enum: [[Recon]], [[Active Directory/Enumeration/SMB Enum]]
- [ ] Build username list: [[Active Directory/Enumeration/LDAP Enum]], [[Active Directory/Enumeration/SMB Enum]]
- [ ] Try ASREPRoast: [[Initial_Access]]
- [ ] Check password policy before spray: [[Initial_Access]]
- [ ] Kerberoast after valid creds: [[Post_Creds_Enum]]
- [ ] Collect BloodHound: [[Post_Creds_Enum]]
- [ ] Check AD CS: [[Bloodhound/Certification - ADCS]]
- [ ] Test lateral movement: [[Lateral_Movement]]
- [ ] Abuse privesc path: [[Privesc]]
- [ ] Post-DA dumping/persistence: [[Post_DA]]
