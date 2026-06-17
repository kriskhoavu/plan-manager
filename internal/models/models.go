package models

import "time"

type PlanStatus string

const (
	StatusIdeas      PlanStatus = "ideas"
	StatusDraft      PlanStatus = "draft"
	StatusInProgress PlanStatus = "in_progress"
	StatusReview     PlanStatus = "review"
	StatusDone       PlanStatus = "done"
)

var StatusOrder = []PlanStatus{StatusIdeas, StatusDraft, StatusInProgress, StatusReview, StatusDone}

type RepositoryConfig struct {
	ID              string    `json:"id" yaml:"id"`
	Name            string    `json:"name" yaml:"name"`
	Path            string    `json:"path" yaml:"path"`
	BaselineBranch  string    `json:"baselineBranch" yaml:"baselineBranch"`
	PlanDirectories []string  `json:"planDirectories" yaml:"planDirectories"`
	CreatedAt       time.Time `json:"createdAt" yaml:"createdAt"`
	LastScannedAt   time.Time `json:"lastScannedAt,omitempty" yaml:"lastScannedAt,omitempty"`
}

type RepositoryInput struct {
	Name            string   `json:"name" yaml:"name"`
	Path            string   `json:"path" yaml:"path"`
	BaselineBranch  string   `json:"baselineBranch" yaml:"baselineBranch"`
	PlanDirectories []string `json:"planDirectories" yaml:"planDirectories"`
}

type PlanSummary struct {
	ID             string     `json:"id" yaml:"id"`
	RepositoryID   string     `json:"repositoryId" yaml:"repositoryId"`
	RepositoryName string     `json:"repositoryName" yaml:"repositoryName"`
	Branch         string     `json:"branch" yaml:"branch"`
	Service        string     `json:"service" yaml:"service"`
	Ticket         string     `json:"ticket" yaml:"ticket"`
	Title          string     `json:"title" yaml:"title"`
	Status         PlanStatus `json:"status" yaml:"status"`
	Owner          string     `json:"owner,omitempty" yaml:"owner,omitempty"`
	Author         string     `json:"author,omitempty" yaml:"author,omitempty"`
	Tags           []string   `json:"tags" yaml:"tags"`
	UpdatedAt      time.Time  `json:"updatedAt,omitempty" yaml:"updatedAt,omitempty"`
	Description    string     `json:"description,omitempty" yaml:"description,omitempty"`
	MetadataSource string     `json:"metadataSource" yaml:"metadataSource"`
	PlanRoot       string     `json:"planRoot,omitempty" yaml:"planRoot,omitempty"`
}

type PlanDetail struct {
	PlanSummary
	Documents []PlanDocument      `json:"documents" yaml:"documents"`
	Metadata  map[string]any      `json:"metadata" yaml:"metadata"`
	Warnings  []ScanWarning       `json:"warnings,omitempty" yaml:"warnings,omitempty"`
	Counts    PlanWorkspaceCounts `json:"counts" yaml:"counts"`
}

type PlanWorkspaceCounts struct {
	Files int `json:"files" yaml:"files"`
}

type PlanDocument struct {
	ID    string `json:"id" yaml:"id"`
	Role  string `json:"role" yaml:"role"`
	Track string `json:"track,omitempty" yaml:"track,omitempty"`
	Path  string `json:"path" yaml:"path"`
	Label string `json:"label" yaml:"label"`
}

type FileNode struct {
	ID       string     `json:"id" yaml:"id"`
	Name     string     `json:"name" yaml:"name"`
	Path     string     `json:"path" yaml:"path"`
	Type     string     `json:"type" yaml:"type"`
	Children []FileNode `json:"children,omitempty" yaml:"children,omitempty"`
}

type FileContent struct {
	ID       string `json:"id" yaml:"id"`
	Path     string `json:"path" yaml:"path"`
	Content  string `json:"content" yaml:"content"`
	Language string `json:"language" yaml:"language"`
}

type ScanWarning struct {
	PlanPath string `json:"planPath,omitempty" yaml:"planPath,omitempty"`
	Message  string `json:"message" yaml:"message"`
}

type ScanResult struct {
	RepositoryID string        `json:"repositoryId" yaml:"repositoryId"`
	ScannedAt    time.Time     `json:"scannedAt" yaml:"scannedAt"`
	PlanCount    int           `json:"planCount" yaml:"planCount"`
	Warnings     []ScanWarning `json:"warnings" yaml:"warnings"`
}
