---
title: 22 - SSH
type: service
tab: Services
ports: [22]
service: SSH
tools: [nmap, nxc, ssh, ssh2john, john]
inputs: [Username, Password, PrivateKey, Hash]
outputs: [Banner, AuthMethods, Shell, Hash]
tags: [SSH, Enumeration, Exploitation]
---

# 22 - SSH

`22/tcp open ssh`

## Commands

### Nmap

#SSH #Enumeration
Quick SSH enumeration reference.

```sh
# Find SSH-related Nmap scripts.
ls -lh /usr/share/nmap/scripts/ | grep ssh

# Enumerate SSH host keys.
nmap <TARGET_IP> -p 22 -sV --script ssh-hostkey --script-args ssh_hostkey=full

# Check SSH auth methods for a known user.
nmap <TARGET_IP> -p 22 -sV --script ssh-auth-methods --script-args="ssh.user=<USER>"
```

### NetExec

#Username #Password #SSH #Enumeration
Test SSH credentials and run a command without brute forcing.

```sh
nxc ssh <TARGET_IP> -u <USER> -p '<PASS>' --no-bruteforce
nxc ssh <TARGET_IP> -u <USER> -p '<PASS>' --no-bruteforce -x whoami
```

### Private Key Login

#Username #PrivateKey #SSH #Exploitation
Fix key permissions and log in with a private key.

```sh
chmod 600 id_rsa
ssh -i id_rsa <USER>@<TARGET_IP>
ssh -i id_rsa -p <PORT> <USER>@<TARGET_IP>
```

### Private Key Crack

#PrivateKey #Crack
Convert a protected SSH private key to a John hash and crack it.

```sh
ssh2john id_rsa > id_rsa.hash
john id_rsa.hash --wordlist=/usr/share/wordlists/rockyou.txt
```
