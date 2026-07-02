package aisession

import (
	"errors"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"plan-manager/internal/aisettings"
	"plan-manager/internal/audit"
	"plan-manager/internal/gitadapter"
	"plan-manager/internal/itemindex"
	"plan-manager/internal/models"
	"plan-manager/internal/registry"
)

type recordedProcess struct {
	name string
	args []string
	dir  string
}

type recordingRunner struct {
	processes []recordedProcess
	err       error
}

func (r *recordingRunner) Start(name string, args []string, dir string) error {
	r.processes = append(r.processes, recordedProcess{name: name, args: append([]string(nil), args...), dir: dir})
	return r.err
}

func TestLaunchCreatesPrivateManifestAndStartsProviderInWorkspace(t *testing.T) {
	service, item, workspace, runner, contextDir, auditStore := launchTestService(t, true)
	eligibility, err := service.Eligibility(item.ID)
	if err != nil || !eligibility.Editable || !eligibility.CardContextAvailable || len(eligibility.Missing) != 0 {
		t.Fatalf("eligibility=%#v err=%v", eligibility, err)
	}
	result, err := service.Launch(item.ID, LaunchInput{Provider: "test-ai", Terminal: "wezterm", ContextMode: "card_context"})
	if err != nil {
		t.Fatal(err)
	}
	if !result.Accepted || result.ContextMode != "card_context" || len(runner.processes) != 1 {
		t.Fatalf("result=%#v processes=%#v", result, runner.processes)
	}
	process := runner.processes[0]
	if process.dir != workspace.Path || len(process.args) < 7 || process.args[0] != "start" || process.args[1] != "--cwd" {
		t.Fatalf("process = %#v", process)
	}
	entries, err := os.ReadDir(contextDir)
	if err != nil {
		t.Fatal(err)
	}
	var manifestPath string
	for _, entry := range entries {
		if strings.HasSuffix(entry.Name(), ".md") {
			manifestPath = filepath.Join(contextDir, entry.Name())
		}
	}
	data, err := os.ReadFile(manifestPath)
	if err != nil {
		t.Fatal(err)
	}
	text := string(data)
	if !strings.Contains(text, "wait for the user's request") || !strings.Contains(text, filepath.Join(workspace.Path, item.ItemPath, "implementation-plan.md")) || strings.Contains(text, "Intent:") {
		t.Fatalf("manifest = %s", text)
	}
	info, err := os.Stat(manifestPath)
	if err != nil || info.Mode().Perm() != 0o600 {
		t.Fatalf("manifest mode=%v err=%v", info.Mode().Perm(), err)
	}
	events, err := auditStore.Recent(10)
	if err != nil || len(events) != 1 || events[0].Status != models.AuditStatusSuccess || len(events[0].Paths) != 0 {
		t.Fatalf("events=%#v err=%v", events, err)
	}
}

func TestCardContextDoesNotRequireStructuredPlan(t *testing.T) {
	service, item, _, runner, _, auditStore := launchTestService(t, false)
	eligibility, eligibilityErr := service.Eligibility(item.ID)
	if eligibilityErr != nil || !eligibility.CardContextAvailable || len(eligibility.Missing) != 0 {
		t.Fatalf("eligibility=%#v err=%v", eligibility, eligibilityErr)
	}
	result, err := service.Launch(item.ID, LaunchInput{Provider: "test-ai", Terminal: "wezterm", ContextMode: "card_context"})
	if err != nil || !result.Accepted || len(runner.processes) != 1 {
		t.Fatalf("result=%#v processes=%#v err=%v", result, runner.processes, err)
	}
	events, _ := auditStore.Recent(10)
	if len(events) != 1 || events[0].Status != models.AuditStatusSuccess {
		t.Fatalf("events = %#v", events)
	}
}

func TestLaunchRejectsSnapshotAndMissingTools(t *testing.T) {
	service, item, _, runner, _, _ := launchTestService(t, true)
	item.SourceMode = "snapshot"
	if err := service.launch.index.ReplaceWorkspace(item.WorkspaceID, []models.ItemDetail{item}, nil, time.Now()); err != nil {
		t.Fatal(err)
	}
	_, err := service.Launch(item.ID, LaunchInput{Provider: "test-ai", Terminal: "wezterm", ContextMode: "card_context"})
	var launchErr *LaunchError
	if !errors.As(err, &launchErr) || launchErr.Code != "item_not_editable" || len(runner.processes) != 0 {
		t.Fatalf("err=%#v processes=%#v", err, runner.processes)
	}
}

func TestWorkspaceOnlyLaunchesWithoutCardContext(t *testing.T) {
	service, item, workspace, runner, contextDir, _ := launchTestService(t, true)
	item.SourceMode = "snapshot"
	item.Editable = false
	if err := service.launch.index.ReplaceWorkspace(item.WorkspaceID, []models.ItemDetail{item}, nil, time.Now()); err != nil {
		t.Fatal(err)
	}
	result, err := service.Launch(item.ID, LaunchInput{Provider: "test-ai", Terminal: "wezterm", ContextMode: "workspace_only"})
	if err != nil || !result.Accepted || result.ContextMode != "workspace_only" {
		t.Fatalf("result=%#v err=%v", result, err)
	}
	if len(runner.processes) != 1 {
		t.Fatalf("processes=%#v", runner.processes)
	}
	process := runner.processes[0]
	if process.dir != workspace.Path || len(process.args) != 5 || process.args[0] != "start" || process.args[4] == "" {
		t.Fatalf("process=%#v", process)
	}
	if _, err := os.Stat(contextDir); !os.IsNotExist(err) {
		t.Fatalf("free prompt created context directory: %v", err)
	}
}

func TestLaunchFailureIsAuditedAsFailed(t *testing.T) {
	service, item, _, runner, _, auditStore := launchTestService(t, true)
	runner.err = errors.New("terminal refused launch")
	_, err := service.Launch(item.ID, LaunchInput{Provider: "test-ai", Terminal: "wezterm", ContextMode: "card_context"})
	var launchErr *LaunchError
	if !errors.As(err, &launchErr) || launchErr.Code != "launch_failed" {
		t.Fatalf("err = %#v", err)
	}
	events, readErr := auditStore.Recent(10)
	if readErr != nil || len(events) != 1 || events[0].Status != models.AuditStatusFailed {
		t.Fatalf("events=%#v err=%v", events, readErr)
	}
}

func TestShellQuoteKeepsCommandTextLiteral(t *testing.T) {
	value := `a' b; $(touch unsafe)`
	quoted := shellQuote(value)
	if quoted != `'a'"'"' b; $(touch unsafe)'` {
		t.Fatalf("quoted = %q", quoted)
	}
}

func TestCleanupExpiredRemovesOldContextOnly(t *testing.T) {
	dir := t.TempDir()
	oldPath := filepath.Join(dir, "old.md")
	newPath := filepath.Join(dir, "new.md")
	for _, path := range []string{oldPath, newPath} {
		if err := os.WriteFile(path, []byte("x"), 0o600); err != nil {
			t.Fatal(err)
		}
	}
	now := time.Now()
	if err := os.Chtimes(oldPath, now.Add(-25*time.Hour), now.Add(-25*time.Hour)); err != nil {
		t.Fatal(err)
	}
	if err := cleanupExpired(dir, now); err != nil {
		t.Fatal(err)
	}
	if _, err := os.Stat(oldPath); !os.IsNotExist(err) {
		t.Fatalf("old file still exists: %v", err)
	}
	if _, err := os.Stat(newPath); err != nil {
		t.Fatalf("new file missing: %v", err)
	}
}

func launchTestService(t *testing.T, structured bool) (*Service, models.ItemDetail, models.WorkspaceConfig, *recordingRunner, string, *audit.Store) {
	t.Helper()
	root := t.TempDir()
	planDir := filepath.Join(root, "plans", "platform", "PM-018")
	if err := os.MkdirAll(planDir, 0o755); err != nil {
		t.Fatal(err)
	}
	if structured {
		if err := os.WriteFile(filepath.Join(planDir, "plan.yaml"), []byte("plan:\n  status: draft\n"), 0o644); err != nil {
			t.Fatal(err)
		}
		if err := os.WriteFile(filepath.Join(planDir, "implementation-plan.md"), []byte("# Plan\n"), 0o644); err != nil {
			t.Fatal(err)
		}
	}
	gitCommand(t, root, "init", "-b", "main")
	gitCommand(t, root, "add", ".")
	commit := exec.Command("git", "-C", root, "commit", "--allow-empty", "-m", "seed")
	commit.Env = append(os.Environ(), "GIT_AUTHOR_NAME=Test", "GIT_AUTHOR_EMAIL=test@example.com", "GIT_COMMITTER_NAME=Test", "GIT_COMMITTER_EMAIL=test@example.com")
	if output, err := commit.CombinedOutput(); err != nil {
		t.Fatalf("git commit: %v: %s", err, output)
	}
	dataDir := t.TempDir()
	reg := registry.New(filepath.Join(dataDir, "workspaces.yaml"), gitadapter.New())
	workspace, err := reg.Create(models.WorkspaceInput{Name: "Test", Path: root, BaselineBranch: "main", Sources: []string{"plans"}})
	if err != nil {
		t.Fatal(err)
	}
	item := models.ItemDetail{ItemSummary: models.ItemSummary{
		ID: "item-pm-018", WorkspaceID: workspace.ID, WorkspaceName: workspace.Name,
		Branch: "main", SourceMode: "working_tree", Editable: true, Scope: "platform",
		Identifier: "PM-018", Title: "External AI", ItemPath: "plans/platform/PM-018",
	}, Documents: []models.ItemDocument{{Path: "implementation-plan.md", Label: "Implementation Plan"}}}
	index := itemindex.New(filepath.Join(dataDir, "item-index.yaml"))
	if err := index.ReplaceWorkspace(workspace.ID, []models.ItemDetail{item}, nil, time.Now()); err != nil {
		t.Fatal(err)
	}
	executable := filepath.Join(dataDir, "tool")
	if err := os.WriteFile(executable, []byte("#!/bin/sh\n"), 0o700); err != nil {
		t.Fatal(err)
	}
	store := aisettings.New(filepath.Join(dataDir, "ai-settings.yaml"))
	_, err = store.Save(aisettings.Settings{
		DefaultProvider: "test-ai", DefaultTerminal: "wezterm",
		Providers: map[string]aisettings.LaunchTemplate{"test-ai": {Enabled: true, Executable: executable, Args: []string{"Read {contextFile}", "{contextMode}", "{identifier}"}}},
		Terminals: map[string]aisettings.LaunchTemplate{"wezterm": {Enabled: true, Executable: executable}},
	})
	if err != nil {
		t.Fatal(err)
	}
	auditStore := audit.New(filepath.Join(dataDir, "audit.jsonl"))
	runner := &recordingRunner{}
	contextDir := filepath.Join(dataDir, "ai-context")
	service := New(store).ConfigureLaunch(reg, index, auditStore, contextDir)
	service.goos = "darwin"
	service.launch.runner = runner
	service.launch.now = func() time.Time { return time.Date(2026, 7, 2, 10, 0, 0, 0, time.UTC) }
	return service, item, workspace, runner, contextDir, auditStore
}

func gitCommand(t *testing.T, root string, args ...string) {
	t.Helper()
	commandArgs := append([]string{"-C", root}, args...)
	if output, err := exec.Command("git", commandArgs...).CombinedOutput(); err != nil {
		t.Fatalf("git %v: %v: %s", args, err, output)
	}
}
