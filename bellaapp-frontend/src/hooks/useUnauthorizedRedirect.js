import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { clearSession } from "../services/api";

export default function useUnauthorizedRedirect() {
  const navigate = useNavigate();

  return useCallback(() => {
    clearSession();
    navigate("/login", { replace: true });
  }, [navigate]);
}
