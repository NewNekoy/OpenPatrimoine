import { useState, useEffect } from 'react'
import i18n from './i18n'
import { useSettings } from './hooks/useSettings'
import Sidebar from './components/Sidebar'
import { ModalRoot } from './components/modals/ModalRoot'
import DashboardPage from './pages/DashboardPage'
import PropertiesPage from './pages/PropertiesPage'
import TenantsPage from './pages/TenantsPage'
import RentsPage from './pages/RentsPage'
import AccountingPage from './pages/AccountingPage'
import TrackingPage from './pages/TrackingPage'
import SettingsPage from './pages/SettingsPage'

export type Page =
  | 'dashboard'
  | 'properties'
  | 'tenants'
  | 'rents'
  | 'accounting'
  | 'tracking'
  | 'settings'

const pages: Record<Page, React.ReactNode> = {
  dashboard: <DashboardPage />,
  properties: <PropertiesPage />,
  tenants: <TenantsPage />,
  rents: <RentsPage />,
  accounting: <AccountingPage />,
  tracking: <TrackingPage />,
  settings: <SettingsPage />
}

function App(): React.JSX.Element {
  const [activePage, setActivePage] = useState<Page>('dashboard')
  const { data: settings } = useSettings()

  useEffect(() => {
    if (settings?.language) i18n.changeLanguage(settings.language)
  }, [settings?.language])

  return (
    <div className="flex h-full w-full bg-[#0a0a10] text-white antialiased">
      <Sidebar activePage={activePage} onNavigate={setActivePage} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {pages[activePage]}
      </div>
      <ModalRoot />
    </div>
  )
}

export default App
