import { google } from 'googleapis'
import { prisma } from '@/lib/prisma'

/**
 * Get Google Drive client for a user
 */
async function getDriveClient(userId: string) {
  const account = await prisma.account.findFirst({
    where: {
      userId,
      provider: 'google'
    },
  })

  if (!account?.access_token) {
    throw new Error('No Google Drive access. Please sign in with Google.')
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  )

  oauth2Client.setCredentials({
    access_token: account.access_token,
    refresh_token: account.refresh_token,
  })

  // Auto-refresh tokens when they expire
  oauth2Client.on('tokens', async (tokens) => {
    if (tokens.access_token) {
      await prisma.account.update({
        where: { id: account.id },
        data: {
          access_token: tokens.access_token,
          expires_at: tokens.expiry_date ? Math.floor(tokens.expiry_date / 1000) : account.expires_at,
        },
      })
    }
  })

  return google.drive({ version: 'v3', auth: oauth2Client })
}

/**
 * Get or create VakilsDay folder in user's Google Drive
 */
async function getOrCreateAppFolder(drive: any): Promise<string> {
  // Search for existing VakilsDay folder
  const search = await drive.files.list({
    q: "name='VakilsDay' and mimeType='application/vnd.google-apps.folder' and trashed=false",
    fields: 'files(id, name)',
    spaces: 'drive',
  })

  if (search.data.files && search.data.files.length > 0) {
    return search.data.files[0].id
  }

  // Create new VakilsDay folder
  const folder = await drive.files.create({
    requestBody: {
      name: 'VakilsDay',
      mimeType: 'application/vnd.google-apps.folder',
    },
    fields: 'id',
  })

  return folder.data.id
}

/**
 * Get or create case folder inside VakilsDay folder
 */
async function getOrCreateCaseFolder(
  drive: any,
  parentFolderId: string,
  caseName: string
): Promise<string> {
  // Search for existing case folder
  const search = await drive.files.list({
    q: `name='${caseName}' and '${parentFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: 'files(id, name)',
    spaces: 'drive',
  })

  if (search.data.files && search.data.files.length > 0) {
    return search.data.files[0].id
  }

  // Create new case folder
  const folder = await drive.files.create({
    requestBody: {
      name: caseName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentFolderId],
    },
    fields: 'id',
  })

  return folder.data.id
}

/**
 * Upload file to user's Google Drive
 */
export async function uploadToUserDrive(
  userId: string,
  file: Buffer | ReadableStream,
  metadata: {
    caseId: string
    caseNumber: string
    title: string
    mimeType: string
  }
) {
  const drive = await getDriveClient(userId)

  // Get/create folder structure: VakilsDay/Case_XXX/
  const appFolderId = await getOrCreateAppFolder(drive)
  const caseFolderId = await getOrCreateCaseFolder(
    drive,
    appFolderId,
    `Case_${metadata.caseNumber}`
  )

  // Upload file
  const response = await drive.files.create({
    requestBody: {
      name: metadata.title,
      parents: [caseFolderId],
      description: `Case: ${metadata.caseNumber} | Case ID: ${metadata.caseId}`,
    },
    media: {
      mimeType: metadata.mimeType,
      body: file,
    },
    fields: 'id, name, webViewLink, webContentLink, size',
  })

  return {
    driveFileId: response.data.id!,
    driveUrl: response.data.webViewLink!,
    fileSize: response.data.size ? parseInt(response.data.size) : undefined,
  }
}

/**
 * Share file with team members (all users in organization)
 */
export async function shareWithTeam(
  ownerId: string,
  driveFileId: string,
  teamEmails: string[]
) {
  const drive = await getDriveClient(ownerId)

  const sharePromises = teamEmails.map(async (email) => {
    try {
      await drive.permissions.create({
        fileId: driveFileId,
        requestBody: {
          type: 'user',
          role: 'writer', // Read + Write access
          emailAddress: email,
        },
        sendNotificationEmail: false, // Don't spam team with emails
      })
    } catch (error: any) {
      // Ignore if already shared or user doesn't exist
      if (error.code !== 409) {
        console.error(`Failed to share with ${email}:`, error.message)
      }
    }
  })

  await Promise.all(sharePromises)
}

/**
 * Download file from user's Google Drive
 */
export async function downloadFromUserDrive(
  userId: string,
  driveFileId: string
): Promise<ReadableStream> {
  const drive = await getDriveClient(userId)

  const response = await drive.files.get(
    {
      fileId: driveFileId,
      alt: 'media',
    },
    {
      responseType: 'stream',
    }
  )

  return response.data as any
}

/**
 * Delete file from Google Drive
 */
export async function deleteFromUserDrive(
  userId: string,
  driveFileId: string
) {
  const drive = await getDriveClient(userId)

  await drive.files.delete({
    fileId: driveFileId,
  })
}

/**
 * Get file metadata from Google Drive
 */
export async function getFileMetadata(userId: string, driveFileId: string) {
  const drive = await getDriveClient(userId)

  const response = await drive.files.get({
    fileId: driveFileId,
    fields: 'id, name, mimeType, size, createdTime, modifiedTime, webViewLink',
  })

  return response.data
}
