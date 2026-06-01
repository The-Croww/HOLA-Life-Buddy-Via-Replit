export const DS = {
  colors: {
    background: "#FFFFFF",
    dark: "#0A0A0A",
    accent: "#3DD68C",
    danger: "#FF6B6B",
    warning: "#FFB547",
    info: "#5B9CF6",
    border: "#E0E0E0",
    muted: "#666666",
    surface: "#F8F8F8",
    white: "#FFFFFF",
  },
  fonts: {
    regular: "Inter_400Regular",
    medium: "Inter_500Medium",
    semibold: "Inter_600SemiBold",
  },
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    full: 999,
  },
  spacing: {
    xs: 8,
    sm: 12,
    md: 16,
    lg: 20,
    xl: 24,
    xxl: 32,
  },
} as const;

export function moodColor(score: number): string {
  if (score >= 8) return DS.colors.accent;
  if (score >= 6) return "#A8E6CF";
  if (score >= 4) return DS.colors.warning;
  if (score >= 2) return "#FF9F43";
  return DS.colors.danger;
}

export function severityColor(severity: string): string {
  switch (severity) {
    case "high": return DS.colors.danger;
    case "medium": return DS.colors.warning;
    case "low": return DS.colors.info;
    default: return DS.colors.muted;
  }
}

export function riskColor(risk: string): string {
  switch (risk) {
    case "high": return DS.colors.danger;
    case "medium": return DS.colors.warning;
    case "low": return DS.colors.accent;
    default: return DS.colors.muted;
  }
}
