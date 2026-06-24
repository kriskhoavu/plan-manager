package scanner

import (
	"fmt"
	"path/filepath"
	"strings"

	"plan-manager/internal/models"
)

const maxSourceStructurePreviewRows = 6

func SourceStructureProposals(reader SourceReader, root string, settings models.SourceStructureSettings) ([]models.SourceStructureProposal, []models.SourceStructurePreview) {
	currentPreview := PreviewSourceStructureCard(reader, root, firstSourceStructureCard(settings))
	proposals := sourceStructureProposalCards(root)
	out := make([]models.SourceStructureProposal, 0, len(proposals))
	for _, proposal := range proposals {
		preview := PreviewSourceStructureCard(reader, root, proposal.Card)
		proposal.Preview = preview
		if len(preview) == 0 {
			proposal.Summary = "No matching card directories found yet."
		} else {
			proposal.Summary = fmt.Sprintf("Creates %d preview card%s from this source.", len(preview), pluralSuffix(len(preview)))
		}
		out = append(out, proposal)
	}
	return out, currentPreview
}

func PreviewSourceStructureCard(reader SourceReader, root string, card models.SourceStructureCard) []models.SourceStructurePreview {
	if reader == nil || strings.TrimSpace(root) == "" || strings.TrimSpace(card.PathPattern) == "" {
		return []models.SourceStructurePreview{}
	}
	segments, err := parsePathPattern(card.PathPattern)
	if err != nil {
		return []models.SourceStructurePreview{}
	}
	matches := matchPatternDirectories(reader, root, segments)
	if len(matches) > maxSourceStructurePreviewRows {
		matches = matches[:maxSourceStructurePreviewRows]
	}
	rows := make([]models.SourceStructurePreview, 0, len(matches))
	for _, match := range matches {
		scope := strings.TrimSpace(renderSettingsTemplate(card.Fields.Scope, match.captures))
		identifier := strings.TrimSpace(renderSettingsTemplate(card.Fields.Identifier, match.captures))
		if scope == "" || identifier == "" {
			continue
		}
		rows = append(rows, models.SourceStructurePreview{
			Path:       filepath.ToSlash(match.path),
			Scope:      scope,
			Identifier: identifier,
			Title:      previewTitle(reader, match.path, identifier, card.Fields.Title, match.captures),
			Status:     NormalizeStatus(renderSettingsTemplate(card.Fields.Status, match.captures)),
			Tags:       previewTags(card.Fields.Tags, match.captures),
		})
	}
	return rows
}

func sourceStructureProposalCards(root string) []models.SourceStructureProposal {
	sourceName := filepath.Base(filepath.ToSlash(root))
	if sourceName == "." || sourceName == "/" || sourceName == "" {
		sourceName = "source"
	}
	return []models.SourceStructureProposal{
		{
			ID:         "scope-feature-identifier",
			Label:      "Scope / feature / identifier",
			Confidence: "high",
			Card: models.SourceStructureCard{
				PathPattern: "{scope}/feature/{identifier}",
				Fields: models.SourceStructureFields{
					Scope:      "{scope}",
					Identifier: "{identifier}",
					Title:      "readme_heading",
					Status:     "draft",
					Tags:       []string{sourceName, "{scope}"},
				},
			},
		},
		{
			ID:         "scope-identifier",
			Label:      "Scope / identifier",
			Confidence: "high",
			Card: models.SourceStructureCard{
				PathPattern: "{scope}/{identifier}",
				Fields: models.SourceStructureFields{
					Scope:      "{scope}",
					Identifier: "{identifier}",
					Title:      "readme_heading",
					Status:     "draft",
					Tags:       []string{sourceName, "{scope}"},
				},
			},
		},
		{
			ID:         "identifier-only",
			Label:      "Identifier only",
			Confidence: "medium",
			Card: models.SourceStructureCard{
				PathPattern: "{identifier}",
				Fields: models.SourceStructureFields{
					Scope:      sourceName,
					Identifier: "{identifier}",
					Title:      "readme_heading",
					Status:     "draft",
					Tags:       []string{sourceName},
				},
			},
		},
	}
}

func firstSourceStructureCard(settings models.SourceStructureSettings) models.SourceStructureCard {
	if len(settings.Cards) == 0 {
		return models.SourceStructureCard{}
	}
	return settings.Cards[0]
}

func previewTitle(reader SourceReader, root, identifier, titleTemplate string, captures map[string]string) string {
	title := strings.TrimSpace(renderSettingsTemplate(titleTemplate, captures))
	if title != "" && title != "readme_heading" {
		return title
	}
	if data, err := reader.ReadFile(filepath.ToSlash(filepath.Join(root, "README.md"))); err == nil {
		if headingTitle := titleFromHeading(firstHeading(string(data)), identifier); headingTitle != "" {
			return headingTitle
		}
	}
	return titleFromIdentifier(identifier)
}

func previewTags(values []string, captures map[string]string) []string {
	if values == nil {
		return []string{}
	}
	tags := make([]string, 0, len(values))
	seen := map[string]bool{}
	for _, value := range values {
		tag := strings.TrimSpace(renderSettingsTemplate(value, captures))
		if tag == "" || seen[tag] {
			continue
		}
		seen[tag] = true
		tags = append(tags, tag)
	}
	return tags
}

func pluralSuffix(count int) string {
	if count == 1 {
		return ""
	}
	return "s"
}
