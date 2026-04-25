---
title: AD Attack Methodology
type: methodology
tab: Active Directory
tags: [ActiveDirectory, Enumeration, Exploitation, PrivilegeEscalation]
---

# AD Attack Methodology

## Attack Flow

```text
AD ports open? 88 / 389 / 445 / 5985
  -> [[01_Recon]]
  -> [[02_Initial_Access]]
  -> got creds?
  -> [[03_Post_Creds_Enum]]
  -> got path?
  -> [[04_Lateral_Movement]] <-> [[05_Privesc]]
  -> got DA?
  -> [[06_Post_DA]]
```

## 12-Step Checklist

- [ ] 1. Scan AD ports: 88, 389, 445, 5985.
- [ ] 2. Try ASREPRoast when username list exists.
- [ ] 3. Try SMB/RPC null session.
- [ ] 4. Check SYSVOL for GPP passwords.
- [ ] 5. Check password policy before spraying.
- [ ] 6. Kerberoast after valid creds.
- [ ] 7. Collect BloodHound data.
- [ ] 8. Check AD CS with certipy.
- [ ] 9. Test lateral movement: SMB, WinRM, PTH.
- [ ] 10. Dump creds when local admin.
- [ ] 11. Abuse BloodHound paths.
- [ ] 12. DCSync or dump NTDS after DA.

## Decision Tree

- Ports `88 + 389 + 445` open: start AD recon and ASREPRoast path.
- Null SMB/RPC works: list shares, users, SYSVOL.
- Username list found: ASREPRoast and safe password spray.
- First creds found: BloodHound, Kerberoast, LDAP/SMB enum.
- Local admin found: dump SAM/LSASS, then lateral movement.
- BloodHound path found: abuse edge in [[Privesc]].
- AD CS vulnerable: use ESC path in [[Bloodhound/Certification - ADCS]].
- DA achieved: run [[Post_DA]].

## Gotchas

- Check password policy before spraying: `nxc smb <DC_IP> -u <USER> -p '<PASS>' --pass-pol`.
- ASREPRoast does not require valid creds, but needs a username list.
- BloodHound usually needs valid creds.
- Treat lockout threshold as dangerous until verified.
