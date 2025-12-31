import fs from 'fs/promises'
import path from 'path'

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads'
const THUMBNAILS_DIR = process.env.THUMBNAILS_DIR || './public/thumbnails'

// Ensure directories exist
async function ensureDir(dir) {
  try {
    await fs.access(dir)
  } catch {
    await fs.mkdir(dir, { recursive: true })
  }
}

// Save uploaded file
export async function saveFile(buffer, filename, subdir = '') {
  const dir = path.join(UPLOAD_DIR, subdir)
  await ensureDir(dir)
  
  const filepath = path.join(dir, filename)
  await fs.writeFile(filepath, buffer)
  
  return filepath
}

// Save thumbnail
export async function saveThumbnail(buffer, filename, bookId = '') {
  const dir = path.join(THUMBNAILS_DIR, bookId)
  await ensureDir(dir)
  
  const filepath = path.join(dir, filename)
  await fs.writeFile(filepath, buffer)
  
  // Return public URL path
  return `/thumbnails/${bookId}/${filename}`
}

// Read file
export async function readFile(filepath) {
  try {
    return await fs.readFile(filepath)
  } catch {
    return null
  }
}

// Delete file
export async function deleteFile(filepath) {
  try {
    await fs.unlink(filepath)
    return true
  } catch {
    return false
  }
}

// Check if file exists
export async function fileExists(filepath) {
  try {
    await fs.access(filepath)
    return true
  } catch {
    return false
  }
}

// List files in directory
export async function listFiles(dir) {
  try {
    const fullPath = path.join(UPLOAD_DIR, dir)
    const files = await fs.readdir(fullPath)
    return files
  } catch {
    return []
  }
}

// Get file stats
export async function getFileStats(filepath) {
  try {
    const stats = await fs.stat(filepath)
    return {
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime,
    }
  } catch {
    return null
  }
}

// Save text content
export async function saveText(content, filename, subdir = '') {
  const dir = path.join(UPLOAD_DIR, subdir)
  await ensureDir(dir)
  
  const filepath = path.join(dir, filename)
  await fs.writeFile(filepath, content, 'utf-8')
  
  return filepath
}

// Read text content
export async function readText(filepath) {
  try {
    return await fs.readFile(filepath, 'utf-8')
  } catch {
    return null
  }
}
