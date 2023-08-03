import useSWR from 'swr'
import SocietyComponent from '../components/Society'
import type { Society } from '../interfaces'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function Index() {
  const { data, error, isLoading } = useSWR<Society[]>('/api/society', fetcher)

  if (error) return <div>Failed to load</div>
  if (isLoading) return <div>Loading...</div>
  if (!data) return null

  return (
    <div>
      Why are you here
    </div>
  )
}
