import Link from 'next/link'
import { Society } from '../interfaces'

type SocietyProps = {
  society: Society
}

export default function SocietyComponent({ society }: SocietyProps) {
  return (
    <li>
      <Link href="/society/[name]" as={`/society/${society.name}`}>
        {society.name}
      </Link>
    </li>
  )
}
