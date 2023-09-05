import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
 
// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
    const userAgent = request.headers.get('user-agent')
    const secretToken = request.headers.get('secret-token')
    const svTag = request.headers.get('server-tag')

    console.log('user agent', userAgent)
    console.log('secret token', secretToken)
    if (!secretToken) {
        console.log('no secret token')
        return NextResponse.json({code: 401, message:'Unauthorized'})
    }

    if (secretToken !== process.env.SECRET_TOKEN) {
        console.log('wrong secret token')
        return NextResponse.json({code: 403, message:'Forbidden'})
    }
    // pass the svtag to the response
    return NextResponse.next({
        headers: {
            'server-tag': svTag
        }
    })

    //return NextResponse.next()
}
 
// See "Matching Paths" below to learn more
export const config = {
  matcher: ['/api/society/:path*', '/api/logs/:path*'],
}