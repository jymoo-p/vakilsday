import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'

const execAsync = promisify(exec)

const SCRIPTS_DIR = path.join(process.cwd(), 'scripts', 'ecourts')

export interface CauseListEntry {
  case_number: string | null
  case_type: string | null
  petitioner: string | null
  respondent: string | null
  advocate_petitioner: string | null
  advocate_respondent: string | null
  judge: string | null
  court_number: string | null
  item_number: string | null
  purpose: string | null
}

export interface CauseListResult {
  success: boolean
  state_code?: string
  court_code?: string
  date?: string
  cases?: CauseListEntry[]
  error?: string
  error_type?: string
}

export interface Court {
  name: string
  state_code: string
  court_code: string
}

export interface CourtsResult {
  success: boolean
  courts?: Court[]
  error?: string
}

/**
 * Fetch cause list for a specific court and date
 */
export async function getCauseList(
  stateCode: string,
  courtCode: string,
  date: string
): Promise<CauseListResult> {
  try {
    const scriptPath = path.join(SCRIPTS_DIR, 'get_cause_list.py')
    const command = `python3 "${scriptPath}" "${stateCode}" "${courtCode}" "${date}"`

    const { stdout, stderr } = await execAsync(command, {
      timeout: 30000, // 30 second timeout
    })

    if (stderr) {
      console.error('Python script stderr:', stderr)
    }

    const result = JSON.parse(stdout) as CauseListResult
    return result
  } catch (error) {
    console.error('Error fetching cause list:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      error_type: 'ExecutionError',
    }
  }
}

/**
 * Get list of available High Courts
 */
export async function getAvailableCourts(): Promise<CourtsResult> {
  try {
    const scriptPath = path.join(SCRIPTS_DIR, 'get_courts.py')
    const command = `python3 "${scriptPath}"`

    const { stdout, stderr } = await execAsync(command, {
      timeout: 10000, // 10 second timeout
    })

    if (stderr) {
      console.error('Python script stderr:', stderr)
    }

    const result = JSON.parse(stdout) as CourtsResult
    return result
  } catch (error) {
    console.error('Error fetching courts:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Check if Python and ecourts library are installed
 */
export async function checkECourtsSetup(): Promise<{
  installed: boolean
  error?: string
}> {
  try {
    const { stdout } = await execAsync('python3 -c "import ecourts; print(ecourts.__version__)"')
    return {
      installed: true,
    }
  } catch (error) {
    return {
      installed: false,
      error:
        'eCourts library not installed. Run: pip3 install ecourts',
    }
  }
}
