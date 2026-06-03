import { createContext, useContext, useState, useEffect } from "react";
import { clearAuthSession, getAccessToken, getRefreshToken, saveAuthSession } from "../utils/authStorage";
import { getMeRequest } from "../services/authApi";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [session, setSession] = useState(null);
    const [isBootstrapping, setIsBootstrapping] = useState(true);

    const isAuthenticated = Boolean(user && session);

    const login = ({ access, refresh, user }) => {
        saveAuthSession({ access, refresh, user });
        setSession({ access, refresh });
        setUser(user);
    };

    const logout = () => {
        clearAuthSession();
        setSession(null);
        setUser(null);
    };

    const refreshSession = async () => {
        const access = getAccessToken();
        const refresh = getRefreshToken();
        if (!access || !refresh) {
            logout();
            return;
        }

        const userData = await getMeRequest(access);
        saveAuthSession({ access, refresh, user: userData });
        setSession({ access, refresh });
        setUser(userData);
    };
    useEffect(() => {
        const bootstrapAuth = async () => {
            try {
                await refreshSession();
            } catch (error) {
                console.error("Error during auth bootstrap:", error);
                logout();
            } finally {
                setIsBootstrapping(false);
            }
        };
        bootstrapAuth();
    }, []);

    return (
        <AuthContext.Provider value={{ user, session, isAuthenticated, login, logout, refreshSession, isBootstrapping }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}