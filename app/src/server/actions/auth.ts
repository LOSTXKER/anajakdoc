"use server";

import { createClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";
import { loginSchema, registerSchema } from "@/lib/validations/auth";
import { redirect } from "next/navigation";

type AuthState = { error: string | null; success: boolean };

export async function login(_prevState: AuthState, formData: FormData): Promise<AuthState> {
  const rawData = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const result = loginSchema.safeParse(rawData);
  if (!result.success) {
    return {
      success: false,
      error: result.error.issues[0].message,
    };
  }

  const supabase = await createClient();
  
  const { error } = await supabase.auth.signInWithPassword({
    email: result.data.email,
    password: result.data.password,
  });

  if (error) {
    return {
      success: false,
      error: error.message === "Invalid login credentials" 
        ? "อีเมลหรือรหัสผ่านไม่ถูกต้อง" 
        : error.message,
    };
  }

  return { success: true, error: null };
}

export async function register(_prevState: AuthState, formData: FormData): Promise<AuthState> {
  const rawData = {
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    confirmPassword: formData.get("confirmPassword") as string,
  };

  const result = registerSchema.safeParse(rawData);
  if (!result.success) {
    return {
      success: false,
      error: result.error.issues[0].message,
    };
  }

  const supabase = await createClient();

  // Check if email already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: result.data.email },
  });

  if (existingUser) {
    return {
      success: false,
      error: "อีเมลนี้ถูกใช้งานแล้ว",
    };
  }

  // Create Supabase user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: result.data.email,
    password: result.data.password,
    options: {
      data: {
        name: result.data.name,
      },
    },
  });

  if (authError) {
    return {
      success: false,
      error: authError.message,
    };
  }

  if (!authData.user) {
    return {
      success: false,
      error: "ไม่สามารถสร้างบัญชีได้",
    };
  }

  // Create user in database
  await prisma.user.create({
    data: {
      email: result.data.email,
      name: result.data.name,
      supabaseId: authData.user.id,
    },
  });

  return { success: true, error: null };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
