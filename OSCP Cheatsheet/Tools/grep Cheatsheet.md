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

#Shell #Looting #Linux
Case-insensitive search.

```sh
grep -i "password" file
```

#Shell #Looting #Linux
Show line numbers.

```sh
grep -in "password" file
```

#Shell #Looting #Linux
Recursive password search.

```sh
grep -rin "password" .
```

#Shell #Looting #Linux
Recursive credential keyword search.

```sh
grep -rinE "pass|password|token|secret" .
```

#Shell #Looting #Linux
Search specific file types.

```sh
grep -rin "password" --include="*.php" .
```

#Shell #Looting #Linux
Exclude noisy file types.

```sh
grep -rin "password" --exclude="*.log" .
```

## Useful Patterns

#Shell #Looting #Linux
Search user-related strings.

```sh
grep -rinE "user|username|login" .
```

#Shell #Looting #Linux
Search secrets and API keys.

```sh
grep -rinE "api[_-]?key|token|secret" .
```

#Shell #Looting #Linux
Search command execution functions.

```sh
grep -rinE "exec|system|shell_exec|popen|eval" .
```

#Shell #Looting #Linux
Search socket/network code.

```sh
grep -rinE "socket|connect|bind|listen" .
```

## Output Control

#Shell #Looting #Linux
Show context around a match.

```sh
grep -nC 3 "password" file
```

#Shell #Looting #Linux
Extract emails.

```sh
grep -oE "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+" file
```

#Shell #Looting #Linux
Count matches.

```sh
grep -c "password" file
```

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
