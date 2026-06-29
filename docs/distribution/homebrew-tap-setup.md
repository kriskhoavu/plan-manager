# Homebrew Tap Setup

Use this playbook to create and maintain the tap repository for Plan Manager.

## 1) Create the tap repository

```bash
gh repo create kriskhoavu/homebrew-tap --public --description "Homebrew tap for plan-manager"
```

## 2) Initialize tap structure

```bash
git clone https://github.com/kriskhoavu/homebrew-tap.git
mkdir -p homebrew-tap/Formula
cp packaging/homebrew/Formula/plan-manager.rb homebrew-tap/Formula/plan-manager.rb
```

## 3) Fill version and checksums for a release

From the `plan-manager` release, copy checksums from `SHA256SUMS`:

- `plan-manager_<version>_darwin_arm64.tar.gz`
- `plan-manager_<version>_darwin_amd64.tar.gz`

Then update `homebrew-tap/Formula/plan-manager.rb`:

- `version "<version>"`
- `REPLACE_DARWIN_ARM64_SHA256`
- `REPLACE_DARWIN_AMD64_SHA256`

## 4) Publish the tap update

```bash
git -C homebrew-tap add Formula/plan-manager.rb
git -C homebrew-tap commit -m "plan-manager: update to v<version>"
git -C homebrew-tap push
```

## 5) Validate installation

```bash
brew tap kriskhoavu/homebrew-tap
brew install plan-manager
plan-manager doctor
brew upgrade plan-manager
```
