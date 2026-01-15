import { useEffect, useRef, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { getToken, removeAuth } from "../utils/auth";

const PrivateRoutes = () => {
  const initialTokenRef = useRef(getToken());
  const [token, setToken] = useState(initialTokenRef.current);
  const [isInvalid, setIsInvalid] = useState(false);

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

  //Token missing / deleted / edited
  if (!token || isInvalid) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default PrivateRoutes;
