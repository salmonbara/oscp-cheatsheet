---
title: If Stuck
type: note
tags: [Troubleshooting]
---

# If Stuck

- Re-check enum notes: [[Enumeration/00_Index]]
- Look for default creds or password guessing paths: [[Initial Access/00_Index]]
- Revisit credentials and hashes: [[Credentials/00_Index]]
- If you have a shell, move through post-exploitation and privesc: [[Post-Exploitation/00_Index]], [[Privilege Escalation/00_Index]]
- If AD ports are present, follow the AD flow: [[Active Directory/00_Index]]

trip
- Google when this fails.
- Enumerate users, crack every hash, spray credentials.
- `searchsploit` every non-standard app, permission, or group that you find.

if stuck on AD Privilege Escalation & Post-Exploitation
```
ถ้า BloodHound หรือ tools ปกติใช้ไม่ได้ → กลับไปโฟกัสพื้นฐาน Windows privesc  

เทคนิคที่มักถูกมองข้ามแต่เจอบ่อย:  
	- Service Binary Hijacking  
	- DLL Hijacking  
	- Credentials ซ่อนใน ProgramData  
	- Registry Autoruns  
	- Scheduled Tasks  
```

if stuck on Standalone Exploit failed
```
ReCheck:  
	- Architecture (x86/x64)  
	- OS version ของ target  
	- การแก้/ฝัง shellcode ถูกต้องไหม  
- บ่อยครั้งเป็นแค่ tweak เล็ก ๆ ที่ทำให้ exploit ใช้งานได้
```

if stuck on Standalone Privilege Escalation
```
- ถ้ามีหลาย vector ดู promising แต่ exploit ไม่ได้:  
	→ แปลว่ายัง enum ไม่ครบ  
- วิธีแก้:  
	- กลับไป enumerate ใหม่ทั้งหมด  
	- ดูสิ่งที่เคยมองข้ามหรือคิดว่าไม่สำคัญอีกครั้ง
```


step to check
```
powerup.ps1 -> sharpup.exe -> winpeas
```