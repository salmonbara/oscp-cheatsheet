---
title: AD SMB Enum
type: note
tab: Active Directory
services: [SMB, RPC]
tools: [nxc, smbclient, rpcclient]
inputs: [Username, Password]
outputs: [Shares, Users, Groups, PasswordPolicy]
tags: [ActiveDirectory, SMB, RPC, Enumeration]
---

# AD SMB Enum

#SMB #ActiveDirectory #Enumeration
Test SMB null session.

```sh
nxc smb <DC_IP> -u '' -p ''
```

#SMB #ActiveDirectory #Enumeration
List shares with null session.

```sh
nxc smb <DC_IP> -u '' -p '' --shares
```

#Username #Password #SMB #ActiveDirectory #Enumeration
List shares with credentials.

```sh
nxc smb <DC_IP> -u <USER> -p '<PASS>' --shares
```

#Username #Password #SMB #ActiveDirectory #Enumeration
Access SYSVOL.

```sh
smbclient //<DC_IP>/SYSVOL -U "<DOMAIN>\\<USER>%<PASS>"
```

#Username #Password #SMB #ActiveDirectory #Enumeration
Enumerate users.

```sh
nxc smb <DC_IP> -u <USER> -p '<PASS>' --users
```

#Username #Password #SMB #ActiveDirectory #Enumeration
Enumerate groups.

```sh
nxc smb <DC_IP> -u <USER> -p '<PASS>' --groups
```

#Username #Password #SMB #ActiveDirectory #Enumeration
Check password policy.

```sh
nxc smb <DC_IP> -u <USER> -p '<PASS>' --pass-pol
```

#Username #Password #RPC #ActiveDirectory #Enumeration
Query a specific user by RID.

```sh
rpcclient -U "<USER>%<PASS>" <DC_IP> -c "queryuser 0x1f4"
```

#Username #Password #RPC #ActiveDirectory #Enumeration
Enumerate local groups.

```sh
rpcclient -U "<USER>%<PASS>" <DC_IP> -c "enumalsgroups domain"
```
