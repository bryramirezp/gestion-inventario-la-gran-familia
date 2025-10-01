import { NextRequest, NextResponse } from 'next/server';
import { authenticate, signToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    console.log('Login attempt:', email); // <--- log de email

    if (!email || !password) {
      return NextResponse.json({ error: 'Email y contraseña son requeridos' }, { status: 400 });
    }

    const user = await authenticate({ email, password });
    console.log('Authenticated user:', user); // <--- log del usuario

    if (!user) {
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 });
    }

    const token = await signToken({ userId: user.id });
    console.log('Token generated:', token); // <--- log del token

    const response = NextResponse.json({ user });
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 86400,
    });

    return response;
  } catch (error: any) {
    console.error('ERROR LOGIN:', error); // <--- log completo del error
    return NextResponse.json({ error: error.message || 'Error interno del servidor' }, { status: 500 });
  }
}
