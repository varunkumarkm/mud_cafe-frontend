import { useAuthStore } from "../store/authStore";
import { useNavigate } from "react-router-dom";

export const useAuth = () => {
    const { user, token, login, logout } = useAuthStore();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    const isOwner = user?.role === "OWNER";
    const isManager = user?.role === "MANAGER";
    const isWaiter = user?.role === "WAITER";
    const isOwnerOrManager = isOwner || isManager;

    return {
        user,
        token,
        login,
        logout: handleLogout,
        isOwner,
        isManager,
        isWaiter,
        isOwnerOrManager,
    };
};