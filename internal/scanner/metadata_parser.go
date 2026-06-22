package scanner

import (
	"os"
	"path/filepath"
	"sort"
	"strings"

	"plan-manager/internal/models"
)

type planYAML struct {
	Plan struct {
		Identifier string   `yaml:"identifier"`
		Title      string   `yaml:"title"`
		Scope      string   `yaml:"scope"`
		Status     string   `yaml:"status"`
		Owner      string   `yaml:"owner"`
		Tags       []string `yaml:"tags"`
	} `yaml:"plan"`
	Documents []models.ItemDocument `yaml:"documents"`
}

func readPlanYAML(root string) ([]byte, string, error) {
	data, err := os.ReadFile(filepath.Join(root, "plan.yaml"))
	if err != nil {
		return nil, "", err
	}
	return data, "plan.yaml", nil
}

func NormalizeStatus(raw string) models.ItemStatus {
	s := strings.ToLower(strings.TrimSpace(raw))
	s = strings.ReplaceAll(s, "-", "_")
	s = strings.ReplaceAll(s, " ", "_")
	switch s {
	case "unsorted", "unstructured":
		return models.StatusUnsorted
	case "ideas", "idea", "backlog":
		return models.StatusIdeas
	case "in_progress", "progress", "doing", "active":
		return models.StatusInProgress
	case "review", "in_review":
		return models.StatusReview
	case "done", "complete", "completed", "closed":
		return models.StatusDone
	default:
		return models.StatusDraft
	}
}

func normalizeDocuments(docs []models.ItemDocument) []models.ItemDocument {
	for i := range docs {
		if docs[i].ID == "" {
			docs[i].ID = fileID(docs[i].Path)
		}
		if docs[i].Label == "" {
			docs[i].Label = labelFromPath(docs[i].Path)
		}
	}
	sort.SliceStable(docs, func(i, j int) bool { return naturalLess(docs[i].Path, docs[j].Path) })
	return docs
}

func parsePlanYAML(data string) planYAML {
	var parsed planYAML
	section := ""
	var current *models.ItemDocument
	for _, raw := range strings.Split(data, "\n") {
		if strings.TrimSpace(raw) == "" || strings.HasPrefix(strings.TrimSpace(raw), "#") {
			continue
		}
		indent := len(raw) - len(strings.TrimLeft(raw, " "))
		line := strings.TrimSpace(raw)
		switch line {
		case "plan:":
			section = "plan"
			continue
		case "documents:":
			section = "documents"
			continue
		}
		if section == "plan" && indent >= 2 {
			key, value, ok := splitYAMLPair(line)
			if !ok {
				continue
			}
			switch key {
			case "identifier", "ticket":
				parsed.Plan.Identifier = value
			case "title":
				parsed.Plan.Title = value
			case "scope", "service":
				parsed.Plan.Scope = value
			case "status":
				parsed.Plan.Status = value
			case "owner":
				parsed.Plan.Owner = value
			case "tags":
				parsed.Plan.Tags = parseYAMLList(value)
			}
			continue
		}
		if section == "documents" && strings.HasPrefix(line, "- ") {
			parsed.Documents = append(parsed.Documents, models.ItemDocument{})
			current = &parsed.Documents[len(parsed.Documents)-1]
			line = strings.TrimSpace(strings.TrimPrefix(line, "- "))
			if key, value, ok := splitYAMLPair(line); ok {
				assignDocumentField(current, key, value)
			}
			continue
		}
		if section == "documents" && current != nil && indent >= 4 {
			if key, value, ok := splitYAMLPair(line); ok {
				assignDocumentField(current, key, value)
			}
		}
	}
	return parsed
}

func splitYAMLPair(line string) (string, string, bool) {
	key, value, ok := strings.Cut(line, ":")
	if !ok {
		return "", "", false
	}
	return strings.TrimSpace(key), trimYAMLScalar(value), true
}

func trimYAMLScalar(value string) string {
	value = strings.TrimSpace(value)
	value = strings.Trim(value, `"'`)
	if value == "null" {
		return ""
	}
	return value
}

func parseYAMLList(value string) []string {
	value = strings.TrimSpace(value)
	if !strings.HasPrefix(value, "[") || !strings.HasSuffix(value, "]") {
		if value == "" {
			return nil
		}
		return []string{trimYAMLScalar(value)}
	}
	value = strings.TrimSuffix(strings.TrimPrefix(value, "["), "]")
	var out []string
	for _, item := range strings.Split(value, ",") {
		item = trimYAMLScalar(item)
		if item != "" {
			out = append(out, item)
		}
	}
	return out
}

func assignDocumentField(doc *models.ItemDocument, key, value string) {
	switch key {
	case "id":
		doc.ID = value
	case "role":
		doc.Role = value
	case "track":
		doc.Track = value
	case "path":
		doc.Path = value
	case "label":
		doc.Label = value
	}
}
