import { NextRequest, NextResponse } from 'next/server'

const ECOURTS_API_KEY = process.env.ECOURTS_INDIA_API_KEY
const ECOURTS_API_BASE = 'https://ecourtsindia.com/api'
const ECOURTS_PARTNER_BASE = 'https://webapi.ecourtsindia.com'

interface EcourtsResponse {
  success: boolean
  data?: {
    caseNumber?: string
    year?: number
    petitioner?: string
    respondent?: string
    advocate?: string
    courtName?: string
    caseType?: string
    filingDate?: string
    actSection?: string
    status?: string
    [key: string]: any
  }
  error?: string
}

export async function POST(request: NextRequest) {
  try {
    let body: any = null
    // Read raw text first to avoid "body already read" issues
    const raw = await request.text()
    console.log('[CNR-LOOKUP] Raw request text length:', raw ? raw.length : 0)
    console.log('[CNR-LOOKUP] Raw request text snippet:', raw ? raw.substring(0, 400) : '<empty>')
    if (raw) {
      // Handle possibly double-escaped JSON (e.g., Windows curl quoting)
      let normalized = raw
      if (normalized.includes('\\"')) {
        console.log('[CNR-LOOKUP] Detected escaped quotes in raw body, normalizing')
        normalized = normalized.replace(/\\\\/g, '\\').replace(/\\"/g, '"')
      }

      try {
        body = JSON.parse(normalized)
      } catch (err) {
        console.error('[CNR-LOOKUP] Raw body is not JSON, attempting to extract CNR', err)
        const match = normalized.match(/[A-Z]{2,4}[A-Z0-9]{2,}\d{6,}/i)
        body = match ? { cnr: match[0] } : null
      }
    }

    const { cnr } = body || {}

    console.log('[CNR-LOOKUP] Incoming body present:', !!body, 'cnr=', cnr)

    if (!cnr || !cnr.trim()) {
      return NextResponse.json({ error: 'CNR number is required' }, { status: 400 })
    }

    if (!ECOURTS_API_KEY) {
      console.error('[CNR-LOOKUP] Missing ECOURTS_INDIA_API_KEY in environment')
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      )
    }

    console.log(`[CNR-LOOKUP] Fetching case details for CNR: ${cnr}`, { hasKey: !!ECOURTS_API_KEY })

    // Prefer partner webapi endpoint which accepts server-side Bearer tokens
    const partnerUrl = `${ECOURTS_PARTNER_BASE}/api/partner/case/${encodeURIComponent(cnr.trim())}`

    const response = await fetch(partnerUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ECOURTS_API_KEY}`,
      },
    })

    if (!response.ok) {
      console.error(`[CNR-LOOKUP] Partner API error: ${response.status} ${response.statusText}`)
      const errorText = await response.text()
      console.error(`[CNR-LOOKUP] Response: ${errorText}`)
      return NextResponse.json({ error: `Failed to fetch case details: ${response.statusText}` }, { status: response.status })
    }

    // Some partner responses may return non-JSON (HTML challenge) even with 200.
    const textBody = await response.text()
    let partnerJson: any = null
    try {
      partnerJson = JSON.parse(textBody)
    } catch (err) {
      console.error('[CNR-LOOKUP] Failed to parse partner response as JSON', { err, textBody: textBody.substring(0, 200) })
      return NextResponse.json({ error: 'Invalid response from eCourts partner API' }, { status: 502 })
    }

    const caseData = partnerJson?.data?.courtCaseData || partnerJson?.data || {}

    // Map partner response to our public shape
    const mapped = {
      caseNumber: caseData.caseNumber || caseData.registrationNumber || caseData.cnrCaseNumber || '',
      year: caseData.cnrYear ? parseInt(caseData.cnrYear as any) : (caseData.filingDate ? new Date(caseData.filingDate).getFullYear() : new Date().getFullYear()),
      petitioner: Array.isArray(caseData.petitioners) ? caseData.petitioners[0] : (caseData.petitioner || ''),
      respondent: Array.isArray(caseData.respondents) ? caseData.respondents[0] : (caseData.respondent || ''),
      advocate: (caseData.petitionerAdvocates && caseData.petitionerAdvocates[0]) || (caseData.respondentAdvocates && caseData.respondentAdvocates[0]) || '',
      courtName: caseData.courtName || '',
      caseType: caseData.caseTypeRaw || caseData.caseType || '',
      filingDate: caseData.filingDate || caseData.registrationDate || '',
      actSection: caseData.actSection || '',
      status: caseData.caseStatus || '',
      rawData: partnerJson.data,
    }

    console.log('[CNR-LOOKUP] Partner mapped result for', cnr, mapped.caseNumber)

    return NextResponse.json({ success: true, caseDetails: mapped })
  } catch (error) {
    console.error('[CNR-LOOKUP] Error:', error)
    return NextResponse.json(
      { error: 'Failed to lookup case details' },
      { status: 500 }
    )
  }
}
