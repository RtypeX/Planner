import { useState } from 'react'
import { AppDataProvider, useAppData } from './lib/AppData'
import Layout from './components/Layout'
import Toast from './components/ui/Toast'
import ArbitrageModule from './modules/arbitrage/ArbitrageModule'
import FitnessModule from './modules/fitness/FitnessModule'
import TimelineModule from './modules/timeline/TimelineModule'
import FinanceModule from './modules/finance/FinanceModule'

export default function App() {
  return (
    <AppDataProvider>
      <Shell />
    </AppDataProvider>
  )
}

function Shell() {
  const [activeTab, setActiveTab] = useState('arbitrage')
  const { toast, showToast } = useAppData()

  return (
    <>
      <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
        {activeTab === 'arbitrage' && <ArbitrageModule />}
        {activeTab === 'fitness' && <FitnessModule />}
        {activeTab === 'timeline' && <TimelineModule />}
        {activeTab === 'finance' && <FinanceModule />}
      </Layout>
      <Toast toast={toast} onClose={() => showToast(null)} />
    </>
  )
}
