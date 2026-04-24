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

## NTLM Family

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

#Hash #Crack #Windows
Crack other Windows-oriented hashes.

```sh
# MSCache v2
hashcat -m 2100 -a 0 hash.txt <WORDLIST>

# SCCM PXE
hashcat -m 19850 -a 0 hash.txt <WORDLIST>
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
