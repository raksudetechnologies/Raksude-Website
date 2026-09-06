import { listTasks, listSubmissions, submitTask, getDomain } from './database.js';
import { calcInternship, weekUnlockDay, addDays, INTERNSHIP } from './utils.js';

export const GITHUB_RE = /^https?:\/\/(www\.)?github\.com\/[\w.-]+\/[\w.-]+/i;

// Builds the task board for a student, respecting the domain's configured week count (1–4).
// Week N unlocks on day (N-1)*7+1 of the student's OWN window (no batches).
export async function getStudentWeeks(student) {
  // Fetch domain to get duration (days) and configured number of weeks (1–4)
  let domainDays = Number(student.duration) || 30;
  let totalWeeks = Math.max(1, Math.min(4, Math.ceil(domainDays / 7)));
  try {
    if (student.domainId) {
      const domain = await getDomain(student.domainId);
      if (domain) {
        if (domain.duration && Number(domain.duration) >= 1) {
          domainDays = Number(domain.duration);
          totalWeeks = Math.max(1, Math.min(4, Math.ceil(domainDays / 7)));
        }
        if (domain.weeks && Number(domain.weeks) >= 1) {
          totalWeeks = Math.min(4, Math.max(1, Number(domain.weeks)));
        }
      }
    }
  } catch (e) {
    console.warn('Could not fetch domain settings for tasks:', e.message);
  }

  const timeline = calcInternship(student.startDate, domainDays);

  const [tasks, subs] = await Promise.all([
    listTasks({ domainId: student.domainId }),
    listSubmissions({ studentId: student.studentId })
  ]);
  const byTask = Object.fromEntries(subs.map((s) => [s.taskId, s]));

  const weekNumbers = Array.from({ length: totalWeeks }, (_, i) => i + 1);
  const weeks = weekNumbers.map((w) => {
    const unlockDay = weekUnlockDay(w);
    const unlocked = timeline.status === INTERNSHIP.COMPLETED || timeline.currentDay >= unlockDay;
    return {
      week: w,
      unlockDay,
      unlocked,
      unlocksOn: addDays(student.startDate, unlockDay - 1),
      tasks: tasks
        .filter((t) => Number(t.week) === w)
        .map((t) => ({ ...t, submission: byTask[t.id] || null }))
    };
  });
  return { timeline, weeks, totalWeeks };
}

export const submitTaskSubmission = (data) => submitTask(data);
