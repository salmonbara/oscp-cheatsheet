---
title: grep Cheatsheet
type: tool-note
tab: Tools
tools: [grep]
inputs: [Shell]
outputs: [Files, Credentials, Secrets]
tags: [Looting, Linux]
---

# grep

## Search

### Grep Case-Insensitive Search

#Shell #Looting #Linux
Case-insensitive search.

```sh
grep -i "password" file
```

### Grep Show Line Numbers

#Shell #Looting #Linux
Show line numbers.

```sh
grep -in "password" file
```

### Grep Recursive Password Search

#Shell #Looting #Linux
Recursive password search.

```sh
grep -rin "password" .
```

### Grep Recursive Credential Keywords

#Shell #Looting #Linux
Recursive credential keyword search.

```sh
grep -rinE "pass|password|token|secret" .
```

### Grep Include File Type

#Shell #Looting #Linux
Search specific file types.

```sh
grep -rin "password" --include="*.php" .
```

### Grep Exclude File Type

#Shell #Looting #Linux
Exclude noisy file types.

```sh
grep -rin "password" --exclude="*.log" .
```

## Useful Patterns

### Grep Pattern - User Strings

#Shell #Looting #Linux
Search user-related strings.

```sh
grep -rinE "user|username|login" .
```

### Grep Pattern - Secrets And API Keys

#Shell #Looting #Linux
Search secrets and API keys.

```sh
grep -rinE "api[_-]?key|token|secret" .
```

### Grep Pattern - Command Execution

#Shell #Looting #Linux
Search command execution functions.

```sh
grep -rinE "exec|system|shell_exec|popen|eval" .
```

### Grep Pattern - Socket And Network Code

#Shell #Looting #Linux
Search socket/network code.

```sh
grep -rinE "socket|connect|bind|listen" .
```

## Output Control

### Grep Context Around Match

#Shell #Looting #Linux
Show context around a match.

```sh
grep -nC 3 "password" file
```

### Grep Extract Emails

#Shell #Looting #Linux
Extract emails.

```sh
grep -oE "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+" file
```

### Grep Count Matches

#Shell #Looting #Linux
Count matches.

```sh
grep -c "password" file
```

### Grep Common Loot Search

#Shell #Looting #Linux
Quick loot search on common directories.

```sh
grep -rinE "pass|password|token" /home /var/www /etc 2>/dev/null
```

## Flags

```text
-r recursive
-i case-insensitive
-n show line number
-E extended regex
```
