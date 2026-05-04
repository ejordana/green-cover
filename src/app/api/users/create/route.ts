import { NextRequest, NextResponse } from 'next/server';
import { createUserWithAuth } from '@/lib/auth-server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, role, userData } = body;

    if (!email || !password || !role) {
      return NextResponse.json(
        { error: 'Missing required fields: email, password, role' },
        { status: 400 }
      );
    }

    if (!['manager', 'expert', 'client', 'admin'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }

    // Create auth user
    const authResult = await createUserWithAuth(email, password, role, userData);

    if (authResult.error) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.statusCode || 400 }
      );
    }

    const authId = authResult.authId;

    // Insert user record with auth_id
    let response;

    switch (role) {
      case 'manager':
        response = await supabase
          .from('managers')
          .insert({
            auth_id: authId,
            name: userData.name,
            email,
            phone: userData.phone || '',
            available: userData.available !== false,
          })
          .select()
          .single();
        break;

      case 'expert':
        response = await supabase
          .from('experts')
          .insert({
            auth_id: authId,
            name: userData.name,
            email,
            phone: userData.phone || '',
            specialty: userData.specialty || '',
            zone: userData.zone || '',
          })
          .select()
          .single();
        break;

      case 'client':
        response = await supabase
          .from('clients')
          .insert({
            auth_id: authId,
            name: userData.name,
            email,
            phone: userData.phone || '',
            policy_number: userData.policyNumber || '',
            status: userData.status || 'Actiu',
          })
          .select()
          .single();
        break;

      case 'admin':
        response = await supabase
          .from('admins')
          .insert({
            auth_id: authId,
            name: userData.name,
            email,
            phone: userData.phone || '',
            active: userData.active !== false,
          })
          .select()
          .single();
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid role' },
          { status: 400 }
        );
    }

    if (response.error) {
      return NextResponse.json(
        { error: response.error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      user: response.data,
      authId,
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
