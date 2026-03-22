import { useEffect, useMemo, useRef, useState } from "react"
import { Link, useParams } from "react-router-dom"
import PostCard from "../components/PostCard"
import PostComposer from "../components/PostComposer"
import { uploadImageToCloudinary } from "../lib/cloudinary"
import { supabase } from "../lib/supabase"

const plannerSections = [
  { key: "daily", label: "Daily rhythm", description: "Repeatable routines and everyday proof." },
  { key: "weekly", label: "Weekly beats", description: "Tasks that hit on one recurring day each week." },
  { key: "monthly", label: "Monthly aims", description: "Longer arcs, milestones, and resets." },
  { key: "yearly", label: "Yearly vision", description: "Bigger ambitions and identity goals." },
  { key: "one-time", label: "One-time", description: "Single-run tasks and one-off milestones." },
]

const weekDayMeta = [
  { key: "mon", short: "Mon", long: "Monday" },
  { key: "tue", short: "Tue", long: "Tuesday" },
  { key: "wed", short: "Wed", long: "Wednesday" },
  { key: "thu", short: "Thu", long: "Thursday" },
  { key: "fri", short: "Fri", long: "Friday" },
  { key: "sat", short: "Sat", long: "Saturday" },
  { key: "sun", short: "Sun", long: "Sunday" },
]
const recurrenceWeekdays = [
  { value: "0", label: "Sunday" },
  { value: "1", label: "Monday" },
  { value: "2", label: "Tuesday" },
  { value: "3", label: "Wednesday" },
  { value: "4", label: "Thursday" },
  { value: "5", label: "Friday" },
  { value: "6", label: "Saturday" },
]
const recurrenceMonths = [
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
]
const checkInPresets = [
  { key: "done", label: "Done", template: "Done. Finished this and leaving proof here." },
  { key: "partial", label: "Partial", template: "Partial. I made progress, but it is not fully complete yet." },
  { key: "skipped", label: "Skipped", template: "Skipped today. Logging it honestly and resetting tomorrow." },
  { key: "moved", label: "Moved to tomorrow", template: "Moved to tomorrow. I am carrying this forward instead of forcing it." },
]
const legacyPresetTemplates = new Set(checkInPresets.map((preset) => preset.template))

function sanitizeLegacyPostCaptionDraft(value) {
  const text = String(value || "").trim()
  if (!text) return ""

  return text
    .split(/\n\s*\n/u)
    .map((section) => section.trim())
    .filter((section) => section && !legacyPresetTemplates.has(section))
    .join("\n\n")
}

function getBoardThemeKey(board) {
  const themeName = String(board?.theme_name || "").trim().toLowerCase()
  const title = String(board?.title || "").trim().toLowerCase()

  if (
    themeName === "emerald" ||
    themeName === "emeraldsky" ||
    title.includes("emerald")
  ) {
    return "emeraldsky"
  }

  if (themeName === "falgras" || title.includes("falgras")) {
    return "falgras"
  }

  if (themeName === "hex" || title.includes("hex")) {
    return "hex"
  }

  if (themeName === "mars" || title.includes("mars")) {
    return "mars"
  }

  return "paperblaze"
}

function getThemePresentation(themeKey, board) {
  if (themeKey === "emeraldsky") {
    return {
      dataTheme: "emeraldsky",
      shellClass: "emeraldsky-shell",
      panelClass: "emeraldsky-panel",
      cardClass: "emeraldsky-card",
      coverBackground:
        "radial-gradient(circle at 14% 18%, rgba(255,205,226,0.5), transparent 18%), radial-gradient(circle at 86% 20%, rgba(177,221,255,0.52), transparent 18%), linear-gradient(135deg, rgba(255,248,251,0.94), rgba(238,245,255,0.94))",
      heroCopy:
        "A pastel planner-journal where routines, proof, and soft accountability live together.",
      detailCopy:
        "This realm leans into check-ins, visual proof, and a dreamy planning surface that can grow into routines and calendar views.",
      orbBackground: "linear-gradient(135deg, #f0c8d7, #9fc7eb, #a9d4f3)",
    }
  }

  if (themeKey === "falgras") {
    return {
      dataTheme: "falgras",
      shellClass: "falgras-shell",
      panelClass: "falgras-panel",
      cardClass: "falgras-card",
      coverBackground:
        "radial-gradient(circle at 18% 14%, rgba(119,169,194,0.18), transparent 18%), radial-gradient(circle at 84% 20%, rgba(185,162,122,0.1), transparent 16%), linear-gradient(160deg, rgba(17,45,58,0.96), rgba(24,58,74,0.96))",
      heroCopy:
        "A calm shrine for routines, personal objectives, and proof-driven check-ins.",
      detailCopy:
        "This board works best like a reflective planner: quiet, structured, and designed for consistency with visible receipts.",
      orbBackground: "linear-gradient(135deg, #77a9c2, #5d8fa3, #b9a27a)",
    }
  }

  if (themeKey === "hex") {
    return {
      dataTheme: "hex",
      shellClass: "hex-shell",
      panelClass: "hex-panel",
      cardClass: "hex-card",
      coverBackground:
        "radial-gradient(circle at 18% 14%, rgba(182,43,58,0.14), transparent 16%), radial-gradient(circle at 84% 22%, rgba(207,213,163,0.2), transparent 16%), radial-gradient(circle at 24% 82%, rgba(170,182,140,0.12), transparent 20%), radial-gradient(circle at 58% 12%, rgba(244,239,230,0.08), transparent 18%), linear-gradient(160deg, rgba(74,54,50,0.97), rgba(96,74,67,0.96))",
      heroCopy:
        "A hedge-witch dashboard for habits, receipts, and suspiciously well-documented progress.",
      detailCopy:
        "Hex works as a sharp personal planner with routine cards, proof posts, and room for others to question the evidence.",
      orbBackground: "linear-gradient(135deg, #f3eee4, #cfd5a3, #b62b3a)",
    }
  }

  if (themeKey === "mars") {
    return {
      dataTheme: "mars",
      shellClass: "mars-shell",
      panelClass: "mars-panel",
      cardClass: "mars-card",
      coverBackground:
        "radial-gradient(circle at 18% 14%, rgba(240,74,106,0.18), transparent 14%), radial-gradient(circle at 84% 18%, rgba(196,92,255,0.18), transparent 18%), linear-gradient(160deg, rgba(29,13,41,0.97), rgba(49,20,70,0.96))",
      heroCopy:
        "A dramatic ritual-planner for objectives, check-ins, and public accountability.",
      detailCopy:
        "Mars is built like a spellbook dashboard: bold objectives, visual proof, and commentary from everyone watching.",
      orbBackground: "linear-gradient(135deg, #b3122f, #f04a6a, #c45cff)",
    }
  }

  return {
    dataTheme: "paperblaze",
    shellClass: "paper-shell",
    panelClass: "paper-panel",
    cardClass: "paper-card",
    coverBackground:
      "linear-gradient(160deg, rgba(255,252,245,0.96), rgba(247,241,227,0.96))",
    heroCopy:
      "A warm shared planner-journal for routines, proof posts, and collaborative accountability.",
    detailCopy:
      "This board can grow into a full personal system: objectives, recurring habits, check-ins, and community verification.",
    orbBackground:
      board?.accent_color || "linear-gradient(135deg, #e4d3b2, #b97a56)",
  }
}

function formatDate(value) {
  if (!value) return "Just now"
  return new Date(value).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

function getAuthorLabel(profile, fallback = "Unknown user") {
  return profile?.display_name || profile?.username || fallback
}

function getInitials(profile, fallback = "U") {
  const label = getAuthorLabel(profile, fallback).trim()
  if (!label) return fallback
  return label
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("")
}

function getAvatarUrl(profile) {
  const rawUrl = String(profile?.avatar_url || "").trim()
  if (!rawUrl) return ""

  const fileMatch = rawUrl.match(/\/file\/d\/([^/]+)/)
  if (fileMatch?.[1]) {
    return `https://drive.google.com/thumbnail?id=${fileMatch[1]}&sz=w256`
  }

  const openMatch = rawUrl.match(/[?&]id=([^&]+)/)
  if (rawUrl.includes("drive.google.com") && openMatch?.[1]) {
    return `https://drive.google.com/thumbnail?id=${openMatch[1]}&sz=w256`
  }

  return rawUrl
}

function extractReviewDecision(content) {
  const text = String(content || "").trim()
  if (!text) return { decision: "", body: "" }
  if (text.startsWith("Enough proof: Yes.")) {
    return {
      decision: "yes",
      body: text.replace(/^Enough proof: Yes\.\s*/u, "").trim(),
    }
  }
  if (text.startsWith("Enough proof: No.")) {
    return {
      decision: "no",
      body: text.replace(/^Enough proof: No\.\s*/u, "").trim(),
    }
  }
  return { decision: "", body: text }
}

function getRelativeTimeLabel(value) {
  if (!value) return "No activity yet"

  const diffMs = Date.now() - new Date(value).getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffHours < 1) return "Posted now"
  if (diffHours < 24) return `Posted ${diffHours}h ago`
  return `Posted ${diffDays}d ago`
}

function getPendingReviewCount(commentsByPost, posts) {
  return posts.filter((post) => (commentsByPost[post.id] ?? []).length === 0).length
}

function getUpcomingLabel(task) {
  if (!task?.created_at) return "Added recently"

  const createdAt = new Date(task.created_at)
  const daysSince = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24))

  if (daysSince <= 1) return "Added this week"
  if (daysSince <= 7) return "In current rotation"
  return "Longer-running objective"
}

function normalizeTaskType(type) {
  return type === "one_time" ? "one-time" : type
}

function serializeTaskType(type) {
  return type === "one-time" ? "one_time" : type
}

function serializeCheckinState(state) {
  if (state === "moved") return "moved_to_tomorrow"
  return state || null
}

function formatTaskTypeLabel(type) {
  const normalized = normalizeTaskType(type)
  if (normalized === "one-time") return "One-time"
  if (normalized === "weekly") return "Weekly"
  if (!normalized) return "Unknown"
  return normalized
}

function getGoalTitle(goal, fallback = "Standalone task") {
  return goal?.title?.trim() || fallback
}

function formatDeadline(value) {
  if (!value) return "No deadline"

  return new Date(`${value}T00:00:00`).toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function getOrderedPostImages(post) {
  const gallery = Array.isArray(post?.post_images) ? [...post.post_images] : []

  if (gallery.length > 0) {
    return gallery.sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
  }

  if (post?.image_url) {
    return [
      {
        id: `${post.id}-legacy-image`,
        image_url: post.image_url,
        display_order: 0,
      },
    ]
  }

  return []
}

function getCadenceWindowDays(type) {
  const normalized = normalizeTaskType(type)
  if (normalized === "daily") return 1
  if (normalized === "weekly") return 7
  if (normalized === "monthly") return 30
  if (normalized === "yearly") return 365
  if (normalized === "one-time") return 3650
  return 7
}

function getCadenceLabel(type) {
  const normalized = normalizeTaskType(type)
  if (normalized === "daily") return "Due today"
  if (normalized === "weekly") return "Due this week"
  if (normalized === "monthly") return "Due this month"
  if (normalized === "yearly") return "Due this year"
  if (normalized === "one-time") return "One-time task"
  return "Upcoming"
}

function getDefaultTaskScheduleDraft(referenceDate = new Date()) {
  return {
    startDate: "",
    endMode: "never",
    endDate: "",
    specificDate: "",
    dayOfWeek: `${referenceDate.getDay()}`,
    dayOfMonth: `${referenceDate.getDate()}`,
    monthOfYear: `${referenceDate.getMonth() + 1}`,
  }
}

function getPrimaryRecurrence(task) {
  if (Array.isArray(task?.recurrence)) return task.recurrence[0] ?? null
  return task?.recurrence ?? null
}

function getTaskScheduleDraft(task) {
  const recurrence = getPrimaryRecurrence(task)

  return {
    startDate: task?.start_date || "",
    endMode: task?.end_date ? "on_date" : "never",
    endDate: task?.end_date || "",
    specificDate: task?.specific_date || "",
    dayOfWeek: recurrence?.day_of_week != null ? `${recurrence.day_of_week}` : "1",
    dayOfMonth: recurrence?.day_of_month != null ? `${recurrence.day_of_month}` : "1",
    monthOfYear: recurrence?.month_of_year != null ? `${recurrence.month_of_year}` : "1",
  }
}

function getTaskRangeDates(task) {
  const startDate = task?.start_date ? new Date(`${task.start_date}T00:00:00`) : null
  const endDate = task?.end_date ? new Date(`${task.end_date}T00:00:00`) : null
  const specificDate = task?.specific_date ? new Date(`${task.specific_date}T00:00:00`) : null

  return { startDate, endDate, specificDate }
}

function isTaskScheduledForDate(task, targetDate) {
  if (!task || task.is_paused) return false

  const normalizedType = normalizeTaskType(task.type)
  const candidate = new Date(targetDate)
  candidate.setHours(0, 0, 0, 0)

  const { startDate, endDate, specificDate } = getTaskRangeDates(task)

  if (specificDate) {
    return specificDate.getTime() === candidate.getTime()
  }

  if (startDate && candidate < startDate) return false
  if (endDate && candidate > endDate) return false

  if (normalizedType === "daily") return true

  const recurrence = getPrimaryRecurrence(task)

  if (normalizedType === "weekly") {
    return recurrence?.day_of_week != null && candidate.getDay() === recurrence.day_of_week
  }

  if (normalizedType === "monthly") {
    return recurrence?.day_of_month != null && candidate.getDate() === recurrence.day_of_month
  }

  if (normalizedType === "yearly") {
    return (
      recurrence?.day_of_month != null &&
      recurrence?.month_of_year != null &&
      candidate.getDate() === recurrence.day_of_month &&
      candidate.getMonth() + 1 === recurrence.month_of_year
    )
  }

  if (normalizedType === "one-time") {
    return false
  }

  return false
}

function getCalendarTaskStatus(task, post, commentsByPost, targetDate, referenceDate = new Date()) {
  if (post) {
    const comments = commentsByPost[post.id] ?? []

    if (comments.length === 0) {
      return {
        label: "Awaiting review",
        tone: "badge-warning",
        detail: getRelativeTimeLabel(post.created_at),
      }
    }

    return {
      label: `Verified by ${comments.length}`,
      tone: "badge-success",
      detail: `Logged ${formatDate(post.created_at)}`,
    }
  }

  const targetKey = getLocalDateKey(targetDate)
  const referenceKey = getLocalDateKey(referenceDate)

  if (targetKey === referenceKey) {
    return {
      label: "No proof yet",
      tone: "badge-ghost",
      detail: getCadenceLabel(task.type),
    }
  }

  if (new Date(targetDate).getTime() < new Date(referenceDate).setHours(0, 0, 0, 0)) {
    return {
      label: "Needs fresh proof",
      tone: "badge-outline",
      detail: "No proof logged for this scheduled day",
    }
  }

  return {
    label: "Scheduled",
    tone: "badge-ghost",
    detail: "Upcoming scheduled occurrence",
  }
}

function getTaskPayload(taskType, taskGoalId, scheduleDraft) {
  const normalizedType = normalizeTaskType(taskType)

  return {
    type: serializeTaskType(taskType),
    goal_id: taskGoalId || null,
    start_date: normalizedType === "one-time" ? null : scheduleDraft.startDate || null,
    end_date:
      normalizedType === "one-time" || scheduleDraft.endMode !== "on_date"
        ? null
        : scheduleDraft.endDate || null,
    specific_date: normalizedType === "one-time" ? scheduleDraft.specificDate || null : null,
  }
}

function getTaskRecurrencePayload(taskType, scheduleDraft) {
  const normalizedType = normalizeTaskType(taskType)

  if (normalizedType === "weekly") {
    return {
      recurrence_type: "weekly",
      day_of_week: Number(scheduleDraft.dayOfWeek),
      day_of_month: null,
      month_of_year: null,
    }
  }

  if (normalizedType === "monthly") {
    return {
      recurrence_type: "monthly",
      day_of_week: null,
      day_of_month: Number(scheduleDraft.dayOfMonth),
      month_of_year: null,
    }
  }

  if (normalizedType === "yearly") {
    return {
      recurrence_type: "yearly",
      day_of_week: null,
      day_of_month: Number(scheduleDraft.dayOfMonth),
      month_of_year: Number(scheduleDraft.monthOfYear),
    }
  }

  return null
}

function getRecurrenceErrorMessage(error, taskType) {
  const message = error?.message || "Could not save the task schedule."

  if (!message.toLowerCase().includes("row-level security policy")) {
    return message
  }

  const normalizedType = normalizeTaskType(taskType)

  if (normalizedType === "weekly" || normalizedType === "monthly" || normalizedType === "yearly") {
    return "Recurring tasks are being blocked by the database policy for task_recurrence. If this task is only for today, switch it to One-time. Otherwise, update the Supabase RLS policy for task_recurrence and try again."
  }

  return "The database blocked the schedule settings for this task. If this is only for today, switch it to One-time. Otherwise, update the Supabase RLS policy for task_recurrence and try again."
}

function getNearestScheduledDate(task, referenceDate = new Date(), direction = -1, maxDays = 730) {
  const cursor = new Date(referenceDate)
  cursor.setHours(0, 0, 0, 0)

  for (let step = 0; step <= maxDays; step += 1) {
    if (isTaskScheduledForDate(task, cursor)) {
      return new Date(cursor)
    }
    cursor.setDate(cursor.getDate() + direction)
  }

  return null
}

function getQueueSortTime(task, status, referenceDate = new Date()) {
  if (status.label === "Needs fresh proof") {
    return getNearestScheduledDate(task, referenceDate, -1)?.getTime() ?? Number.POSITIVE_INFINITY
  }

  if (status.label === "No proof yet") {
    return getNearestScheduledDate(task, referenceDate, 1)?.getTime() ?? Number.POSITIVE_INFINITY
  }

  return new Date(task.created_at).getTime()
}

function isSameDateString(value, comparisonDate = new Date()) {
  if (!value) return false
  const target = new Date(value)
  return (
    target.getFullYear() === comparisonDate.getFullYear() &&
    target.getMonth() === comparisonDate.getMonth() &&
    target.getDate() === comparisonDate.getDate()
  )
}

function getLocalDateKey(value) {
  const target = new Date(value)
  const month = `${target.getMonth() + 1}`.padStart(2, "0")
  const day = `${target.getDate()}`.padStart(2, "0")
  return `${target.getFullYear()}-${month}-${day}`
}

function getWeekStartDate(referenceDate = new Date()) {
  const start = new Date(referenceDate)
  start.setHours(0, 0, 0, 0)
  const dayOfWeek = start.getDay()
  const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  start.setDate(start.getDate() - mondayOffset)
  return start
}

function getWeekdayDate(index, referenceDate = new Date()) {
  const date = getWeekStartDate(referenceDate)
  date.setDate(date.getDate() + index)
  return date
}

function getStatusPriority(label) {
  if (label === "No proof yet") return 0
  if (label === "Awaiting review") return 1
  if (label === "Needs fresh proof") return 2
  if (label.startsWith("Verified by")) return 3
  return 4
}

function getTaskPostMap(posts) {
  return posts.reduce((acc, post) => {
    if (!post.task_id) return acc
    if (!acc[post.task_id]) {
      acc[post.task_id] = []
    }
    acc[post.task_id].push(post)
    return acc
  }, {})
}

function getTaskStatus(task, taskPosts, commentsByPost) {
  const normalizedTaskType = normalizeTaskType(task.type)
  const latestPost = taskPosts?.[0] ?? null

  if (!latestPost) {
    return {
      label: "No proof yet",
      tone: "badge-ghost",
      detail: getCadenceLabel(task.type),
    }
  }

  const comments = commentsByPost[latestPost.id] ?? []
  const latestPostDate = new Date(latestPost.created_at)
  const isToday = isSameDateString(latestPost.created_at)
  const weekStart = getWeekStartDate(new Date())
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 6)
  weekEnd.setHours(23, 59, 59, 999)
  const isCurrentWeek = latestPostDate >= weekStart && latestPostDate <= weekEnd
  const isCurrentMonth =
    latestPostDate.getFullYear() === new Date().getFullYear() &&
    latestPostDate.getMonth() === new Date().getMonth()
  const isCurrentYear = latestPostDate.getFullYear() === new Date().getFullYear()

  if (comments.length === 0) {
    return {
      label: "Awaiting review",
      tone: "badge-warning",
      detail: getRelativeTimeLabel(latestPost.created_at),
    }
  }

  if (
    (normalizedTaskType === "daily" && isToday) ||
    (normalizedTaskType === "weekly" && isCurrentWeek) ||
    (normalizedTaskType === "monthly" && isCurrentMonth) ||
    (normalizedTaskType === "yearly" && isCurrentYear) ||
    normalizedTaskType === "one-time"
  ) {
    return {
      label: `Verified by ${comments.length}`,
      tone: "badge-success",
      detail:
        normalizedTaskType === "daily"
          ? "Completed today"
          : normalizedTaskType === "weekly"
            ? "Completed this week"
            : "Completed this cycle",
    }
  }

  return {
    label: "Needs fresh proof",
    tone: "badge-outline",
    detail:
      normalizedTaskType === "daily"
        ? "Overdue today"
        : normalizedTaskType === "weekly"
          ? "Overdue this week"
          : `Overdue for ${formatTaskTypeLabel(normalizedTaskType).toLowerCase()} cadence`,
  }
}

function getBoardReminders(tasks, taskPosts, commentsByPost, posts) {
  const reminders = []

  const dailyTasks = tasks.filter((task) => normalizeTaskType(task.type) === "daily")
  const missingDaily = dailyTasks.filter((task) => {
    const latestPost = (taskPosts[task.id] ?? [])[0]
    if (!latestPost) return true
    const ageHours = (Date.now() - new Date(latestPost.created_at).getTime()) / (1000 * 60 * 60)
    return ageHours > 24
  })

  if (missingDaily.length > 0) {
    reminders.push(`You have ${missingDaily.length} daily routine${missingDaily.length > 1 ? "s" : ""} without fresh proof.`)
  }

  const unreviewedPosts = posts.filter((post) => (commentsByPost[post.id] ?? []).length === 0).length

  if (unreviewedPosts > 0) {
    reminders.push(`${unreviewedPosts} check-in${unreviewedPosts > 1 ? "s" : ""} are still awaiting feedback.`)
  }

  return reminders
}

function getDerivedBoardStats(posts, tasks, commentsByPost, ownerId, referenceDate = new Date()) {
  if (!ownerId) {
    return {
      current_streak: 0,
      longest_streak: 0,
      total_checkins: 0,
      checkins_this_week: 0,
      checkins_this_month: 0,
      last_checkin_date: null,
    }
  }

  const taskTypeById = tasks.reduce((acc, task) => {
    acc[task.id] = normalizeTaskType(task.type)
    return acc
  }, {})

  const effectiveDailyMap = new Map()

  posts.forEach((post) => {
    if (post.user_id !== ownerId) return
    if (taskTypeById[post.task_id] !== "daily") return
    if (!post.checkin_state) return

    const comments = commentsByPost[post.id] ?? []
    const hasPeerReview = comments.some((comment) => comment.user_id !== post.user_id)
    if (!hasPeerReview) return

    const outcomeDate = new Date(post.created_at)
    outcomeDate.setHours(0, 0, 0, 0)
    const dateKey = outcomeDate.toISOString().slice(0, 10)
    const existing = effectiveDailyMap.get(dateKey)

    if (
      !existing ||
      new Date(post.created_at).getTime() > new Date(existing.created_at).getTime()
    ) {
      effectiveDailyMap.set(dateKey, {
        outcome_date: outcomeDate,
        checkin_state: post.checkin_state,
        created_at: post.created_at,
      })
    }
  })

  const effectiveDaily = [...effectiveDailyMap.values()].sort(
    (a, b) => a.outcome_date - b.outcome_date
  )

  const today = new Date(referenceDate)
  today.setHours(0, 0, 0, 0)

  const weekStart = new Date(today)
  const dayOfWeek = weekStart.getDay()
  const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  weekStart.setDate(weekStart.getDate() - mondayOffset)

  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)

  const totalCheckins = effectiveDaily.length
  const checkinsThisWeek = effectiveDaily.filter(({ outcome_date }) => outcome_date >= weekStart).length
  const checkinsThisMonth = effectiveDaily.filter(({ outcome_date }) => outcome_date >= monthStart).length
  const lastCheckinDate = effectiveDaily.at(-1)?.created_at ?? null

  let longestStreak = 0
  let run = 0
  let prevDate = null

  effectiveDaily.forEach((entry) => {
    if (prevDate) {
      const diffDays = Math.round((entry.outcome_date - prevDate) / (1000 * 60 * 60 * 24))
      if (diffDays > 1) run = 0
    }

    if (entry.checkin_state === "done" || entry.checkin_state === "partial") {
      run += 1
    } else if (entry.checkin_state === "skipped") {
      run = 0
    }

    if (run > longestStreak) longestStreak = run
    prevDate = entry.outcome_date
  })

  const todayKey = today.toISOString().slice(0, 10)
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayKey = yesterday.toISOString().slice(0, 10)
  const effectiveByDate = new Map(
    effectiveDaily.map((entry) => [entry.outcome_date.toISOString().slice(0, 10), entry])
  )

  const anchorKey = effectiveByDate.has(todayKey)
    ? todayKey
    : effectiveByDate.has(yesterdayKey)
      ? yesterdayKey
      : ""

  let currentStreak = 0

  if (anchorKey) {
    let cursor = new Date(anchorKey)

    while (true) {
      const cursorKey = cursor.toISOString().slice(0, 10)
      const entry = effectiveByDate.get(cursorKey)
      if (!entry) break

      if (entry.checkin_state === "done" || entry.checkin_state === "partial") {
        currentStreak += 1
      } else if (entry.checkin_state === "skipped") {
        currentStreak = 0
        break
      }

      cursor.setDate(cursor.getDate() - 1)
      const previousKey = cursor.toISOString().slice(0, 10)
      if (!effectiveByDate.has(previousKey)) break
    }
  }

  return {
    current_streak: currentStreak,
    longest_streak: longestStreak,
    total_checkins: totalCheckins,
    checkins_this_week: checkinsThisWeek,
    checkins_this_month: checkinsThisMonth,
    last_checkin_date: lastCheckinDate,
  }
}

function getCurrentStreak(posts, ownerId) {
  const ownerPosts = posts.filter((post) => post.user_id === ownerId)
  if (!ownerPosts.length) return 0

  const uniqueDays = [...new Set(ownerPosts.map((post) => new Date(post.created_at).toDateString()))]
    .map((day) => new Date(day))
    .sort((a, b) => b - a)

  let streak = 0
  let cursor = new Date()
  cursor.setHours(0, 0, 0, 0)

  for (const day of uniqueDays) {
    day.setHours(0, 0, 0, 0)
    const diffDays = Math.round((cursor - day) / (1000 * 60 * 60 * 24))
    if (diffDays === 0) {
      streak += 1
      cursor.setDate(cursor.getDate() - 1)
      continue
    }
    if (streak === 0 && diffDays === 1) {
      streak += 1
      cursor.setDate(cursor.getDate() - 2)
      continue
    }
    break
  }

  return streak
}

function getMonthGrid(date) {
  const year = date.getFullYear()
  const month = date.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startOffset = firstDay.getDay()
  const totalCells = 35
  const cells = []

  for (let index = 0; index < totalCells; index += 1) {
    const dayNumber = index - startOffset + 1
    const cellDate = new Date(year, month, dayNumber)
    cells.push({
      key: `${year}-${month}-${index}`,
      label: cellDate.getDate(),
      isCurrentMonth: cellDate.getMonth() === month,
      isToday:
        cellDate.getDate() === date.getDate() &&
        cellDate.getMonth() === month &&
        cellDate.getFullYear() === year,
    })
  }

  return cells
}

function getStatusMeta(statusLabel) {
  if (statusLabel === "No proof yet") {
    return {
      cardClass: "border-warning/50 bg-warning/12",
      indicatorClass: "bg-warning text-warning-content",
      icon: "!",
    }
  }

  if (statusLabel === "Awaiting review") {
    return {
      cardClass: "border-info/45 bg-info/10",
      indicatorClass: "bg-info text-info-content",
      icon: "?",
    }
  }

  if (statusLabel === "Needs fresh proof") {
    return {
      cardClass: "border-error/55 bg-error/12",
      indicatorClass: "bg-error text-error-content",
      icon: "!",
    }
  }

  return {
    cardClass: "border-success/45 bg-success/12",
    indicatorClass: "bg-success text-success-content",
    icon: "✓",
  }
}

function getQueueSummary(items) {
  return items.reduce(
    (acc, item) => {
      if (item.status.label === "Needs fresh proof") acc.overdue += 1
      if (item.status.label === "Awaiting review") acc.awaitingReview += 1
      if (item.status.label === "No proof yet") acc.awaitingCheckIn += 1
      if (item.status.label.startsWith("Verified by")) acc.verified += 1
      return acc
    },
    { overdue: 0, awaitingReview: 0, awaitingCheckIn: 0, verified: 0 }
  )
}

function isVerifiedStatusLabel(label) {
  return label.startsWith("Verified by")
}

function getLiveQueueBadgeLabel(queueSummary, itemCount, hasRoutines) {
  if (queueSummary.overdue > 0) return `${queueSummary.overdue} overdue`
  if (queueSummary.awaitingReview > 0) return `${queueSummary.awaitingReview} needs review`
  if (queueSummary.awaitingCheckIn > 0) {
    return `${queueSummary.awaitingCheckIn} awaiting proof`
  }
  if (hasRoutines) return "Queue is clear"
  return `${itemCount} routine${itemCount === 1 ? "" : "s"}`
}

function getQueueActionLabel(statusLabel) {
  if (statusLabel === "Awaiting review") return "Review proof"
  if (statusLabel === "Needs fresh proof") return "Refresh proof"
  if (statusLabel === "No proof yet") return "Post proof"
  return "Open routine"
}

function getReviewActivityLabel(reviewCount, latestReviewedAt) {
  if (reviewCount > 0 && latestReviewedAt) {
    return `Last reviewed ${getRelativeTimeLabel(latestReviewedAt).replace("Posted ", "")}`
  }
  if (reviewCount > 0) return `Reviewed by ${reviewCount}`
  return "Awaiting first review"
}

function getStreakFireStyle(isActive) {
  return {
    color: isActive
      ? "var(--color-primary)"
      : "color-mix(in srgb, var(--color-base-content) 34%, transparent)",
    filter: isActive
      ? "drop-shadow(0 0 10px color-mix(in srgb, var(--color-primary) 45%, transparent))"
      : "none",
  }
}

function FlameIcon({ active, className = "h-5 w-5" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      style={getStreakFireStyle(active)}
      fill="none"
    >
      <path
        d="M12 1.9c.5 2-.1 3.8-1.1 5.4-.7 1.1-1.6 2.2-1.6 3.8 0 1.6 1 2.9 2.7 2.9 1.6 0 2.7-1.2 2.7-2.8 0-1-.4-1.8-.9-2.7 2.9 1.1 5.4 4.2 5.4 7.9 0 4.3-3.1 7.6-7.3 7.6-4.5 0-7.8-3.3-7.8-8 0-3.3 1.5-5.9 3.7-8.4 1.6-1.8 3.1-3.4 4.2-5.7Z"
        fill="currentColor"
      />
      <path
        d="M12.1 6.8c.3 1.1-.1 2.2-.7 3.1-.5.8-1 1.5-1 2.5 0 1.2.8 2.2 2 2.2 1.3 0 2.1-1 2.1-2.2 0-.8-.3-1.6-.7-2.3 1.8.9 3.2 2.7 3.2 5.1 0 2.9-2.1 4.9-4.9 4.9-3 0-5.1-2.2-5.1-5.2 0-2.2 1.1-4 2.5-5.6 1-1.2 1.9-2.2 2.6-3.8Z"
        fill="currentColor"
        opacity="0.58"
      />
      <path
        d="M12.4 10.6c.2.8-.1 1.5-.5 2.1-.4.5-.8 1-.8 1.8 0 .9.6 1.5 1.5 1.5.9 0 1.5-.7 1.5-1.6 0-.6-.2-1.1-.5-1.6-.3-.5-.7-1-.9-1.6-.1-.2-.2-.4-.3-.6Z"
        fill="white"
        opacity={active ? 0.32 : 0.18}
      />
    </svg>
  )
}

function AvatarBadge({
  profile,
  sizeClass = "h-10 w-10",
  textClass = "text-xs",
  backgroundClass = "bg-base-100",
}) {
  const [hasError, setHasError] = useState(false)
  const avatarUrl = getAvatarUrl(profile)
  const showImage = avatarUrl && !hasError

  return (
    <div className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full ${sizeClass} ${backgroundClass} ${textClass} font-semibold text-base-content`}>
      {showImage ? (
        <img
          src={avatarUrl}
          alt={getAuthorLabel(profile)}
          className="h-full w-full object-cover"
          onError={() => setHasError(true)}
        />
      ) : (
        <span>{getInitials(profile)}</span>
      )}
    </div>
  )
}

function TaskScheduleFields({ type, draft, onChange, disabled = false }) {
  const normalizedType = normalizeTaskType(type)

  if (normalizedType === "one-time") {
    return (
      <label className="grid gap-2">
        <span className="text-xs uppercase tracking-[0.18em] text-base-content/60">
          Date
        </span>
        <input
          type="date"
          value={draft.specificDate}
          onChange={(event) => onChange({ specificDate: event.target.value })}
          className="input input-bordered w-full bg-base-100"
          disabled={disabled}
        />
      </label>
    )
  }

  return (
    <>
      <div className="grid gap-3 lg:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-xs uppercase tracking-[0.18em] text-base-content/60">
            Starts
          </span>
          <input
            type="date"
            value={draft.startDate}
            onChange={(event) => onChange({ startDate: event.target.value })}
            className="input input-bordered w-full bg-base-100"
            disabled={disabled}
          />
        </label>

        <label className="grid gap-2">
          <span className="text-xs uppercase tracking-[0.18em] text-base-content/60">
            Ends
          </span>
          <select
            value={draft.endMode}
            onChange={(event) => onChange({ endMode: event.target.value })}
            className="select select-bordered w-full bg-base-100"
            disabled={disabled}
          >
            <option value="never">Never</option>
            <option value="on_date">On date</option>
          </select>
        </label>
      </div>

      {draft.endMode === "on_date" ? (
        <label className="grid gap-2">
          <span className="text-xs uppercase tracking-[0.18em] text-base-content/60">
            End date
          </span>
          <input
            type="date"
            value={draft.endDate}
            onChange={(event) => onChange({ endDate: event.target.value })}
            className="input input-bordered w-full bg-base-100"
            disabled={disabled}
          />
        </label>
      ) : null}

      {normalizedType === "weekly" ? (
        <label className="grid gap-2">
          <span className="text-xs uppercase tracking-[0.18em] text-base-content/60">
            Repeats on
          </span>
          <select
            value={draft.dayOfWeek}
            onChange={(event) => onChange({ dayOfWeek: event.target.value })}
            className="select select-bordered w-full bg-base-100"
            disabled={disabled}
          >
            {recurrenceWeekdays.map((day) => (
              <option key={day.value} value={day.value}>
                {day.label}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {normalizedType === "monthly" ? (
        <label className="grid gap-2">
          <span className="text-xs uppercase tracking-[0.18em] text-base-content/60">
            Day of month
          </span>
          <select
            value={draft.dayOfMonth}
            onChange={(event) => onChange({ dayOfMonth: event.target.value })}
            className="select select-bordered w-full bg-base-100"
            disabled={disabled}
          >
            {Array.from({ length: 31 }, (_, index) => (
              <option key={index + 1} value={`${index + 1}`}>
                {index + 1}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {normalizedType === "yearly" ? (
        <div className="grid gap-3 lg:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-xs uppercase tracking-[0.18em] text-base-content/60">
              Month
            </span>
            <select
              value={draft.monthOfYear}
              onChange={(event) => onChange({ monthOfYear: event.target.value })}
              className="select select-bordered w-full bg-base-100"
              disabled={disabled}
            >
              {recurrenceMonths.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2">
            <span className="text-xs uppercase tracking-[0.18em] text-base-content/60">
              Day
            </span>
            <select
              value={draft.dayOfMonth}
              onChange={(event) => onChange({ dayOfMonth: event.target.value })}
              className="select select-bordered w-full bg-base-100"
              disabled={disabled}
            >
              {Array.from({ length: 31 }, (_, index) => (
                <option key={index + 1} value={`${index + 1}`}>
                  {index + 1}
                </option>
              ))}
            </select>
          </label>
        </div>
      ) : null}
    </>
  )
}

export default function Board({ user }) {
  const { id } = useParams()
  const [board, setBoard] = useState(null)
  const [boardStats, setBoardStats] = useState(null)
  const [goals, setGoals] = useState([])
  const [tasks, setTasks] = useState([])
  const [posts, setPosts] = useState([])
  const [commentsByPost, setCommentsByPost] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [goalTitle, setGoalTitle] = useState("")
  const [goalDueDate, setGoalDueDate] = useState("")
  const [goalIsCompleted, setGoalIsCompleted] = useState(false)
  const [submittingGoal, setSubmittingGoal] = useState(false)
  const [taskTitle, setTaskTitle] = useState("")
  const [taskType, setTaskType] = useState("daily")
  const [taskGoalId, setTaskGoalId] = useState("")
  const [taskScheduleDraft, setTaskScheduleDraft] = useState(() => getDefaultTaskScheduleDraft())
  const [submittingTask, setSubmittingTask] = useState(false)
  const [postCaption, setPostCaption] = useState("")
  const [selectedPostFiles, setSelectedPostFiles] = useState([])
  const [postSubmitStage, setPostSubmitStage] = useState("idle")
  const selectedPostFilesRef = useRef([])
  const [selectedPreset, setSelectedPreset] = useState("")
  const [selectedTaskId, setSelectedTaskId] = useState("")
  const [submittingPost, setSubmittingPost] = useState(false)
  const [editingTaskId, setEditingTaskId] = useState("")
  const [taskEditDraft, setTaskEditDraft] = useState({
    title: "",
    type: "daily",
    goalId: "",
    ...getDefaultTaskScheduleDraft(),
  })
  const [savingTaskId, setSavingTaskId] = useState("")
  const [deletingTaskId, setDeletingTaskId] = useState("")
  const [commentDrafts, setCommentDrafts] = useState({})
  const [reviewDecisions, setReviewDecisions] = useState({})
  const [submittingCommentFor, setSubmittingCommentFor] = useState("")
  const [activeTab, setActiveTab] = useState("overview")
  const [routineFilter, setRoutineFilter] = useState("all")
  const [activeFeedIndex, setActiveFeedIndex] = useState(0)
  const [now, setNow] = useState(() => new Date())
  const [selectedDayIndex, setSelectedDayIndex] = useState(() => {
    const jsDay = new Date().getDay()
    return jsDay === 0 ? 6 : jsDay - 1
  })
  const [editingBoardCopy, setEditingBoardCopy] = useState(false)
  const [boardCopyDraft, setBoardCopyDraft] = useState({
    title: "",
    heroText: "",
    weekNote: "",
  })

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date())
    }, 1000)

    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    let isMounted = true

    async function loadBoardData() {
      setLoading(true)
      setError("")

      const boardResult = await supabase
        .from("boards")
        .select(`
          id,
          owner_id,
          title,
          description,
          hero_text,
          week_note,
          theme_name,
          accent_color,
          updated_at,
          created_at,
          owner:profiles!boards_owner_id_fkey (
            id,
            display_name,
            username
          )
        `)
        .eq("id", id)
        .single()

      if (boardResult.error) {
        if (isMounted) {
          setBoard(null)
          setError(boardResult.error.message)
          setLoading(false)
        }
        return
      }

      const goalsResult = await supabase
        .from("goals")
        .select("id, title, due_date, is_completed, created_at")
        .eq("board_id", id)
        .order("created_at", { ascending: true })

      const tasksResult = await supabase
        .from("tasks")
        .select(`
          id,
          title,
          type,
          created_at,
          start_date,
          end_date,
          specific_date,
          is_paused,
          goal_id,
          goal:goals (
            id,
            title
          ),
          recurrence:task_recurrence (
            id,
            recurrence_type,
            day_of_week,
            day_of_month,
            month_of_year
          )
        `)
        .eq("board_id", id)
        .order("created_at", { ascending: true })

      const postsResult = await supabase
      .from("posts")
        .select(`
          id,
          board_id,
          task_id,
          user_id,
          caption,
          image_url,
          checkin_state,
          updated_at,
          created_at,
          post_images (
            id,
            image_url,
            public_id,
            resource_type,
            format,
            bytes,
            width,
            height,
            display_order
          ),
          task:tasks!posts_task_id_fkey (
            id,
            title,
            type,
            goal_id,
            goal:goals (
              id,
              title
            )
          ),
          author:profiles!posts_user_id_fkey (
            id,
            display_name,
            username,
            avatar_url
          )
        `)
        .eq("board_id", id)
        .order("created_at", { ascending: false })

      let groupedComments = {}

      if (!postsResult.error && postsResult.data?.length) {
        const postIds = postsResult.data.map((post) => post.id)
        const commentsResult = await supabase
          .from("comments")
          .select(`
            id,
            post_id,
            user_id,
            content,
            created_at,
            author:profiles!comments_user_id_fkey (
              id,
              display_name,
              username,
              avatar_url
            )
          `)
          .in("post_id", postIds)
          .order("created_at", { ascending: true })

        if (!commentsResult.error) {
          groupedComments = (commentsResult.data ?? []).reduce((acc, comment) => {
            if (!acc[comment.post_id]) {
              acc[comment.post_id] = []
            }
            acc[comment.post_id].push(comment)
            return acc
          }, {})
        }
      }

      if (!isMounted) return

      setBoard(boardResult.data)
      setGoals(goalsResult.data ?? [])
      setTasks(tasksResult.data ?? [])
      setPosts(postsResult.data ?? [])
      setCommentsByPost(groupedComments)
      setSelectedTaskId((tasksResult.data ?? [])[0]?.id ?? "")

      if (goalsResult.error) {
        setError(goalsResult.error.message)
      } else if (tasksResult.error) {
        setError(tasksResult.error.message)
      } else if (postsResult.error) {
        setError(postsResult.error.message)
      } else {
        setError("")
      }

      const { error: rpcError } = await supabase.rpc("refresh_board_stats", {
        p_board_id: id,
      })

      if (!rpcError) {
        const statsResult = await supabase
          .from("board_stats")
          .select(`
            board_id,
            owner_id,
            current_streak,
            longest_streak,
            total_checkins,
            checkins_this_week,
            checkins_this_month,
            last_checkin_date,
            updated_at
          `)
          .eq("board_id", id)
          .maybeSingle()

        if (!statsResult.error) {
          setBoardStats(statsResult.data ?? null)
        }
      }

      setLoading(false)
    }

    loadBoardData()

    return () => {
      isMounted = false
    }
  }, [id])

  const ownerLabel = getAuthorLabel(board?.owner, "Unknown owner")
  const themeKey = getBoardThemeKey(board)
  const theme = useMemo(
    () => getThemePresentation(themeKey, board),
    [themeKey, board]
  )
  const isOwner = board?.owner_id === user?.id
  const taskGroups = useMemo(() => {
    return plannerSections.reduce((acc, section) => {
      acc[section.key] = tasks.filter((task) => normalizeTaskType(task.type) === section.key)
      return acc
    }, {})
  }, [tasks])
  const goalTaskCounts = useMemo(
    () =>
      tasks.reduce((acc, task) => {
        if (!task.goal_id) return acc
        acc[task.goal_id] = (acc[task.goal_id] ?? 0) + 1
        return acc
      }, {}),
    [tasks]
  )
  const totalComments = useMemo(
    () => Object.values(commentsByPost).flat().length,
    [commentsByPost]
  )
  const pendingReviewCount = useMemo(
    () => getPendingReviewCount(commentsByPost, posts),
    [commentsByPost, posts]
  )
  const latestPost = posts[0] ?? null
  const latestTask = tasks[tasks.length - 1] ?? null
  const hasRoutines = tasks.length > 0
  const hasProof = posts.length > 0
  const isEmptyBoard = !hasRoutines && !hasProof && pendingReviewCount === 0
  const upcomingTasks = useMemo(() => tasks.slice(0, 4), [tasks])
  const taskPosts = useMemo(() => getTaskPostMap(posts), [posts])
  const taskById = useMemo(
    () => new Map(tasks.map((task) => [task.id, task])),
    [tasks]
  )
  const thisWeekFocus = useMemo(
    () => plannerSections
      .map((section) => ({
        ...section,
        count: (taskGroups[section.key] ?? []).length,
        nextTask: (taskGroups[section.key] ?? [])[0] ?? null,
      }))
      .filter((section) => section.count > 0),
    [taskGroups]
  )
  const reminders = useMemo(
    () => getBoardReminders(tasks, taskPosts, commentsByPost, posts),
    [tasks, taskPosts, commentsByPost, posts]
  )
  const ownerLatestCaption = useMemo(() => {
    const ownerPost = posts.find((post) => post.user_id === user?.id && post.caption?.trim())
    return ownerPost?.caption || ""
  }, [posts, user?.id])
  const derivedBoardStats = useMemo(
    () => getDerivedBoardStats(posts, tasks, commentsByPost, board?.owner_id, now),
    [posts, tasks, commentsByPost, board?.owner_id, now]
  )
  const currentStreak = derivedBoardStats.current_streak
  const longestStreak = derivedBoardStats.longest_streak
  const checkinsThisWeek = derivedBoardStats.checkins_this_week
  const checkinsThisMonth = derivedBoardStats.checkins_this_month
  const totalDailyCheckins = derivedBoardStats.total_checkins
  const latestOwnerPostDate = useMemo(() => {
    const ownerPost = posts.find((post) => post.user_id === board?.owner_id)
    return ownerPost?.created_at ?? null
  }, [posts, board?.owner_id])
  const lastCheckinDate = derivedBoardStats.last_checkin_date
  const hasProofToday = isSameDateString(latestOwnerPostDate, now)
  const hasStreakCheckinToday = isSameDateString(lastCheckinDate, now)
  const streakIsActive = currentStreak > 0 && hasStreakCheckinToday
  const monthGrid = useMemo(() => getMonthGrid(now), [now])
  const liveQueueTasks = useMemo(
    () =>
      tasks
        .map((task) => ({
          task,
          status: getTaskStatus(task, taskPosts[task.id] ?? [], commentsByPost),
        }))
        .sort((a, b) => {
          const priorityDiff = getStatusPriority(a.status.label) - getStatusPriority(b.status.label)
          if (priorityDiff !== 0) return priorityDiff

          const sortTimeDiff =
            getQueueSortTime(a.task, a.status, now) - getQueueSortTime(b.task, b.status, now)
          if (sortTimeDiff !== 0) return sortTimeDiff

          return new Date(a.task.created_at).getTime() - new Date(b.task.created_at).getTime()
        })
        .slice(0, 5),
    [tasks, taskPosts, commentsByPost, now]
  )
  const queueSummary = useMemo(() => getQueueSummary(liveQueueTasks), [liveQueueTasks])
  const actionableQueueTasks = useMemo(
    () => liveQueueTasks.filter(({ status }) => !isVerifiedStatusLabel(status.label)),
    [liveQueueTasks]
  )
  const queueCounters = useMemo(
    () => ({
      dueToday: liveQueueTasks.filter(({ status }) => status.label === "No proof yet").length,
      overdue: liveQueueTasks.filter(({ status }) => status.label === "Needs fresh proof").length,
      awaitingReview: liveQueueTasks.filter(({ status }) => status.label === "Awaiting review").length,
    }),
    [liveQueueTasks]
  )
  const dueTodayCount = taskGroups.daily.length
  const pendingProofCount = useMemo(
    () =>
      liveQueueTasks.filter(
        ({ status }) => status.label === "No proof yet" || status.label === "Needs fresh proof"
      ).length,
    [liveQueueTasks]
  )
  const isCompletedAndVerifiedToday =
    hasRoutines && hasProofToday && pendingProofCount === 0 && pendingReviewCount === 0
  const filteredTasks = useMemo(() => {
    if (routineFilter === "all") return tasks
    return tasks.filter((task) => normalizeTaskType(task.type) === routineFilter)
  }, [routineFilter, tasks])
  const statusSummaryTone = isEmptyBoard
    ? "bg-base-100 text-base-content"
    : queueSummary.overdue > 0 || queueSummary.awaitingCheckIn > 0
      ? "bg-error text-error-content"
      : queueSummary.awaitingReview > 0
        ? "bg-warning text-warning-content"
        : "bg-success text-success-content"
  const statusSummaryLabel = isEmptyBoard
    ? "Ready"
    : queueSummary.overdue > 0 || queueSummary.awaitingCheckIn > 0
      ? "Needs proof"
      : queueSummary.awaitingReview > 0
        ? "Needs review"
        : "On track"
  const selectedDay = weekDayMeta[selectedDayIndex]
  const selectedDayDate = useMemo(
    () => getWeekdayDate(selectedDayIndex, now),
    [selectedDayIndex, now]
  )
  const weekDayTaskCounts = useMemo(
    () =>
      weekDayMeta.map((_, index) => {
        const targetDate = getWeekdayDate(index, now)
        return tasks.filter((task) => isTaskScheduledForDate(task, targetDate)).length
      }),
    [tasks, now]
  )
  const selectedDayTasks = useMemo(
    () => {
      const targetDateKey = getLocalDateKey(selectedDayDate)
      const latestPostByTaskId = new Map()

      posts.forEach((post) => {
        if (!post.task_id || getLocalDateKey(post.created_at) !== targetDateKey) return

        const existing = latestPostByTaskId.get(post.task_id)
        if (
          !existing ||
          new Date(post.created_at).getTime() > new Date(existing.created_at).getTime()
        ) {
          latestPostByTaskId.set(post.task_id, post)
        }
      })

      return tasks
        .filter((task) => isTaskScheduledForDate(task, selectedDayDate))
        .map((task) => {
          const post = latestPostByTaskId.get(task.id) ?? null

          return {
            task,
            post,
            status: getCalendarTaskStatus(task, post, commentsByPost, selectedDayDate, now),
          }
        })
        .filter(Boolean)
        .sort((a, b) => {
          const priorityDifference = getStatusPriority(a.status.label) - getStatusPriority(b.status.label)
          if (priorityDifference !== 0) return priorityDifference
          return a.task.title.localeCompare(b.task.title)
        })
    },
    [selectedDayDate, posts, tasks, commentsByPost, now]
  )
  const selectedDayCompletionCount = selectedDayTasks.filter(({ status }) =>
    status.label.startsWith("Verified by")
  ).length
  const selectedLongRangeTask = useMemo(() => {
    const nonDaily = selectedDayTasks.filter(({ task }) => normalizeTaskType(task.type) !== "daily")
    if (!nonDaily.length) return null
    return nonDaily[selectedDayIndex % nonDaily.length]
  }, [selectedDayIndex, selectedDayTasks])
  const boardCopy = useMemo(() => {
    return {
      title: board?.title || "Board",
      heroText: board?.hero_text?.trim() || board?.description?.trim() || theme.heroCopy,
      weekNote:
        board?.week_note?.trim() ||
      "Daily routines repeat across the week. Longer-range goals rotate in as supporting focus instead of crowding every day card.",
    }
  }, [board?.title, board?.hero_text, board?.description, board?.week_note, theme.heroCopy])
  const selectedPresetMeta = useMemo(
    () => checkInPresets.find((preset) => preset.key === selectedPreset) ?? null,
    [selectedPreset]
  )
  const postCaptionPlaceholder =
    selectedPresetMeta?.template ||
    "What was completed, what should reviewers look for, and what context matters?"

  useEffect(() => {
    if (!id) return
    const savedDraft = window.localStorage.getItem(`board-draft:${id}`)
    if (savedDraft) {
      const sanitizedDraft = sanitizeLegacyPostCaptionDraft(savedDraft)
      setPostCaption(sanitizedDraft)
      if (sanitizedDraft !== savedDraft) {
        if (sanitizedDraft) {
          window.localStorage.setItem(`board-draft:${id}`, sanitizedDraft)
        } else {
          window.localStorage.removeItem(`board-draft:${id}`)
        }
      }
    }
  }, [id])

  useEffect(() => {
    if (!id) return
    if (postCaption.trim()) {
      window.localStorage.setItem(`board-draft:${id}`, postCaption)
    } else {
      window.localStorage.removeItem(`board-draft:${id}`)
    }
  }, [id, postCaption])

  useEffect(() => {
    setActiveFeedIndex((current) => {
      if (posts.length === 0) return 0
      return Math.min(current, posts.length - 1)
    })
  }, [posts.length])

  useEffect(() => {
    setBoardCopyDraft(boardCopy)
  }, [boardCopy])

  useEffect(() => {
    selectedPostFilesRef.current = selectedPostFiles
  }, [selectedPostFiles])

  useEffect(() => {
    return () => {
      selectedPostFilesRef.current.forEach((entry) => {
        URL.revokeObjectURL(entry.previewUrl)
      })
    }
  }, [])

  async function refreshTasks() {
    const goalsResult = await supabase
      .from("goals")
      .select("id, title, due_date, is_completed, created_at")
      .eq("board_id", id)
      .order("created_at", { ascending: true })

    if (goalsResult.error) {
      setError(goalsResult.error.message)
      return
    }

    const tasksResult = await supabase
      .from("tasks")
      .select(`
        id,
        title,
        type,
        created_at,
        start_date,
        end_date,
        specific_date,
        is_paused,
        goal_id,
        goal:goals (
          id,
          title
        ),
        recurrence:task_recurrence (
          id,
          recurrence_type,
          day_of_week,
          day_of_month,
          month_of_year
        )
      `)
      .eq("board_id", id)
      .order("created_at", { ascending: true })

    if (tasksResult.error) {
      setError(tasksResult.error.message)
      return
    }

    setGoals(goalsResult.data ?? [])
    setTasks(tasksResult.data ?? [])
    setSelectedTaskId((currentTaskId) => {
      if (currentTaskId) return currentTaskId
      return (tasksResult.data ?? [])[0]?.id ?? ""
    })
  }

  async function refreshBoardStats() {
    const { error: rpcError } = await supabase.rpc("refresh_board_stats", {
      p_board_id: id,
    })

    if (rpcError) return

    const statsResult = await supabase
      .from("board_stats")
      .select(`
        board_id,
        owner_id,
        current_streak,
        longest_streak,
        total_checkins,
        checkins_this_week,
        checkins_this_month,
        last_checkin_date,
        updated_at
      `)
      .eq("board_id", id)
      .maybeSingle()

    if (!statsResult.error) {
      setBoardStats(statsResult.data ?? null)
    }
  }

  async function refreshPostsAndComments() {
    const postsResult = await supabase
      .from("posts")
      .select(`
        id,
        board_id,
        task_id,
        user_id,
        caption,
        image_url,
        checkin_state,
        updated_at,
        created_at,
        post_images (
          id,
          image_url,
          public_id,
          resource_type,
          format,
          bytes,
          width,
          height,
          display_order
        ),
        task:tasks!posts_task_id_fkey (
          id,
          title,
          type,
          goal_id,
          goal:goals (
            id,
            title
          )
        ),
        author:profiles!posts_user_id_fkey (
          id,
          display_name,
          username,
          avatar_url
        )
      `)
      .eq("board_id", id)
      .order("created_at", { ascending: false })

    if (postsResult.error) {
      setError(postsResult.error.message)
      return
    }

    setPosts(postsResult.data ?? [])

    if (!postsResult.data?.length) {
      setCommentsByPost({})
      await refreshBoardStats()
      return
    }

    const commentsResult = await supabase
      .from("comments")
      .select(`
        id,
        post_id,
        user_id,
        content,
        created_at,
        author:profiles!comments_user_id_fkey (
          id,
          display_name,
          username,
          avatar_url
        )
      `)
      .in(
        "post_id",
        postsResult.data.map((post) => post.id)
      )
      .order("created_at", { ascending: true })

    if (commentsResult.error) {
      setError(commentsResult.error.message)
      return
    }

    const groupedComments = (commentsResult.data ?? []).reduce((acc, comment) => {
      if (!acc[comment.post_id]) {
        acc[comment.post_id] = []
      }
      acc[comment.post_id].push(comment)
      return acc
    }, {})

    setCommentsByPost(groupedComments)
    await refreshBoardStats()
  }

  async function syncTaskRecurrence(taskId, type, scheduleDraft) {
    const recurrencePayload = getTaskRecurrencePayload(type, scheduleDraft)

    const { error: deleteError } = await supabase
      .from("task_recurrence")
      .delete()
      .eq("task_id", taskId)

    if (deleteError) {
      return { error: deleteError }
    }

    if (!recurrencePayload) {
      return { error: null }
    }

    const { error: insertError } = await supabase
      .from("task_recurrence")
      .insert({
        task_id: taskId,
        ...recurrencePayload,
      })

    return { error: insertError }
  }

  async function handleCreatePost(event) {
    event.preventDefault()

    if (!selectedTaskId) return

    setSubmittingPost(true)
    setPostSubmitStage(selectedPostFiles.length > 0 ? "uploading" : "saving")
    setError("")

    const uploadedAssets = []

    try {
      if (selectedPostFiles.length > 0) {
        const uploadResults = await Promise.all(
          selectedPostFiles.map(async ({ file }) => uploadImageToCloudinary(file))
        )
        uploadedAssets.push(...uploadResults)
      }

      setPostSubmitStage("saving")

      const { data: postData, error: insertError } = await supabase
        .from("posts")
        .insert({
          board_id: id,
          task_id: selectedTaskId,
          user_id: user.id,
          caption: postCaption.trim() || null,
          image_url: null,
          checkin_state: serializeCheckinState(selectedPreset || "done"),
        })
        .select("id")
        .single()

      if (insertError) {
        throw insertError
      }

      if (uploadedAssets.length > 0) {
        const { error: imagesError } = await supabase.from("post_images").insert(
          uploadedAssets.map((asset, index) => ({
            post_id: postData.id,
            image_url: asset.secure_url,
            public_id: asset.public_id,
            resource_type: asset.resource_type,
            format: asset.format,
            bytes: asset.bytes,
            width: asset.width,
            height: asset.height,
            display_order: index,
          }))
        )

        if (imagesError) {
          throw imagesError
        }
      }

      selectedPostFiles.forEach((entry) => {
        URL.revokeObjectURL(entry.previewUrl)
      })
      setSelectedPostFiles([])
      setPostCaption("")
      setSelectedPreset("")
      window.localStorage.removeItem(`board-draft:${id}`)
      await refreshPostsAndComments()
    } catch (submissionError) {
      setError(submissionError.message || "Could not publish check-in.")
    } finally {
      setPostSubmitStage("idle")
      setSubmittingPost(false)
    }
  }

  function handlePostFileSelection(event) {
    const files = Array.from(event.target.files ?? []).filter((file) =>
      file.type.startsWith("image/")
    )
    if (files.length === 0) return

    setSelectedPostFiles((current) => [
      ...current,
      ...files.map((file) => ({
        id: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file),
      })),
    ])

    event.target.value = ""
  }

  function handleRemoveSelectedPostFile(fileId) {
    setSelectedPostFiles((current) => {
      const target = current.find((entry) => entry.id === fileId)
      if (target) {
        URL.revokeObjectURL(target.previewUrl)
      }
      return current.filter((entry) => entry.id !== fileId)
    })
  }

  function handleReviewDecisionChange(postId, decision) {
    setReviewDecisions((prev) => ({
      ...prev,
      [postId]: decision,
    }))
  }

  function handleCommentDraftChange(postId, value) {
    setCommentDrafts((prev) => ({
      ...prev,
      [postId]: value,
    }))
  }

  async function handleCreateTask(event) {
    event.preventDefault()

    if (!taskTitle.trim()) return

    setSubmittingTask(true)
    setError("")

    const taskPayload = getTaskPayload(taskType, taskGoalId, taskScheduleDraft)

    const { data, error: insertError } = await supabase
      .from("tasks")
      .insert({
        board_id: id,
        created_by: user.id,
        title: taskTitle.trim(),
        ...taskPayload,
      })
      .select("id")
      .single()

    if (insertError) {
      setError(insertError.message)
      setSubmittingTask(false)
      return
    }

    const { error: recurrenceError } = await syncTaskRecurrence(data.id, taskType, taskScheduleDraft)

    if (recurrenceError) {
      await supabase
        .from("tasks")
        .delete()
        .eq("id", data.id)

      setError(getRecurrenceErrorMessage(recurrenceError, taskType))
      setSubmittingTask(false)
      return
    }

    setTaskTitle("")
    setTaskType("daily")
    setTaskGoalId("")
    setTaskScheduleDraft(getDefaultTaskScheduleDraft())
    await refreshTasks()
    if (data?.id) {
      setSelectedTaskId(data.id)
    }
    setSubmittingTask(false)
  }

  async function handleCreateGoal(event) {
    event.preventDefault()

    if (!goalTitle.trim()) return

    setSubmittingGoal(true)
    setError("")

    const { data, error: insertError } = await supabase
      .from("goals")
      .insert({
        board_id: id,
        user_id: user.id,
        title: goalTitle.trim(),
        due_date: goalDueDate || null,
        is_completed: goalIsCompleted,
      })
      .select("id")
      .single()

    if (insertError) {
      setError(insertError.message)
      setSubmittingGoal(false)
      return
    }

    setGoalTitle("")
    setGoalDueDate("")
    setGoalIsCompleted(false)
    await refreshTasks()
    if (data?.id) {
      setTaskGoalId(data.id)
    }
    setSubmittingGoal(false)
  }

  async function handleCommentSubmit(event, postId) {
    event.preventDefault()

    const decision = reviewDecisions[postId]
    const content = commentDrafts[postId]?.trim() ?? ""
    if (!decision) return

    const reviewPrefix =
      decision === "yes" ? "Enough proof: Yes." : "Enough proof: No."
    const finalContent = content ? `${reviewPrefix}\n\n${content}` : reviewPrefix

    setSubmittingCommentFor(postId)
    setError("")

    const { error: insertError } = await supabase.from("comments").insert({
      post_id: postId,
      user_id: user.id,
      content: finalContent,
    })

    if (insertError) {
      setError(insertError.message)
      setSubmittingCommentFor("")
      return
    }

    setCommentDrafts((prev) => ({ ...prev, [postId]: "" }))
    setReviewDecisions((prev) => ({ ...prev, [postId]: "" }))
    await refreshPostsAndComments()
    setSubmittingCommentFor("")
  }

  function startTaskEdit(task) {
    setEditingTaskId(task.id)
    setTaskEditDraft({
      title: task.title,
      type: normalizeTaskType(task.type),
      goalId: task.goal_id || "",
      ...getTaskScheduleDraft(task),
    })
  }

  async function handleSaveTask(taskId) {
    if (!taskEditDraft.title.trim()) return

    setSavingTaskId(taskId)
    setError("")

    const taskPayload = getTaskPayload(
      taskEditDraft.type,
      taskEditDraft.goalId,
      taskEditDraft
    )

    const { error: updateError } = await supabase
      .from("tasks")
      .update({
        title: taskEditDraft.title.trim(),
        ...taskPayload,
      })
      .eq("id", taskId)

    if (updateError) {
      setError(updateError.message)
      setSavingTaskId("")
      return
    }

    const { error: recurrenceError } = await syncTaskRecurrence(taskId, taskEditDraft.type, taskEditDraft)

    if (recurrenceError) {
      setError(getRecurrenceErrorMessage(recurrenceError, taskEditDraft.type))
      setSavingTaskId("")
      return
    }

    setEditingTaskId("")
    setTaskEditDraft({
      title: "",
      type: "daily",
      goalId: "",
      ...getDefaultTaskScheduleDraft(),
    })
    await refreshTasks()
    await refreshPostsAndComments()
    setSavingTaskId("")
  }

  async function handleDeleteTask(taskId) {
    const taskToDelete = tasks.find((task) => task.id === taskId)
    const confirmed = window.confirm(
      `Delete "${taskToDelete?.title || "this routine"}"? This removes the routine immediately.`
    )

    if (!confirmed) return

    setDeletingTaskId(taskId)
    setError("")

    const { error: deleteError } = await supabase
      .from("tasks")
      .delete()
      .eq("id", taskId)

    if (deleteError) {
      setError(deleteError.message)
      setDeletingTaskId("")
      return
    }

    if (selectedTaskId === taskId) {
      setSelectedTaskId("")
    }

    if (editingTaskId === taskId) {
      setEditingTaskId("")
      setTaskEditDraft({
        title: "",
        type: "daily",
        goalId: "",
        ...getDefaultTaskScheduleDraft(),
      })
    }

    await refreshTasks()
    await refreshPostsAndComments()
    setDeletingTaskId("")
  }

  function applyPreset(preset) {
    setSelectedPreset(preset.key)
  }

  function handleReuseLastCaption() {
    if (!ownerLatestCaption) return
    setPostCaption(ownerLatestCaption)
  }

  async function handleSaveBoardCopy(event) {
    event.preventDefault()
    if (!id) return

    const nextTitle = boardCopyDraft.title.trim() || board?.title || "Board"
    const nextHeroText = boardCopyDraft.heroText.trim() || theme.heroCopy
    const nextWeekNote =
      boardCopyDraft.weekNote.trim() ||
      "Daily routines repeat across the week. Longer-range goals rotate in as supporting focus instead of crowding every day card."
    setError("")

    const { error: updateError } = await supabase
      .from("boards")
      .update({
        title: nextTitle,
        hero_text: nextHeroText,
        week_note: nextWeekNote,
      })
      .eq("id", id)

    if (updateError) {
      setError(updateError.message)
      return
    }

    setBoard((current) =>
      current
        ? {
            ...current,
            title: nextTitle,
            hero_text: nextHeroText,
            week_note: nextWeekNote,
          }
        : current
    )
    setBoardCopyDraft((current) => ({
      ...current,
      title: nextTitle,
      heroText: nextHeroText,
      weekNote: nextWeekNote,
    }))
    setEditingBoardCopy(false)
  }

  return (
    <main data-theme={theme.dataTheme} className={theme.shellClass}>
      <section className="mx-auto min-h-screen w-full max-w-7xl px-4 py-4 sm:px-5 sm:py-6 md:px-6 md:py-8">
        <div className="grid gap-6">
          <header className={`${theme.panelClass} rounded-[2rem] overflow-hidden`}>
            <div
              className="border-b px-4 py-3 md:px-6"
              style={{
                background: theme.coverBackground,
                borderColor: "color-mix(in srgb, var(--color-base-content) 12%, transparent)",
              }}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="badge border-none bg-base-100/75 px-3 py-2 text-base-content/70">
                    {ownerLabel}
                  </span>
                </div>

                <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:gap-3">
                  {isOwner ? (
                    <button
                      type="button"
                      onClick={() => setEditingBoardCopy((current) => !current)}
                      className="btn btn-outline btn-sm"
                    >
                      {editingBoardCopy ? "Close editor" : "Edit board content"}
                    </button>
                  ) : null}
                  <Link to="/home" className="btn btn-outline btn-sm">
                    Back to boards
                  </Link>
                </div>
              </div>
            </div>

            <div className="grid gap-3 px-4 py-3 md:px-6 md:py-2.5 xl:grid-cols-[1.55fr_1fr] xl:items-end">
              <div className="space-y-1 text-left">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] ${
                    pendingReviewCount > 0
                      ? "border border-warning/35 bg-base-100 text-base-content"
                      : "bg-base-100 text-base-content"
                  }`}>
                    <span aria-hidden="true">
                      {pendingReviewCount > 0 ? "" : "○"}
                    </span>
                    <span>
                      {pendingReviewCount > 0
                        ? `Have we checked? We're missing ${pendingReviewCount} task`
                        : "We've seen ya, dw!"}
                    </span>
                  </span>
                </div>
                <h1 className="brand-heading text-3xl leading-tight text-base-content md:text-4xl">
                  {loading ? "Loading board..." : boardCopy.title}
                </h1>
                <p className="max-w-2xl text-[15px] leading-6 text-base-content/80">
                  {boardCopy.heroText}
                </p>
                <div className="flex flex-wrap gap-2 pt-0.5">
                  {hasRoutines ? (
                    <button type="button" onClick={() => setActiveTab("checkins")} className="btn btn-primary w-full sm:w-auto">
                      {pendingReviewCount > 0
                        ? "Review proof"
                        : isCompletedAndVerifiedToday
                          ? "View today's check-in"
                          : "Post proof"}
                    </button>
                  ) : (
                    <button type="button" onClick={() => setActiveTab("overview")} className="btn btn-primary w-full sm:w-auto">
                      Add first routine
                    </button>
                  )}
                  <button type="button" onClick={() => setActiveTab("calendar")} className="btn btn-outline w-full sm:w-auto">
                    Open weekly plan
                  </button>
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                <button
                  type="button"
                  onClick={() => setActiveTab("overview")}
                  className="rounded-[1rem] border border-base-300/45 bg-base-100 px-4 py-3 text-left transition hover:border-primary/45 hover:bg-base-100"
                >
                  <p className="text-xs uppercase tracking-[0.2em] text-base-content/60">
                    Due today
                  </p>
                  <p className="mt-2 text-3xl font-semibold text-base-content">
                    {dueTodayCount}
                  </p>
                  <p className="mt-2 text-sm text-base-content/72">
                    Scheduled today
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("overview")}
                  className="rounded-[1rem] border border-base-300/45 bg-base-100 px-4 py-3 text-left transition hover:border-primary/45 hover:bg-base-100"
                >
                  <p className="text-xs uppercase tracking-[0.2em] text-base-content/60">
                    Pending proof
                  </p>
                  <p className="mt-2 text-3xl font-semibold text-base-content">
                    {pendingProofCount}
                  </p>
                  <p className="mt-2 text-sm text-base-content/72">
                    Awaiting proof
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("checkins")}
                  className="rounded-[1rem] border border-base-300/45 bg-base-100 px-4 py-3 text-left transition hover:border-primary/45 hover:bg-base-100"
                >
                  <p className="text-xs uppercase tracking-[0.2em] text-base-content/60">
                    Pending review
                  </p>
                  <p className="mt-2 text-3xl font-semibold text-base-content">
                    {pendingReviewCount}
                  </p>
                  <p className="mt-2 text-sm text-base-content/72">
                    Awaiting review
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("overview")}
                  className="rounded-[1rem] border border-base-300/45 bg-base-100 px-4 py-3 text-left transition hover:border-primary/45 hover:bg-base-100"
                >
                  <p className="text-xs uppercase tracking-[0.2em] text-base-content/60">
                    Streak
                  </p>
                  <p className="mt-2 flex items-center gap-2 text-3xl font-semibold text-base-content">
                    <FlameIcon active={streakIsActive} className="h-6 w-6" />
                    <span>{currentStreak}</span>
                  </p>
                  <p className="mt-2 text-sm text-base-content/72">
                    Current streak
                  </p>
                </button>
              </div>
            </div>
          </header>

          {loading ? (
            <div className={`${theme.panelClass} rounded-box p-8 text-left`}>
              <span className="loading loading-dots loading-md text-primary" />
              <p className="mt-4 text-base-content/75">Loading board details...</p>
            </div>
          ) : null}

          {!loading && error ? (
            <div className="alert alert-error shadow-sm">
              <span>{error}</span>
            </div>
          ) : null}

          {!loading && !error && board ? (
            <section className="grid gap-6">
              {editingBoardCopy ? (
                <form
                  onSubmit={handleSaveBoardCopy}
                  className={`${theme.panelClass} rounded-[1.4rem] grid gap-4 p-4 sm:p-5 text-left`}
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.22em] text-secondary">
                        Board content
                      </p>
                      <h2 className="brand-heading mt-2 text-2xl text-base-content">
                        Edit this board
                      </h2>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <button
                        type="button"
                        onClick={() => {
                          setBoardCopyDraft(boardCopy)
                          setEditingBoardCopy(false)
                        }}
                        className="btn btn-ghost btn-sm"
                      >
                        Cancel
                      </button>
                      <button type="submit" className="btn btn-primary btn-sm">
                        Save changes
                      </button>
                    </div>
                  </div>

                  <label className="grid gap-2">
                    <span className="text-sm uppercase tracking-[0.18em] text-secondary">Board title</span>
                    <input
                      type="text"
                      value={boardCopyDraft.title}
                      onChange={(event) =>
                        setBoardCopyDraft((current) => ({ ...current, title: event.target.value }))
                      }
                      className="input input-bordered w-full bg-base-100"
                    />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-sm uppercase tracking-[0.18em] text-secondary">Hero caption</span>
                    <textarea
                      value={boardCopyDraft.heroText}
                      onChange={(event) =>
                        setBoardCopyDraft((current) => ({ ...current, heroText: event.target.value }))
                      }
                      className="textarea textarea-bordered min-h-24 w-full bg-base-100"
                    />
                  </label>

                  <label className="grid gap-2">
                    <span className="text-sm uppercase tracking-[0.18em] text-secondary">Week note</span>
                    <textarea
                      value={boardCopyDraft.weekNote}
                      onChange={(event) =>
                        setBoardCopyDraft((current) => ({ ...current, weekNote: event.target.value }))
                      }
                      className="textarea textarea-bordered min-h-24 w-full bg-base-100"
                    />
                  </label>
                </form>
              ) : null}

              <div className={`${theme.panelClass} tabs tabs-boxed flex w-full flex-wrap gap-2 rounded-[1.2rem] p-2 sm:w-fit`}>
                {[
                  { id: "overview", label: "Overview" },
                  { id: "checkins", label: "Check-ins" },
                  { id: "calendar", label: "Calendar" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`tab flex-1 rounded-[0.9rem] border px-4 transition sm:flex-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                      activeTab === tab.id
                        ? "tab-active border-primary/55 bg-base-100 text-base-content shadow-sm"
                        : "border-transparent bg-transparent text-base-content/62 hover:border-base-300/55 hover:bg-base-100/62 hover:text-base-content"
                    }`}
                  >
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>

              {reminders.length > 0 ? (
                <div className={`${theme.panelClass} flex flex-wrap items-center gap-3 rounded-[1.1rem] border border-warning/30 px-4 py-3 text-left`}>
                  <span className="badge bg-warning text-warning-content border-none px-3 py-2">
                    Attention needed
                  </span>
                  <p className="text-sm text-base-content/80">
                    {reminders[0]}
                  </p>
                </div>
              ) : null}

              {activeTab === "overview" ? (
                <section className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.35fr)_minmax(0,0.9fr)]">
                  <aside className="grid min-w-0 content-start gap-4">
                    <article className={`${theme.panelClass} rounded-[1.6rem] p-4 sm:p-5 text-left`}>
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm uppercase tracking-[0.22em] text-secondary">
                            Highest priority
                          </p>
                          <h3 className="brand-heading mt-2 text-2xl text-base-content">
                            Live queue
                          </h3>
                        </div>
                        <span className={`badge w-fit max-w-full whitespace-nowrap border-none px-3 py-2 text-xs sm:text-sm ${queueSummary.overdue > 0 ? "bg-error text-error-content" : "bg-base-100 text-base-content"}`}>
                          {getLiveQueueBadgeLabel(queueSummary, liveQueueTasks.length, hasRoutines)}
                        </span>
                      </div>

                      <div className="mt-4 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                        <div className="rounded-[1rem] bg-base-100/85 px-3 py-3">
                          <p className="text-[11px] uppercase tracking-[0.18em] text-base-content/55">
                            Due today
                          </p>
                          <p className="mt-2 text-2xl font-semibold text-base-content">
                            {queueCounters.dueToday}
                          </p>
                        </div>
                        <div className="rounded-[1rem] bg-base-100/85 px-3 py-3">
                          <p className="text-[11px] uppercase tracking-[0.18em] text-base-content/55">
                            Overdue
                          </p>
                          <p className="mt-2 text-2xl font-semibold text-base-content">
                            {queueCounters.overdue}
                          </p>
                        </div>
                        <div className="rounded-[1rem] bg-base-100/85 px-3 py-3 sm:col-span-2">
                          <p className="text-[11px] uppercase tracking-[0.18em] text-base-content/55">
                            Awaiting review
                          </p>
                          <p className="mt-2 text-2xl font-semibold text-base-content">
                            {queueCounters.awaitingReview}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 space-y-3">
                        {liveQueueTasks.length === 0 ? (
                          <div className="rounded-box border border-dashed border-base-300/45 bg-base-100/40 px-4 py-4 text-sm text-base-content/70">
                            <p>No tasks yet. Create your first routine to start the queue.</p>
                            <button
                              type="button"
                              onClick={() => setActiveTab("overview")}
                              className="btn btn-primary btn-sm mt-3"
                            >
                              Add first routine
                            </button>
                          </div>
                        ) : actionableQueueTasks.length === 0 ? (
                          <div className="rounded-[1.2rem] border border-success/35 bg-success/10 px-4 py-4 text-sm text-base-content/76">
                            <p className="font-semibold text-base-content">Queue is clear.</p>
                            <p className="mt-2">
                              Nothing is awaiting proof or review. Today&apos;s routine status is already settled.
                            </p>
                          </div>
                        ) : (
                          actionableQueueTasks.map(({ task, status }) => {
                            const statusMeta = getStatusMeta(status.label)
                            return (
                              <div
                                key={task.id}
                                className={`rounded-[1.2rem] border px-4 py-4 ${statusMeta.cardClass}`}
                              >
                                <div className="flex items-start gap-3">
                                  <span className={`mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${statusMeta.indicatorClass}`}>
                                    {statusMeta.icon}
                                  </span>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                      <p className="pr-2 font-semibold text-base-content">{task.title}</p>
                                      <span className={`badge badge-sm w-fit shrink-0 whitespace-nowrap ${status.tone}`}>
                                        {status.label}
                                      </span>
                                    </div>
                                    <p className="mt-3 text-sm text-base-content/84">{status.detail}</p>
                                    <p className="mt-2 text-xs uppercase tracking-[0.16em] text-base-content/68">
                                      {formatTaskTypeLabel(task.type)} • {getUpcomingLabel(task)}
                                    </p>
                                    <div className="mt-3">
                                      <button
                                        type="button"
                                        onClick={() => setActiveTab("checkins")}
                                        className="btn btn-primary btn-xs"
                                      >
                                        {getQueueActionLabel(status.label)}
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )
                          })
                        )}
                      </div>
                    </article>
                  </aside>

                  <article className={`${theme.panelClass} min-w-0 rounded-[1.8rem] p-4 sm:p-5 md:p-7 text-left`}>
                    <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
                      <div className="space-y-2">
                        <p className="text-sm uppercase tracking-[0.22em] text-secondary">
                          Routine system
                        </p>
                        <h2 className="brand-heading text-3xl text-base-content">
                          Task Manager
                        </h2>
                        <div className="flex flex-wrap gap-2">
                          {[
                            { key: "all", label: "All", count: tasks.length },
                            { key: "daily", label: "Daily", count: taskGroups.daily.length },
                            { key: "weekly", label: "Weekly", count: taskGroups.weekly.length },
                            { key: "monthly", label: "Monthly", count: taskGroups.monthly.length },
                            { key: "yearly", label: "Yearly", count: taskGroups.yearly.length },
                            { key: "one-time", label: "One-time", count: taskGroups["one-time"].length },
                          ].map((item) => (
                            <button
                              key={item.key}
                              type="button"
                              onClick={() => setRoutineFilter(item.key)}
                              className={`rounded-full border px-3 py-1 text-[11px] font-medium uppercase tracking-[0.12em] transition ${
                                routineFilter === item.key
                                  ? "border-primary/45 bg-base-100 text-base-content shadow-sm"
                                  : "border-base-300/25 bg-base-100/28 text-base-content/56 hover:border-base-300/45 hover:bg-base-100/42"
                              }`}
                            >
                              {item.label} {item.count}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-5">
                      {isOwner ? (
                        <form
                          onSubmit={handleCreateGoal}
                          className={`grid gap-4 rounded-box border p-4 ${
                            goals.length === 0
                              ? "border-base-300/55 bg-base-100/95 shadow-sm"
                              : "border-base-300/35 bg-base-100/70"
                          }`}
                        >
                          <div>
                            <p className="text-xs uppercase tracking-[0.18em] text-secondary">
                              Goal controls
                            </p>
                            <h3 className="mt-2 text-lg font-semibold text-base-content">
                              {goals.length === 0 ? "Add a goal" : "Add another goal"}
                            </h3>
                          </div>

                          <label className="grid gap-2">
                            <span className="text-xs uppercase tracking-[0.18em] text-base-content/60">
                              Goal name
                            </span>
                            <input
                              type="text"
                              value={goalTitle}
                              onChange={(event) => setGoalTitle(event.target.value)}
                              className="input input-bordered w-full bg-base-100"
                              placeholder="Enter a goal name"
                              disabled={submittingGoal}
                            />
                          </label>

                          <div className="grid gap-3 lg:grid-cols-[220px_minmax(0,1fr)]">
                            <label className="grid gap-2">
                              <span className="text-xs uppercase tracking-[0.18em] text-base-content/60">
                                Deadline
                              </span>
                              <input
                                type="date"
                                value={goalDueDate}
                                onChange={(event) => setGoalDueDate(event.target.value)}
                                className="input input-bordered w-full bg-base-100"
                                disabled={submittingGoal}
                              />
                            </label>

                            <label className="grid gap-2">
                              <span className="text-xs uppercase tracking-[0.18em] text-base-content/60">
                                Accomplished state
                              </span>
                              <select
                                value={goalIsCompleted ? "accomplished" : "not_accomplished"}
                                onChange={(event) =>
                                  setGoalIsCompleted(event.target.value === "accomplished")
                                }
                                className="select select-bordered w-full bg-base-100"
                                disabled={submittingGoal}
                              >
                                <option value="not_accomplished">Not accomplished</option>
                                <option value="accomplished">Accomplished</option>
                              </select>
                            </label>
                          </div>

                          <div className="flex justify-start lg:justify-end">
                            <button
                              type="submit"
                              className="btn btn-primary w-full sm:w-auto"
                              disabled={!goalTitle.trim() || submittingGoal}
                            >
                              {submittingGoal ? "Adding..." : "Add goal"}
                            </button>
                          </div>

                          <p className="text-sm text-base-content/68">
                            {!goalTitle.trim()
                              ? "Enter a goal name to continue."
                              : goalDueDate
                                ? `Goal is ready to add with a ${goalIsCompleted ? "completed" : "pending"} deadline.`
                                : "Goal is ready to add."}
                          </p>
                        </form>
                      ) : null}

                      {isOwner ? (
                        <form
                          onSubmit={handleCreateTask}
                          className={`grid gap-4 rounded-box border p-4 ${
                            tasks.length === 0
                              ? "border-base-300/55 bg-base-100/95 shadow-sm"
                              : "border-base-300/35 bg-base-100/70"
                          }`}
                        >
                          <div>
                            <p className="text-xs uppercase tracking-[0.18em] text-secondary">
                              Routine controls
                            </p>
                            <h3 className="mt-2 text-lg font-semibold text-base-content">
                              {tasks.length === 0 ? "Add a routine" : "Add another routine"}
                            </h3>
                          </div>

                          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px]">
                            <label className="grid gap-2">
                              <span className="text-xs uppercase tracking-[0.18em] text-base-content/60">
                                Task name
                              </span>
                              <input
                                type="text"
                                value={taskTitle}
                                onChange={(event) => setTaskTitle(event.target.value)}
                                className="input input-bordered w-full bg-base-100"
                                placeholder="Enter a routine name"
                                disabled={submittingTask}
                              />
                            </label>

                            <label className="grid gap-2">
                              <span className="text-xs uppercase tracking-[0.18em] text-base-content/60">
                                Frequency
                              </span>
                              <select
                                value={taskType}
                                onChange={(event) => setTaskType(event.target.value)}
                                className="select select-bordered w-full bg-base-100"
                                disabled={submittingTask}
                              >
                                <option value="daily">Daily</option>
                                <option value="weekly">Weekly</option>
                                <option value="monthly">Monthly</option>
                                <option value="yearly">Yearly</option>
                                <option value="one-time">One time</option>
                              </select>
                            </label>
                          </div>

                          <TaskScheduleFields
                            type={taskType}
                            draft={taskScheduleDraft}
                            onChange={(nextFields) =>
                              setTaskScheduleDraft((current) => ({ ...current, ...nextFields }))
                            }
                            disabled={submittingTask}
                          />

                          <label className="grid gap-2">
                            <span className="text-xs uppercase tracking-[0.18em] text-base-content/60">
                              Linked goal
                            </span>
                            <select
                              value={taskGoalId}
                              onChange={(event) => setTaskGoalId(event.target.value)}
                              className="select select-bordered w-full bg-base-100"
                              disabled={submittingTask || goals.length === 0}
                            >
                              <option value="">No goal</option>
                              {goals.map((goal) => (
                                <option key={goal.id} value={goal.id}>
                                  {goal.title}
                                </option>
                              ))}
                            </select>
                          </label>

                          <div className="flex justify-start lg:justify-end">
                            <button
                              type="submit"
                              className="btn btn-primary w-full sm:w-auto"
                              disabled={!taskTitle.trim() || submittingTask}
                            >
                              {submittingTask ? "Adding..." : "Add routine"}
                            </button>
                          </div>

                          <p className="text-sm text-base-content/68">
                            {!taskTitle.trim()
                              ? "Enter a routine name to continue."
                              : goals.length === 0
                                ? "Routine is ready to add. Goals can be linked once this board has some."
                                : "Routine is ready to add."}
                          </p>
                        </form>
                      ) : (
                        <div className="rounded-[1.2rem] border border-base-300/45 bg-base-100/75 p-4 text-sm text-base-content/72">
                          Only {ownerLabel} can change routines on this board.
                        </div>
                      )}

                      <section className="grid gap-4 min-w-0">
                        <div>
                          <p className="text-xs uppercase tracking-[0.18em] text-secondary">
                            Routine list
                          </p>
                          <h3 className="mt-2 text-lg font-semibold text-base-content">
                            Current routines
                          </h3>
                        </div>

                        <div className="grid gap-4">
                      {filteredTasks.length === 0 ? (
                        <div className="rounded-[1.4rem] border border-dashed border-base-300/45 bg-base-100/35 px-4 py-5 text-sm text-base-content/68">
                          <p>
                            {tasks.length === 0
                              ? "No routines yet. Create your first routine to start building this board."
                              : `No ${routineFilter} routines yet.`}
                          </p>
                        </div>
                      ) : (
                        filteredTasks.map((task) => {
                          const status = getTaskStatus(task, taskPosts[task.id] ?? [], commentsByPost)
                          const statusMeta = getStatusMeta(status.label)
                          const isEditingTask = editingTaskId === task.id
                          const reviewCount = (taskPosts[task.id] ?? []).reduce(
                            (count, post) => count + (commentsByPost[post.id]?.length ?? 0),
                            0
                          )
                          const latestReviewedAt = (taskPosts[task.id] ?? [])
                            .flatMap((post) => commentsByPost[post.id] ?? [])
                            .slice(-1)[0]?.created_at
                          return (
                            <div
                              key={task.id}
                              className={`${theme.cardClass} min-w-0 rounded-[1.4rem] border px-4 py-4 ${statusMeta.cardClass}`}
                            >
                              {isEditingTask ? (
                                <div className="grid gap-3">
                                  <input
                                    type="text"
                                    value={taskEditDraft.title}
                                    onChange={(event) =>
                                      setTaskEditDraft((current) => ({ ...current, title: event.target.value }))
                                    }
                                    className="input input-bordered w-full bg-base-100"
                                  />
                                  <select
                                    value={taskEditDraft.type}
                                    onChange={(event) =>
                                      setTaskEditDraft((current) => ({ ...current, type: event.target.value }))
                                    }
                                    className="select select-bordered w-full bg-base-100"
                                  >
                                    <option value="daily">Daily</option>
                                    <option value="weekly">Weekly</option>
                                    <option value="monthly">Monthly</option>
                                    <option value="yearly">Yearly</option>
                                    <option value="one-time">One time</option>
                                  </select>
                                  <TaskScheduleFields
                                    type={taskEditDraft.type}
                                    draft={taskEditDraft}
                                    onChange={(nextFields) =>
                                      setTaskEditDraft((current) => ({ ...current, ...nextFields }))
                                    }
                                    disabled={savingTaskId === task.id}
                                  />
                                  <select
                                    value={taskEditDraft.goalId}
                                    onChange={(event) =>
                                      setTaskEditDraft((current) => ({ ...current, goalId: event.target.value }))
                                    }
                                    className="select select-bordered w-full bg-base-100"
                                    disabled={goals.length === 0}
                                  >
                                    <option value="">No goal</option>
                                    {goals.map((goal) => (
                                      <option key={goal.id} value={goal.id}>
                                        {goal.title}
                                      </option>
                                    ))}
                                  </select>
                                  <div className="flex flex-wrap gap-2">
                                    <button
                                      type="button"
                                      onClick={() => handleSaveTask(task.id)}
                                      className="btn btn-primary btn-sm"
                                      disabled={!taskEditDraft.title.trim() || savingTaskId === task.id}
                                    >
                                      {savingTaskId === task.id ? "Saving..." : "Save"}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingTaskId("")
                                        setTaskEditDraft({
                                          title: "",
                                          type: "daily",
                                          goalId: "",
                                          ...getDefaultTaskScheduleDraft(),
                                        })
                                      }}
                                      className="btn btn-ghost btn-sm"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                    <div className="min-w-0">
                                      <h3 className="text-xl font-semibold text-base-content">{task.title}</h3>
                                      {task.goal ? (
                                        <p className="mt-2 text-sm text-base-content/68">
                                          Part of goal: {getGoalTitle(task.goal)}
                                        </p>
                                      ) : null}
                                    </div>
                                    <span className="badge badge-outline w-fit uppercase">{formatTaskTypeLabel(task.type)}</span>
                                  </div>
                                  <p className="mt-3 text-sm text-base-content/72">
                                    Added {formatDate(task.created_at)}
                                  </p>
                                  <div className="mt-4 flex flex-wrap items-center gap-2">
                                    {isVerifiedStatusLabel(status.label) ? null : (
                                      <span className={`badge ${status.tone}`}>{status.label}</span>
                                    )}
                                    <span className={`text-xs uppercase tracking-[0.14em] ${isVerifiedStatusLabel(status.label) ? "text-base-content/72" : "text-base-content/65"}`}>
                                      {status.detail}
                                    </span>
                                  </div>
                                  <div className="mt-4 flex flex-wrap gap-2">
                                    <span className="badge badge-ghost">
                                      {taskPosts[task.id]?.length ?? 0} proof entr{(taskPosts[task.id]?.length ?? 0) === 1 ? "y" : "ies"}
                                    </span>
                                    <span className="badge badge-ghost">
                                      {getReviewActivityLabel(reviewCount, latestReviewedAt)}
                                    </span>
                                  </div>
                                  {isOwner ? (
                                    <div className="mt-4 flex flex-wrap gap-2">
                                      <button
                                        type="button"
                                        onClick={() => setActiveTab("checkins")}
                                        className="btn btn-primary btn-sm"
                                      >
                                        {status.label === "Needs fresh proof"
                                          ? "Refresh proof"
                                          : status.label === "No proof yet"
                                            ? "Post proof"
                                            : "View proof"}
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => startTaskEdit(task)}
                                        className="btn btn-outline btn-sm"
                                      >
                                        Edit
                                      </button>
                                    </div>
                                  ) : null}
                                </>
                              )}
                            </div>
                          )
                        })
                      )}
                        </div>
                      </section>
                    </div>
                  </article>

                  <aside className="grid min-w-0 content-start gap-4">
                    <article className={`${theme.panelClass} rounded-[1.6rem] p-4 sm:p-5 text-left`}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm uppercase tracking-[0.22em] text-secondary">
                            Status summary
                          </p>
                          <h3 className="brand-heading mt-2 text-2xl text-base-content">
                            What needs action next
                          </h3>
                        </div>
                        <span className={`badge w-fit whitespace-nowrap border-none px-3 py-2 ${statusSummaryTone}`}>
                          {statusSummaryLabel}
                        </span>
                      </div>
                      <div className="mt-4 space-y-3">
                        <div className="rounded-[1rem] bg-base-100/88 px-4 py-3">
                          <p className="text-sm text-base-content/80">
                            {queueSummary.overdue > 0
                              ? `${queueSummary.overdue} overdue routine${queueSummary.overdue === 1 ? "" : "s"} need${queueSummary.overdue === 1 ? "s" : ""} proof.`
                              : queueSummary.awaitingCheckIn > 0
                                ? `${queueSummary.awaitingCheckIn} routine${queueSummary.awaitingCheckIn === 1 ? "" : "s"} need${queueSummary.awaitingCheckIn === 1 ? "s" : ""} proof today.`
                                : pendingReviewCount > 0
                                  ? `${pendingReviewCount} check-in${pendingReviewCount === 1 ? "" : "s"} still needs review.`
                                  : isEmptyBoard
                                    ? "Ready for the first routine."
                                    : "No peer reviews pending."}
                          </p>
                        </div>
                        {!isEmptyBoard ? (
                          <div className="rounded-[1rem] bg-base-100/72 px-4 py-3">
                            <p className="text-sm text-base-content/76">
                              {pendingReviewCount > 0
                                ? `${pendingReviewCount} peer review${pendingReviewCount === 1 ? "" : "s"} waiting.`
                                : "No peer reviews pending."}
                            </p>
                          </div>
                        ) : null}
                        <p className="text-sm text-base-content/76">
                          {checkinsThisWeek > 0
                            ? `${checkinsThisWeek} check-in${checkinsThisWeek === 1 ? "" : "s"} logged this week.`
                            : "No check-ins this week."}
                        </p>
                        <p className="text-sm text-base-content/68">
                          {latestPost
                            ? `${latestPost.task?.title || "Untitled task"} • ${getRelativeTimeLabel(latestPost.created_at)}`
                            : "No proof posted yet."}
                        </p>
                        {currentStreak > 0 ? (
                          <p className="text-sm text-base-content/68">
                            {hasStreakCheckinToday
                              ? `Streak safe: ${currentStreak}-day rhythm is active.`
                              : "Streak at risk: one more check-in keeps the rhythm alive."}
                          </p>
                        ) : null}
                      </div>
                    </article>

                    <article className={`${theme.panelClass} rounded-[1.6rem] p-4 text-left`}>
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm uppercase tracking-[0.22em] text-secondary">
                            Goal tracker
                          </p>
                          <h3 className="brand-heading mt-1 text-2xl text-base-content">
                            Goal list
                          </h3>
                        </div>
                        <span className="badge badge-outline">
                          {goals.length} goal{goals.length === 1 ? "" : "s"}
                        </span>
                      </div>
                      <div className="space-y-2.5">
                        {goals.length === 0 ? (
                          <div className="rounded-[1rem] border border-dashed border-base-300/45 bg-base-100/50 px-4 py-4 text-sm text-base-content/68">
                            No goals yet. Create your first goal to start grouping routines.
                          </div>
                        ) : (
                          goals.map((goal) => {
                            return (
                              <div key={goal.id} className="rounded-[1rem] bg-base-100/85 px-4 py-3">
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                  <span className="font-semibold text-base-content">{goal.title}</span>
                                  <span className={`badge border-none ${goal.is_completed ? "bg-success text-success-content" : "bg-base-100 text-base-content"}`}>
                                    {goal.is_completed ? "Accomplished" : "Not accomplished"}
                                  </span>
                                </div>
                                <p className="mt-2 text-sm text-base-content/75">
                                  Deadline: {formatDeadline(goal.due_date)}
                                </p>
                                <p className="mt-1 text-xs uppercase tracking-[0.14em] text-base-content/58">
                                  {(goalTaskCounts[goal.id] ?? 0) === 0
                                    ? "No linked tasks yet"
                                    : `${goalTaskCounts[goal.id]} linked task${(goalTaskCounts[goal.id] ?? 0) === 1 ? "" : "s"}`}
                                </p>
                              </div>
                            )
                          })
                        )}
                      </div>
                    </article>
                  </aside>
                </section>
              ) : null}

              {activeTab === "checkins" ? (
                <section className="grid gap-6 xl:grid-cols-[0.82fr_1.18fr]">
                  <article className={`${theme.panelClass} rounded-[1.6rem] p-4 sm:p-5 text-left`}>
                    <div className="mb-5">
                      <p className="text-sm uppercase tracking-[0.22em] text-secondary">
                        I did something!
                      </p>
                      <h2 className="brand-heading mt-2 text-2xl text-base-content">
                        Add proof
                      </h2>
                      <p className="mt-2 text-sm leading-6 text-base-content/74">
                        Select the routine, attach the proof state, write an optional caption, then publish. Special cases stay secondary.
                      </p>
                    </div>

                    <PostComposer
                      isOwner={isOwner}
                      ownerLabel={ownerLabel}
                      tasks={tasks}
                      selectedTaskId={selectedTaskId}
                      onSelectedTaskIdChange={setSelectedTaskId}
                      submittingPost={submittingPost}
                      onSubmit={handleCreatePost}
                      selectedPostFiles={selectedPostFiles}
                      onPostFileSelection={handlePostFileSelection}
                      onRemoveSelectedPostFile={handleRemoveSelectedPostFile}
                      postCaption={postCaption}
                      onPostCaptionChange={setPostCaption}
                      postCaptionPlaceholder={postCaptionPlaceholder}
                      selectedPreset={selectedPreset}
                      selectedPresetMeta={selectedPresetMeta}
                      checkInPresets={checkInPresets}
                      onApplyPreset={applyPreset}
                      onReuseLastCaption={handleReuseLastCaption}
                      canReuseLastCaption={Boolean(ownerLatestCaption)}
                      postSubmitStage={postSubmitStage}
                      getGoalTitle={getGoalTitle}
                      formatTaskTypeLabel={formatTaskTypeLabel}
                    />

                    <div className="mt-4 grid gap-3">
                      <div className="rounded-box border border-base-300/45 bg-base-100/55 px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.18em] text-secondary">
                          Feed status
                        </p>
                        <p className="mt-2 text-sm text-base-content/76">
                          {posts.length === 0
                            ? "No proof posted yet."
                            : `${posts.length} check-in${posts.length > 1 ? "s" : ""} logged and ${pendingReviewCount} waiting on feedback.`}
                        </p>
                      </div>
                      <div className="rounded-box border border-base-300/45 bg-base-100/55 px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.18em] text-secondary">
                          Momentum
                        </p>
                        <p className="mt-2 flex items-center gap-2 text-sm text-base-content/76">
                          <FlameIcon active={streakIsActive} className="h-4 w-4" />
                          <span>
                            {currentStreak > 0
                              ? `${currentStreak}-day posting rhythm`
                              : "First proof will start the board rhythm."}
                          </span>
                        </p>
                      </div>
                    </div>
                  </article>

                  <article className={`${theme.panelClass} rounded-[1.8rem] p-4 sm:p-6 text-left`}>
                    <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <p className="text-sm uppercase tracking-[0.22em] text-secondary">
                          What I've been up to...
                        </p>
                        <h2 className="brand-heading mt-2 text-3xl text-base-content">
                          Check-in feed
                        </h2>
                      </div>
                      <span className="badge badge-lg border-none bg-base-100/80 px-4 py-4">
                        {posts.length} total
                      </span>
                    </div>

                    {posts.length === 0 ? (
                      <div className="rounded-box border border-dashed border-base-300/45 bg-base-100/40 p-5 text-base-content/70">
                        No check-ins yet. The owner can start documenting progress here.
                      </div>
                    ) : (
                      <PostCard
                        post={posts[activeFeedIndex]}
                        comments={commentsByPost[posts[activeFeedIndex].id] ?? []}
                        postsLength={posts.length}
                        activeFeedIndex={activeFeedIndex}
                        onPrevious={() =>
                          setActiveFeedIndex((current) =>
                            current === 0 ? posts.length - 1 : current - 1
                          )
                        }
                        onNext={() =>
                          setActiveFeedIndex((current) =>
                            current === posts.length - 1 ? 0 : current + 1
                          )
                        }
                        themeCardClass={theme.cardClass}
                        getGoalTitle={getGoalTitle}
                        getAuthorLabel={getAuthorLabel}
                        formatDate={formatDate}
                        formatTaskTypeLabel={formatTaskTypeLabel}
                        getOrderedPostImages={getOrderedPostImages}
                        reviewDecisions={reviewDecisions}
                        onReviewDecisionChange={handleReviewDecisionChange}
                        commentDraft={commentDrafts[posts[activeFeedIndex].id] ?? ""}
                        onCommentDraftChange={handleCommentDraftChange}
                        onCommentSubmit={(event) => handleCommentSubmit(event, posts[activeFeedIndex].id)}
                        submittingCommentFor={submittingCommentFor}
                        extractReviewDecision={extractReviewDecision}
                        AvatarComponent={AvatarBadge}
                      />
                    )}
                  </article>
                </section>
              ) : null}

              {activeTab === "calendar" ? (
                <section className="grid gap-6">
                  <article className={`${theme.panelClass} rounded-[1.8rem] p-4 sm:p-6 text-left`}>
                    <div className="mb-5">
                      <p className="text-sm uppercase tracking-[0.22em] text-secondary">
                        Calendar
                      </p>
                      <h2 className="brand-heading mt-2 text-3xl text-base-content">
                        This week
                      </h2>
                      <p className="mt-2 text-sm text-base-content/70">
                        {boardCopy.weekNote}
                      </p>
                    </div>

                    <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
                      <div className="min-w-0 space-y-4">
                        <div className="w-full max-w-full overflow-x-auto overscroll-x-contain pb-2">
                          <div className="flex min-w-max gap-2 px-1 xl:grid xl:min-w-0 xl:grid-cols-7 xl:px-0">
                          {weekDayMeta.map((day, index) => {
                            const isActive = index === selectedDayIndex
                            const isToday = index === (now.getDay() === 0 ? 6 : now.getDay() - 1)
                            return (
                              <button
                                key={day.key}
                                type="button"
                                onClick={() => setSelectedDayIndex(index)}
                                className={`flex min-h-[10rem] min-w-[10.5rem] flex-col rounded-[1rem] border px-3 py-4 text-left transition xl:min-h-[15.5rem] xl:min-w-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                                  isActive
                                    ? "border-primary/55 bg-base-100 shadow-sm"
                                    : "border-base-300/45 bg-base-100/60 hover:bg-base-100/82"
                                }`}
                              >
                                <div className="flex min-h-[3.6rem] flex-col items-start gap-2">
                                  <p className="text-xs uppercase tracking-[0.16em] text-base-content/55">
                                    {day.short}
                                  </p>
                                  <span className={`badge badge-outline badge-xs whitespace-nowrap ${isToday ? "visible" : "invisible"}`}>
                                    Today
                                  </span>
                                </div>
                                <div className="mt-3 flex flex-1 flex-col">
                                  <p className="text-xl font-semibold text-base-content">
                                    {weekDayTaskCounts[index]}
                                  </p>
                                  <p className="mt-1 text-sm text-base-content/72 xl:min-h-[4.75rem]">
                                    {isActive ? "Selected day" : "View check-ins"}
                                  </p>
                                </div>
                              </button>
                            )
                          })}
                          </div>
                        </div>

                        <div className="rounded-[1.4rem] border border-base-300/45 bg-base-100/45 p-5">
                          <p className="text-xs uppercase tracking-[0.18em] text-secondary">
                            Week note
                          </p>
                          <p className="mt-3 text-base leading-7 text-base-content/78">
                            Daily routines repeat across the week. Longer-range goals rotate in as supporting focus instead of crowding every day card.
                          </p>
                        </div>
                      </div>

                        <div className="min-w-0 rounded-[1.4rem] border border-base-300/45 bg-base-100/55 p-4 sm:p-5">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <p className="text-sm uppercase tracking-[0.22em] text-secondary">
                                {selectedDay.long}
                              </p>
                              <h3 className="brand-heading mt-2 text-2xl text-base-content">
                                Tasks for the day
                              </h3>
                            </div>
                            <span className="badge badge-outline">
                              {selectedDayCompletionCount}/{selectedDayTasks.length} complete
                            </span>
                          </div>

                          <div className="mt-4 grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
                            <div className="rounded-[0.9rem] bg-base-100/85 px-3 py-3">
                              <p className="text-[11px] uppercase tracking-[0.18em] text-base-content/55">
                                Logged
                              </p>
                              <p className="mt-2 text-2xl font-semibold text-base-content">
                                {selectedDayTasks.length}
                              </p>
                            </div>
                            <div className="rounded-[0.9rem] bg-base-100/85 px-3 py-3">
                              <p className="text-[11px] uppercase tracking-[0.18em] text-base-content/55">
                                Completed
                              </p>
                              <p className="mt-2 text-2xl font-semibold text-base-content">
                                {selectedDayCompletionCount}
                              </p>
                            </div>
                            <div className="rounded-[0.9rem] bg-base-100/85 px-3 py-3">
                              <p className="text-[11px] uppercase tracking-[0.18em] text-base-content/55">
                                Awaiting review
                              </p>
                              <p className="mt-2 text-2xl font-semibold text-base-content">
                                {selectedDayTasks.filter(({ status }) => status.label === "Awaiting review").length}
                              </p>
                            </div>
                          </div>

                          <div className="mt-5 space-y-3">
                          {selectedDayTasks.length === 0 ? (
                            <div className="rounded-box border border-dashed border-base-300/45 bg-base-100/40 px-4 py-4 text-sm text-base-content/65">
                              No task check-ins were logged for this day.
                            </div>
                          ) : (
                            selectedDayTasks.map(({ task, status }) => (
                              <div
                                key={`${selectedDay.key}-${task.id}`}
                                className={`rounded-box border px-4 py-4 ${getStatusMeta(status.label).cardClass}`}
                              >
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                  <div>
                                    <p className="font-semibold text-base-content">{task.title}</p>
                                    {task.goal ? (
                                      <p className="mt-1 text-sm text-base-content/62">
                                        Goal: {getGoalTitle(task.goal)}
                                      </p>
                                    ) : null}
                                  </div>
                                  {isVerifiedStatusLabel(status.label) ? null : (
                                    <span className={`badge badge-sm ${status.tone}`}>{status.label}</span>
                                  )}
                                </div>
                                <p className="mt-2 text-sm text-base-content/68">
                                  Check-in logged for {selectedDay.long.toLowerCase()}.
                                </p>
                                <p className={`mt-2 text-xs uppercase tracking-[0.12em] ${isVerifiedStatusLabel(status.label) ? "text-base-content/66" : "text-base-content/50"}`}>
                                  {formatTaskTypeLabel(task.type)} • {status.detail}
                                </p>
                              </div>
                            ))
                          )}

                          <div className="rounded-box border border-base-300/45 bg-base-100/50 px-4 py-4">
                            <p className="text-xs uppercase tracking-[0.16em] text-secondary">
                              Longer-range focus
                            </p>
                            <p className="mt-2 font-semibold text-base-content">
                              {selectedLongRangeTask?.task.title || "No monthly or yearly focus queued"}
                            </p>
                            <p className="mt-2 text-sm text-base-content/70">
                              {selectedLongRangeTask
                                ? `${formatTaskTypeLabel(selectedLongRangeTask.task.type)} objective spotlight for ${selectedDay.long.toLowerCase()}.`
                                : "Add a monthly or yearly task to give the week a bigger target."}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </article>

                  <section className="grid gap-6 xl:grid-cols-2">
                    <article className={`${theme.panelClass} rounded-[1.6rem] p-4 sm:p-5 text-left`}>
                      <p className="text-sm uppercase tracking-[0.22em] text-secondary">
                        Upcoming
                      </p>
                      <h2 className="brand-heading mt-2 text-2xl text-base-content">
                        Next routines
                      </h2>
                      <div className="mt-4 space-y-3">
                        {thisWeekFocus.length === 0 ? (
                          <div className="rounded-box border border-dashed border-base-300/45 bg-base-100/40 px-4 py-4 text-sm text-base-content/65">
                            Add routines first to populate the schedule.
                          </div>
                        ) : (
                          thisWeekFocus.map((section) => (
                            <div
                              key={section.key}
                              className="rounded-box border border-base-300/45 bg-base-100/55 px-4 py-3"
                            >
                              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <span className="font-semibold text-base-content">{section.label}</span>
                                <span className="badge badge-outline">{section.count}</span>
                              </div>
                              <p className="mt-2 text-sm text-base-content/70">
                                {section.nextTask?.title || "No item queued"}
                              </p>
                            </div>
                          ))
                        )}
                      </div>
                    </article>

                    <article className={`${theme.panelClass} rounded-[1.6rem] p-4 sm:p-5 text-left`}>
                      <p className="text-sm uppercase tracking-[0.22em] text-secondary">
                        Schedule context
                      </p>
                      <div className="mt-4 space-y-3">
                        <div className="rounded-box bg-base-100/70 px-4 py-3">
                          <p className="text-xs uppercase tracking-[0.16em] text-secondary">
                            Latest check-in
                          </p>
                          <p className="mt-2 text-sm text-base-content/75">
                            {latestPost
                              ? `${latestPost.task?.title || "Untitled task"} • ${getRelativeTimeLabel(latestPost.created_at)}`
                              : "No proof posted yet"}
                          </p>
                        </div>
                        <div className="rounded-box bg-base-100/70 px-4 py-3">
                          <p className="text-xs uppercase tracking-[0.16em] text-secondary">
                            Pending review
                          </p>
                          <p className="mt-2 text-sm text-base-content/75">
                            {pendingReviewCount === 0
                              ? "No check-ins waiting on comments"
                              : `${pendingReviewCount} post${pendingReviewCount > 1 ? "s" : ""} should be reviewed next`}
                          </p>
                        </div>
                        <div className="rounded-box bg-base-100/70 px-4 py-3">
                          <p className="text-xs uppercase tracking-[0.16em] text-secondary">
                            This month
                          </p>
                          <p className="mt-2 text-sm text-base-content/75">
                            {totalDailyCheckins > 0
                              ? `${totalDailyCheckins} total daily proof entr${totalDailyCheckins === 1 ? "y" : "ies"}`
                              : "No daily proof logged yet"}
                          </p>
                        </div>
                      </div>
                    </article>
                  </section>
                </section>
              ) : null}
            </section>
          ) : null}
        </div>
      </section>
    </main>
  )
}
