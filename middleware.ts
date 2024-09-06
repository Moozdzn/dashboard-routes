import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const localIps = ['127.0.0.1', '::1', '::ffff:127.0.0.1']

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
    const svTag = request.headers.get('server-tag')

    if (!localIps.includes(request.headers.get("x-forwarded-for"))) {
		return NextResponse.json({ code: 403, message: "Forbidden" });
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