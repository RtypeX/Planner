import { useState } from 'react'
import { AppDataProvider } from './lib/AppData'
import Layout from './components/Layout'
import ArbitrageModule from './modules/arbitrage/ArbitrageModule'
import FitnessModule from './modules/fitness/FitnessModule'
import TimelineModule from './modules/timeline/TimelineModule'
import FinanceModule from './modules/finance/FinanceModule'

export default function App() {
  const [activeTab, setActiveTab] = useState('arbitrage')

  return (
    <AppDataProvider>
      <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
        {activeTab === 'arbitrage' && <ArbitrageModule />}
        {activeTab === 'fitness' && <FitnessModule />}
        {activeTab === 'timeline' && <TimelineModule />}
        {activeTab === 'finance' && <FinanceModule />}
      </Layout>
    </AppDataProvider>
  )
}
