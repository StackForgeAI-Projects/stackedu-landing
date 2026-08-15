import { createFileRoute } from '@tanstack/react-router'
import { Building2 } from 'lucide-react'
import { AccountProfileView } from '@/components/account/AccountProfileView'
import { IctShell } from '@/components/IctShell'
import { useQuery } from '@tanstack/react-query'
import { accountProfileQueryKey, getAccountProfile } from '@/lib/api/account'

export const Route = createFileRoute('/_auth/ict/profile')({
  component: IctProfilePage,
})

function IctProfilePage() {
  const { data } = useQuery({ queryKey: accountProfileQueryKey, queryFn: getAccountProfile })

  return (
    <IctShell pageTitle="My Profile">
      <AccountProfileView
        breadcrumb="ICT Manager"
        subtitle={`ICT Manager · ${data?.institutionName ?? 'Institution'}`}
        extraFields={[
          { icon: Building2, label: 'Institution', value: data?.institutionName ?? '—' },
        ]}
      />
    </IctShell>
  )
}
