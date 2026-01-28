import { useEffect, useRef, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { getToken, removeAuth } from "../utils/auth";
import SplashScreen from "../pages/public/SplashScreen";

const PrivateRoutes = () => {
  const initialTokenRef = useRef(getToken());
  const [token, setToken] = useState(initialTokenRef.current);
  const [isInvalid, setIsInvalid] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkToken = () => {
      const currentToken = getToken();
      if (!currentToken || currentToken !== initialTokenRef.current) {
        removeAuth();
        setToken(null);
        setIsInvalid(true);
      }
    };

    checkToken();
    setChecking(false);
    const intervalId = setInterval(checkToken, 1000);
    const onStorage = (event) => {
      if (event.key === "token") {
        checkToken();
      }
    };

    window.addEventListener("storage", onStorage);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  if (checking) {
    return <SplashScreen label="Checking session..." />;
  }

  if (!token || isInvalid) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default PrivateRoutes;
