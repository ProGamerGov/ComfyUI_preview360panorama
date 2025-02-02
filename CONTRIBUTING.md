# Contributing to ComfyUI_preview360panorama

This project uses simple linting guidelines, as you'll see below.

## Linting


Linting is simple to perform.

```
pip install black flake8 mypy ufmt

```

Linting:

```
cd ComfyUI_preview360panorama
black .
ufmt format .
cd ..
```

Checking:

```
cd ComfyUI_preview360panorama
black --check --diff .
flake8 . --ignore=E203,W503 --max-line-length=88 --exclude build,dist
ufmt check .
mypy . --ignore-missing-imports --allow-redefinition --explicit-package-bases
cd ..
```
