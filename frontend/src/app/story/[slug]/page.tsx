'use client';

import NewsDetail from '@/app/components/NewsDetail';

// This would typically come from your API
const sampleNewsData = {
  title: "US sides with Russia in UN resolutions on Ukraine",
  publishedAt: new Date('2024-02-24T10:00:00Z'),
  authors: [
    {
      id: '1',
      name: 'James Landale',
      role: 'Diplomatic correspondent',
    },
    {
      id: '2',
      name: 'Patrick Jackson',
      role: 'BBC News',
    }
  ],
  mainImage: {
    url: "https://ichef.bbci.co.uk/news/1536/cpsprodpb/b3d9/live/b01c0870-f35d-11ef-8c03-7dfdbeeb2526.jpg.webp",
    caption: "America's acting UN envoy, Dorothy Camille Shea, voting at the UN Security Council",
    altText: "UN Security Council meeting",
    credit: "EPA"
  },
  content: `The US has twice sided with Russia in votes at the United Nations to mark the third anniversary of the Russian invasion of Ukraine, highlighting the Trump administration's change of stance on the war.

First the US opposed a European-drafted resolution condemning Moscow's actions and supporting Ukraine's territorial integrity - voting the same way as Russia and countries including North Korea and Belarus at the UN General Assembly (UNGA) in New York.

Then the US drafted and voted for a resolution at the UN Security Council which called for an end to the conflict but contained no criticism of Russia.

The Security Council passed the resolution but two key US allies, the UK and France, abstained after their attempts to amend the wording were vetoed.

The UN resolutions were tabled as French President Emmanuel Macron visited President Donald Trump at the White House in an attempt to address their sharp differences over the war.

Trump's White House has upended the transatlantic alliance, currying favour with Moscow and casting doubt on America's long-term commitment to European security.

That rift was laid bare on the floor of the 193-member UNGA on Monday as US diplomats pushed their limited resolution mourning the loss of life during the "Russia-Ukraine conflict" and calling for a swift end to it.

European diplomats tabled a more detailed text, blaming Russia for its full-scale invasion, and supporting Ukraine's sovereignty and territorial integrity.`,
  tags: [
    { id: '1', name: 'War in Ukraine', slug: 'war-in-ukraine' },
    { id: '2', name: 'Russia', slug: 'russia' },
    { id: '3', name: 'UN General Assembly', slug: 'un-general-assembly' },
    { id: '4', name: 'United Nations', slug: 'united-nations' },
    { id: '5', name: 'United States', slug: 'united-states' },
    { id: '6', name: 'Ukraine', slug: 'ukraine' }
  ],
  relatedArticles: [
    {
      id: '1',
      title: "Putin offers Russian and Ukrainian rare minerals to US",
      summary: "Russia's president discusses potential mineral trade deals amid ongoing conflict.",
      imageUrl: "/images/news/minerals.jpg",
      publishedAt: new Date('2024-02-24T09:30:00Z'),
      category: "World",
      slug: "putin-minerals-offer"
    },
    {
      id: '2',
      title: "Why is Ukraine negotiating a minerals deal with the US?",
      summary: "Analysis of the strategic importance of rare earth minerals in international relations.",
      imageUrl: "/images/news/ukraine-minerals.jpg",
      publishedAt: new Date('2024-02-24T09:00:00Z'),
      category: "Business",
      slug: "ukraine-minerals-deal"
    },
    {
      id: '3',
      title: "Watch: Macron interrupts Trump over Ukraine funding",
      summary: "French president challenges Trump's position on Ukraine during White House meeting.",
      imageUrl: "/images/news/macron-trump.jpg",
      publishedAt: new Date('2024-02-24T07:00:00Z'),
      category: "World",
      slug: "macron-trump-meeting"
    }
  ]
};

export default function StoryPage() {
  return <NewsDetail {...sampleNewsData} />;
} 