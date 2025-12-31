// Avatar colors based on name
const colors = [
  '#E57373', '#F06292', '#BA68C8', '#9575CD', '#7986CB',
  '#64B5F6', '#4FC3F7', '#4DD0E1', '#4DB6AC', '#81C784',
  '#AED581', '#DCE775', '#FFD54F', '#FFB74D', '#FF8A65',
]

export function getAvatarColor(name) {
  if (!name) return colors[0]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

export function getInitial(name) {
  if (!name) return '?'
  return name.charAt(0).toUpperCase()
}

// Format date for Hebrew locale
export function formatDate(date, options = {}) {
  const d = new Date(date)
  return d.toLocaleDateString('he-IL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...options
  })
}

// Format file size
export function formatFileSize(bytes) {
  if (!bytes) return 'לא ידוע'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

// Sanitize filename
export function sanitizeFilename(name) {
  return name.replace(/[^a-zA-Z0-9א-ת._-]/g, '_')
}

// Generate safe book ID from name
export function generateBookId(name) {
  return name
    .replace(/[^a-zA-Z0-9א-ת]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
}

// Status configuration
export const statusConfig = {
  completed: {
    label: 'הושלם',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-300',
    icon: 'check_circle'
  },
  'in-progress': {
    label: 'בטיפול',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-300',
    icon: 'edit'
  },
  available: {
    label: 'זמין',
    color: 'text-gray-700',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-300',
    icon: 'description'
  }
}
