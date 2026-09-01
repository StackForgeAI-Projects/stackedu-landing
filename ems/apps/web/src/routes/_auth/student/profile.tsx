import { createFileRoute } from '@tanstack/react-router'
import { Building2, GraduationCap, IdCard } from 'lucide-react'
import { AccountProfileView } from '@/components/account/AccountProfileView'
import { StudentShell } from '@/components/StudentShell'
import { useQuery } from '@tanstack/react-query'
import { accountProfileQueryKey, getAccountProfile } from '@/lib/api/account'

export const Route = createFileRoute('/_auth/student/profile')({
  component: StudentProfilePage,
})

function StudentProfilePage() {
  const { data } = useQuery({ queryKey: accountProfileQueryKey, queryFn: getAccountProfile })

  return (
    <StudentShell pageTitle="My Profile">
      <AccountProfileView
        breadcrumb="Student"
        lockIdentityFields
        subtitle={data?.programmeName ? `${data.programmeName}${data.yearOfStudy ? ` · Year ${data.yearOfStudy}` : ''}` : 'Student'}
        extraFields={[
          { icon: IdCard, label: 'Student ID', value: data?.studentNumber ?? '—', mono: true },
          { icon: GraduationCap, label: 'Programme', value: data?.programmeName ?? '—' },
          { icon: Building2, label: 'Faculty', value: data?.facultyName ?? '—' },
        ]}
      />
    </StudentShell>
  )
}
