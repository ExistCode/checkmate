'use client';

import { OriginTracingDiagram } from './origin-tracing-diagram';

/**
 * Demo component showing how the Origin Tracing Diagram would look
 * with realistic fact-checking data
 */
export function OriginTracingDemo() {
  const demoData = {
    originTracing: {
      hypothesizedOrigin: "Originally posted on a 4chan /pol/ conspiracy thread claiming that COVID-19 vaccines contain microchips for government tracking.",
      firstSeenDates: [
        { source: "4chan /pol/", date: "2021-03-15", url: "https://example.com/thread1" },
        { source: "Reddit r/conspiracy", date: "2021-03-16", url: "https://reddit.com/r/conspiracy/example" },
        { source: "Facebook groups", date: "2021-03-17" },
        { source: "Twitter/X", date: "2021-03-18" }
      ],
      propagationPaths: [
        "Facebook groups",
        "YouTube influencers", 
        "TikTok creators",
        "Telegram channels"
      ]
    },
    beliefDrivers: [
      {
        name: "Confirmation Bias",
        description: "People who already distrust vaccines seek information that confirms their existing beliefs",
        references: [
          { title: "Confirmation Bias Research", url: "https://example.com/research1" }
        ]
      },
      {
        name: "Availability Heuristic", 
        description: "Recent privacy concerns about tech companies make tracking claims seem more plausible",
        references: []
      },
      {
        name: "Social Proof",
        description: "Seeing others share anti-vaccine content creates perception of widespread belief",
        references: []
      }
    ],
    sources: [
      {
        url: "https://snopes.com/example",
        title: "Snopes: COVID-19 Vaccines Do Not Contain Microchips",
        credibility: 95
      },
      {
        url: "https://factcheck.org/example", 
        title: "FactCheck.org: No Evidence of Microchips in Vaccines",
        credibility: 93
      },
      {
        url: "https://reuters.com/example",
        title: "Reuters Fact Check: Microchip Claims Debunked",
        credibility: 91
      },
      {
        url: "https://apnews.com/example",
        title: "AP News: Health Officials Reject Microchip Claims",
        credibility: 94
      }
    ],
    verdict: "false" as const,
    content: "COVID-19 vaccines contain microchips that allow government tracking of citizens"
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Origin Tracing Diagram Demo</h2>
        <p className="text-muted-foreground">
          Example of how misinformation flows from origin to current claim
        </p>
      </div>
      
      <OriginTracingDiagram
        originTracing={demoData.originTracing}
        beliefDrivers={demoData.beliefDrivers}
        sources={demoData.sources}
        verdict={demoData.verdict}
        content={demoData.content}
      />
    </div>
  );
}