class PlanManager < Formula
  desc "Local-first planning and docs workflow tool"
  homepage "https://github.com/kriskhoavu/plan-manager"
  version "1.0.0"

  if OS.mac? && Hardware::CPU.arm?
    url "https://github.com/kriskhoavu/plan-manager/releases/download/v#{version}/plan-manager_#{version}_darwin_arm64.tar.gz"
    sha256 "REPLACE_DARWIN_ARM64_SHA256"
  elsif OS.mac? && Hardware::CPU.intel?
    url "https://github.com/kriskhoavu/plan-manager/releases/download/v#{version}/plan-manager_#{version}_darwin_amd64.tar.gz"
    sha256 "REPLACE_DARWIN_AMD64_SHA256"
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
