package writeguard

import (
	"strings"
	"testing"

	"plan-manager/internal/models"
)

func TestValidateStatus(t *testing.T) {
	if err := ValidateStatus(models.StatusInProgress); err != nil {
		t.Fatalf("expected status to be valid: %v", err)
	}
	if err := ValidateStatus(models.PlanStatus("blocked")); err == nil {
		t.Fatal("expected unknown status to be rejected")
	}
}

func TestValidateBranchName(t *testing.T) {
	valid := []string{"feature/PM-002-editing", "main", "release/2026.06"}
	for _, branch := range valid {
		if err := ValidateBranchName(branch); err != nil {
			t.Fatalf("expected %q to be valid: %v", branch, err)
		}
	}

	invalid := []string{"", "../main", "feature//bad", "bad branch", "bad..branch", "bad.lock", "bad?branch"}
	for _, branch := range invalid {
		if err := ValidateBranchName(branch); err == nil {
			t.Fatalf("expected %q to be rejected", branch)
		}
	}
}

func TestValidateCommitMessage(t *testing.T) {
	if err := ValidateCommitMessage("PM-002: save plan edits"); err != nil {
		t.Fatalf("expected commit message to be valid: %v", err)
	}
	if err := ValidateCommitMessage("   "); err == nil {
		t.Fatal("expected blank commit message to be rejected")
	}
	if err := ValidateCommitMessage(strings.Repeat("a", 501)); err == nil {
		t.Fatal("expected long commit message to be rejected")
	}
}

func TestValidateServiceName(t *testing.T) {
	valid := []string{"platform", "api-worker", "docs.v2"}
	for _, service := range valid {
		if err := ValidateServiceName(service); err != nil {
			t.Fatalf("expected %q to be valid: %v", service, err)
		}
	}

	invalid := []string{"", "../api", "api/web", "api worker"}
	for _, service := range invalid {
		if err := ValidateServiceName(service); err == nil {
			t.Fatalf("expected %q to be rejected", service)
		}
	}
}

func TestValidateTicketName(t *testing.T) {
	valid := []string{"PM-002", "DI-170", "ABC-202602"}
	for _, ticket := range valid {
		if err := ValidateTicketName(ticket); err != nil {
			t.Fatalf("expected %q to be valid: %v", ticket, err)
		}
	}

	invalid := []string{"", "PM", "002", "PM/002", "../PM-002", "PM 002"}
	for _, ticket := range invalid {
		if err := ValidateTicketName(ticket); err == nil {
			t.Fatalf("expected %q to be rejected", ticket)
		}
	}
}
