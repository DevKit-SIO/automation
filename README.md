<div align="center">

![Unitalk](images/default-avatar-transparent.png)

# Unitalk N8N Automation Templates

[![][github-release-shield]][github-release-link]
[![][github-main-check-shield]][github-main-check-link]
[![][github-version-shield]][github-main-check-link]

This library was created using `Bun`, to start importing N8N automation Templates.<br/>
To start using this library you need to install [Bun](https://bun.com)
</div>

To install `Bun`, you can use the command below for Linux and Mac or visit there website

```bash
curl -fsSL https://bun.sh/install | bash
```

## Install dependencies

```bash
bun install
```

## Show help form this script:

- `rsync` command:

```bash
bun run rsync -h
```

## Importing automation Templates

- To start importing Automations: 

```bash
bun run rsync
```

- To start importing Automation with translations:

```bash
bun run rsync -t
```

- To restart importing all Automations with translations:

```bash
bun run rsync -r -t
```

## Run local server

```bash
bun run start
```

[github-release-link]: https://github.com/unitalkai/automation/releases
[github-release-shield]: https://img.shields.io/github/v/release/unitalkai/automation?color=369eff&labelColor=black&logo=github&style=flat-square
[github-main-check-link]: https://github.com/unitalkai/automation
[github-main-check-shield]: https://img.shields.io/github/check-runs/unitalkai/automation/main
[github-version-shield]: https://img.shields.io/badge/1.0.0?style=flat-square&label=version&labelColor=red&color=bleu
