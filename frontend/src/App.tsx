import { useEffect } from 'react'
import { MainLayout } from '@/layout/MainLayout'
import { HomePage } from '@/pages/HomePage'
import { useAppStore } from '@/store/useAppStore'
import { SAMPLE_NEWS } from '@/mocks/news'
import { SAMPLE_RESEARCH } from '@/mocks/research'
import { SAMPLE_COMPANIES } from '@/mocks/companies'

// Moved sample data into mocks/

function App() {
  const { setNewsItems, setResearchItems, setCompanyItems } = useAppStore()

  useEffect(() => {
    // Initialize the app with sample news data
    setNewsItems(SAMPLE_NEWS)
    setResearchItems(SAMPLE_RESEARCH)
    setCompanyItems(SAMPLE_COMPANIES)
  }, [setNewsItems, setResearchItems, setCompanyItems])

  return (
    <MainLayout>
      <HomePage />
    </MainLayout>
  )
}

export default App
