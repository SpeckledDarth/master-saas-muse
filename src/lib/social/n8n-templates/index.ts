export const n8nTemplates = [
  {
    id: "auto-post-rss",
    name: "Auto-Post RSS Feed to Social Media",
    description:
      "Automatically posts new RSS feed items to your connected social media platforms every 15 minutes.",
    filename: "auto-post-rss.json",
    category: "automation",
  },
  {
    id: "ai-generate-and-schedule",
    name: "AI Generate and Schedule Social Posts",
    description:
      "Uses AI to generate social media posts daily at 9am and schedules them for publishing.",
    filename: "ai-generate-and-schedule.json",
    category: "ai",
  },
  {
    id: "engagement-monitor",
    name: "Social Engagement Monitor with Alerts",
    description:
      "Monitors engagement metrics hourly and sends Slack or email alerts when posts have low engagement.",
    filename: "engagement-monitor.json",
    category: "monitoring",
  },
] as const;

export type N8nTemplate = (typeof n8nTemplates)[number];
export type N8nTemplateId = N8nTemplate["id"];
