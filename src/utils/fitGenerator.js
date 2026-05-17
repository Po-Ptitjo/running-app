/**
 * Générateur de fichiers .FIT pour les séances de fractionné
 * Format FIT (Flexible and Interoperable Data Transfer) de Garmin
 * Compatible Garmin Connect, Wahoo, Polar Flow, etc.
 */

// ── Helpers binaires ──────────────────────────────────────────────────────────

function writeUint8(view, offset, value) {
  view.setUint8(offset, value)
  return offset + 1
}

function writeUint16LE(view, offset, value) {
  view.setUint16(offset, value, true)
  return offset + 2
}

function writeUint32LE(view, offset, value) {
  view.setUint32(offset, value, true)
  return offset + 4
}

function crc16(data, offset = 0, length = data.byteLength - offset) {
  const CRC_TABLE = [
    0x0000, 0xCC01, 0xD801, 0x1400, 0xF001, 0x3C00, 0x2800, 0xE401,
    0xA001, 0x6C00, 0x7800, 0xB401, 0x5000, 0x9C01, 0x8801, 0x4400,
  ]
  let crc = 0
  const bytes = new Uint8Array(data)
  for (let i = offset; i < offset + length; i++) {
    let byte = bytes[i]
    let tmp = CRC_TABLE[crc & 0xF]
    crc = (crc >> 4) & 0x0FFF
    crc = crc ^ tmp ^ CRC_TABLE[byte & 0xF]
    tmp = CRC_TABLE[crc & 0xF]
    crc = (crc >> 4) & 0x0FFF
    crc = crc ^ tmp ^ CRC_TABLE[(byte >> 4) & 0xF]
  }
  return crc
}

// ── Parsing du contenu de séance ─────────────────────────────────────────────

/**
 * Parse "10 × 1 min" → { reps: 10, workSeconds: 60 }
 * Parse "3 × 8 min"  → { reps: 3, workSeconds: 480 }
 * Parse "10 × 1min30"→ { reps: 10, workSeconds: 90 }
 * Parse "5 × 4 min"  → { reps: 5, workSeconds: 240 }
 * Parse "8 × 2 min"  → { reps: 8, workSeconds: 120 }
 */
export function parseIntervalContent(content) {
  if (!content) return null

  // Pattern: "N × Xmin30" ou "N × X min" ou "N x X min"
  const match = content.match(/(\d+)\s*[×x]\s*(\d+)(?:min(\d+)|['\s]*min(?:utes?)?)/i)
  if (!match) return null

  const reps = parseInt(match[1])
  const minutes = parseInt(match[2])
  const extraSeconds = match[3] ? parseInt(match[3]) : 0
  const workSeconds = minutes * 60 + extraSeconds

  return { reps, workSeconds }
}

/**
 * Parse la récupération : "1 min trot", "2 min récup", "1'15 récup"
 */
function parseRecovery(recovery) {
  if (!recovery) return 60 // default 1 min

  // Format "1'15"
  const min_sec = recovery.match(/(\d+)'(\d+)/)
  if (min_sec) return parseInt(min_sec[1]) * 60 + parseInt(min_sec[2])

  // Format "X min"
  const minMatch = recovery.match(/(\d+)\s*min/)
  if (minMatch) return parseInt(minMatch[1]) * 60

  return 60
}

/**
 * Parse l'allure "3'30–3'40/km" → vitesse moyenne en m/s
 */
function paceToMps(pace) {
  if (!pace) return 3.5 // ~4'45/km par défaut

  // Prend la première allure de la plage
  const match = pace.match(/(\d+)'(\d+)/)
  if (!match) return 3.5

  const totalSeconds = parseInt(match[1]) * 60 + parseInt(match[2])
  return 1000 / totalSeconds // m/s
}

// ── Construction du fichier FIT ───────────────────────────────────────────────

const FIT_EPOCH = 631065600 // diff entre Unix epoch et FIT epoch (31/12/1989)

function toFitTimestamp(date) {
  return Math.floor(date.getTime() / 1000) - FIT_EPOCH
}

/**
 * Génère un fichier .FIT pour une séance de fractionné
 *
 * @param {Object} session - La séance (SessionCard data)
 * @param {Date} workoutDate - Date prévue (lundi ou jeudi de la semaine courante)
 * @returns {Uint8Array} - Contenu binaire du fichier .FIT
 */
export function generateFitFile(session, workoutDate) {
  const parsed = parseIntervalContent(session.content)
  if (!parsed) throw new Error(`Impossible de parser: ${session.content}`)

  const { reps, workSeconds } = parsed
  const recoverySeconds = parseRecovery(session.recovery)
  const workSpeed = paceToMps(session.pace) // m/s
  const recSpeed = 1.5 // ~11 km/h trot de récupération

  const startTime = toFitTimestamp(workoutDate)
  const totalDuration = (workSeconds + recoverySeconds) * reps - recoverySeconds + 600 // +10min échauffement

  // ── Buffer de données ──────────────────────────────────────────────────────
  // On construit les messages FIT :
  // 0: File ID
  // 1: Workout
  // 2: Workout Steps (échauffement + N×(travail+récup) + retour au calme)
  // 3: Session (résumé)
  // 4: Activity

  const messages = []

  // ── Message File ID (mesg_num = 0) ────────────────────────────────────────
  // local_num=0, definition
  messages.push(buildFileIdDef())
  messages.push(buildFileIdData(startTime))

  // ── Message Workout (mesg_num = 26) ──────────────────────────────────────
  messages.push(buildWorkoutDef())
  messages.push(buildWorkoutData(session, reps, workSeconds, recoverySeconds))

  // ── Messages Workout Steps (mesg_num = 27) ────────────────────────────────
  messages.push(buildWorkoutStepDef())

  // Étape 0 : Échauffement 10 min
  messages.push(buildWarmupStep(0, 600))

  // Étapes 1…N : Travail + Récupération
  for (let i = 0; i < reps; i++) {
    messages.push(buildWorkStep(1 + i * 2, workSeconds, workSpeed, session))
    if (i < reps - 1) {
      messages.push(buildRecoveryStep(2 + i * 2, recoverySeconds, recSpeed))
    }
  }

  // Dernière étape : Retour au calme 5 min
  messages.push(buildCooldownStep(1 + reps * 2 - 1, 300))

  // ── Concaténer tous les messages ─────────────────────────────────────────
  const totalSize = messages.reduce((sum, m) => sum + m.byteLength, 0)
  const fileSize = 12 + totalSize + 2 // header (12) + data + CRC (2)

  const buffer = new ArrayBuffer(fileSize)
  const view = new DataView(buffer)

  // ── FIT File Header ───────────────────────────────────────────────────────
  let offset = 0
  offset = writeUint8(view, offset, 14)         // header size
  offset = writeUint8(view, offset, 0x10)       // protocol version 1.0
  offset = writeUint16LE(view, offset, 2140)    // profile version
  offset = writeUint32LE(view, offset, totalSize) // data size
  // ".FIT" signature
  view.setUint8(offset++, 0x2E)
  view.setUint8(offset++, 0x46)
  view.setUint8(offset++, 0x49)
  view.setUint8(offset++, 0x54)
  // Header CRC
  const headerCrc = crc16(buffer, 0, 12)
  offset = writeUint16LE(view, offset, headerCrc)

  // ── Messages ─────────────────────────────────────────────────────────────
  for (const msg of messages) {
    new Uint8Array(buffer).set(new Uint8Array(msg), offset)
    offset += msg.byteLength
  }

  // ── CRC final ────────────────────────────────────────────────────────────
  const fileCrc = crc16(buffer, 14, totalSize)
  writeUint16LE(view, offset, fileCrc)

  return new Uint8Array(buffer)
}

// ── Builders de messages FIT ─────────────────────────────────────────────────

function buildFileIdDef() {
  // Definition message: local_num=0, global_num=0 (File ID)
  // Fields: type(1), manufacturer(2), product(3), serial_number(4), time_created(7)
  const buf = new ArrayBuffer(12 + 5 * 3)
  const v = new DataView(buf)
  let o = 0
  v.setUint8(o++, 0x40)   // definition message, local num 0
  v.setUint8(o++, 0)      // reserved
  v.setUint8(o++, 0)      // little endian
  v.setUint16(o, 0, true); o += 2  // global mesg num = 0
  v.setUint8(o++, 5)      // num fields
  // field: num, size, base_type
  v.setUint8(o++, 0); v.setUint8(o++, 1); v.setUint8(o++, 0)   // type: enum
  v.setUint8(o++, 1); v.setUint8(o++, 2); v.setUint8(o++, 0x84) // manufacturer: uint16
  v.setUint8(o++, 2); v.setUint8(o++, 2); v.setUint8(o++, 0x84) // product: uint16
  v.setUint8(o++, 3); v.setUint8(o++, 4); v.setUint8(o++, 0x8C) // serial: uint32
  v.setUint8(o++, 7); v.setUint8(o++, 4); v.setUint8(o++, 0x86) // time_created: uint32
  return buf
}

function buildFileIdData(timestamp) {
  const buf = new ArrayBuffer(1 + 1 + 2 + 2 + 4 + 4)
  const v = new DataView(buf)
  let o = 0
  v.setUint8(o++, 0x00)                    // data message, local num 0
  v.setUint8(o++, 4)                       // type: workout (4)
  v.setUint16(o, 255, true); o += 2        // manufacturer: development (255)
  v.setUint16(o, 0, true); o += 2          // product: 0
  v.setUint32(o, 0, true); o += 4          // serial: 0
  v.setUint32(o, timestamp, true); o += 4  // time_created
  return buf
}

function buildWorkoutDef() {
  const buf = new ArrayBuffer(12 + 4 * 3)
  const v = new DataView(buf)
  let o = 0
  v.setUint8(o++, 0x41)   // definition, local num 1
  v.setUint8(o++, 0)
  v.setUint8(o++, 0)      // little endian
  v.setUint16(o, 26, true); o += 2  // global mesg = 26 (workout)
  v.setUint8(o++, 4)
  v.setUint8(o++, 4); v.setUint8(o++, 2); v.setUint8(o++, 0x84)  // sport: uint16
  v.setUint8(o++, 8); v.setUint8(o++, 4); v.setUint8(o++, 0x86)  // num_valid_steps: uint32
  v.setUint8(o++, 5); v.setUint8(o++, 16); v.setUint8(o++, 0x07) // wkt_name: string[16]
  v.setUint8(o++, 6); v.setUint8(o++, 4); v.setUint8(o++, 0x8C) // sub_sport
  return buf
}

function buildWorkoutData(session, reps, workSec, recSec) {
  const name = session.title.substring(0, 15).padEnd(16, '\0')
  const numSteps = reps * 2 + 1 // warmup + reps*(work+rec) + cooldown
  const buf = new ArrayBuffer(1 + 2 + 4 + 16 + 4)
  const v = new DataView(buf)
  let o = 0
  v.setUint8(o++, 0x01)                     // data, local num 1
  v.setUint16(o, 1, true); o += 2           // sport: running (1)
  v.setUint32(o, numSteps, true); o += 4    // num_valid_steps
  for (let i = 0; i < 16; i++) {
    v.setUint8(o++, name.charCodeAt(i) || 0)
  }
  v.setUint32(o, 0, true); o += 4           // sub_sport: generic (0)
  return buf
}

function buildWorkoutStepDef() {
  const buf = new ArrayBuffer(12 + 8 * 3)
  const v = new DataView(buf)
  let o = 0
  v.setUint8(o++, 0x42)   // definition, local num 2
  v.setUint8(o++, 0)
  v.setUint8(o++, 0)
  v.setUint16(o, 27, true); o += 2  // global mesg = 27 (workout_step)
  v.setUint8(o++, 8)
  // wkt_step_name(0): string[16]
  v.setUint8(o++, 0); v.setUint8(o++, 16); v.setUint8(o++, 0x07)
  // duration_type(1): enum
  v.setUint8(o++, 1); v.setUint8(o++, 1); v.setUint8(o++, 0x00)
  // duration_value(2): uint32
  v.setUint8(o++, 2); v.setUint8(o++, 4); v.setUint8(o++, 0x86)
  // target_type(3): enum
  v.setUint8(o++, 3); v.setUint8(o++, 1); v.setUint8(o++, 0x00)
  // target_value(4): uint32
  v.setUint8(o++, 4); v.setUint8(o++, 4); v.setUint8(o++, 0x86)
  // custom_target_low(5): uint32
  v.setUint8(o++, 5); v.setUint8(o++, 4); v.setUint8(o++, 0x86)
  // custom_target_high(6): uint32
  v.setUint8(o++, 6); v.setUint8(o++, 4); v.setUint8(o++, 0x86)
  // intensity(7): enum
  v.setUint8(o++, 7); v.setUint8(o++, 1); v.setUint8(o++, 0x00)
  return buf
}

function buildStep(stepName, durationSec, targetSpeedMps, intensity) {
  const name = stepName.substring(0, 15).padEnd(16, '\0')
  // duration in milliseconds (FIT uses ms for time-based duration)
  const durationMs = durationSec * 1000
  // speed in mm/s
  const speedMms = Math.round(targetSpeedMps * 1000)
  const buf = new ArrayBuffer(1 + 16 + 1 + 4 + 1 + 4 + 4 + 4 + 1)
  const v = new DataView(buf)
  let o = 0
  v.setUint8(o++, 0x02)                    // data, local num 2
  for (let i = 0; i < 16; i++) v.setUint8(o++, name.charCodeAt(i) || 0)
  v.setUint8(o++, 0)                       // duration_type: time (0)
  v.setUint32(o, durationMs, true); o += 4 // duration_value
  v.setUint8(o++, 3)                       // target_type: speed (3)
  v.setUint32(o, speedMms, true); o += 4   // target_value (custom = 0)
  v.setUint32(o, Math.round(speedMms * 0.95), true); o += 4 // custom_low
  v.setUint32(o, Math.round(speedMms * 1.05), true); o += 4 // custom_high
  v.setUint8(o++, intensity)               // intensity: 0=active, 1=rest, 2=warmup, 3=cooldown
  return buf
}

function buildWarmupStep(index, durationSec) {
  return buildStep('Echauffement', durationSec, 2.5, 2) // ~6:40/km, warmup
}

function buildWorkStep(index, durationSec, speed, session) {
  const label = `Effort ${index > 0 ? Math.ceil(index / 2) : 1}`
  return buildStep(label, durationSec, speed, 0) // active
}

function buildRecoveryStep(index, durationSec, speed) {
  return buildStep('Récupération', durationSec, speed, 1) // rest
}

function buildCooldownStep(index, durationSec) {
  return buildStep('Retour calme', durationSec, 2.2, 3) // ~7:30/km, cooldown
}

// ── Téléchargement ────────────────────────────────────────────────────────────

/**
 * Génère et télécharge le fichier .FIT pour une séance
 */
export function downloadFitFile(session, workoutDate) {
  const bytes = generateFitFile(session, workoutDate)
  const blob = new Blob([bytes], { type: 'application/octet-stream' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url

  const dateStr = workoutDate.toISOString().split('T')[0]
  const safeName = session.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  a.download = `runpace-${safeName}-${dateStr}.fit`
  a.click()
  URL.revokeObjectURL(url)
}

/**
 * Calcule la date du prochain lundi ou jeudi de la semaine actuelle
 * @param {'Lundi'|'Jeudi'} day
 */
export function getWeekDayDate(dayName) {
  const now = new Date()
  const currentDay = now.getDay() // 0=dimanche, 1=lundi, ..., 4=jeudi
  const target = dayName === 'Lundi' ? 1 : 4

  let diff = target - currentDay
  // Si on est déjà passé ce jour ou c'est aujourd'hui → prendre cette semaine (ou aujourd'hui)
  // On ancre toujours sur la semaine ISO courante (lundi)
  const monday = new Date(now)
  monday.setDate(now.getDate() - (currentDay === 0 ? 6 : currentDay - 1))
  monday.setHours(7, 0, 0, 0)

  const result = new Date(monday)
  result.setDate(monday.getDate() + (target - 1))
  return result
}

export const IS_INTERVAL_SESSION = (session) =>
  session?.type === 'vma' || session?.type === 'seuil' || session?.type === 'specifique'
