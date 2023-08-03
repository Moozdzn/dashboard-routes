import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
 
// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
    const userAgent = request.headers.get('user-agent')
    const secretToken = request.headers.get('secret-token')

    console.log('user agent', userAgent)
    console.log('secret token', secretToken)
    //if secret token is not present, return 401
    if (!secretToken) {
        console.log('no secret token')
        return NextResponse.json({code: 401, message:'Unauthorized'})
    }

    //if secret token is not correct, return 403
    if (secretToken !== process.env.SECRET_TOKEN) {
        console.log('wrong secret token')
        return NextResponse.json({code: 403, message:'Forbidden'})
    }

    return NextResponse.next()
}
 
// See "Matching Paths" below to learn more
export const config = {
  matcher: ['/api/society/:path*', '/api/logs/:path*'],
}