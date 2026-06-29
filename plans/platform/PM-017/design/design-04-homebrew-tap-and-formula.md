# Design: Homebrew Tap And Formula Playbook

## Overview

This document defines the v1 Homebrew distribution model for Plan Manager and provides a formula template plus operational checklist for updates and rollback.

## Tap Model

| Item | Value |
|------|-------|
| Tap repository | `<org>/homebrew-tap` |
| Formula file | `Formula/plan-manager.rb` |
| Artifact source | GitHub Releases from `plan-manager` repository |
| Verification | `sha256` from `SHA256SUMS` release asset |

## Formula Template

```ruby
class PlanManager < Formula
  desc "Local-first planning and docs workflow tool"
  homepage "https://github.com/<org>/plan-manager"
  version "1.0.0"

  if OS.mac? && Hardware::CPU.arm?
    url "https://github.com/<org>/plan-manager/releases/download/v#{version}/plan-manager_#{version}_darwin_arm64.tar.gz"
    sha256 "<DARWIN_ARM64_SHA256>"
  elsif OS.mac? && Hardware::CPU.intel?
    url "https://github.com/<org>/plan-manager/releases/download/v#{version}/plan-manager_#{version}_darwin_amd64.tar.gz"
    sha256 "<DARWIN_AMD64_SHA256>"
  else
    odie "plan-manager Homebrew formula currently supports macOS only"
  end

  def install
    bin.install "plan-manager"
  end

  test do
    output = shell_output("#{bin}/plan-manager 2>&1", 2)
    assert_match "Usage", output
  end
end
```

## Release Update Checklist

1. Ensure GitHub release exists with macOS artifacts and `SHA256SUMS`.
2. Extract new darwin `sha256` values from `SHA256SUMS`.
3. Update `version`, `url`, and `sha256` fields in formula.
4. Run local checks:
   - `brew tap <org>/homebrew-tap`
   - `brew install plan-manager`
   - `brew test plan-manager`
5. Validate upgrade path from previous version:
   - `brew upgrade plan-manager`
6. Merge tap PR and verify install on clean machine.

## Rollback Checklist

1. Keep previous release binaries available on GitHub Releases.
2. Revert tap formula to last known-good version and checksums.
3. Communicate rollback command:
   - `brew pin plan-manager`
   - optionally `brew extract` for version pinning in private tap.
4. Publish incident note with root cause and fixed target version.

## Operational Notes

- Do not replace artifacts for an existing version tag; always publish a new patch version.
- Keep formula changes atomic: version bump and checksum update in one commit.
- Keep install docs synchronized with actual tap path and formula name.
