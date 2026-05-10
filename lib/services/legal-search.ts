export interface BareActResult {
  id: string
  title: string
  year: string
  sections: string[]
  url?: string
  excerpt?: string
}

export interface JudgmentResult {
  id: string
  title: string
  court: string
  date: string
  judges: string[]
  citation?: string
  url?: string
  summary?: string
}

export class LegalSearchService {
  private readonly INDIA_CODE_BASE_URL = 'https://api.indiacode.nic.in'
  private readonly INDIAN_KANOON_BASE_URL = 'https://api.indiankanoon.org'

  async searchBareActs(query: string, limit: number = 10): Promise<BareActResult[]> {
    try {
      const response = await fetch(
        `${this.INDIA_CODE_BASE_URL}/search?q=${encodeURIComponent(query)}&limit=${limit}`,
        {
          headers: {
            'Accept': 'application/json',
          },
          next: { revalidate: 3600 },
        }
      )

      if (!response.ok) {
        console.error('IndiaCode API error:', response.statusText)
        return this.getFallbackBareActs(query)
      }

      const data = await response.json()
      return this.formatBareActResults(data)
    } catch (error) {
      console.error('Error fetching bare acts:', error)
      return this.getFallbackBareActs(query)
    }
  }

  async searchJudgments(
    query: string,
    court?: string,
    limit: number = 10
  ): Promise<JudgmentResult[]> {
    try {
      const params = new URLSearchParams({
        formInput: query,
        pagenum: '0',
      })

      if (court) {
        params.append('court', court)
      }

      const response = await fetch(
        `${this.INDIAN_KANOON_BASE_URL}/search/?${params.toString()}`,
        {
          headers: {
            'Accept': 'application/json',
          },
          next: { revalidate: 3600 },
        }
      )

      if (!response.ok) {
        console.error('Indian Kanoon API error:', response.statusText)
        return this.getFallbackJudgments(query)
      }

      const data = await response.json()
      return this.formatJudgmentResults(data, limit)
    } catch (error) {
      console.error('Error fetching judgments:', error)
      return this.getFallbackJudgments(query)
    }
  }

  async getActDetails(actId: string): Promise<BareActResult | null> {
    try {
      const response = await fetch(
        `${this.INDIA_CODE_BASE_URL}/acts/${actId}`,
        {
          headers: {
            'Accept': 'application/json',
          },
          next: { revalidate: 3600 },
        }
      )

      if (!response.ok) {
        return null
      }

      const data = await response.json()
      return this.formatSingleBareAct(data)
    } catch (error) {
      console.error('Error fetching act details:', error)
      return null
    }
  }

  async getJudgmentDetails(docId: string): Promise<JudgmentResult | null> {
    try {
      const response = await fetch(
        `${this.INDIAN_KANOON_BASE_URL}/doc/${docId}/`,
        {
          headers: {
            'Accept': 'application/json',
          },
          next: { revalidate: 3600 },
        }
      )

      if (!response.ok) {
        return null
      }

      const data = await response.json()
      return this.formatSingleJudgment(data)
    } catch (error) {
      console.error('Error fetching judgment details:', error)
      return null
    }
  }

  private formatBareActResults(data: any): BareActResult[] {
    if (!data?.results) return []

    return data.results.map((item: any) => ({
      id: item.id || item.act_id || '',
      title: item.title || item.name || 'Untitled Act',
      year: item.year || 'N/A',
      sections: item.sections || [],
      url: item.url || `https://www.indiacode.nic.in/handle/123456789/${item.id}`,
      excerpt: item.excerpt || item.description || '',
    }))
  }

  private formatJudgmentResults(data: any, limit: number): JudgmentResult[] {
    if (!data?.docs) return []

    return data.docs.slice(0, limit).map((item: any) => ({
      id: item.tid || item.docid || '',
      title: item.heading || item.title || 'Untitled Judgment',
      court: item.court || 'Unknown Court',
      date: item.docdatestring || item.date || 'Date not available',
      judges: item.judges || [],
      citation: item.citation || item.citations?.[0] || '',
      url: item.tid ? `https://indiankanoon.org/doc/${item.tid}/` : '',
      summary: item.summary || item.excerpt || '',
    }))
  }

  private formatSingleBareAct(data: any): BareActResult {
    return {
      id: data.id || data.act_id || '',
      title: data.title || data.name || 'Untitled Act',
      year: data.year || 'N/A',
      sections: data.sections || [],
      url: data.url || `https://www.indiacode.nic.in/handle/123456789/${data.id}`,
      excerpt: data.full_text || data.description || '',
    }
  }

  private formatSingleJudgment(data: any): JudgmentResult {
    return {
      id: data.tid || data.docid || '',
      title: data.heading || data.title || 'Untitled Judgment',
      court: data.court || 'Unknown Court',
      date: data.docdatestring || data.date || 'Date not available',
      judges: data.judges || [],
      citation: data.citation || '',
      url: data.tid ? `https://indiankanoon.org/doc/${data.tid}/` : '',
      summary: data.doc || data.full_text || '',
    }
  }

  private getFallbackBareActs(query: string): BareActResult[] {
    const commonActs = [
      {
        id: 'ipc-1860',
        title: 'Indian Penal Code',
        year: '1860',
        sections: ['Section 302', 'Section 420', 'Section 498A'],
        url: 'https://www.indiacode.nic.in/handle/123456789/2263',
        excerpt: 'The Indian Penal Code, 1860 is the main criminal code of India.',
      },
      {
        id: 'crpc-1973',
        title: 'Code of Criminal Procedure',
        year: '1973',
        sections: ['Section 125', 'Section 156', 'Section 437'],
        url: 'https://www.indiacode.nic.in/handle/123456789/1362',
        excerpt: 'The Code of Criminal Procedure, 1973 is the procedural law for administration of criminal law.',
      },
    ]

    return commonActs.filter(act =>
      act.title.toLowerCase().includes(query.toLowerCase())
    )
  }

  private getFallbackJudgments(query: string): JudgmentResult[] {
    return [
      {
        id: 'fallback-1',
        title: 'Search service temporarily unavailable',
        court: 'System',
        date: new Date().toISOString(),
        judges: [],
        summary: `Unable to fetch results for "${query}". Please try again later.`,
      },
    ]
  }
}

export const legalSearchService = new LegalSearchService()
