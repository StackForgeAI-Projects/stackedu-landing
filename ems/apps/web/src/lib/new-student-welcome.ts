const NEW_STUDENT_WELCOME_KEY = 'stackedu:new-student-welcome'

/** Prevents duplicate modals when React StrictMode remounts. */
let welcomeShownThisPageLoad = false

export function rememberNewStudentWelcome(studentNumber: string): void {
  sessionStorage.setItem(NEW_STUDENT_WELCOME_KEY, studentNumber)
}

export function showNewStudentWelcomeIfPresent(onWelcome: (studentNumber: string) => void): void {
  if (welcomeShownThisPageLoad) return
  const studentNumber = sessionStorage.getItem(NEW_STUDENT_WELCOME_KEY)
  if (!studentNumber) return
  welcomeShownThisPageLoad = true
  sessionStorage.removeItem(NEW_STUDENT_WELCOME_KEY)
  onWelcome(studentNumber)
}
