import { useEffect } from "react";
import { useLocation } from "wouter";

export function useAdminToken() {
  return localStorage.getItem("slv_admin_token");
}

export function useRequireAdmin() {
  const [, navigate] = useLocation();
  const token = useAdminToken();
  useEffect(() => {
    if (!token) navigate("/nirobff360adminp");
  }, [token, navigate]);
  return token;
}

export function adminFetch(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem("slv_admin_token");
  return fetch(path, {
    ...options,
    headers: {
      ...(options.headers ?? {}),
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
}
