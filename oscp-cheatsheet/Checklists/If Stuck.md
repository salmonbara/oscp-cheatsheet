---
title: If Stuck
type: checklist
tab: Checklists
tags: [Troubleshooting, Checklist]
---

# If Stuck

## Fast Reroute

- [ ] Re-check enum notes: [[../Enumeration/00_Index]]
- [ ] Look for default creds or password guessing paths: [[../Initial Access/00_Index]]
- [ ] Revisit credentials and hashes: [[../Credentials/00_Index]]
- [ ] If you have a shell, move through post-exploitation and privesc: [[../Post-Exploitation/00_Index]], [[../Privilege Escalation/00_Index]]
- [ ] If AD ports are present, follow the AD flow: [[../Active Directory/00_Index]]

## General Reset

- [ ] Search every non-standard app, permission, group, or version with `searchsploit` and web search.
- [ ] Enumerate users again.
- [ ] Crack every collected hash.
- [ ] Re-test credential reuse carefully after checking lockout risk.

## AD Privesc / Post-Exploitation

- [ ] If BloodHound or normal AD tooling is blocked, go back to basic Windows privesc.
- [ ] Re-check service binary hijacking.
- [ ] Re-check DLL hijacking.
- [ ] Search `ProgramData` and application folders for hidden credentials.
- [ ] Check registry autoruns.
- [ ] Check scheduled tasks.

## Standalone Exploit Failed

- [ ] Confirm architecture: x86 vs x64.
- [ ] Confirm exact target OS and service version.
- [ ] Re-check shellcode, payload type, bad characters, and callback IP/port.
- [ ] Review exploit notes and required offsets/options.
- [ ] Try small exploit tweaks before abandoning the path.

## Standalone Privesc Failed

- [ ] If several vectors look promising but none work, assume enumeration is incomplete.
- [ ] Re-run automated enum.
- [ ] Manually review findings you previously dismissed as low value.
- [ ] Run Windows privesc checks in this order when applicable: `PowerUp.ps1 -> SharpUp.exe -> winPEAS`.
```sh
"/usr/bin/at" "privilege escalation"
site:medium.com "/usr/bin/backup"
"/usr/bin/backup" "walkthrough"
```

## 📚 Top OSCP Resources

- **Official PEN-200 Course:** https://www.offsec.com/courses/pen-200/
- **HackTricks:** https://book.hacktricks.xyz
- **GTFOBins (Linux LPE):** https://gtfobins.github.io
- **LOLBAS (Windows LPE):** https://lolbas-project.github.io
- **Revshells Generator:** https://www.revshells.com
- **PayloadsAllTheThings:** https://github.com/swisskyrepo/PayloadsAllTheThings
- **CyberChef (encode/decode):** https://gchq.github.io/CyberChef
- **ExploitDB:** https://www.exploit-db.com
- **ired.team:** https://www.ired.team
- **0xdf HTB writeups:** https://0xdf.gitlab.io