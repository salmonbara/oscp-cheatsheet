---
title: AD Recon
type: note
tab: Active Directory
inputs: []
outputs: [Domain, DC, NamingContext, Ports]
tags: [ActiveDirectory, Enumeration]
---

# AD Recon

## WHY

Find domain name, DC IP, AD ports, and naming context before valid creds.

## WHEN

- You see ports `88`, `389`, `445`, `464`, `593`, `636`, `3268`, or `5985`.
- Host looks like a DC or Windows domain member.

## NEXT

- Username list found: go to [[Initial Access]].
- Valid creds found: go to [[Post-Creds Enum]].

## Commands

### DC Discovery

### DC Discovery With Dig

#DNS #ActiveDirectory #Enumeration
Find domain controllers via DNS SRV.

```sh
dig SRV _ldap._tcp.dc._msdcs.<DOMAIN> @<DNS_IP>
```

### DC Discovery With Nslookup

#DNS #ActiveDirectory #Enumeration
Find domain controllers with nslookup.

```cmd
nslookup -type=SRV _ldap._tcp.dc._msdcs.<DOMAIN>
nslookup -type=SRV _ldap._tcp.pdc._msdcs.<DOMAIN> <DNS_IP>
```

### Port Scan

### AD Common Port Scan

#ActiveDirectory #Enumeration
Check common AD ports.

```sh
nmap -Pn -sV -p 53,88,135,139,389,445,464,593,636,3268,3269,5985 <DC_IP>
```

### AD Full Port Scan

#ActiveDirectory #Enumeration
Run full AD-focused scan.

```sh
nmap -Pn -sC -sV -p- <DC_IP> -oN nmap/ad-full
```

### LDAP RootDSE

#LDAP #ActiveDirectory #Enumeration
Pull RootDSE naming context without creds.

```sh
ldapsearch -x -H ldap://<DC_IP> -s base namingcontexts
```

### SMB Null Session

#SMB #ActiveDirectory #Enumeration
Try SMB null session.

```sh
nxc smb <DC_IP> -u '' -p ''
```

## Key Notes

- DNS can reveal the domain even when LDAP anonymous bind is blocked.
- If anonymous SMB/RPC works, immediately build a user list and check SYSVOL.
